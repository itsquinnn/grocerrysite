import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Download, Printer, CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { useI18n } from "@/lib/i18n";
import { Timeline } from "@/components/site/Timeline";
import { LogoMark } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/orders/$id")({
  validateSearch: (s) => z.object({ placed: z.boolean().optional() }).parse(s),
  component: OrderDetail,
});

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Skeleton className="h-4 w-28 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-36 rounded" />
          <Skeleton className="h-8 w-20 rounded" />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-6">
        <div className="flex flex-wrap justify-between gap-2">
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-5 w-40 rounded" />
        </div>
        <div className="flex items-center justify-between px-4 py-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 sm:p-10 shadow-xs space-y-6">
        <header className="flex flex-wrap justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-24 rounded" />
              <Skeleton className="h-3 w-48 rounded" />
            </div>
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-6 w-32 rounded ml-auto" />
            <Skeleton className="h-3 w-28 rounded ml-auto" />
            <Skeleton className="h-3 w-24 rounded ml-auto" />
          </div>
        </header>

        <div className="grid gap-6 py-4 sm:grid-cols-2 border-b">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-44 rounded" />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex justify-between border-b pb-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="space-y-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-4 w-8 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ))}
        </div>

        <div className="ml-auto max-w-xs space-y-2 pt-4">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="flex justify-between border-t pt-2">
            <Skeleton className="h-5 w-24 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderDetail() {
  const { id } = Route.useParams();
  const { placed } = Route.useSearch();
  const qc = useQueryClient();
  const { t, formatPrice, formatStatus, isNepali } = useI18n();
  const [ret, setRet] = useState(false);
  const [reason, setReason] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: o, isLoading } = useQuery({
    queryKey: ["me", "order", id],
    enabled: !!id && id !== "null" && id !== "undefined",
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      let data: any = null;
      try {
        const res = await api.get<{ order: any }>(`/orders/${id}`);
        data = res?.order;
      } catch (err) {
        console.warn("[OrderDetail] API load notice:", err);
      }

      if (!data) {
        try {
          const { data: directOrder } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", id)
            .maybeSingle();
          if (directOrder) data = directOrder;
        } catch (dbErr) {
          console.warn("[OrderDetail] Supabase direct fallback notice:", dbErr);
        }
      }

      if (!data) return null;

      const rawItems = Array.isArray(data.order_items)
        ? data.order_items
        : Array.isArray(data.items)
        ? data.items
        : [];

      const items = rawItems.map((it: any) => {
        const unit_price = it.price_paise_snapshot
          ? it.price_paise_snapshot / 100
          : it.unit_price ?? it.price ?? 0;
        const qty = Number(it.quantity) || 1;
        return {
          ...it,
          id: it.id || it.product_id,
          name: it.title_snapshot || it.name || it.title || "Grocery Item",
          unit_price,
          quantity: qty,
          line_total: it.line_total ?? unit_price * qty,
          image: it.image_url_snapshot || it.image || it.image_url || "/placeholder.svg",
        };
      });

      const subtotal = data.subtotal ?? (data.subtotal_paise ? data.subtotal_paise / 100 : 0);
      const shipping_fee = data.shipping_fee ?? (data.delivery_fee_paise ? data.delivery_fee_paise / 100 : 40);
      const total = data.total ?? (data.total_paise ? data.total_paise / 100 : subtotal + shipping_fee);
      const addr = (data.shipping_address || data.address_snapshot || {}) as Record<string, any>;

      return {
        ...data,
        order_number: data.order_number ?? `DOV-${data.id.slice(0, 8).toUpperCase()}`,
        total,
        subtotal,
        shipping_fee,
        tax: data.tax ?? 0,
        status: (data.status || "Pending").toLowerCase(),
        payment_method: ((data.payment_method || "").toLowerCase().includes("cash") || (data.payment_method || "").toLowerCase().includes("cod"))
          ? "Cash on Delivery"
          : (data.payment_method || "Cash on Delivery"),
        payment_status: (((data.payment_method || "").toLowerCase().includes("cash") || (data.payment_method || "").toLowerCase().includes("cod")) && (data.status || "").toLowerCase() !== "delivered" && total > 0)
          ? "pending"
          : (data.payment_status || "pending").toLowerCase(),
        order_items: items,
        items,
        shipping_address: addr,
        billing_address: addr,
        order_events: data.order_events ?? [],
        return_requests: data.return_requests ?? [],
      };
    },
  });

  if (isLoading) return <OrderDetailSkeleton />;
  if (!o)
    return (
      <div className="rounded-xl border p-8 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/account/orders">Back to all orders</Link>
        </Button>
      </div>
    );

  const sa = (o.shipping_address ?? {}) as Record<string, string>;
  const ba = (o.billing_address ?? {}) as Record<string, string>;

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoice(o as unknown as InvoiceOrder);
      toast.success(`Tax invoice downloaded for Order ${o.order_number}`);
    } catch {
      toast.error("Could not generate PDF invoice. Please try again.");
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const cancel = async () => {
    try {
      await api.patch(`/orders/${o.id}`, {});
      toast.success("Order cancelled");
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel order");
    }
  };

  const requestReturn = async () => {
    if (reason.trim().length < 10) {
      return toast.error("Please describe the reason (10+ characters)");
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("return_requests")
      .insert({ order_id: o.id, user_id: u.user!.id, reason: reason.trim().slice(0, 1000) });
    if (error) return toast.error("Could not submit return request");
    setRet(false);
    toast.success("Return requested: we'll be in touch within 2 working days");
    void qc.invalidateQueries({ queryKey: ["me", "order", id] });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {placed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-foreground/30 bg-muted/20 p-4 sm:p-5 no-print">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-foreground mt-0.5" />
            <div>
              <p className="font-display text-lg font-medium text-foreground">{t("order_confirmed")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Order <span className="font-mono font-medium text-foreground">{o.order_number}</span> ·{" "}
                Pay <span className="font-medium text-foreground">{formatPrice(o.total)}</span> in cash upon delivery.
                {o.estimated_delivery && ` Estimated arrival: ${o.estimated_delivery}.`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isDownloading}
            onClick={handleDownloadInvoice}
            className="shrink-0 rounded-none border-border/80 hover:border-foreground text-xs font-mono"
            title="Download Tax Invoice PDF"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>{t("download_pdf_invoice")}</span>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t("all_orders")}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDownloading}
            onClick={handleDownloadInvoice}
            className="gap-1.5 text-xs font-mono rounded-none border-border/80 hover:border-foreground"
            title="Save a PDF copy of this official Tax Invoice to your device"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t("download_tax_invoice")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-mono rounded-none border-border/80 hover:border-foreground"
            title="Print order receipt"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </Button>

          {["pending", "confirmed", "processing"].includes(o.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-none text-xs font-mono">
                  Cancel order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>
                  Cancel order {o.order_number}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. Items will be released back to our inventory.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep order</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel}>Cancel order</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {o.status === "delivered" && o.return_requests.length === 0 && (
            <Button size="sm" variant="secondary" onClick={() => setRet(true)} className="rounded-none text-xs font-mono">
              Request return
            </Button>
          )}
        </div>
      </div>

      {/* ── Order Status Tracker Block ──────────────────────────── */}
      <div className="border border-border/80 p-5 sm:p-6 no-print space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground uppercase tracking-wider">Status:</span>
            <span className="inline-flex items-center gap-1.5 border border-foreground/30 px-2 py-0.5 uppercase tracking-wider font-semibold text-foreground">
              {formatStatus(o.status)}
            </span>
          </div>
          {o.tracking_number && (
            <span>
              Tracking: <b className="font-mono text-foreground">{o.tracking_number}</b>
            </span>
          )}
          {o.estimated_delivery && (
            <span>
              Est. Arrival: <span className="text-foreground">{o.estimated_delivery}</span>
            </span>
          )}
        </div>
        <Timeline status={o.status} events={o.order_events} />
        {o.return_requests[0] && (
          <p className="mt-4 text-xs font-mono">
            Return Request: <b className="uppercase">{formatStatus(o.return_requests[0].status)}</b>
          </p>
        )}
      </div>

      {/* ── Tax Invoice Document ─────────────────────────────────── */}
      <article className="border border-border/80 bg-background p-5 sm:p-8 md:p-10" aria-label="Invoice">
        <header className="flex flex-wrap justify-between gap-4 border-b border-border/80 pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="font-display text-xl font-bold tracking-[0.12em]">DOVAN</p>
              <p className="text-[11px] font-mono text-muted-foreground">Kathmandu, Nepal · PAN: 609823145 · support@dovan.com.np</p>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <p className="font-display text-base font-bold uppercase tracking-wider text-foreground">
              Tax Invoice
            </p>
            <p className="text-muted-foreground mt-0.5">
              Invoice: <span className="text-foreground font-semibold">{o.invoice_number ?? "PENDING"}</span>
            </p>
            <p className="text-muted-foreground">
              Order: <span className="text-foreground">{o.order_number}</span>
            </p>
            <p className="text-muted-foreground">
              Date: {new Date(o.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
        </header>

        <div className="grid gap-6 py-6 text-xs sm:grid-cols-2 border-b border-border/80">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Billed To</div>
            <p className="font-medium text-foreground text-sm">{ba.full_name || "Account Holder"}</p>
            {ba.phone && <p className="font-mono text-muted-foreground mt-0.5">{ba.phone}</p>}
            {ba.street && <p className="text-muted-foreground">{ba.street}, {ba.city}</p>}
            {ba.district && <p className="text-muted-foreground">{ba.district}, {ba.province} Province</p>}
            {o.customer_email && <p className="font-mono text-muted-foreground mt-0.5">{o.customer_email}</p>}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Shipped To</div>
            <p className="font-medium text-foreground text-sm">{sa.full_name || "Account Holder"}</p>
            {sa.phone && <p className="font-mono text-muted-foreground mt-0.5">{sa.phone}</p>}
            {sa.street && <p className="text-muted-foreground">{sa.street}, {sa.city}</p>}
            {sa.district && <p className="text-muted-foreground">{sa.district}, {sa.province} Province</p>}
          </div>
        </div>

        {/* Mobile Items Cards (sm:hidden) */}
        <div className="space-y-2 py-4 sm:hidden">
          {(o.order_items || []).map((i: any) => (
            <div key={i.id} className="border border-border/60 p-3 text-xs flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{i.name}</p>
                {(i.size || i.color) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {[i.size, i.color].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-[11px] font-mono text-muted-foreground mt-1">
                  {i.quantity} × {formatPrice(i.unit_price)}
                </p>
              </div>
              <div className="text-right font-mono font-medium text-foreground shrink-0">
                {formatPrice(i.line_total)}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto py-4">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border/80 text-left uppercase text-muted-foreground/80 tracking-wider">
                <th className="py-2.5 font-normal">Item</th>
                <th className="font-normal">SKU</th>
                <th className="text-right font-normal">Qty</th>
                <th className="text-right font-normal">Unit Price</th>
                <th className="text-right font-normal">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {(o.order_items || []).map((i: any) => (
                <tr key={i.id}>
                  <td className="py-3 font-sans">
                    <span className="font-medium text-foreground">{i.name}</span>
                    {(i.size || i.color) && (
                      <span className="block text-[11px] text-muted-foreground">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground">{i.sku || "N/A"}</td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">{formatPrice(i.unit_price)}</td>
                  <td className="text-right font-medium text-foreground">{formatPrice(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd>{formatPrice(o.subtotal)}</dd>
          </div>
          {Number(o.discount) > 0 && (
            <div className="flex justify-between text-success">
              <dt>Discount ({o.coupon_code ?? "PROMO"})</dt>
              <dd>−{formatPrice(o.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shipping</dt>
            <dd>{Number(o.shipping_fee) === 0 ? "FREE" : formatPrice(o.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">VAT 13% (Nepal)</dt>
            <dd>{formatPrice(o.tax)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>Grand total</dt>
            <dd>{formatPrice(o.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <p>
            Payment:{" "}
            <span className="font-medium text-foreground">
              {o.payment_method === "cod" ? "Cash on delivery (COD)" : o.payment_method}
            </span>{" "}
            · Status:{" "}
            <span className="font-medium text-foreground">{formatStatus(o.payment_status)}</span>
          </p>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Save offline PDF</span>
          </button>
        </div>
      </article>

      <Dialog open={ret} onOpenChange={setRet}>
        <DialogContent>
          <DialogTitle>Request a return</DialogTitle>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell us what's wrong (item defect, incorrect size, etc.)"
            rows={4}
          />
          <Button onClick={requestReturn}>Submit request</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
