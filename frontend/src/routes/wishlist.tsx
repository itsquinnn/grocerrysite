import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Heart, Clock, ShoppingBag } from "lucide-react";
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
  const { t, formatPrice, isNepali, translateProduct } = useI18n();
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
      toast.success("Moved to cart", { id: `move-${p.id}` });
      setCartOpen(true);
    }
  };

  return (
    <div className="container-page space-y-12 py-6 md:space-y-16 md:py-10">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl">
                {"Wishlist"}
              </h1>
              {items.length > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent/15 px-2 text-xs font-semibold text-accent">
                  {items.length}
                </span>
              )}
            </div>
            {!user && items.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                Saved on this device. <Link to="/login" className="underline underline-offset-2 hover:text-foreground">Sign in</Link> to sync across all your devices.
              </p>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-card/50 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-medium">{"Nothing saved yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {"Click the heart icon on any product to save it to your wishlist."}
            </p>
            <Button className="mt-5" asChild>
              <Link to="/shop">{"Discover products"}</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <li
                key={p.id}
                className="group flex gap-4 rounded-xl border bg-card p-3.5 shadow-xs transition hover:border-foreground/30 hover:shadow-sm"
              >
                <Link
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="shrink-0 overflow-hidden rounded-lg bg-muted"
                >
                  <img
                    src={p.images?.[0] || FALLBACK_IMG}
                    alt={p.name}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                    className="h-32 w-24 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div className="flex flex-1 flex-col">
                  {p.brands?.name && <p className="eyebrow">{p.brands.name}</p>}
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="line-clamp-1 font-medium hover:underline"
                  >
                    {translateProduct(p.name)}
                  </Link>
                  <span className="mt-1 text-sm font-semibold">{formatPrice(p.price)}</span>
                  <span
                    className={`mt-0.5 text-xs ${
                      p.stock > 0 ? "text-success font-medium" : "text-destructive"
                    }`}
                  >
                    {p.stock > 0 ? t("in_stock") : t("out_of_stock")}
                  </span>
                  <div className="mt-auto flex items-center gap-2 pt-3">
                    <Button
                      size="sm"
                      disabled={p.stock <= 0}
                      onClick={() => moveToCart(p)}
                      className="h-8 flex-1 text-xs"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                      {"Move to cart"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWishlist(p.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {"Remove"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recentViewed.length > 0 && (
        <section className="border-t border-border/80 pt-6 sm:pt-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-lg font-medium sm:text-xl text-foreground font-display">
                {t("recently_viewed")}
              </h2>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground/75">
              Cached on device
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Items you have recently inspected, preserved locally so you can browse even without an active internet connection.
          </p>

          <div className="mt-4 flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2.5 pt-0.5">
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
