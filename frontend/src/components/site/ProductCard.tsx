import { Link } from "@tanstack/react-router";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import type { Product } from "@/lib/catalog";
import { discountPct } from "@/lib/format";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Stars } from "./Stars";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const FALLBACK_IMG = "/assets/products/canvas-tote.jpg";

function ProductCardInner({ p, layout = "grid" }: { p: Product; layout?: "grid" | "list" }) {
  const { wishlist, toggleWishlist, addToCart, setCartOpen } = useShop();
  const { t, formatPrice, isNepali, translateProduct } = useI18n();
  const displayName = translateProduct(p.name);
  const [quick, setQuick] = useState(false);
  const off = discountPct(Number(p.price), p.compare_at_price ? Number(p.compare_at_price) : null);
  const saved = wishlist.includes(p.id);
  const out = p.stock <= 0;

  const quickAdd = async () => {
    const ok = await addToCart({ product_id: p.id, size: p.sizes[0] ?? "", color: p.colors[0] ?? "", quantity: 1 }, p.stock);
    if (ok) {
      toast.success(`${p.name} added to cart`);
      setCartOpen(true);
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col h-full",
        layout === "list" && "flex-row gap-4 rounded-md border bg-card p-3 sm:gap-6"
      )}
    >
      <div className={cn("relative overflow-hidden rounded-md bg-muted shrink-0", layout === "list" ? "w-28 shrink-0 sm:w-36" : "")}>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="block aspect-square overflow-hidden">
          <img
            src={p.images[0] || FALLBACK_IMG}
            alt={p.name}
            loading="lazy"
            decoding="async"
            width={400}
            height={400}
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] transform-gpu will-change-transform"
          />
        </Link>
        <div className="absolute left-1.5 top-1.5 flex flex-col gap-1">
          {off > 0 && <span className="rounded-xs bg-sale px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-accent-foreground shadow-xs">-{off}%</span>}
          {out && <span className="rounded-xs bg-primary px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-primary-foreground">{t("out_of_stock")}</span>}
        </div>
        <button
          onClick={() => toggleWishlist(p.id)}
          aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-card/95 shadow-xs transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          <Heart className={cn("h-3 w-3 transition-transform duration-200", saved && "fill-accent text-accent scale-110")} />
        </button>
        {layout === "grid" && (
          <div className="absolute inset-x-1.5 bottom-1.5 hidden gap-1.5 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:flex">
            <Button
              size="sm"
              variant="secondary"
              className="h-7 w-7 p-0 shrink-0 shadow-xs bg-secondary/95 hover:bg-secondary"
              onClick={() => setQuick(true)}
              title="Quick view"
              aria-label="Quick view"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="flex-1 h-7 px-2 text-[11px] font-medium shadow-xs"
              disabled={out}
              onClick={quickAdd}
            >
              <ShoppingBag className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", layout === "grid" ? "pt-1.5 sm:pt-2" : "justify-center")}>
        <p className="eyebrow text-[9px] sm:text-[10px] tracking-wider">{p.brands?.name}</p>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="mt-0.5 line-clamp-1 font-medium text-xs sm:text-[13px] hover:underline leading-snug">{displayName}</Link>
        <div className="mt-0.5 flex h-3.5 items-center">
          {p.rating_count > 0 ? (
            <Stars value={Number(p.rating_avg)} count={p.rating_count} />
          ) : (
            <span className="text-[10px] text-muted-foreground/60 font-normal">
              New arrival
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-semibold text-xs sm:text-sm">{formatPrice(p.price)}</span>
          {off > 0 && <span className="text-[10px] sm:text-[11px] text-muted-foreground line-through">{formatPrice(p.compare_at_price)}</span>}
        </div>
        {layout === "list" && (
          <>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-auto pt-3">
              <Button size="sm" disabled={out} onClick={quickAdd}>
                {out ? t("out_of_stock") : t("add_to_cart")}
              </Button>
            </div>
          </>
        )}
        {layout === "grid" && (
          <div className="mt-auto pt-2.5 md:hidden">
            <Button size="sm" variant="outline" className="h-8 w-full text-xs font-medium" disabled={out} onClick={quickAdd}>
              {out ? t("out_of_stock") : t("add_to_cart")}
            </Button>
          </div>
        )}
      </div>

      {quick && (
        <Dialog open={quick} onOpenChange={setQuick}>
          <DialogContent className="max-w-3xl">
            <div className="grid gap-6 sm:grid-cols-2">
              <img
                src={p.images[0] || FALLBACK_IMG}
                alt={p.name}
                loading="lazy"
                decoding="async"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                className="aspect-square w-full rounded-md object-cover"
              />
              <div className="flex flex-col">
                <p className="eyebrow">{p.brands?.name}</p>
                <DialogTitle className="mt-1 font-display text-2xl">{displayName}</DialogTitle>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-semibold">{formatPrice(p.price)}</span>
                  {off > 0 && <span className="text-muted-foreground line-through">{formatPrice(p.compare_at_price)}</span>}
                </div>
                <DialogDescription className="mt-3 text-sm">{p.description}</DialogDescription>
                <p className="mt-3 text-sm">
                  {out ? (
                    <span className="text-destructive">{t("out_of_stock")}</span>
                  ) : (
                    <span className="text-success">{p.stock} in stock</span>
                  )}
                </p>
                <div className="mt-auto flex gap-2 pt-6">
                  <Button className="flex-1" disabled={out} onClick={() => { void quickAdd(); setQuick(false); }}>
                    {t("add_to_cart")}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/product/$slug" params={{ slug: p.slug }}>
                      Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </article>
  );
}

export const ProductCard = memo(ProductCardInner);

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square rounded-md bg-muted" />
      <div className="mt-2.5 h-3 w-1/3 rounded bg-muted" />
      <div className="mt-1.5 h-3.5 w-2/3 rounded bg-muted" />
      <div className="mt-1.5 h-3.5 w-1/2 rounded bg-muted" />
    </div>
  );
}
