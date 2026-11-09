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
    <div className="container-page space-y-6 sm:space-y-8 py-6 sm:py-8 md:space-y-10 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b pb-4">
        <div>
          <p className="eyebrow">Product Comparison</p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl md:text-4xl">
            Compare Products Side-by-Side
          </h1>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground">
            Compare prices, materials, ratings, and sizes to make the best choice.
          </p>
        </div>
        {comparedProducts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs h-8 sm:h-9"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Comparison ({comparedProducts.length})
          </Button>
        )}
      </div>

      {comparedProducts.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 sm:p-12 text-center shadow-xs">
          <Layers className="mx-auto h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground" />
          <h2 className="mt-3 sm:mt-4 font-display text-xl sm:text-2xl">
            No products in comparison
          </h2>
          <p className="mt-1.5 sm:mt-2 max-w-md mx-auto text-xs sm:text-sm text-muted-foreground">
            Pick up to 4 products from the shop to compare their specs, materials, and pricing side-by-side.
          </p>

          <div className="mt-6 sm:mt-8">
            <p className="eyebrow mb-3 text-xs">
              Popular Items to Compare
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {allProducts.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    toggleCompareProduct(p.id);
                    setCompareIds(getCompareList());
                    toast.success(`${p.name} added to compare`);
                  }}
                  className="rounded-full border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:bg-secondary hover:border-foreground/30 transition-colors"
                >
                  + Add {translateProduct(p.name)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <Button asChild size="sm" className="sm:size-default">
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Browse Catalog
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-xs">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/95 backdrop-blur p-3 sm:p-4 w-28 sm:w-36 md:w-44 font-semibold text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground border-r">
                  Feature
                </th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="p-3 sm:p-4 align-top w-48 sm:w-56 md:w-64 min-w-[190px] sm:min-w-[220px] border-l">
                    <div className="relative">
                      <button
                        onClick={() => removeItem(p.id)}
                        className="absolute right-0 top-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Remove from comparison"
                        aria-label={`Remove ${p.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                        <img
                          src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                          alt={translateProduct(p.name)}
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                          className="h-32 sm:h-40 md:h-44 w-full rounded-md object-cover transition-transform hover:scale-[1.02] bg-muted"
                        />
                      </Link>
                      <p className="eyebrow mt-2.5 sm:mt-3 text-[10px] sm:text-[11px] truncate">
                        {p.categories?.name ? translateCategory(p.categories.name) : ""}
                      </p>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-0.5 sm:mt-1 block font-semibold text-xs sm:text-sm hover:underline line-clamp-1"
                      >
                        {translateProduct(p.name)}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
                        <span className="font-bold text-sm sm:text-base">{formatPrice(p.price)}</span>
                        {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                          <span className="text-[11px] sm:text-xs text-muted-foreground line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </div>
                      <div className="mt-2.5 sm:mt-3">
                        <Button
                          size="sm"
                          disabled={p.stock <= 0}
                          onClick={() => handleQuickAdd(p)}
                          className="w-full h-8 sm:h-9 text-xs flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          {p.stock <= 0 ? t("out_of_stock") : t("add_to_cart")}
                        </Button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y text-xs sm:text-sm">
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Customer Rating
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <Stars value={Number(p.rating_avg)} />
                      <span className="text-[11px] sm:text-xs text-muted-foreground">
                        ({p.rating_count} reviews)
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Availability
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l">
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-success">
                        <Check className="h-3 w-3" /> In Stock ({p.stock})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-destructive">
                        {t("out_of_stock")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Brand / Origin
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l font-medium">
                    {p.brands?.name || "DOVAN Curated Nepal"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Available Sizes
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l">
                    {p.sizes && p.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span key={s} className="rounded border px-1.5 py-0.5 text-[11px] sm:text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Standard size</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Available Colors
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l">
                    {p.colors && p.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.colors.map((c) => (
                          <span key={c} className="rounded bg-muted px-2 py-0.5 text-[11px] sm:text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Default</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Nationwide COD
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l text-success font-medium text-xs sm:text-sm">
                    ✓ Available across all 77 districts
                  </td>
                ))}
              </tr>
              <tr>
                <td className="sticky left-0 z-10 bg-background/95 backdrop-blur p-3 sm:p-4 font-medium text-muted-foreground text-[11px] sm:text-xs border-r">
                  Description
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-3 sm:p-4 border-l text-xs leading-relaxed text-muted-foreground">
                    <p className="line-clamp-3">{p.description}</p>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="mt-1.5 inline-flex items-center gap-1 font-medium text-foreground underline hover:text-accent"
                    >
                      View full product details →
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
