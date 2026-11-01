import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
}: {
  title: string;
  eyebrow?: string;
  link?: { to: string; search?: Record<string, unknown> };
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <section className="container-page mt-8 md:mt-10">
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
  <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
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

  useEffect(() => setRecentIds(getRecent("dovan_viewed")), []);

  const { data: reviews = [] } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () =>
      (
        await supabase
          .from("reviews")
          .select("*, products(name,slug)")
          .eq("is_approved", true)
          .gte("rating", 4)
          .order("created_at", { ascending: false })
          .limit(3)
      ).data ?? [],
  });

  const trending = [...products].sort((a, b) => b.sold_count - a.sold_count).slice(0, 4);
  const bestSellers = [...products]
    .sort((a, b) => Number(b.rating_avg) * b.rating_count - Number(a.rating_avg) * a.rating_count)
    .slice(0, 4);
  const newest = products.slice(0, 4);
  const offers = products
    .filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price))
    .slice(0, 4);
  const recommended = products.filter((p) => p.is_featured).slice(0, 8);
  const liveRecent = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];
  const recent = liveRecent.length > 0 ? liveRecent.slice(0, 4) : getRecentViewedProducts().slice(0, 4);

  return (
    <>
      <section className="relative overflow-hidden">
        <img
          src="/assets/banners/hero.jpg"
          alt="Linen shirt, leather bag and ceramics in a sunlit room"
          width={1920}
          height={1024}
          loading="eager"
          className="h-[380px] w-full object-cover object-[76%_42%] xs:h-[410px] sm:h-[460px] sm:object-[72%_42%] md:h-[520px] md:object-[68%_42%] lg:h-[580px] lg:object-[66%_42%] xl:h-[620px] xl:object-[64%_42%] 2xl:h-[660px]"
        />
        {/* Gentle, natural ambient gradient: keeps typography razor-sharp while letting the warm sunlight and tree shadows shine through */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-transparent md:from-background/75 md:via-background/20 md:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent sm:hidden" />

        <div className="container-page absolute inset-0 flex flex-col justify-center py-4 sm:py-6 md:py-8">
          <div className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <p className="eyebrow text-[11px] sm:text-xs tracking-wider uppercase text-accent font-semibold">
              {t("hero_season")}
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-display font-medium text-foreground leading-[1.08] tracking-tight">
              {t("hero_title")}
            </h1>
            <p className="mt-3 max-w-sm sm:max-w-md lg:max-w-lg text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
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

      <Section title={t("shop_by_category")} eyebrow={t("browse")}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cats.map((c) => {
            const catLabel = translateCategory(c.name);
            return (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="group relative overflow-hidden rounded-md shadow-sm transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={c.image_url ?? ""}
                  alt={catLabel}
                  loading="lazy"
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                <span className="absolute bottom-3 left-3 font-display text-lg text-primary-foreground transition-transform duration-300 ease-out group-hover:translate-x-1">
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

      {recent.length > 0 && (
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
