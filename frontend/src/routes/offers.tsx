import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Check, Tag, Flame, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { allProductsQuery } from "@/lib/catalog";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Special Offers & Deals — DOVAN" },
      { name: "description", content: "Active coupon codes, seasonal discounts, and limited-time deals on clothing, electronics, home and outdoors at DOVAN." },
      { property: "og:title", content: "Special Offers & Deals — DOVAN" },
      { property: "og:description", content: "Active coupons and seasonal sales across Nepal." },
    ],
  }),
  component: OffersPage,
});

const COUPONS_EN = [
  {
    code: "WELCOME10",
    discount: "10% OFF",
    title: "New Customer Welcome",
    description: "Enjoy 10% off your entire first order. Valid across all categories.",
    minOrder: "Min. order Rs. 2,000",
    badge: "Most Popular",
  },
  {
    code: "DASHAIN500",
    discount: "Rs. 500 OFF",
    title: "Himalayan Trail & Outdoors",
    description: "Flat Rs. 500 discount on trekking jackets, bags, and adventure gear.",
    minOrder: "Min. order Rs. 5,000",
    badge: "Outdoor Special",
  },
  {
    code: "FREESHIP",
    discount: "FREE DELIVERY",
    title: "Nationwide Doorstep Delivery",
    description: "Free shipping to any of Nepal's 77 districts with Cash on Delivery.",
    minOrder: "Min. order Rs. 5,000",
    badge: "All 77 Districts",
  },
  {
    code: "CRAFT15",
    discount: "15% OFF",
    title: "Handcrafted Heritage",
    description: "Special savings on authentic Nepali pashmina, Dhaka textiles, and brassware.",
    minOrder: "Min. order Rs. 3,500",
    badge: "Artisan Edit",
  },
];

const COUPONS_NE = [
  {
    code: "WELCOME10",
    discount: "१०% छुट",
    title: "नयाँ ग्राहक स्वागत अफर",
    description: "पहिलो अर्डरमा सबै वर्गका सामग्रीमा १०% छुट पाउनुहोस्।",
    minOrder: "न्यूनतम अर्डर रु २,०००",
    badge: "सर्वाधिक लोकप्रिय",
  },
  {
    code: "DASHAIN500",
    discount: "रु ५०० छुट",
    title: "हिमालयन पदयात्रा तथा आउटडोर",
    description: "ट्रेकिङ ज्याकेट, ब्याग र आउटडोर सामग्रीहरूमा सिधै रु ५०० छुट।",
    minOrder: "न्यूनतम अर्डर रु ५,०००",
    badge: "आउटडोर विशेष",
  },
  {
    code: "FREESHIP",
    discount: "निःशुल्क डेलिभरी",
    title: "देशभर घरदैलो डेलिभरी",
    description: "नेपालका सबै ७७ जिल्लामा निःशुल्क डेलिभरी र क्यास अन डेलिभरी सुविधा।",
    minOrder: "न्यूनतम अर्डर रु ५,०००",
    badge: "सबै ७७ जिल्ला",
  },
  {
    code: "CRAFT15",
    discount: "१५% छुट",
    title: "नेपाली हस्तकला मौलिक संग्रह",
    description: "खाँटी पश्मिना, पाल्पाली ढाका र हस्तकला भाँडाकुँडामा विशेष छुट।",
    minOrder: "न्यूनतम अर्डर रु ३,५००",
    badge: "हस्तकला छनोट",
  },
];

