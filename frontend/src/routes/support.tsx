import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Truck,
  RotateCcw,
  HelpCircle,
  MessageSquare,
  CheckCircle2,
  Copy,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Customer Care & Support — DOVAN" },
      { name: "description", content: "Need help with an order, delivery across Nepal, or returns? Reach out to DOVAN customer care." },
      { property: "og:title", content: "Customer Care & Support — DOVAN" },
      { property: "og:description", content: "Get in touch with DOVAN customer care in Kathmandu." },
    ],
  }),
  component: SupportPage,
});

const QUICK_HELP = [
  {
    icon: Truck,
    title: "Track an Order",
    desc: "Check live courier dispatch status for any of Nepal's 77 districts.",
    to: "/track",
    action: "Track package",
  },
  {
    icon: RotateCcw,
    title: "Returns & Exchanges",
    desc: "Enjoy 7-day hassle-free returns with easy doorstep courier pickup.",
    to: "/policies/$page",
    params: { page: "returns" },
    action: "View policy",
  },
  {
    icon: HelpCircle,
    title: "Help Center & FAQ",
    desc: "Instant answers on COD, sizing, delivery timelines, and payment.",
    to: "/faq",
    action: "Browse FAQs",
  },
  {
    icon: MapPin,
    title: "Store Locations",
    desc: "Visit our physical experience centers in Kathmandu and Pokhara.",
    to: "/stores",
    action: "Find stores",
  },
];

const QUICK_HELP_NE = [
  {
    icon: Truck,
    title: "अर्डर ट्र्याक गर्नुहोस्",
    desc: "नेपालका ७७ वटै जिल्लाका लागि कुरियरको प्रत्यक्ष स्थिति हेर्नुहोस्।",
    to: "/track",
    action: "पार्सल ट्र्याक गर्नुहोस्",
  },
  {
    icon: RotateCcw,
    title: "सामान फिर्ता र साटफेर",
    desc: "घरमै कुरियर पिकअप सुविधासहित ७ दिनभित्र झन्झटरहित फिर्ता।",
    to: "/policies/$page",
    params: { page: "returns" },
    action: "नीति हेर्नुहोस्",
  },
  {
    icon: HelpCircle,
    title: "सहयोग केन्द्र तथा प्रश्नोत्तर",
    desc: "क्यास अन डेलिभरी, साइज, समय र भुक्तानी सम्बन्धी तत्काल जवाफ।",
    to: "/faq",
    action: "प्रश्नोत्तर हेर्नुहोस्",
  },
  {
    icon: MapPin,
    title: "शाखा स्टोरहरू",
    desc: "काठमाडौं र पोखरामा रहेका हाम्रा अनुभव केन्द्रहरूमा भ्रमण गर्नुहोस्।",
    to: "/stores",
    action: "स्टोर हेर्नुहोस्",
  },
];

const TOP_FAQS = [
  {
    q: "How does Cash on Delivery (COD) work across Nepal?",
    a: "We offer Cash on Delivery to all 77 districts. When the courier arrives at your doorstep, you inspect the outer package and hand over the cash amount to the delivery agent. No advance deposit is needed.",
  },
  {
    q: "How long does shipping take to my district?",
    a: "Kathmandu Valley takes 24 to 48 hours. Regional cities (Pokhara, Chitwan, Biratnagar, Butwal, Nepalgunj) take 2 to 3 business days. Remote hill and mountain districts take 3 to 5 business days.",
  },
  {
    q: "What is your 7-day return and exchange policy?",
    a: "If you are unsatisfied or need a size change, you can request an exchange or return within 7 calendar days of delivery. Items must be unworn with original tags attached.",
  },
  {
    q: "Can I cancel or amend my delivery address?",
    a: "Yes! If your order hasn't been dispatched from our Kathmandu central hub yet, contact us immediately via phone or submit an order help ticket below.",
  },
];

