import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Ticket,
  Plus,
  Pencil,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Percent,
  Banknote,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { formatBsDate } from "@/lib/bikramSambat";
import { BsDatePicker } from "@/components/admin/BsDatePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsManagement,
});

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  value: number;
  min_order: number;
  max_discount: number | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  code: "",
  description: "",
  discount_type: "percent" as "percent" | "fixed",
  value: "",
  min_order: "0",
  max_discount: "",
  expires_at: "",
  usage_limit: "",
  is_active: true,
};

function CouponsSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <Skeleton className="h-7 sm:h-8 w-40 sm:w-44 rounded-lg" />
        <Skeleton className="h-8 sm:h-10 w-32 sm:w-36 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-2.5 sm:p-4 space-y-1.5">
            <Skeleton className="h-3 w-16 sm:w-20 rounded" />
            <Skeleton className="h-5 sm:h-7 w-10 sm:w-14 rounded" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 sm:space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2.5 sm:py-3 border-b last:border-0">
            <div className="space-y-1 sm:space-y-1.5">
              <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 rounded" />
              <Skeleton className="h-3 w-40 sm:w-56 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
              <Skeleton className="h-7 sm:h-8 w-7 sm:w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsManagement() {
  const { isNepali } = useI18n();
  const qc = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  // Form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  // Delete states
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Coupons (tries backend /api/admin/coupons first, then Supabase client)
  const { data: list = [], isLoading, refetch } = useQuery<Coupon[]>({
    queryKey: ["admin", "coupons"],
    queryFn: async () => {
      try {
        const res = await api.get<{ coupons: Coupon[] }>("/admin/coupons");
        if (res && Array.isArray(res.coupons)) {
          return res.coupons;
        }
      } catch (err) {
        console.warn("[Admin Coupons] Backend endpoint fallback to Supabase client:", err);
      }

      // Fallback direct Supabase query
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Admin Coupons] Supabase query error:", error);
        return [];
      }
      return (data as unknown as Coupon[]) ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });

  // ───────────────────────────────────────────────────────────────────────────
  // 1. INSERT (Create Coupon)
  // ───────────────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return toast.error("Code must be 3–30 letters/numbers (e.g. WELCOME10, SAVE50)");
    }
    if (!(value > 0)) {
      return toast.error("Discount value must be greater than 0");
    }
    if (form.discount_type === "percent" && value > 99) {
      return toast.error("Percentage discount cannot exceed 99%");
    }

    setIsSubmitting(true);
    try {
      try {
        await api.post("/admin/coupons", {
          code,
          description: form.description || null,
          discount_type: form.discount_type,
          value,
          min_order: Number(form.min_order) || 0,
          max_discount: form.max_discount ? Number(form.max_discount) : null,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          is_active: form.is_active,
        });
      } catch {
        // Fallback to direct supabase
        const { error } = await supabase.from("coupons").insert({
          code,
          description: form.description || null,
          discount_type: form.discount_type,
          value,
          min_order: Number(form.min_order) || 0,
          max_discount: form.max_discount ? Number(form.max_discount) : null,
          usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          is_active: form.is_active,
        });
        if (error) throw error;
      }

      toast.success(`Coupon ${code} created successfully!`);
      setForm(emptyForm);
      setIsCreateOpen(false);
      void refresh();
    } catch (err: any) {
      const msg = err?.message || "Failed to create coupon";
      toast.error(msg.includes("duplicate") || msg.includes("23505") ? `Code ${code} already exists` : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2. UPDATE / EDIT (Edit Coupon)
  // ───────────────────────────────────────────────────────────────────────────
  const startEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setEditForm({
      code: c.code,
      description: c.description || "",
      discount_type: c.discount_type,
      value: String(c.value),
      min_order: String(c.min_order ?? 0),
      max_discount: c.max_discount ? String(c.max_discount) : "",
      expires_at: c.expires_at || "",
      usage_limit: c.usage_limit ? String(c.usage_limit) : "",
      is_active: c.is_active,
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;

    const code = editForm.code.trim().toUpperCase();
    const value = Number(editForm.value);

    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return toast.error("Code must be 3–30 letters/numbers");
    }
    if (!(value > 0)) {
      return toast.error("Discount value must be greater than 0");
    }
    if (editForm.discount_type === "percent" && value > 99) {
      return toast.error("Percentage discount cannot exceed 99%");
    }

    const payload = {
      id: editingCoupon.id,
      code,
      description: editForm.description || null,
      discount_type: editForm.discount_type as any,
      value,
      min_order: Number(editForm.min_order) || 0,
      max_discount: editForm.max_discount ? Number(editForm.max_discount) : null,
      usage_limit: editForm.usage_limit ? parseInt(editForm.usage_limit, 10) : null,
      expires_at: editForm.expires_at ? new Date(editForm.expires_at).toISOString() : null,
      is_active: editForm.is_active,
    };

    // Optimistically update list in cache
    const prevList = qc.getQueryData<Coupon[]>(["admin", "coupons"]) || [];
    qc.setQueryData<Coupon[]>(["admin", "coupons"], (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === editingCoupon.id ? { ...c, ...payload } : c));
    });

    setEditingCoupon(null);
    toast.success(`Coupon ${code} updated successfully!`, { id: `coupon-edit-${editingCoupon.id}`, duration: 2000 });
    setIsEditing(true);

    try {
      try {
        await api.put("/admin/coupons", payload);
      } catch {
        const { error } = await supabase
          .from("coupons")
          .update(payload)
          .eq("id", payload.id);
        if (error) throw error;
      }
    } catch (err: any) {
      qc.setQueryData<Coupon[]>(["admin", "coupons"], prevList);
      toast.error(err?.message || "Failed to update coupon", { id: `coupon-edit-${payload.id}` });
    } finally {
      setIsEditing(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 3. DELETE (Optimistic Fast Delete)
  // ───────────────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!couponToDelete) return;
    const target = couponToDelete;
    setIsDeleting(true);

    const prevList = qc.getQueryData<Coupon[]>(["admin", "coupons"]) || [];
    // Optimistically remove immediately from UI
    qc.setQueryData<Coupon[]>(["admin", "coupons"], (old) =>
      old ? old.filter((c) => c.id !== target.id) : []
    );

    setCouponToDelete(null);
    toast.success(`Coupon ${target.code} deleted`, { id: `coupon-delete-${target.id}`, duration: 2000 });

    try {
      try {
        await api.delete(`/admin/coupons?id=${target.id}`);
      } catch {
        const { error } = await supabase.from("coupons").delete().eq("id", target.id);
        if (error) throw error;
      }
    } catch (err: any) {
      qc.setQueryData<Coupon[]>(["admin", "coupons"], prevList);
      toast.error(err?.message || "Failed to delete coupon", { id: `coupon-delete-${target.id}` });
    } finally {
      setIsDeleting(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 4. TOGGLE ACTIVE (Instant Optimistic Switch Update - 0ms Lag)
  // ───────────────────────────────────────────────────────────────────────────
  const toggleActive = async (id: string, active: boolean) => {
    // 1. Snapshot previous list for rollback if needed
    const prevList = qc.getQueryData<Coupon[]>(["admin", "coupons"]) || [];

    // 2. Synchronous optimistic state update in React Query cache (0ms instant switch reaction)
    qc.setQueryData<Coupon[]>(["admin", "coupons"], (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === id ? { ...c, is_active: active } : c));
    });

    // 3. Instant toast with fixed ID to eliminate multi-stacking toasts
    toast.success(active ? "Coupon activated" : "Coupon paused", {
      id: `coupon-status-${id}`,
      duration: 2000,
    });

    // 4. Asynchronous background persistence
    try {
      try {
        await api.put("/admin/coupons", { id, is_active: active });
      } catch {
        const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id);
        if (error) throw error;
      }
    } catch (err: any) {
      // Revert if background update fails
      qc.setQueryData<Coupon[]>(["admin", "coupons"], prevList);
      toast.error(err?.message || "Failed to update status", {
        id: `coupon-status-${id}`,
      });
    }
  };

  // Filtered coupons
  const now = new Date();
  const filteredList = useMemo(() => {
    return list.filter((c) => {
      const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;

      // Status filter
      if (filter === "active" && (!c.is_active || isExpired)) return false;
      if (filter === "inactive" && c.is_active) return false;
      if (filter === "expired" && !isExpired) return false;

      // Search query
      if (search) {
        const term = search.toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(term);
        const descMatch = (c.description || "").toLowerCase().includes(term);
        return codeMatch || descMatch;
      }
      return true;
    });
  }, [list, filter, search]);

  // Counts
  const activeCount = list.filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now)).length;
  const expiredCount = list.filter((c) => c.expires_at && new Date(c.expires_at) < now).length;
  const totalUses = list.reduce((acc, c) => acc + (c.used_count || 0), 0);

  if (isLoading) return <CouponsSkeleton />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span>{isNepali ? "कुपन तथा छुट व्यवस्थापन" : "Coupons & Discounts"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {isNepali
              ? "कार्ट र चेकआउटका लागि प्रोमो कोडहरू सिर्जना, सम्पादन र व्यवस्थापन गर्नुहोस्"
              : "Create, edit, toggle, and manage promo codes for cart & checkout"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="gap-1.5 h-8 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>{isNepali ? "ताजा गर्नुहोस्" : "Refresh"}</span>
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="gap-1.5 h-8 text-xs shadow-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>{isNepali ? "+ नयाँ कुपन थप्नुहोस्" : "Create Coupon"}</span>
          </Button>
        </div>
      </div>

      {/* Metric Cards: Compact 2x2 grid on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5">
        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Total Coupons</p>
            <Ticket className="h-3.5 w-3.5 text-muted-foreground/60 hidden xs:block" />
          </div>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-black text-foreground">{list.length}</p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Active Now</p>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60 hidden xs:block" />
          </div>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{activeCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Expired</p>
            <Clock className="h-3.5 w-3.5 text-amber-500/60 hidden xs:block" />
          </div>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{expiredCount}</p>
        </div>

        <div className="rounded-xl border bg-card p-3 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">Redemptions</p>
            <Percent className="h-3.5 w-3.5 text-muted-foreground/60 hidden xs:block" />
          </div>
          <p className="mt-0.5 sm:mt-1 text-xl sm:text-2xl font-black text-foreground">{totalUses}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search coupon code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 sm:h-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {(
            [
              { id: "all", label: "All" },
              { id: "active", label: `Active (${activeCount})` },
              { id: "inactive", label: "Inactive" },
              { id: "expired", label: `Expired (${expiredCount})` },
            ] as const
          ).map((t) => (
            <Button
              key={t.id}
              variant={filter === t.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(t.id)}
              className="h-7 sm:h-8 text-[11px] sm:text-xs px-2.5 sm:px-3 whitespace-nowrap"
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Coupons List / Table */}
      {filteredList.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-base font-medium text-foreground">No coupons found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || filter !== "all"
              ? "No coupons match the current search or status filter."
              : "No coupons exist yet. Click 'Create Coupon' above to create your first discount code."}
          </p>
          {(search || filter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="mt-3 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden shadow-xs divide-y divide-border">
          {filteredList.map((c) => {
            const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;
            const isAtLimit = c.usage_limit ? c.used_count >= c.usage_limit : false;

            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3 sm:p-5 hover:bg-muted/30 transition-colors"
              >
                {/* Left: Code, badges & details */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-base font-bold text-foreground bg-primary/10 text-primary px-2.5 py-0.5 rounded-md border border-primary/20">
                      {c.code}
                    </span>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        c.discount_type === "percent"
                          ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                      }`}
                    >
                      {c.discount_type === "percent" ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                    </span>

                    {isExpired ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        Expired
                      </span>
                    ) : isAtLimit ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Usage limit reached
                      </span>
                    ) : c.is_active ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                        Paused
                      </span>
                    )}
                  </div>

                  {c.description && (
                    <p className="text-sm text-foreground/80 font-medium">{c.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      Min. Order: <b className="text-foreground">{formatNPR(c.min_order)}</b>
                    </span>
                    {c.max_discount && (
                      <span>
                        Max Discount: <b className="text-foreground">{formatNPR(c.max_discount)}</b>
                      </span>
                    )}
                    <span>
                      Used:{" "}
                      <b className="text-foreground">
                        {c.used_count}
                        {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                      </b>
                    </span>
                    {c.expires_at && (
                      <span
                        className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded text-[11px] ${
                          isExpired
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        <Clock className="h-3 w-3" />
                        <span>
                          {isExpired ? "Expired BS: " : "Deadline: "}
                          <strong className="font-semibold">{formatBsDate(c.expires_at, "medium")}</strong>
                        </span>
                        <span className="text-[10px] opacity-80 hidden sm:inline">
                          ({formatBsDate(c.expires_at, "devanagari")})
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions (Toggle, Edit, Delete) */}
                <div className="flex items-center gap-3 shrink-0 sm:border-l sm:pl-5">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={c.is_active}
                      onCheckedChange={(val) => void toggleActive(c.id, val)}
                      aria-label="Toggle active"
                    />
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {c.is_active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(c)}
                    className="h-8 gap-1 text-xs"
                    title="Edit coupon details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCouponToDelete(c)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    title="Delete coupon"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* CREATE COUPON DIALOG (INSERT) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Create New Coupon
            </DialogTitle>
            <DialogDescription>
              Set up a promo code with custom discount rules, order minimums, and usage limits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="create-code" className="text-xs font-semibold">
                  Coupon Code *
                </Label>
                <Input
                  id="create-code"
                  placeholder="e.g. WELCOME10"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-type" className="text-xs font-semibold">
                  Discount Type *
                </Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(v: "percent" | "fixed") => setForm({ ...form, discount_type: v })}
                >
                  <SelectTrigger id="create-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (% off)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (Rs. off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-value" className="text-xs font-semibold">
                  {form.discount_type === "percent" ? "Percentage (% off) *" : "Fixed Discount (Rs.) *"}
                </Label>
                <Input
                  id="create-value"
                  type="number"
                  min="1"
                  max={form.discount_type === "percent" ? "99" : undefined}
                  step="any"
                  placeholder={form.discount_type === "percent" ? "10" : "150"}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-min" className="text-xs font-semibold">
                  Minimum Order (Rs.)
                </Label>
                <Input
                  id="create-min"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-max" className="text-xs font-semibold">
                  Max Discount Cap (Rs., optional)
                </Label>
                <Input
                  id="create-max"
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="create-limit" className="text-xs font-semibold">
                  Usage Limit (Total times, optional)
                </Label>
                <Input
                  id="create-limit"
                  type="number"
                  min="1"
                  placeholder="e.g. 100"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <BsDatePicker
                  id="create-expires"
                  label="Coupon Expiry Deadline (Bikram Sambat BS)"
                  value={form.expires_at || null}
                  onChange={(val) => setForm({ ...form, expires_at: val || "" })}
                  placeholder="No expiration (Runs indefinitely in BS)"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="create-desc" className="text-xs font-semibold">
                  Description / Customer Note (optional)
                </Label>
                <Input
                  id="create-desc"
                  placeholder="e.g. 10% off for all new registered customers"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="create-active"
                checked={form.is_active}
                onCheckedChange={(val) => setForm({ ...form, is_active: val })}
              />
              <Label htmlFor="create-active" className="text-xs cursor-pointer">
                Activate coupon immediately
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save & Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* EDIT COUPON DIALOG (UPDATE / EDIT) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Coupon {editingCoupon?.code}
            </DialogTitle>
            <DialogDescription>
              Update discount rules, minimum order amounts, limits, or validity for this coupon.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-code" className="text-xs font-semibold">
                  Coupon Code *
                </Label>
                <Input
                  id="edit-code"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-type" className="text-xs font-semibold">
                  Discount Type *
                </Label>
                <Select
                  value={editForm.discount_type}
                  onValueChange={(v: "percent" | "fixed") => setEditForm({ ...editForm, discount_type: v })}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (% off)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (Rs. off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-value" className="text-xs font-semibold">
                  {editForm.discount_type === "percent" ? "Percentage (% off) *" : "Fixed Discount (Rs.) *"}
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  min="1"
                  max={editForm.discount_type === "percent" ? "99" : undefined}
                  step="any"
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-min" className="text-xs font-semibold">
                  Minimum Order (Rs.)
                </Label>
                <Input
                  id="edit-min"
                  type="number"
                  min="0"
                  value={editForm.min_order}
                  onChange={(e) => setEditForm({ ...editForm, min_order: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-max" className="text-xs font-semibold">
                  Max Discount Cap (Rs., optional)
                </Label>
                <Input
                  id="edit-max"
                  type="number"
                  min="1"
                  placeholder="None"
                  value={editForm.max_discount}
                  onChange={(e) => setEditForm({ ...editForm, max_discount: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-limit" className="text-xs font-semibold">
                  Usage Limit (Total times, optional)
                </Label>
                <Input
                  id="edit-limit"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={editForm.usage_limit}
                  onChange={(e) => setEditForm({ ...editForm, usage_limit: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <BsDatePicker
                  id="edit-expires"
                  label="Coupon Expiry Deadline (Bikram Sambat BS)"
                  value={editForm.expires_at || null}
                  onChange={(val) => setEditForm({ ...editForm, expires_at: val || "" })}
                  placeholder="No expiration (Runs indefinitely in BS)"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="edit-desc" className="text-xs font-semibold">
                  Description / Customer Note (optional)
                </Label>
                <Input
                  id="edit-desc"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="edit-active"
                checked={editForm.is_active}
                onCheckedChange={(val) => setEditForm({ ...editForm, is_active: val })}
              />
              <Label htmlFor="edit-active" className="text-xs cursor-pointer">
                Coupon is active
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingCoupon(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Saving changes..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION ALERT (DELETE) */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      <AlertDialog open={!!couponToDelete} onOpenChange={(open) => !open && setCouponToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Coupon {couponToDelete?.code}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this coupon? Customers will no longer be able
              to apply this code at checkout. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Permanently Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
