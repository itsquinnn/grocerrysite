import { Link } from "@tanstack/react-router";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import { useState } from "react";
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

export function ProductCard({ p, layout = "grid" }: { p: Product; layout?: "grid" | "list" }) {
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
      toast.success(isNepali ? `${displayName} कार्टमा थपियो` : `${p.name} added to cart`);
      setCartOpen(true);
    }
  };

  return (
    <article
      className={cn(
        "group relative flex flex-col h-full transition-transform duration-300 ease-out",
        layout === "list" && "flex-row gap-4 rounded-md border bg-card p-3 sm:gap-6"
      )}
    >
      <div className={cn("relative overflow-hidden rounded-md bg-muted shrink-0", layout === "list" ? "w-32 shrink-0 sm:w-44" : "")}>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="block aspect-[4/5] overflow-hidden">
          <img src={p.images[0] || FALLBACK_IMG} alt={p.name} loading="lazy" width={800} height={1000}
            onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {off > 0 && <span className="rounded-sm bg-sale px-2 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm">-{off}%</span>}
          {out && <span className="rounded-sm bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">{t("out_of_stock")}</span>}
        </div>
        <button onClick={() => toggleWishlist(p.id)} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-card/90 shadow-card backdrop-blur-sm transition-all duration-200 hover:scale-110 active:scale-90">
          <Heart className={cn("h-4 w-4 transition-transform duration-200", saved && "fill-accent text-accent scale-110")} />
        </button>
        {layout === "grid" && (
          <div className="absolute inset-x-2 bottom-2 hidden gap-2 translate-y-2 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 md:flex">
            <Button size="sm" variant="secondary" className="flex-1 shadow-sm backdrop-blur-sm" onClick={() => setQuick(true)}>
              <Eye className="h-4 w-4" />
              {isNepali ? "द्रुत दृश्य" : "Quick view"}
            </Button>
            <Button size="sm" className="flex-1 shadow-sm" disabled={out} onClick={quickAdd}>
              <ShoppingBag className="h-4 w-4" />
              {isNepali ? "थप्नुहोस्" : "Add"}
            </Button>
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col", layout === "grid" ? "pt-2.5 sm:pt-3" : "justify-center")}>
        <p className="eyebrow">{p.brands?.name}</p>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="mt-0.5 line-clamp-1 font-medium hover:underline leading-snug">{displayName}</Link>
        <div className="mt-1 flex h-4 items-center">
          {p.rating_count > 0 ? (
            <Stars value={Number(p.rating_avg)} count={p.rating_count} />
          ) : (
            <span className="text-[11px] text-muted-foreground/45 font-normal">
              {isNepali ? "नयाँ सामग्री" : "New arrival"}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-semibold">{formatPrice(p.price)}</span>
          {off > 0 && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.compare_at_price)}</span>}
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

      <Dialog open={quick} onOpenChange={setQuick}>
        <DialogContent className="max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            <img
              src={p.images[0] || FALLBACK_IMG}
              alt={p.name}
              onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
              className="aspect-[4/5] w-full rounded-md object-cover"
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
                  <span className="text-success">{p.stock} {isNepali ? "उपलब्ध छ" : "in stock"}</span>
                )}
              </p>
              <div className="mt-auto flex gap-2 pt-6">
                <Button className="flex-1" disabled={out} onClick={() => { void quickAdd(); setQuick(false); }}>
                  {t("add_to_cart")}
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/product/$slug" params={{ slug: p.slug }}>
                    {isNepali ? "विस्तृत विवरण" : "Details"}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-md bg-muted" />
      <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
      <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
      <div className="mt-2 h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}
