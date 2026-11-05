import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { formatNPR, statusLabel } from "@/lib/format";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Truck, Package, Clock, XCircle, RotateCcw, Search, Download, Calendar, User, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBsDate } from "@/lib/bikramSambat";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: AdminOrders });

const STATUS_OPTIONS = [
  { value: "Pending", label: "1. Order Placed (Pending)", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { value: "Confirmed", label: "2. Confirmed", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  { value: "Processing", label: "3. Processing", badge: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "Shipped", label: "4. Shipped", badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300" },
  { value: "Out for Delivery", label: "5. Out for Delivery", badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  { value: "Delivered", label: "6. Delivered (Completed)", badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { value: "Cancelled", label: "Cancelled", badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300" },
];

function getStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver")) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (s.includes("cancel")) return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (s.includes("out")) return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
  if (s.includes("ship") || s.includes("pack")) return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
  if (s.includes("process")) return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (s.includes("confirm")) return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
}

function AdminOrders() {
  const { isNepali, formatStatus, translateProduct } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const [next, setNext] = useState<string>("Processing");
  const [tracking, setTracking] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      try {
        let { data, error } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .order("created_at", { ascending: false });

        if (error || !data || data.length === 0) {
          try {
            const res = await api.get<{ orders: any[] }>("/admin/orders");
            if (res?.orders && res.orders.length > 0) {
              data = res.orders;
            } else if (!data) {
              const resDirect = await supabase.from("orders").select("*").order("created_at", { ascending: false });
              data = resDirect.data;
            }
          } catch {
            const resDirect = await supabase.from("orders").select("*").order("created_at", { ascending: false });
            data = resDirect.data;
          }
        }

        return (data ?? []).map((ord: any) => {
          const addr = (ord.address_snapshot || ord.shipping_address || {}) as Record<string, any>;
          const rawMethod = (ord.payment_method || "").toLowerCase();
          const isCOD = rawMethod.includes("cash") || rawMethod.includes("cod") || rawMethod === "cod";
          const isDelivered = (ord.status || "").toLowerCase() === "delivered";
          const effectivePaymentStatus =
            isCOD && !isDelivered && (ord.total ?? ord.total_paise ?? 1) > 0
              ? "pending"
              : (ord.payment_status ?? "pending").toLowerCase();

          return {
            ...ord,
            order_number: ord.order_number ?? `DOV-${ord.id.slice(0, 8).toUpperCase()}`,
            customer_name:
              ord.customer_name ??
              addr.name ??
              addr.full_name ??
              (ord.accounts as any)?.name ??
              "Customer",
            customer_phone: ord.customer_phone ?? addr.phone ?? (ord.accounts as any)?.phone ?? "",
            customer_email: ord.customer_email ?? (ord.accounts as any)?.email ?? "",
            total: ord.total ?? (ord.total_paise ? ord.total_paise / 100 : 0),
            status: ord.status ?? "Pending",
            tracking_number: ord.tracking_number ?? addr.tracking_number ?? "",
            payment_method: isCOD ? "Cash on Delivery" : (ord.payment_method ?? "Cash on Delivery"),
            payment_status: effectivePaymentStatus,
            order_items: ord.order_items ?? ord.items ?? [],
            return_requests: ord.return_requests ?? [],
            shipping_address: ord.shipping_address ?? ord.address_snapshot ?? {},
          };
        });
      } catch {
        return [];
      }
    },
  });

  const o = orders.find((x) => x.id === sel);

  const shown = orders.filter((x) => {
    const matchesFilter =
      filter === "all" ||
      x.status.toLowerCase().replace(/[\s_-]/g, "") === filter.toLowerCase().replace(/[\s_-]/g, "");

    const searchTarget = `${x.order_number} ${x.customer_name} ${x.customer_phone} ${x.customer_email} ${x.tracking_number}`.toLowerCase();
    const matchesSearch = !q || searchTarget.includes(q.toLowerCase().trim());

    return matchesFilter && matchesSearch;
  });

  const update = async (targetStatus?: string) => {
    if (!o) return;
    const statusToSend = targetStatus || next;
    setIsUpdating(true);
    try {
      const res = await api.patch<{ success: boolean; message?: string }>("/admin/orders", {
        order_id: o.id,
        status: statusToSend,
        tracking_number: tracking.trim(),
      });
      toast.success(res?.message || `Order status updated to ${statusToSend}`);
      setSel(null);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      console.error("Order status update failed:", err);
      toast.error(err?.message || "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const returnStatus = async (id: string, status: string) => {
    try {
      await supabase.from("return_requests").update({ status }).eq("id", id);
      toast.success(`Return request marked as ${status}`);
      void qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update return request");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Top Header & Filters ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span>{"Orders & Fulfillment"}</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {"Manage customer orders, dispatch status, tracking, and returns"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="w-full pl-8 h-9 text-xs sm:text-sm"
              placeholder={"Search order #, customer, phone"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-xs sm:text-sm font-medium">
              <SelectValue placeholder={"All statuses"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {"All statuses"} ({orders.length})
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Loading Skeleton ─────────────────────────────────────────── */}
      {isLoading && (
        <>
          {/* Mobile Loading Skeleton Cards */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-3.5 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-28 rounded" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-14 w-full rounded-lg" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Loading Skeleton Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border bg-card shadow-2xs">
            <table className="w-full min-w-[760px] text-sm">
              <tbody>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="p-3.5 space-y-1.5">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </td>
                    <td className="space-y-1.5">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </td>
                    <td>
                      <Skeleton className="h-3 w-16 rounded" />
                    </td>
                    <td>
                      <Skeleton className="h-4 w-16 rounded font-semibold" />
                    </td>
                    <td className="space-y-1">
                      <Skeleton className="h-3 w-12 rounded" />
                      <Skeleton className="h-3 w-16 rounded" />
                    </td>
                    <td>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </td>
                    <td className="pr-4 text-right">
                      <Skeleton className="ml-auto h-8 w-16 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {!isLoading && shown.length === 0 && (
        <div className="rounded-xl border bg-card p-8 sm:p-12 text-center shadow-2xs">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-base font-semibold text-foreground">No orders found</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {q || filter !== "all"
              ? "No orders match the current search or status filter."
              : "No customer orders have been placed yet."}
          </p>
          {(q || filter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setQ("");
                setFilter("all");
              }}
              className="mt-3 text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* ── Mobile Order Cards View (md:hidden) ────────────────────────── */}
      {!isLoading && shown.length > 0 && (
        <div className="md:hidden space-y-3">
          {shown.map((x) => (
            <div
              key={x.id}
              className="rounded-xl border bg-card p-3.5 shadow-2xs space-y-3 transition hover:border-primary/40"
            >
              {/* Top row: Order Number, Return Tag, Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-sm text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      {x.order_number}
                    </span>
                    {x.return_requests?.some((r: any) => r.status === "requested") && (
                      <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300">
                        Return Req
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 shrink-0" />
                    <span>{new Date(x.created_at).toLocaleDateString()}</span>
                    <span className="text-muted-foreground/80 font-medium">({formatBsDate(x.created_at, "short")})</span>
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 whitespace-nowrap",
                    getStatusBadge(x.status)
                  )}
                >
                  {x.status}
                </span>
              </div>

              {/* Middle: Customer & Contact info */}
              <div className="rounded-lg bg-muted/40 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{x.customer_name}</span>
                  </span>
                  {x.customer_phone && (
                    <a
                      href={`tel:${x.customer_phone}`}
                      className="text-primary hover:underline text-[11px] font-semibold shrink-0"
                    >
                      {x.customer_phone}
                    </a>
                  )}
                </div>
                {x.customer_email && (
                  <p className="text-[11px] text-muted-foreground truncate pl-5">
                    {x.customer_email}
                  </p>
                )}
                {x.tracking_number && (
                  <p className="text-[11px] font-mono text-muted-foreground pl-5 pt-0.5">
                    Tracking: <strong className="text-foreground">{x.tracking_number}</strong>
                  </p>
                )}
              </div>

              {/* Bottom: Total Price, Payment Status & Manage Button */}
              <div className="flex items-center justify-between pt-2 border-t gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</p>
                  <p className="text-sm font-bold text-foreground">{formatNPR(x.total)}</p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {x.payment_method === "Cash on Delivery" ? "COD" : x.payment_method}
                  </p>
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase",
                      x.payment_status === "paid"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {statusLabel(x.payment_status)}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold shadow-2xs gap-1 ml-auto"
                  onClick={() => {
                    setSel(x.id);
                    setNext(x.status);
                    setTracking(x.tracking_number || "");
                  }}
                >
                  <span>Manage</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop Data Table (hidden md:block) ────────────────────────── */}
      {!isLoading && shown.length > 0 && (
        <div className="hidden md:block overflow-x-auto rounded-xl border bg-card shadow-2xs">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3.5 whitespace-nowrap">Order</th>
                <th className="whitespace-nowrap">Customer</th>
                <th className="whitespace-nowrap">Date</th>
                <th className="whitespace-nowrap">Total</th>
                <th className="whitespace-nowrap">Payment</th>
                <th className="whitespace-nowrap">Status</th>
                <th className="pr-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id} className="border-b transition-colors hover:bg-muted/20 last:border-0">
                  <td className="p-3.5 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground">{x.order_number}</span>
                      {x.return_requests?.some((r: any) => r.status === "requested") && (
                        <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                          Return
                        </span>
                      )}
                    </div>
                    {x.tracking_number && (
                      <span className="block font-mono text-[11px] text-muted-foreground">
                        Trk: {x.tracking_number}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-medium text-foreground">{x.customer_name}</span>
                    <span className="block text-xs text-muted-foreground">{x.customer_phone || x.customer_email || "—"}</span>
                  </td>
                  <td className="text-muted-foreground whitespace-nowrap">
                    <div>{new Date(x.created_at).toLocaleDateString()}</div>
                    <div className="text-[11px] text-muted-foreground/75 font-medium">{formatBsDate(x.created_at, "short")}</div>
                  </td>
                  <td className="font-semibold text-foreground whitespace-nowrap">{formatNPR(x.total)}</td>
                  <td>
                    <div className="flex flex-col text-xs">
                      <span className="font-medium uppercase">{x.payment_method === "Cash on Delivery" ? "COD" : x.payment_method}</span>
                      <span
                        className={`inline-block font-medium ${
                          x.payment_status === "paid"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {statusLabel(x.payment_status)}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${getStatusBadge(
                        x.status
                      )}`}
                    >
                      {x.status}
                    </span>
                  </td>
                  <td className="pr-4 text-right whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs font-semibold"
                      onClick={() => {
                        setSel(x.id);
                        setNext(x.status);
                        setTracking(x.tracking_number ?? "");
                      }}
                    >
                      Manage
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Manage Order Modal ──────────────────────────────────────────────── */}
      <Dialog open={!!o} onOpenChange={(v) => !v && setSel(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {o && (
            <div className="space-y-5">
              <div>
                <DialogTitle className="text-xl font-bold flex items-center justify-between">
                  <span>Order {o.order_number}</span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                      o.status
                    )}`}
                  >
                    {o.status}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(o.created_at).toLocaleString()}
                </DialogDescription>
              </div>

              {/* Customer & Shipping Details */}
              <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="eyebrow text-muted-foreground mb-1">Customer</p>
                  <p className="font-semibold text-foreground">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email || "No email"}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone || "No phone"}</p>
                </div>
                <div>
                  <p className="eyebrow text-muted-foreground mb-1">Shipping Destination</p>
                  <p className="text-xs text-foreground leading-relaxed">
                    {(() => {
                      const a = (o.shipping_address || {}) as Record<string, string>;
                      return (
                        o.destination_address ||
                        [a.street, a.city, a.district, a.province].filter(Boolean).join(", ") ||
                        a.address ||
                        "Standard Delivery Address"
                      );
                    })()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <p className="eyebrow text-muted-foreground mb-2">Order Items ({(o.order_items || []).length})</p>
                <ul className="divide-y rounded-lg border bg-card text-sm">
                  {(o.order_items || []).map((i: any) => (
                    <li
                      key={i.id || i.product_id || Math.random()}
                      className="flex items-center justify-between p-3"
                    >
                      <div>
                        <span className="font-medium text-foreground">{i.title_snapshot || i.name || i.title || "Item"}</span>
                        <span className="ml-2 text-xs text-muted-foreground">× {i.quantity}</span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {formatNPR(i.line_total || ((i.price_paise_snapshot ? i.price_paise_snapshot / 100 : i.price || 0) * (i.quantity || 1)))}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Payment Summary */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Payment: </span>
                  <span className="font-semibold uppercase">{o.payment_method}</span>
                  <span
                    className={`ml-2 text-xs font-semibold uppercase ${
                      o.payment_status === "paid" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                    }`}
                  >
                    ({o.payment_status})
                  </span>
                </div>
                <div className="text-base font-bold text-foreground">
                  Total: {formatNPR(o.total)}
                </div>
              </div>

              {/* Return Requests (if any) */}
              {(o.return_requests || []).map((r: any) => (
                <div key={r.id} className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <b>Return Request ({statusLabel(r.status)}):</b>
                    {r.status === "requested" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => returnStatus(r.id, "approved")}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => returnStatus(r.id, "rejected")}>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                </div>
              ))}

              {/* Quick Status Bar */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Quick Update Status</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={next === "Confirmed" ? "default" : "outline"}
                    className="h-8 text-xs gap-1"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Confirmed");
                      void update("Confirmed");
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Confirmed
                  </Button>
                  <Button
                    size="sm"
                    variant={next === "Processing" ? "default" : "outline"}
                    className="h-8 text-xs gap-1"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Processing");
                      void update("Processing");
                    }}
                  >
                    <Clock className="h-3.5 w-3.5" /> Processing
                  </Button>
                  <Button
                    size="sm"
                    variant={next === "Shipped" || next === "Packed" ? "default" : "outline"}
                    className="h-8 text-xs gap-1"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Shipped");
                      void update("Shipped");
                    }}
                  >
                    <Package className="h-3.5 w-3.5" /> Shipped
                  </Button>
                  <Button
                    size="sm"
                    variant={next === "Out for Delivery" ? "default" : "outline"}
                    className="h-8 text-xs gap-1"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Out for Delivery");
                      void update("Out for Delivery");
                    }}
                  >
                    <Truck className="h-3.5 w-3.5" /> Out for Delivery
                  </Button>
                  <Button
                    size="sm"
                    variant={next === "Delivered" ? "default" : "outline"}
                    className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Delivered");
                      void update("Delivered");
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Delivered
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                    disabled={isUpdating}
                    onClick={() => {
                      setNext("Cancelled");
                      void update("Cancelled");
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel Order
                  </Button>
                </div>
              </div>

              {/* Detailed Update Form */}
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end border-t pt-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Select Status</label>
                  <Select value={next} onValueChange={(v) => setNext(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Tracking Number</label>
                  <Input
                    placeholder="e.g. TRK-987654"
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                  />
                </div>

                <Button onClick={() => void update()} disabled={isUpdating} className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                <p>
                  * Setting "Delivered" automatically marks COD as paid. "Cancelled" restores product inventory.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => void downloadInvoice(o as unknown as InvoiceOrder)}
                >
                  <Download className="h-3.5 w-3.5" /> Download invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}