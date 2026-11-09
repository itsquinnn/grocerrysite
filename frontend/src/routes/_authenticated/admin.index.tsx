import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  PlusCircle,
  Tag,
  TrendingUp,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/")({
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-border/60 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-3.5 w-56 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>

      {/* Skeleton Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-3.5 space-y-2 shadow-xs">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Skeleton Chart */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-48 sm:h-56 w-full rounded-lg" />
      </div>

      {/* Skeleton Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

function Dashboard() {
  const { isNepali, formatStatus, translateProduct } = useI18n();
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(14);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "dashboard", "full"],
    staleTime: 60 * 1000, // 1 minute in memory
    gcTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    queryFn: async () => {
      // 1. Unified high-speed server endpoint
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

      // 2. High-speed parallel fallback
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
        payment_method: ((ord.payment_method || "").toLowerCase().includes("cash") || (ord.payment_method || "").toLowerCase().includes("cod"))
          ? "Cash on Delivery"
          : (ord.payment_method ?? "Cash on Delivery"),
        payment_status: (((ord.payment_method || "").toLowerCase().includes("cash") || (ord.payment_method || "").toLowerCase().includes("cod")) && (ord.status ?? "").toLowerCase() !== "delivered" && (ord.total ?? ord.total_paise ?? 1) > 0)
          ? "pending"
          : (ord.payment_status ?? "pending").toLowerCase(),
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

  // Dynamic Revenue chart for selected period
  const days = Array.from({ length: periodDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (periodDays - 1 - i));
    return d.toISOString().slice(0, 10);
  });

  const chartData = days.map((d) => {
    const dayOrders = liveOrders.filter((o) => o.created_at.slice(0, 10) === d);
    const dayRev = dayOrders.reduce((s, o) => s + Number(o.total), 0);
    return {
      day: d.slice(5), // "MM-DD"
      date: d,
      revenue: dayRev,
      count: dayOrders.length,
    };
  });

  const periodRevenue = chartData.reduce((s, c) => s + c.revenue, 0);
  const periodAvg = Math.round(periodRevenue / periodDays);

  return (
    <div className="space-y-4">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-border/60 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Store performance, active fulfillment, and catalog status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            className="text-xs h-8 px-3 rounded-lg font-medium"
          >
            <Link to="/admin/products">
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
              Add Product
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="text-xs h-8 px-2.5 rounded-lg border-border/70"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
            <span>{isFetching ? "Syncing..." : "Sync"}</span>
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Revenue */}
        <div className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs">
          <p className="text-xs font-medium text-muted-foreground">Revenue</p>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight truncate">
            {formatNPR(revenue)}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {liveOrders.length} valid orders
          </p>
        </div>

        {/* Metric 2: Orders */}
        <Link
          to="/admin/orders"
          className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs hover:border-foreground/30 transition block"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Orders</p>
            {pendingOrders > 0 && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-500/10 px-1.5 py-0.2 rounded">
                {pendingOrders} pending
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {data.orders.length}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Lifetime orders
          </p>
        </Link>

        {/* Metric 3: Tickets */}
        <Link
          to="/admin/tickets"
          className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs hover:border-foreground/30 transition block"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Support Tickets</p>
            {openTickets > 0 && (
              <span className="text-[10px] font-medium text-rose-700 bg-rose-500/10 px-1.5 py-0.2 rounded">
                {openTickets} open
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {data.tickets.length}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {openTickets > 0 ? `${openTickets} need response` : "All resolved"}
          </p>
        </Link>

        {/* Metric 4: Reviews */}
        <Link
          to="/admin/reviews"
          className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs hover:border-foreground/30 transition block"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Reviews</p>
            <span className="text-[10px] font-medium text-muted-foreground">
              ★ {avgRating}
            </span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {data.reviews.length}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Customer ratings
          </p>
        </Link>

        {/* Metric 5: Customers */}
        <Link
          to="/admin/customers"
          className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs hover:border-foreground/30 transition block"
        >
          <p className="text-xs font-medium text-muted-foreground">Customers</p>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {data.customers}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Registered accounts
          </p>
        </Link>

        {/* Metric 6: Products */}
        <Link
          to="/admin/products"
          className="rounded-xl border border-border/70 bg-card p-3.5 space-y-1 shadow-xs hover:border-foreground/30 transition block"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Catalog</p>
            {lowStock.length > 0 && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-500/10 px-1.5 py-0.2 rounded">
                {lowStock.length} low
              </span>
            )}
          </div>
          <p className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            {data.products.length}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            Products listed
          </p>
        </Link>
      </div>

      {/* ── Revenue Performance Chart ─────────────────────────── */}
      <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Sales Trajectory
            </h3>
            <p className="text-xs text-muted-foreground">
              Daily revenue · Avg: {formatNPR(periodAvg)}/day
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/insights"
              className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1"
            >
              <span>Detailed Insights</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center border border-border/70 rounded-lg p-0.5 bg-muted/20">
              {([7, 14, 30] as const).map((daysVal) => (
                <button
                  key={daysVal}
                  type="button"
                  onClick={() => setPeriodDays(daysVal)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer",
                    periodDays === daysVal
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {daysVal}D
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-48 sm:h-56 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} vertical={false} />
              <XAxis
                dataKey="day"
                fontSize={10}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                interval={periodDays === 30 ? 3 : periodDays === 14 ? 1 : 0}
              />
              <YAxis
                fontSize={10}
                stroke="var(--muted-foreground)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `Rs ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-foreground">{d.date}</p>
                        <p className="font-semibold text-primary mt-0.5">{formatNPR(d.revenue)}</p>
                        <p className="text-[11px] text-muted-foreground">{d.count} orders</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two Column Layout: Orders & Support Tickets ─────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* SECTION 1: Recent Orders */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Recent Orders
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                {data.orders.length}
              </span>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-1 divide-y divide-border/60 text-xs flex-1">
            {data.orders.slice(0, 6).map((o) => (
              <div key={o.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-semibold text-foreground shrink-0">{o.order_number}</span>
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.2 text-[10px] font-medium shrink-0",
                        o.status === "delivered"
                          ? "bg-emerald-500/10 text-emerald-700"
                          : o.status === "cancelled"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-amber-500/10 text-amber-700"
                      )}
                    >
                      {formatStatus(o.status)}
                    </span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">{formatNPR(o.total)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="truncate">{o.customer_name}</span>
                  <span className="shrink-0">{o.payment_method === "Cash on Delivery" ? "COD" : o.payment_method}</span>
                </div>
              </div>
            ))}

            {data.orders.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No customer orders placed yet.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Support Tickets */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Support Tickets
              </h3>
              {openTickets > 0 && (
                <span className="text-[11px] font-medium text-rose-700 bg-rose-500/10 px-1.5 py-0.2 rounded">
                  {openTickets} open
                </span>
              )}
            </div>
            <Link
              to="/admin/tickets"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-1 divide-y divide-border/60 text-xs flex-1">
            {data.tickets.slice(0, 6).map((t) => (
              <div key={t.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[11px] font-semibold text-foreground shrink-0">
                      #{t.ticket_number}
                    </span>
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.2 text-[10px] font-medium shrink-0",
                        t.status === "Open"
                          ? "bg-amber-500/10 text-amber-700"
                          : t.status === "In Progress"
                          ? "bg-blue-500/10 text-blue-700"
                          : "bg-emerald-500/10 text-emerald-700"
                      )}
                    >
                      {t.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium text-foreground truncate">{t.subject}</p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="truncate">{t.customer_name || t.customer_email}</span>
                  <span className="capitalize">{t.category}</span>
                </div>
              </div>
            ))}

            {data.tickets.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No open support tickets.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 3: Customer Reviews */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Customer Reviews
              </h3>
              <span className="text-[11px] font-medium text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                {data.reviews.length}
              </span>
            </div>
            <Link
              to="/admin/reviews"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-1 divide-y divide-border/60 text-xs flex-1">
            {data.reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stars value={r.rating} />
                    <span className="font-medium text-foreground truncate">
                      {r.product_name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.2 text-[10px] font-medium shrink-0",
                      r.is_published
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {r.is_published ? "Approved" : "Hidden"}
                  </span>
                </div>
                <p className="text-muted-foreground line-clamp-1">{r.review_text}</p>
                <p className="text-[10px] text-muted-foreground">
                  {r.author_name} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}

            {data.reviews.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No customer reviews yet.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 4: Low Stock Alert */}
        <div className="flex flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Low Stock Alert
              </h3>
              {lowStock.length > 0 && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-500/10 px-1.5 py-0.2 rounded">
                  {lowStock.length} items
                </span>
              )}
            </div>
            <Link
              to="/admin/products"
              className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>Manage stock</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-1 divide-y divide-border/60 text-xs flex-1">
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5 gap-2">
                <span className="font-medium text-foreground truncate min-w-0">
                  {translateProduct(p.name)}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium rounded px-1.5 py-0.2 shrink-0",
                    p.stock === 0 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"
                  )}
                >
                  {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>All catalog items are well-stocked.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}