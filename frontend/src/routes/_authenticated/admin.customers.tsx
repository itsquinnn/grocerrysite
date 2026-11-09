import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { formatBsDate } from "@/lib/bikramSambat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ShoppingBag,
  ExternalLink,
  User,
  Mail,
  Phone,
  Calendar,
  ChevronDown,
  ChevronUp,
  Shield,
  CreditCard,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: Customers,
  pendingComponent: AdminCustomersSkeleton,
});

export function AdminCustomersSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-9 w-64 rounded-md" />
      </div>

      <div className="py-2.5 px-3 border-y border-border/80 flex items-center gap-4">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-36 rounded" />
      </div>

      <div className="border-b border-border/80 divide-y divide-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-4 px-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-3 w-48 rounded" />
              </div>
            </div>
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Customers() {
  const { isNepali, formatStatus } = useI18n();
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customers" | "admins">("all");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      let profiles: any[] = [];

      try {
        const res = await api.get<any>("/admin/users");
        const list = res?.users ?? (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          profiles = list.map((u: any) => ({
            ...u,
            id: u.id ?? u.account_id ?? u.user_id,
            full_name: u.name ?? u.full_name ?? u.email?.split("@")[0] ?? "Customer",
            phone: u.phone ?? "",
            email: u.email ?? "",
            role: u.role ?? "customer",
            created_at: u.created_at ?? new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[AdminCustomers] /admin/users API notice:", err);
      }

      // Supabase direct fallback
      if (profiles.length === 0) {
        try {
          const { data: accs } = await supabase
            .from("accounts")
            .select("*")
            .order("created_at", { ascending: false });
          if (accs && accs.length > 0) {
            profiles = accs.map((a: any) => ({
              ...a,
              id: a.id,
              full_name: a.name ?? a.email?.split("@")[0] ?? "Customer",
              phone: a.phone ?? "",
              email: a.email ?? "",
              role: a.role ?? "customer",
              created_at: a.created_at ?? new Date().toISOString(),
            }));
          }
        } catch {}
      }

      // Orders
      let ordersRaw: any[] = [];
      try {
        const resOrd = await api.get<{ orders: any[] }>("/admin/orders?limit=150");
        if (resOrd?.orders && Array.isArray(resOrd.orders) && resOrd.orders.length > 0) {
          ordersRaw = resOrd.orders;
        }
      } catch (err) {
        console.warn("[AdminCustomers] /admin/orders API notice:", err);
      }

      if (ordersRaw.length === 0) {
        try {
          const { data: ords } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false });
          if (ords && ords.length > 0) {
            ordersRaw = ords;
          }
        } catch {}
      }

      const orders = ordersRaw.map((o: any) => {
        const addr = (o.address_snapshot || o.shipping_address || {}) as Record<string, any>;
        return {
          ...o,
          id: o.id,
          user_id: o.account_id ?? o.user_id,
          account_id: o.account_id ?? o.user_id,
          order_number: o.order_number ?? `DOV-${o.id.slice(0, 8).toUpperCase()}`,
          total: o.total ?? (o.total_paise ? o.total_paise / 100 : 0),
          status: o.status ?? "Pending",
          customer_email: o.customer_email ?? (o.accounts as any)?.email ?? "",
          customer_phone: o.customer_phone ?? addr.phone ?? (o.accounts as any)?.phone ?? "",
          items_count: Array.isArray(o.order_items)
            ? o.order_items.length
            : Array.isArray(o.items)
            ? o.items.length
            : 1,
        };
      });

      return { profiles, orders };
    },
  });

  const processedRows = useMemo(() => {
    if (!data) return [];
    return data.profiles.map((p: any) => {
      const os = data.orders.filter(
        (o: any) =>
          o.user_id === p.id ||
          o.account_id === p.id ||
          (p.email && o.customer_email && o.customer_email.toLowerCase() === p.email.toLowerCase())
      );

      const spent = os
        .filter((o: any) => (o.status || "").toLowerCase() !== "cancelled")
        .reduce((s: number, o: any) => s + Number(o.total || 0), 0);

      return {
        ...p,
        orders: os,
        spent,
        admin: p.role === "admin",
      };
    });
  }, [data]);

  // Registry Telemetry
  const telemetry = useMemo(() => {
    const total = processedRows.length;
    const activeBuyers = processedRows.filter((r) => r.orders.length > 0).length;
    const totalGmv = processedRows.reduce((acc, r) => acc + r.spent, 0);
    const admins = processedRows.filter((r) => r.admin).length;
    return { total, activeBuyers, totalGmv, admins };
  }, [processedRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return processedRows.filter((r) => {
      if (roleFilter === "admins" && !r.admin) return false;
      if (roleFilter === "customers" && r.admin) return false;

      if (!q.trim()) return true;
      const target = `${r.full_name} ${r.phone} ${r.email} ${r.id}`.toLowerCase();
      return target.includes(q.toLowerCase().trim());
    });
  }, [processedRows, roleFilter, q]);

  if (isLoading || !data) {
    return <AdminCustomersSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Console Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Customer Registry
            </h1>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground/80 font-bold">
              {telemetry.total} ACCOUNTS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Audit registered shopper profiles, contact verifications, and order histories across Nepal.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/50" />
            <Input
              className="w-full pl-8 h-9 text-xs bg-background"
              placeholder="Search name, email, phone, ID..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer text-foreground font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
        </div>
      </div>

      {/* ── Single-Line Telemetry Status Ribbon (No Boxy Cards) ─────────── */}
      <div className="py-2.5 px-3 border-y border-border/80 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs font-mono bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Total Accounts:
          </span>
          <span className="font-bold text-foreground">{telemetry.total}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Active Buyers:
          </span>
          <span className="font-bold text-emerald-800">{telemetry.activeBuyers}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Combined GMV:
          </span>
          <span className="font-bold text-foreground">{formatNPR(telemetry.totalGmv)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Admin Accounts:
          </span>
          <span className="font-bold text-primary">{telemetry.admins}</span>
        </div>
      </div>

      {/* ── Filter Segment Bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 py-0.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={cn(
            "text-xs px-3 py-1 font-medium transition cursor-pointer border-b-2",
            roleFilter === "all"
              ? "border-foreground text-foreground font-bold"
              : "border-transparent text-foreground/60 hover:text-foreground"
          )}
        >
          All Users ({processedRows.length})
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("customers")}
          className={cn(
            "text-xs px-3 py-1 font-medium transition cursor-pointer border-b-2",
            roleFilter === "customers"
              ? "border-foreground text-foreground font-bold"
              : "border-transparent text-foreground/60 hover:text-foreground"
          )}
        >
          Shoppers ({processedRows.filter((r) => !r.admin).length})
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("admins")}
          className={cn(
            "text-xs px-3 py-1 font-medium transition cursor-pointer border-b-2",
            roleFilter === "admins"
              ? "border-foreground text-foreground font-bold"
              : "border-transparent text-foreground/60 hover:text-foreground"
          )}
        >
          System Admins ({processedRows.filter((r) => r.admin).length})
        </button>
      </div>

      {/* ── Edge-to-Edge Registry Ledger Table (Zero Box Cards) ─────────── */}
      <div className="border-b border-border/80 divide-y divide-border/60">
        {filteredRows.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground/60">
            No customer accounts found matching your query.
          </div>
        ) : (
          filteredRows.map((r) => {
            const isOpen = open === r.id;
            const regDate = new Date(r.created_at);

            return (
              <div key={r.id} className="transition-colors hover:bg-muted/15">
                {/* Master Row Strip */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  className="py-3 px-3 sm:px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full bg-muted border border-border/70 text-foreground font-bold text-xs grid place-items-center shrink-0">
                      {(r.full_name || "C").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                          {r.full_name}
                        </span>
                        {r.admin && (
                          <span className="rounded-sm bg-primary/15 border border-primary/30 px-1 text-[9.5px] font-bold text-primary uppercase">
                            Admin
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-foreground/50">
                          #{r.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-xs text-foreground/70">
                        {r.email && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3 text-foreground/40" />
                            {r.email}
                          </span>
                        )}
                        {r.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3 text-foreground/40" />
                            {r.phone}
                          </span>
                        )}
                        <span className="text-foreground/45 text-[11px]">
                          Joined {regDate.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 self-start md:self-center shrink-0 text-right">
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-foreground">
                        {formatNPR(r.spent)}
                      </div>
                      <div className="text-[10.5px] text-foreground/60 font-mono">
                        {r.orders.length} {r.orders.length === 1 ? "order" : "orders"}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 cursor-pointer text-foreground/50 hover:text-foreground"
                    >
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Expandable Order Ledger Drawer */}
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 bg-muted/20 border-t border-border/50">
                    <div className="py-2 flex items-center justify-between border-b border-border/50 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70 flex items-center gap-1.5">
                        <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                        Order History for {r.full_name}
                      </span>
                      <span className="text-[11px] text-foreground/55 font-mono">
                        {r.orders.length} Recorded Transactions
                      </span>
                    </div>

                    {r.orders.length === 0 ? (
                      <div className="py-4 text-center text-xs text-foreground/55 italic">
                        No orders recorded yet for this customer.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/40 text-xs">
                        {r.orders.map((o: any) => (
                          <div
                            key={o.id}
                            className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-foreground">
                                {o.order_number}
                              </span>
                              <span className="text-foreground/50">•</span>
                              <span className="text-foreground/70">
                                {new Date(o.created_at).toLocaleDateString()}
                              </span>
                              <span className="text-foreground/50">•</span>
                              <span className="text-foreground/70">
                                {o.items_count} item{o.items_count === 1 ? "" : "s"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-foreground">
                                {formatNPR(o.total)}
                              </span>
                              <span className="font-mono text-[10.5px] uppercase px-1.5 py-0.5 rounded bg-muted border border-border/60">
                                {o.status}
                              </span>
                              <Link
                                to="/admin/orders"
                                className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5"
                              >
                                View Order
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
