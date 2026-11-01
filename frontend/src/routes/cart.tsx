import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useShop } from "@/lib/shop";
import { useI18n, toDevanagari } from "@/lib/i18n";
import { useCartDetails, QtyStepper } from "@/components/site/CartDrawer";
import { fetchQuote, type Quote } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — DOVAN" },
      { name: "description", content: "Review the items in your DOVAN shopping cart." },
      { property: "og:title", content: "Your cart — DOVAN" },
      { property: "og:description", content: "Review the items in your DOVAN shopping cart." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

export function SummaryRows({ q }: { q: Quote }) {
  const { t, formatPrice, isNepali } = useI18n();

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>{t("subtotal")}</dt>
        <dd>{formatPrice(q.subtotal)}</dd>
      </div>
      {q.discount > 0 && (
        <div className="flex justify-between text-success">
          <dt>{t("discount")} ({q.coupon_code})</dt>
          <dd>−{formatPrice(q.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>{t("shipping_fee")}</dt>
        <dd>{q.shipping_fee === 0 ? t("free") : formatPrice(q.shipping_fee)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>
          {isNepali
            ? `भ्याट (${toDevanagari(q.tax_rate ?? 13)}%)`
            : `VAT (${q.tax_rate ?? 13}%)`}
        </dt>
        <dd>{formatPrice(q.tax)}</dd>
      </div>
      <div className="flex justify-between border-t pt-3 text-base font-semibold">
        <dt>{t("total")}</dt>
        <dd>{formatPrice(q.total)}</dd>
      </div>
    </dl>
  );
}

function CartPage() {
  const { cart, setQty, removeFromCart } = useShop();
  const { t, formatPrice, isNepali, translateProduct } = useI18n();
  const { lines } = useCartDetails();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    if (!cart.length) {
      setQuote(null);
      return;
    }
    fetchQuote(cart, applied, "standard")
      .then((q) => {
        setQuote(q);
        setErr(null);
      })
      .catch((e) => setErr(e.message));
  }, [cart, applied]);

  if (!cart.length)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-4xl font-display">{t("empty_cart")}</h1>
        <p className="mt-2 text-muted-foreground">
          {isNepali ? "तपाईंलाई मन पर्ने सामग्री खोज्नुहोस्।" : "Find something you'll love."}
        </p>
        <Button className="mt-6" asChild>
          <Link to="/shop">{t("continue_shopping")}</Link>
        </Button>
      </div>
    );

  return (
    <div className="container-page py-6 md:py-8">
      <h1 className="text-4xl font-display">{t("shopping_cart")}</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <ul className="divide-y border-y">
          {lines.map(({ line, product }) => (
            <li key={`${line.product_id}-${line.size}-${line.color}`} className="flex gap-4 py-5">
              <img
                src={product.images[0] || "/assets/products/canvas-tote.jpg"}
                alt={translateProduct(product.name)}
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                className="h-32 w-24 rounded object-cover bg-muted"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="font-medium hover:underline"
                    >
                      {translateProduct(product.name)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[line.size, line.color].filter(Boolean).join(" · ")} · {formatPrice(product.price)}{" "}
                      {isNepali ? "प्रति गोटा" : "each"}
                    </p>
                    {product.stock < line.quantity && (
                      <p className="text-xs text-destructive">
                        {isNepali
                          ? `स्टकमा मात्र ${product.stock} बाँकी — कृपया परिमाण घटाउनुहोस्`
                          : `Only ${product.stock} in stock — please reduce quantity`}
                      </p>
                    )}
                  </div>
                  <span className="font-semibold">
                    {formatPrice(Number(product.price) * line.quantity)}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <QtyStepper
                    value={line.quantity}
                    max={product.stock}
                    onChange={(n) => setQty(line, n)}
                  />
                  <button
                    onClick={() => removeFromCart(line)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit rounded-md border bg-card p-6 shadow-xs">
          <h2 className="text-xl font-semibold">{t("order_summary")}</h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(coupon);
            }}
          >
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder={t("coupon_code")}
              aria-label={t("coupon_code")}
            />
            <Button variant="outline" type="submit">
              {t("apply")}
            </Button>
          </form>
          {quote?.coupon_error && applied && (
            <p className="mt-2 text-sm text-destructive">{quote.coupon_error}</p>
          )}
          {quote?.coupon_code && (
            <p className="mt-2 text-sm text-success">
              {isNepali
                ? `कुपन ${quote.coupon_code} लागू भयो`
                : `Coupon ${quote.coupon_code} applied`}
            </p>
          )}
          <div className="mt-5">
            {quote ? <SummaryRows q={quote} /> : <div className="h-32 animate-pulse rounded bg-muted" />}
          </div>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!!err || !quote}
            onClick={() =>
              nav({ to: "/checkout", search: { coupon: applied || undefined } })
            }
          >
            {t("proceed_to_checkout")}
          </Button>
          <Button variant="link" className="mt-2 w-full" asChild>
            <Link to="/shop">{t("continue_shopping")}</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
