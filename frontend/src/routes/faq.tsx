import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — DOVAN" },
      { name: "description", content: "Frequently asked questions about ordering, delivery across Nepal, cash on delivery, and returns at DOVAN." },
      { property: "og:title", content: "FAQ — DOVAN" },
      { property: "og:description", content: "Frequently asked questions about ordering, delivery, and returns." },
    ],
  }),
  component: Faq,
});

const FAQ_EN = [
  ["Where do you deliver?", "Across all 77 districts of Nepal. 1–2 days express in major cities, 3–6 days elsewhere."],
  ["How much is delivery?", "Standard delivery is Rs. 150, free over Rs. 5,000. Express delivery is Rs. 250 in select cities."],
  ["How do I pay?", "Cash on delivery is available across all 77 districts. Digital payments with eSewa EPAY v2, Khalti v2, and Fonepay Dynamic QR are coming soon."],
  ["Are prices inclusive of VAT?", "Product prices are shown before 13% VAT. VAT is added transparently at checkout and shown on your invoice."],
  ["Can I cancel my order?", "Yes — from My orders, any order that hasn't shipped yet can be cancelled in one click."],
  ["What is your return policy?", "Unused items in original packaging can be returned within 7 days of delivery. Request a return from the order page."],
  ["How do coupons work?", "Enter the code in your cart or at checkout. Each coupon has a minimum order value and some have a maximum discount."],
  ["How do I track my order?", "Use the Track order page with your order number and phone, or open the order in your account."],
];

function Faq() {
  return (
    <div className="container-page max-w-3xl py-8 md:py-10">
      <h1 className="text-4xl font-display">
        Frequently asked questions
      </h1>
      <Accordion type="single" collapsible className="mt-8">
        {FAQ_EN.map(([q, a], i) => (
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
