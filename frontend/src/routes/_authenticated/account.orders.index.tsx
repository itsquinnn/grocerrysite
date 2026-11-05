import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Download, ChevronRight, Package, RefreshCw } from "lucide-react";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/account/orders/")({ component: Orders });

function OrdersSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-xl border bg-card/60 p-4 sm:flex-row sm:items-center justify-between"
        >
          <div className="flex flex-1 items-center gap-4">
            <div className="flex shrink-0 -space-x-3 overflow-hidden">
              <Skeleton className="h-14 w-11 rounded-md border-2 border-card" />
              <Skeleton className="h-14 w-11 rounded-md border-2 border-card opacity-70" />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28 rounded" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-44 rounded" />
              <Skeleton className="h-4 w-20 rounded sm:hidden" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t pt-3 sm:border-0 sm:pt-0 sm:justify-end">
            <Skeleton className="hidden h-5 w-24 rounded sm:inline-block" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function getCustomerStatusBadge(status: string) {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver")) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
  if (s.includes("cancel")) return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
  if (s.includes("out")) return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30";
  if (s.includes("ship") || s.includes("pack")) return "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30";
  if (s.includes("process")) return "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30";
  if (s.includes("confirm")) return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
  return "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
}

function Orders() {
  const { user } = useShop();
  const { t, formatPrice, formatStatus, isNepali } = useI18n();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["me", "orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      let list: any[] = [];

      // 1. Primary: Fetch through backend API with elevated service role
      try {
        const res = await api.get<{ orders: any[] }>("/orders");
        if (res?.orders && Array.isArray(res.orders)) {
          list = res.orders;
        }
      } catch (err) {
        console.warn("[Orders] Backend API /orders notice:", err);
      }

      // 2. Fallback: Direct Supabase query if backend API returned empty or errored
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
          image: it.image_url_snapshot || it.image || it.image_url || "/placeholder.svg",
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
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">{t("orders_and_invoices")}</h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{t("orders_subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={isFetching}
          className="h-8 gap-1.5 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {isLoading && <OrdersSkeleton />}

      {!isLoading && orders.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed bg-card/60 p-8 sm:p-12 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-lg font-medium">No orders yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When you complete an order, you can track it here and download PDF invoices anytime.
          </p>
          <Button className="mt-5" asChild>
            <Link to="/shop">Explore Collection</Link>
          </Button>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {orders.map((o) => {
          const itemsList = Array.isArray(o.order_items) ? o.order_items : [];

          return (
            <li key={o.id}>
              <div className="group relative flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all hover:border-foreground/40 sm:flex-row sm:items-center">
                <Link
                  to="/account/orders/$id"
                  params={{ id: o.id }}
                  className="flex flex-1 items-center gap-4"
                >
                  <div className="flex shrink-0 -space-x-3 overflow-hidden">
                    {itemsList.slice(0, 3).map((i: any, k: number) => (
                      <img
                        key={k}
                        src={i.image || "/placeholder.svg"}
                        alt={i.name || "Product"}
                        className="h-14 w-11 rounded-md border-2 border-card object-cover bg-muted"
                      />
                    ))}
                    {itemsList.length > 3 && (
                      <span className="grid h-14 w-11 place-items-center rounded-md border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                        +{itemsList.length - 3}
                      </span>
                    )}
                    {itemsList.length === 0 && (
                      <div className="grid h-14 w-11 place-items-center rounded-md border-2 border-card bg-muted text-xs font-semibold text-muted-foreground">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground font-mono">{o.order_number}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize border ${getCustomerStatusBadge(
                          o.status
                        )}`}
                      >
                        {formatStatus(o.status)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Placed on{" "}
                      {new Date(o.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {o.invoice_number ? ` · Invoice ${o.invoice_number}` : ""}
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
                      title="Download Tax Invoice PDF"
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
                        <span>Details</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}