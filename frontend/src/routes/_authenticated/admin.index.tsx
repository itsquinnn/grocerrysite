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

export const Route = createFileRoute("/_authenticated/admin/")({
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-64 rounded-md" />
        </div>
        <Skeleton className="h-8 w-32 rounded-lg" />
      </div>

      {/* Skeleton Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>

      {/* Skeleton Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-6 sm:h-7 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Skeleton Chart */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3 w-56 rounded" />
          </div>
          <Skeleton className="h-7 w-36 rounded-full" />
        </div>
        <Skeleton className="h-52 sm:h-64 w-full rounded-lg" />
      </div>

      {/* Skeleton Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
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
    <div className="space-y-5 sm:space-y-6">
      {/* ── Top Header & Live Sync Controls ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card border rounded-xl p-3.5 sm:p-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
              {"Dashboard Overview"}
            </h2>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full hidden xs:inline-block">
              {"Live"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {"Real-time store revenue, orders, catalog & customer engagement"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="gap-1.5 h-8 text-xs bg-background hover:bg-muted font-medium shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>
              {isFetching ? "Syncing..." : "Sync Data"}
            </span>
          </Button>
        </div>
      </div>

      {/* ── Quick Action Hub (Super Mobile Friendly) ────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
        <Link
          to="/admin/products"
          className="flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-2xs hover:border-primary/50 hover:bg-muted/40 transition group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
            <PlusCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-foreground truncate">
              {"Add Product"}
            </span>
            <span className="block text-[10px] text-muted-foreground truncate">
              {"Update catalog"}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/orders"
          className="flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-2xs hover:border-primary/50 hover:bg-muted/40 transition group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform shrink-0">
            <ShoppingBag className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-foreground truncate">
              {"Fulfillment"}
            </span>
            <span className="block text-[10px] text-muted-foreground truncate">
              {pendingOrders} {"pending"}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/coupons"
          className="flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-2xs hover:border-primary/50 hover:bg-muted/40 transition group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Tag className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-foreground truncate">
              {"Coupons"}
            </span>
            <span className="block text-[10px] text-muted-foreground truncate">
              {"Discounts & codes"}
            </span>
          </div>
        </Link>

        <Link
          to="/admin/tickets"
          className="flex items-center gap-2.5 rounded-xl border bg-card p-3 shadow-2xs hover:border-primary/50 hover:bg-muted/40 transition group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-semibold text-foreground truncate">
              {"Support Desk"}
            </span>
            <span className="block text-[10px] text-muted-foreground truncate">
              {openTickets > 0 ? `${openTickets} ${"open"}` : "All clear"}
            </span>
          </div>
        </Link>
      </div>

      {/* ── Key Metrics Grid (Adaptive 2 to 6 Columns) ───────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4">
        {/* Metric 1: Revenue */}
        <div className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Revenue"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight truncate">
              {formatNPR(revenue)}
            </p>
            <span className="text-[11px] text-muted-foreground block truncate">
              {liveOrders.length} {"valid orders"}
            </span>
          </div>
        </div>

        {/* Metric 2: Orders */}
        <Link
          to="/admin/orders"
          className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition hover:border-primary/50 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Orders"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform shrink-0">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {data.orders.length}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 truncate">
              <Clock className="h-3 w-3 shrink-0" /> {pendingOrders} {"pending"}
            </span>
          </div>
        </Link>

        {/* Metric 3: Tickets */}
        <Link
          to="/admin/tickets"
          className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition hover:border-accent flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Tickets"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform shrink-0">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {data.tickets.length}
            </p>
            <span
              className={`text-[11px] truncate block ${
                openTickets > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              }`}
            >
              {openTickets > 0
                ? `● ${openTickets} ${"open inquiries"}`
                : "All resolved"}
            </span>
          </div>
        </Link>

        {/* Metric 4: Reviews */}
        <Link
          to="/admin/reviews"
          className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition hover:border-amber-500/50 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Reviews"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform shrink-0">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {data.reviews.length}
            </p>
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 block truncate">
              ★ {avgRating} {"avg rating"}
            </span>
          </div>
        </Link>

        {/* Metric 5: Customers */}
        <Link
          to="/admin/customers"
          className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition hover:border-foreground/30 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Customers"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform shrink-0">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {data.customers}
            </p>
            <span className="text-[11px] text-muted-foreground block truncate">
              {"Registered users"}
            </span>
          </div>
        </Link>

        {/* Metric 6: Products */}
        <Link
          to="/admin/products"
          className="rounded-xl border bg-card p-3.5 sm:p-4 shadow-2xs transition hover:border-foreground/30 flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {"Products"}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-105 transition-transform shrink-0">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg xs:text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              {data.products.length}
            </p>
            <span
              className={`text-[11px] block truncate ${
                lowStock.length > 0 ? "font-semibold text-rose-600 dark:text-rose-400" : "text-muted-foreground"
              }`}
            >
              {lowStock.length > 0
                ? `⚠ ${lowStock.length} ${"low stock"}`
                : "Well stocked"}
            </span>
          </div>
        </Link>
      </div>

      {/* ── Revenue Performance Chart (Responsive Period Switcher) ──────── */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {"Sales Trajectory"}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {`Revenue across selected window · Avg: ${formatNPR(periodAvg)}/day`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/insights"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline px-2.5 py-1 rounded-lg bg-primary/10 transition"
              title="Detailed Monthly Insights & Yearly Targets"
            >
              <span>{"Yearly & Monthly Insights"}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
              {([7, 14, 30] as const).map((daysVal) => (
                <button
                  key={daysVal}
                  type="button"
                  onClick={() => setPeriodDays(daysVal)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                    periodDays === daysVal
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {daysVal}{"D"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Responsive Recharts container */}
        <div className="h-52 sm:h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} vertical={false} />
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
                        <p className="text-primary font-bold text-sm mt-0.5">{formatNPR(d.revenue)}</p>
                        <p className="text-[11px] text-muted-foreground">{d.count} {"orders"}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Two Column Layout: Orders & Support Tickets ─────────────────── */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
        {/* SECTION 1: Recent Orders */}
        <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {"Recent Orders"}
              </h3>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {data.orders.length}
              </span>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{"Manage all"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-xs sm:text-sm flex-1">
            {data.orders.slice(0, 6).map((o) => (
              <div key={o.id} className="py-3 space-y-1.5">
                {/* Header line: Order number, status, price */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-foreground shrink-0">{o.order_number}</span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase shrink-0 ${
                        o.status === "delivered"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : o.status === "cancelled"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {formatStatus(o.status)}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-foreground">{formatNPR(o.total)}</span>
                  </div>
                </div>

                {/* Sub info: Customer + Phone (tap to call!) + Payment */}
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-foreground">{o.customer_name}</span>
                    {o.customer_phone && (
                      <a
                        href={`tel:${o.customer_phone}`}
                        className="inline-flex items-center gap-0.5 text-primary hover:underline"
                        title="Click to call customer"
                      >
                        <Phone className="h-2.5 w-2.5" />
                        <span>{o.customer_phone}</span>
                      </a>
                    )}
                  </div>
                  <span className="capitalize text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {o.payment_method === "Cash on Delivery" ? ("COD") : o.payment_method}
                  </span>
                </div>

                {/* Destination */}
                {o.destination && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0 opacity-70" />
                    <span className="truncate">{o.destination}</span>
                  </div>
                )}
              </div>
            ))}

            {data.orders.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                {"No customer orders placed yet."}
              </div>
            )}
          </div>

          <div className="pt-3 border-t mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
              <Link to="/admin/orders">
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{"View all orders & status tracker"}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* SECTION 2: Support Tickets */}
        <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {"Support Tickets"}
              </h3>
              {openTickets > 0 && (
                <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                  {openTickets} {"open"}
                </span>
              )}
            </div>
            <Link
              to="/admin/tickets"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{"Manage all"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-xs sm:text-sm flex-1">
            {data.tickets.slice(0, 6).map((t) => (
              <div key={t.id} className="py-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-primary shrink-0">
                      #{t.ticket_number}
                    </span>
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase shrink-0 ${
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
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium text-xs text-foreground truncate">{t.subject}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="truncate">{t.customer_name || t.customer_email}</span>
                  <span className="capitalize text-muted-foreground/80">{t.category}</span>
                </div>
              </div>
            ))}

            {data.tickets.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No open support tickets.
              </div>
            )}
          </div>

          <div className="pt-3 border-t mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
              <Link to="/admin/tickets">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>View all support inquiries</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* SECTION 3: Customer Reviews */}
        <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Customer Reviews
              </h3>
            </div>
            <Link
              to="/admin/reviews"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>Manage all</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-xs sm:text-sm flex-1">
            {data.reviews.slice(0, 5).map((r) => (
              <div key={r.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Stars value={r.rating} />
                    <span className="font-medium text-xs text-foreground truncate">
                      {r.product_name}
                    </span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold shrink-0 ${
                      r.is_published
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.is_published ? "Approved" : "Hidden"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.review_text}</p>
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

          <div className="pt-3 border-t mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
              <Link to="/admin/reviews">
                <Star className="h-3.5 w-3.5" />
                <span>Manage & approve product reviews</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* SECTION 4: Low Stock Alert */}
        <div className="flex flex-col rounded-xl border bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 border-b">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-sale" />
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {"Low Stock Inventory"}
              </h3>
              {lowStock.length > 0 && (
                <span className="rounded-full bg-sale/15 px-2 py-0.5 text-[10px] font-semibold text-sale">
                  {lowStock.length} {"items"}
                </span>
              )}
            </div>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>{"Manage catalog"}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-3 divide-y text-xs sm:text-sm flex-1">
            {lowStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex justify-between items-center py-2.5 gap-2">
                <span className="font-medium text-xs text-foreground truncate min-w-0">
                  {translateProduct(p.name)}
                </span>
                <span
                  className={`font-bold text-[10px] sm:text-xs rounded px-2 py-0.5 shrink-0 ${
                    p.stock === 0 ? "bg-destructive/15 text-destructive" : "bg-sale/15 text-sale"
                  }`}
                >
                  {p.stock === 0
                    ? "Out of stock"
                    : `${p.stock} ${"units left"}`}
                </span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="py-8 text-center text-xs text-emerald-600 dark:text-emerald-400 flex flex-col items-center gap-1">
                <CheckCircle2 className="h-5 w-5" />
                <span>
                  {"All products in your catalog are well-stocked."}
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t mt-auto">
            <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5 h-8">
              <Link to="/admin/products">
                <Package className="h-3.5 w-3.5" />
                <span>{"Restock inventory & products"}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}