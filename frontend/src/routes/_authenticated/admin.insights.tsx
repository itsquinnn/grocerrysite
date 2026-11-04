import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Target,
  DollarSign,
  Calendar,
  ShoppingBag,
  Award,
  ArrowUpRight,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Percent,
  Download,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/insights")({
  head: () => ({
    meta: [
      { title: "Revenue Insights & Analytics — DOVAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: InsightsSkeleton,
  component: AdminInsights,
});

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const PIE_COLORS = [
  "#10B981", // Emerald (Jan)
  "#3B82F6", // Blue (Feb)
  "#F59E0B", // Amber (Mar)
  "#EC4899", // Pink (Apr)
  "#8B5CF6", // Purple (May)
  "#06B6D4", // Cyan (Jun)
  "#14B8A6", // Teal (Jul)
  "#F97316", // Orange (Aug)
  "#6366F1", // Indigo (Sep)
  "#84CC16", // Lime (Oct)
  "#E11D48", // Rose (Nov)
  "#0EA5E9", // Sky (Dec)
];

function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-56 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <Skeleton className="h-9 w-44 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function AdminInsights() {
  const currentCalendarYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentCalendarYear);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetInput, setTargetInput] = useState<string>("");

  // Store & Retrieve Yearly Target for the selected year
  const [yearTarget, setYearTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`dovan_revenue_target_${selectedYear}`);
      if (saved) return Number(saved) || 2500000;
    }
    return 2500000; // Default NPR 25 Lakhs
  });

  // Sync year target when selected year changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`dovan_revenue_target_${selectedYear}`);
      setYearTarget(saved ? Number(saved) || 2500000 : 2500000);
    }
  }, [selectedYear]);

  // Save new target
  const handleSaveTarget = () => {
    const val = Number(targetInput.replace(/[^0-9]/g, ""));
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid target amount in NPR");
      return;
    }
    setYearTarget(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(`dovan_revenue_target_${selectedYear}`, String(val));
    }
    toast.success(`Revenue target for ${selectedYear} set to ${formatNPR(val)}`);
    setTargetDialogOpen(false);
  };

  // Fetch all orders for revenue analysis
  const { data: rawOrders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "insights", "orders"],
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      try {
        let { data, error } = await supabase
          .from("orders")
          .select("id, total, total_paise, status, payment_status, created_at")
          .order("created_at", { ascending: false });

        if (error || !data) {
          try {
            const res = await api.get<{ orders: any[] }>("/admin/orders");
            if (res?.orders) data = res.orders;
          } catch {}
        }

        return (data ?? []).map((o: any) => ({
          id: o.id,
          total: o.total ?? (o.total_paise ? o.total_paise / 100 : 0),
          status: (o.status ?? "pending").toLowerCase(),
          payment_status: (o.payment_status ?? "pending").toLowerCase(),
          created_at: o.created_at ?? new Date().toISOString(),
          year: new Date(o.created_at).getFullYear(),
          month: new Date(o.created_at).getMonth(), // 0 to 11
        }));
      } catch (err) {
        console.error("Failed to fetch orders for insights:", err);
        return [];
      }
    },
  });

  // Extract available years from orders + surrounding years
  const availableYears = useMemo(() => {
    const orderYears = rawOrders.map((o) => o.year);
    const set = new Set<number>([currentCalendarYear, currentCalendarYear - 1, ...orderYears]);
    return Array.from(set).sort((a, b) => b - a);
  }, [rawOrders, currentCalendarYear]);

  // Filter orders for the selected year (excluding cancelled/refunded)
  const yearlyOrders = useMemo(() => {
    return rawOrders.filter(
      (o) => o.year === selectedYear && !["cancelled", "refunded"].includes(o.status)
    );
  }, [rawOrders, selectedYear]);

  // Aggregate Month-by-Month Data for the selected year
  const monthlyData = useMemo(() => {
    const totalYearRevenue = yearlyOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return MONTH_NAMES.map((monthName, idx) => {
      const monthOrders = yearlyOrders.filter((o) => o.month === idx);
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const ordersCount = monthOrders.length;
      const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
      const share = totalYearRevenue > 0 ? (revenue / totalYearRevenue) * 100 : 0;

      return {
        monthIndex: idx,
        name: monthName,
        shortName: MONTH_SHORT[idx],
        revenue,
        ordersCount,
        aov,
        share: Number(share.toFixed(1)),
        color: PIE_COLORS[idx % PIE_COLORS.length],
      };
    });
  }, [yearlyOrders]);

  // Key Aggregate KPIs
  const totalYearRevenue = useMemo(
    () => monthlyData.reduce((sum, m) => sum + m.revenue, 0),
    [monthlyData]
  );

  const totalYearOrders = useMemo(
    () => monthlyData.reduce((sum, m) => sum + m.ordersCount, 0),
    [monthlyData]
  );

  const targetPercentage = useMemo(() => {
    if (!yearTarget || yearTarget <= 0) return 0;
    return Math.min(100, Number(((totalYearRevenue / yearTarget) * 100).toFixed(1)));
  }, [totalYearRevenue, yearTarget]);

  const targetRemaining = Math.max(0, yearTarget - totalYearRevenue);

  // Identify Best Performing Month
  const topMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.revenue - a.revenue);
    return sorted[0]?.revenue > 0 ? sorted[0] : null;
  }, [monthlyData]);

  // Average Monthly Revenue Run Rate
  const monthlyAvgRevenue = Math.round(totalYearRevenue / 12);

  // Pie chart data: Filter months with revenue > 0 for clean slices
  const pieChartData = useMemo(() => {
    const active = monthlyData.filter((m) => m.revenue > 0);
    if (active.length > 0) return active;
    // Fallback if no revenue yet: show quarterly mockup slices with 0 revenue
    return [
      { name: "Q1 (Jan - Mar)", revenue: 0, share: 25, color: "#10B981" },
      { name: "Q2 (Apr - Jun)", revenue: 0, share: 25, color: "#3B82F6" },
      { name: "Q3 (Jul - Sep)", revenue: 0, share: 25, color: "#F59E0B" },
      { name: "Q4 (Oct - Dec)", revenue: 0, share: 25, color: "#EC4899" },
    ];
  }, [monthlyData]);

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header & Year Selector Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card border rounded-xl p-4 sm:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="h-4 w-4" />
            </span>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Financial Insights & Annual Revenue
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Monthly trajectory, annual target tracking & revenue distribution pie charts
          </p>
        </div>

        {/* Year Selector & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Year Selector Pill Group */}
          <div className="flex items-center bg-muted/70 p-1 rounded-lg border">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1.5 mr-1" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-2"
              aria-label="Select Year"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-popover text-foreground">
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Set Target Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetInput(String(yearTarget));
              setTargetDialogOpen(true);
            }}
            className="h-8 gap-1.5 text-xs bg-card hover:bg-muted font-medium"
          >
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>Set Target</span>
          </Button>

          {/* Sync Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Refresh order data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* ── Annual Target Progress Card & KPIs ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Annual Target Achievement */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex flex-col justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {selectedYear} Target Progress
              </span>
              <button
                type="button"
                onClick={() => {
                  setTargetInput(String(yearTarget));
                  setTargetDialogOpen(true);
                }}
                className="text-primary hover:text-primary/80 transition"
                title="Edit Target"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <p className="font-display text-xl sm:text-2xl font-black text-foreground">
                {targetPercentage}%
              </p>
              <span className="text-[11px] font-semibold text-muted-foreground">
                Target: {formatNPR(yearTarget)}
              </span>
            </div>
            <div className="mt-3">
              <Progress value={targetPercentage} className="h-2" />
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            {targetRemaining > 0 ? (
              <span>Remaining: <strong className="text-foreground">{formatNPR(targetRemaining)}</strong> to goal</span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Target achieved!
              </span>
            )}
          </p>
        </div>

        {/* KPI 2: Total Annual Revenue */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">
              {selectedYear} Total Revenue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {formatNPR(totalYearRevenue)}
            </p>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Across {totalYearOrders} fulfilled orders
            </span>
          </div>
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Monthly Avg</span>
            <strong className="text-foreground">{formatNPR(monthlyAvgRevenue)}</strong>
          </div>
        </div>

        {/* KPI 3: Best Performing Month */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Top Month</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-lg sm:text-xl font-black text-foreground tracking-tight truncate">
              {topMonth ? topMonth.name : "N/A"}
            </p>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              {topMonth ? `${formatNPR(topMonth.revenue)} (${topMonth.share}% share)` : "No orders recorded"}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Orders in Top Month</span>
            <strong className="text-foreground">{topMonth ? topMonth.ordersCount : 0}</strong>
          </div>
        </div>

        {/* KPI 4: Average Order Value */}
        <div className="rounded-xl border bg-card p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Annual AOV</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="font-display text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {totalYearOrders > 0 ? formatNPR(Math.round(totalYearRevenue / totalYearOrders)) : "Rs 0"}
            </p>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Average spend per customer order
            </span>
          </div>
          <div className="mt-2 pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Active Months</span>
            <strong className="text-foreground">
              {monthlyData.filter((m) => m.revenue > 0).length} of 12
            </strong>
          </div>
        </div>
      </div>

      {/* ── Dual Visualization Row: Monthly Bar Chart + Monthly Pie Chart ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CHART 1: Monthly Revenue Trajectory (12 Months Bar Chart) */}
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">
                {selectedYear} Monthly Revenue Trajectory
              </h2>
              <p className="text-xs text-muted-foreground">
                Month-by-month sales distribution in NPR
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              12 Months
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  fontSize={11}
                  stroke="var(--muted-foreground)"
                  tickLine={false}
                  axisLine={false}
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
                          <p className="font-bold text-foreground">{d.name} {selectedYear}</p>
                          <p className="text-primary font-extrabold text-sm mt-0.5">{formatNPR(d.revenue)}</p>
                          <div className="mt-1 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                            <span>{d.ordersCount} orders</span>
                            <span>AOV: {formatNPR(d.aov)}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {d.share}% of {selectedYear} total
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Monthly Revenue Share (Pie / Donut Chart) */}
        <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">
                Monthly Revenue Contribution
              </h2>
              <p className="text-xs text-muted-foreground">
                Pie chart distribution of {selectedYear} earnings
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Share %
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      const d = p.payload;
                      return (
                        <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: d.color }}
                            />
                            <span>{d.name}</span>
                          </p>
                          <p className="text-primary font-extrabold text-sm mt-0.5">
                            {formatNPR(d.revenue)}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {d.share}% of total {selectedYear} revenue
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={pieChartData}
                  dataKey={totalYearRevenue > 0 ? "revenue" : "share"}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value: string) => (
                    <span className="text-[11px] text-foreground font-medium">{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Detailed Month-by-Month Breakdown Table ─────────────────────── */}
      <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <div>
            <h2 className="font-bold text-base text-foreground">
              {selectedYear} Complete Monthly Performance Table
            </h2>
            <p className="text-xs text-muted-foreground">
              Detailed breakdown of revenue, orders volume, average order values & annual share
            </p>
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            Total {selectedYear} Volume: {formatNPR(totalYearRevenue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Revenue (NPR)</th>
                <th className="py-2.5 px-3 text-center">Orders</th>
                <th className="py-2.5 px-3 text-right">Avg Order Value</th>
                <th className="py-2.5 px-3 text-center">Annual Share</th>
                <th className="py-2.5 px-3 text-center">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {monthlyData.map((m) => {
                const isTop = topMonth?.monthIndex === m.monthIndex && m.revenue > 0;
                return (
                  <tr key={m.monthIndex} className="hover:bg-muted/40 transition">
                    <td className="py-3 px-3 font-semibold text-foreground flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <span>{m.name}</span>
                      {isTop && (
                        <span className="rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-1.5 py-0.2">
                          Top
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-foreground">
                      {formatNPR(m.revenue)}
                    </td>
                    <td className="py-3 px-3 text-center font-medium text-muted-foreground">
                      {m.ordersCount}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                      {formatNPR(m.aov)}
                    </td>
                    <td className="py-3 px-3 text-center font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-muted text-foreground font-semibold">
                        {m.share}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isTop
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                            : m.revenue > monthlyAvgRevenue
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : m.revenue > 0
                            ? "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isTop ? "Peak Month" : m.revenue > monthlyAvgRevenue ? "Above Avg" : m.revenue > 0 ? "Active" : "No Sales"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/20 font-bold text-xs sm:text-sm">
                <td className="py-3 px-3 font-black text-foreground">Annual Total</td>
                <td className="py-3 px-3 text-right font-mono text-primary font-black">
                  {formatNPR(totalYearRevenue)}
                </td>
                <td className="py-3 px-3 text-center font-bold">{totalYearOrders}</td>
                <td className="py-3 px-3 text-right font-mono">
                  {totalYearOrders > 0 ? formatNPR(Math.round(totalYearRevenue / totalYearOrders)) : "Rs 0"}
                </td>
                <td className="py-3 px-3 text-center">100%</td>
                <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                  {targetPercentage >= 100 ? "Goal Reached" : `${targetPercentage}% Achieved`}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Edit Year Target Dialog ─────────────────────────────────────── */}
      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Set Annual Revenue Target for {selectedYear}</span>
            </DialogTitle>
            <DialogDescription>
              Define your financial revenue goal for {selectedYear}. This will dynamically calculate
              your monthly pacing and progress bars.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label htmlFor="target-input" className="text-xs font-semibold text-foreground">
                Revenue Goal (NPR)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-muted-foreground">
                  Rs
                </span>
                <Input
                  id="target-input"
                  type="text"
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="pl-9 font-mono font-bold"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Quick options:{" "}
                <button
                  type="button"
                  onClick={() => setTargetInput("1000000")}
                  className="text-primary underline hover:text-primary/80 mr-2"
                >
                  10 Lakhs (1M)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetInput("2500000")}
                  className="text-primary underline hover:text-primary/80 mr-2"
                >
                  25 Lakhs (2.5M)
                </button>
                <button
                  type="button"
                  onClick={() => setTargetInput("5000000")}
                  className="text-primary underline hover:text-primary/80"
                >
                  50 Lakhs (5M)
                </button>
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTargetDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTarget}>
              Save Target
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
