import { createFileRoute } from "@tanstack/react-router";
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
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BS_MONTHS,
  getCurrentBsYear,
  getCurrentBsMonth,
  getCurrentBsDay,
  getNepaliDate,
  formatBsDate,
  formatBsYearLabel,
  toDevanagariNumerals,
} from "@/lib/bikramSambat";

export const Route = createFileRoute("/_authenticated/admin/insights")({
  head: () => ({
    meta: [
      { title: "B.S. Revenue Insights & Analytics — DOVAN Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  pendingComponent: InsightsSkeleton,
  component: AdminInsights,
});

const PIE_COLORS = [
  "#10B981", // Baisakh - Emerald
  "#3B82F6", // Jestha - Blue
  "#F59E0B", // Ashadh - Amber
  "#EC4899", // Shrawan - Pink
  "#8B5CF6", // Bhadra - Purple
  "#06B6D4", // Ashwin - Cyan
  "#F97316", // Kartik - Orange
  "#6366F1", // Mangsir - Indigo
  "#14B8A6", // Poush - Teal
  "#84CC16", // Magh - Lime
  "#E11D48", // Falgun - Rose
  "#0EA5E9", // Chaitra - Sky
];

type MonthFilterMode = "all" | "past" | "q1" | "q2" | "q3" | "q4" | number;

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 sm:pb-4 border-b border-border/70 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-3.5 w-72 rounded-md" />
        </div>
        <Skeleton className="h-8 w-44 rounded-lg" />
      </div>

      <div className="rounded-xl border border-border/80 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border/60 grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-3 w-20 rounded" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 sm:h-80 rounded-xl" />
        <Skeleton className="h-72 sm:h-80 rounded-xl" />
      </div>

      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function AdminInsights() {
  const currentBsYear = getCurrentBsYear();
  const currentBsMonth = getCurrentBsMonth(); // 0 (Baisakh) to 11 (Chaitra)
  const currentBsDay = getCurrentBsDay();

  // Selected BS Year & Month Filter
  const [selectedBsYear, setSelectedBsYear] = useState<number>(currentBsYear);
  const [monthFilter, setMonthFilter] = useState<MonthFilterMode>("all");

  // Custom Target Goal Dialog
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [targetInput, setTargetInput] = useState<string>("");

  // Store & Retrieve Yearly Target for the selected BS year
  const [yearTarget, setYearTarget] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`dovan_revenue_target_bs_${selectedBsYear}`);
      if (saved) return Number(saved) || 2500000;
    }
    return 2500000; // Default NPR 25 Lakhs
  });

  // Sync year target when selected BS year changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`dovan_revenue_target_bs_${selectedBsYear}`);
      setYearTarget(saved ? Number(saved) || 2500000 : 2500000);
    }
  }, [selectedBsYear]);

  // Save new target
  const handleSaveTarget = () => {
    const val = Number(targetInput.replace(/[^0-9]/g, ""));
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid target amount in NPR");
      return;
    }
    setYearTarget(val);
    if (typeof window !== "undefined") {
      localStorage.setItem(`dovan_revenue_target_bs_${selectedBsYear}`, String(val));
    }
    toast.success(`Revenue target for ${selectedBsYear} BS set to ${formatNPR(val)}`);
    setTargetDialogOpen(false);
  };

  // Stepper handlers for Month Filter dropdown
  const handlePrevMonth = () => {
    if (typeof monthFilter === "number") {
      if (monthFilter === 0) setMonthFilter("all");
      else setMonthFilter(monthFilter - 1);
    } else if (monthFilter === "all") {
      setMonthFilter(currentBsMonth);
    } else {
      setMonthFilter("all");
    }
  };

  const handleNextMonth = () => {
    if (typeof monthFilter === "number") {
      if (monthFilter === 11) setMonthFilter("all");
      else setMonthFilter(monthFilter + 1);
    } else if (monthFilter === "all") {
      setMonthFilter(currentBsMonth);
    } else {
      setMonthFilter(0);
    }
  };

  // Fetch all orders and convert dates to Bikram Sambat (BS)
  const { data: rawOrders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin", "insights", "orders", "bs"],
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

        return (data ?? []).map((o: any) => {
          const rawTotal = o.total ?? (o.total_paise ? o.total_paise / 100 : 0);
          const createdAt = o.created_at ?? new Date().toISOString();
          const nd = getNepaliDate(createdAt);
          const bs = nd.getBS();

          return {
            id: o.id,
            total: Number(rawTotal),
            status: (o.status ?? "pending").toLowerCase(),
            payment_status: (o.payment_status ?? "pending").toLowerCase(),
            created_at: createdAt,
            bsYear: bs.year,
            bsMonth: bs.month, // 0 to 11 (Baisakh to Chaitra)
            bsDay: bs.date,
          };
        });
      } catch (err) {
        console.error("Failed to fetch orders for BS insights:", err);
        return [];
      }
    },
  });

  // Extract available BS years dynamically from current BS year (+7 years ahead, past years, and orders)
  const availableBsYears = useMemo(() => {
    const orderYears = rawOrders.map((o) => o.bsYear);
    const set = new Set<number>();

    // Future BS Years: dynamic window up to +7 years into the future (e.g. 2084, 2085, 2086, 2087, 2088, 2089, 2090 BS)
    for (let offset = 7; offset >= 1; offset--) {
      set.add(currentBsYear + offset);
    }

    // Current BS Year (e.g. 2083 BS)
    set.add(currentBsYear);

    // Past BS Years: at least 7 past years (e.g. 2082, 2081, 2080, 2079, 2078, 2077, 2076 BS)
    for (let offset = 1; offset <= 7; offset++) {
      set.add(currentBsYear - offset);
    }

    // Include any historical years from actual order records
    orderYears.forEach((yr) => {
      if (yr && yr >= 2050 && yr <= 2150) set.add(yr);
    });

    // If admin navigated via steppers beyond standard window, keep it in the dropdown
    if (selectedBsYear && selectedBsYear >= 2050 && selectedBsYear <= 2150) {
      set.add(selectedBsYear);
    }

    return Array.from(set).sort((a, b) => b - a);
  }, [rawOrders, currentBsYear, selectedBsYear]);

  // Filter orders for the selected BS year (excluding cancelled/refunded)
  const yearlyOrders = useMemo(() => {
    return rawOrders.filter(
      (o) => o.bsYear === selectedBsYear && !["cancelled", "refunded"].includes(o.status)
    );
  }, [rawOrders, selectedBsYear]);

  // Aggregate Month-by-Month Data for all 12 Bikram Sambat months
  const monthlyData = useMemo(() => {
    const totalYearRevenue = yearlyOrders.reduce((sum, o) => sum + Number(o.total), 0);

    return BS_MONTHS.map((bm) => {
      const monthOrders = yearlyOrders.filter((o) => o.bsMonth === bm.index);
      const revenue = monthOrders.reduce((sum, o) => sum + Number(o.total), 0);
      const ordersCount = monthOrders.length;
      const aov = ordersCount > 0 ? Math.round(revenue / ordersCount) : 0;
      const share = totalYearRevenue > 0 ? (revenue / totalYearRevenue) * 100 : 0;

      // Status relative to current time
      const isCurrentMonth = selectedBsYear === currentBsYear && bm.index === currentBsMonth;
      const isPastMonth =
        selectedBsYear < currentBsYear ||
        (selectedBsYear === currentBsYear && bm.index < currentBsMonth);
      const isUpcomingMonth =
        selectedBsYear > currentBsYear ||
        (selectedBsYear === currentBsYear && bm.index > currentBsMonth);

      return {
        monthIndex: bm.index,
        name: bm.name,
        nameNp: bm.nameNp,
        shortName: bm.short,
        shortNp: bm.shortNp,
        quarter: bm.quarter,
        revenue,
        ordersCount,
        aov,
        share: Number(share.toFixed(1)),
        color: PIE_COLORS[bm.index % PIE_COLORS.length],
        isCurrentMonth,
        isPastMonth,
        isUpcomingMonth,
      };
    });
  }, [yearlyOrders, selectedBsYear, currentBsYear, currentBsMonth]);

  // Filtered dataset based on admin's month selection toggle
  const filteredMonthlyData = useMemo(() => {
    if (monthFilter === "all") return monthlyData;
    if (monthFilter === "past") {
      // Past months (including current month) in current BS year, or all 12 if past year
      if (selectedBsYear < currentBsYear) return monthlyData;
      if (selectedBsYear > currentBsYear) return [];
      return monthlyData.filter((m) => m.monthIndex <= currentBsMonth);
    }
    if (monthFilter === "q1") return monthlyData.filter((m) => m.quarter === 1);
    if (monthFilter === "q2") return monthlyData.filter((m) => m.quarter === 2);
    if (monthFilter === "q3") return monthlyData.filter((m) => m.quarter === 3);
    if (monthFilter === "q4") return monthlyData.filter((m) => m.quarter === 4);
    if (typeof monthFilter === "number") {
      return monthlyData.filter((m) => m.monthIndex === monthFilter);
    }
    return monthlyData;
  }, [monthlyData, monthFilter, selectedBsYear, currentBsYear, currentBsMonth]);

  // Key Aggregate KPIs for the selected scope
  const totalFilteredRevenue = useMemo(
    () => filteredMonthlyData.reduce((sum, m) => sum + m.revenue, 0),
    [filteredMonthlyData]
  );

  const totalFilteredOrders = useMemo(
    () => filteredMonthlyData.reduce((sum, m) => sum + m.ordersCount, 0),
    [filteredMonthlyData]
  );

  const totalFullYearRevenue = useMemo(
    () => monthlyData.reduce((sum, m) => sum + m.revenue, 0),
    [monthlyData]
  );

  const targetPercentage = useMemo(() => {
    if (!yearTarget || yearTarget <= 0) return 0;
    return Math.min(100, Number(((totalFullYearRevenue / yearTarget) * 100).toFixed(1)));
  }, [totalFullYearRevenue, yearTarget]);

  const targetRemaining = Math.max(0, yearTarget - totalFullYearRevenue);

  // Identify Best Performing Month in Bikram Sambat
  const topMonth = useMemo(() => {
    const sorted = [...monthlyData].sort((a, b) => b.revenue - a.revenue);
    return sorted[0]?.revenue > 0 ? sorted[0] : null;
  }, [monthlyData]);

  // Average Monthly Revenue Run Rate
  const monthlyAvgRevenue = Math.round(totalFullYearRevenue / 12);

  // Pie chart data: Shows BS months with revenue > 0
  const pieChartData = useMemo(() => {
    const active = filteredMonthlyData.filter((m) => m.revenue > 0);
    if (active.length > 0) return active;
    // Fallback if no revenue yet: show quarterly mockup slices with 0 revenue
    return [
      { name: "Q1: Baisakh - Ashadh", revenue: 0, share: 25, color: "#10B981" },
      { name: "Q2: Shrawan - Ashwin", revenue: 0, share: 25, color: "#3B82F6" },
      { name: "Q3: Kartik - Poush", revenue: 0, share: 25, color: "#F97316" },
      { name: "Q4: Magh - Chaitra", revenue: 0, share: 25, color: "#8B5CF6" },
    ];
  }, [filteredMonthlyData]);

  if (isLoading) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* ── Top Header & Consolidated B.S. Filter Controls ──────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-border/70 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Financial Insights
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Bikram Sambat (B.S.)
            </span>
          </div>
          <p className="text-xs text-foreground/75 font-medium mt-0.5">
            Bikram Sambat monthly revenue trajectory, pie chart distribution & yearly goal pacing.
          </p>
        </div>

        {/* Year Controls & Target Setter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Previous / Next BS Year Stepper */}
          <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setSelectedBsYear((prev) => prev - 1)}
              className="p-1 rounded-md hover:bg-card text-foreground/70 hover:text-foreground transition cursor-pointer"
              title="Previous BS Year"
              aria-label="Previous BS Year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <div className="px-2 py-0.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <select
                value={selectedBsYear}
                onChange={(e) => setSelectedBsYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                aria-label="Select Bikram Sambat Year"
              >
                {availableBsYears.map((yr) => (
                  <option key={yr} value={yr} className="bg-popover text-foreground font-semibold">
                    {yr} BS
                    {yr === currentBsYear ? " ★ Current" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setSelectedBsYear((prev) => prev + 1)}
              className="p-1 rounded-md hover:bg-card text-foreground/70 hover:text-foreground transition cursor-pointer"
              title="Next BS Year"
              aria-label="Next BS Year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick jump to current year if not selected */}
          {selectedBsYear !== currentBsYear && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBsYear(currentBsYear)}
              className="h-8 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/10 rounded-lg"
            >
              Current ({currentBsYear} BS)
            </Button>
          )}

          {/* Set Target Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetInput(String(yearTarget));
              setTargetDialogOpen(true);
            }}
            className="h-8 px-2.5 gap-1.5 text-xs bg-card hover:bg-muted font-semibold rounded-lg border-border/80 text-foreground"
          >
            <Target className="h-3.5 w-3.5 text-primary" />
            <span>Set Target</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="h-8 px-2.5 text-xs text-foreground font-medium rounded-lg border-border/80"
            title="Refresh order data"
          >
            <RefreshCw className={cn("h-3.5 w-3.5 mr-1.5", isFetching && "animate-spin text-primary")} />
            <span>{isFetching ? "Syncing..." : "Sync"}</span>
          </Button>
        </div>
      </div>

      {/* ── Segmented Fast Scope Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setMonthFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer border",
              monthFilter === "all"
                ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                : "bg-card text-foreground/75 border-border/80 hover:text-foreground hover:bg-muted/50"
            )}
          >
            All Year (12 Mos)
          </button>
          <button
            type="button"
            onClick={() => setMonthFilter("past")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer border",
              monthFilter === "past"
                ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                : "bg-card text-foreground/75 border-border/80 hover:text-foreground hover:bg-muted/50"
            )}
          >
            Past YTD
          </button>
          <button
            type="button"
            onClick={() => setMonthFilter(currentBsMonth)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 cursor-pointer border",
              monthFilter === currentBsMonth
                ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                : "bg-card text-foreground/75 border-border/80 hover:text-foreground hover:bg-muted/50"
            )}
            title="Current Month"
          >
            This Month ({BS_MONTHS[currentBsMonth]?.nameNp})
          </button>
        </div>

        {/* Dropdown for specific month selection */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-foreground/70 font-semibold hidden sm:inline">Scope:</span>
          <select
            value={String(monthFilter)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "all" || val === "past" || val.startsWith("q")) {
                setMonthFilter(val as any);
              } else {
                setMonthFilter(Number(val));
              }
            }}
            className="h-8 rounded-lg border border-border/80 bg-card px-2.5 text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            aria-label="Select Bikram Sambat Month or Scope"
          >
            <optgroup label="Scope & Overview">
              <option value="all">All 12 Months</option>
              <option value="past">Past Months / YTD</option>
            </optgroup>
            <optgroup label="Quarters">
              <option value="q1">Q1: Baisakh – Ashadh</option>
              <option value="q2">Q2: Shrawan – Ashwin</option>
              <option value="q3">Q3: Kartik – Poush</option>
              <option value="q4">Q4: Magh – Chaitra</option>
            </optgroup>
            <optgroup label="Bikram Sambat Months">
              {BS_MONTHS.map((bm) => (
                <option key={bm.index} value={String(bm.index)}>
                  {bm.index + 1}. {bm.name}
                  {selectedBsYear === currentBsYear && bm.index === currentBsMonth ? " ★ Current" : ""}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* ── Key Metrics Data Row (Seamless, borderless pillars, zero card boxes) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-3 border-b border-border/70">
        {/* KPI 1: Annual BS Target Achievement */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-foreground/75">
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {selectedBsYear} BS Goal
              </span>
              <button
                type="button"
                onClick={() => {
                  setTargetInput(String(yearTarget));
                  setTargetDialogOpen(true);
                }}
                className="text-foreground/70 hover:text-foreground transition p-0.5"
                title="Edit Target"
              >
                <Edit3 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </button>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                {targetPercentage}%
              </p>
              <span className="text-[11px] font-semibold text-foreground/70 truncate">
                Goal: {formatNPR(yearTarget)}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={targetPercentage} className="h-1.5" />
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 text-[11px] text-foreground/70 font-medium truncate">
            {targetRemaining > 0 ? (
              <span>
                <strong className="text-foreground font-bold">{formatNPR(targetRemaining)}</strong> remaining
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 shrink-0" /> Goal Reached!
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Total Revenue in Selected Scope */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-foreground/75">
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                {monthFilter === "all" ? `${selectedBsYear} BS Revenue` : "Scope Revenue"}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                Valid
              </span>
            </div>
            <div className="mt-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                {formatNPR(totalFilteredRevenue)}
              </p>
              <span className="text-[11px] text-foreground/70 font-medium block truncate">
                {totalFilteredOrders} fulfilled orders
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-foreground/70 font-medium">
            <span className="truncate">Monthly Avg</span>
            <strong className="text-foreground font-bold shrink-0">{formatNPR(monthlyAvgRevenue)}</strong>
          </div>
        </div>

        {/* KPI 3: Best Performing BS Month */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-foreground/75">
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">Top BS Month</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-500/15 px-1.5 py-0.2 rounded">
                Peak
              </span>
            </div>
            <div className="mt-1">
              <p className="text-lg sm:text-xl font-bold text-foreground tracking-tight truncate">
                {topMonth ? topMonth.name : "N/A"}
              </p>
              <span className="text-[11px] text-foreground/70 font-medium block truncate">
                {topMonth ? `${formatNPR(topMonth.revenue)} (${topMonth.share}%)` : "No orders recorded"}
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-foreground/70 font-medium">
            <span className="truncate">Orders Volume</span>
            <strong className="text-foreground font-bold shrink-0">{topMonth ? topMonth.ordersCount : 0}</strong>
          </div>
        </div>

        {/* KPI 4: Average Order Value */}
        <div className="space-y-1.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-foreground/75">
              <span className="text-[11px] font-bold uppercase tracking-wider truncate">Avg Order Value</span>
              <span className="text-[10px] font-bold text-sky-800 bg-sky-500/15 px-1.5 py-0.2 rounded">
                AOV
              </span>
            </div>
            <div className="mt-1">
              <p className="text-xl sm:text-2xl font-bold text-foreground tracking-tight truncate">
                {totalFilteredOrders > 0
                  ? formatNPR(Math.round(totalFilteredRevenue / totalFilteredOrders))
                  : "Rs 0"}
              </p>
              <span className="text-[11px] text-foreground/70 font-medium block truncate">
                Avg spend per order
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-foreground/70 font-medium">
            <span className="truncate">Active Months</span>
            <strong className="text-foreground font-bold shrink-0">
              {monthlyData.filter((m) => m.revenue > 0).length} / 12
            </strong>
          </div>
        </div>
      </div>

      {/* ── Dual Visualization Row: Monthly BS Bar Chart + Monthly BS Pie Chart (Seamless) ── */}
      <div className="grid gap-8 lg:grid-cols-2 py-4 border-b border-border/70">
        {/* CHART 1: Monthly BS Revenue Trajectory (12 Months Bar Chart) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                {selectedBsYear} BS Monthly Revenue Trajectory
              </h3>
              <p className="text-xs text-foreground/75 font-medium mt-0.5">
                Baisakh through Chaitra sales distribution in NPR.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-foreground/80">
              12 Months
            </span>
          </div>

          <div className="h-52 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" opacity={0.8} vertical={false} />
                <XAxis
                  dataKey="shortName"
                  fontSize={11}
                  stroke="#52525b"
                  tickLine={false}
                  axisLine={false}
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
                          <p className="font-bold text-foreground">
                            {d.name} ({d.nameNp}) {selectedBsYear} BS
                          </p>
                          <p className="text-primary font-bold text-sm mt-0.5">
                            {formatNPR(d.revenue)}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-3 text-[11px] text-foreground/70 font-medium">
                            <span>{d.ordersCount} orders</span>
                            <span>AOV: {formatNPR(d.aov)}</span>
                          </div>
                          <p className="text-[11px] text-foreground/70 font-medium mt-0.5">
                            {d.share}% of total {selectedBsYear} BS volume
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Bikram Sambat Monthly Revenue Share (Pie / Donut Chart) */}
        <div className="space-y-3 lg:border-l lg:border-border/70 lg:pl-8">
          <div className="flex items-center justify-between border-b border-border/70 pb-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                BS Monthly Revenue Contribution
              </h3>
              <p className="text-xs text-foreground/75 font-medium mt-0.5">
                Pie distribution of {selectedBsYear} BS earnings.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-foreground/80">
              BS Share %
            </span>
          </div>

          <div className="h-52 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0];
                      const d = p.payload;
                      return (
                        <div className="rounded-lg border border-border/80 bg-popover px-3 py-2 text-xs shadow-md">
                          <p className="font-bold text-foreground flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ backgroundColor: d.color }}
                            />
                            <span>
                              {d.name} {d.nameNp ? `(${d.nameNp})` : ""}
                            </span>
                          </p>
                          <p className="text-primary font-bold text-sm mt-0.5">
                            {formatNPR(d.revenue)}
                          </p>
                          <p className="text-[11px] text-foreground/70 font-medium mt-0.5">
                            {d.share}% of total {selectedBsYear} BS revenue
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={pieChartData}
                  dataKey={totalFullYearRevenue > 0 ? "revenue" : "share"}
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value: string) => (
                    <span className="text-[11px] text-foreground font-semibold">{value}</span>
                  )}
                  wrapperStyle={{ paddingTop: "4px", fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Detailed Month-by-Month Bikram Sambat Breakdown Table (Seamless) ── */}
      <div className="py-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/70 pb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-foreground">
              {selectedBsYear} BS Complete 12-Month Performance Table
            </h3>
            <p className="text-xs text-foreground/75 font-medium mt-0.5">
              Baisakh to Chaitra breakdown of revenue, orders volume, average order values & annual share.
            </p>
          </div>
          <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded-lg">
            Total {selectedBsYear} BS: {formatNPR(totalFullYearRevenue)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-foreground/75 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">BS Month</th>
                <th className="py-2.5 px-3 text-right">Revenue (NPR)</th>
                <th className="py-2.5 px-3 text-center">Orders</th>
                <th className="py-2.5 px-3 text-right">Avg Order Value</th>
                <th className="py-2.5 px-3 text-center">Annual Share</th>
                <th className="py-2.5 px-3 text-center">Performance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-xs">
              {filteredMonthlyData.map((m) => {
                const isTop = topMonth?.monthIndex === m.monthIndex && m.revenue > 0;
                return (
                  <tr
                    key={m.monthIndex}
                    className={cn(
                      "transition-colors",
                      m.isCurrentMonth
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-muted/40"
                    )}
                  >
                    <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <span>{m.name}</span>
                      <span className="text-foreground/70 font-normal">({m.nameNp})</span>
                      {m.isCurrentMonth && (
                        <span className="rounded bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.2">
                          Current
                        </span>
                      )}
                      {isTop && (
                        <span className="rounded bg-amber-500/15 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 border border-amber-500/30">
                          Peak
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">
                      {formatNPR(m.revenue)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium text-foreground/80">
                      {m.ordersCount}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-foreground/80">
                      {formatNPR(m.aov)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-medium">
                      <span className="inline-block px-2 py-0.5 rounded bg-muted text-foreground font-semibold">
                        {m.share}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={cn(
                          "inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase border",
                          isTop
                            ? "bg-amber-500/15 text-amber-800 border-amber-500/30"
                            : m.revenue > monthlyAvgRevenue
                            ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30"
                            : m.revenue > 0
                            ? "bg-blue-500/15 text-blue-800 border-blue-500/30"
                            : m.isUpcomingMonth
                            ? "bg-muted/50 text-foreground/50 border-transparent italic"
                            : "bg-muted text-foreground/70 border-transparent"
                        )}
                      >
                        {isTop
                          ? "Peak Month"
                          : m.revenue > monthlyAvgRevenue
                          ? "Above Avg"
                          : m.revenue > 0
                          ? "Active"
                          : m.isUpcomingMonth
                          ? "Upcoming"
                          : "No Sales"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border/80 bg-muted/20 font-bold text-xs sm:text-sm">
                <td className="py-3 px-3 font-bold text-foreground">
                  {monthFilter === "all" ? "Annual BS Total" : "Filtered Scope Total"}
                </td>
                <td className="py-3 px-3 text-right font-mono text-primary font-bold">
                  {formatNPR(totalFilteredRevenue)}
                </td>
                <td className="py-3 px-3 text-center font-bold text-foreground">{totalFilteredOrders}</td>
                <td className="py-3 px-3 text-right font-mono text-foreground">
                  {totalFilteredOrders > 0
                    ? formatNPR(Math.round(totalFilteredRevenue / totalFilteredOrders))
                    : "Rs 0"}
                </td>
                <td className="py-3 px-3 text-center text-foreground">
                  {monthFilter === "all"
                    ? "100%"
                    : `${((totalFilteredRevenue / (totalFullYearRevenue || 1)) * 100).toFixed(1)}%`}
                </td>
                <td className="py-3 px-3 text-center font-bold text-emerald-700">
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
              <span>Set Annual Revenue Goal for {selectedBsYear} BS</span>
            </DialogTitle>
            <DialogDescription>
              Define your financial revenue goal for {selectedBsYear} BS.
              This will dynamically calculate your monthly pacing and progress indicators.
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
