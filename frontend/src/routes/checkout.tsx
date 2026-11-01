import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Banknote, Clock, ShieldCheck } from "lucide-react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { fetchQuote, type Quote } from "@/lib/catalog";
import { NEPAL_PROVINCES } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { SummaryRows } from "./cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  validateSearch: (s) => z.object({ coupon: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Checkout — DOVAN" },
      { name: "description", content: "Securely complete your DOVAN order." },
      { property: "og:title", content: "Checkout — DOVAN" },
      { property: "og:description", content: "Securely complete your DOVAN order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Checkout,
});

type Addr = { full_name: string; phone: string; province: string; district: string; city: string; street: string; landmark?: string | null };
const empty: Addr = { full_name: "", phone: "", province: "Bagmati", district: "", city: "", street: "", landmark: "" };
const addrSchema = z.object({
  full_name: z.string().trim().min(2, "Enter full name").max(100),
  phone: z.string().trim().regex(/^(\+?977)?9\d{9}$/, "Enter a valid Nepali mobile number (98XXXXXXXX)"),
  province: z.string().min(1),
  district: z.string().trim().min(2, "Enter district").max(60),
  city: z.string().trim().min(2, "Enter city / municipality").max(60),
  street: z.string().trim().min(3, "Enter street / tole").max(200),
  landmark: z.string().max(120).optional().nullable(),
});

