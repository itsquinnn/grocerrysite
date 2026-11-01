import { createFileRoute, notFound, Link, useParams } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

type Section = { heading: string; paragraphs?: string[]; items?: string[] };
type PolicyPage = { title: string; intro: string; updated: string; sections: Section[] };

const UPDATED = "November 2026";
const UPDATED_NE = "मंसिर २०८३";

const PAGES_NE: Record<string, PolicyPage> = {
  shipping: {
    title: "ढुवानी र डेलिभरी नीति",
    intro: "हामी विश्वसनीय कुरियर साझेदारहरू मार्फत नेपालका सबै ७७ जिल्लामा सामान पुर्‍याउँछौं।",
    updated: UPDATED_NE,
    sections: [
      {
        heading: "डेलिभरी विकल्पहरू",
        items: [
          "साधारण डेलिभरी: रु. १५०, रु. ५,००० भन्दा माथिको अर्डरमा निःशुल्क। साधारणतया ३ देखि ६ कार्यदिन।",
          "द्रुत डेलिभरी: रु. २५०। काठमाडौं उपत्यका, पोखरा, चितवन, विराटनगर, बुटवल र वीरगन्जमा १–२ कार्यदिन।",
          "दुर्गम पहाडी तथा हिमाली जिल्लाहरूमा बाटो र मौसमको अवस्था हेरी ७ देखि १० दिन लाग्न सक्छ।",
        ],
      },
      {
        heading: "अर्डर प्रशोधन",
        paragraphs: [
          "कार्यदिनमा दिउँसो २ बजे अगाडि गरिएका अर्डरहरू सोही दिन प्याक गरिन्छ। बिदा वा ढिला गरिएका अर्डर अर्को कार्यदिनमा प्रशोधन हुन्छन्।",
          "प्रि-अर्डर र माग अनुसार बन्ने सामानहरूको डेलिभरी समय उत्पादन पृष्ठमा उल्लेख हुन्छ।",
        ],
      },
      {
        heading: "अर्डर ट्र्याकिङ",
        paragraphs: [
          "तपाईंको सामान पठाइएपछि ट्र्याकिङ नम्बरसहित सूचना प्राप्त हुनेछ। तपाईं आफ्नो खाताबाट जुनसुकै बेला स्थिति हेर्न सक्नुहुन्छ।",
        ],
      },
      {
        heading: "डेलिभरी प्रयासहरू",
        items: [
          "डेलिभरी अगाडि कुरियरले तपाईंलाई फोन गर्नेछन्। कृपया आफ्नो फोन चालु राख्नुहोला।",
          "उपलब्ध नभएमा कुरियरले थप २ पटकसम्म प्रयास गर्नेछ।",
          "३ पटकसम्म पनि सामान लिन नसकिएमा सामान फिर्ता हुनेछ।",
        ],
      },
      {
        heading: "पार्सलको जाँच",
        paragraphs: [
          "सामान बुझ्नु अघि बाहिरी प्याकेट जाँच गर्नुहोस्। च्यातिएको वा भिजेको पाइएमा लिन अस्वीकार गरी २४ घण्टाभित्र हामीलाई फोटोसहित सम्पर्क गर्नुहोस्।",
        ],
      },
      {
        heading: "ढिलाइ",
        paragraphs: [
          "चाडपर्व, बन्द-हड्ताल, पहिरो वा प्रतिकूल मौसमका कारण डेलिभरीमा केही ढिलाइ हुन सक्छ। त्यस्तो अवस्थामा हामी अग्रिम जानकारी गराउनेछौं।",
        ],
      },
    ],
  },

  returns: {
    title: "फिर्ता र रकम फिर्ता (रिफन्ड)",
    intro: "प्रयोग नगरिएका र सक्कली प्याकेजिङमा रहेका सामानहरू डेलिभरी भएको ७ दिनभित्र फिर्ता गर्न सकिन्छ।",
    updated: UPDATED_NE,
    sections: [
      {
        heading: "फिर्ता प्रक्रिया कसरी सुरु गर्ने",
        items: [
          "आफ्नो खाताको अर्डर पृष्ठमा जानुहोस् र 'सामान फिर्ता अनुरोध' रोज्नुहोस्।",
          "सामान छान्नुहोस्, कारण खुलाउनुहोस् र बिग्रिएको भए स्पष्ट तस्बिर अपलोड गर्नुहोस्।",
          "हाम्रो टोलीले २ कार्यदिनभित्र जाँच गरी पिकअप वा ड्रप-अफको जानकारी दिनेछ।",
        ],
      },
      {
        heading: "फिर्ता योग्य सर्तहरू",
        items: [
          "सामान प्रयोग नगरिएको, नधोइएको र सक्कली ट्याग तथा बक्स सुरक्षित भएको हुनुपर्छ।",
          "सामान बिग्रिएको, त्रुटिपूर्ण वा मगाएको भन्दा फरक परेको हुनुपर्छ।",
          "सामान प्राप्त भएको ७ दिनभित्र अनुरोध दर्ता हुनुपर्छ।",
        ],
      },
      {
        heading: "फिर्ता नहुने सामानहरू",
        items: [
          "सौन्दर्य तथा व्यक्तिगत हेरचाहका खोलिएका उत्पादनहरू (स्वास्थ्य र स्वच्छताको कारण)।",
          "भित्री वस्त्र, स्विमवेयर र मोजा।",
          "उपहार कार्ड र अन्तिम बिक्री (क्लियरेन्स) का सामानहरू।",
        ],
      },
      {
        heading: "रकम फिर्ता (रिफन्ड)",
        paragraphs: [
          "सामान प्राप्त भई जाँच सकिएपछि क्यास अन डेलिभरीका अर्डरहरूको रकम ५ कार्यदिनभित्र बैंक वा डिजिटल वालेटमा फिर्ता गरिन्छ।",
          "अनलाइन भुक्तानी गरिएका अर्डरको रकम सोही भुक्तानी माध्यममै फिर्ता पठाइन्छ।",
          "हाम्रो गल्तीले गर्दा फिर्ता गर्नु परेमा ढुवानी शुल्क समेत फिर्ता गरिन्छ।",
        ],
      },
      {
        heading: "साटफेर (एक्सचेन्ज)",
        paragraphs: [
          "यदि तपाईंलाई फरक साइज वा रङ चाहिएमा फिर्ता अनुरोध गरी नयाँ अर्डर गर्नुहोस्। यो सबैभन्दा छिटो उपाय हो।",
        ],
      },
      {
        heading: "अर्डर रद्द गर्ने",
        paragraphs: [
          "सामान ढुवानीमा निस्कनु अघि खाता पृष्ठबाट जुनसुकै बेला अर्डर रद्द गर्न सकिन्छ। पठाइसकिएको भए डेलिभरी अस्वीकार गर्न सक्नुहुन्छ।",
        ],
      },
    ],
  },

  terms: {
    title: "नियम तथा सर्तहरू",
    intro: "दोभान प्रयोग गरेर तपाईं यी नियम तथा सर्तहरूमा सहमत हुनुहुन्छ। मूल्य र अफरहरू बिना पूर्वसूचना परिवर्तन हुन सक्छन्।",
    updated: UPDATED_NE,
    sections: [
      {
        heading: "तपाईंको खाता",
        items: [
          "तपाईंले सही विवरण दिनुपर्छ र आफ्नो पासवर्ड गोप्य राख्नुपर्छ।",
          "तपाईंको खाताबाट हुने सबै गतिविधिका लागि तपाईं स्वयं जिम्मेवार हुनुहुन्छ।",
          "दुरुपयोग वा शंकास्पद गतिविधि देखिएमा खाता निलम्बन हुन सक्छ।",
        ],
      },
      {
        heading: "अर्डरहरू",
        paragraphs: [
          "अर्डर नम्बर प्राप्त भएपछि मात्र अर्डर पुष्टि मानिन्छ। मूल्यमा गल्ती वा स्टक अभाव भएमा अर्डर रद्द गरी रकम फिर्ता गरिनेछ।",
        ],
      },
      {
        heading: "मूल्य र भुक्तानी",
        items: [
          "सबै मूल्यहरू नेपाली रुपैयाँ (रु.) मा छन् र कर समावेश गरिएको छ।",
          "हामी क्यास अन डेलिभरी, ईसेवा, खल्ती र फोनपे स्वीकार गर्दछौं।",
          "उत्पादनका तस्बिरहरू चित्रणका लागि मात्र हुन्। स्क्रिन अनुसार रङ केही फरक देखिन सक्छ।",
        ],
      },
      {
        heading: "कुपन र छुट अफरहरू",
        paragraphs: [
          "कुपनहरू नगदमा साट्न पाइँदैन र प्रति अर्डर एउटा मात्र कुपन प्रयोग गर्न सकिन्छ। अफरहरू तोकिएको समय वा स्टक रहुन्जेल मात्र मान्य हुन्छन्।",
        ],
      },
      {
        heading: "स्वीकार्य प्रयोग",
        items: [
          "गैरकानूनी वा प्लेटफर्मलाई असर पर्ने गतिविधि नगर्नुहोस्।",
          "लिखित अनुमति बिना सामग्री कपी वा पुनः बिक्री गर्न पाइने छैन।",
          "समीक्षाहरू निष्पक्ष, भ्रामक नभएको र मर्यादित हुनुपर्छ।",
        ],
      },
      {
        heading: "बौद्धिक सम्पत्ति",
        paragraphs: [
          "दोभानमा रहेका लोगो, तस्बिर र डिजाइनहरू हाम्रो वा ब्रान्ड साझेदारहरूको सम्पत्ति हुन्।",
        ],
      },
      {
        heading: "दायित्वको सीमा",
        paragraphs: [
          "कुनै पनि अर्डरमा हाम्रो अधिकतम दायित्व तपाईंले तिर्नुभएको रकमसम्म मात्र सीमित रहनेछ।",
        ],
      },
      {
        heading: "लागु हुने कानुन",
        paragraphs: [
          "यी नियम तथा सर्तहरू नेपालको प्रचलित कानुन बमोजिम निर्देशित र व्याख्या गरिनेछन्।",
        ],
      },
    ],
  },

  privacy: {
    title: "गोपनीयता नीति",
    intro: "हामी केवल तपाईंको अर्डर प्रशोधन गर्न र सेवा सुधार गर्न आवश्यक विवरण मात्र संकलन गर्छौं।",
    updated: UPDATED_NE,
    sections: [
      {
        heading: "हामीले संकलन गर्ने जानकारी",
        items: [
          "खाता विवरण: नाम, इमेल, फोन नम्बर र पासवर्ड।",
          "डेलिभरी विवरण: ठेगाना र डेलिभरी निर्देशन।",
          "अर्डर इतिहास, इच्छासूची र ग्राहक सेवा संवाद।",
          "साइटलाई सुरक्षित र चुस्त राख्न प्रयोग गरिने आधारभूत प्राविधिक विवरण।",
        ],
      },
      {
        heading: "हामी विवरण कसरी प्रयोग गर्छौं",
        items: [
          "तपाईंको अर्डर सुरक्षित रूपमा घरसम्म पुर्‍याउन र ग्राहक सेवा दिन।",
          "अर्डर सम्बन्धी जानकारी तथा अफरहरू पठाउन (इच्छा अनुसार)।",
          "धोखाधडी रोक्न र प्लेटफर्म सुरक्षित राख्न।",
        ],
      },
      {
        heading: "भुक्तानी र सुरक्षा",
        paragraphs: [
          "पासवर्डहरू कहिल्यै खुला रूपमा राखिँदैन। हामी तपाईंको कार्ड नम्बरहरू सुरक्षित राख्दैनौं; भुक्तानी प्रत्यक्ष गेटवेबाट हुन्छ।",
          "हामी उच्च स्तरको डिजिटल सुरक्षा मापदण्ड अपनाउँछौं।",
        ],
      },
      {
        heading: "विवरणको साझेदारी",
        paragraphs: [
          "हामी तपाईंको व्यक्तिगत विवरण कसैलाई बिक्री गर्दैनौं। डेलिभरी साझेदारलाई सामान पुर्‍याउन आवश्यक नाम, फोन र ठेगाना मात्र दिइन्छ।",
        ],
      },
      {
        heading: "कुकीहरू (Cookies)",
        paragraphs: [
          "लगइन कायम राख्न र कार्ट सम्झन हामी कुकीज प्रयोग गर्छौं। तपाईं आफ्नो ब्राउजरमा कुकीज बन्द गर्न सक्नुहुन्छ।",
        ],
      },
      {
        heading: "तपाईंको अधिकार",
        items: [
          "आफ्नो खाताबाट जुनसुकै बेला व्यक्तिगत विवरण सच्याउन सक्नुहुन्छ।",
          "मार्केटिङ इमेलहरू कुनै पनि बेला बन्द गर्न सक्नुहुन्छ।",
          "आफ्नो विवरण हटाउन ग्राहक सेवामा अनुरोध गर्न सक्नुहुन्छ।",
        ],
      },
    ],
  },
};

