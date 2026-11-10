import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { X, ShoppingBag, Plus, Trash2, Check, RefreshCw, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { allProductsQuery, type Product } from "@/lib/catalog";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Stars } from "@/components/site/Stars";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCompareList, saveCompareList, toggleCompareProduct } from "@/lib/compare";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Product Comparison : DOVAN Nepal" },
      { name: "description", content: "Compare technical specifications, materials, and pricing side-by-side to make the right choice at DOVAN." },
      { property: "og:title", content: "Product Comparison : DOVAN Nepal" },
      { property: "og:description", content: "Side-by-side product comparison ledger." },
    ],
  }),
  component: ComparePage,
});

export function ComparePage() {
  const { data: allProducts = [] } = useQuery(allProductsQuery);
  const { addToCart, setCartOpen } = useShop();
  const { t, formatPrice, translateProduct, translateCategory } = useI18n();

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [highlightDiffs, setHighlightDiffs] = useState<boolean>(false);
  const [pickerOpen, setPickerOpen] = useState<boolean>(false);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>("");
  const [pickerCategory, setPickerCategory] = useState<string>("all");

  useEffect(() => {
    setCompareIds(getCompareList());
    const onStorage = () => setCompareIds(getCompareList());
    window.addEventListener("dovan_compare_change", onStorage);
    return () => window.removeEventListener("dovan_compare_change", onStorage);
  }, []);

  const comparedProducts = useMemo(() => {
    return compareIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }, [compareIds, allProducts]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    allProducts.forEach((p) => {
      if (p.categories?.id && p.categories?.name) {
        map.set(p.categories.id, p.categories.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allProducts]);

  const allSpecKeys = useMemo(() => {
    const keys = new Set<string>();
    comparedProducts.forEach((p) => {
      if (p.specs && typeof p.specs === "object") {
        Object.keys(p.specs).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [comparedProducts]);

  const removeItem = (id: string) => {
    const next = compareIds.filter((x) => x !== id);
    saveCompareList(next);
    setCompareIds(next);
    toast.success("Item removed from comparison ledger");
  };

  const clearAll = () => {
    saveCompareList([]);
    setCompareIds([]);
    toast.success("Comparison ledger cleared");
  };

  const handleQuickAdd = async (p: Product) => {
    const ok = await addToCart(
      {
        product_id: p.id,
        size: p.sizes?.[0] ?? "",
        color: p.colors?.[0] ?? "",
        quantity: 1,
      },
      p.stock
    );
    if (ok) {
      toast.success(`${p.name} added to cart`);
      setCartOpen(true);
    }
  };

  const openPicker = (replaceId?: string) => {
    setReplaceTargetId(replaceId || null);
    setPickerSearch("");
    setPickerCategory("all");
    setPickerOpen(true);
  };

  const selectProductFromPicker = (p: Product) => {
    if (replaceTargetId) {
      const next = compareIds.map((id) => (id === replaceTargetId ? p.id : id));
      saveCompareList(next);
      setCompareIds(next);
      toast.success(`Replaced with ${p.name}`);
    } else {
      if (compareIds.includes(p.id)) {
        toast.info("Product is already in the comparison ledger");
        setPickerOpen(false);
        return;
      }
      if (compareIds.length >= 4) {
        const next = [...compareIds.slice(1), p.id];
        saveCompareList(next);
        setCompareIds(next);
      } else {
        const next = [...compareIds, p.id];
        saveCompareList(next);
        setCompareIds(next);
      }
      toast.success(`${p.name} added to comparison`);
    }
    setPickerOpen(false);
  };

  const loadPreset = (ids: string[]) => {
    const valid = ids.filter((id) => allProducts.some((p) => p.id === id));
    if (valid.length > 0) {
      saveCompareList(valid);
      setCompareIds(valid);
      toast.success("Curated comparison loaded");
    }
  };

  const filteredPickerProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (pickerCategory !== "all" && p.category_id !== pickerCategory) {
        return false;
      }
      if (!pickerSearch.trim()) return true;
      const q = pickerSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.categories?.name?.toLowerCase().includes(q)
      );
    });
  }, [allProducts, pickerCategory, pickerSearch]);

  const isRowDifferent = (values: (string | number | boolean | null | undefined)[]) => {
    if (values.length <= 1) return false;
    const first = JSON.stringify(values[0]);
    return values.some((v) => JSON.stringify(v) !== first);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <div className="container-page pt-5 sm:pt-7 pb-8">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
              Catalog Operations : Specification Matrix
            </div>
            <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-normal tracking-tight">
              Product Comparison
            </h1>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Structured side-by-side spec evaluation, verified pricing differentials, and inventory check across curated goods.
            </p>
          </div>

          {/* Top Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {comparedProducts.length > 1 && (
              <button
                type="button"
                onClick={() => setHighlightDiffs(!highlightDiffs)}
                className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 border rounded-none transition-colors cursor-pointer ${
                  highlightDiffs
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40 bg-background text-foreground"
                }`}
              >
                <span className="font-mono">{highlightDiffs ? "[✓]" : "[ ]"}</span>
                <span>Highlight Differences</span>
              </button>
            )}

            {comparedProducts.length < 4 && (
              <button
                type="button"
                onClick={() => openPicker()}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Product</span>
              </button>
            )}

            {comparedProducts.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-border/70 hover:border-destructive/60 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area directly below toolbar with zero dead gap */}
        <div className="mt-4">
          {comparedProducts.length === 0 ? (
            /* Zero-state: Curated Editorial Showcase */
            <div className="border border-border/80 p-6 sm:p-10 max-w-4xl mx-auto">
            <div className="max-w-xl">
              <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                Specification Ledger Empty
              </div>
              <h2 className="mt-2 font-serif text-xl sm:text-2xl font-normal">
                Select items to begin comparison
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add up to 4 items from the store to audit price differentials, physical dimensions, material grades, and stock availability side-by-side.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => openPicker()}
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 border border-foreground bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Open Product Catalog Selector</span>
              </button>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs font-medium px-4 py-2 border border-border hover:border-foreground/30 text-foreground transition-colors"
              >
                <span>Browse Storefront</span>
              </Link>
            </div>

            {/* Quick Test Presets */}
            {allProducts.length >= 2 && (
              <div className="mt-10 pt-6 border-t border-border/60">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Sample Comparison Pairs
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allProducts.slice(0, 3).map((first, idx) => {
                    const second = allProducts[(idx + 1) % allProducts.length];
                    if (!second || first.id === second.id) return null;
                    return (
                      <div
                        key={first.id}
                        onClick={() => loadPreset([first.id, second.id])}
                        className="group border border-border/70 hover:border-foreground/60 p-3.5 transition-colors cursor-pointer bg-background"
                      >
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">
                          Set 0{idx + 1}
                        </div>
                        <div className="mt-1 text-xs font-medium text-foreground group-hover:underline">
                          {translateProduct(first.name)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          vs. {translateProduct(second.name)}
                        </div>
                        <div className="mt-2 text-[10px] font-mono text-muted-foreground group-hover:text-foreground">
                          Load Pair →
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Multi-column Side-by-Side Matrix */
          <div className="border border-border/80 bg-background overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              {/* Product Header Column Cards */}
              <thead>
                <tr className="border-b border-border/80 bg-muted/20">
                  <th className="sticky left-0 z-20 bg-background border-r border-border/80 p-3 sm:p-4 w-40 min-w-[160px] sm:w-52 sm:min-w-[208px] align-top">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Matrix Specification
                    </div>
                    <div className="mt-1 text-xs font-semibold text-foreground">
                      Comparing {comparedProducts.length} of 4 Slots
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground font-normal leading-relaxed">
                      All specs mapped directly from DOVAN product database.
                    </p>
                  </th>

                  {comparedProducts.map((p) => (
                    <th
                      key={p.id}
                      className="border-r border-border/80 p-3 sm:p-4 align-top w-56 min-w-[224px] max-w-[250px]"
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          {/* Top Controls: Remove and Change */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-border/50 text-[11px] font-mono">
                            <span className="text-muted-foreground uppercase text-[10px]">
                              {p.sku || "PROD-ITEM"}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openPicker(p.id)}
                                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                title="Replace product"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItem(p.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title="Remove from matrix"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Compact Product Thumbnail */}
                          <div className="mt-2 h-24 sm:h-28 w-full overflow-hidden bg-muted/20 border border-border/60">
                            <Link to="/product/$slug" params={{ slug: p.slug }} className="block h-full w-full">
                              <img
                                src={p.images?.[0] || "/assets/products/canvas-tote.jpg"}
                                alt={p.name}
                                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                                className="h-full w-full object-cover transition-opacity hover:opacity-90"
                              />
                            </Link>
                          </div>

                          {/* Meta Category & Title */}
                          <div className="mt-2">
                            <div className="text-[10px] font-mono uppercase text-muted-foreground truncate">
                              {p.categories?.name ? translateCategory(p.categories.name) : "General"}
                            </div>
                            <Link
                              to="/product/$slug"
                              params={{ slug: p.slug }}
                              className="mt-0.5 block font-serif text-xs sm:text-sm font-normal hover:underline leading-snug line-clamp-2"
                            >
                              {translateProduct(p.name)}
                            </Link>
                          </div>

                          {/* Price Breakdown */}
                          <div className="mt-1.5 pt-1.5 border-t border-border/50">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono font-medium text-xs sm:text-sm text-foreground">
                                {formatPrice(p.price)}
                              </span>
                              {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                                <span className="font-mono text-[11px] text-muted-foreground line-through">
                                  {formatPrice(p.compare_at_price)}
                                </span>
                              )}
                            </div>
                            {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                              <div className="text-[10px] font-mono text-success mt-0.5">
                                Save {formatPrice(Number(p.compare_at_price) - Number(p.price))} (
                                {Math.round(
                                  ((Number(p.compare_at_price) - Number(p.price)) /
                                    Number(p.compare_at_price)) *
                                    100
                                )}
                                %)
                              </div>
                            )}
                          </div>
                        </div>

                        {/* CTA: Add to Bag */}
                        <div className="mt-3 pt-2.5 border-t border-border/60">
                          <button
                            type="button"
                            disabled={p.stock <= 0}
                            onClick={() => handleQuickAdd(p)}
                            className={`w-full py-1.5 px-2.5 text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                              p.stock > 0
                                ? "bg-foreground text-background border-foreground hover:bg-foreground/90"
                                : "bg-muted text-muted-foreground border-border cursor-not-allowed"
                            }`}
                          >
                            <ShoppingBag className="h-3 w-3 shrink-0" />
                            <span>{p.stock <= 0 ? t("out_of_stock") : t("add_to_cart")}</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}

                  {/* Empty Slot Placeholder */}
                  {comparedProducts.length < 4 && (
                    <th className="border-r border-border/80 p-3 sm:p-4 align-middle w-56 min-w-[224px] max-w-[250px] bg-muted/10">
                      <button
                        type="button"
                        onClick={() => openPicker()}
                        className="w-full h-full min-h-[220px] border border-dashed border-border/80 hover:border-foreground/50 p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <span className="mt-1.5 text-xs font-medium text-foreground">
                          + Add Product
                        </span>
                        <span className="mt-0.5 text-[10px] text-muted-foreground font-mono">
                          Slot {comparedProducts.length + 1} of 4 Available
                        </span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Specification Rows */}
              <tbody className="divide-y divide-border/60">
                {/* Section Header: Commercial & Pricing */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={1 + comparedProducts.length + (comparedProducts.length < 4 ? 1 : 0)}
                    className="p-2 sm:p-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Section 01 : Commercial & Pricing
                  </td>
                </tr>

                {/* Price Row */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.price)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Store Price (NPR)
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.price)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 font-mono font-medium text-xs sm:text-sm">
                      {formatPrice(p.price)}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Unit / Weight Row */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.unit)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Base Unit / Pack
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.unit)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs font-mono">
                      {p.unit || "Standard unit"}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Stock & Inventory */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.stock > 0)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Inventory Status
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.stock > 0)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs font-mono">
                      {p.stock > 0 ? (
                        <span className="text-success font-medium">
                          In Stock ({p.stock} units available)
                        </span>
                      ) : (
                        <span className="text-destructive font-medium">Out of Stock</span>
                      )}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Section Header: Taxonomy & Identity */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={1 + comparedProducts.length + (comparedProducts.length < 4 ? 1 : 0)}
                    className="p-2 sm:p-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Section 02 : Classification & Provenance
                  </td>
                </tr>

                {/* Category & Subcategory */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.categories?.name)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Category Hierarchy
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.categories?.name)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs">
                      <div className="font-medium text-foreground">
                        {p.categories?.name ? translateCategory(p.categories.name) : "General Category"}
                      </div>
                      {p.subcategories?.name && (
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          └ {p.subcategories.name}
                        </div>
                      )}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Brand / Artisan */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.brands?.name)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Brand Partner
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.brands?.name)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs font-medium">
                      {p.brands?.name || "DOVAN Curated Nepal"}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* SKU Code */}
                <tr className="border-b border-border/60">
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    SKU / Identifier
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs font-mono text-muted-foreground">
                      {p.sku || p.id.slice(0, 8)}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Section Header: Physical Specifications */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={1 + comparedProducts.length + (comparedProducts.length < 4 ? 1 : 0)}
                    className="p-2 sm:p-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Section 03 : Physical Attributes & Sizing
                  </td>
                </tr>

                {/* Available Sizes */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.sizes?.join(","))) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Available Sizes
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.sizes?.join(","))) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs">
                      {p.sizes && p.sizes.length > 0 ? (
                        <div className="font-mono text-[11px] text-foreground">
                          {p.sizes.join(" · ")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">One size</span>
                      )}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Available Colors */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.colors?.join(","))) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Colorways
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.colors?.join(","))) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs">
                      {p.colors && p.colors.length > 0 ? (
                        <div className="text-[11px] text-foreground">
                          {p.colors.join(" · ")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">Natural / As Shown</span>
                      )}
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Dynamic Product Specs extracted from specs JSON */}
                {allSpecKeys.map((key) => {
                  const values = comparedProducts.map((p) => p.specs?.[key] ?? "");
                  const diff = isRowDifferent(values);
                  return (
                    <tr key={key} className={highlightDiffs && diff ? "bg-amber-500/5" : ""}>
                      <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                        {key}
                        {highlightDiffs && diff && (
                          <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                        )}
                      </td>
                      {comparedProducts.map((p) => (
                        <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs">
                          {p.specs?.[key] ? (
                            <span className="font-medium text-foreground">{p.specs[key]}</span>
                          ) : (
                            <span className="text-muted-foreground/60 font-mono text-[11px]">Not specified</span>
                          )}
                        </td>
                      ))}
                      {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                    </tr>
                  );
                })}

                {/* Section Header: Quality & Logistics */}
                <tr className="bg-muted/30">
                  <td
                    colSpan={1 + comparedProducts.length + (comparedProducts.length < 4 ? 1 : 0)}
                    className="p-2 sm:p-2.5 px-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold"
                  >
                    Section 04 : Logistics & Verification
                  </td>
                </tr>

                {/* Customer Rating */}
                <tr className={highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.rating_avg)) ? "bg-amber-500/5" : ""}>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Customer Reviews
                    {highlightDiffs && isRowDifferent(comparedProducts.map((p) => p.rating_avg)) && (
                      <span className="ml-1.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">≠ diff</span>
                    )}
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4">
                      <div className="flex items-center gap-1.5">
                        <Stars value={Number(p.rating_avg)} />
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {Number(p.rating_avg).toFixed(1)}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          ({p.rating_count} reviews)
                        </span>
                      </div>
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Nationwide COD */}
                <tr>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground">
                    Delivery & COD
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs">
                      <div className="font-medium text-foreground">
                        All 77 Districts of Nepal
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        Cash on Delivery, eSewa, Khalti, Fonepay
                      </div>
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>

                {/* Product Notes / Overview */}
                <tr>
                  <td className="sticky left-0 z-10 bg-background border-r border-border/80 p-3 sm:p-4 text-xs font-medium text-muted-foreground align-top">
                    Craft & Specification Notes
                  </td>
                  {comparedProducts.map((p) => (
                    <td key={p.id} className="border-r border-border/80 p-3 sm:p-4 text-xs leading-relaxed text-muted-foreground align-top">
                      <p className="line-clamp-4">{p.description}</p>
                      <Link
                        to="/product/$slug"
                        params={{ slug: p.slug }}
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono text-foreground hover:underline"
                      >
                        <Eye className="h-3 w-3" />
                        <span>View Full Product Dossier →</span>
                      </Link>
                    </td>
                  ))}
                  {comparedProducts.length < 4 && <td className="border-r border-border/80 bg-muted/5" />}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      {/* Product Catalog Picker Dialog */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 border border-border">
          <DialogHeader className="p-4 sm:p-6 pb-3 border-b border-border">
            <DialogTitle className="font-serif text-lg sm:text-xl font-normal">
              {replaceTargetId ? "Replace Matrix Item" : "Add Product to Comparison Ledger"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an item from the DOVAN catalog to insert into the matrix.
            </p>
          </DialogHeader>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-border space-y-3 bg-muted/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search products by title, SKU, or category..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-none border-border bg-background"
                autoFocus
              />
            </div>

            {/* Category Filter Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setPickerCategory("all")}
                className={`px-2.5 py-1 text-[11px] border transition-colors cursor-pointer shrink-0 ${
                  pickerCategory === "all"
                    ? "border-foreground bg-foreground text-background font-medium"
                    : "border-border hover:border-foreground/40 bg-background text-foreground"
                }`}
              >
                All Categories ({allProducts.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPickerCategory(c.id)}
                  className={`px-2.5 py-1 text-[11px] border transition-colors cursor-pointer shrink-0 ${
                    pickerCategory === c.id
                      ? "border-foreground bg-foreground text-background font-medium"
                      : "border-border hover:border-foreground/40 bg-background text-foreground"
                  }`}
                >
                  {translateCategory(c.name)}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items List */}
          <div className="overflow-y-auto p-4 divide-y divide-border/60 max-h-[50vh]">
            {filteredPickerProducts.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No products found matching your search.
              </div>
            ) : (
              filteredPickerProducts.map((p) => {
                const isAlreadySelected = compareIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-muted/30 px-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.images?.[0] || "/assets/products/canvas-tote.jpg"}
                        alt={p.name}
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                        className="h-12 w-12 object-cover border border-border/60 bg-muted shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase text-muted-foreground truncate">
                          {p.categories?.name ? translateCategory(p.categories.name) : "General"} · {p.sku || "SKU"}
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                          {translateProduct(p.name)}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {formatPrice(p.price)} · Stock: {p.stock > 0 ? `${p.stock} units` : "Out of stock"}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadySelected && !replaceTargetId}
                      onClick={() => selectProductFromPicker(p)}
                      className={`px-3 py-1.5 text-xs font-medium border shrink-0 transition-colors cursor-pointer ${
                        isAlreadySelected && !replaceTargetId
                          ? "border-border bg-muted text-muted-foreground cursor-not-allowed"
                          : "border-foreground bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      {isAlreadySelected && !replaceTargetId ? "In Matrix" : "Select"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
