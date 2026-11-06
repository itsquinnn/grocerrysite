import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Banknote } from "lucide-react";
import { allProductsQuery, categoriesQuery, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { PromoBannerCarousel } from "@/components/site/PromoBannerCarousel";
import { Newsletter } from "@/components/site/Footer";
import { Stars } from "@/components/site/Stars";
import { getRecent } from "@/lib/shop";
import { getRecentViewedProducts } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function HomeSkeleton() {
  return (
    <div className="w-full animate-in fade-in-50 duration-200">
      {/* Hero Skeleton */}
      <section className="relative overflow-hidden bg-slate-100 dark:bg-muted/30 h-[380px] xs:h-[410px] sm:h-[460px] md:h-[520px] lg:h-[580px] xl:h-[620px] 2xl:h-[660px]">
        <div className="container-page absolute inset-0 flex flex-col justify-center sm:justify-start sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 pb-4 sm:pb-8">
          <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl space-y-3.5">
            <Skeleton className="h-4 w-32 rounded-full bg-slate-200/90 dark:bg-muted/80" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-4/5 max-w-lg rounded-lg bg-slate-200/90 dark:bg-muted/80" />
            <Skeleton className="h-10 sm:h-12 md:h-14 w-3/5 max-w-md rounded-lg bg-slate-200/90 dark:bg-muted/80" />
            <Skeleton className="h-4 w-full max-w-md rounded bg-slate-200/70 dark:bg-muted/60 mt-2" />
            <Skeleton className="h-4 w-3/4 max-w-sm rounded bg-slate-200/70 dark:bg-muted/60" />
            <div className="mt-4 sm:mt-6 flex items-center gap-3 pt-2">
              <Skeleton className="h-9 sm:h-10 w-32 sm:w-36 rounded-full bg-slate-300/80 dark:bg-muted" />
              <Skeleton className="h-9 sm:h-10 w-28 sm:w-32 rounded-full bg-slate-200/80 dark:bg-muted/60" />
            </div>
          </div>
        </div>
      </section>

      {/* USP Bar Skeleton */}
      <div className="border-b bg-card">
        <div className="container-page grid grid-cols-2 gap-2.5 sm:gap-4 py-3 sm:py-3.5 text-xs sm:text-sm md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
              <Skeleton className="h-4 w-28 rounded bg-slate-200/80" />
            </div>
          ))}
        </div>
      </div>

      {/* Categories Skeleton */}
      <section className="container-page mt-8 md:mt-10">
        <div className="mb-5 space-y-1.5">
          <Skeleton className="h-3.5 w-20 rounded bg-slate-200/80" />
          <Skeleton className="h-8 w-48 rounded bg-slate-200/90" />
        </div>
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative overflow-hidden rounded-md aspect-[3/4] bg-slate-100 dark:bg-muted/40 p-3 flex flex-col justify-end border border-slate-200/60 shadow-xs">
              <Skeleton className="h-5 w-3/4 rounded bg-slate-200/80" />
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products Grid Skeleton */}
      <section className="container-page mt-10 md:mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded bg-slate-200/80" />
            <Skeleton className="h-8 w-44 rounded bg-slate-200/90" />
          </div>
          <Skeleton className="h-4 w-20 rounded bg-slate-200/70" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-3 space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg bg-slate-100 dark:bg-muted/50" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded bg-slate-200/70" />
                <Skeleton className="h-4 w-full rounded bg-slate-200/80" />
                <Skeleton className="h-4 w-2/3 rounded bg-slate-200/80" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-16 rounded bg-slate-200/90" />
                <Skeleton className="h-8 w-16 rounded-md bg-slate-200/80" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DOVAN — Considered goods, delivered across Nepal" },
      { name: "description", content: "Fashion, electronics, home, beauty and outdoor gear chosen with care. Free delivery over Rs. 5,000 and cash on delivery across Nepal." },
      { property: "og:title", content: "DOVAN — Considered goods, delivered across Nepal" },
      { property: "og:description", content: "Fashion, electronics, home, beauty and outdoor gear. Cash on delivery across Nepal." },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(allProductsQuery), context.queryClient.ensureQueryData(categoriesQuery)]),
  pendingComponent: HomeSkeleton,
  component: Home,
});

