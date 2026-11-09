import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
import { z } from "zod";
import { LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";
import { allProductsQuery, brandsQuery, categoriesQuery } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { discountPct } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sub: z.string().optional(),
  brand: z.array(z.string()).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  rating: z.number().optional(),
  stock: z.boolean().optional(),
  sale: z.boolean().optional(),
  sort: z.enum(["popular", "newest", "price_asc", "price_desc", "rating"]).optional(),
  view: z.enum(["grid", "list"]).optional(),
  page: z.number().optional(),
});
type S = z.infer<typeof searchSchema>;
const PER_PAGE = 12;

export const Route = createFileRoute("/shop")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Shop all products — DOVAN" },
      { name: "description", content: "Browse DOVAN's full catalog with filters for category, brand, price, rating and offers." },
      { property: "og:title", content: "Shop all products — DOVAN" },
      { property: "og:description", content: "Fashion, electronics, home, beauty, sports and accessories." },
    ],
  }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(allProductsQuery),
    context.queryClient.ensureQueryData(categoriesQuery),
    context.queryClient.ensureQueryData(brandsQuery),
  ]),
  pendingComponent: ShopSkeleton,
  component: Shop,
});

function PriceFilter({
  minPrice,
  maxPrice,
  currentMin,
  currentMax,
  onChange,
  formatPrice,
}: {
  minPrice: number;
  maxPrice: number;
  currentMin: number;
  currentMax: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  formatPrice: (val: number) => string;
}) {
  const [localRange, setLocalRange] = useState<[number, number]>([currentMin, currentMax]);

  useEffect(() => {
    setLocalRange([currentMin, currentMax]);
  }, [currentMin, currentMax]);

  return (
    <div>
      <p className="eyebrow mb-3">Price</p>
      <Slider
        min={minPrice}
        max={maxPrice}
        step={10}
        value={localRange}
        onValueChange={(val) => setLocalRange(val as [number, number])}
        onValueCommit={([a, b]) => onChange(a > minPrice ? a : undefined, b < maxPrice ? b : undefined)}
      />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatPrice(localRange[0])}</span>
        <span>{formatPrice(localRange[1])}</span>
      </div>
    </div>
  );
}

