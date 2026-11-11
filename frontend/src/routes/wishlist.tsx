import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Clock, ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { allProductsQuery, type Product } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { getOfflineProduct, getRecentViewedProducts } from "@/lib/offline";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Saved Items: DOVAN" },
      { name: "description", content: "Products you've saved at DOVAN. Available offline and synced across devices." },
      { property: "og:title", content: "Wishlist & Saved Items: DOVAN" },
      { property: "og:description", content: "Browse saved items and recently viewed catalog." },
    ],
  }),
  component: WishlistPage,
});

export const FALLBACK_IMG = "/assets/products/canvas-tote.jpg";

function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart, user, setCartOpen } = useShop();
  const { t, formatPrice, translateProduct } = useI18n();
  const { data: products = [] } = useQuery(allProductsQuery);
  const [recentViewed, setRecentViewed] = useState<Product[]>([]);

  useEffect(() => {
    setRecentViewed(getRecentViewedProducts());
  }, []);

  const items = wishlist
    .map((id) => products.find((p) => p.id === id) ?? getOfflineProduct(id))
    .filter((p): p is Product => Boolean(p));

  const moveToCart = async (p: Product) => {
    const ok = await addToCart(
      { product_id: p.id, size: p.sizes?.[0] ?? "", color: p.colors?.[0] ?? "", quantity: 1 },
      p.stock
    );
    if (ok) {
      void toggleWishlist(p.id);
      toast.success(`${p.name} moved to cart`, { id: `move-${p.id}` });
      setCartOpen(true);
    }
  };

  const clearWishlist = () => {
    for (const item of items) {
      void toggleWishlist(item.id);
    }
    toast.success("Wishlist cleared");
  };

  return (
    <div className="container-page py-6 sm:py-8 md:py-10 space-y-10 sm:space-y-14">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
              Saved Collection
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-medium tracking-tight text-foreground">
                Wishlist
              </h1>
              {items.length > 0 && (
                <span className="font-mono text-xs text-muted-foreground">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {!user && items.length > 0 ? (
                <>
                  Saved locally on this device.{" "}
                  <Link to="/login" className="underline underline-offset-2 hover:text-foreground">
                    Sign in
                  </Link>{" "}
                  to synchronize across all your devices.
                </>
              ) : (
                "Curated essentials and ingredients saved for future purchases and orders."
              )}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearWishlist}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-destructive transition-colors cursor-pointer self-start sm:self-auto pb-0.5 border-b border-transparent hover:border-destructive/40"
              title="Remove all saved items"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear wishlist</span>
            </button>
          )}
        </div>

        {/* ── Empty State (Non-slop, clean architectural archive) ── */}
        {items.length === 0 ? (
          <div className="py-14 sm:py-20 text-center border-t border-b border-border/80 space-y-3">
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/75">
              Archive Empty
            </div>
            <h2 className="text-base sm:text-lg font-medium text-foreground">
              No saved items yet
            </h2>
            <p className="max-w-md mx-auto text-xs text-muted-foreground">
              Tap the heart icon on any grocery or pantry item across our catalog to preserve it in your personal ledger.
            </p>
            <div className="pt-3">
              <Button
                size="sm"
                className="h-9 px-5 text-xs font-medium rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
                asChild
              >
                <Link to="/shop">Discover Catalog</Link>
              </Button>
            </div>
          </div>
        ) : (
          /* ── Saved Items Ledger (Flat divided rows, zero cards) ── */
          <div className="divide-y divide-border/80 border-t border-b border-border/80">
            {items.map((p) => {
              const inStock = p.stock > 0;

              return (
                <div
                  key={p.id}
                  className="py-5 sm:py-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between transition-colors hover:bg-muted/[0.12]"
                >
                  {/* Left: Product Media + Details */}
                  <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="block h-18 w-18 sm:h-20 sm:w-20 border border-border/80 bg-muted shrink-0 overflow-hidden"
                    >
                      <img
                        src={p.images?.[0] || FALLBACK_IMG}
                        alt={p.name}
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </Link>

                    <div className="min-w-0 space-y-1">
                      {p.brands?.name && (
                        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {p.brands.name}
                        </p>
                      )}
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="font-medium text-xs sm:text-sm text-foreground hover:underline line-clamp-1 leading-snug"
                      >
                        {translateProduct(p.name)}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-foreground font-mono">
                          {formatPrice(p.price)}
                        </span>
                        <span className="text-border">·</span>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                            inStock ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              inStock ? "bg-emerald-600 dark:bg-emerald-400" : "bg-rose-600 dark:bg-rose-400"
                            }`}
                          />
                          <span>{inStock ? t("in_stock") : t("out_of_stock")}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-t-0">
                    <Button
                      size="sm"
                      disabled={!inStock}
                      onClick={() => moveToCart(p)}
                      className="h-8.5 px-4 text-xs font-medium rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <ShoppingBag className="h-3 w-3 mr-1.5" />
                      <span>{t("move_to_cart") || "Move to cart"}</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => toggleWishlist(p.id)}
                      className="h-8.5 px-3 text-xs font-mono text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer border border-transparent hover:border-destructive/30"
                      title="Remove from wishlist"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Recently Viewed Section (Compact, harmonious horizontal rail) ── */}
      {recentViewed.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-border/80">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base sm:text-lg font-medium text-foreground font-display">
                {t("recently_viewed")}
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/75">
              Cached locally
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Items you have recently inspected, preserved locally so you can browse even without an active internet connection.
          </p>

          <div className="pt-1 flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2.5">
            {recentViewed.slice(0, 10).map((p) => (
              <div key={p.id} className="w-[125px] xs:w-[135px] sm:w-[145px] md:w-[155px] shrink-0">
                <ProductCard p={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
