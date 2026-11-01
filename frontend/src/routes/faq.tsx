import { createFileRoute, Link } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Frequently asked questions — DOVAN" },
      { name: "description", content: "Answers about delivery, cash on delivery, returns, coupons and your DOVAN account." },
      { property: "og:title", content: "FAQ — DOVAN" },
      { property: "og:description", content: "Answers about delivery, payment, returns and accounts." },
    ],
  }),
  component: Faq,
});

const FAQ_EN = [
  ["Where do you deliver?", "All 77 districts of Nepal. Major cities get express 1–2 day delivery; elsewhere 3–6 days."],
  ["How much is shipping?", "Standard delivery is Rs. 150 and free on orders over Rs. 5,000 after discounts. Express is Rs. 250."],
  ["How do I pay?", "Cash on delivery is available across all 77 districts. Digital payments with eSewa EPAY v2, Khalti v2, and Fonepay Dynamic QR are coming soon."],
  ["Are prices inclusive of VAT?", "Product prices are shown before 13% VAT. VAT is added transparently at checkout and shown on your invoice."],
  ["Can I cancel my order?", "Yes — from My orders, any order that hasn't shipped yet can be cancelled in one click."],
  ["What is your return policy?", "Unused items in original packaging can be returned within 7 days of delivery. Request a return from the order page."],
  ["How do coupons work?", "Enter the code in your cart or at checkout. Each coupon has a minimum order value and some have a maximum discount."],
  ["How do I track my order?", "Use the Track order page with your order number and phone, or open the order in your account."],
];

const FAQ_NE = [
  ["डेलिभरी कहाँ-कहाँ हुन्छ?", "नेपालका सबै ७७ वटै जिल्लामा। प्रमुख सहरहरूमा १–२ दिनमा एक्सप्रेस डेलिभरी र अन्य स्थानमा ३–६ दिन लाग्छ।"],
  ["डेलिभरी शुल्क कति लाग्छ?", "साधारण डेलिभरी रु १५० हो र रु ५,००० भन्दा माथिको अर्डरमा निःशुल्क हुन्छ। एक्सप्रेस डेलिभरी रु २५० लाग्छ।"],
  ["भुक्तानी कसरी गर्ने?", "सबै ७७ जिल्लामा क्यास अन डेलिभरी (COD) उपलब्ध छ। ईसेवा, खल्ती र फोनपे क्युआर भुक्तानी चाँडै सुरु हुँदैछ।"],
  ["के मूल्यमा भ्याट समावेश छ?", "उत्पादनको मूल्य १३% भ्याट बाहेक देखाइएको छ। चेकआउट गर्दा भ्याट पारदर्शी रूपमा जोडिन्छ र बिलमा देखिन्छ।"],
  ["के मैले आफ्नो अर्डर रद्द गर्न सक्छु?", "सकिन्छ — 'मेरो अर्डरहरू' बाट सामान पठाइनु अगाडि एक क्लिकमै अर्डर रद्द गर्न सकिन्छ।"],
  ["फिर्ता नीति कस्तो छ?", "प्रयोग नगरिएका र सक्कली प्याकिङमा रहेका सामानहरू डेलिभरी भएको ७ दिनभित्र फिर्ता गर्न सकिन्छ।"],
  ["कुपन कोड कसरी प्रयोग गर्ने?", "आफ्नो कार्ट वा चेकआउट पृष्ठमा कुपन कोड प्रविष्ट गर्नुहोस्। प्रत्येक कुपनको न्यूनतम खरिद सर्त हुन्छ।"],
  ["मैले आफ्नो अर्डर कसरी ट्र्याक गर्ने?", "'अर्डर ट्र्याक' पृष्ठमा गएर अर्डर नम्बर र फोन नम्बर हालेर सजिलै स्थिति हेर्न सकिन्छ।"],
];

function Faq() {
  const { isNepali } = useI18n();
  const faqList = isNepali ? FAQ_NE : FAQ_EN;

  return (
    <div className="container-page max-w-3xl py-8 md:py-10">
      <h1 className="text-4xl font-display">
        {isNepali ? "प्रायः सोधिने प्रश्नहरू (FAQ)" : "Frequently asked questions"}
      </h1>
      <Accordion type="single" collapsible className="mt-8">
        {faqList.map(([q, a], i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="mt-10 text-sm">
        {isNepali ? "थप सहायता चाहिन्छ? " : "Still need help? "}
        <Link to="/support" className="font-medium underline">
          {isNepali ? "ग्राहक सहायता सम्पर्क गर्नुहोस्" : "Contact support"}
        </Link>
      </p>
    </div>
  );
}
