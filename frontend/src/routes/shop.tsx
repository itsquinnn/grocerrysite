import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  component: Shop,
});

function Shop() {
  const s = Route.useSearch();
  const nav = useNavigate({ from: "/shop" });
  const { data: products } = useSuspenseQuery(allProductsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { data: brands } = useSuspenseQuery(brandsQuery);
  const { t, formatPrice, translateCategory, translateSubcategory, isNepali } = useI18n();
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
  if (s.rating) chips.push({ label: `${s.rating}★ ${isNepali ? "वा माथि" : "& up"}`, clear: { rating: undefined } });
  if (s.stock) chips.push({ label: isNepali ? "स्टकमा मात्र" : "In stock", clear: { stock: undefined } });
  if (s.sale) chips.push({ label: isNepali ? "छुटमा" : "On sale", clear: { sale: undefined } });

  const Filters = (
    <div className="space-y-7 text-sm">
      <div>
        <p className="eyebrow mb-3">{isNepali ? "वर्ग (Category)" : "Category"}</p>
        <ul className="space-y-1.5">
          <li>
            <button
              onClick={() => set({ category: undefined, sub: undefined })}
              className={!s.category ? "font-semibold text-accent" : "hover:text-accent"}
            >
              {isNepali ? "सबै वर्गहरू" : "All"}
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
      <div>
        <p className="eyebrow mb-3">{isNepali ? "ब्रान्ड" : "Brand"}</p>
        {brands.map((b) => (
          <label key={b.id} className="flex cursor-pointer items-center gap-2 py-1">
            <Checkbox
              checked={!!s.brand?.includes(b.slug)}
              onCheckedChange={(v) =>
                set({ brand: v ? [...(s.brand ?? []), b.slug] : s.brand?.filter((x) => x !== b.slug) })
              }
            />
            {b.name}
          </label>
        ))}
      </div>
      <div>
        <p className="eyebrow mb-3">{isNepali ? "मूल्य दायरा" : "Price"}</p>
        <Slider
          min={0}
          max={maxPrice}
          step={100}
          value={[s.min ?? 0, s.max ?? maxPrice]}
          onValueCommit={([a, b]) => set({ min: a || undefined, max: b >= maxPrice ? undefined : b })}
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{formatPrice(s.min ?? 0)}</span>
          <span>{formatPrice(s.max ?? maxPrice)}</span>
        </div>
      </div>
      <div>
        <p className="eyebrow mb-3">{isNepali ? "मूल्याङ्कन" : "Rating"}</p>
        {[4, 3].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 py-1">
            <Checkbox checked={s.rating === r} onCheckedChange={(v) => set({ rating: v ? r : undefined })} />
            {r}★ {isNepali ? "वा माथि" : "& up"}
          </label>
        ))}
      </div>
      <div className="space-y-1">
        <p className="eyebrow mb-3">{isNepali ? "थप फिल्टर" : "More"}</p>
        <label className="flex cursor-pointer items-center gap-2 py-1">
          <Checkbox checked={!!s.stock} onCheckedChange={(v) => set({ stock: v ? true : undefined })} />
          {isNepali ? "स्टक भएका मात्र" : "In stock only"}
        </label>
        <label className="flex cursor-pointer items-center gap-2 py-1">
          <Checkbox checked={!!s.sale} onCheckedChange={(v) => set({ sale: v ? true : undefined })} />
          {isNepali ? "छुटमा उपलब्ध" : "On sale"}
        </label>
      </div>
    </div>
  );

  return (
    <div className="container-page py-5 md:py-6">
      <nav className="text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/">{t("home")}</Link> / <span>{t("shop")}</span>
        {cat && <> / {translateCategory(cat.name)}</>}
      </nav>
      <h1 className="mt-2 text-4xl font-display">
        {s.q
          ? (isNepali ? `"${s.q}" का लागि नतिजा` : `Results for "${s.q}"`)
          : (s.sub ? translateSubcategory(s.sub) : (cat ? translateCategory(cat.name) : (s.sale ? t("offers") : t("all_products"))))}
      </h1>
      <div className="mt-8 grid gap-10 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">{Filters}</aside>
        <div>
          <div className="flex flex-wrap items-center gap-3 border-b pb-4">
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="h-4 w-4 mr-1.5" />
              {isNepali ? "फिल्टरहरू" : "Filters"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {filtered.length} {isNepali ? "सामग्रीहरू" : "products"}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Select value={s.sort ?? "popular"} onValueChange={(v) => set({ sort: v as S["sort"] })}>
                <SelectTrigger className="h-9 w-44" aria-label="Sort products">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">{isNepali ? "लोकप्रियता" : "Popularity"}</SelectItem>
                  <SelectItem value="newest">{isNepali ? "नयाँ सामग्री" : "Newest"}</SelectItem>
                  <SelectItem value="price_asc">{isNepali ? "मूल्य: कमदेखि धेरै" : "Price: low to high"}</SelectItem>
                  <SelectItem value="price_desc">{isNepali ? "मूल्य: धेरैदेखि कम" : "Price: high to low"}</SelectItem>
                  <SelectItem value="rating">{isNepali ? "ग्राहक मूल्याङ्कन" : "Customer rating"}</SelectItem>
                </SelectContent>
              </Select>
              <button
                onClick={() => set({ view: "grid" })}
                aria-label="Grid view"
                className={`rounded p-2 transition-colors ${s.view !== "list" ? "bg-muted" : "hover:bg-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => set({ view: "list" })}
                aria-label="List view"
                className={`rounded p-2 transition-colors ${s.view === "list" ? "bg-muted" : "hover:bg-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {chips.map((c) => (
                <button
                  key={c.label}
                  onClick={() => set(c.clear)}
                  className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs hover:border-foreground transition-colors"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button onClick={() => nav({ search: {} })} className="text-xs font-medium underline">
                {isNepali ? "सबै हटाउनुहोस्" : "Clear all"}
              </button>
            </div>
          )}
          {visible.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display text-2xl">{isNepali ? "कुनै सामग्री भेटिएन।" : "No products match."}</p>
              <p className="mt-2 text-muted-foreground">
                {isNepali
                  ? "कृपया फिल्टरहरू हटाएर पुनः प्रयास गर्नुहोस्।"
                  : "Try removing a filter or searching for something else."}
              </p>
              <Button className="mt-6" onClick={() => nav({ search: {} })}>
                {isNepali ? "सबै फिल्टर हटाउनुहोस्" : "Clear all filters"}
              </Button>
            </div>
          ) : (
            <div className={s.view === "list" ? "mt-6 space-y-4" : "mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3"}>
              {visible.map((p) => (
                <ProductCard key={p.id} p={p} layout={s.view ?? "grid"} />
              ))}
            </div>
          )}
          {pages > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => nav({ search: (prev) => ({ ...prev, page: n }) })}
                  aria-current={n === page ? "page" : undefined}
                  className={`h-9 w-9 rounded-md border text-sm transition-colors ${
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
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetTitle className="mb-6 font-display text-xl">{isNepali ? "फिल्टरहरू" : "Filters"}</SheetTitle>
          {Filters}
          <Button className="mt-8 w-full" onClick={() => setFiltersOpen(false)}>
            {isNepali ? `${filtered.length} सामग्रीहरू देखाउनुहोस्` : `Show ${filtered.length} products`}
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
