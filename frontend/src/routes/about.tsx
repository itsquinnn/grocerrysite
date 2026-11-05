import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  HeartHandshake,
  Compass,
  Truck,
  CheckCircle2,
  ShieldCheck,
  Award,
  ArrowRight,
  MapPin,
  Flame,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story & Heritage — DOVAN" },
      {
        name: "description",
        content:
          "Learn about DOVAN (दोभान): the sacred confluence of generational Nepali craftsmanship and contemporary design. Delivering across all 77 districts with Cash on Delivery.",
      },
      { property: "og:title", content: "Our Story & Heritage — DOVAN" },
      {
        property: "og:description",
        content:
          "Discover the story of DOVAN: where Himalayan artisan heritage meets modern living.",
      },
    ],
  }),
  component: AboutPage,
});

export function AboutPage() {
  const { isNepali } = useI18n();

  return (
    <div className="space-y-16 py-8 md:space-y-24 md:py-12">
      {/* 1. Hero Header */}
      <section className="container-page">
        <div className="max-w-3xl">
          <p className="eyebrow text-accent font-semibold tracking-[0.2em]">
            {isNepali ? "हाम्रो कथा र परम्परा" : "Our Story & Heritage"}
          </p>
          <h1 className="mt-2 font-display text-4xl leading-[1.12] sm:text-5xl md:text-6xl text-foreground">
            {isNepali
              ? "हिमाली शिल्पकला र आधुनिक जीवनशैलीको अनुपम संगम।"
              : "Where Himalayan craftsmanship meets contemporary living."}
          </h1>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg leading-relaxed">
            {isNepali
              ? "दोभानको जन्म एउटै दृढ विश्वासबाट भएको हो: स्थानीय सीप, प्राकृतिक स्रोत र कालिगडप्रतिको गहिरो सम्मानका साथ बनेका थोरै तर उत्कृष्ट वस्तुहरूले हाम्रो घर र जीवनमा स्थायी मूल्य ल्याउँछन्।"
              : "DOVAN was founded on a simple conviction: that fewer, better things created with intention, local materials, and deep respect for makers bring lasting value to our homes, wardrobes, and daily rituals."}
          </p>
        </div>
      </section>

      {/* 2. Hero Visual Showcase - Confluence Image */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm group">
          <img
            src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85"
            alt="Misty Himalayan mountain valley and flowing river confluence in Nepal"
            className="h-[360px] w-full object-cover object-center sm:h-[460px] md:h-[540px] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />

          {/* Overlay Content */}
          <div className="absolute bottom-6 left-6 right-6 text-white md:bottom-10 md:left-10 md:right-10">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/90 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-accent-foreground backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {isNepali ? "दोभानको अर्थ" : "The Meaning of DOVAN"}
            </span>

            <h2 className="mt-2 font-display text-2xl sm:text-3xl md:text-4xl font-normal text-white drop-shadow-sm">
              {isNepali
                ? '"दोभान" — दुई पवित्र नदीहरूको संगम जहाँ एक नयाँ शक्ति जन्मन्छ।'
                : '"DOVAN" — The sacred confluence where two rivers unite as one.'}
            </h2>

            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-white/85 leading-relaxed">
              {isNepali
                ? "हामी पुर्खौंदेखि चल्दै आएको नेपाली शिल्पकला र सफा, आधुनिक डिजाइनको पवित्र संगममा उभिन्छौं।"
                : "We stand at the meeting point of generational Nepali artisan heritage and clean modern aesthetics. Everything we make bridges timeless tradition with daily modern utility."}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Elevated Impact Stats Bar */}
      <section className="border-y bg-card/60 backdrop-blur-sm py-10 md:py-12">
        <div className="container-page grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
          <div className="space-y-1">
            <p className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl text-primary">
              {"77"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isNepali ? "जिल्लामा डेलिभरी" : "Districts Delivered"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "झापादेखि दार्चुलासम्म घरदैलोमा" : "Cash on Delivery from Jhapa to Darchula"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl text-primary">
              {"100+"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isNepali ? "स्थानीय कालिगड साझेदार" : "Artisan Partners"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "उचित पारिश्रमिक र बिचौलियामुक्त" : "Fair living wages & zero middlemen"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl text-primary">
              {"100%"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isNepali ? "नगद भुक्तानी सुविधा" : "Cash on Delivery"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "सामान हेरेर मात्र भुक्तानी गर्नुहोस्" : "Inspect your package before paying"}
            </p>
          </div>

          <div className="space-y-1">
            <p className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl text-primary">
              {"4.9 / 5"}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {isNepali ? "ग्राहक सन्तुष्टि मूल्याङ्कन" : "Customer Rating"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "नेपालभरिका ग्राहकहरूको विश्वास" : "Loved by thousands across Nepal"}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Story Chapter 1: The Artisan Heritage (Pottery & Hands) */}
      <section className="container-page">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-14">
          <div className="space-y-5">
            <p className="eyebrow text-accent font-semibold tracking-wider">
              {isNepali ? "हाम्रो जरा र सीप" : "Rooted In Living Heritage"}
            </p>
            <h2 className="font-display text-3xl leading-snug sm:text-4xl text-foreground">
              {isNepali
                ? "पुस्ता-पुस्ताको ज्ञान र हातको जादू, हरेक सिर्जनामा।"
                : "Generational wisdom shaped by human hands, in every piece."}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isNepali
                ? "भक्तपुरको पोटरी स्क्वायरका माटाका भाँडाहरूदेखि पाटनका काँस र तामाका धातु शिल्पीहरू, अनि मुस्ताङको उच्च हिमाली च्याङ्ग्रा पश्मिना कात्ने आमाहरूसम्म — दोभानका हरेक उत्पादन मानवीय स्पर्श र आत्माले भरिएका छन्।"
                : "From the traditional terracotta kilns of Bhaktapur's Pottery Square to master metal ateliers in Patan, and women's cooperatives combing cruelty-free Chyangra pashmina across the high Mustang plateau — every DOVAN product is shaped by real hands carrying centuries of generational craft."}
            </p>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isNepali
                ? "हामी बिचौलियाहरूको जालो हटाएर सीधै कालिगडहरूसँग साझेदारी गर्छौं, जसले गर्दा उनीहरूले आफ्नो सीपको उचित कदर र सम्मानजनक आम्दानी पाउँछन्।"
                : "By bypassing exploitative layers of middlemen, we ensure that over 80% of production value stays directly with the artisan families and rural guilds who breathe life into our collections."}
            </p>

            <div className="rounded-xl border-l-4 border-accent bg-accent/5 p-4 sm:p-5">
              <p className="font-display text-sm sm:text-base italic text-foreground leading-relaxed">
                {isNepali
                  ? '"हाम्रा हातले बनाउने हरेक भाँडा र धागोमा हाम्रा पुर्खाको आशिर्वाद र हाम्रो माटोको सुगन्ध मिसिएको हुन्छ।"'
                  : '"Every curve shaped by the wheel and every thread bound by the loom carries our ancestors’ blessings and the quiet dignity of Nepali soil."'}
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isNepali ? "— भक्तपुरका परम्परागत माटो शिल्पी" : "— Master Craftsman, Bhaktapur Heritage Guild"}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
              <img
                src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85"
                alt="Master artisan hands shaping earthen clay pottery on a spinning wheel"
                className="aspect-[4/3] sm:aspect-[16/11] w-full object-cover"
              />
            </div>
            {/* Floating Info Pill */}
            <div className="absolute -bottom-4 right-4 sm:-bottom-5 sm:right-6 rounded-xl border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {isNepali ? "भक्तपुर टेराकोटा" : "Bhaktapur Terracotta"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isNepali ? "४ पुस्तादेखि निरन्तर" : "4th Generation Pottery Guild"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Story Chapter 2: The Philosophy (Loom & Dhaka Textiles) */}
      <section className="container-page">
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-14">
          <div className="relative order-2 md:order-1">
            <div className="overflow-hidden rounded-2xl border bg-card shadow-md">
              <img
                src="https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=85"
                alt="Traditional artisan weaver carefully working on wooden textile handloom"
                className="aspect-[4/3] sm:aspect-[16/11] w-full object-cover"
              />
            </div>
            {/* Floating Info Pill */}
            <div className="absolute -bottom-4 left-4 sm:-bottom-5 sm:left-6 rounded-xl border bg-background/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {isNepali ? "पाल्पाली ढाका र ऊन" : "Handloom Dhaka & Wool"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isNepali ? "१००% प्राकृतिक धागो र रङ" : "100% Natural Plant Dyes"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-5">
            <p className="eyebrow text-accent font-semibold tracking-wider">
              {isNepali ? "हाम्रो विचार र मान्यता" : "Our Conscious Philosophy"}
            </p>
            <h2 className="font-display text-3xl leading-snug sm:text-4xl text-foreground">
              {isNepali
                ? "छिट्टै फाल्ने होइन, वर्षौंसम्म साथ दिने वस्तुहरू।"
                : "In an era of disposable fashion, we build for permanence."}
            </h2>
            <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
              {isNepali
                ? "हामी सस्तो, एकपटक प्रयोग गरेर फालिने प्लास्टिक र कमसल सामानहरूको विपरीत दिशामा हिंडिरहेका छौं। दोभानको प्रत्येक पहिरन, झोला, वा घरको सजावटका सामानहरू समयसँगै झन् राम्रा हुँदै जाने गरी तयार पारिएका छन्।"
                : "We deliberately step away from the relentless churn of disposable synthetic fashion and unverified mass production. Every jacket, scarf, canvas pack, and home accessory in our catalog is engineered to withstand real daily wear, aging with a distinctive, beautiful patina."}
            </p>

            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-foreground">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>{isNepali ? "उत्पत्तिस्थलबाटै संकलित" : "Direct Provenance"}</strong> —{" "}
                  {isNepali
                    ? "कुनै बिचौलिया बिना सीधै वास्तविक कालिगड र कृषकहरूबाट।"
                    : "Zero counterfeit risk, zero middlemen markup, fully traceable materials."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>{isNepali ? "नेपालको भूगोलमा परीक्षण" : "Trail & Weather Tested"}</strong> —{" "}
                  {isNepali
                    ? "तराईको गर्मीदेखि हिमालको चिसो र बर्खामा भरपर्दो।"
                    : "Rigorously proven across Nepal's diverse climates, from Annapurna trails to valley cafes."}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  <strong>{isNepali ? "स्थायी मर्मत र सहयोग" : "Lifetime Care Commitment"}</strong> —{" "}
                  {isNepali
                    ? "सामानको दीर्घायुको लागि आवश्यक स्याहार र सल्लाह।"
                    : "Dedicated care guidance and exchange assurance for every cherished piece."}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. Core Values: The 4 Guiding Pillars */}
      <section className="container-page">
        <div className="text-center md:text-left">
          <p className="eyebrow text-accent font-semibold tracking-wider">
            {isNepali ? "हाम्रा आधारभूत सिद्धान्तहरू" : "Our Guiding Pillars"}
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl text-foreground">
            {isNepali ? "हामी जे गर्छौं, किन गर्छौं?" : "What We Stand For"}
          </h2>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-foreground">
              {isNepali ? "शुद्ध हिमाली स्रोत" : "Pure Himalayan Provenance"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isNepali
                ? "मुस्ताङको च्याङ्ग्रा पश्मिना, इलामको अर्गानिक अर्थोडक्स चिया, र पाल्पाको हातले बुनेको ढाका सुती।"
                : "Cruelty-free Chyangra pashmina combed in Mustang, organic high-altitude tea from Ilam, and hand-loomed Palpali Dhaka cotton."}
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-foreground">
              {isNepali ? "न्यायपूर्ण श्रम र सम्मान" : "Fair Artisan Trade"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isNepali
                ? "पाटन, भक्तपुर र ग्रामीण भेगका सीपकर्मीहरूसँग सिधा साझेदारी, सुरक्षित कार्यस्थल र मर्यादित पारिश्रमिक।"
                : "Direct guild partnerships across Patan, Bhaktapur, and rural hubs ensuring dignified labor conditions, prompt payouts, and ethical trade."}
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-foreground">
              {isNepali ? "हिमालदेखि शहरसम्म उपयोगी" : "Built for Trail & City"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isNepali
                ? "अन्नपूर्ण पदमार्गको कडा हावापानीमा पनि खरो उत्रने र काठमाडौंका क्याफेहरूमा पनि सुहाउने डिजाइन।"
                : "Rugged enough to handle heavy Himalayan rains and mountain winds, yet elegantly tailored for modern everyday urban life."}
            </p>
          </div>

          <div className="group rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Truck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-semibold text-lg text-foreground">
              {isNepali ? "७७ वटै जिल्लामा पहुँच" : "77 District Accessibility"}
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {isNepali
                ? "इ-कमर्स चक्रपथभित्र मात्र सीमित हुनुहुँदैन। विश्वसनीय डेलिभरी र क्यास अन डेलिभरी नेपालभर उपलब्ध छ।"
                : "E-commerce shouldn't stop at the Ring Road. Reliable courier partners dispatch inspect-before-pay COD parcels across every province."}
            </p>
          </div>
        </div>
      </section>

      {/* 7. Craft Traditions Gallery Showcase */}
      <section className="container-page">
        <div className="text-center md:text-left mb-8">
          <p className="eyebrow text-accent font-semibold tracking-wider">
            {isNepali ? "हाम्रा विशिष्ट उत्पादन क्षेत्रहरू" : "Signature Craft Ateliers"}
          </p>
          <h2 className="mt-1 font-display text-3xl sm:text-4xl text-foreground">
            {isNepali ? "नेपालको भूगोल र सीपको संगम" : "Treasures From Across Nepal"}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 sm:gap-6">
          <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src="/assets/products/ceramic-vase.jpg"
              alt="Bhaktapur Earthen Ceramics"
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {isNepali ? "भक्तपुर" : "Bhaktapur"}
              </p>
              <p className="font-display text-sm sm:text-base font-medium">
                {isNepali ? "टेराकोटा सेरामिक्स" : "Terracotta Ceramics"}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src="/assets/products/pashmina-shawl.jpg"
              alt="Mustang Chyangra Pashmina"
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {isNepali ? "मुस्ताङ" : "Mustang Plateau"}
              </p>
              <p className="font-display text-sm sm:text-base font-medium">
                {isNepali ? "च्याङ्ग्रा पश्मिना" : "Chyangra Pashmina"}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src="/assets/products/cotton-throw.jpg"
              alt="Palpali Handloom Dhaka"
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {isNepali ? "पाल्पा" : "Palpa Hills"}
              </p>
              <p className="font-display text-sm sm:text-base font-medium">
                {isNepali ? "हातले बुनेको ढाका" : "Handwoven Dhaka"}
              </p>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm">
            <img
              src="/assets/products/brass-lamp.jpg"
              alt="Patan Repousse Brass"
              className="aspect-[3/4] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                {isNepali ? "पाटन" : "Patan Valley"}
              </p>
              <p className="font-display text-sm sm:text-base font-medium">
                {isNepali ? "काँस र तामाका कलाकृति" : "Repoussé Metalwork"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Founder Commitment & Interactive CTA Box */}
      <section className="container-page">
        <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 md:p-16 shadow-xl">
          {/* Subtle Ambient Background Accents */}
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-foreground/90 backdrop-blur-sm">
              <Award className="h-3.5 w-3.5" />
              {isNepali ? "हाम्रो प्रतिबद्धता" : "The DOVAN Promise"}
            </span>

            <blockquote className="font-display text-2xl sm:text-3xl md:text-4xl font-normal leading-relaxed text-primary-foreground">
              {isNepali
                ? '"गुणस्तर भनेको तपाईंले हरेक दिन लगाउने र प्रयोग गर्ने वस्तु पछाडिका मानवीय हातहरूलाई सम्झनु हो। दोभान नेपाली सीपकर्मीहरूको सम्मान गर्न र उनीहरूको उत्कृष्ट सिर्जना तपाईंको ढोकासम्म पुर्‍याउन समर्पित छ।"'
                : '"Quality is remembering the human hands behind what you wear and use every day. DOVAN exists to celebrate Nepali craftspeople and bring their finest works to your doorstep."'}
            </blockquote>

            <p className="text-sm font-semibold uppercase tracking-wider text-primary-foreground/80">
              {isNepali ? "— दोभान कलेक्टिभ, काठमाडौं, नेपाल" : "— The DOVAN Collective, Kathmandu, Nepal"}
            </p>

            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md font-medium text-sm"
                asChild
              >
                <Link to="/shop">
                  {isNepali ? "कलेक्सन हेर्नुहोस्" : "Explore The Collection"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/20 text-sm"
                asChild
              >
                <Link to="/stores">
                  <MapPin className="mr-2 h-4 w-4" />
                  {isNepali ? "हाम्रा स्टोरहरू" : "Visit Our Stores"}
                </Link>
              </Button>

              <Button
                size="lg"
                variant="ghost"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 text-sm"
                asChild
              >
                <Link to="/faq">
                  {isNepali ? "प्रायः सोधिने प्रश्नहरू" : "Read FAQs"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}