function SupportPage() {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const [f, setF] = useState({
    name: "",
    email: "",
    category: "order",
    order: "",
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setF((x) => ({ ...x, email: x.email || user.email! }));
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.subject.trim() || !f.message.trim()) {
      toast.error(isNepali ? "कृपया सबै आवश्यक फारम भर्नुहोस्" : "Please fill in all required fields");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post<{ ticket?: any }>("/tickets", {
        name: f.name.trim(),
        email: f.email.trim(),
        category: f.category,
        order_number: f.order.trim() || undefined,
        subject: `[${f.category}] ${f.subject.trim()}${f.order.trim() ? ` (Order: ${f.order.trim()})` : ""}`,
        message: `From: ${f.name.trim()} <${f.email.trim()}>\nCategory: ${f.category}\n\n${f.message.trim()}`,
      });
      const ticketNumber = res?.ticket?.id
        ? `TIC-${res.ticket.id.slice(0, 8).toUpperCase()}`
        : `TIC-${Date.now().toString().slice(-6)}`;
      setDone(ticketNumber);
      toast.success(isNepali ? "सहयोग टिकट दर्ता भयो!" : "Support ticket created!");
    } catch (err: any) {
      toast.error(err?.message || (isNepali ? "सहयोग टिकट दर्ता गर्न सकिएन" : "Failed to create support ticket"));
    } finally {
      setBusy(false);
    }
  };

  const copyTicketId = () => {
    if (!done) return;
    void navigator.clipboard.writeText(done);
    setCopied(true);
    toast.success(isNepali ? "टिकट नम्बर कपी भयो!" : "Ticket ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const quickHelp = isNepali ? QUICK_HELP_NE : QUICK_HELP;

  return (
    <div className="container-page space-y-12 py-8 md:space-y-16 md:py-12">
      {/* Hero Header */}
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" />
          <p className="eyebrow text-accent font-semibold">
            {isNepali ? "दोभान ग्राहक सेवा" : "DOVAN Customer Care"}
          </p>
        </div>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          {isNepali ? "हामी सहयोग गर्न सधैं तयार छौं।" : "We're here to help you."}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {isNepali
            ? "अर्डर, नेपालभर डेलिभरी वा साटफेर सम्बन्धी कुनै पनि जिज्ञासा भए तलको फारम भर्नुहोस् वा काठमाडौंस्थित हाम्रो टोलीलाई सिधै सम्पर्क गर्नुहोस्।"
            : "Have an inquiry about an order, delivery across Nepal, or exchanges? Submit a ticket below or contact our Kathmandu team directly."}
        </p>
      </div>

      {/* Quick Solution Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickHelp.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition hover:border-foreground/30 hover:shadow-md"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-semibold text-base">{item.title}</h2>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
              <div className="mt-5 border-t pt-3">
                <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs font-semibold text-accent">
                  {item.params ? (
                    <Link to={item.to as "/policies/$page"} params={item.params}>
                      {item.action} →
                    </Link>
                  ) : (
                    <Link to={item.to as "/track"}>
                      {item.action} →
                    </Link>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Grid: Ticket Form + Support Channels */}
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Ticket Form / Success View */}
        <div>
          {done ? (
            <div className="rounded-xl border bg-card p-8 md:p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="eyebrow mt-4 text-success">
                {isNepali ? "अनुरोध प्राप्त भयो" : "Ticket Received"}
              </p>
              <h2 className="mt-1 font-display text-3xl">
                {isNepali ? "हामी काम सुरु गर्दैछौं!" : "We're on it!"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {isNepali
                  ? "तपाईंको सहयोग अनुरोध दर्ता भएको छ। काठमाडौंस्थित हाम्रो ग्राहक सेवा टोलीले ४ कार्यघण्टाभित्र जवाफ दिनेछ।"
                  : "Your support request has been logged into our queue. Our customer care team in Kathmandu will reply to you within 4 business hours."}
              </p>

              <div className="mt-6 inline-flex items-center gap-3 rounded-lg border bg-secondary/50 px-4 py-2.5">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {isNepali ? "टिकट नम्बर" : "Ticket ID"}
                  </span>
                  <span className="font-mono text-base font-bold text-foreground">{done}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={copyTicketId} className="h-8 px-2 text-xs">
                  {copied ? (isNepali ? "कपी भयो" : "Copied") : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {user && (
                  <Button asChild>
                    <Link to="/account/support">
                      {isNepali ? "मेरो खातामा हेर्नुहोस्" : "View in My Account"}
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setDone(null);
                    setF({ ...f, subject: "", message: "", order: "" });
                  }}
                >
                  {isNepali ? "अर्को जिज्ञासा पठाउनुहोस्" : "Submit another inquiry"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
              <div className="border-b pb-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">
                    {isNepali ? "हामीलाई सन्देश पठाउनुहोस्" : "Send us a message"}
                  </h2>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    {isNepali ? "औसत उत्तर < ४ घण्टा" : "Avg. reply < 4 hours"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {isNepali
                    ? "तलका विवरणहरू भर्नुहोस्, हामी इमेल मार्फत तुरुन्त सम्पर्क गर्नेछौं।"
                    : "Fill out the details below and we will get back to you promptly by email."}
                </p>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-name">
                      {isNepali ? "तपाईंको पूरा नाम *" : "Your Full Name *"}
                    </Label>
                    <Input
                      id="s-name"
                      required
                      placeholder={isNepali ? "उदा: रमेश थापा" : "e.g. Ramesh Thapa"}
                      value={f.name}
                      onChange={(e) => setF({ ...f, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="s-email">
                      {isNepali ? "इमेल ठेगाना *" : "Email Address *"}
                    </Label>
                    <Input
                      id="s-email"
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={f.email}
                      onChange={(e) => setF({ ...f, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>{isNepali ? "जिज्ञासाको विषय *" : "Inquiry Topic *"}</Label>
                    <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">{isNepali ? "अर्डर स्थिति र डेलिभरी" : "Order Status & Delivery"}</SelectItem>
                        <SelectItem value="return">{isNepali ? "सामान फिर्ता / साटफेर / रिफन्ड" : "Return / Exchange / Refund"}</SelectItem>
                        <SelectItem value="payment">{isNepali ? "क्यास अन डेलिभरी र भुक्तानी" : "Cash on Delivery & Payment"}</SelectItem>
                        <SelectItem value="product">{isNepali ? "उत्पादन विवरण र साइज" : "Product Details & Sizing"}</SelectItem>
                        <SelectItem value="complaint">{isNepali ? "सेवा गुनासो / सुझाव" : "Service Feedback / Complaint"}</SelectItem>
                        <SelectItem value="other">{isNepali ? "सामान्य सोधपुछ" : "General Inquiry"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="s-order">
                      {isNepali ? "अर्डर नम्बर (ऐच्छिक)" : "Order Number (Optional)"}
                    </Label>
                    <Input
                      id="s-order"
                      placeholder="DV10001"
                      value={f.order}
                      onChange={(e) => setF({ ...f, order: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="s-sub">
                    {isNepali ? "शीर्षक *" : "Subject *"}
                  </Label>
                  <Input
                    id="s-sub"
                    required
                    minLength={3}
                    placeholder={isNepali ? "तपाईंको जिज्ञासाको संक्षिप्त सारांश" : "Brief summary of your inquiry"}
                    value={f.subject}
                    onChange={(e) => setF({ ...f, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="s-msg">
                      {isNepali ? "विस्तृत सन्देश *" : "Detailed Message *"}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {isNepali ? "कम्तीमा १० अक्षर" : "Min. 10 characters"}
                    </span>
                  </div>
                  <Textarea
                    id="s-msg"
                    required
                    minLength={10}
                    rows={5}
                    placeholder={
                      isNepali
                        ? "कृपया आवश्यक विवरण, साइज/रङ सम्बन्धी जानकारी वा डेलिभरी प्रश्न खुलाउनुहोला..."
                        : "Please include any helpful details, preferred size/color for exchanges, or specific delivery questions..."
                    }
                    value={f.message}
                    onChange={(e) => setF({ ...f, message: e.target.value })}
                  />
                </div>

                <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {busy
                    ? (isNepali ? "पठाउँदैछ..." : "Sending ticket...")
                    : (isNepali ? "सहायता अनुरोध पठाउनुहोस्" : "Submit Support Ticket")}
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar Customer Care Contacts */}
        <aside className="space-y-6">
          <div className="rounded-xl border bg-card p-6 shadow-sm space-y-5">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-accent" />
              {isNepali ? "प्रत्यक्ष सम्पर्क" : "Direct Contacts"}
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {isNepali ? "फोन सहयोग" : "Phone Support"}
                  </p>
                  <a href="tel:+97714220192" className="mt-0.5 block font-medium hover:text-accent hover:underline">
                    +977 1 4220192
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? "प्रत्यक्ष फोन (काठमाडौं)" : "Direct line (Kathmandu)"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {isNepali ? "इमेल हेल्पडेस्क" : "Email Helpdesk"}
                  </p>
                  <a href="mailto:support@dovan.com.np" className="mt-0.5 block font-medium hover:text-accent hover:underline">
                    support@dovan.com.np
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? "४ घण्टाभित्र उत्तर" : "Replies in < 4 hours"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {isNepali ? "कार्य समय" : "Operating Hours"}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {isNepali ? "आइत – शुक्र: बिहान ९:०० – बेलुका ७:००" : "Sun – Fri: 9:00 AM – 7:00 PM"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? "शनिबार: बिहान १०:०० – दिउँसो ४:००" : "Saturday: 10:00 AM – 4:00 PM"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {isNepali ? "अनुभव केन्द्र" : "Experience Center"}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {isNepali ? "दरबार मार्ग, काठमाडौं" : "Durbar Marg, Kathmandu"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isNepali ? "नारायणहिटी दरबार अगाडि" : "Opposite Narayanhiti Palace"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee Badge Card */}
          <div className="rounded-xl border bg-secondary/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {isNepali ? "दोभान ग्राहक प्रतिबद्धता" : "DOVAN Customer Promise"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isNepali
                ? "सामान पठाउनु अघि प्रत्येक पार्सल जाँच गरिन्छ। हामी १००% सक्कली उत्पादन, सबै ७७ जिल्लामा क्यास अन डेलिभरी र ७ दिनको सहज साटफेरको ग्यारेन्टी गर्दछौं।"
                : "Every package is verified before dispatch. We guarantee 100% genuine products, Cash on Delivery across all 77 districts, and simple 7-day exchanges."}
            </p>
          </div>
        </aside>
      </div>

      {/* Embedded FAQ Accordion */}
      {/* <section className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
                  <div className="max-w-xl">
                    <p className="eyebrow">Quick Answers</p>
                    <h2 className="mt-1 font-display text-2xl md:text-3xl">Frequently Asked Questions</h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Find immediate answers to our most common questions below, or explore our full{" "}
                      <Link to="/faq" className="text-accent underline font-medium">
                        FAQ page
                      </Link>
                      .
                    </p>
                  </div>

                  <Accordion type="single" collapsible className="mt-6 divide-y">
                    {TOP_FAQS.map((faq, i) => (
                      <AccordionItem key={faq.q} value={`faq-${i}`} className="border-border">
                        <AccordionTrigger className="text-base font-medium py-4 text-foreground hover:no-underline hover:text-accent">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-4">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section> */}
    </div>
  );
}
