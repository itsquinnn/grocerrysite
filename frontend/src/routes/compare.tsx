import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { X, ShoppingBag, ArrowLeft, Layers, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { allProductsQuery, type Product } from "@/lib/catalog";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { getCompareList, saveCompareList, toggleCompareProduct } from "@/lib/compare";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Products — DOVAN" },
      { name: "description", content: "Compare features, prices, materials, and sizes side-by-side to find the right goods at DOVAN." },
      { property: "og:title", content: "Compare Products — DOVAN" },
      { property: "og:description", content: "Compare products side-by-side." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { data: allProducts = [] } = useQuery(allProductsQuery);
  const { addToCart, setCartOpen } = useShop();
  const { t, formatPrice, translateProduct, translateCategory } = useI18n();
  const [compareIds, setCompareIds] = useState<string[]>([]);

  useEffect(() => {
    setCompareIds(getCompareList());
    const onStorage = () => setCompareIds(getCompareList());
    window.addEventListener("dovan_compare_change", onStorage);
    return () => window.removeEventListener("dovan_compare_change", onStorage);
  }, []);

  const comparedProducts = compareIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const removeItem = (id: string) => {
    const next = compareIds.filter((x) => x !== id);
    saveCompareList(next);
    setCompareIds(next);
    toast.success("Product removed from comparison");
  };

  const clearAll = () => {
    saveCompareList([]);
    setCompareIds([]);
    toast.success("Comparison cleared");
  };

  const handleQuickAdd = async (p: Product) => {
    const ok = await addToCart(
      {
        product_id: p.id,
        size: p.sizes[0] ?? "",
        color: p.colors[0] ?? "",
        quantity: 1,
      },
      p.stock
    );
    if (ok) {
      toast.success(`${p.name} added to cart`);
      setCartOpen(true);
    }
  };

  return (
    <div className="container-page space-y-3 sm:space-y-6 md:space-y-8 py-3 sm:py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-2.5 sm:pb-4 gap-2">
        <div>
          <p className="eyebrow hidden sm:block text-xs">Product Comparison</p>
          <h1 className="font-display text-lg sm:text-2xl md:text-3xl font-semibold">
            Compare Products{" "}
            {comparedProducts.length > 0 && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">
                ({comparedProducts.length})
              </span>
            )}
          </h1>
          <p className="hidden sm:block mt-1 text-xs text-muted-foreground">
            Compare prices, materials, ratings, and sizes to make the best choice.
          </p>
        </div>

        {comparedProducts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive h-7 sm:h-8 px-2 flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        )}
      </div>

      {comparedProducts.length === 0 ? (
        <div className="rounded-xl border bg-card p-6 sm:p-12 text-center shadow-xs">
          <Layers className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
          <h2 className="mt-2.5 sm:mt-4 font-display text-lg sm:text-2xl font-semibold">
            No products in comparison
          </h2>
          <p className="mt-1 max-w-md mx-auto text-xs sm:text-sm text-muted-foreground">
            Pick up to 4 products from the shop to compare their specs and pricing side-by-side.
          </p>

          <div className="mt-5 sm:mt-8">
            <p className="eyebrow mb-2 sm:mb-3 text-[11px] sm:text-xs">
              Popular Items to Compare
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 max-w-xl mx-auto">
              {allProducts.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    toggleCompareProduct(p.id);
                    setCompareIds(getCompareList());
                    toast.success(`${p.name} added to compare`);
                  }}
                  className="rounded-full border bg-secondary/80 px-2.5 py-1 text-xs font-medium hover:bg-secondary hover:border-foreground/30 transition-colors"
                >
                  + Add {translateProduct(p.name)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 sm:mt-8">
            <Button asChild size="sm">
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Browse Catalog
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg sm:rounded-xl border bg-card shadow-xs">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/95 backdrop-blur p-2 sm:p-3 md:p-4 w-20 sm:w-28 md:w-44 font-semibold text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground border-r shrink-0">
                  Feature
                </th>
                {comparedProducts.map((p) => (
                  <th
                    key={p.id}
                    className="p-2 sm:p-3 md:p-4 align-top w-[140px] sm:w-[170px] md:w-64 min-w-[135px] sm:min-w-[165px] md:min-w-[220px] border-l"
                  >
                    <div className="relative">
                      <button
                        onClick={() => removeItem(p.id)}
                        className="absolute right-0 top-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground z-10"
                        title="Remove from comparison"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>

                      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                        <img
                          src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                          alt={translateProduct(p.name)}
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                          className="h-20 sm:h-28 md:h-44 w-full rounded object-cover transition-transform hover:scale-[1.02] bg-muted"
                        />
                      </Link>

                      <p className="eyebrow mt-1 sm:mt-2 text-[9px] sm:text-[11px] truncate">
                        {p.categories?.name ? translateCategory(p.categories.name) : ""}
                      </p>

                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-0.5 block font-semibold text-xs sm:text-sm hover:underline line-clamp-1"
                      >
                        {translateProduct(p.name)}
                      </Link>

                      <div className="mt-0.5 flex items-baseline gap-1 sm:gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-base">{formatPrice(p.price)}</span>
                        {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                          <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 sm:mt-2.5">
                        <Button
                          size="sm"
                          disabled={p.stock <= 0}
                          onClick={() => handleQuickAdd(p)}
                          className="w-full h-7 sm:h-8 md:h-9 text-[11px] sm:text-xs flex items-center justify-center gap-1 font-medium px-1"
                        >
                          <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                          <span className="truncate">{p.stock <= 0 ? t("out_of_stock") : t("add_to_cart")}</span>
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-xs sm:text-sm">
              {/* Rating */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Rating
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                      <Stars value={Number(p.rating_avg)} />
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        ({p.rating_count})
                      </span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Availability */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Availability
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l">
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-success">
                        <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> In Stock ({p.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold text-destructive">
                        {t("out_of_stock")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Brand
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l font-medium text-xs sm:text-sm truncate">
                    {p.brands?.name || "DOVAN Nepal"}
                  </td>
                ))}
              </tr>

              {/* Sizes */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Sizes
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l">
                    {p.sizes && p.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span key={s} className="rounded border px-1 py-0.2 text-[10px] sm:text-xs font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px] sm:text-xs">Standard</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Colors */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Colors
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l">
                    {p.colors && p.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.colors.map((c) => (
                          <span key={c} className="rounded bg-muted px-1.5 py-0.2 text-[10px] sm:text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px] sm:text-xs">Default</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Delivery */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Delivery
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l text-success font-medium text-[10px] sm:text-xs">
                    ✓ COD 77 Districts
                  </td>
                ))}
              </tr>

              {/* Description */}
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-2 sm:p-3 md:p-4 font-medium text-muted-foreground text-[10px] sm:text-xs border-r shrink-0">
                  Details
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-2 sm:p-3 md:p-4 border-l text-[11px] sm:text-xs leading-relaxed text-muted-foreground">
                    <p className="line-clamp-2">{p.description}</p>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="mt-1 inline-flex items-center gap-0.5 font-medium text-foreground underline hover:text-accent text-[10px] sm:text-xs"
                    >
                      View details →
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
