import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Banknote } from "lucide-react";
import { allProductsQuery, categoriesQuery, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Newsletter } from "@/components/site/Footer";
import { Stars } from "@/components/site/Stars";
import { getRecent } from "@/lib/shop";
import { getRecentViewedProducts } from "@/lib/offline";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const recommended = useMemo(() => products.filter((p) => p.is_featured).slice(0, 8), [products]);
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
            <div className="mt-5 sm:mt-6 flex flex-row flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5">
              <Button
                size="default"
                className="h-10 sm:h-11 px-5 sm:px-6 text-sm font-medium shadow-sm flex-1 sm:flex-initial justify-center"
                asChild
              >
                <Link to="/shop">{t("shop_collection")}</Link>
              </Button>
              <Button
                size="default"
                variant="outline"
                className="h-10 sm:h-11 px-4 sm:px-5 text-sm font-medium bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background border-foreground/15 flex-1 sm:flex-initial justify-center"
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
        eyebrow={isNepali ? "सर्वाधिक खोजिएका" : "Most wanted"}
        link={{ to: "/shop", search: { sort: "popular" } }}
      >
        <Grid items={trending} />
      </Section>

      <section className="container-page mt-12 md:mt-16">
        <div className="relative overflow-hidden rounded-md">
          <img
            src="/assets/banners/promo.jpg"
            alt="Trekking gear on a Himalayan ridge at dawn"
            loading="lazy"
            decoding="async"
            width={1600}
            height={800}
            className="h-80 w-full object-cover md:h-[420px]"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-primary/85 via-primary/40 to-transparent" />
          <div className="absolute inset-y-0 right-0 flex max-w-md flex-col justify-center p-6 text-right text-primary-foreground md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
              {isNepali ? "दशैँ विशेष अफर" : "Dashain offer"}
            </p>
            <h2 className="mt-2 text-3xl md:text-5xl font-display">
              {isNepali ? "रु ५०० सम्म छुट" : "Rs. 500 off the trail"}
            </h2>
            <p className="mt-3 text-sm opacity-85">
              {isNepali
                ? "रु ५,००० भन्दा माथिका अर्डरमा कुपन कोड DASHAIN500 प्रयोग गर्नुहोस्।"
                : "Code DASHAIN500 on orders above Rs. 5,000."}
            </p>
            <div className="mt-6">
              <Button variant="secondary" asChild>
                <Link to="/shop" search={{ category: "sports" }}>
                  {isNepali ? "आउटडोर सामग्री हेर्नुहोस्" : "Shop outdoors"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Section
        title={t("best_sellers")}
        eyebrow={isNepali ? "ग्राहकहरूको रोजाइ" : "Loved by customers"}
        link={{ to: "/shop", search: { sort: "rating" } }}
      >
        <Grid items={bestSellers} />
      </Section>

      <Section
        title={t("new_arrivals")}
        eyebrow={isNepali ? "भर्खरै थपिएका" : "Just in"}
        link={{ to: "/shop", search: { sort: "newest" } }}
      >
        <Grid items={newest} />
      </Section>

      {offers.length > 0 && (
        <Section
          title={isNepali ? "विशेष छुट अफरहरू" : "Special offers"}
          eyebrow={isNepali ? "सिमित अवधिका लागि" : "Limited time"}
          link={{ to: "/shop", search: { sale: true } }}
        >
          <Grid items={offers} />
        </Section>
      )}

      <Section
        title={t("recommended")}
        eyebrow={isNepali ? "हाम्रो विशेष चयन" : "Our edit"}
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
          eyebrow={isNepali ? "समीक्षाहरू" : "Reviews"}
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
