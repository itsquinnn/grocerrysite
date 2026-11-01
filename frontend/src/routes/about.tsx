import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, HeartHandshake, Compass, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — DOVAN" },
      { name: "description", content: "Learn about DOVAN: the confluence of traditional Nepali craftsmanship and contemporary design. Delivering across all 77 districts." },
      { property: "og:title", content: "Our Story — DOVAN" },
      { property: "og:description", content: "Learn about DOVAN: the confluence of traditional Nepali craftsmanship and contemporary design." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { isNepali } = useI18n();

  return (
    <div className="space-y-16 py-8 md:space-y-24 md:py-12">
      {/* Hero Header */}
      <section className="container-page">
        <div className="max-w-3xl">
          <p className="eyebrow">{isNepali ? "हाम्रो कथा र परम्परा" : "Our Story & Heritage"}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl md:text-6xl">
            {isNepali
              ? "हिमालयन शिल्पकारिता र आधुनिक जीवनशैलीको संगम।"
              : "Where Himalayan craftsmanship meets contemporary living."}
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            {isNepali
              ? "दोभानको स्थापना एक सरल सोचबाट भएको हो: स्थानीय सीप, उत्कृष्ट कच्चा पदार्थ र शिल्पकारहरूको सम्मानबाट बनेका सामग्रीहरूले हाम्रो जीवन र घरलाई अर्थपूर्ण बनाउँछन्।"
              : "DOVAN was founded on a simple conviction: that fewer, better things created with intention, local materials, and deep respect for makers bring lasting value to our homes, wardrobes, and daily rituals."}
          </p>
        </div>
      </section>

      {/* Hero Image Banner */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-xl">
          <img
            src="/assets/banners/hero.jpg"
            alt="Handcrafted goods in a sunlit studio"
            className="h-[360px] w-full object-cover md:h-[480px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-primary-foreground md:bottom-10 md:left-10">
            <p className="eyebrow text-primary-foreground/80">{isNepali ? "दोभानको अर्थ" : "The Meaning of DOVAN"}</p>
            <p className="mt-1 font-display text-2xl font-normal md:text-3xl">
              {isNepali
                ? '"दोभान" — दुई पवित्र नदीहरू एकाकार हुने पवित्र संगम स्थल।'
                : '"दोभान" — The sacred confluence where two rivers unite as one.'}
            </p>
            <p className="mt-2 max-w-xl text-xs text-primary-foreground/80 sm:text-sm">
              {isNepali
                ? "हामी पुस्तौँ पुरानो नेपाली मौलिक शिल्प र सफा आधुनिक डिजाइनको मिलन बिन्दु हौँ।"
                : "We stand at the meeting point of generational Nepali artisan heritage and clean modern aesthetics."}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Counter Row */}
      <section className="border-y bg-card py-10">
        <div className="container-page grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">७७</p>
            <p className="mt-1 text-sm font-medium">{isNepali ? "जिल्लामा डेलिभरी" : "Districts Delivered"}</p>
            <p className="text-xs text-muted-foreground">{isNepali ? "झापादेखि दार्चुलासम्म" : "From Jhapa to Darchula"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">१००+</p>
            <p className="mt-1 text-sm font-medium">{isNepali ? "स्थानीय शिल्पकार साझेदार" : "Local Artisan Partners"}</p>
            <p className="text-xs text-muted-foreground">{isNepali ? "उचित पारिश्रमिक र सम्मान" : "Fair wages & zero middlemen"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">१००%</p>
            <p className="mt-1 text-sm font-medium">{isNepali ? "क्यास अन डेलिभरी" : "Cash on Delivery"}</p>
            <p className="text-xs text-muted-foreground">{isNepali ? "सामान प्राप्त भएपछि भुक्तानी" : "Pay when goods reach you"}</p>
          </div>
          <div>
            <p className="font-display text-4xl font-semibold md:text-5xl">४.९ / ५</p>
            <p className="mt-1 text-sm font-medium">{isNepali ? "ग्राहक सन्तुष्टि मूल्याङ्कन" : "Customer Rating"}</p>
            <p className="text-xs text-muted-foreground">{isNepali ? "नेपालभर हजारौँको विश्वास" : "Loved across Nepal"}</p>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="container-page">
        <div className="text-center md:text-left">
          <p className="eyebrow">{isNepali ? "हाम्रा मुख्य स्तम्भहरू" : "Our Guiding Pillars"}</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">
            {isNepali ? "हामी केका लागि उभिन्छौँ" : "What we stand for"}
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{isNepali ? "शुद्ध हिमाली कच्चा पदार्थ" : "Pure Himalayan Materials"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNepali
                ? "हामी मुस्ताङको उच्च हिमाली च्याङ्ग्रा पश्मिना, इलामको अर्गानिक अर्थोडक्स चिया, र पाल्पाली हातेबुना ढाका प्रयोग गर्दछौँ।"
                : "We source cruelty-free Chyangra pashmina from the high Mustang plateau, organic orthodox green tea from Ilam, and handwoven Dhaka cotton from Palpa."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{isNepali ? "प्रत्यक्ष शिल्पकार सहकार्य" : "Fair Artisan Trade"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNepali
                ? "पाटन, भक्तपुर र ग्रामीण शिल्पकारहरूसँग प्रत्यक्ष काम गरी न्यायोचित पारिश्रमिक र श्रमको कदर सुनिश्चित गर्दछौँ।"
                : "We work directly with craft guilds in Patan, Bhaktapur, and rural communities, ensuring ethical working conditions, fair prices, and dignity of labor."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{isNepali ? "घर तथा यात्राका लागि निर्मित" : "Built for the Trail & Home"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNepali
                ? "हाम्रा पोशाक र आउटडोर गियर नेपालको भूगोलमा परीक्षण गरिएका हुन् — अन्नपूर्ण पदयात्राका लागि मजबुत र सहरका लागि आधुनिक।"
                : "Every garment and travel gear piece is tested in the unique topography of Nepal — rugged enough for the Annapurna Circuit, refined for city cafes."}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg">{isNepali ? "देशव्यापी पहुँच" : "Nationwide Accessibility"}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isNepali
                ? "अनलाइन किनमेल चक्रपथमा मात्र सीमित हुनुहुँदैन। भरपर्दा कुरियरहरूमार्फत नेपालका सबै ७७ जिल्लामा सुरक्षित डेलिभरी गर्दछौँ।"
                : "E-commerce shouldn't stop at ring road. We partner with reliable ground couriers to deliver verified packages with cash-on-delivery all across Nepal."}
            </p>
          </div>
        </div>
      </section>

      {/* Story Narrative Box */}
      <section className="container-page">
        <div className="grid gap-10 rounded-xl border bg-secondary/50 p-8 md:grid-cols-2 md:p-12">
          <div>
            <p className="eyebrow">{isNepali ? "हाम्रो दर्शन" : "Our Philosophy"}</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">
              {isNepali
                ? "कम तर उत्कृष्ट सामग्री, जसले लामो समय साथ दिन्छ।"
                : "Fewer, better things that grow with you."}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {isNepali
                ? "सस्तो र क्षणिक फेसनको भीडमा, हामी दीर्घकालीन विकल्प प्रस्तुत गर्न चाहन्छौँ। दोभान क्याटलगका प्रत्येक सामग्री टिकाउ छन् र शिल्पको कथा बोक्छन्।"
                : "In a world flooded with disposable fast fashion and unverified knockoffs, we wanted to build an alternative. Every product in the DOVAN catalog is selected because it solves a real need, lasts for years, and tells a genuine story of craft."}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              {isNepali
                ? "भक्तपुरका शिल्पकारले हाते चक्रमा बनाएको माटोको फूलदानी होस् वा वर्षा रोक्ने आधुनिक ज्याकेट, खोलेकै क्षणबाट उच्च गुणस्तरको फरकपन अनुभव गर्न सक्नुहुन्छ।"
                : "Whether it's a hand-thrown ceramic mug made by 4th generation potters in Bhaktapur, or our technical weatherproof jackets tailored for mountain rain, you can feel the distinction from the moment you unpack it."}
            </p>
          </div>
          <div className="flex flex-col justify-between rounded-lg border bg-card p-6 shadow-sm">
            <div>
              <p className="font-display text-lg italic text-foreground">
                {isNepali
                  ? '"गुणस्तर भनेको तपाईंले लगाउने र प्रयोग गर्ने वस्तु पछाडिका मानवीय हातहरूको कदर गर्नु हो। दोभान नेपाली शिल्पकारहरूको उत्कृष्ट कला तपाईंको ढोकासम्म पुर्‍याउन समर्पित छ।"'
                  : '"Quality is remembering the human hands behind what you wear and use every day. DOVAN exists to celebrate Nepali craftspeople and bring their finest works to your doorstep."'}
              </p>
              <p className="mt-4 font-semibold text-sm">
                {isNepali ? "— दोभान परिवार, काठमाडौँ" : "— The DOVAN Collective, Kathmandu"}
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/shop">{isNepali ? "संग्रह हेर्नुहोस्" : "Explore the Collection"}</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/stores">{isNepali ? "हाम्रा स्टोरहरू" : "Visit Our Stores"}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
