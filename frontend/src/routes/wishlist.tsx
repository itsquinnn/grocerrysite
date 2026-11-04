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

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Saved Items — DOVAN" },
      { name: "description", content: "Products you've saved at DOVAN. Available offline and synced across devices." },
      { property: "og:title", content: "Wishlist & Saved Items — DOVAN" },
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
      toast.success(isNepali ? "कार्टमा सारियो" : "Moved to cart", { id: `move-${p.id}` });
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
                {isNepali ? "इच्छा सूची (Wishlist)" : "Wishlist"}
              </h1>
              {items.length > 0 && (
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-accent/15 px-2 text-xs font-semibold text-accent">
                  {items.length}
                </span>
              )}
            </div>
            {!user && items.length > 0 && (
              <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                {isNepali ? (
                  <>यो उपकरणमा सुरक्षित छ। सबै डिभाइसमा सिङ्क गर्न <Link to="/login" className="underline underline-offset-2 hover:text-foreground">लग-इन गर्नुहोस्</Link>।</>
                ) : (
                  <>Saved on this device. <Link to="/login" className="underline underline-offset-2 hover:text-foreground">Sign in</Link> to sync across all your devices.</>
                )}
              </p>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed bg-card/50 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-base font-medium">{isNepali ? "कुनै सामग्री सुरक्षित गरिएको छैन" : "Nothing saved yet"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isNepali
                ? "इच्छा सूचीमा राख्न कुनै पनि सामग्रीको मुटु (heart) आइकनमा थिच्नुहोस्।"
                : "Click the heart icon on any product to save it to your wishlist."}
            </p>
            <Button className="mt-5" asChild>
              <Link to="/shop">{isNepali ? "उत्पादनहरू हेर्नुहोस्" : "Discover products"}</Link>
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
                      {isNepali ? "कार्टमा सार्नुहोस्" : "Move to cart"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWishlist(p.id)}
                      className="h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {isNepali ? "हटाउनुहोस्" : "Remove"}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recentViewed.length > 0 && (
        <section className="border-t pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <h2 className="text-xl font-semibold sm:text-2xl">{t("recently_viewed")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">
              {isNepali ? "यस डिभाइसमा सुरक्षित" : "Cached on device"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isNepali
              ? "तपाईंले भर्खरै हेर्नुभएका सामग्रीहरू, इन्टरनेट नहुँदा पनि ब्राउज गर्न सकिन्छ।"
              : "Items you have recently inspected, preserved locally so you can browse even without an active internet connection."}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {recentViewed.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-3 shadow-xs transition hover:border-foreground/30 hover:shadow-sm"
              >
                <div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="block aspect-[4/5] overflow-hidden rounded-lg bg-muted"
                  >
                    <img
                      src={p.images?.[0] || FALLBACK_IMG}
                      alt={p.name}
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = FALLBACK_IMG)}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </Link>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    className="mt-2.5 block line-clamp-1 text-sm font-medium hover:underline"
                  >
                    {translateProduct(p.name)}
                  </Link>
                  <p className="mt-0.5 text-xs font-semibold">{formatPrice(p.price)}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs"
                    asChild
                  >
                    <Link to="/product/$slug" params={{ slug: p.slug }}>
                      {isNepali ? "हेर्नुहोस्" : "View"}
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
