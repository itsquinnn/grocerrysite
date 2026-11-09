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
    <div className="space-y-5">
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

      {/* Skeleton Flat Metric Pillars */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 py-3 border-b border-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-7 w-28 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Skeleton Flat Chart Section */}
      <div className="py-3 border-b border-border/60 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-48 sm:h-56 w-full rounded-lg" />
      </div>

      {/* Skeleton Operations Workspace */}
      <div className="grid gap-8 lg:grid-cols-12 pt-1">
        <Skeleton className="lg:col-span-7 h-80 rounded-lg" />
        <Skeleton className="lg:col-span-5 h-80 rounded-lg" />
      </div>
    </div>
  );
}

function Dashboard() {
  const { isNepali, formatStatus, translateProduct } = useI18n();
  const [periodDays, setPeriodDays] = useState<7 | 14 | 30>(14);
  const [triageTab, setTriageTab] = useState<"tickets" | "stock" | "reviews">("tickets");

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-border/70 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
            Overview
          </h2>
          <p className="text-xs text-foreground/75 font-medium mt-0.5">
            Store performance, active fulfillment, and catalog status.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            asChild
            size="sm"
            className="text-xs h-8 px-3 rounded-lg font-semibold"
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
            className="text-xs h-8 px-2.5 rounded-lg border-border/80 font-medium text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin")} />
            <span>{isFetching ? "Syncing..." : "Sync"}</span>
          </Button>
        </div>
      </div>

      {/* ── Key Metrics Data Row (Seamless, borderless pillars, zero card boxes) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-4 py-3 border-b border-border/70">
        {/* Metric 1: Revenue */}
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider">Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
            {formatNPR(revenue)}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            {liveOrders.length} valid orders
          </p>
        </div>

        {/* Metric 2: Orders */}
        <Link
          to="/admin/orders"
          className="group space-y-0.5 block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider group-hover:text-foreground transition">Orders</p>
            {pendingOrders > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-1.5 py-0.2 rounded">
                {pendingOrders} pend
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition">
            {data.orders.length}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            Lifetime orders
          </p>
        </Link>

        {/* Metric 3: Tickets */}
        <Link
          to="/admin/tickets"
          className="group space-y-0.5 block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider group-hover:text-foreground transition">Support</p>
            {openTickets > 0 && (
              <span className="text-[10px] font-bold text-rose-800 bg-rose-500/15 px-1.5 py-0.2 rounded">
                {openTickets} open
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition">
            {data.tickets.length}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            {openTickets > 0 ? `${openTickets} need response` : "All resolved"}
          </p>
        </Link>

        {/* Metric 4: Reviews */}
        <Link
          to="/admin/reviews"
          className="group space-y-0.5 block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider group-hover:text-foreground transition">Reviews</p>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-1.5 py-0.2 rounded">
              ★ {avgRating}
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition">
            {data.reviews.length}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            Customer ratings
          </p>
        </Link>

        {/* Metric 5: Customers */}
        <Link
          to="/admin/customers"
          className="group space-y-0.5 block"
        >
          <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider group-hover:text-foreground transition">Customers</p>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition">
            {data.customers}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            Registered accounts
          </p>
        </Link>

        {/* Metric 6: Catalog */}
        <Link
          to="/admin/products"
          className="group space-y-0.5 block"
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-wider group-hover:text-foreground transition">Catalog</p>
            {lowStock.length > 0 && (
              <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-1.5 py-0.2 rounded">
                {lowStock.length} low
              </span>
            )}
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition">
            {data.products.length}
          </p>
          <p className="text-[11px] text-foreground/70 font-medium truncate">
            Products listed
          </p>
        </Link>
      </div>

      {/* ── Revenue Performance Chart (Flat, seamless section) ── */}
      <div className="py-4 border-b border-border/70 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-foreground">
              Sales Trajectory
            </h2>
            <p className="text-xs text-foreground/75 font-medium mt-0.5">
              Daily revenue · Avg: {formatNPR(periodAvg)}/day
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/admin/insights"
              className="text-xs text-foreground/80 hover:text-foreground font-semibold inline-flex items-center gap-1"
            >
              <span>Detailed Insights</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>

            <div className="flex items-center border border-border/80 rounded-lg p-0.5 bg-muted/40">
              {([7, 14, 30] as const).map((daysVal) => (
                <button
                  key={daysVal}
                  type="button"
                  onClick={() => setPeriodDays(daysVal)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-md transition font-semibold cursor-pointer",
                    periodDays === daysVal
                      ? "bg-background text-foreground shadow-xs font-bold"
                      : "text-foreground/70 hover:text-foreground"
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.8} vertical={false} />
              <XAxis
                dataKey="day"
                fontSize={11}
                stroke="#52525b"
                tickLine={false}
                axisLine={false}
                interval={periodDays === 30 ? 3 : periodDays === 14 ? 1 : 0}
              />
              <YAxis
                fontSize={11}
                stroke="#52525b"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `Rs ${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-bold text-foreground">{d.date}</p>
                        <p className="font-bold text-primary mt-0.5">{formatNPR(d.revenue)}</p>
                        <p className="text-[11px] text-foreground/70 font-medium">{d.count} orders</p>
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

      {/* ── Operations Workspace (Seamless 2 columns without card wrappers) ── */}
      <div className="grid gap-8 lg:grid-cols-12 pt-3">
        {/* PANEL 1: Live Orders & Fulfillment */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                Recent Orders
              </h2>
              <span className="text-[11px] font-bold text-foreground/80 bg-muted px-2 py-0.5 rounded">
                {data.orders.length}
              </span>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-foreground/80 hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 text-xs flex-1">
            {data.orders.slice(0, 7).map((o) => (
              <Link
                key={o.id}
                to="/admin/orders"
                className="py-2.5 space-y-1 block hover:bg-muted/30 -mx-2 px-2 rounded-lg transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-foreground shrink-0">{o.order_number}</span>
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0",
                        o.status === "delivered"
                          ? "bg-emerald-500/15 text-emerald-800"
                          : o.status === "cancelled"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-800"
                      )}
                    >
                      {formatStatus(o.status)}
                    </span>
                  </div>
                  <span className="font-bold text-foreground shrink-0">{formatNPR(o.total)}</span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-foreground/75 font-medium">
                  <span className="truncate">{o.customer_name}</span>
                  <span className="shrink-0 font-medium">
                    {o.payment_method === "Cash on Delivery" ? "COD" : o.payment_method} · {new Date(o.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}

            {data.orders.length === 0 && (
              <div className="py-12 text-center text-xs text-foreground/70 font-medium">
                No customer orders placed yet.
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Action Center (Segmented triage: Support / Stock / Reviews) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 lg:border-l lg:border-border/70 lg:pl-8">
          <div className="flex items-center justify-between pb-2 border-b border-border/70 gap-2 flex-wrap">
            {/* Segmented Triage Tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/60 border border-border/60">
              <button
                type="button"
                onClick={() => setTriageTab("tickets")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer inline-flex items-center gap-1.5",
                  triageTab === "tickets"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span>Support</span>
                {openTickets > 0 && (
                  <span className="text-[10px] font-bold text-rose-800 bg-rose-500/15 px-1.5 py-0.2 rounded-full">
                    {openTickets}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTriageTab("stock")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer inline-flex items-center gap-1.5",
                  triageTab === "stock"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span>Stock</span>
                {lowStock.length > 0 && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-1.5 py-0.2 rounded-full">
                    {lowStock.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTriageTab("reviews")}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition font-medium cursor-pointer inline-flex items-center gap-1.5",
                  triageTab === "reviews"
                    ? "bg-background text-foreground font-semibold shadow-xs"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span>Reviews</span>
                {data.reviews.length > 0 && (
                  <span className="text-[10px] font-bold text-foreground/70 bg-muted px-1.5 py-0.2 rounded-full">
                    {data.reviews.length}
                  </span>
                )}
              </button>
            </div>

            {/* Link to active section */}
            <Link
              to={
                triageTab === "tickets"
                  ? "/admin/tickets"
                  : triageTab === "stock"
                  ? "/admin/products"
                  : "/admin/reviews"
              }
              className="text-xs font-semibold text-foreground/80 hover:text-foreground inline-flex items-center gap-0.5"
            >
              <span>Manage</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-border/60 text-xs flex-1">
            {/* TAB CONTENT: Support Tickets */}
            {triageTab === "tickets" && (
              <>
                {data.tickets.slice(0, 6).map((t) => (
                  <Link
                    key={t.id}
                    to="/admin/tickets"
                    className="py-2.5 space-y-1 block hover:bg-muted/30 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-foreground shrink-0">
                          #{t.ticket_number}
                        </span>
                        <span
                          className={cn(
                            "inline-block rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0",
                            t.status === "Open"
                              ? "bg-amber-500/15 text-amber-800"
                              : t.status === "In Progress"
                              ? "bg-blue-500/15 text-blue-800"
                              : "bg-emerald-500/15 text-emerald-800"
                          )}
                        >
                          {t.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-foreground/70 font-medium shrink-0">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-semibold text-foreground truncate">{t.subject}</p>
                    <div className="flex items-center justify-between text-[11px] text-foreground/75 font-medium">
                      <span className="truncate">{t.customer_name || t.customer_email}</span>
                      <span className="capitalize">{t.category}</span>
                    </div>
                  </Link>
                ))}

                {data.tickets.length === 0 && (
                  <div className="py-12 text-center text-xs text-foreground/70 font-medium flex flex-col items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>No open support tickets. All inquiries resolved.</span>
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT: Low Stock Alerts */}
            {triageTab === "stock" && (
              <>
                {lowStock.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    to="/admin/products"
                    className="flex justify-between items-center py-2.5 gap-2 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition"
                  >
                    <span className="font-semibold text-foreground truncate min-w-0">
                      {translateProduct(p.name)}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold rounded px-2 py-0.5 shrink-0",
                        p.stock === 0
                          ? "bg-destructive/15 text-destructive"
                          : "bg-amber-500/15 text-amber-800"
                      )}
                    >
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </span>
                  </Link>
                ))}

                {lowStock.length === 0 && (
                  <div className="py-12 text-center text-xs text-foreground/75 font-medium flex flex-col items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>All catalog items are well-stocked.</span>
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT: Customer Reviews */}
            {triageTab === "reviews" && (
              <>
                {data.reviews.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    to="/admin/reviews"
                    className="py-2.5 space-y-1 block hover:bg-muted/30 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Stars value={r.rating} />
                        <span className="font-semibold text-foreground truncate">
                          {r.product_name}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0",
                          r.is_published
                            ? "bg-emerald-500/15 text-emerald-800"
                            : "bg-muted text-foreground/70"
                        )}
                      >
                        {r.is_published ? "Approved" : "Hidden"}
                      </span>
                    </div>
                    <p className="text-foreground/80 font-normal line-clamp-1">{r.review_text}</p>
                    <p className="text-[10px] text-foreground/70 font-medium">
                      {r.author_name} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </Link>
                ))}

                {data.reviews.length === 0 && (
                  <div className="py-12 text-center text-xs text-foreground/70 font-medium">
                    No customer reviews yet.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}