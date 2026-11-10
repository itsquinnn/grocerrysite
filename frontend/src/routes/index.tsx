import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, Banknote } from "lucide-react";
import { toast } from "sonner";
import { allProductsQuery, categoriesQuery, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
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
      <section className="relative overflow-hidden bg-[#fcf1e2] dark:bg-muted/30 h-[360px] xs:h-[380px] sm:h-[420px] md:h-[460px] lg:h-[500px] xl:h-[540px]">
        <div className="container-page absolute inset-0 flex flex-col justify-center pb-4">
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

      {/* Categories Skeleton */}
      <section className="container-page mt-4 md:mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-20 rounded bg-slate-200/80" />
            <Skeleton className="h-8 w-48 rounded bg-slate-200/90" />
          </div>
          <Skeleton className="h-4 w-20 rounded bg-slate-200/70" />
        </div>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex shrink-0 w-16 sm:w-20 md:w-22 flex-col items-center gap-1.5">
              <Skeleton className="h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 rounded-full bg-slate-200/80" />
              <Skeleton className="h-3 w-14 rounded bg-slate-200/90" />
            </div>
          ))}
        </div>
      </section>

      {/* Trending Products Rail Skeleton */}
      <section className="container-page mt-10 md:mt-12">
        <div className="mb-5 flex items-end justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24 rounded bg-slate-200/80" />
            <Skeleton className="h-8 w-44 rounded bg-slate-200/90" />
          </div>
          <Skeleton className="h-4 w-20 rounded bg-slate-200/70" />
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-3 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[170px] xs:w-[190px] sm:w-[210px] md:w-[220px] shrink-0 rounded-xl border bg-card p-3 space-y-3">
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

