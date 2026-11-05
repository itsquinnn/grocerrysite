import { createFileRoute, notFound, Link } from "@tanstack/react-router";

type Section = { heading: string; paragraphs?: string[]; items?: string[] };
type PolicyPage = { title: string; intro: string; updated: string; sections: Section[] };

const UPDATED = "November 2026";
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
  const p = Route.useLoaderData();

  return (
    <article className="container-page max-w-3xl py-8 md:py-10">
      <h1 className="text-4xl">{p.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {p.updated}
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
        <>
            Questions? <Link to="/support" className="underline font-medium text-foreground">Contact our support team</Link>.
          </>
      </p>
    </article>
  );
}