import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Store,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  RefreshCw,
  QrCode,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/approvals")({
  component: AdminProductApprovalsPage,
});

function AdminProductApprovalsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"schedule" | "list" | "reject" | null>(null);
  const [pickupTime, setPickupTime] = useState<string>("Tomorrow 10 AM - 2 PM");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Fetch product approvals
  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "product-approvals", filter],
    queryFn: () =>
      api.get<{ submissions: any[]; products: any[]; total: number }>(
        `/admin/product-approvals?status=${filter}`,
      ),
  });

  const submissions = data?.submissions || data?.products || [];

  const handleOpenAction = (p: any, type: "schedule" | "list" | "reject") => {
    setSelectedProduct(p);
    setActionType(type);
    setPickupTime(p.pickup_time || "Tomorrow 10 AM - 2 PM");
    setAdminNotes(p.admin_notes || "");
    setRejectionReason(p.rejection_reason || "");
  };

  const handleExecuteAction = async () => {
    if (!selectedProduct || !actionType) return;

    try {
      setIsProcessing(true);

      let action: "schedule_pickup" | "list_in_store" | "reject";
      if (actionType === "schedule") action = "schedule_pickup";
      else if (actionType === "list") action = "list_in_store";
      else action = "reject";

      await api.patch("/admin/product-approvals", {
        product_id: selectedProduct.id,
        action,
        pickup_time: actionType === "schedule" ? pickupTime : undefined,
        admin_notes: adminNotes.trim() || undefined,
        rejection_reason: actionType === "reject" ? (rejectionReason.trim() || "Item criteria not met.") : undefined,
      });

      toast.success(
        actionType === "schedule"
          ? "Courier pickup scheduled! Seller has been notified."
          : actionType === "list"
          ? "Product is now live in store catalog!"
          : "Product submission rejected.",
      );

      setActionType(null);
      setSelectedProduct(null);
      void qc.invalidateQueries({ queryKey: ["admin", "product-approvals"] });
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Action failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingCount = submissions.filter((p: any) => p.approval_status === "pending").length;
  const scheduledCount = submissions.filter((p: any) => p.approval_status === "scheduled_for_pickup" || p.approval_status === "approved").length;
  const listedCount = submissions.filter((p: any) => p.approval_status === "listed").length;
  const rejectedCount = submissions.filter((p: any) => p.approval_status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Product Approvals & Seller Moderation
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Store className="h-3 w-3" />
              Customer Submissions
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Review customer-submitted items, coordinate courier pickup, and publish approved products directly to the live store.
          </p>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs h-9 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Submissions
        </Button>
      </div>

      {/* ── Status KPI Counter Pills ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-muted-foreground hover:bg-muted border-border"
          }`}
        >
          All Items ({submissions.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            filter === "pending"
              ? "bg-amber-600 text-white border-amber-600"
              : "bg-card text-amber-700 hover:bg-amber-500/10 border-amber-500/30"
          }`}
        >
          <Clock className="h-3 w-3" />
          Pending Review ({pendingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("scheduled_for_pickup")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            filter === "scheduled_for_pickup"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-card text-blue-700 hover:bg-blue-500/10 border-blue-500/30"
          }`}
        >
          <Truck className="h-3 w-3" />
          Pickup Scheduled ({scheduledCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("listed")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            filter === "listed"
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-card text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30"
          }`}
        >
          <CheckCircle2 className="h-3 w-3" />
          Live on Store ({listedCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("rejected")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition cursor-pointer border ${
            filter === "rejected"
              ? "bg-rose-600 text-white border-rose-600"
              : "bg-card text-rose-700 hover:bg-rose-500/10 border-rose-500/30"
          }`}
        >
          <XCircle className="h-3 w-3" />
          Rejected ({rejectedCount})
        </button>
      </div>

      {/* ── Submissions Feed ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Loading seller product submissions...
        </div>
      ) : submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center bg-muted/20">
          <Package className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <h3 className="mt-3 text-base font-semibold text-foreground">No submissions found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {filter === "all"
              ? "No customer seller submissions in the system yet."
              : `No product submissions matching filter "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {submissions.map((p: any) => {
            const priceNpr = (p.price_paise || 0) / 100;
            const seller = p.users || p.accounts;
            const isPending = p.approval_status === "pending";
            const isScheduled = p.approval_status === "scheduled_for_pickup" || p.approval_status === "approved";
            const isListed = p.approval_status === "listed";
            const isRejected = p.approval_status === "rejected";

            return (
              <div
                key={p.id}
                className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs space-y-4 hover:border-foreground/20 transition"
              >
                <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                  {/* Left: Product Info */}
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-lg border bg-muted overflow-hidden relative">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Package className="h-8 w-8 opacity-40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-foreground">
                          {p.title}
                        </h3>
                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Pending Review
                          </span>
                        )}
                        {isScheduled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-700">
                            <Truck className="h-3 w-3" />
                            Pickup Scheduled
                          </span>
                        )}
                        {isListed && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Live on Store
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            <XCircle className="h-3 w-3" />
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Pricing & Stock */}
                      <div className="flex items-baseline gap-2 text-sm">
                        <span className="text-lg font-bold text-foreground">
                          {formatNPR(priceNpr)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {p.unit || "item"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • Available Stock: <strong>{p.stock_quantity ?? 0}</strong>
                        </span>
                      </div>

                      {/* Category & Product Code */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {p.product_code && (
                          <span className="inline-flex items-center gap-1 font-mono font-bold bg-muted px-2 py-0.5 rounded text-[11px] text-foreground">
                            <QrCode className="h-3 w-3" />
                            {p.product_code}
                          </span>
                        )}
                        {p.categories?.name && (
                          <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px]">
                            {p.categories.name}
                          </span>
                        )}
                        <span>Submitted: {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>

                      {/* Description */}
                      {p.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Seller & Logistics Details */}
                  <div className="w-full lg:w-72 shrink-0 rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 border-b pb-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Seller Contact</span>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <div className="font-medium text-foreground">
                        {seller?.name || "Customer Account"}
                      </div>
                      {seller?.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{seller.phone}</span>
                        </div>
                      )}
                      {seller?.email && <div className="truncate">{seller.email}</div>}
                    </div>

                    <div className="pt-1.5 border-t space-y-1">
                      <div className="flex items-start gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          Pickup: <strong className="text-foreground">{p.pickup_address}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground pl-4">
                        Pickup Window: {p.pickup_time || "Standard Business Hours"}
                      </div>
                      {p.pickup_phone && (
                        <div className="text-[11px] text-muted-foreground pl-4">
                          Pickup Phone: <strong>{p.pickup_phone}</strong>
                        </div>
                      )}
                    </div>

                    {p.rejection_reason && (
                      <div className="pt-1 border-t text-[11px] text-rose-600 font-medium">
                        Rejection reason: {p.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                  <div className="text-xs text-muted-foreground">
                    Product ID: <span className="font-mono">{p.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Action 1: Schedule Pickup */}
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenAction(p, "schedule")}
                        className="text-xs h-8 border-blue-500/40 text-blue-700 hover:bg-blue-50 cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5 mr-1 text-blue-600" />
                        Schedule Courier Pickup
                      </Button>
                    )}

                    {/* Action 2: List in Store */}
                    {(isPending || isScheduled) && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenAction(p, "list")}
                        className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        List in Store Catalog
                      </Button>
                    )}

                    {/* Action 3: Reject */}
                    {!isRejected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenAction(p, "reject")}
                        className="text-xs h-8 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: SCHEDULE PICKUP ────────────────────────────────────────── */}
      <Dialog open={actionType === "schedule"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Schedule Courier Pickup
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <p className="text-muted-foreground">
              Notify the seller that their product <strong>{selectedProduct?.title}</strong> is approved, and set the courier collection time.
            </p>

            <div>
              <Label htmlFor="pickup_time_input" className="text-xs font-semibold">
                Pickup Date & Time Window *
              </Label>
              <Input
                id="pickup_time_input"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                placeholder="e.g. Tomorrow between 10:00 AM - 1:00 PM"
                className="mt-1 text-xs h-9"
              />
            </div>

            <div>
              <Label htmlFor="admin_note_input" className="text-xs font-semibold">
                Note for Seller (Instructions, packing advice)
              </Label>
              <Textarea
                id="admin_note_input"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Please have item boxed with your product code tag ready."
                rows={2}
                className="mt-1 text-xs"
              />
            </div>

            <div className="rounded-lg bg-muted p-2.5 space-y-1 text-[11px] text-muted-foreground">
              <div>Pickup location: <strong>{selectedProduct?.pickup_address}</strong></div>
              <div>Contact: <strong>{selectedProduct?.pickup_phone}</strong></div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isProcessing || !pickupTime.trim()}
              onClick={handleExecuteAction}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            >
              {isProcessing ? "Scheduling..." : "Confirm & Notify Seller"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: LIST IN STORE ─────────────────────────────────────────── */}
      <Dialog open={actionType === "list"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Publish Product to Live Store
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Are you sure you want to activate <strong>{selectedProduct?.title}</strong>? Once listed:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Item becomes immediately visible in DOVAN store catalog & search.</li>
              <li>Customers across Nepal can add it to cart and place orders.</li>
              <li>Seller receives an instant confirmation alert.</li>
            </ul>

            <div>
              <Label htmlFor="list_notes" className="text-xs font-semibold">
                Admin Note (Optional)
              </Label>
              <Input
                id="list_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified genuine, ready for dispatch."
                className="mt-1 text-xs h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={isProcessing}
              onClick={handleExecuteAction}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isProcessing ? "Publishing..." : "Publish to Store Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: REJECT SUBMISSION ─────────────────────────────────────── */}
      <Dialog open={actionType === "reject"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Reject Product Submission
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground">
              Please specify why <strong>{selectedProduct?.title}</strong> is being rejected so the customer can fix it or re-submit.
            </p>

            <div>
              <Label htmlFor="rejection_reason_input" className="text-xs font-semibold">
                Reason for Rejection *
              </Label>
              <Textarea
                id="rejection_reason_input"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Image resolution is too low, prohibited merchandise, or price does not match market value."
                rows={3}
                className="mt-1 text-xs"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
              className="text-xs h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isProcessing}
              onClick={handleExecuteAction}
              className="text-xs h-9 cursor-pointer"
            >
              {isProcessing ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