function Shop() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(allProductsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: brands } = useSuspenseQuery(brandsQuery);
  const { t, formatPrice, translateCategory, translateSubcategory } = useI18n();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const set = (patch: Partial<S>) => nav({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });
  const maxPrice = useMemo(() => Math.max(...products.map((p) => Number(p.price)), 1000), [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (s.q) {
        const term = s.q.toLowerCase();
        if (![p.name, p.description, p.brands?.name, p.categories?.name, p.subcategory].some((x) => x?.toLowerCase().includes(term))) return false;
      }
      if (s.category && p.categories?.slug !== s.category) return false;
      if (s.sub && p.subcategory !== s.sub) return false;
      if (s.brand?.length && !s.brand.includes(p.brands?.slug ?? "")) return false;
      if (s.min !== undefined && Number(p.price) < s.min) return false;
      if (s.max !== undefined && Number(p.price) > s.max) return false;
      if (s.rating && Number(p.rating_avg) < s.rating) return false;
      if (s.stock && p.stock <= 0) return false;
      if (s.sale && discountPct(Number(p.price), Number(p.compare_at_price)) === 0) return false;
      return true;
    });
    const sorters: Record<string, (a: (typeof list)[0], b: (typeof list)[0]) => number> = {
      popular: (a, b) => b.sold_count - a.sold_count,
      newest: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      price_asc: (a, b) => Number(a.price) - Number(b.price),
      price_desc: (a, b) => Number(b.price) - Number(a.price),
      rating: (a, b) => Number(b.rating_avg) - Number(a.rating_avg),
    };
    list = [...list].sort(sorters[s.sort ?? "popular"]);
    return list;
  }, [products, s]);

  const page = s.page ?? 1;
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const cat = cats.find((c) => c.slug === s.category);
  const subs = useMemo(
    () => (cat ? Array.from(new Set(products.filter((p) => p.category_id === cat.id && p.subcategory).map((p) => p.subcategory!))) : []),
    [cat, products]
  );

  const chips: { label: string; clear: Partial<S> }[] = [];
  if (s.q) chips.push({ label: `"${s.q}"`, clear: { q: undefined } });
  if (cat) chips.push({ label: translateCategory(cat.name), clear: { category: undefined, sub: undefined } });
  if (s.sub) chips.push({ label: translateSubcategory(s.sub), clear: { sub: undefined } });
  s.brand?.forEach((b) => chips.push({ label: brands.find((x) => x.slug === b)?.name ?? b, clear: { brand: s.brand!.filter((x) => x !== b) } }));
  if (s.min !== undefined || s.max !== undefined) chips.push({ label: `${formatPrice(s.min ?? 0)} – ${formatPrice(s.max ?? maxPrice)}`, clear: { min: undefined, max: undefined } });
  if (s.rating) chips.push({ label: `${s.rating}★ & up`, clear: { rating: undefined } });
  if (s.stock) chips.push({ label: "In stock", clear: { stock: undefined } });
  if (s.sale) chips.push({ label: "On sale", clear: { sale: undefined } });

  const activeFilterCount =
    (s.category ? 1 : 0) +
    (s.sub ? 1 : 0) +
    (s.brand?.length ? s.brand.length : 0) +
    (s.min !== undefined || s.max !== undefined ? 1 : 0) +
    (s.rating ? 1 : 0) +
    (s.stock ? 1 : 0) +
    (s.sale ? 1 : 0);

  const Filters = (
    <div className="space-y-6 sm:space-y-7 text-sm">
      <div>
        <p className="eyebrow mb-3">Category</p>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => set({ category: undefined, sub: undefined })}
              className={!s.category ? "font-semibold text-accent" : "hover:text-accent"}
            >
              All
            </button>
          </li>
          {cats.map((c) => {
            const catLabel = translateCategory(c.name);
            return (
              <li key={c.id}>
                <button
                  onClick={() => set({ category: c.slug, sub: undefined })}
                  className={s.category === c.slug ? "font-semibold text-accent" : "hover:text-accent"}
                >
                  {catLabel}
                </button>
                {s.category === c.slug && subs.length > 0 && (
                  <ul className="ml-3 mt-1.5 space-y-1 border-l pl-3">
                    {subs.map((sb) => (
                      <li key={sb}>
                        <button
                          onClick={() => set({ sub: s.sub === sb ? undefined : sb })}
                          className={s.sub === sb ? "font-semibold text-accent" : "text-muted-foreground hover:text-foreground"}
                        >
                          {translateSubcategory(sb)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {brands.length > 0 && (
        <div>
          <p className="eyebrow mb-3">Brand</p>
          {brands.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 py-1">
              <Checkbox
                checked={!!s.brand?.includes(b.slug)}
                onCheckedChange={(v) =>
                  set({ brand: v ? [...(s.brand ?? []), b.slug] : s.brand?.filter((x) => x !== b.slug) })
                }
              />
              <span>{b.name}</span>
            </label>
          ))}
        </div>
      )}

      <PriceFilter
        minPrice={0}
        maxPrice={maxPrice}
        currentMin={s.min ?? 0}
        currentMax={s.max ?? maxPrice}
        onChange={(min, max) => set({ min, max })}
        formatPrice={formatPrice}
      />

      <div>
        <p className="eyebrow mb-3">Rating</p>
        {[4, 3].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 py-1">
            <Checkbox checked={s.rating === r} onCheckedChange={(v) => set({ rating: v ? r : undefined })} />
            <span>{r}★ & up</span>
          </label>
        ))}
      </div>

      <div className="space-y-1">
        <p className="eyebrow mb-3">More</p>
        <label className="flex cursor-pointer items-center gap-2 py-1">
          <Checkbox checked={!!s.stock} onCheckedChange={(v) => set({ stock: v ? true : undefined })} />
          <span>In stock only</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-1">
          <Checkbox checked={!!s.sale} onCheckedChange={(v) => set({ sale: v ? true : undefined })} />
          <span>On sale</span>
        </label>
      </div>
    </div>
  );

  const pageTitle = s.q
    ? `Results for "${s.q}"`
    : s.sub
      ? translateSubcategory(s.sub)
      : cat
        ? translateCategory(cat.name)
        : s.sale
          ? t("offers")
          : t("all_products");

  return (
    <div className="container-page py-4 sm:py-5 md:py-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">{t("home")}</Link> / <span>{t("shop")}</span>
        {cat && <> / {translateCategory(cat.name)}</>}
      </nav>

      {/* Page Title & Count */}
      <div className="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold">
          {pageTitle}
        </h1>
        <span className="text-xs text-muted-foreground shrink-0">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </span>
      </div>

      <div className="mt-4 sm:mt-6 md:mt-8 grid gap-6 md:gap-10 md:grid-cols-[220px_1fr]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block">{Filters}</aside>

        <div>
          {/* Controls Bar - Mobile and Desktop unified */}
          <div className="flex items-center justify-between gap-2 border-y md:border-t-0 md:border-b py-2.5 md:pb-4 md:pt-0">
            {/* Left: Mobile Filters Trigger & Desktop count */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 text-xs font-medium md:hidden flex items-center gap-1.5"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <span className="hidden md:inline text-sm text-muted-foreground">
                {filtered.length} products
              </span>
            </div>

            {/* Right: Sort & View Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Select value={s.sort ?? "popular"} onValueChange={(v) => set({ sort: v as S["sort"] })}>
                <SelectTrigger className="h-8 sm:h-9 w-32 sm:w-40 md:w-44 text-xs sm:text-sm" aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="rating">Customer rating</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
                <button
                  onClick={() => set({ view: "grid" })}
                  aria-label="Grid view"
                  className={`rounded p-1 sm:p-1.5 transition-colors ${s.view !== "list" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={() => set({ view: "list" })}
                  aria-label="List view"
                  className={`rounded p-1 sm:p-1.5 transition-colors ${s.view === "list" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {chips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => set(c.clear)}
                  className="inline-flex items-center gap-1 rounded-full border bg-muted/30 hover:bg-muted px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs transition-colors"
                >
                  <span>{c.label}</span>
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
              <button
                onClick={() => nav({ search: {} })}
                className="text-[11px] sm:text-xs font-medium text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Product Grid / List */}
          {visible.length === 0 ? (
            <div className="py-16 sm:py-24 text-center">
              <p className="font-display text-xl sm:text-2xl">No products match.</p>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Try removing a filter or searching for something else.
              </p>
              <Button className="mt-6" size="sm" onClick={() => nav({ search: {} })}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div
              className={
                s.view === "list"
                  ? "mt-4 sm:mt-6 space-y-3 sm:space-y-4"
                  : "mt-4 sm:mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
              }
            >
              {visible.map((p) => (
                <ProductCard key={p.id} p={p} layout={s.view ?? "grid"} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <nav className="mt-8 sm:mt-12 flex justify-center gap-1.5 sm:gap-2 flex-wrap" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => nav({ search: (prev) => ({ ...prev, page: n }) })}
                  aria-current={n === page ? "page" : undefined}
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-md border text-xs sm:text-sm transition-colors ${
                    n === page ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-muted"
                  }`}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer with Sticky Footer */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col h-full">
          <div className="p-4 sm:p-6 border-b flex items-center justify-between pr-12">
            <SheetTitle className="font-display text-lg sm:text-xl">Filters</SheetTitle>
            {chips.length > 0 && (
              <button
                type="button"
                onClick={() => nav({ search: {} })}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {Filters}
          </div>

          <div className="p-4 border-t bg-card sticky bottom-0">
            <Button className="w-full h-9 sm:h-10 text-xs sm:text-sm" onClick={() => setFiltersOpen(false)}>
              Show {filtered.length} products
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ShopSkeleton() {
  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-4 sm:mb-6 flex items-center justify-between">
        <Skeleton className="h-7 sm:h-8 w-32 sm:w-40 rounded" />
        <Skeleton className="h-8 sm:h-9 w-28 sm:w-36 rounded" />
      </div>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-6 lg:block">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-2 w-full rounded" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12 rounded" />
              <Skeleton className="h-3 w-12 rounded" />
            </div>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card p-3 space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-2/3 rounded" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
