import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ShoppingBag, ExternalLink, User, Mail, Phone, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customer Accounts</h2>
          <p className="text-xs text-muted-foreground">
            View registered customers, account details, and all associated order histories.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="w-64 pl-8"
            placeholder="Search name, email, phone, ID"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card shadow-2xs">
        <ul className="divide-y">
          {rows.map((r) => {
            const isOpen = open === r.id;

            return (
              <li key={r.id} className="p-4 transition-colors hover:bg-muted/10">
                <button
                  type="button"
                  className="flex w-full flex-wrap items-center justify-between gap-4 text-left"
                  onClick={() => setOpen(isOpen ? null : r.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {(r.full_name || "C").slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm truncate">{r.full_name}</span>
                        {r.admin && (
                          <span className="rounded bg-primary px-1.5 py-0.2 text-[10px] font-semibold text-primary-foreground">
                            Admin
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                          ID: {r.id.slice(0, 8)}...
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                        <span className="inline-flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {r.email || "—"}
                        </span>
                        {r.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {r.phone}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Joined {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-sm text-foreground">
                          {r.orders.length} {r.orders.length === 1 ? "order" : "orders"}
                        </span>
                      </div>
                      <span className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatNPR(r.spent)} spent
                      </span>
                    </div>

                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Customer Order History */}
                {isOpen && (
                  <div className="mt-4 rounded-lg border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase border-b pb-2">
                      <span>Order History ({r.orders.length})</span>
                      <span>Customer ID: {r.id}</span>
                    </div>

                    {r.orders.length > 0 ? (
                      <ul className="divide-y divide-border/60">
                        {r.orders.map((o: any) => (
                          <li key={o.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                            <div>
                              <div className="flex items-center gap-2">
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

                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-foreground text-sm">
                                {formatNPR(o.total)}
                              </span>
                              <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
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