import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Check,
  Banknote,
  Clock,
  ShieldCheck,
  MapPin,
  Navigation,
  Compass,
  Star,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  ChevronDown,
  Truck,
  CreditCard,
  FileText,
  Lock,
} from "lucide-react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { fetchQuote, type Quote } from "@/lib/catalog";
import { NEPAL_PROVINCES } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { SummaryRows, SummaryRowsSkeleton } from "./cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function CheckoutPageSkeleton() {
  return (
    <div className="container-page py-6 md:py-10">
      <div className="space-y-2 mb-6">
        <Skeleton className="h-8 w-44 rounded-md" />
        <Skeleton className="h-4 w-64 rounded" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-36 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-4 sm:p-6 space-y-4 h-fit">
          <Skeleton className="h-6 w-32 rounded" />
          <div className="space-y-3 divide-y">
            {[1, 2].map((i) => (
              <div key={i} className="pt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-10 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            ))}
          </div>
          <SummaryRowsSkeleton />
          <Skeleton className="h-11 w-full rounded-md mt-4" />
        </aside>
      </div>
    </div>
  );
}

function CheckoutErrorBoundary({ error, reset }: { error: unknown; reset: () => void }) {
  const errMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  if (error) {
    console.error("[Checkout Session Notice - Uncaught Render Error]:", error);
  }
  return (
    <div className="container-page py-12 max-w-md mx-auto text-center space-y-4">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
        ✓
      </div>
      <h1 className="text-2xl font-display font-semibold">Checkout Session Notice</h1>
      <p className="text-sm text-muted-foreground">
        Your cart items are completely safe. Please review your cart or try reloading the checkout steps.
      </p>
      {errMessage && (
        <div className="text-xs font-mono text-destructive bg-destructive/10 p-3 rounded text-left overflow-auto max-h-32">
          {errMessage}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
        <Button onClick={reset} className="gap-2">
          <span>Reload Checkout</span>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/cart">Review Cart</Link>
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/checkout")({
  validateSearch: (s: Record<string, unknown>) => ({
    coupon: typeof s?.coupon === "string" ? s.coupon : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Checkout — DOVAN" },
      { name: "description", content: "Securely complete your DOVAN order." },
      { property: "og:title", content: "Checkout — DOVAN" },
      { property: "og:description", content: "Securely complete your DOVAN order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: CheckoutErrorBoundary,
  component: Checkout,
});

export type Addr = {
  full_name: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  street: string;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const empty: Addr = {
  full_name: "",
  phone: "",
  province: "Bagmati",
  district: "",
  city: "",
  street: "",
  landmark: "",
  latitude: null,
  longitude: null,
};

const addrSchema = z.object({
  full_name: z.string().trim().min(2, "Enter full name").max(100),
  phone: z.string().trim().regex(/^(\+?977)?9\d{9}$/, "Enter a valid Nepali mobile number (98XXXXXXXX)"),
  province: z.string().min(1),
  district: z.string().trim().min(2, "Enter district").max(60),
  city: z.string().trim().min(2, "Enter city / municipality").max(60),
  street: z.string().trim().min(3, "Enter street / tole").max(200),
  landmark: z.string().max(120).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

const SAVED_ADDR_CACHE_KEY = "dovan_user_saved_address_v2";

export function AddressFields({ value, onChange }: { value: Addr; onChange: (a: Addr) => void }) {
  const { t } = useI18n();
  const f = (k: keyof Addr) => ({
    value: (value[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value }),
  });

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="a-name" className="text-xs font-semibold text-foreground">
          {t("full_name")}
        </Label>
        <Input
          id="a-name"
          name="full_name"
          autoComplete="name"
          placeholder="Recipient full name"
          className="mt-1.5 h-11 text-base sm:text-sm font-medium"
          {...f("full_name")}
        />
      </div>

      <div>
        <Label htmlFor="a-phone" className="text-xs font-semibold text-foreground">
          {t("mobile_number")}
        </Label>
        <Input
          id="a-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98XXXXXXXX"
          className="mt-1.5 h-11 text-base sm:text-sm font-mono"
          {...f("phone")}
        />
      </div>

      <div>
        <Label className="text-xs font-semibold text-foreground">
          {t("province")}
        </Label>
        <Select value={value.province} onValueChange={(v) => onChange({ ...value, province: v })}>
          <SelectTrigger className="mt-1.5 h-11 text-base sm:text-sm font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NEPAL_PROVINCES.map((p) => (
              <SelectItem key={p} value={p}>
                {p} Province
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="a-district" className="text-xs font-semibold text-foreground">
          {t("district")}
        </Label>
        <Input
          id="a-district"
          name="district"
          autoComplete="address-level3"
          placeholder="e.g. Kathmandu"
          className="mt-1.5 h-11 text-base sm:text-sm font-medium"
          {...f("district")}
        />
      </div>

      <div>
        <Label htmlFor="a-city" className="text-xs font-semibold text-foreground">
          {t("city_municipality")}
        </Label>
        <Input
          id="a-city"
          name="city"
          autoComplete="address-level2"
          placeholder="e.g. Kathmandu Metro"
          className="mt-1.5 h-11 text-base sm:text-sm font-medium"
          {...f("city")}
        />
      </div>

      <div>
        <Label htmlFor="a-street" className="text-xs font-semibold text-foreground">
          {t("street_tole")}
        </Label>
        <Input
          id="a-street"
          name="street"
          autoComplete="street-address"
          placeholder="e.g. New Road, Ward 22"
          className="mt-1.5 h-11 text-base sm:text-sm font-medium"
          {...f("street")}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="a-landmark" className="text-xs font-semibold text-foreground">
          {t("landmark_optional")}
        </Label>
        <Input
          id="a-landmark"
          name="landmark"
          placeholder="e.g. Near Big Bell, opposite bank"
          className="mt-1.5 h-11 text-base sm:text-sm font-medium"
          {...f("landmark")}
        />
      </div>
    </div>
  );
}

function Checkout() {
  const search = Route.useSearch();
  const { user, cart, authReady, reloadCart } = useShop();
  const { t, formatPrice, translateProduct } = useI18n();
  const nav = useNavigate();
  const [step, setStep] = useState(0);

  // Address selection state
  const [addresses, setAddresses] = useState<(Addr & { id: string; label?: string; is_default: boolean })[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_ADDR_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && (cached.street || cached.city)) {
          return [
            {
              id: cached.id || "cached_default",
              full_name: cached.full_name || cached.name || "",
              phone: cached.phone || "",
              street: cached.street || "",
              district: cached.district || "Kathmandu",
              city: cached.city || "Kathmandu",
              province: cached.province || "Bagmati",
              landmark: cached.landmark ?? null,
              is_default: true,
              latitude: cached.latitude ?? null,
              longitude: cached.longitude ?? null,
            },
          ];
        }
      }
    } catch {}
    return [];
  });

  const [locationMode, setLocationMode] = useState<"saved" | "custom">("saved");
  const [selected, setSelected] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(SAVED_ADDR_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.id) return cached.id;
      }
    } catch {}
    return "custom";
  });
  const [addr, setAddr] = useState<Addr>(empty);
  const [saveCustom, setSaveCustom] = useState(true);
  const [makeDefault, setMakeDefault] = useState(true);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState<Addr>(empty);
  const [shipping, setShipping] = useState<"standard" | "express">("standard");
  const [coupon, setCoupon] = useState(search.coupon ?? "");
  const [applied, setApplied] = useState(search.coupon ?? "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  const steps = ["Address", "Shipping", "Payment", "Review"];

  // Fetch saved addresses from backend, with local cache & past-order recovery
  useEffect(() => {
    if (!user) return;
    const fetchAddr = async () => {
      try {
        const res = await api.get<{ addresses: any[] }>("/addresses");
        let list = (res?.addresses ?? []).map((a: any) => ({
          ...a,
          full_name: a.full_name ?? a.name ?? "",
          phone: a.phone ?? "",
          street: a.street ?? "",
          district: a.district || "Kathmandu",
          city: a.city || "Kathmandu",
          province: a.province || "Bagmati",
          landmark: a.landmark ?? a.details ?? null,
          is_default: Boolean(a.is_default),
          latitude: a.latitude ?? null,
          longitude: a.longitude ?? null,
        })) as typeof addresses;

        // Auto-seed from past order if user has no saved address row yet
        if (list.length === 0) {
          const { data: pastOrders } = await supabase
            .from("orders")
            .select("address_snapshot, destination_address")
            .eq("account_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (pastOrders && pastOrders.length > 0 && pastOrders[0]) {
            const snap = (pastOrders[0].address_snapshot as any) || {};
            const dest = pastOrders[0].destination_address || snap.address || "";
            const destStr = typeof dest === "string" ? dest : "";
            const parts = destStr ? destStr.split(",") : [];
            const recovered = {
              id: "recovered_default",
              full_name: snap.full_name || snap.name || user.user_metadata?.full_name || "Customer",
              phone: snap.phone || user.phone || "9800000000",
              street: snap.street || parts[0]?.trim() || destStr || "Main Road",
              city: snap.city || parts[1]?.trim() || "Kathmandu",
              district: snap.district || parts[2]?.trim() || "Kathmandu",
              province: snap.province || "Bagmati",
              landmark: snap.landmark ?? null,
              is_default: true,
              latitude: snap.latitude ?? null,
              longitude: snap.longitude ?? null,
            };
            list = [recovered];
            void api.post("/addresses", { ...recovered, is_default: true }).catch(() => {});
          }
        }

        if (list.length > 0) {
          setAddresses(list);
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          setSelected(defaultAddr.id);
          setLocationMode("saved");
          try {
            localStorage.setItem(SAVED_ADDR_CACHE_KEY, JSON.stringify(defaultAddr));
          } catch {}
        } else {
          setSelected((prev) => (prev !== "custom" && addresses.length > 0 ? prev : "custom"));
          setLocationMode((prev) => (addresses.length > 0 ? "saved" : "custom"));
          setMakeDefault(true);
        }
      } catch {
        if (addresses.length > 0) {
          setLocationMode("saved");
        }
      }
    };
    void fetchAddr();
  }, [user]);

  // Pre-fill user profile info into custom address
  useEffect(() => {
    if (!user) return;
    const meta = (user.user_metadata as any) || {};
    const name = meta.full_name || meta.name || "";
    const phone = meta.phone || user.phone || "";
    setAddr((prev) => ({
      ...prev,
      full_name: prev.full_name || name,
      phone: prev.phone || phone,
    }));
  }, [user]);

  // Fetch Cart Quote
  useEffect(() => {
    if (!cart.length) return;
    fetchQuote(cart, applied, shipping)
      .then((q) => {
        setQuote(q);
        setErr(null);
      })
      .catch((e) => setErr(e.message));
  }, [cart, applied, shipping]);

  const handleAutofillProfile = () => {
    if (!user) return;
    const meta = (user.user_metadata as any) || {};
    const name = meta.full_name || meta.name || "";
    const phone = meta.phone || user.phone || "";
    setAddr((prev) => ({
      ...prev,
      full_name: name || prev.full_name,
      phone: phone || prev.phone,
    }));
    toast.success("Autofilled name & phone from your profile");
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setAddr((prev) => ({
          ...prev,
          latitude,
          longitude,
          landmark: prev.landmark || `GPS Pin: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        }));
        toast.success(`GPS Location attached (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        toast.error("Could not detect GPS location. Please allow browser location access.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSetAsDefault = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.patch("/addresses", { id, is_default: true });
      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          is_default: a.id === id,
        }))
      );
      setSelected(id);
      const target = addresses.find((a) => a.id === id);
      if (target) {
        try {
          localStorage.setItem(SAVED_ADDR_CACHE_KEY, JSON.stringify({ ...target, is_default: true }));
        } catch {}
      }
      toast.success("Default address updated");
    } catch {
      toast.error("Could not set as default");
    }
  };

  if (!authReady) return <CheckoutPageSkeleton />;

  if (!user)
    return (
      <div className="container-page max-w-md py-12 sm:py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-display">{t("sign_in_to_checkout")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("cart_waiting")}</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button asChild className="h-11 font-semibold">
            <Link to="/login" search={{ redirect: "/checkout" }}>
              {t("sign_in")}
            </Link>
          </Button>
          <Button variant="outline" asChild className="h-11 font-semibold">
            <Link to="/register" search={{ redirect: "/checkout" }}>
              {t("create_account")}
            </Link>
          </Button>
        </div>
      </div>
    );

  if (!cart.length)
    return (
      <div className="container-page py-12 sm:py-16 text-center">
        <h1 className="text-2xl sm:text-3xl font-display">{t("empty_cart")}</h1>
        <Button className="mt-6 h-11 font-semibold" asChild>
          <Link to="/shop">{t("continue_shopping")}</Link>
        </Button>
      </div>
    );

  // Active address resolution
  const isUsingSaved = locationMode === "saved" && addresses.length > 0 && selected !== "custom";
  const shipAddr: Addr & { is_default?: boolean } = isUsingSaved
    ? addresses.find((a) => a.id === selected) || addresses[0] || addr
    : addr;

  const defaultAddress = addresses.find((a) => a.is_default) || addresses[0];
  const otherAddresses = addresses.filter((a) => a.id !== defaultAddress?.id);

  const next = async () => {
    if (step === 0) {
      if (locationMode === "saved" && addresses.length > 0) {
        if (!addresses.some((a) => a.id === selected)) {
          return toast.error("Please select a delivery address");
        }
      } else {
        const r = addrSchema.safeParse(addr);
        if (!r.success) return toast.error(r.error.issues[0].message);
      }

      if (!sameBilling) {
        const b = addrSchema.safeParse(billing);
        if (!b.success) return toast.error("Billing: " + b.error.issues[0].message);
      }
    }
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const place = async () => {
    setPlacing(true);
    try {
      const destinationAddress = `${shipAddr.street}, ${shipAddr.city || "Kathmandu"}, ${shipAddr.district || "Kathmandu"}, ${shipAddr.province || "Bagmati"}${
        shipAddr.landmark ? ` (Near ${shipAddr.landmark})` : ""
      }`;

      try {
        localStorage.setItem(SAVED_ADDR_CACHE_KEY, JSON.stringify({ ...shipAddr, is_default: true }));
      } catch {}

      let addressIdToSend: string | undefined = isUsingSaved ? (shipAddr as any).id : undefined;

      if (!isUsingSaved && saveCustom) {
        try {
          const shouldBeDefault = makeDefault || addresses.length === 0;
          const res = await api.post<any>("/addresses", {
            label: shouldBeDefault ? "Default Address" : "Custom Address",
            name: shipAddr.full_name,
            full_name: shipAddr.full_name,
            phone: shipAddr.phone,
            street: shipAddr.street,
            city: shipAddr.city || "Kathmandu",
            district: shipAddr.district || "Kathmandu",
            province: shipAddr.province || "Bagmati",
            landmark: shipAddr.landmark,
            latitude: shipAddr.latitude ?? null,
            longitude: shipAddr.longitude ?? null,
            is_default: shouldBeDefault,
          });
          if (res?.id) {
            addressIdToSend = res.id;
            setAddresses((prev) => [
              {
                ...shipAddr,
                id: res.id,
                is_default: shouldBeDefault,
              },
              ...prev.map((a) => (shouldBeDefault ? { ...a, is_default: false } : a)),
            ]);
          }
        } catch (addrErr) {
          console.warn("Could not save custom address to address book:", addrErr);
        }
      }

      const items =
        quote?.lines && quote.lines.length > 0
          ? quote.lines.map((l) => ({
              product_id: l.product_id,
              size: l.size ?? "",
              color: l.color ?? "",
              quantity: l.quantity,
              unit_price: l.unit_price,
              line_total: l.line_total,
              name: l.name,
              sku: l.sku,
              image: l.image,
            }))
          : cart.map((c) => ({
              product_id: c.product_id,
              size: c.size,
              color: c.color,
              quantity: c.quantity,
            }));

      let orderId: string | null = null;
      let orderNumber: string | null = null;

      try {
        const res = await api.post<any>("/orders", {
          address_id: addressIdToSend,
          address_snapshot: {
            full_name: shipAddr.full_name,
            phone: shipAddr.phone,
            street: shipAddr.street,
            city: shipAddr.city || "Kathmandu",
            district: shipAddr.district || "Kathmandu",
            province: shipAddr.province || "Bagmati",
            landmark: shipAddr.landmark ?? null,
            latitude: shipAddr.latitude ?? null,
            longitude: shipAddr.longitude ?? null,
          },
          billing_address: sameBilling ? null : billing,
          shipping_method: shipping,
          payment_method: "cod",
          coupon_code: applied || null,
          items,
          destination_address: destinationAddress,
          customer_email: user.email,
        });

        if (res?.order?.id) {
          orderId = res.order.id;
          orderNumber = res.order.order_number;
        }
      } catch (backendErr: any) {
        console.warn("Backend API /orders attempt:", backendErr?.message);
        throw backendErr;
      }

      await reloadCart();

      toast.success(`Order ${orderNumber || ""} placed successfully!`);
      void nav({ to: "/account/orders/$id", params: { id: orderId! }, search: { placed: true } });
    } catch (err: any) {
      console.error("Order placement error:", err);
      toast.error(err?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container-page py-4 sm:py-6 md:py-8">
      {/* ── Page Header & Title ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-foreground tracking-tight">
            Checkout
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
            Complete your order with Cash on Delivery across Nepal
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Lock className="h-3.5 w-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </span>
      </div>

      {/* ── Mobile-First Stepper (Compact Segmented Progress Bar on Mobile) ─ */}
      <div className="mt-4 sm:mt-6">
        {/* Mobile View (< 640px): Step title + segmented progress bar */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              Step {step + 1} of 4: <span className="text-primary">{steps[step]}</span>
            </span>
            <span className="text-muted-foreground font-mono">
              {Math.round(((step + 1) / 4) * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  i <= step ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        </div>

        {/* Tablet & Desktop View (>= 640px): Full connected stepper */}
        <ol className="hidden sm:flex items-center gap-2 text-sm" aria-label="Checkout steps">
          {steps.map((s, i) => (
            <li
              key={s}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all shadow-2xs",
                i === step && "border-primary bg-primary text-primary-foreground shadow-xs",
                i < step && "border-success/40 bg-success/10 text-success",
                i > step && "border-border text-muted-foreground bg-card"
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* ── Collapsible Mobile Order Summary Accordion (Mobile Only, lg:hidden) */}
      <div className="lg:hidden mt-4 rounded-xl border bg-card shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full flex items-center justify-between p-3.5 text-left transition hover:bg-muted/30 cursor-pointer"
          aria-expanded={showMobileSummary}
        >
          <div className="flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm">
            <ShoppingCart className="h-4 w-4" />
            <span>{showMobileSummary ? "Hide order summary" : "Show order summary"}</span>
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", showMobileSummary && "rotate-180")}
            />
          </div>
          <span className="font-bold text-sm sm:text-base text-foreground font-mono">
            {quote ? formatPrice(quote.total) : "—"}
          </span>
        </button>

        {showMobileSummary && (
          <div className="p-4 border-t bg-muted/15 space-y-4">
            {/* Items preview */}
            <ul className="divide-y border-y border-border/60">
              {(quote?.lines ?? []).map((l, idx) => (
                <li
                  key={`${l.product_id || idx}-${l.size || ""}-${l.color || ""}-${idx}`}
                  className="flex items-center gap-3 py-2.5 text-xs"
                >
                  <img
                    src={l.image || "/assets/products/canvas-tote.jpg"}
                    alt=""
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                    className="h-12 w-10 rounded object-cover bg-muted shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{translateProduct(l.name || "Item")}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {[l.size, l.color].filter(Boolean).join(" · ")} × {l.quantity || 1}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground font-mono shrink-0">
                    {formatPrice(l.line_total || 0)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Coupon Code Input */}
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setApplied(coupon);
              }}
            >
              <Input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Discount code or coupon"
                className="h-10 text-xs uppercase"
              />
              <Button type="submit" variant="outline" className="h-10 text-xs px-3 shrink-0">
                Apply
              </Button>
            </form>
            {quote?.coupon_error && applied && (
              <p className="text-xs text-destructive">{quote.coupon_error}</p>
            )}

            {/* Calculations */}
            <div>{quote ? <SummaryRows q={quote} /> : <SummaryRowsSkeleton />}</div>
          </div>
        )}
      </div>

      {/* ── Main Two-Column Layout ───────────────────────────────────────── */}
      <div className="mt-4 sm:mt-6 grid gap-6 lg:gap-8 lg:grid-cols-[1fr_380px] items-start">
        {/* Left Column: Active Step Form */}
        <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-xs">
          {/* ── STEP 0: DELIVERY ADDRESS ─────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Delivery Address</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Select your saved delivery address or enter a new custom drop-off point.
                </p>
              </div>

              {/* Mode Switcher: Saved vs Custom */}
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("saved");
                    const def = addresses.find((a) => a.is_default) || addresses[0];
                    if (def) setSelected(def.id);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-2.5 px-2 text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95",
                    locationMode === "saved"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                  <span className="truncate">Saved Address</span>
                  {addresses.length > 0 && (
                    <span className="rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-bold text-accent shrink-0">
                      {addresses.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("custom");
                    setSelected("custom");
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg py-2.5 px-2 text-xs sm:text-sm font-semibold transition cursor-pointer active:scale-95",
                    locationMode === "custom"
                      ? "bg-card text-foreground shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Navigation className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Custom Location</span>
                </button>
              </div>

              {/* MODE 1: Saved Addresses */}
              {locationMode === "saved" && addresses.length > 0 && (
                <div className="space-y-4">
                  {/* Default Address Highlight Banner */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 sm:p-3.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white font-bold text-xs shrink-0">
                        ✓
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 block truncate">
                          Primary Delivery Address Loaded
                        </span>
                        <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[11px] block truncate">
                          Ready for 1-click doorstep courier dispatch
                        </span>
                      </div>
                    </div>
                  </div>

                  <RadioGroup value={selected} onValueChange={setSelected} className="space-y-3">
                    {/* Default Address Card */}
                    {defaultAddress && (
                      <label
                        htmlFor={`addr-${defaultAddress.id}`}
                        className={cn(
                          "relative flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3.5 sm:p-4 text-xs transition",
                          selected === defaultAddress.id
                            ? "border-primary bg-primary/5 shadow-xs"
                            : "border-border hover:border-foreground/30 bg-card"
                        )}
                      >
                        <RadioGroupItem
                          value={defaultAddress.id}
                          id={`addr-${defaultAddress.id}`}
                          className="mt-0.5"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {defaultAddress.full_name}
                              </span>
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                                Default
                              </span>
                            </div>
                            <span className="text-xs font-mono text-muted-foreground shrink-0">
                              {defaultAddress.phone}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                            {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.district},{" "}
                            {defaultAddress.province} Province
                          </p>
                          {defaultAddress.landmark && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              <span className="font-medium text-foreground">Landmark:</span>{" "}
                              {defaultAddress.landmark}
                            </p>
                          )}
                        </div>
                      </label>
                    )}

                    {/* Other Saved Addresses */}
                    {otherAddresses.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Other Saved Addresses
                        </p>
                        <div className="space-y-2.5">
                          {otherAddresses.map((a) => (
                            <label
                              key={a.id}
                              htmlFor={`addr-${a.id}`}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-xs transition",
                                selected === a.id
                                  ? "border-primary bg-primary/5 shadow-xs"
                                  : "border-border hover:border-foreground/30 bg-card"
                              )}
                            >
                              <RadioGroupItem value={a.id} id={`addr-${a.id}`} className="mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <span className="font-semibold text-sm text-foreground truncate">
                                    {a.full_name}
                                  </span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs font-mono text-muted-foreground">{a.phone}</span>
                                    <button
                                      type="button"
                                      className="text-[11px] text-primary hover:underline cursor-pointer"
                                      onClick={(e) => handleSetAsDefault(a.id, e)}
                                    >
                                      Set as Default
                                    </button>
                                  </div>
                                </div>
                                <p className="mt-1 text-xs text-foreground/80 leading-relaxed">
                                  {a.street}, {a.city}, {a.district}, {a.province} Province
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </RadioGroup>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("custom");
                        setSelected("custom");
                      }}
                      className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Deliver to a custom / different location instead</span>
                    </button>
                    <Link to="/account/addresses" className="hover:underline">
                      Manage address book &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* MODE 1 EMPTY: No saved addresses yet */}
              {locationMode === "saved" && addresses.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">No saved delivery address yet</h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                      Enter your delivery address once, and DOVAN will automatically save it for 1-click checkout on future orders.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setLocationMode("custom");
                      setSelected("custom");
                      setMakeDefault(true);
                    }}
                    className="gap-2 text-xs h-10 font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Enter Delivery Address</span>
                  </Button>
                </div>
              )}

              {/* MODE 2: Custom Location */}
              {locationMode === "custom" && (
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="flex items-center justify-between pb-1 border-b">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLocationMode("saved");
                          const def = addresses.find((a) => a.is_default) || addresses[0];
                          if (def) setSelected(def.id);
                        }}
                        className="gap-1.5 text-xs text-primary hover:underline h-7 px-2 cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3" />
                        <span>Back to saved address</span>
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <Navigation className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Custom Delivery Location</p>
                        <p className="text-[11px] text-muted-foreground">
                          Specify a one-time location for this delivery
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-primary/15">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDetectGps}
                        disabled={detectingLocation}
                        className="h-8 gap-1.5 text-xs flex-1 sm:flex-initial"
                      >
                        {detectingLocation ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Compass className="h-3.5 w-3.5 text-accent" />
                        )}
                        <span>GPS Pin</span>
                      </Button>
                      {user && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAutofillProfile}
                          className="h-8 text-xs flex-1 sm:flex-initial"
                        >
                          Autofill Info
                        </Button>
                      )}
                    </div>
                  </div>

                  {addr.latitude && addr.longitude && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2 text-xs text-success">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>
                        Accurate GPS coordinates attached: {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}

                  <AddressFields value={addr} onChange={setAddr} />

                  <div className="space-y-2 pt-3 border-t text-xs sm:text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={saveCustom} onCheckedChange={(v) => setSaveCustom(Boolean(v))} />
                      <span>Save this location to my address book</span>
                    </label>
                    {saveCustom && (
                      <label className="flex items-center gap-2 cursor-pointer pl-6 text-xs text-muted-foreground">
                        <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(Boolean(v))} />
                        <span>Set as my default delivery address</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Address Toggle */}
              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer">
                  <Checkbox checked={sameBilling} onCheckedChange={(v) => setSameBilling(Boolean(v))} />
                  <span>Billing address matches delivery address</span>
                </label>
                {!sameBilling && (
                  <div className="mt-4 space-y-3 pt-3 border-t">
                    <h3 className="font-semibold text-sm text-foreground">Billing Address</h3>
                    <AddressFields value={billing} onChange={setBilling} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: SHIPPING METHOD ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Shipping Method</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Select your preferred delivery speed across Nepal.
                </p>
              </div>

              <RadioGroup
                value={shipping}
                onValueChange={(v) => setShipping(v as typeof shipping)}
                className="space-y-3"
              >
                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition shadow-2xs",
                    shipping === "standard"
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-foreground/30 bg-card"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RadioGroupItem value="standard" id="ship-std" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          Standard Shipping
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                          2–4 Days
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reliable courier delivery across all 77 districts
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm sm:text-base font-mono shrink-0">
                    {quote && shipping === "standard"
                      ? quote.shipping_fee
                        ? formatPrice(quote.shipping_fee)
                        : "FREE"
                      : formatPrice(150)}
                  </span>
                </label>

                <label
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition shadow-2xs",
                    shipping === "express"
                      ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-foreground/30 bg-card"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RadioGroupItem value="express" id="ship-exp" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          Express Courier
                        </span>
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Priority
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Priority same-day dispatch in Kathmandu valley
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-sm sm:text-base font-mono shrink-0">
                    {formatPrice(250)}
                  </span>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* ── STEP 2: PAYMENT METHOD ───────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Payment Method</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Cash on delivery is active across all 77 districts of Nepal.
                </p>
              </div>

              <RadioGroup value="cod" className="space-y-3">
                {/* Active: Cash on Delivery */}
                <label className="relative flex cursor-pointer items-start gap-3 sm:gap-4 rounded-xl border-2 border-primary bg-primary/5 p-4 shadow-xs transition">
                  <div className="pt-0.5">
                    <RadioGroupItem value="cod" id="payment-cod" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-5 w-5 text-accent" />
                        <span className="font-bold text-base text-foreground">Cash on Delivery (COD)</span>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Active Nationwide
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Pay with cash or scan the courier's Fonepay/QR upon doorstep arrival across all 77 districts of Nepal.
                    </p>
                  </div>
                </label>

                {/* Coming Soon: eSewa */}
                <div className="relative flex items-start gap-3 sm:gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 opacity-75 select-none">
                  <div className="pt-0.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/40 bg-background/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded bg-[#60bb46] text-[10px] font-bold text-white shadow-xs">
                          e
                        </span>
                        <span className="font-semibold text-base text-foreground">eSewa EPAY v2</span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#60bb46]/30 bg-[#60bb46]/10 px-2.5 py-0.5 text-xs font-semibold text-[#3d8327]">
                        <Clock className="h-3 w-3" /> Coming Soon
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Direct online wallet and mobile banking checkout with instant verification.
                    </p>
                  </div>
                </div>

                {/* Coming Soon: Khalti */}
                <div className="relative flex items-start gap-3 sm:gap-4 rounded-xl border border-dashed border-border/80 bg-muted/30 p-4 opacity-75 select-none">
                  <div className="pt-0.5">
                    <span className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/40 bg-background/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-5 w-5 place-items-center rounded bg-[#5d2e8e] text-[10px] font-bold text-white shadow-xs">
                          K
                        </span>
                        <span className="font-semibold text-base text-foreground">Khalti v2</span>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[#5d2e8e]/30 bg-[#5d2e8e]/10 px-2.5 py-0.5 text-xs font-semibold text-[#5d2e8e]">
                        <Clock className="h-3 w-3" /> Coming Soon
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      Khalti wallet, SCT debit cards, and connectIPS online gateway.
                    </p>
                  </div>
                </div>
              </RadioGroup>

              <div className="flex items-center gap-2.5 rounded-xl border bg-secondary/30 p-3 sm:p-3.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-accent" />
                <span>
                  All orders are encrypted. No upfront payment is required for Cash on Delivery.
                </span>
              </div>
            </div>
          )}

          {/* ── STEP 3: REVIEW ORDER ─────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">Review Your Order</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  Verify your delivery details and order line items before confirmation.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs sm:text-sm">
                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Deliver to
                    </p>
                    {isUsingSaved && shipAddr.is_default ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        Default
                      </span>
                    ) : !isUsingSaved ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Custom
                      </span>
                    ) : null}
                  </div>
                  <p className="font-semibold text-foreground">
                    {shipAddr.full_name} · <span className="font-mono text-xs text-muted-foreground">{shipAddr.phone}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {shipAddr.street}, {shipAddr.city}, {shipAddr.district}, {shipAddr.province} Province
                  </p>
                  {shipAddr.landmark && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">Landmark:</span> {shipAddr.landmark}
                    </p>
                  )}
                  {shipAddr.latitude && shipAddr.longitude && (
                    <p className="mt-1 text-[11px] text-success font-mono">
                      📍 GPS: {shipAddr.latitude.toFixed(4)}, {shipAddr.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border bg-muted/30 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Shipping & Payment
                  </p>
                  <p className="font-semibold text-foreground">
                    {shipping === "express" ? "Express Courier (24-48 hrs)" : "Standard Shipping (2-4 days)"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cash on Delivery (Pay at doorstep)
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Items ({(quote?.lines ?? []).length})
                </p>
                <ul className="divide-y border-y border-border/60">
                  {(quote?.lines ?? []).map((l, idx) => (
                    <li
                      key={`${l.product_id || idx}-${l.size || ""}-${l.color || ""}-${idx}`}
                      className="flex items-center gap-3 py-3 text-sm"
                    >
                      <img
                        src={l.image || "/assets/products/canvas-tote.jpg"}
                        alt=""
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                        className="h-14 w-11 rounded-md object-cover bg-muted shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{translateProduct(l.name || "Item")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[l.size, l.color].filter(Boolean).join(" · ")} × {l.quantity || 1}
                        </p>
                      </div>
                      <span className="font-semibold text-foreground font-mono shrink-0">
                        {formatPrice(l.line_total || 0)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ── Navigation Bottom Bar ────────────────────────────────────── */}
          <div className="mt-6 sm:mt-8 flex items-center justify-between gap-3 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
              className="h-11 px-4 sm:px-6 font-semibold cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              <span>Back</span>
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                onClick={next}
                className="h-11 px-6 sm:px-8 font-semibold cursor-pointer flex-1 sm:flex-initial"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                disabled={placing || !!err}
                onClick={place}
                className="h-11 px-6 sm:px-8 font-semibold cursor-pointer flex-1 sm:flex-initial bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                {placing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  `Place Order · ${quote ? formatPrice(quote.total) : ""}`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Desktop Sticky Order Summary (hidden lg:block) ── */}
        <aside className="hidden lg:block h-fit rounded-2xl border bg-card p-6 shadow-xs sticky top-20">
          <h2 className="text-lg font-bold text-foreground">Order Summary</h2>

          {/* Coupon Code Input */}
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
              placeholder="Coupon code"
              className="h-10 text-xs uppercase"
              aria-label="Coupon code"
            />
            <Button variant="outline" className="h-10 text-xs px-3.5">
              Apply
            </Button>
          </form>

          {quote?.coupon_error && applied && (
            <p className="mt-2 text-xs text-destructive">{quote.coupon_error}</p>
          )}

          {/* Calculations Breakdown */}
          <div className="mt-5">{quote ? <SummaryRows q={quote} /> : <SummaryRowsSkeleton />}</div>

          {err && <p className="mt-3 text-xs text-destructive">{err}</p>}

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Guaranteed genuine products with 7-day hassle-free returns.</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