function ProductRail({ items }: { items: Product[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items]);

  const handleScroll = (dir: "left" | "right") => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    el.scrollBy({ left: dir === "left" ? -scrollAmount : scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="relative group/rail">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm transition-all hover:bg-foreground hover:text-background active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      <div
        ref={containerRef}
        className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-2.5 pt-0.5"
      >
        {items.map((p) => (
          <div key={p.id} className="w-[125px] xs:w-[135px] sm:w-[145px] md:w-[155px] shrink-0">
            <ProductCard p={p} />
          </div>
        ))}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/95 text-foreground shadow-sm transition-all hover:bg-foreground hover:text-background active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function ReviewsMarquee({ reviews }: { reviews: any[] }) {
  const { translateProduct } = useI18n();

  // Ensure enough items so that 50% width covers even ultra-wide monitors before looping
  const items = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    let list = reviews;
    while (list.length < 8) {
      list = [...list, ...reviews];
    }
    return [...list, ...list]; // duplicate once for seamless 50% translation loop
  }, [reviews]);

  if (!items.length) return null;

  return (
    <div className="relative overflow-hidden py-2 select-none group">
      {/* Edge gradient masks for seamless fade */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent z-10"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent z-10"
        aria-hidden="true"
      />

      {/* Marquee Track */}
      <div
        className="animate-marquee flex gap-4 sm:gap-6 items-stretch group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${Math.max(35, items.length * 3.5)}s` }}
      >
        {items.map((r: any, idx: number) => (
          <figure
            key={`${r.id}-${idx}`}
            className="w-[280px] sm:w-[340px] md:w-[380px] shrink-0 flex flex-col justify-between rounded-xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:border-foreground/30 hover:shadow-sm"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <Stars value={r.rating} />
                <span className="text-xs font-semibold text-foreground/80 ml-1">{r.rating}.0</span>
              </div>
              <blockquote className="mt-3 font-display text-sm sm:text-base leading-snug text-foreground line-clamp-3">
                "{r.body}"
              </blockquote>
            </div>
            <figcaption className="mt-4 pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground truncate">{r.author_name}</span>
              <span className="truncate text-muted-foreground/80 max-w-[170px]">
                {translateProduct(r.products?.name ?? "")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

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
          .select("*, products(title, name, slug)")
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(12);
        if (error) {
          const res = await supabase.from("reviews").select("*").gte("rating", 4).limit(12);
          data = res.data;
        }
        const dbReviews = (data ?? []).map((r: any) => ({
          ...r,
          author_name: r.author_name ?? "Customer",
          body: r.review_text ?? r.body ?? "",
          products: r.products
            ? { name: r.products.title ?? r.products.name, slug: r.products.slug ?? r.products.id }
            : null,
        }));

        if (dbReviews.length >= 6) return dbReviews;

        // Rich fallback reviews across multiple products so the carousel always has varied content
        const curatedFallbacks = [
          {
            id: "fb-rev-1",
            rating: 5,
            author_name: "Aayush Shrestha",
            body: "Fresh organic produce delivered right to my doorstep within 40 minutes. Super crisp quality!",
            products: { name: "Fresh Mountain Red Carrots" },
          },
          {
            id: "fb-rev-2",
            rating: 5,
            author_name: "Pooja Sharma",
            body: "Crispy, clean, and delicious bakery goods. Packaging was pristine.",
            products: { name: "Bakery & Sourdough Loaf" },
          },
          {
            id: "fb-rev-3",
            rating: 5,
            author_name: "Bikash Adhikari",
            body: "Finest quality dry fruits and cashews. Genuine taste and fast delivery across Nepal.",
            products: { name: "Whole King Cashew Nuts" },
          },
          {
            id: "fb-rev-4",
            rating: 5,
            author_name: "Sunita Gurung",
            body: "Authentic Himalayan items and pantry staples. Easy cash on delivery payment too.",
            products: { name: "Pantry & Cooking Essentials" },
          },
          {
            id: "fb-rev-5",
            rating: 5,
            author_name: "Rohan Shakya",
            body: "The quick checkout and genuine items make DOVAN my favorite shopping destination.",
            products: { name: "Tender Baby Spinach (Palak)" },
          },
          {
            id: "fb-rev-6",
            rating: 5,
            author_name: "Prashant Thapa",
            body: "Great customer care, reliable order tracking, and 100% fresh items every single time.",
            products: { name: "English Salad Cucumber" },
          },
        ];

        return [...dbReviews, ...curatedFallbacks.filter((fb) => !dbReviews.some((d: any) => d.id === fb.id))];
      } catch {
        return [];
      }
    },
  });

  const trending = useMemo(
    () => [...products].sort((a, b) => (b.sold_count ?? 0) - (a.sold_count ?? 0)).slice(0, 16),
    [products]
  );
  const bestSellers = useMemo(
    () =>
      [...products]
        .sort((a, b) => Number(b.rating_avg ?? 0) * (b.rating_count ?? 0) - Number(a.rating_avg ?? 0) * (a.rating_count ?? 0))
        .slice(0, 16),
    [products]
  );
  const newest = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
        .slice(0, 16),
    [products]
  );
  const offers = useMemo(
    () =>
      products
        .filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price))
        .sort((a, b) => {
          const discountA = (Number(a.compare_at_price) - Number(a.price)) / Number(a.compare_at_price);
          const discountB = (Number(b.compare_at_price) - Number(b.price)) / Number(b.compare_at_price);
          return discountB - discountA;
        })
        .slice(0, 16),
    [products]
  );
  const recommended = useMemo(() => {
    const featured = products.filter((p) => p.is_featured);
    if (featured.length >= 16) return featured.slice(0, 16);
    const featuredIds = new Set(featured.map((p) => p.id));
    const nonFeaturedTop = [...products]
      .filter((p) => !featuredIds.has(p.id))
      .sort((a, b) => Number(b.rating_avg ?? 0) - Number(a.rating_avg ?? 0));
    return [...featured, ...nonFeaturedTop].slice(0, 16);
  }, [products]);
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
      <section className="relative overflow-hidden bg-[#fcf1e2]">
        <picture>
          <source srcSet="/assets/banners/hero.webp" type="image/webp" />
          <img
            src="/assets/banners/hero.webp"
            alt="DOVAN curated collection of lifestyle essentials, apparel, and modern goods"
            width={1920}
            height={1080}
            loading="eager"
            decoding="async"
            // @ts-expect-error fetchPriority supported in modern browsers
            fetchPriority="high"
            className="h-[360px] w-full object-cover object-[80%_48%] xs:h-[380px] sm:h-[420px] sm:object-[76%_48%] md:h-[460px] md:w-full md:object-contain md:object-right lg:h-[500px] xl:h-[540px]"
          />
        </picture>
        {/* Soft, natural gradient: clear contrast under text on mobile, subtle seamless transition on desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/55 to-transparent/10 md:from-[#fcf1e2]/95 md:via-[#fcf1e2]/50 md:to-transparent md:max-w-2xl pointer-events-none" />

        <div className="container-page absolute inset-0 flex flex-col justify-center pb-4">
          <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-foreground/75 font-medium">
              {t("hero_season")}
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-[54px] xl:text-[58px] font-display font-medium text-foreground leading-[1.08] tracking-tight">
              {t("hero_title")}
            </h1>
            <p className="mt-3.5 max-w-sm sm:max-w-md lg:max-w-lg text-sm sm:text-base lg:text-lg text-foreground/80 leading-relaxed">
              {t("hero_subtitle")}
            </p>
            <div className="mt-5 sm:mt-7 flex items-center gap-3">
              <Link
                to="/shop"
                className="h-10 px-5 text-xs sm:text-sm font-medium bg-foreground text-background border border-foreground hover:bg-foreground/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{t("shop_collection")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/shop"
                search={{ sale: true }}
                className="h-10 px-5 text-xs sm:text-sm font-medium bg-background/60 text-foreground border border-foreground/30 hover:border-foreground hover:bg-background/90 hover:text-foreground transition-colors inline-flex items-center cursor-pointer shadow-xs"
              >
                <span>{t("see_offers")}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Section
        title={t("shop_by_category")}
        eyebrow={t("browse")}
        link={{ to: "/shop" }}
        className="mt-6 md:mt-7"
      >
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1">
          {cats.map((c) => {
            const catLabel = translateCategory(c.name);
            return (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="group flex shrink-0 w-16 sm:w-20 md:w-22 flex-col items-center text-center transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="relative mb-2 flex h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/70 shadow-xs transition-all duration-300 group-hover:ring-2 group-hover:ring-foreground/40 group-hover:shadow-sm">
                  <img
                    src={c.image_url ?? ""}
                    alt={catLabel}
                    decoding="async"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-108"
                  />
                </div>
                <span className="line-clamp-2 text-[11px] sm:text-xs font-medium text-foreground transition-colors group-hover:text-accent leading-tight">
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
        <ProductRail items={trending} />
      </Section>

      <Section
        title={t("best_sellers")}
        eyebrow={"Loved by customers"}
        link={{ to: "/shop", search: { sort: "rating" } }}
      >
        <ProductRail items={bestSellers} />
      </Section>

      <Section
        title={t("new_arrivals")}
        eyebrow={"Just in"}
        link={{ to: "/shop", search: { sort: "newest" } }}
      >
        <ProductRail items={newest} />
      </Section>

      {offers.length > 0 && (
        <Section
          title={"Special offers"}
          eyebrow={"Limited time"}
          link={{ to: "/shop", search: { sale: true } }}
        >
          <ProductRail items={offers} />
        </Section>
      )}

      <Section
        title={t("recommended")}
        eyebrow={"Our edit"}
      >
        <ProductRail items={recommended} />
      </Section>

      {mounted && recent.length > 0 && (
        <Section title={t("recently_viewed")}>
          <ProductRail items={recent} />
        </Section>
      )}

      {reviews.length > 0 && (
        <Section
          title={t("customer_reviews")}
          eyebrow={"Reviews"}
        >
          <ReviewsMarquee reviews={reviews} />
        </Section>
      )}


    </>
  );
}
