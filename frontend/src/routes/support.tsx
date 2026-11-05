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
      toast.error("Please fill in all required fields");
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
      toast.success("Support ticket created!");
    } catch (err: any) {
      toast.error(err?.message || ("Failed to create support ticket"));
    } finally {
      setBusy(false);
    }
  };

  const copyTicketId = () => {
    if (!done) return;
    void navigator.clipboard.writeText(done);
    setCopied(true);
    toast.success("Ticket ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const quickHelp = QUICK_HELP;

  return (
    <div className="container-page space-y-12 py-8 md:space-y-16 md:py-12">
      {/* Hero Header */}
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-accent">
          <Sparkles className="h-4 w-4" />
          <p className="eyebrow text-accent font-semibold">
            {"DOVAN Customer Care"}
          </p>
        </div>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          {"We're here to help you."}
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {"Have an inquiry about an order, delivery across Nepal, or exchanges? Submit a ticket below or contact our Kathmandu team directly."}
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
                {"Ticket Received"}
              </p>
              <h2 className="mt-1 font-display text-3xl">
                {"We're on it!"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                {"Your support request has been logged into our queue. Our customer care team in Kathmandu will reply to you within 4 business hours."}
              </p>

              <div className="mt-6 inline-flex items-center gap-3 rounded-lg border bg-secondary/50 px-4 py-2.5">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    {"Ticket ID"}
                  </span>
                  <span className="font-mono text-base font-bold text-foreground">{done}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={copyTicketId} className="h-8 px-2 text-xs">
                  {copied ? ("Copied") : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {user && (
                  <Button asChild>
                    <Link to="/account/support">
                      {"View in My Account"}
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
                  {"Submit another inquiry"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6 md:p-8 shadow-sm">
              <div className="border-b pb-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">
                    {"Send us a message"}
                  </h2>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                    {"Avg. reply < 4 hours"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {"Fill out the details below and we will get back to you promptly by email."}
                </p>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="s-name">
                      {"Your Full Name *"}
                    </Label>
                    <Input
                      id="s-name"
                      required
                      placeholder={"e.g. Ramesh Thapa"}
                      value={f.name}
                      onChange={(e) => setF({ ...f, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="s-email">
                      {"Email Address *"}
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
                    <Label>{"Inquiry Topic *"}</Label>
                    <Select value={f.category} onValueChange={(v) => setF({ ...f, category: v })}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order">{"Order Status & Delivery"}</SelectItem>
                        <SelectItem value="return">{"Return / Exchange / Refund"}</SelectItem>
                        <SelectItem value="payment">{"Cash on Delivery & Payment"}</SelectItem>
                        <SelectItem value="product">{"Product Details & Sizing"}</SelectItem>
                        <SelectItem value="complaint">{"Service Feedback / Complaint"}</SelectItem>
                        <SelectItem value="other">{"General Inquiry"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="s-order">
                      {"Order Number (Optional)"}
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
                    {"Subject *"}
                  </Label>
                  <Input
                    id="s-sub"
                    required
                    minLength={3}
                    placeholder={"Brief summary of your inquiry"}
                    value={f.subject}
                    onChange={(e) => setF({ ...f, subject: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="s-msg">
                      {"Detailed Message *"}
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {"Min. 10 characters"}
                    </span>
                  </div>
                  <Textarea
                    id="s-msg"
                    required
                    minLength={10}
                    rows={5}
                    placeholder={
                      "Please include any helpful details, preferred size/color for exchanges, or specific delivery questions..."
                    }
                    value={f.message}
                    onChange={(e) => setF({ ...f, message: e.target.value })}
                  />
                </div>

                <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  {busy
                    ? ("Sending ticket...")
                    : ("Submit Support Ticket")}
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
              {"Direct Contacts"}
            </h3>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {"Phone Support"}
                  </p>
                  <a href="tel:+97714220192" className="mt-0.5 block font-medium hover:text-accent hover:underline">
                    +977 1 4220192
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {"Direct line (Kathmandu)"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {"Email Helpdesk"}
                  </p>
                  <a href="mailto:support@dovan.com.np" className="mt-0.5 block font-medium hover:text-accent hover:underline">
                    support@dovan.com.np
                  </a>
                  <p className="text-xs text-muted-foreground">
                    {"Replies in < 4 hours"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {"Operating Hours"}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {"Sun – Fri: 9:00 AM – 7:00 PM"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {"Saturday: 10:00 AM – 4:00 PM"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-accent">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                    {"Experience Center"}
                  </p>
                  <p className="mt-0.5 font-medium">
                    {"Durbar Marg, Kathmandu"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {"Opposite Narayanhiti Palace"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guarantee Badge Card */}
          <div className="rounded-xl border bg-secondary/50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
              <ShieldCheck className="h-4 w-4 text-accent" />
              {"DOVAN Customer Promise"}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {"Every package is verified before dispatch. We guarantee 100% genuine products, Cash on Delivery across all 77 districts, and simple 7-day exchanges."}
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