const PAGES: Record<string, PolicyPage> = {
  shipping: {
    title: "Shipping & delivery",
    intro: "We deliver to all 77 districts of Nepal through trusted courier partners.",
    updated: UPDATED,
    sections: [
      {
        heading: "Delivery options",
        items: [
          "Standard delivery: Rs. 150, free on orders above Rs. 5,000 after discounts. Typically 3–6 working days.",
          "Express delivery: Rs. 250. 1–2 working days in Kathmandu valley, Pokhara, Chitwan, Biratnagar, Butwal and Birgunj.",
          "Remote districts may take 7–10 working days depending on road and weather conditions.",
        ],
      },
      {
        heading: "Order processing",
        paragraphs: [
          "Orders placed before 2 PM on working days are usually packed the same day. Orders placed later, on weekends or on public holidays are processed on the next working day.",
          "Pre-order and made-to-order items show their own dispatch time on the product page.",
        ],
      },
      {
        heading: "Tracking your order",
        paragraphs: [
          "You'll receive a notification when your order ships, along with a tracking number when available. You can also check the status any time from the order page in your account.",
        ],
      },
      {
        heading: "Delivery attempts",
        items: [
          "Our courier will call you before delivery. Please keep your phone reachable.",
          "If you are unavailable, the courier will make up to 2 more attempts.",
          "After 3 failed attempts the parcel is returned to us. Repeated failed cash-on-delivery orders may lead to prepayment being required on future orders.",
        ],
      },
      {
        heading: "Checking your parcel",
        paragraphs: [
          "Please check the outer packaging before accepting. If it is torn, wet or tampered with, refuse the parcel or note it with the courier and contact us within 24 hours with photos.",
        ],
      },
      {
        heading: "Delays",
        paragraphs: [
          "Festivals, strikes, landslides and bad weather can delay deliveries. We will notify you if your order is significantly delayed.",
        ],
      },
    ],
  },

  returns: {
    title: "Returns & refunds",
    intro: "Unused items in original packaging may be returned within 7 days of delivery.",
    updated: UPDATED,
    sections: [
      {
        heading: "How to request a return",
        items: [
          "Open the order page in your account and choose “Request return”.",
          "Select the item, give a reason and upload clear photos if the item is damaged or wrong.",
          "Our team reviews requests within 2 working days and will confirm pickup or drop-off details.",
        ],
      },
      {
        heading: "Eligible returns",
        items: [
          "Item is unused, unwashed and has original tags, packaging and accessories.",
          "Item arrived damaged, defective or different from what you ordered.",
          "Request is raised within 7 days of delivery.",
        ],
      },
      {
        heading: "Non-returnable items",
        items: [
          "Beauty and personal care products that have been opened, for hygiene reasons.",
          "Innerwear, swimwear and socks.",
          "Gift cards and items marked final sale.",
          "Items damaged through misuse or normal wear.",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Once the item is received and inspected, refunds for cash-on-delivery orders are made by bank transfer or wallet within 5 working days.",
          "Prepaid orders are refunded to the original payment method. Banks and wallets may take a few extra days to show the amount.",
          "Shipping fees are refunded only if the return is due to our error, such as a damaged or wrong item.",
        ],
      },
      {
        heading: "Exchanges",
        paragraphs: [
          "If you need a different size or colour, request a return and place a new order for the item you want. This is the fastest way to make sure it stays in stock for you.",
        ],
      },
      {
        heading: "Cancellations",
        paragraphs: [
          "Orders can be cancelled before they are shipped from your account page. Once shipped, please refuse delivery or use the return process.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms & conditions",
    intro: "By using DOVAN you agree to these terms. Prices, availability and offers may change without notice.",
    updated: UPDATED,
    sections: [
      {
        heading: "Your account",
        items: [
          "You must provide accurate details and keep your password confidential.",
          "You are responsible for all activity under your account.",
          "We may suspend accounts that show fraudulent or abusive behaviour.",
        ],
      },
      {
        heading: "Orders",
        paragraphs: [
          "An order is confirmed only once you receive an order number. We may cancel orders affected by pricing errors, stock issues or suspected fraud and will notify you, with a full refund for any payment made.",
        ],
      },
      {
        heading: "Pricing and payment",
        items: [
          "All prices are in Nepali rupees (NPR) and include applicable taxes unless stated otherwise.",
          "We accept cash on delivery and the digital payment methods shown at checkout.",
          "Product images are for illustration. Colours may vary slightly by screen.",
        ],
      },
      {
        heading: "Coupons and offers",
        paragraphs: [
          "Coupons cannot be exchanged for cash and only one coupon may be used per order. Offers are valid for the stated period or while stock lasts, and we may withdraw them if misused.",
        ],
      },
      {
        heading: "Acceptable use",
        items: [
          "Do not use the site for unlawful purposes or to interfere with its operation.",
          "Do not scrape, copy or resell our content without written permission.",
          "Reviews must be honest and free of offensive or misleading content.",
        ],
      },
      {
        heading: "Intellectual property",
        paragraphs: [
          "Logos, text, images and designs on DOVAN belong to us or our brand partners and may not be used without permission.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "To the extent allowed by law, DOVAN is not liable for indirect or consequential losses. Our liability for any order is limited to the amount you paid for it.",
        ],
      },
      {
        heading: "Changes and governing law",
        paragraphs: [
          "We may update these terms from time to time. Continued use of the site means you accept the updated terms. These terms are governed by the laws of Nepal.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy policy",
    intro: "We collect only the information needed to process your orders and improve your experience.",
    updated: UPDATED,
    sections: [
      {
        heading: "Information we collect",
        items: [
          "Account details: name, email, phone number and password.",
          "Delivery details: addresses and delivery instructions.",
          "Order history, wishlist and support conversations.",
          "Basic device and usage data, such as browser type and pages visited, to keep the site working well.",
        ],
      },
      {
        heading: "How we use it",
        items: [
          "To process, deliver and support your orders.",
          "To send order updates and, if you opt in, offers and news.",
          "To prevent fraud and keep the platform secure.",
          "To improve our products, site and service.",
        ],
      },
      {
        heading: "Payments and security",
        paragraphs: [
          "Passwords are never stored in readable form. We never store card numbers. Payments are handled by the payment provider you choose at checkout.",
          "We use industry-standard safeguards, but no online service can promise perfect security. Please use a strong, unique password.",
        ],
      },
      {
        heading: "Sharing your data",
        paragraphs: [
          "We do not sell your personal data. Delivery partners receive only what's required to deliver your order, such as your name, phone number and address. We may share data when required by law.",
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We use cookies and similar technologies to keep you signed in, remember your cart and understand how the site is used. You can block cookies in your browser, but some features may stop working.",
        ],
      },
      {
        heading: "Data retention",
        paragraphs: [
          "We keep your data while your account is active and as long as needed for orders, returns, tax and legal records.",
        ],
      },
      {
        heading: "Your choices",
        items: [
          "Update your details from your account at any time.",
          "Unsubscribe from marketing messages using the link in any message.",
          "Request a copy or deletion of your data by contacting support.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "DOVAN is not intended for children under 16 and we do not knowingly collect their data.",
        ],
      },
    ],
  },
};

export const Route = createFileRoute("/policies/$page")({
  loader: ({ params }) => {
    const p = PAGES[params.page];
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
        { title: `${loaderData.title} — DOVAN` },
        { name: "description", content: loaderData.intro },
        { property: "og:title", content: `${loaderData.title} — DOVAN` },
        { property: "og:description", content: loaderData.intro },
      ]
      : [{ title: "Unavailable — DOVAN" }, { name: "robots", content: "noindex" }],
  }),
  component: Policy,
});

function Policy() {
  const pEn = Route.useLoaderData();
  const { page } = useParams({ from: "/policies/$page" });
  const { isNepali } = useI18n();

  const p = (isNepali && PAGES_NE[page]) ? PAGES_NE[page] : pEn;

  return (
    <article className="container-page max-w-3xl py-8 md:py-10">
      <h1 className="text-4xl">{p.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isNepali ? "पछिल्लो अद्यावधिक:" : "Last updated:"} {p.updated}
      </p>
      <p className="mt-6 text-lg leading-relaxed">{p.intro}</p>

      <div className="mt-8 space-y-8">
        {p.sections.map((s) => (
          <section key={s.heading}>
            <h2 className="text-xl font-semibold">{s.heading}</h2>
            <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
              {s.paragraphs?.map((t) => <p key={t}>{t}</p>)}
              {s.items && (
                <ul className="list-disc space-y-2 pl-5">
                  {s.items.map((i) => <li key={i}>{i}</li>)}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        {isNepali ? (
          <>
            जिज्ञासा वा समस्या छ? <Link to="/support" className="underline font-medium text-foreground">ग्राहक सेवा टोलीलाई सम्पर्क गर्नुहोस्</Link>।
          </>
        ) : (
          <>
            Questions? <Link to="/support" className="underline font-medium text-foreground">Contact our support team</Link>.
          </>
        )}
      </p>
    </article>
  );
}