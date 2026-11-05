import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useShop, type CartLine } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery, type Product } from "@/lib/catalog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function useCartDetails() {
  const { cart } = useShop();
  const { data: products = [], isLoading } = useQuery(allProductsQuery);
  const lines = cart
    .map((l) => ({ line: l, product: products.find((p) => p.id === l.product_id) }))
    .filter((x): x is { line: CartLine; product: Product } => !!x.product);
  const subtotal = lines.reduce((s, x) => s + Number(x.product.price) * x.line.quantity, 0);
  return { lines, subtotal, isLoading };
}

export function QtyStepper({
  value,
  max,
  onChange,
  className,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  const [typed, setTyped] = useState<string>(String(value));

  useEffect(() => {
    setTyped(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || parsed < 1) {
      onChange(1);
      setTyped("1");
    } else if (max > 0 && parsed > max) {
      onChange(max);
      setTyped(String(max));
      toast.error(`Cannot order more than available stock (${max})`, { id: "stock-limit" });
    } else {
      onChange(parsed);
      setTyped(String(parsed));
    }
  };

  const handleMinus = () => {
    if (value > 1) {
      const next = value - 1;
      onChange(next);
      setTyped(String(next));
    }
  };

  const handlePlus = () => {
    if (max > 0 && value >= max) {
      toast.error(`Cannot order more than available stock (${max})`, { id: "stock-limit" });
      return;
    }
    const next = value + 1;
    onChange(next);
    setTyped(String(next));
  };

  const isMax = max > 0 ? value >= max : false;
  const isOutOfStock = max <= 0;

  return (
    <div className={cn("inline-flex items-center rounded-md border bg-background shadow-xs", className)}>
      <button
        type="button"
        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        onClick={handleMinus}
        disabled={value <= 1 || isOutOfStock}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <input
        type="number"
        min={1}
        max={max > 0 ? max : 1}
        value={typed}
        disabled={isOutOfStock}
        onChange={(e) => {
          const val = e.target.value;
          setTyped(val);
          const parsed = parseInt(val, 10);
          if (!isNaN(parsed)) {
            if (max > 0 && parsed > max) {
              onChange(max);
              setTyped(String(max));
              toast.error(`Cannot order more than available stock (${max})`, { id: "stock-limit" });
            } else if (parsed >= 1) {
              onChange(parsed);
            }
          }
        }}
        onBlur={() => commit(typed)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(typed);
          }
        }}
        className="w-10 text-center text-sm font-medium bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Quantity"
      />

      <button
        type="button"
        className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        disabled={isMax || isOutOfStock}
        onClick={handlePlus}
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
              Start shopping
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
                        Only {product.stock} left
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <QtyStepper value={line.quantity} max={product.stock} onChange={(n) => setQty(line, n, product.stock)} />
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
                Shipping, VAT and coupons calculated at checkout.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => { setCartOpen(false); void nav({ to: "/cart" }); }}>
                  View cart
                </Button>
                <Button onClick={() => { setCartOpen(false); void nav({ to: "/checkout" }); }}>
                  Checkout
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