function OffersPage() {
  const { data: products = [] } = useQuery(allProductsQuery);
  const { isNepali, t } = useI18n();
  const [copied, setCopied] = useState<string | null>(null);

  const coupons = isNepali ? COUPONS_NE : COUPONS_EN;

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    toast.success(
      isNepali ? `कुपन कोड ${code} कपी भयो!` : `Coupon code ${code} copied to clipboard!`
    );
    setTimeout(() => setCopied(null), 2500);
  };

  const saleProducts = products
    .filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price))
    .sort((a, b) => {
      const discA = ((Number(a.compare_at_price) - Number(a.price)) / Number(a.compare_at_price));
      const discB = ((Number(b.compare_at_price) - Number(b.price)) / Number(b.compare_at_price));
      return discB - discA;
    });

  return (
    <div className="container-page space-y-12 py-8 md:space-y-16 md:py-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-accent">
          <Flame className="h-5 w-5" />
          <p className="eyebrow text-accent font-semibold">
            {isNepali ? "चाडपर्व तथा विशेष अफरहरू" : "Festive Season & Ongoing Deals"}
          </p>
        </div>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          {isNepali ? "अफर तथा कुपनहरू" : "Offers & Coupon Vault"}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {isNepali
            ? "चेकआउट गर्दा कुपन कोड प्रयोग गर्नुहोस् वा सिमित अवधिका छुटहरूमा नेपालभर क्यास अन डेलिभरी पाउनुहोस्।"
            : "Apply any of our active vouchers at checkout, or browse curated items on limited-time discount with cash on delivery across Nepal."}
        </p>
      </div>

      {/* Coupon Cards Grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-accent" />
            {isNepali ? "सक्रिय प्रोमो कोडहरू" : "Active Promo Codes"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {isNepali ? "कपी गर्न कोडमा थिच्नुहोस्" : "Click code to copy"}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {coupons.map((c) => {
            const isCopied = copied === c.code;
            return (
              <div
                key={c.code}
                className="relative flex flex-col justify-between rounded-lg border bg-card p-5 shadow-sm transition hover:border-foreground/40 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent">
                      {c.badge}
                    </span>
                    <span className="text-xs font-bold text-sale">{c.discount}</span>
                  </div>
                  <h3 className="mt-3 font-semibold text-base">{c.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground">{c.description}</p>
                  <p className="mt-3 text-[11px] font-medium text-foreground/70">{c.minOrder}</p>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => copyCode(c.code)}
                    className="flex items-center gap-2 rounded-md border border-dashed border-foreground/30 bg-muted/60 px-3 py-1.5 font-mono text-xs font-bold tracking-wider hover:bg-muted"
                    title={isNepali ? "कपी गर्नुहोस्" : "Click to copy"}
                  >
                    <span>{c.code}</span>
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-success" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCode(c.code)}
                    className="text-xs"
                  >
                    {isCopied ? (isNepali ? "कपी भयो" : "Copied") : (isNepali ? "कपी" : "Copy")}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sale Products Section */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-4">
          <div>
            <p className="eyebrow">{isNepali ? "मूल्य छुट" : "Price Drops"}</p>
            <h2 className="mt-1 font-display text-2xl md:text-3xl">
              {isNepali ? "विशेष छुटमा उपलब्ध सामग्रीहरू" : "Special Deals on Sale"}
            </h2>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/shop" search={{ sale: true }} className="flex items-center gap-1">
              {isNepali ? "सबै छुट सामग्रीहरू हेर्नुहोस्" : "View all sale items"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {saleProducts.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-lg font-medium">
              {isNepali ? "नयाँ अफरहरू चाँडै थपिँदैछन्" : "More deals arriving soon"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isNepali
                ? "तपाईंले माथिका प्रोमो कोडहरू चेकआउट गर्दा प्रयोग गर्न सक्नुहुन्छ।"
                : "You can still use any of the promo codes above on regular-priced items at checkout."}
            </p>
            <Button className="mt-6" asChild>
              <Link to="/shop">{isNepali ? "सामग्रीहरू हेर्नुहोस्" : "Shop collection"}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>

      {/* Terms & Info Note */}
      <section className="rounded-lg border bg-secondary/40 p-6 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground text-sm">
          {isNepali ? "अफरका सर्त तथा जानकारी" : "Offer Terms & Information"}
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {isNepali ? (
            <>
              <li>चेकआउट गर्दा प्रोमो कोड बाकसमा कुपन कोड प्रयोग गर्न सकिन्छ। एक अर्डरमा एउटा मात्र कुपन लागू हुन्छ।</li>
              <li>रु ५,००० वा सोभन्दा बढीको खरिदमा नि:शुल्क डेलिभरी स्वतः सक्रिय हुन्छ।</li>
              <li>नेपालका सबै ७७ जिल्लामा छुट सामग्रीहरूमा क्यास अन डेलिभरी उपलब्ध छ।</li>
              <li>अफरका सबै सामग्रीहरूमा ७ दिनभित्र सजिलो फिर्ता तथा साटफेर सुविधा लागू हुन्छ।</li>
            </>
          ) : (
            <>
              <li>Coupons can be applied during checkout in the promo code box. One coupon per order.</li>
              <li>Free delivery automatically activates on any order total equal to or exceeding Rs. 5,000.</li>
              <li>Cash on delivery is supported for all discounted items across all 77 districts of Nepal.</li>
              <li>Standard 7-day returns and exchanges apply to all offer products.</li>
            </>
          )}
        </ul>
      </section>
    </div>
  );
}