function Section({
  title,
  eyebrow,
  link,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  link?: { to: string; search?: Record<string, unknown> };
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <section className={cn("container-page mt-8 md:mt-10", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="mt-1 text-2xl md:text-3xl lg:text-4xl">{title}</h2>
        </div>
        {link && (
          <Link
            to="/shop"
            search={link.search as never}
            className="flex shrink-0 items-center gap-1 text-sm font-medium hover:text-accent"
          >
            {t("view_all")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const Grid = ({ items }: { items: Product[] }) => (
  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
    {items.map((p) => (
      <ProductCard key={p.id} p={p} />
    ))}
  </div>
);

function Home() {
  const { data: products } = useSuspenseQuery(allProductsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const { t, translateCategory, translateProduct, isNepali } = useI18n();
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => setRecentIds(getRecent("dovan_viewed")), []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () => {
      try {
        let { data, error } = await supabase
          .from("reviews")
          .select("*, products(title)")
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(3);
        if (error) {
          const res = await supabase.from("reviews").select("*").gte("rating", 4).limit(3);
          data = res.data;
        }
        return (data ?? []).map((r: any) => ({
          ...r,
          author_name: r.author_name ?? "Customer",
          body: r.review_text ?? r.body ?? "",
          products: r.products ? { name: r.products.title ?? r.products.name, slug: r.products.id } : null,
        }));
      } catch {
        return [];
      }
    },
  });

  const trending = useMemo(() => [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 6), [products]);
  const bestSellers = useMemo(
    () =>
      [...products]
        .sort((a, b) => Number(b.rating_avg) * b.rating_count - Number(a.rating_avg) * a.rating_count)
        .slice(0, 6),
    [products]
  );
  const newest = useMemo(() => products.slice(0, 6), [products]);
  const offers = useMemo(
    () => products.filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)).slice(0, 6),
    [products]
  );
  const recommended = useMemo(() => products.filter((p) => p.is_featured).slice(0, 6), [products]);
  const liveRecent = useMemo(
    () =>
      recentIds
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as Product[],
    [recentIds, products]
  );
  const recent = useMemo(
    () => (liveRecent.length > 0 ? liveRecent.slice(0, 4) : getRecentViewedProducts().slice(0, 4)),
    [liveRecent]
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <img
          src="/assets/banners/hero.jpg"
          alt="Linen shirt, leather bag and ceramics in a sunlit room"
          width={1920}
          height={1024}
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchPriority supported in modern browsers
          fetchPriority="high"
          className="h-[380px] w-full object-cover object-[76%_42%] xs:h-[410px] sm:h-[460px] sm:object-[72%_42%] md:h-[520px] md:object-[68%_42%] lg:h-[580px] lg:object-[66%_42%] xl:h-[620px] xl:object-[64%_42%] 2xl:h-[660px]"
        />
        {/* Soft, natural gradient: clear contrast under text on mobile, airy sunlit warmth on desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-transparent/10 md:from-background/75 md:via-background/20 md:to-transparent" />

        <div className="container-page absolute inset-0 flex flex-col justify-center sm:justify-start sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 pb-4 sm:pb-8">
          <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <p className="eyebrow text-xs sm:text-[13px] tracking-[0.16em] uppercase text-accent font-semibold">
              {t("hero_season")}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-[56px] xl:text-6xl font-display font-medium text-foreground leading-[1.08] tracking-tight">
              {t("hero_title")}
            </h1>
            <p className="mt-3.5 max-w-sm sm:max-w-md lg:max-w-lg text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
              {t("hero_subtitle")}
            </p>
            <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-3">
              <Button
                size="sm"
                className="h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-medium rounded-full shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-transform"
                asChild
              >
                <Link to="/shop">
                  {t("shop_collection")}
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-medium rounded-full bg-background/70 backdrop-blur-sm border-foreground/20 hover:bg-background transition-colors shadow-xs"
                asChild
              >
                <Link to="/shop" search={{ sale: true }}>
                  {t("see_offers")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b bg-card">
        <div className="container-page grid grid-cols-2 gap-2.5 sm:gap-4 py-2.5 sm:py-3 text-xs sm:text-sm md:grid-cols-4">
          {[
            [Truck, t("usp_delivery")],
            [Banknote, t("usp_cod")],
            [RotateCcw, t("usp_returns")],
            [ShieldCheck, t("usp_genuine")],
          ].map(([Icon, labelText]) => {
            const I = Icon as typeof Truck;
            return (
              <div key={labelText as string} className="flex items-center gap-2 min-w-0">
                <I className="h-4 w-4 text-accent shrink-0" />
                <span className="truncate font-medium sm:font-normal">{labelText as string}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Section
        title={t("shop_by_category")}
        eyebrow={t("browse")}
      >
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {cats.map((c) => {
            const catLabel = translateCategory(c.name);
            return (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="group relative overflow-hidden rounded-md shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md transform-gpu will-change-transform"
              >
                <img
                  src={c.image_url ?? ""}
                  alt={catLabel}
                  decoding="async"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] transform-gpu will-change-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent transition-opacity duration-300 group-hover:opacity-90 pointer-events-none" />
                <span className="absolute bottom-3 left-3 font-display text-base sm:text-lg text-primary-foreground font-medium">
                  {catLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </Section>

      <Section
        title={t("trending")}
        eyebrow={"Most wanted"}
        link={{ to: "/shop", search: { sort: "popular" } }}
      >
        <Grid items={trending} />
      </Section>

      {/* Auto-Rotating Promotional Banners Carousel */}
      <PromoBannerCarousel />

      <Section
        title={t("best_sellers")}
        eyebrow={"Loved by customers"}
        link={{ to: "/shop", search: { sort: "rating" } }}
      >
        <Grid items={bestSellers} />
      </Section>

      <Section
        title={t("new_arrivals")}
        eyebrow={"Just in"}
        link={{ to: "/shop", search: { sort: "newest" } }}
      >
        <Grid items={newest} />
      </Section>

      {offers.length > 0 && (
        <Section
          title={"Special offers"}
          eyebrow={"Limited time"}
          link={{ to: "/shop", search: { sale: true } }}
        >
          <Grid items={offers} />
        </Section>
      )}

      <Section
        title={t("recommended")}
        eyebrow={"Our edit"}
      >
        <Grid items={recommended} />
      </Section>

      {mounted && recent.length > 0 && (
        <Section title={t("recently_viewed")}>
          <Grid items={recent} />
        </Section>
      )}

      {reviews.length > 0 && (
        <Section
          title={t("customer_reviews")}
          eyebrow={"Reviews"}
        >
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-md border bg-card p-6">
                <Stars value={r.rating} />
                <blockquote className="mt-3 font-display text-lg leading-snug">"{r.body}"</blockquote>
                <figcaption className="mt-4 text-sm text-muted-foreground">
                  {r.author_name} · {translateProduct((r as { products?: { name: string } }).products?.name ?? "")}
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}


    </>
  );
}
