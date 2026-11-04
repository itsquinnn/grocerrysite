import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { formatBsDate } from "@/lib/bikramSambat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ExternalLink, User, Mail, Phone, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function AdminCustomersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-56 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <Skeleton className="h-10 w-64 rounded-md" />
      </div>

      <div className="rounded-xl border bg-card shadow-2xs divide-y">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-36 rounded" />
                  <Skeleton className="h-3 w-24 rounded" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-16 ml-auto rounded" />
                <Skeleton className="h-3 w-20 ml-auto rounded" />
              </div>
              <Skeleton className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Customers() {
  const { isNepali, formatStatus, translateProduct } = useI18n();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      let profiles: any[] = [];

      // 1. Fetch Users / Accounts (Backend API with service role bypasses RLS)
      try {
        const res = await api.get<any>("/admin/users");
        const list = res?.users ?? (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
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

      // Fallback: direct Supabase query
      if (profiles.length === 0) {
        try {
          const { data: accs } = await supabase.from("accounts").select("*").order("created_at", { ascending: false });
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

      // 2. Fetch All Orders (Backend API with service role)
      let ordersRaw: any[] = [];
      try {
        const resOrd = await api.get<{ orders: any[] }>("/admin/orders?limit=100");
        if (resOrd?.orders && Array.isArray(resOrd.orders) && resOrd.orders.length > 0) {
          ordersRaw = resOrd.orders;
        }
      } catch (err) {
        console.warn("[AdminCustomers] /admin/orders API notice:", err);
      }

      // Fallback: direct Supabase orders query
      if (ordersRaw.length === 0) {
        try {
          const { data: ords } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
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
          items_count: Array.isArray(o.order_items) ? o.order_items.length : (Array.isArray(o.items) ? o.items.length : 1),
        };
      });

      return { profiles, orders };
    },
  });

  if (isLoading || !data) {
    return <AdminCustomersSkeleton />;
  }

  const rows = data.profiles
    .map((p: any) => {
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
    })
    .filter((r: any) => {
      const searchTarget = `${r.full_name} ${r.phone} ${r.email} ${r.id}`.toLowerCase();
      return !q || searchTarget.includes(q.toLowerCase().trim());
    });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Top Header & Search ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span>{isNepali ? "ग्राहक खाताहरू" : "Customer Accounts"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isNepali
              ? "दर्ता भएका ग्राहकहरू, खाताको विवरण र अर्डर इतिहास"
              : "View registered customers, account details, and all associated order histories"}
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-full pl-8 h-9 text-xs sm:text-sm"
            placeholder={isNepali ? "नाम, इमेल, फोन खोज्नुहोस्" : "Search name, email, phone, ID"}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        <ul className="divide-y divide-border/60">
          {rows.map((r) => {
            const isOpen = open === r.id;

            return (
              <li key={r.id} className="p-3.5 sm:p-4 transition-colors hover:bg-muted/10">
                <div
                  role="button"
                  tabIndex={0}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left cursor-pointer select-none"
                  onClick={() => setOpen(isOpen ? null : r.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpen(isOpen ? null : r.id);
                    }
                  }}
                >
                  {/* Left Section: Avatar & Customer Info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-sm shadow-2xs">
                      {(r.full_name || "C").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      {/* Name, Badges & ID */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-foreground text-sm truncate max-w-[180px] sm:max-w-none">
                          {r.full_name}
                        </span>
                        {r.admin && (
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase">
                            Admin
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded shrink-0">
                          ID: {r.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* Email, Phone & Date */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 truncate max-w-[220px] sm:max-w-[320px]">
                          <Mail className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{r.email || "—"}</span>
                        </span>
                        {r.phone && (
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Phone className="h-3 w-3 text-muted-foreground/70" />
                            <span>{r.phone}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground/80 shrink-0">
                          <Calendar className="h-3 w-3 text-muted-foreground/70" />
                          <span>Joined {new Date(r.created_at).toLocaleDateString()}</span>
                          <span className="hidden xs:inline text-muted-foreground/60">({formatBsDate(r.created_at, "short")})</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Orders Count, Spent & Expand Toggle */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-border/60">
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0.5">
                      <div className="flex items-center gap-1 text-xs font-semibold text-foreground bg-muted/40 sm:bg-transparent px-2 sm:px-0 py-0.5 sm:py-0 rounded">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{r.orders.length} {r.orders.length === 1 ? "order" : "orders"}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {formatNPR(r.spent)} spent
                      </span>
                    </div>

                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted transition shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Customer Order History */}
                {isOpen && (
                  <div className="mt-3 sm:mt-4 rounded-xl border bg-muted/20 p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase border-b pb-2">
                      <span>Order History ({r.orders.length})</span>
                      <span className="font-mono text-[10px]">ID: {r.id.slice(0, 8)}</span>
                    </div>

                    {r.orders.length > 0 ? (
                      <ul className="divide-y divide-border/60">
                        {r.orders.map((o: any) => (
                          <li key={o.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 text-sm">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-foreground text-xs">{o.order_number}</span>
                                <span
                                  className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                                    (o.status || "").toLowerCase() === "delivered"
                                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                      : (o.status || "").toLowerCase() === "cancelled"
                                      ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                  }`}
                                >
                                  {statusLabel(o.status)}
                                </span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(o.created_at).toLocaleDateString()} · {o.items_count} item(s) · {o.payment_method}
                              </span>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-1 sm:pt-0">
                              <span className="font-bold text-foreground text-sm">
                                {formatNPR(o.total)}
                              </span>
                              <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1 border sm:border-0">
                                <Link to="/admin/orders">
                                  <span>Manage</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-4 text-center text-xs text-muted-foreground">
                        This customer has not placed any orders yet.
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}

          {rows.length === 0 && (
            <li className="p-8 text-center text-muted-foreground text-sm">
              No customer accounts found matching "{q}".
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}