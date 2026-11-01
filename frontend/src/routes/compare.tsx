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
  const { t, formatPrice, isNepali, translateProduct, translateCategory } = useI18n();
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
    toast.success(isNepali ? "सामग्री तुलना सूचीबाट हटाइयो" : "Product removed from comparison");
  };

  const clearAll = () => {
    saveCompareList([]);
    setCompareIds([]);
    toast.success(isNepali ? "तुलना सूची खाली गरियो" : "Comparison cleared");
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
      toast.success(
        isNepali
          ? `${translateProduct(p.name)} कार्टमा थपियो`
          : `${p.name} added to cart`
      );
      setCartOpen(true);
    }
  };

  return (
    <div className="container-page space-y-8 py-8 md:space-y-10 md:py-12">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="eyebrow">{isNepali ? "सामग्री तुलना" : "Product Comparison"}</p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">
            {isNepali ? "सामग्रीहरूको प्रत्यक्ष तुलना" : "Compare Products Side-by-Side"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isNepali
              ? "मूल्य, गुणस्तर, मूल्याङ्कन र साइज तुलना गरी उपयुक्त निर्णय लिनुहोस्।"
              : "Compare prices, materials, ratings, and sizes to make the best choice."}
          </p>
        </div>
        {comparedProducts.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAll} className="flex items-center gap-1.5 text-xs">
            <Trash2 className="h-3.5 w-3.5" />
            {isNepali ? `तुलना सूची खाली गर्नुहोस् (${comparedProducts.length})` : `Clear Comparison (${comparedProducts.length})`}
          </Button>
        )}
      </div>

      {comparedProducts.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-4 font-display text-2xl">
            {isNepali ? "तुलना गर्न कुनै सामग्री छानिएको छैन" : "No products in comparison"}
          </h2>
          <p className="mt-2 max-w-md mx-auto text-sm text-muted-foreground">
            {isNepali
              ? "पसलबाट ४ वटासम्म सामग्री रोजेर विशेषता, मूल्य र साइज तुलना गर्नुहोस्।"
              : "Pick up to 4 products from the shop to compare their specs, materials, and pricing side-by-side."}
          </p>

          <div className="mt-8">
            <p className="eyebrow mb-3">
              {isNepali ? "तुलना गर्न लोकप्रिय सामग्रीहरू" : "Popular Items to Compare"}
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {allProducts.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    toggleCompareProduct(p.id);
                    setCompareIds(getCompareList());
                    toast.success(
                      isNepali
                        ? `${translateProduct(p.name)} तुलनामा थपियो`
                        : `${p.name} added to compare`
                    );
                  }}
                  className="rounded-full border bg-secondary/80 px-3 py-1.5 text-xs font-medium hover:bg-secondary hover:border-foreground/30 transition-colors"
                >
                  + {isNepali ? "थप्नुहोस्" : "Add"} {translateProduct(p.name)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <Button asChild>
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {isNepali ? "क्याटलग हेर्नुहोस्" : "Browse Catalog"}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-4 w-44 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  {isNepali ? "विशेषता" : "Feature"}
                </th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="p-4 align-top w-64 border-l">
                    <div className="relative">
                      <button
                        onClick={() => removeItem(p.id)}
                        className="absolute right-0 top-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={isNepali ? "हटाउनुहोस्" : "Remove from comparison"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <Link to="/product/$slug" params={{ slug: p.slug }} className="block">
                        <img
                          src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                          alt={translateProduct(p.name)}
                          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                          className="h-44 w-full rounded-md object-cover transition-transform hover:scale-[1.02] bg-muted"
                        />
                      </Link>
                      <p className="eyebrow mt-3 text-[11px]">
                        {p.categories?.name ? translateCategory(p.categories.name) : ""}
                      </p>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-1 block font-semibold hover:underline line-clamp-1"
                      >
                        {translateProduct(p.name)}
                      </Link>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-bold text-base">{formatPrice(p.price)}</span>
                        {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatPrice(p.compare_at_price)}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <Button
                          size="sm"
                          disabled={p.stock <= 0}
                          onClick={() => handleQuickAdd(p)}
                          className="w-full flex items-center justify-center gap-1.5"
                        >
                          <ShoppingBag className="h-4 w-4" />
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
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "ग्राहक मूल्याङ्कन" : "Customer Rating"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l">
                    <div className="flex items-center gap-2">
                      <Stars value={Number(p.rating_avg)} />
                      <span className="text-xs text-muted-foreground">
                        ({p.rating_count} {isNepali ? "समीक्षा" : "reviews"})
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "स्टक स्थिति" : "Availability"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l">
                    {p.stock > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                        <Check className="h-3 w-3" /> {isNepali ? `स्टकमा उपलब्ध (${p.stock})` : `In Stock (${p.stock} units)`}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 text-xs font-semibold text-destructive">
                        {t("out_of_stock")}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "ब्रान्ड / उत्पति" : "Brand / Origin"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l font-medium">
                    {p.brands?.name || (isNepali ? "दोभान मौलिक नेपाल" : "DOVAN Curated Nepal")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "उपलब्ध साइजहरू" : "Available Sizes"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l">
                    {p.sizes && p.sizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s) => (
                          <span key={s} className="rounded border px-1.5 py-0.5 text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{isNepali ? "मानक साइज" : "Standard size"}</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "उपलब्ध रंगहरू" : "Available Colors"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l">
                    {p.colors && p.colors.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {p.colors.map((c) => (
                          <span key={c} className="rounded bg-muted px-2 py-0.5 text-xs">
                            {c}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">{isNepali ? "साधारण" : "Default"}</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "देशभर क्यास अन डेलिभरी" : "Nationwide COD"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l text-success font-medium">
                    {isNepali ? "✓ ७७ वटै जिल्लामा उपलब्ध" : "✓ Available across all 77 districts"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium text-muted-foreground">
                  {isNepali ? "विवरण" : "Product Description"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l text-xs leading-relaxed text-muted-foreground">
                    <p className="line-clamp-3">{p.description}</p>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      className="mt-1 inline-flex items-center gap-1 font-medium text-foreground underline hover:text-accent"
                    >
                      {isNepali ? "पूरा विवरण हेर्नुहोस् →" : "View full product details →"}
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
