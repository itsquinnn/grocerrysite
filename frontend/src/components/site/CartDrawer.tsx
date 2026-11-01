import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useShop, type CartLine } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery, type Product } from "@/lib/catalog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export function useCartDetails() {
  const { cart } = useShop();
  const { data: products = [], isLoading } = useQuery(allProductsQuery);
  const lines = cart
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.product_id) }))
    .filter((x): x is { line: CartLine; product: Product } => !!x.product);
  const subtotal = lines.reduce((s, x) => s + Number(x.product.price) * x.line.quantity, 0);
  return { lines, subtotal, isLoading };
}

export function QtyStepper({ value, max, onChange }: { value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-md border">
      <button className="p-2 disabled:opacity-40" onClick={() => onChange(value - 1)} aria-label="Decrease quantity">
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm" aria-live="polite">
        {value}
      </span>
      <button
        className="p-2 disabled:opacity-40"
        disabled={value >= Math.min(max, 20)}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function CartDrawer() {
  const { cartOpen, setCartOpen, setQty, removeFromCart } = useShop();
  const { t, formatPrice, isNepali, translateProduct } = useI18n();
  const { lines, subtotal } = useCartDetails();
  const nav = useNavigate();

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetTitle className="font-display text-2xl">{t("your_cart")}</SheetTitle>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">{t("empty_cart")}</p>
            <Button onClick={() => { setCartOpen(false); void nav({ to: "/shop" }); }}>
              {isNepali ? "किनमेल सुरु गर्नुहोस्" : "Start shopping"}
            </Button>
          </div>
        ) : (
          <>
            <ul className="-mx-2 flex-1 divide-y overflow-y-auto px-2">
              {lines.map(({ line, product }) => (
                <li key={`${line.product_id}-${line.size}-${line.color}`} className="flex gap-3 py-4">
                  <img
                    src={product.images[0] || "/assets/products/canvas-tote.jpg"}
                    alt={product.name}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                    className="h-24 w-20 rounded object-cover bg-muted"
                  />
                  <div className="flex flex-1 flex-col">
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      onClick={() => setCartOpen(false)}
                      className="text-sm font-medium hover:underline"
                    >
                      {translateProduct(product.name)}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {[line.size, line.color].filter(Boolean).join(" · ")}
                    </span>
                    {product.stock < line.quantity && (
                      <span className="text-xs text-destructive">
                        {isNepali ? `मात्र ${product.stock} बाँकी` : `Only ${product.stock} left`}
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={line.quantity} max={product.stock} onChange={(n) => setQty(line, n)} />
                      <span className="text-sm font-semibold">{formatPrice(Number(product.price) * line.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(line)}
                    aria-label={`Remove ${product.name}`}
                    className="self-start p-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span className="font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {isNepali
                  ? "डेलिभरी शुल्क, भ्याट र छुट कुपन चेकआउट गर्दा हिसाब हुनेछ।"
                  : "Shipping, VAT and coupons calculated at checkout."}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setCartOpen(false); void nav({ to: "/cart" }); }}>
                  {isNepali ? "कार्ट हेर्नुहोस्" : "View cart"}
                </Button>
                <Button onClick={() => { setCartOpen(false); void nav({ to: "/checkout" }); }}>
                  {isNepali ? "चेकआउट" : "Checkout"}
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
