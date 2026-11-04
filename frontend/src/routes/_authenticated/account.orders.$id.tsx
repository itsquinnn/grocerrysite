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
        <p className="text-muted-foreground">{isNepali ? "अर्डर फेला परेन।" : "Order not found."}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/account/orders">{isNepali ? "सबै अर्डरहरूमा फर्कनुहोस्" : "Back to all orders"}</Link>
        </Button>
      </div>
    );

  const sa = (o.shipping_address ?? {}) as Record<string, string>;
  const ba = (o.billing_address ?? {}) as Record<string, string>;

  const handleDownloadInvoice = async () => {
    try {
      setIsDownloading(true);
      await downloadInvoice(o as unknown as InvoiceOrder);
      toast.success(
        isNepali
          ? `अर्डर ${o.order_number} को कर बिल (PDF) डाउनलोड भयो`
          : `Tax invoice downloaded for Order ${o.order_number}`
      );
    } catch {
      toast.error(
        isNepali
          ? "PDF कर बिल तयार गर्न सकिएन। पुनः प्रयास गर्नुहोस्।"
          : "Could not generate PDF invoice. Please try again."
      );
    } finally {
      setTimeout(() => setIsDownloading(false), 500);
    }
  };

  const cancel = async () => {
    try {
      await api.patch(`/orders/${o.id}`, {});
      toast.success(isNepali ? "अर्डर रद्द गरियो" : "Order cancelled");
      void qc.invalidateQueries({ queryKey: ["me"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || (isNepali ? "अर्डर रद्द गर्न सकिएन" : "Failed to cancel order"));
    }
  };

  const requestReturn = async () => {
    if (reason.trim().length < 10) {
      return toast.error(
        isNepali
          ? "कृपया फिर्ता माग्नुको कारण कम्तिमा १० अक्षरमा खुलाउनुहोस्"
          : "Please describe the reason (10+ characters)"
      );
    }
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("return_requests")
      .insert({ order_id: o.id, user_id: u.user!.id, reason: reason.trim().slice(0, 1000) });
    if (error) return toast.error(isNepali ? "फिर्ता अनुरोध पेश हुन सकेन" : "Could not submit return request");
    setRet(false);
    toast.success(
      isNepali
        ? "फिर्ता अनुरोध पेश भयो — हामी २ कार्यदिनभित्र सम्पर्क गर्नेछौँ"
        : "Return requested — we'll be in touch within 2 working days"
    );
    void qc.invalidateQueries({ queryKey: ["me", "order", id] });
  };

  return (
    <div className="space-y-6">
      {placed && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-success/40 bg-success/5 p-5 no-print">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-success mt-0.5" />
            <div>
              <p className="font-display text-xl font-semibold text-foreground">{t("order_confirmed")}</p>
              <p className="text-sm text-muted-foreground">
                {isNepali ? "अर्डर #" : "Order "}
                <span className="font-mono font-medium text-foreground">{o.order_number}</span> ·{" "}
                {isNepali ? "डेलिभरीमा तिर्नुपर्ने रकम: " : "Pay "}
                <span className="font-medium text-foreground">{formatPrice(o.total)}</span>
                {isNepali ? " (नगद)" : " in cash upon delivery."}
                {o.estimated_delivery &&
                  ` ${isNepali ? "अनुमानित डेलिभरी:" : "Estimated arrival:"} ${o.estimated_delivery}.`}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isDownloading}
            onClick={handleDownloadInvoice}
            className="shrink-0 bg-background shadow-xs hover:bg-muted"
            title="Download Tax Invoice PDF"
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span>{t("download_pdf_invoice")}</span>
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("all_orders")}</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDownloading}
            onClick={handleDownloadInvoice}
            className="gap-1.5"
            title={isNepali ? "आधिकारिक कर बिल PDF डाउनलोड गर्नुहोस्" : "Save a PDF copy of this official Tax Invoice to your device"}
          >
            <Download className="h-4 w-4" />
            <span>{t("download_tax_invoice")}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
            title="Print order receipt"
          >
            <Printer className="h-4 w-4" />
            <span>{isNepali ? "प्रिन्ट" : "Print"}</span>
          </Button>

          {["pending", "confirmed", "processing"].includes(o.status) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  {isNepali ? "अर्डर रद्द गर्नुहोस्" : "Cancel order"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>
                  {isNepali ? `अर्डर ${o.order_number} रद्द गर्ने?` : `Cancel order ${o.order_number}?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isNepali
                    ? "यो कार्य फिर्ता गर्न सकिँदैन। सामग्रीहरू पुनः इन्भेन्टरीमा पठाइनेछ।"
                    : "This cannot be undone. Items will be released back to our inventory."}
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isNepali ? "अर्डर राख्नुहोस्" : "Keep order"}</AlertDialogCancel>
                  <AlertDialogAction onClick={cancel}>{isNepali ? "अर्डर रद्द गर्नुहोस्" : "Cancel order"}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {o.status === "delivered" && o.return_requests.length === 0 && (
            <Button size="sm" variant="secondary" onClick={() => setRet(true)}>
              {isNepali ? "सामान फिर्ता अनुरोध" : "Request return"}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 no-print">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">{isNepali ? "स्थिति:" : "Status:"}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${
                (o.status || "").toLowerCase().includes("deliver")
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : (o.status || "").toLowerCase().includes("cancel")
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
                  : (o.status || "").toLowerCase().includes("out")
                  ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
                  : (o.status || "").toLowerCase().includes("ship") || (o.status || "").toLowerCase().includes("pack")
                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
                  : (o.status || "").toLowerCase().includes("process")
                  ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                  : (o.status || "").toLowerCase().includes("confirm")
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
              }`}
            >
              {formatStatus(o.status)}
            </span>
          </div>
          {o.tracking_number && (
            <span>
              {isNepali ? "ट्र्याकिङ नं:" : "Tracking #:"} <b className="font-mono">{o.tracking_number}</b>
            </span>
          )}
          {o.estimated_delivery && (
            <span>
              {isNepali ? "अनुमानित डेलिभरी:" : "Est. delivery:"} {o.estimated_delivery}
            </span>
          )}
        </div>
        <Timeline status={o.status} events={o.order_events} />
        {o.return_requests[0] && (
          <p className="mt-4 text-sm">
            {isNepali ? "फिर्ता स्थिति:" : "Return request:"}{" "}
            <b>{formatStatus(o.return_requests[0].status)}</b>
          </p>
        )}
      </div>

      <article className="rounded-xl border bg-card p-6 sm:p-10 shadow-xs" aria-label="Invoice">
        <header className="flex flex-wrap justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="h-10 w-10" />
            <div>
              <p className="font-display text-2xl font-bold tracking-[0.12em]">DOVAN</p>
              <p className="text-xs text-muted-foreground">Kathmandu, Nepal · PAN: 609823145 · support@dovan.com.np</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-display text-xl font-bold uppercase tracking-wider">
              {isNepali ? "कर बिजक (TAX INVOICE)" : "Tax invoice"}
            </p>
            <p className="text-muted-foreground">
              {isNepali ? "बिजक नं:" : "Invoice:"}{" "}
              <span className="font-mono text-foreground">{o.invoice_number ?? "PENDING"}</span>
            </p>
            <p className="text-muted-foreground">
              {isNepali ? "अर्डर नं:" : "Order:"}{" "}
              <span className="font-mono text-foreground">{o.order_number}</span>
            </p>
            <p className="text-muted-foreground">
              {isNepali ? "मिति:" : "Date:"} {new Date(o.created_at).toLocaleDateString("en-GB")}
            </p>
          </div>
        </header>

        <div className="grid gap-6 py-6 text-sm sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-1">{isNepali ? "बिलिङ विवरण" : "Billed to"}</p>
            <p className="font-medium text-foreground">{ba.full_name || "—"}</p>
            {ba.phone && <p>{ba.phone}</p>}
            {ba.street && <p>{ba.street}, {ba.city}</p>}
            {ba.district && <p>{ba.district}, {ba.province} {isNepali ? "प्रदेश" : "Province"}</p>}
            {o.customer_email && <p className="text-muted-foreground">{o.customer_email}</p>}
          </div>
          <div>
            <p className="eyebrow mb-1">{isNepali ? "डेलिभरी ठेगाना" : "Shipped to"}</p>
            <p className="font-medium text-foreground">{sa.full_name || "—"}</p>
            {sa.phone && <p>{sa.phone}</p>}
            {sa.street && <p>{sa.street}, {sa.city}</p>}
            {sa.district && <p>{sa.district}, {sa.province} {isNepali ? "प्रदेश" : "Province"}</p>}
          </div>
        </div>

        {/* Mobile Items Cards (sm:hidden) */}
        <div className="space-y-2.5 sm:hidden">
          {(o.order_items || []).map((i: any) => (
            <div key={i.id} className="rounded-lg border bg-muted/20 p-3 text-xs flex justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground text-sm">{i.name}</p>
                {(i.size || i.color) && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {[i.size, i.color].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {i.quantity} × {formatPrice(i.unit_price)}
                </p>
              </div>
              <div className="text-right font-semibold text-foreground text-sm shrink-0">
                {formatPrice(i.line_total)}
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-left text-xs uppercase text-muted-foreground">
                <th className="py-2.5">{isNepali ? "विवरण" : "Item"}</th>
                <th>SKU</th>
                <th className="text-right">{isNepali ? "परिमाण" : "Qty"}</th>
                <th className="text-right">{isNepali ? "दर" : "Unit"}</th>
                <th className="text-right">{isNepali ? "जम्मा" : "Amount"}</th>
              </tr>
            </thead>
            <tbody>
              {(o.order_items || []).map((i: any) => (
                <tr key={i.id} className="border-b">
                  <td className="py-3">
                    <span className="font-medium">{i.name}</span>
                    {(i.size || i.color) && (
                      <span className="block text-xs text-muted-foreground">
                        {[i.size, i.color].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">{i.sku || "—"}</td>
                  <td className="text-right">{i.quantity}</td>
                  <td className="text-right">{formatPrice(i.unit_price)}</td>
                  <td className="text-right font-medium">{formatPrice(i.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isNepali ? "उप-जम्मा" : "Subtotal"}</dt>
            <dd>{formatPrice(o.subtotal)}</dd>
          </div>
          {Number(o.discount) > 0 && (
            <div className="flex justify-between text-success">
              <dt>{isNepali ? "छुट" : "Discount"} ({o.coupon_code ?? "PROMO"})</dt>
              <dd>−{formatPrice(o.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isNepali ? "डेलिभरी शुल्क" : "Shipping"}</dt>
            <dd>{Number(o.shipping_fee) === 0 ? (isNepali ? "निःशुल्क" : "FREE") : formatPrice(o.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{isNepali ? "भ्याट (१३%)" : "VAT 13% (Nepal)"}</dt>
            <dd>{formatPrice(o.tax)}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <dt>{isNepali ? "कुल जम्मा" : "Grand total"}</dt>
            <dd>{formatPrice(o.total)}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between border-t pt-4 text-xs text-muted-foreground">
          <p>
            {isNepali ? "भुक्तानी विधि:" : "Payment:"}{" "}
            <span className="font-medium text-foreground">
              {o.payment_method === "cod" ? (isNepali ? "क्यास अन डेलिभरी (COD)" : "Cash on delivery (COD)") : o.payment_method}
            </span>{" "}
            · {isNepali ? "स्थिति:" : "Status:"}{" "}
            <span className="font-medium text-foreground">{formatStatus(o.payment_status)}</span>
          </p>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>{isNepali ? "अफलाइन PDF सुरक्षित गर्नुहोस्" : "Save offline PDF"}</span>
          </button>
        </div>
      </article>

      <Dialog open={ret} onOpenChange={setRet}>
        <DialogContent>
          <DialogTitle>{isNepali ? "सामान फिर्ता अनुरोध" : "Request a return"}</DialogTitle>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isNepali
                ? "समस्याको विवरण लेख्नुहोस् (उदा. बिग्रेको सामान, साइज नमिलेको आदि)..."
                : "Tell us what's wrong (item defect, incorrect size, etc.)"
            }
            rows={4}
          />
          <Button onClick={requestReturn}>{isNepali ? "अनुरोध पेश गर्नुहोस्" : "Submit request"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