export function AddressFields({ value, onChange }: { value: Addr; onChange: (a: Addr) => void }) {
  const { t, isNepali, translateProvince } = useI18n();
  const f = (k: keyof Addr) => ({
    value: (value[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value }),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="a-name">{t("full_name")}</Label>
        <Input id="a-name" {...f("full_name")} />
      </div>
      <div>
        <Label htmlFor="a-phone">{t("mobile_number")}</Label>
        <Input id="a-phone" inputMode="tel" placeholder="98XXXXXXXX" {...f("phone")} />
      </div>
      <div>
        <Label>{t("province")}</Label>
        <Select value={value.province} onValueChange={(v) => onChange({ ...value, province: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NEPAL_PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {translateProvince(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="a-district">{t("district")}</Label>
        <Input id="a-district" {...f("district")} />
      </div>
      <div>
        <Label htmlFor="a-city">{t("city_municipality")}</Label>
        <Input id="a-city" {...f("city")} />
      </div>
      <div>
        <Label htmlFor="a-street">{t("street_tole")}</Label>
        <Input id="a-street" {...f("street")} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="a-landmark">{t("landmark_optional")}</Label>
        <Input id="a-landmark" {...f("landmark")} />
      </div>
    </div>
  );
}

function Checkout() {
  const search = Route.useSearch();
  const { user, cart, authReady, reloadCart } = useShop();
  const { t, formatPrice, isNepali, translateProduct, translateProvince } = useI18n();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<(Addr & { id: string; is_default: boolean })[]>([]);
  const [selected, setSelected] = useState<string>("new");
  const [addr, setAddr] = useState<Addr>(empty);
  const [save, setSave] = useState(true);
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState<Addr>(empty);
  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [coupon, setCoupon] = useState(search.coupon ?? "");
  const [applied, setApplied] = useState(search.coupon ?? "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const idem = useMemo(() => crypto.randomUUID(), []);

  const steps = isNepali
    ? ["ठेगाना", "डेलिभरी", "भुक्तानी", "पुनरावलोकन"]
    : ["Address", "Shipping", "Payment", "Review"];

  useEffect(() => {
    if (!user) return;
    supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .then(({ data }) => {
        const list = (data ?? []) as typeof addresses;
        setAddresses(list);
        if (list[0]) setSelected(list[0].id);
      });
  }, [user]);

  useEffect(() => {
    if (!cart.length) return;
    fetchQuote(cart, applied, shipping)
      .then((q) => {
        setQuote(q);
        setErr(null);
      })
      .catch((e) => setErr(e.message));
  }, [cart, applied, shipping]);

  if (!authReady)
    return (
      <div className="container-page py-16">
        <div className="h-40 animate-pulse rounded bg-muted" />
      </div>
    );

  if (!user)
    return (
      <div className="container-page max-w-md py-16 text-center">
        <h1 className="text-3xl font-display">{t("sign_in_to_checkout")}</h1>
        <p className="mt-2 text-muted-foreground">{t("cart_waiting")}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/login" search={{ redirect: "/checkout" }}>
              {t("sign_in")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/register" search={{ redirect: "/checkout" }}>
              {t("create_account")}
            </Link>
          </Button>
        </div>
      </div>
    );

  if (!cart.length)
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-3xl font-display">{t("empty_cart")}</h1>
        <Button className="mt-6" asChild>
          <Link to="/shop">{t("continue_shopping")}</Link>
        </Button>
      </div>
    );

  const shipAddr = selected === "new" ? addr : addresses.find((a) => a.id === selected) ?? addr;

  const next = async () => {
    if (step === 0) {
      const r = addrSchema.safeParse(shipAddr);
      if (!r.success) return toast.error(r.error.issues[0].message);
      if (!sameBilling) {
        const b = addrSchema.safeParse(billing);
        if (!b.success) return toast.error("Billing: " + b.error.issues[0].message);
      }
      if (selected === "new" && save) {
        const { data } = await supabase
          .from("addresses")
          .insert({ ...r.data, user_id: user.id, is_default: addresses.length === 0 })
          .select()
          .single();
        if (data) {
          setAddresses([...addresses, data as never]);
          setSelected(data.id);
        }
      }
    }
    setStep((s) => s + 1);
  };

  const place = async () => {
    setPlacing(true);
    const clean = (a: Addr) => ({
      full_name: a.full_name,
      phone: a.phone,
      province: a.province,
      district: a.district,
      city: a.city,
      street: a.street,
      landmark: a.landmark ?? "",
    });
    const { data, error } = await supabase.rpc("place_order", {
      _items: cart,
      _coupon: applied,
      _shipping_method: shipping,
      _payment_method: "cod",
      _shipping: clean(shipAddr),
      _billing: clean(sameBilling ? shipAddr : billing),
      _email: user.email ?? "",
      _idem: idem,
    });
    setPlacing(false);
    if (error) return toast.error(error.message);
    await reloadCart();
    const res = data as { order_id: string; order_number: string };
    toast.success(
      isNepali ? `अर्डर ${res.order_number} सफलतापूर्वक सम्पन्न भयो!` : `Order ${res.order_number} placed!`
    );
    void nav({ to: "/account/orders/$id", params: { id: res.order_id }, search: { placed: true } });
  };

  return (
    <div className="container-page py-6 md:py-8">
      <h1 className="text-4xl font-display">{t("checkout_title")}</h1>
      <ol className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Checkout steps">
        {steps.map((s, i) => (
          <li
            key={s}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1",
              i === step && "border-foreground bg-foreground text-background",
              i < step && "text-success"
            )}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
            {s}
          </li>
        ))}
      </ol>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="rounded-md border bg-card p-6 shadow-xs">
          {step === 0 && (
            <>
              <h2 className="text-2xl font-semibold">{t("delivery_address")}</h2>
              <RadioGroup value={selected} onValueChange={setSelected} className="mt-4 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-foreground"
                  >
                    <RadioGroupItem value={a.id} className="mt-1" />
                    <span className="text-sm">
                      <b>{a.full_name}</b> · {a.phone}
                      <br />
                      {a.street}, {a.city}, {a.district}, {translateProvince(a.province)}
                    </span>
                  </label>
                ))}
                <label className="flex cursor-pointer items-center gap-3 rounded-md border p-3 has-[[data-state=checked]]:border-foreground">
                  <RadioGroupItem value="new" />
                  {t("add_new_address")}
                </label>
              </RadioGroup>
              {selected === "new" && (
                <div className="mt-4">
                  <AddressFields value={addr} onChange={setAddr} />
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <Checkbox checked={save} onCheckedChange={(v) => setSave(!!v)} />
                    {t("save_to_address_book")}
                  </label>
                </div>
              )}
              <label className="mt-5 flex items-center gap-2 text-sm">
                <Checkbox checked={sameBilling} onCheckedChange={(v) => setSameBilling(!!v)} />
                {t("billing_same_as_delivery")}
              </label>
              {!sameBilling && (
                <div className="mt-4">
                  <h3 className="mb-3 font-medium">{t("billing_address")}</h3>
                  <AddressFields value={billing} onChange={setBilling} />
                </div>
              )}
            </>
          )}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold">{t("shipping_method")}</h2>
              <RadioGroup
                value={shipping}
                onValueChange={(v) => setShipping(v as typeof shipping)}
                className="mt-4 space-y-2"
              >
                <label className="flex cursor-pointer items-center gap-3 rounded-md border p-4 has-[[data-state=checked]]:border-foreground">
                  <RadioGroupItem value="standard" />
                  <span className="flex-1">
                    <b>{t("standard_shipping")}</b>
                    <br />
                    <span className="text-sm text-muted-foreground">{t("standard_shipping_desc")}</span>
                  </span>
                  <span>
                    {quote && shipping === "standard"
                      ? quote.shipping_fee
                        ? formatPrice(quote.shipping_fee)
                        : t("free")
                      : formatPrice(150)}
                  </span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-md border p-4 has-[[data-state=checked]]:border-foreground">
                  <RadioGroupItem value="express" />
                  <span className="flex-1">
                    <b>{t("express_shipping")}</b>
                    <br />
                    <span className="text-sm text-muted-foreground">{t("express_shipping_desc")}</span>
                  </span>
                  <span>{formatPrice(250)}</span>
                </label>
              </RadioGroup>
            </>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold">{t("payment_method")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isNepali
                    ? "आफ्नो उपयुक्त भुक्तानी विधि छान्नुहोस्। नेपालका सबै ७७ जिल्लामा क्यास अन डेलिभरी उपलब्ध छ।"
                    : "Select your preferred payment method. Cash on delivery is active across all 77 districts."}
                </p>
              </div>

              <RadioGroup value="cod" className="space-y-3 pt-2">
                {/* Active: Cash on Delivery */}
                <label className="relative flex cursor-pointer items-start gap-4 rounded-xl border-2 border-foreground bg-card p-4 shadow-sm transition hover:border-foreground">
                  <div className="pt-0.5">
                    <RadioGroupItem value="cod" id="payment-cod" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-accent" />
                        <span className="font-semibold text-base">{t("cod_label")}</span>
                      </div>
                      <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
                        {isNepali ? "नेपालभर सक्रिय" : "Active nationwide"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {isNepali
                        ? "नेपालका सबै ७७ जिल्लामा सामान घरमै आइपुगेपछि नगद वा मोबाइल बैंकिङ क्युआर कोडमार्फत भुक्तानी गर्नुहोस्।"
                        : "Pay with cash or mobile banking QR code upon doorstep delivery by our courier across all 77 districts of Nepal."}
                    </p>
                  </div>
                </label>

                {/* Coming Soon: eSewa EPAY v2 */}
                <div className="relative flex items-start gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 opacity-80 select-none">
                  <div className="pt-0.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/40 bg-background/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded bg-[#60bb46] text-[10px] font-bold text-white shadow-xs">
                          e
                        </span>
                        <span className="font-semibold text-base">eSewa EPAY v2</span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#60bb46]/30 bg-[#60bb46]/10 px-2.5 py-0.5 text-xs font-semibold text-[#3d8327]">
                        <Clock className="h-3 w-3" /> {t("coming_soon")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {isNepali
                        ? "ईसेवा वालेट तथा मोबाइल बैंकिङबाट तुरुन्त भुक्तानी गर्न सकिने सुविधा।"
                        : "Integrate eSewa's standard checkout flow with HMAC-SHA256 signature verification for instant wallet and mobile banking payments."}
                    </p>
                  </div>
                </div>

                {/* Coming Soon: Khalti v2 Payment Gateway */}
                <div className="relative flex items-start gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 opacity-80 select-none">
                  <div className="pt-0.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/40 bg-background/50" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded bg-[#5d2e8e] text-[10px] font-bold text-white shadow-xs">
                          K
                        </span>
                        <span className="font-semibold text-base">Khalti v2</span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#5d2e8e]/30 bg-[#5d2e8e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#5d2e8e]">
                        <Clock className="h-3 w-3" /> {t("coming_soon")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {isNepali
                        ? "खल्ती वालेट, कार्ड तथा कनेक्टआईपीएस मार्फत अनलाइन भुक्तानी सुविधा।"
                        : "Add Khalti Checkout with pop-up or redirect API, instant callback verification, SCT cards, and connectIPS."}
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <div className="mt-3 flex items-center gap-2 rounded-lg border bg-secondary/40 px-3.5 py-2.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  {isNepali
                    ? "सबै भुक्तानीहरू २५६-बिट ईन्क्रिप्शनबाट सुरक्षित छन्। क्यास अन डेलिभरीमा कुनै अग्रिम भुक्तानी चाहिँदैन।"
                    : "All payments are protected by 256-bit encryption. Cash on delivery orders require no advance deposit."}
                </span>
              </div>
            </div>
          )}
          {step === 3 && (
            <>
              <h2 className="text-2xl font-semibold">{t("review_order")}</h2>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="eyebrow mb-1">{isNepali ? "डेलिभरी ठेगाना" : "Deliver to"}</p>
                  {shipAddr.full_name}, {shipAddr.phone}
                  <br />
                  {shipAddr.street}, {shipAddr.city}, {shipAddr.district},{" "}
                  {translateProvince(shipAddr.province)}
                </div>
                <div>
                  <p className="eyebrow mb-1">{isNepali ? "डेलिभरी तथा भुक्तानी" : "Shipping · Payment"}</p>
                  {shipping === "express" ? t("express_shipping") : t("standard_shipping")} · {t("cod_label")}
                </div>
              </div>
              <ul className="mt-6 divide-y border-y">
                {quote?.lines.map((l) => (
                  <li key={l.product_id + l.size + l.color} className="flex items-center gap-3 py-3 text-sm">
                    <img src={l.image} alt="" className="h-14 w-11 rounded object-cover bg-muted" />
                    <span className="flex-1">
                      {translateProduct(l.name)}
                      <span className="block text-xs text-muted-foreground">
                        {[l.size, l.color].filter(Boolean).join(" · ")} × {l.quantity}
                      </span>
                    </span>
                    <span className="font-semibold">{formatPrice(l.line_total)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              {isNepali ? "पछाडि" : "Back"}
            </Button>
            {step < 3 ? (
              <Button onClick={next}>{isNepali ? "अगाडि बढ्नुहोस्" : "Continue"}</Button>
            ) : (
              <Button size="lg" disabled={placing || !!err} onClick={place}>
                {placing
                  ? t("placing_order")
                  : `${t("place_order")} · ${quote ? formatPrice(quote.total) : ""}`}
              </Button>
            )}
          </div>
        </div>
        <aside className="h-fit rounded-md border bg-card p-6 shadow-xs">
          <h2 className="text-xl font-semibold">{t("order_summary")}</h2>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(coupon);
            }}
          >
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder={t("coupon_code")}
              aria-label={t("coupon_code")}
            />
            <Button variant="outline">{t("apply")}</Button>
          </form>
          {quote?.coupon_error && applied && (
            <p className="mt-2 text-sm text-destructive">{quote.coupon_error}</p>
          )}
          <div className="mt-5">
            {quote ? <SummaryRows q={quote} /> : <div className="h-32 animate-pulse rounded bg-muted" />}
          </div>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <p className="mt-4 text-xs text-muted-foreground">
            {isNepali
              ? "तपाईंले अर्डर गर्दा DOVAN द्वारा सुरक्षित रूपमा कुल हिसाब निकालिन्छ।"
              : "Totals are calculated securely by DOVAN at the moment you place your order."}
          </p>
        </aside>
      </div>
    </div>
  );
}
