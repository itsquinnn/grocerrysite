import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ShoppingBag,
  MessageSquare,
  Star,
  Users,
  DollarSign,
  Clock,
  ArrowRight,
  Package,
  AlertTriangle,
  Mail,
  Phone,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="flex h-56 items-end justify-between gap-2 pt-6 px-2">
          {[40, 65, 30, 80, 55, 90, 70, 45, 85, 60, 95, 75, 50, 80].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton className="w-full rounded-t" style={{ height: `${h}%` }} />
              <Skeleton className="h-2.5 w-6 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="divide-y space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pt-3 flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-36 rounded" />
                  <Skeleton className="h-2.5 w-48 rounded" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-16 rounded ml-auto" />
                  <Skeleton className="h-3 w-10 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="divide-y space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pt-3 flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-20 rounded" />
                    <Skeleton className="h-3.5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-2.5 w-44 rounded" />
                </div>
                <Skeleton className="h-3 w-16 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "dashboard", "full"],
    staleTime: 60 * 1000, // Keep data fresh for 1 minute (instant navigation between admin tabs)
    gcTime: 5 * 60 * 1000, // Retain in memory for 5 minutes
    refetchOnWindowFocus: false, // Prevent laggy refetch loops on tab switching
    queryFn: async () => {
      // 1. Try single unified high-speed server endpoint (fetches everything in parallel on backend)
      try {
        const res = await api.get<{
          orders: any[];
          products: any[];
          customers: number;
          tickets: any[];
          reviews: any[];
        }>("/admin/dashboard");

        if (res && Array.isArray(res.orders)) {
          return res;
        }
      } catch (err) {
        console.warn("[Admin Dashboard] Unified endpoint fallback to parallel queries:", err);
      }

      // 2. High-speed parallel fallback (all queries run concurrently with Promise.allSettled)
      const [oRes, pRes, cRes, tRes, rRes] = await Promise.allSettled([
        api.get<{ orders: any[] }>("/admin/orders"),
        supabase.from("products").select("id, title, stock_quantity, price_paise, product_code, is_active").limit(100),
        api.get<{ users: any[] }>("/admin/users"),
        api.get<{ tickets: any[] }>("/tickets"),
        supabase.from("reviews").select("*, products(title)").order("created_at", { ascending: false }).limit(20),
      ]);

      const rawOrders = oRes.status === "fulfilled" && oRes.value?.orders ? oRes.value.orders : [];
      const rawProducts = pRes.status === "fulfilled" && pRes.value?.data ? pRes.value.data : [];
      const rawUsers = cRes.status === "fulfilled" && cRes.value?.users ? cRes.value.users : [];
      const rawTickets = tRes.status === "fulfilled" && tRes.value?.tickets ? tRes.value.tickets : [];
      const rawReviews = rRes.status === "fulfilled" && rRes.value?.data ? rRes.value.data : [];

      // Normalize Orders
      const orders = rawOrders.map((ord: any) => ({
        ...ord,
        order_number: ord.order_number ?? `DOV-${(ord.id || "").slice(0, 8).toUpperCase()}`,
        customer_name:
          ord.customer_name ??
          (ord.address_snapshot as any)?.full_name ??
          (ord.address_snapshot as any)?.name ??
          "Customer",
        customer_phone: ord.customer_phone ?? (ord.address_snapshot as any)?.phone ?? "",
        customer_email: ord.customer_email ?? "",
        destination:
          ord.destination_address ??
          (ord.address_snapshot as any)?.address ??
          "Kathmandu Valley",
        total: ord.total ?? (ord.total_paise ? ord.total_paise / 100 : 0),
        status: (ord.status ?? "pending").toLowerCase(),
        payment_method: ord.payment_method ?? "Cash on Delivery",
        payment_status: (ord.payment_status ?? "pending").toLowerCase(),
        created_at: ord.created_at ?? new Date().toISOString(),
      }));

      // Normalize Products
      const prods = rawProducts.map((prd: any) => ({
        id: prd.id,
        name: prd.title ?? "Product",
        stock: prd.stock_quantity ?? 0,
        slug: prd.product_code ?? prd.id,
      }));

      // Normalize Tickets
      const tickets = rawTickets.map((t: any) => {
        const isCallback =
          t.message?.toLowerCase().includes("callback") || t.subject?.toLowerCase().includes("callback");
        const phoneMatch = t.message?.match(/(\+?\d[\d -]{7,15}\d)/)?.[0];
        return {
          id: t.id,
          ticket_number: (t.ticket_number || (t.id || "").slice(0, 8)).toUpperCase(),
          subject: t.subject || "Customer Support Request",
          message: t.message || "",
          status: t.status || "Open",
          customer_name:
            t.customer_name ||
            (isCallback ? "Callback Request" : t.account_id ? "Customer" : "Guest Visitor"),
          customer_phone: t.customer_phone || (isCallback && phoneMatch ? phoneMatch : t.phone || ""),
          customer_email: t.customer_email || t.email || "",
          created_at: t.created_at || new Date().toISOString(),
        };
      });

      // Normalize Reviews
      const reviews = rawReviews.map((r: any) => ({
        id: r.id,
        product_name: r.products?.title ?? r.products?.name ?? "Grocery Item",
        author_name: r.author_name ?? "Verified Buyer",
        rating: Number(r.rating) || 5,
        review_text: r.review_text ?? r.comment ?? r.body ?? "No review text provided.",
        is_published: r.is_published ?? r.is_approved ?? true,
        created_at: r.created_at ?? new Date().toISOString(),
      }));

      return {
        orders,
        products: prods,
        customers: rawUsers.length,
        tickets,
        reviews,
      };
    },
  });

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  // Calculate Metrics
  const liveOrders = data.orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const revenue = liveOrders.reduce((s, o) => s + Number(o.total), 0);
  const pendingOrders = data.orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
  const openTickets = data.tickets.filter((t) => ["Open", "In Progress"].includes(t.status)).length;
  const avgRating =
    data.reviews.length > 0
      ? (data.reviews.reduce((acc, r) => acc + r.rating, 0) / data.reviews.length).toFixed(1)
      : "5.0";
  const lowStock = data.products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock);

  // Revenue chart for last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const chartData = days.map((d) => ({
    day: d.slice(5),
    revenue: liveOrders
      .filter((o) => o.created_at.slice(0, 10) === d)
      .reduce((s, o) => s + Number(o.total), 0),
  }));

  return (
    <div className="space-y-6">
      {/* ── Top Header & Sync Live Data ─────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <p className="text-xs text-muted-foreground">Real-time revenue, order fulfillment, customers, and inventory</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="gap-1.5 h-8 text-xs bg-card"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          {isFetching ? "Syncing..." : "Sync Live Data"}
        </Button>
      </div>

      {/* ── Top Metric Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        {/* Metric 1: Revenue */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{formatNPR(revenue)}</p>
          <span className="text-[11px] text-muted-foreground">{liveOrders.length} active orders</span>
        </div>

        {/* Metric 2: Orders */}
        <Link to="/admin/orders" className="rounded-xl border bg-card p-4 shadow-2xs transition hover:border-primary/50">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Orders</span>
            <ShoppingBag className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{data.orders.length}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3" /> {pendingOrders} pending
          </span>
        </Link>

        {/* Metric 3: Support Tickets */}
        <Link to="/admin/tickets" className="rounded-xl border bg-card p-4 shadow-2xs transition hover:border-accent">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets</span>
            <MessageSquare className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{data.tickets.length}</p>
          <span className={openTickets > 0 ? "text-[11px] font-semibold text-rose-600 dark:text-rose-400" : "text-[11px] text-muted-foreground"}>
            {openTickets > 0 ? `● ${openTickets} open inquiries` : "All resolved"}
          </span>
        </Link>

        {/* Metric 4: Reviews */}
        <Link to="/admin/reviews" className="rounded-xl border bg-card p-4 shadow-2xs transition hover:border-amber-500/50">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Reviews</span>
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{data.reviews.length}</p>
          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
            ★ {avgRating} avg rating
          </span>
        </Link>

        {/* Metric 5: Customers */}
        <Link to="/admin/customers" className="rounded-xl border bg-card p-4 shadow-2xs transition hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Customers</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{data.customers}</p>
          <span className="text-[11px] text-muted-foreground">Registered accounts</span>
        </Link>

        {/* Metric 6: Catalog Products */}
        <Link to="/admin/products" className="rounded-xl border bg-card p-4 shadow-2xs transition hover:border-foreground/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Products</span>
            <Package className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{data.products.length}</p>
          <span className={lowStock.length > 0 ? "text-[11px] font-semibold text-sale" : "text-[11px] text-muted-foreground"}>
            {lowStock.length > 0 ? `⚠ ${lowStock.length} low stock` : "Well stocked"}
          </span>
        </Link>
      </div>

      {/* ── Revenue Performance Chart ───────────────────────────────────── */}
      <div className="rounded-xl border bg-card p-5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-semibold text-base text-foreground">Revenue Performance</h2>
            <p className="text-xs text-muted-foreground">Last 14 days sales trajectory (NPR)</p>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            {formatNPR(revenue)} Total
          </span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
              <XAxis dataKey="day" fontSize={11} stroke="var(--muted-foreground)" />
              <YAxis fontSize={11} stroke="var(--muted-foreground)" tickFormatter={(v: number) => `Rs ${v}`} />
              <Tooltip formatter={(v: number) => [formatNPR(v), "Revenue"]} />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two Column Layout: Orders & Support Tickets ─────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SECTION 1: Recent Orders */}
        <div className="flex flex-col rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-base text-foreground">Recent Orders</h2>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                {data.orders.length}
              </span>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>Manage orders</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-sm flex-1">
            {data.orders.slice(0, 6).map((o) => (
              <div key={o.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{o.order_number}</span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                        o.status === "delivered"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : o.status === "cancelled"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {o.customer_name} {o.customer_phone ? `· ${o.customer_phone}` : ""}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{o.destination}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-sm text-foreground">{formatNPR(o.total)}</span>
                  <span className="block text-[11px] text-muted-foreground capitalize">
                    {o.payment_method === "Cash on Delivery" ? "COD" : o.payment_method}
                  </span>
                </div>
              </div>
            ))}

            {data.orders.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No customer orders placed yet.</div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Link to="/admin/orders">
                <ShoppingBag className="h-3.5 w-3.5" /> View all orders & fulfillment
              </Link>
            </Button>
          </div>
        </div>

        {/* SECTION 2: Support Tickets */}
        <div className="flex flex-col rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="font-semibold text-base text-foreground">Support Tickets</h2>
              {openTickets > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {openTickets} open
                </span>
              )}
            </div>
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>Manage tickets</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-sm flex-1">
            {data.tickets.slice(0, 6).map((t) => (
              <div key={t.id} className="py-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-semibold text-primary">#{t.ticket_number}</span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase ${
                        t.status === "Open"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : t.status === "In Progress"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <p className="mt-1 font-medium text-xs text-foreground truncate">{t.subject}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {t.customer_name} {t.customer_email ? `· ${t.customer_email}` : ""} {t.customer_phone ? `· ${t.customer_phone}` : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}

            {data.tickets.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No customer support tickets yet.</div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Link to="/admin/tickets">
                <MessageSquare className="h-3.5 w-3.5" /> View all customer tickets
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Two Column Layout: Product Reviews & Low Stock ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SECTION 3: Product Reviews & Moderation */}
        <div className="flex flex-col rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <h2 className="font-semibold text-base text-foreground">Customer Reviews</h2>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {data.reviews.length} total
              </span>
            </div>
            <Link
              to="/admin/reviews"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>Moderate reviews</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-sm flex-1">
            {data.reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-medium text-xs text-foreground truncate max-w-[200px]">
                      {r.product_name}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                      r.is_published
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.is_published ? "Approved" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.review_text}</p>
                <p className="text-[11px] text-muted-foreground">
                  By {r.author_name} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}

            {data.reviews.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No customer reviews yet.</div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Link to="/admin/reviews">
                <Star className="h-3.5 w-3.5" /> Manage & approve product reviews
              </Link>
            </Button>
          </div>
        </div>

        {/* SECTION 4: Low Stock Alert */}
        <div className="flex flex-col rounded-xl border bg-card p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-sale" />
              <h2 className="font-semibold text-base text-foreground">Low Stock Alert</h2>
              {lowStock.length > 0 && (
                <span className="rounded-full bg-sale/15 px-2 py-0.5 text-[11px] font-semibold text-sale">
                  {lowStock.length} items
                </span>
              )}
            </div>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <span>Manage catalog</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-sm flex-1">
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5">
                <span className="font-medium text-xs text-foreground truncate max-w-[240px]">{p.name}</span>
                <span
                  className={`font-semibold text-xs rounded px-2 py-0.5 ${
                    p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-sale/15 text-sale"
                  }`}
                >
                  {p.stock === 0 ? "Out of stock" : `${p.stock} units left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="py-8 text-center text-sm text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="h-5 w-5" />
                <span>All products in your catalog are well-stocked.</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
              <Link to="/admin/products">
                <Package className="h-3.5 w-3.5" /> Update inventory & products
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
