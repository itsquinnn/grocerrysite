import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Truck, ShieldCheck, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story - DOVAN" },
      {
        name: "description",
        content:
          "Learn about DOVAN (दोभान): the confluence of Nepali craftsmanship and contemporary living. Delivering across all 77 districts with Cash on Delivery.",
      },
      { property: "og:title", content: "Our Story - DOVAN" },
      {
        property: "og:description",
        content:
          "Discover the story of DOVAN: where Himalayan artisan heritage meets everyday utility.",
      },
    ],
  }),
  component: AboutPage,
});

export function AboutPage() {
  const { isNepali } = useI18n();

  return (
    <div className="py-5 sm:py-7 space-y-8 sm:space-y-10">
      {/* 1. Hero / Header Manifesto */}
      <section className="container-page">
        <div className="max-w-3xl space-y-3">
          <p className="font-mono text-[11px] sm:text-xs uppercase tracking-widest text-muted-foreground">
            {isNepali ? "कम्पनी सङ्ग्रह / स्थापना २०२४" : "Company Archive / Est. 2024"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-foreground font-normal tracking-tight leading-[1.14]">
            {isNepali
              ? "स्थानीय नेपाली शिल्पकला र दैनिक उपयोगिताको संगम।"
              : "The confluence of local Nepali craft and everyday utility."}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-1">
            {isNepali
              ? "दुई नदीहरू मिसिएर बन्ने शक्तिशाली संगमलाई नेपालीमा 'दोभान' भनिन्छ। दोभानको स्थापना यही विचारबाट भएको हो: स्थानीय सीप, प्राकृतिक स्रोत र कालिगडप्रतिको गहिरो सम्मानका साथ बनेका गुणस्तरीय वस्तुहरूले हाम्रो दैनिक जीवनमा स्थायी मूल्य थप्छन्।"
              : "DOVAN (दोभान) draws its name from the Nepali word for the sacred confluence where two flowing rivers merge into a single, unified current. We bridge generational Nepali craftsmanship and daily essentials with transparent pricing, reliable logistics, and cash on delivery across all 77 districts."}
          </p>
        </div>
      </section>

      {/* 2. Visual Document - Confluence Photography */}
      <section className="container-page">
        <div className="border border-border/80 bg-muted/20">
          <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-muted">
            <img
              src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1800&q=85"
              alt="Himalayan mountain valley and river confluence in Nepal"
              className="h-full w-full object-cover object-center"
              loading="eager"
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border/70 px-4 py-3 font-mono text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-foreground/60 shrink-0" />
              <span>
                {isNepali
                  ? "त्रिशूली र मर्स्याङ्दी संगम क्षेत्र / हिमाली काख"
                  : "Marshyangdi & Trishuli Confluence / Himalayan Foothills"}
              </span>
            </div>
            <span className="text-foreground/75 font-medium">
              {isNepali ? "दोभान : दुई पवित्र नदीको मिलन" : "DOVAN : The Meeting of Two Waters"}
            </span>
          </div>
        </div>
      </section>

      {/* 3. Operational Figures Ledger */}
      <section className="container-page">
        <div className="border-y border-border/80 grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/70">
          <div className="p-4 sm:p-6 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              {isNepali ? "सूचक ०१ / क्षेत्र" : "Index 01 / Coverage"}
            </span>
            <p className="font-display text-3xl sm:text-4xl font-normal text-foreground">77</p>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {isNepali ? "जिल्लामा डेलिभरी" : "Districts Delivered"}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "झापादेखि दार्चुलासम्म घरदैलोमै सेवा" : "Cash on delivery from Jhapa to Darchula"}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              {isNepali ? "सूचक ०२ / साझेदार" : "Index 02 / Guilds"}
            </span>
            <p className="font-display text-3xl sm:text-4xl font-normal text-foreground">100+</p>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {isNepali ? "स्थानीय कालिगड साझेदार" : "Artisan Partners"}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "उचित पारिश्रमिक र बिचौलियामुक्त व्यापार" : "Direct guild pricing and living wages"}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              {isNepali ? "सूचक ०३ / भरोसा" : "Index 03 / Trust"}
            </span>
            <p className="font-display text-3xl sm:text-4xl font-normal text-foreground">100%</p>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {isNepali ? "हेरेर भुक्तानी (COD)" : "Cash on Delivery"}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "पार्सल जाँच गरेर मात्र भुक्तानी" : "Open-box inspection before payment"}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
              {isNepali ? "सूचक ०४ / मूल्याङ्कन" : "Index 04 / Reviews"}
            </span>
            <p className="font-display text-3xl sm:text-4xl font-normal text-foreground">4.9 / 5</p>
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {isNepali ? "ग्राहक सन्तुष्टि" : "Customer Satisfaction"}
            </p>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
              {isNepali ? "नेपालभरिका हजारौं ग्राहकहरूको विश्वास" : "Verified buyer reviews nationwide"}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Story Chapter 1: The Artisan Heritage */}
      <section className="container-page">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {isNepali ? "अध्याय ०१ / शिल्पकला" : "Chapter 01 / Craft Heritage"}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground font-normal leading-snug">
              {isNepali
                ? "पुस्ता-पुस्ताको ज्ञान र हातको जादू, हरेक सिर्जनामा।"
                : "Generational knowledge shaped by human hands in every piece."}
            </h2>
            <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
              <p>
                {isNepali
                  ? "भक्तपुरको पोटरी स्क्वायरका माटाका भाँडाहरूदेखि पाटनका काँस र तामाका धातु शिल्पीहरू, अनि मुस्ताङको उच्च हिमाली च्याङ्ग्रा पश्मिना कात्ने बुनकरहरूसम्म, दोभानका उत्पादनहरू मानवीय स्पर्श र आत्माले भरिएका छन्।"
                  : "From the traditional terracotta kilns of Bhaktapur's Pottery Square to master metal ateliers in Patan and mountain cooperatives in Mustang, every item in our catalog carries generations of craft technique."}
              </p>
              <p>
                {isNepali
                  ? "हामी बिचौलियाहरूको जालो हटाएर सीधै कालिगडहरूसँग साझेदारी गर्छौं, जसले गर्दा उनीहरूले आफ्नो सीपको उचित कदर र सम्मानजनक आम्दानी पाउँछन्।"
                  : "By working directly with artisan guilds and producer cooperatives, over 80% of production value remains directly with the families who create each piece."}
              </p>
            </div>

            <div className="border-l-2 border-foreground/30 pl-4 py-1">
              <blockquote className="font-display text-xs sm:text-sm italic text-foreground leading-relaxed">
                {isNepali
                  ? '"हाम्रा हातले बनाउने हरेक भाँडा र धागोमा हाम्रा पुर्खाको सीप र हाम्रो माटोको सुगन्ध मिसिएको हुन्छ।"'
                  : '"Every curve shaped by the wheel and every thread bound by the loom carries our ancestors’ practice and the quiet dignity of Nepali craft."'}
              </blockquote>
              <figcaption className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {isNepali ? "भक्तपुरका परम्परागत माटो शिल्पी" : "Master Craftsman, Bhaktapur Pottery Guild"}
              </figcaption>
            </div>
          </div>

          <div className="border border-border/80 bg-muted/20">
            <img
              src="https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=85"
              alt="Potter hands shaping terracotta clay on spinning wheel"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <div className="border-t border-border/70 p-3 font-mono text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{isNepali ? "भक्तपुर टेराकोटा" : "Bhaktapur Terracotta"}</span>
              <span>{isNepali ? "४ पुस्तादेखि निरन्तर" : "4th Generation Studio"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Story Chapter 2: The Material Standard */}
      <section className="container-page">
        <div className="grid items-center gap-8 md:grid-cols-2 lg:gap-12">
          <div className="order-2 md:order-1 border border-border/80 bg-muted/20">
            <img
              src="https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=85"
              alt="Artisan working on traditional wooden handloom"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <div className="border-t border-border/70 p-3 font-mono text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{isNepali ? "पाल्पाली ढाका र ऊन" : "Handloom Dhaka & Wool"}</span>
              <span>{isNepali ? "प्राकृतिक धागो र रङ" : "Natural Fibers & Dyes"}</span>
            </div>
          </div>

          <div className="order-1 md:order-2 space-y-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {isNepali ? "अध्याय ०२ / विचार र मान्यता" : "Chapter 02 / Material Standard"}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground font-normal leading-snug">
              {isNepali
                ? "छिट्टै फाल्ने होइन, वर्षौंसम्म साथ दिने वस्तुहरू।"
                : "Built for daily permanence, not seasonal disposal."}
            </h2>
            <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              {isNepali
                ? "हामी सस्तो, एकपटक प्रयोग गरेर फालिने प्लास्टिक र कमसल सामानहरूको विपरीत दिशामा हिंडिरहेका छौं। दोभानको प्रत्येक पहिरन, झोला, वा भान्छाका सामानहरू समयसँगै झन् उपयोगी हुँदै जाने गरी तयार पारिएका छन्।"
                : "We prioritize durable natural textiles, cruelty-free Himalayan wool, and regional agricultural staples over disposable synthetic goods. Every item is verified for daily resilience across Nepal's diverse geography."}
            </p>

            <dl className="border-t border-border/80 pt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  01
                </span>
                <div>
                  <dt className="font-semibold text-foreground inline">
                    {isNepali ? "उत्पत्तिस्थलबाटै संकलित: " : "Direct Provenance: "}
                  </dt>
                  <dd className="text-muted-foreground inline">
                    {isNepali
                      ? "कुनै बिचौलिया बिना सीधै वास्तविक कालिगड र कृषकहरूबाट।"
                      : "Direct partnerships with verified cooperatives and makers without broker markups."}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  02
                </span>
                <div>
                  <dt className="font-semibold text-foreground inline">
                    {isNepali ? "भूगोलमा परीक्षण: " : "Climate Proven: "}
                  </dt>
                  <dd className="text-muted-foreground inline">
                    {isNepali
                      ? "तराईको गर्मीदेखि हिमालको चिसो र बर्खामा भरपर्दो।"
                      : "Tested for high durability across Terai heat and Himalayan mountain cold."}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  03
                </span>
                <div>
                  <dt className="font-semibold text-foreground inline">
                    {isNepali ? "विश्वसनीय सहयोग: " : "Exchange Assurance: "}
                  </dt>
                  <dd className="text-muted-foreground inline">
                    {isNepali
                      ? "सामानको दीर्घायुको लागि आवश्यक स्याहार र सल्लाह।"
                      : "Straightforward exchange assurance and care guidance on all items."}
                  </dd>
                </div>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* 6. Signature Craft Ateliers Grid */}
      <section className="container-page">
        <div className="mb-6 space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {isNepali ? "सङ्ग्रह ०३ / उत्पादन क्षेत्रहरू" : "Archive 03 / Production Regions"}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl text-foreground font-normal">
            {isNepali ? "नेपालको भूगोल र सीपको संगम" : "Regional Craft Guilds"}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <article className="border border-border/80 bg-muted/20 flex flex-col">
            <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
              <img
                src="/assets/products/ceramic-vase.jpg"
                alt="Bhaktapur Earthen Ceramics"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
              />
            </div>
            <div className="p-3 border-t border-border/70 space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                {isNepali ? "भक्तपुर" : "Bhaktapur"}
              </span>
              <h3 className="font-display text-xs sm:text-sm font-medium text-foreground">
                {isNepali ? "टेराकोटा सेरामिक्स" : "Terracotta Ceramics"}
              </h3>
            </div>
          </article>

          <article className="border border-border/80 bg-muted/20 flex flex-col">
            <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
              <img
                src="/assets/products/pashmina-shawl.jpg"
                alt="Mustang Chyangra Pashmina"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
              />
            </div>
            <div className="p-3 border-t border-border/70 space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                {isNepali ? "मुस्ताङ" : "Mustang Plateau"}
              </span>
              <h3 className="font-display text-xs sm:text-sm font-medium text-foreground">
                {isNepali ? "च्याङ्ग्रा पश्मिना" : "Chyangra Pashmina"}
              </h3>
            </div>
          </article>

          <article className="border border-border/80 bg-muted/20 flex flex-col">
            <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
              <img
                src="/assets/products/cotton-throw.jpg"
                alt="Palpali Handloom Dhaka"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
              />
            </div>
            <div className="p-3 border-t border-border/70 space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                {isNepali ? "पाल्पा" : "Palpa Hills"}
              </span>
              <h3 className="font-display text-xs sm:text-sm font-medium text-foreground">
                {isNepali ? "हातले बुनेको ढाका" : "Handwoven Dhaka"}
              </h3>
            </div>
          </article>

          <article className="border border-border/80 bg-muted/20 flex flex-col">
            <div className="aspect-[3/4] w-full overflow-hidden bg-muted">
              <img
                src="/assets/products/brass-lamp.jpg"
                alt="Patan Repousse Brass"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
              />
            </div>
            <div className="p-3 border-t border-border/70 space-y-0.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block">
                {isNepali ? "पाटन" : "Patan Valley"}
              </span>
              <h3 className="font-display text-xs sm:text-sm font-medium text-foreground">
                {isNepali ? "काँस र तामाका कलाकृति" : "Repoussé Metalwork"}
              </h3>
            </div>
          </article>
        </div>
      </section>

      {/* 7. Guiding Principles Ledger */}
      <section className="container-page">
        <div className="border border-border/80 p-5 sm:p-8">
          <div className="mb-6 space-y-1">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {isNepali ? "सञ्चालन सिद्धान्त" : "Operating Ledger"}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl text-foreground font-normal">
              {isNepali ? "हाम्रा आधारभूत मान्यताहरू" : "Core Operating Principles"}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="space-y-1.5">
              <span className="font-mono text-xs text-muted-foreground block">01</span>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                {isNepali ? "शुद्ध स्रोत" : "Direct Provenance"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isNepali
                  ? "मुस्ताङको पश्मिना, इलामको अर्थोडक्स चिया, र पाल्पाको ढाका सीधा उत्पत्तिस्थलबाट।"
                  : "Mustang pashmina, Ilam orthodox tea, and Palpali cotton directly from certified sources."}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-xs text-muted-foreground block">02</span>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                {isNepali ? "न्यायपूर्ण श्रम" : "Artisan Guild Trade"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isNepali
                  ? "पाटन र भक्तपुरका सीपकर्मीहरूसँग सिधा साझेदारी, सुरक्षित कार्यस्थल र उचित आम्दानी।"
                  : "Direct partnerships ensuring prompt payouts, living wages, and no middleman broker cuts."}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-xs text-muted-foreground block">03</span>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                {isNepali ? "भौगोलिक पहुँच" : "77 Districts Access"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isNepali
                  ? "काठमाडौं उपत्यका बाहिरका सहर र ग्रामीण भेगसम्म समान ढुवानी र विश्वसनीय सेवा।"
                  : "Consistent delivery reach across provincial hubs and rural routes nationwide."}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-mono text-xs text-muted-foreground block">04</span>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">
                {isNepali ? "विश्वसनीय भुक्तानी" : "Inspect Before Pay"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {isNepali
                  ? "क्यास अन डेलिभरीमा सामान हातमा परेपछि मात्र ढुक्क भएर भुक्तानी गर्नुहोस्।"
                  : "Transparent Cash on Delivery allowing customers to examine orders upon arrival."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Call to Action / Company Footer Note */}
      <section className="container-page pb-4">
        <div className="border border-border/80 bg-muted/20 p-6 sm:p-8 md:p-10">
          <div className="max-w-2xl space-y-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground block">
              {isNepali ? "प्रतिबद्धता" : "Commitment"}
            </span>

            <blockquote className="font-display text-xl sm:text-2xl md:text-3xl font-normal leading-snug text-foreground">
              {isNepali
                ? '"गुणस्तर भनेको तपाईंले हरेक दिन प्रयोग गर्ने वस्तु पछाडिका मानवीय हातहरूलाई सम्झनु हो। दोभान नेपाली सीपकर्मीहरूको सम्मान गर्न र उनीहरूको उत्कृष्ट सिर्जना तपाईंको ढोकासम्म पुर्‍याउन समर्पित छ।"'
                : '"Quality is remembering the human hands behind what you use every day. DOVAN exists to celebrate Nepali craftspeople and bring their finest works to your doorstep."'}
            </blockquote>

            <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {isNepali ? "दोभान कलेक्टिभ, काठमाडौं, नेपाल" : "The DOVAN Collective, Kathmandu, Nepal"}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/shop"
                className="h-10 px-5 text-xs sm:text-sm font-medium bg-foreground text-background border border-foreground hover:bg-foreground/90 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{isNepali ? "कलेक्सन हेर्नुहोस्" : "Explore Collection"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <Link
                to="/stores"
                className="h-10 px-5 text-xs sm:text-sm font-medium bg-background text-foreground border border-border/80 hover:border-foreground hover:bg-muted/30 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Truck className="h-3.5 w-3.5" />
                <span>{isNepali ? "७७ जिल्ला कभरेज" : "77 Districts Coverage"}</span>
              </Link>

              <Link
                to="/faq"
                className="h-10 px-4 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center cursor-pointer"
              >
                <span>{isNepali ? "प्रायः सोधिने प्रश्नहरू" : "Read FAQs"}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
