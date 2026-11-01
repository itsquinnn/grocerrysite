import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight, Package } from "lucide-react";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account/orders/")({ component: Orders });

function Orders() {
  const { user } = useShop();
  const { t, formatPrice, formatStatus, isNepali } = useI18n();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["me", "orders", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const handleManualInvoiceDownload = (e: React.MouseEvent, order: unknown) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const o = order as InvoiceOrder & { id: string };
      setDownloadingId(o.id);
      downloadInvoice(o);
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
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">{t("orders_and_invoices")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("orders_subtitle")}</p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-3">
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </div>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed bg-card/60 p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-lg font-medium">{isNepali ? "कुनै अर्डर छैन" : "No orders yet"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isNepali
              ? "तपाईंले अर्डर पूरा गरेपछि यहाँ डेलिभरी ट्र्याक गर्न र कुनै पनि समय कर बिल (PDF) डाउनलोड गर्न सक्नुहुन्छ।"
              : "When you complete an order, you can track it here and download PDF invoices anytime."}
          </p>
          <Button className="mt-5" asChild>
            <Link to="/shop">{isNepali ? "किनमेल सुरु गर्नुहोस्" : "Explore Collection"}</Link>
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {orders?.map((o) => (
          <li key={o.id}>
            <div className="group relative flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all hover:border-foreground/40 sm:flex-row sm:items-center">
              <Link
                to="/account/orders/$id"
                params={{ id: o.id }}
                className="flex flex-1 items-center gap-4"
              >
                <div className="flex shrink-0 -space-x-3 overflow-hidden">
                  {o.order_items.slice(0, 3).map((i, k) => (
                    <img
                      key={k}
                      src={i.image ?? ""}
                      alt=""
                      className="h-14 w-11 rounded-md border-2 border-card object-cover bg-muted"
                    />
                  ))}
                  {o.order_items.length > 3 && (
                    <span className="grid h-14 w-11 place-items-center rounded-md border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                      +{o.order_items.length - 3}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground font-mono">{o.order_number}</p>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                      {formatStatus(o.status)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {isNepali ? "अर्डर मिति: " : "Placed on "}
                    {new Date(o.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {o.invoice_number ? ` · ${isNepali ? "बिल" : "Invoice"} ${o.invoice_number}` : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold sm:hidden">{formatPrice(o.total)}</p>
                </div>
              </Link>

              <div className="flex items-center justify-between gap-3 border-t pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                <span className="hidden text-base font-semibold sm:inline-block">
                  {formatPrice(o.total)}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={downloadingId === o.id}
                    onClick={(e) => handleManualInvoiceDownload(e, o)}
                    className="h-8 gap-1.5 text-xs hover:bg-muted"
                    title={isNepali ? "कर बिल PDF डाउनलोड गर्नुहोस्" : "Download Tax Invoice PDF"}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>{t("pdf_invoice")}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Link to="/account/orders/$id" params={{ id: o.id }}>
                      <span>{isNepali ? "विवरण" : "Details"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
