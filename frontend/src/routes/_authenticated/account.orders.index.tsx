import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Download, ArrowRight, Package, RefreshCw } from "lucide-react";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/orders/")({ component: Orders });

function OrdersSkeleton() {
  return (
    <div className="mt-6 divide-y divide-border/60 border-t border-b border-border/80">
      {[1, 2, 3].map((i) => (
        <div key={i} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex gap-2 shrink-0">
              <Skeleton className="h-12 w-12 border border-border/60" />
              <Skeleton className="h-12 w-12 border border-border/60" />
            </div>
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <div className="flex items-center gap-4 justify-between sm:justify-end">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusIndicator(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver")) {
    return {
      dot: "bg-emerald-600 dark:bg-emerald-400",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-600/30",
    };
  }
  if (s.includes("cancel")) {
    return {
      dot: "bg-rose-600 dark:bg-rose-400",
      text: "text-rose-700 dark:text-rose-300",
      border: "border-rose-600/30",
    };
  }
  if (s.includes("out") || s.includes("ship") || s.includes("pack") || s.includes("process")) {
    return {
      dot: "bg-blue-600 dark:bg-blue-400",
      text: "text-blue-700 dark:text-blue-300",
      border: "border-blue-600/30",
    };
  }
  return {
    dot: "bg-amber-600 dark:bg-amber-400",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-600/30",
  };
}

function Orders() {
  const { user } = useShop();
  const { t, formatPrice, formatStatus } = useI18n();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["me", "orders", user?.id],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    queryFn: async () => {
      let list: any[] = [];

      try {
        const res = await api.get<{ orders: any[] }>("/orders");
        if (res?.orders && Array.isArray(res.orders)) {
          list = res.orders;
        }
      } catch (err) {
        console.warn("[Orders] Backend API /orders notice:", err);
      }

      if (list.length === 0 && user?.id) {
        try {
          const { data: directOrders } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("account_id", user.id)
            .order("created_at", { ascending: false });

          if (directOrders && directOrders.length > 0) {
            list = directOrders;
          }
        } catch (dbErr) {
          console.warn("[Orders] Supabase direct fallback notice:", dbErr);
        }
      }

      return list.map((ord: any) => {
        const rawItems = Array.isArray(ord.order_items)
          ? ord.order_items
          : Array.isArray(ord.items)
            ? ord.items
            : [];

        const items = rawItems.map((it: any) => ({
          ...it,
          id: it.id || it.product_id,
          name: it.title_snapshot || it.name || it.title || "Grocery Item",
          price: it.price_paise_snapshot ? it.price_paise_snapshot / 100 : (it.price ? it.price : 0),
          quantity: Number(it.quantity) || 1,
          image: it.image_url_snapshot || it.image || it.image_url || "/assets/products/canvas-tote.jpg",
        }));

        const total = ord.total ?? (ord.total_paise ? ord.total_paise / 100 : 0);

        return {
          ...ord,
          order_number: ord.order_number ?? `DOV-${ord.id.slice(0, 8).toUpperCase()}`,
          total,
          status: (ord.status || "Pending").toLowerCase(),
          order_items: items,
          items,
        };
      });
    },
  });

  const handleManualInvoiceDownload = async (e: React.MouseEvent, order: unknown) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const o = order as InvoiceOrder & { id: string };
      setDownloadingId(o.id);
      await downloadInvoice(o);
      toast.success(
        `Tax invoice downloaded for Order ${o.order_number}`
      );
    } catch {
      toast.error(
        "Could not generate PDF invoice. Please try again."
      );
    } finally {
      setTimeout(() => setDownloadingId(null), 600);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Ledger Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Fulfillment Records
          </div>
          <h2 className="mt-1 text-xl sm:text-2xl font-medium tracking-tight text-foreground font-display">
            Orders & Invoices
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Historical transaction records, courier dispatch stages, and official VAT invoices.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="h-8 gap-2 text-xs font-mono rounded-none border-border/80 hover:border-foreground self-start sm:self-auto"
        >
          <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading && <OrdersSkeleton />}

      {/* ── Empty State ───────────────────────────────────────── */}
      {!isLoading && orders.length === 0 && (
        <div className="py-12 sm:py-16 text-center border-t border-b border-border/80 space-y-3">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Archive Empty
          </div>
          <h3 className="text-base sm:text-lg font-medium text-foreground">
            No orders placed yet
          </h3>
          <p className="max-w-md mx-auto text-xs text-muted-foreground">
            When you complete an order, courier dispatch logs and official tax invoices will be filed here.
          </p>
          <div className="pt-2">
            <Button
              size="sm"
              className="h-9 px-5 text-xs font-medium rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors"
              asChild
            >
              <Link to="/shop">Browse Catalog</Link>
            </Button>
          </div>
        </div>
      )}

      {/* ── Orders Ledger List ────────────────────────────────── */}
      {!isLoading && orders.length > 0 && (
        <div className="divide-y divide-border/80 border-t border-b border-border/80">
          {orders.map((o) => {
            const itemsList = Array.isArray(o.order_items) ? o.order_items : [];
            const indicator = getStatusIndicator(o.status);

            return (
              <div
                key={o.id}
                className="py-5 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between transition-colors hover:bg-muted/[0.15]"
              >
                {/* Left: Product preview + Order meta */}
                <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                  {/* Clean Non-Overlapping Thumbnails */}
                  <div className="flex gap-1.5 shrink-0">
                    {itemsList.slice(0, 2).map((i: any, k: number) => (
                      <img
                        key={k}
                        src={i.image || "/assets/products/canvas-tote.jpg"}
                        alt={i.name || "Product"}
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                        className="h-12 w-12 border border-border/80 object-cover bg-muted"
                      />
                    ))}
                    {itemsList.length > 2 && (
                      <div className="h-12 w-12 border border-border/80 bg-muted/40 grid place-items-center text-[11px] font-mono font-medium text-muted-foreground">
                        +{itemsList.length - 2}
                      </div>
                    )}
                    {itemsList.length === 0 && (
                      <div className="h-12 w-12 border border-border/80 bg-muted/40 grid place-items-center text-muted-foreground">
                        <Package className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/account/orders/$id"
                        params={{ id: o.id }}
                        className="font-mono text-xs sm:text-sm font-semibold text-foreground hover:underline"
                      >
                        {o.order_number}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${indicator.border} ${indicator.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${indicator.dot}`} />
                        <span>{formatStatus(o.status)}</span>
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      Placed{" "}
                      {new Date(o.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {o.invoice_number ? ` · Tax Invoice ${o.invoice_number}` : ""}
                      {itemsList.length > 0 ? ` · ${itemsList.length} ${itemsList.length === 1 ? "item" : "items"}` : ""}
                    </p>
                  </div>
                </div>

                {/* Right: Price + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-xs text-muted-foreground block sm:hidden uppercase">
                      Total
                    </span>
                    <span className="font-semibold text-sm sm:text-base text-foreground font-mono">
                      {formatPrice(o.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={downloadingId === o.id}
                      onClick={(e) => handleManualInvoiceDownload(e, o)}
                      className="h-8 gap-1.5 text-xs font-mono rounded-none border-border/80 hover:border-foreground"
                      title="Download Tax Invoice PDF"
                    >
                      <Download className="h-3 w-3" />
                      <span>{t("pdf_invoice")}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 gap-1 text-xs font-medium text-foreground hover:bg-muted/40 rounded-none"
                    >
                      <Link to="/account/orders/$id" params={{ id: o.id }}>
                        <span>Details</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}