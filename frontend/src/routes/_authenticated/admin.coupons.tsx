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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  component: CouponsManagement,
  pendingComponent: CouponsSkeleton,
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

export function CouponsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-60 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="py-2.5 px-3 border-y border-border/80 flex items-center gap-4">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
      </div>

      <div className="border-b border-border/80 divide-y divide-border/60">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-4 px-3 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CouponsManagement() {
  const { isNepali } = useI18n();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive" | "expired">("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: list = [], isLoading, isRefetching, refetch } = useQuery<Coupon[]>({
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
      const payload = {
        code,
        description: form.description || null,
        discount_type: form.discount_type,
        value,
        min_order: Number(form.min_order) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: form.is_active,
      };

      try {
        await api.post("/admin/coupons", payload);
      } catch {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }

      toast.success(`Coupon ${code} created successfully!`);
      setForm(emptyForm);
      setIsCreateOpen(false);
      refresh();
    } catch (err: any) {
      const msg = err?.message || "Failed to create coupon";
      toast.error(msg.includes("duplicate") || msg.includes("23505") ? `Code ${code} already exists` : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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
        const { error } = await supabase.from("coupons").update(payload).eq("id", payload.id);
        if (error) throw error;
      }
    } catch (err: any) {
      qc.setQueryData<Coupon[]>(["admin", "coupons"], prevList);
      toast.error(err?.message || "Failed to update coupon", { id: `coupon-edit-${payload.id}` });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!couponToDelete) return;
    const target = couponToDelete;
    setIsDeleting(true);

    const prevList = qc.getQueryData<Coupon[]>(["admin", "coupons"]) || [];
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

  const toggleActive = async (id: string, active: boolean) => {
    const prevList = qc.getQueryData<Coupon[]>(["admin", "coupons"]) || [];
    qc.setQueryData<Coupon[]>(["admin", "coupons"], (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === id ? { ...c, is_active: active } : c));
    });

    toast.success(active ? "Coupon activated" : "Coupon paused", {
      id: `coupon-status-${id}`,
      duration: 2000,
    });

    try {
      try {
        await api.put("/admin/coupons", { id, is_active: active });
      } catch {
        const { error } = await supabase.from("coupons").update({ is_active: active }).eq("id", id);
        if (error) throw error;
      }
    } catch (err: any) {
      qc.setQueryData<Coupon[]>(["admin", "coupons"], prevList);
      toast.error(err?.message || "Failed to update status", { id: `coupon-status-${id}` });
    }
  };

  const now = new Date();

  // Metrics
  const activeCount = list.filter((c) => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now)).length;
  const expiredCount = list.filter((c) => c.expires_at && new Date(c.expires_at) < now).length;
  const totalUses = list.reduce((acc, c) => acc + (c.used_count || 0), 0);

  // Filtered List
  const filteredList = useMemo(() => {
    return list.filter((c) => {
      const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;

      if (filter === "active" && (!c.is_active || isExpired)) return false;
      if (filter === "inactive" && (c.is_active || isExpired)) return false;
      if (filter === "expired" && !isExpired) return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return c.code.toLowerCase().includes(term) || (c.description || "").toLowerCase().includes(term);
    });
  }, [list, filter, search, now]);

  if (isLoading) return <CouponsSkeleton />;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Console Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Promotions & Vouchers
            </h1>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground/80 font-bold">
              {list.length} CODES CONFIGURED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Configure discount promo codes, redemption thresholds, and expiration rules for checkout.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs cursor-pointer text-foreground font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Coupon
          </Button>
        </div>
      </div>

      {/* ── Single-Line Telemetry Status Ribbon (No Boxy Cards) ─────────── */}
      <div className="py-2.5 px-3 border-y border-border/80 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-xs font-mono bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Total Codes:
          </span>
          <span className="font-bold text-foreground">{list.length}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Active Now:
          </span>
          <span className="font-bold text-emerald-800">{activeCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Expired:
          </span>
          <span className="font-bold text-amber-800">{expiredCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-foreground/50 font-sans text-[11px] uppercase tracking-wider">
            Total Redemptions:
          </span>
          <span className="font-bold text-foreground">{totalUses} uses</span>
        </div>
      </div>

      {/* ── Search & Filter Segments ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/50" />
          <Input
            placeholder="Search code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-xs bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: `All (${list.length})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "inactive", label: "Inactive" },
              { id: "expired", label: `Expired (${expiredCount})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={cn(
                "text-xs px-3 py-1 font-medium transition cursor-pointer border-b-2 whitespace-nowrap",
                filter === t.id
                  ? "border-foreground text-foreground font-bold"
                  : "border-transparent text-foreground/60 hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Edge-to-Edge Matrix Table (Zero Box Cards) ───────────────────── */}
      <div className="overflow-x-auto border-y border-border/80">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="text-left uppercase text-foreground/75 text-[10.5px] bg-muted/40 font-semibold tracking-wider">
            <tr className="border-b border-border/80">
              <th className="py-2.5 px-3">Voucher Code</th>
              <th className="py-2.5 px-3">Discount Value</th>
              <th className="py-2.5 px-3">Order Thresholds</th>
              <th className="py-2.5 px-3">Usage & Redemptions</th>
              <th className="py-2.5 px-3">Expiry Deadline</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-foreground/60">
                  <Ticket className="mx-auto h-8 w-8 text-foreground/35 mb-2" />
                  <p className="text-sm font-medium text-foreground">No promo codes found</p>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    {search ? "No codes match your search query." : "Click 'Create Coupon' to add your first promo code."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredList.map((c) => {
                const isExpired = c.expires_at ? new Date(c.expires_at) < now : false;
                const isAtLimit = c.usage_limit ? c.used_count >= c.usage_limit : false;
                const percentLimit = c.usage_limit ? Math.min(100, Math.round((c.used_count / c.usage_limit) * 100)) : null;

                return (
                  <tr key={c.id} className="hover:bg-muted/30 transition">
                    <td className="p-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border/70 inline-block">
                          {c.code}
                        </span>
                        {c.description && (
                          <p className="text-[11px] text-foreground/65 mt-1 line-clamp-1">
                            {c.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10.5px] font-bold uppercase",
                          c.discount_type === "percent"
                            ? "bg-purple-500/15 text-purple-800 border-purple-500/30"
                            : "bg-emerald-500/15 text-emerald-800 border-emerald-500/30"
                        )}
                      >
                        {c.discount_type === "percent" ? `${c.value}% OFF` : `Rs. ${c.value} OFF`}
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="space-y-0.5 text-foreground/75">
                        <div>Min order: <span className="font-semibold text-foreground">{formatNPR(c.min_order)}</span></div>
                        {c.max_discount ? (
                          <div className="text-[10.5px] text-foreground/60">Max cap: {formatNPR(c.max_discount)}</div>
                        ) : null}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="font-mono text-foreground font-medium">
                          {c.used_count} / {c.usage_limit ? c.usage_limit : "∞"}
                        </div>
                        {percentLimit !== null && (
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border/50">
                            <div
                              className={cn(
                                "h-full transition-all",
                                isAtLimit ? "bg-rose-500" : "bg-primary"
                              )}
                              style={{ width: `${percentLimit}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="text-foreground/75 space-y-0.5">
                        {c.expires_at ? (
                          <>
                            <div className={cn(isExpired && "text-rose-800 font-semibold")}>
                              {new Date(c.expires_at).toLocaleDateString()}
                            </div>
                            <div className="text-[10px] text-foreground/50">
                              BS: {formatBsDate(c.expires_at)}
                            </div>
                          </>
                        ) : (
                          <span className="text-foreground/50 italic">No expiry</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={c.is_active && !isExpired && !isAtLimit}
                          disabled={isExpired || isAtLimit}
                          onCheckedChange={(val) => toggleActive(c.id, val)}
                        />
                        <span className="text-[10.5px] font-medium text-foreground/70">
                          {isExpired ? "Expired" : isAtLimit ? "Limit" : c.is_active ? "Active" : "Paused"}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(c)}
                          className="h-7 text-xs font-medium cursor-pointer"
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCouponToDelete(c)}
                          className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── CREATE DIALOG ─────────────────────────────────────────────────── */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promotional Coupon</DialogTitle>
            <DialogDescription>
              Set up a discount voucher code for shopper orders at checkout.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Coupon Code *</Label>
                <Input
                  className="h-8 text-xs mt-1 uppercase font-mono font-bold"
                  placeholder="e.g. FESTIVE20"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Discount Type *</Label>
                <Select
                  value={form.discount_type}
                  onValueChange={(val: any) => setForm({ ...form, discount_type: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (% off)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (Rs. off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  {form.discount_type === "percent" ? "Percentage (% off) *" : "Fixed Discount (Rs.) *"}
                </Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
                  max={form.discount_type === "percent" ? "99" : undefined}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Minimum Order (Rs.)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="0"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Max Discount Cap (Rs., optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
                  placeholder="None"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Usage Limit (Times, optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
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

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Description / Terms (optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  placeholder="e.g. Valid across all traditional handicraft items"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={form.is_active}
                onCheckedChange={(val) => setForm({ ...form, is_active: val })}
              />
              <span className="text-xs text-foreground/80">Activate coupon immediately</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Save Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── EDIT DIALOG ───────────────────────────────────────────────────── */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Coupon {editingCoupon?.code}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-3.5 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs font-semibold">Coupon Code *</Label>
                <Input
                  className="h-8 text-xs mt-1 uppercase font-mono font-bold"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Discount Type *</Label>
                <Select
                  value={editForm.discount_type}
                  onValueChange={(val: any) => setEditForm({ ...editForm, discount_type: val })}
                >
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (% off)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (Rs. off)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Discount Value *</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Minimum Order (Rs.)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="0"
                  value={editForm.min_order}
                  onChange={(e) => setEditForm({ ...editForm, min_order: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Max Discount Cap (Rs., optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
                  value={editForm.max_discount}
                  onChange={(e) => setEditForm({ ...editForm, max_discount: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Usage Limit (Times, optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min="1"
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

              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Description / Terms (optional)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(val) => setEditForm({ ...editForm, is_active: val })}
              />
              <span className="text-xs text-foreground/80">Coupon is active</span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingCoupon(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DELETE ALERT ──────────────────────────────────────────────────── */}
      <AlertDialog open={!!couponToDelete} onOpenChange={(open) => !open && setCouponToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Coupon {couponToDelete?.code}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this coupon? Customers will no longer be able
              to apply this code at checkout.
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
