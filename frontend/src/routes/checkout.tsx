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
    <div className="container-page py-8 md:py-12">
      <div className="space-y-2 mb-8">
        <Skeleton className="h-9 w-48 rounded" />
        <Skeleton className="h-4 w-72 rounded" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-40 rounded" />
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-36 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
              <Skeleton className="h-16 rounded-lg" />
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32 rounded" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>

        <aside className="rounded-xl border bg-card p-6 space-y-5 h-fit">
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

function CheckoutErrorBoundary({ reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="container-page py-16 max-w-md mx-auto text-center space-y-4">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary text-2xl font-bold">
        ✓
      </div>
      <h1 className="text-2xl font-display font-semibold">Checkout Session Notice</h1>
      <p className="text-sm text-muted-foreground">
        Your cart items are completely safe. Please review your cart or try reloading the checkout steps.
      </p>
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
  const { t, isNepali, translateProvince } = useI18n();
  const f = (k: keyof Addr) => ({
    value: (value[k] as string) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...value, [k]: e.target.value }),
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="a-name">{t("full_name")}</Label>
        <Input id="a-name" placeholder={isNepali ? "पूरा नाम" : "Recipient full name"} {...f("full_name")} />
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
        <Input id="a-district" placeholder={isNepali ? "उदा. काठमाडौं" : "e.g. Kathmandu"} {...f("district")} />
      </div>
      <div>
        <Label htmlFor="a-city">{t("city_municipality")}</Label>
        <Input id="a-city" placeholder={isNepali ? "उदा. काठमाडौं महानगर" : "e.g. Kathmandu Metro"} {...f("city")} />
      </div>
      <div>
        <Label htmlFor="a-street">{t("street_tole")}</Label>
        <Input id="a-street" placeholder={isNepali ? "उदा. नयाँ सडक, पुरानो बजार" : "e.g. New Road, Ward 22"} {...f("street")} />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="a-landmark">{t("landmark_optional")}</Label>
        <Input id="a-landmark" placeholder={isNepali ? "उदा. मन्दिर नजिक वा स्कुल अगाडि" : "e.g. Near Big Bell, opposite bank"} {...f("landmark")} />
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

  // Address selection state
  const [addresses, setAddresses] = useState<(Addr & { id: string; label?: string; is_default: boolean })[]>(() => {
    // Initial sync read from localStorage cache so address is visible immediately without delay
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

  const steps = isNepali
    ? ["ठेगाना", "डेलिभरी", "भुक्तानी", "पुनरावलोकन"]
    : ["Address", "Shipping", "Payment", "Review"];

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
            const recovered = {
              id: "recovered_default",
              full_name: snap.full_name || snap.name || user.user_metadata?.full_name || "Customer",
              phone: snap.phone || user.phone || "9800000000",
              street: snap.street || dest.split(",")[0]?.trim() || dest || "Main Road",
              city: snap.city || dest.split(",")[1]?.trim() || "Kathmandu",
              district: snap.district || dest.split(",")[2]?.trim() || "Kathmandu",
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
          // If no address at all anywhere, check cached in memory or open custom mode
          setSelected((prev) => (prev !== "custom" && addresses.length > 0 ? prev : "custom"));
          setLocationMode((prev) => (addresses.length > 0 ? "saved" : "custom"));
          setMakeDefault(true);
        }
      } catch {
        // Keep whatever cached address is already loaded in state
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
    toast.success(isNepali ? "तपाईंको प्रोफाइलबाट नाम र फोन भरियो" : "Autofilled name & phone from your profile");
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error(isNepali ? "ब्राउजरमा जियोलोकेसन उपलब्ध छैन" : "Geolocation not supported by your browser");
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
        toast.success(
          isNepali
            ? `सटीक स्थान पत्ता लाग्यो (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
            : `GPS Location attached (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
        );
        setDetectingLocation(false);
      },
      (error) => {
        setDetectingLocation(false);
        toast.error(
          isNepali
            ? "स्थान पत्ता लगाउन सकिएन। कृपया ब्राउजर स्थान अनुमति दिनुहोस्।"
            : "Could not detect GPS location. Please allow browser location access."
        );
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
      toast.success(isNepali ? "पूर्वनिर्धारित ठेगाना सेट गरियो" : "Default address updated");
    } catch {
      toast.error(isNepali ? "पूर्वनिर्धारित बनाउन सकिएन" : "Could not set as default");
    }
  };

  if (!authReady) return <CheckoutPageSkeleton />;

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
          return toast.error(isNepali ? "कृपया डेलिभरी ठेगाना छान्नुहोस्" : "Please select a delivery address");
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
  };

  const place = async () => {
    setPlacing(true);
    try {
      const destinationAddress = `${shipAddr.street}, ${shipAddr.city || "Kathmandu"}, ${shipAddr.district || "Kathmandu"}, ${shipAddr.province || "Bagmati"}${
        shipAddr.landmark ? ` (Near ${shipAddr.landmark})` : ""
      }`;

      // Always remember active delivery address in localStorage for fast future checkouts
      try {
        localStorage.setItem(SAVED_ADDR_CACHE_KEY, JSON.stringify({ ...shipAddr, is_default: true }));
      } catch {}

      let addressIdToSend: string | undefined = isUsingSaved ? (shipAddr as any).id : undefined;

      // If user selected custom location and wants to save it
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

      // Build order items with full snapshots from quote / cart
      const items =
        quote?.lines && quote.lines.length > 0
          ? quote.lines.map((l) => ({
              product_id: l.product_id,
              title: l.name,
              name: l.name,
              price: l.unit_price,
              price_paise: Math.round(l.unit_price * 100),
              quantity: l.quantity,
              unit: "1 kg",
            }))
          : cart.map((c) => ({
              product_id: c.product_id,
              quantity: c.quantity,
            }));

      let orderId: string | null = null;
      let orderNumber: string | null = null;

      try {
        const res = await api.post<{ order_id: string; order_number?: string }>("/orders", {
          address_id: addressIdToSend,
          delivery_slot: shipping === "express" ? "Express (30 Mins)" : "Standard (2-4 Hours)",
          payment_method: "Cash on Delivery",
          slot_fee_paise: shipping === "express" ? 5000 : 0,
          destination_address: destinationAddress,
          destination_latitude: shipAddr.latitude ?? null,
          destination_longitude: shipAddr.longitude ?? null,
          user_latitude: shipAddr.latitude ?? null,
          user_longitude: shipAddr.longitude ?? null,
          items,
        });
        orderId = res.order_id;
        orderNumber = res.order_number || `DOV-${orderId?.substring(0, 8).toUpperCase()}`;
      } catch (postErr: any) {
        console.warn("Backend API /orders unavailable, falling back to direct database placement:", postErr);
        // Direct Supabase RPC place_order fallback
        const { data: rpcRes, error: rpcErr } = await supabase.rpc("place_order", {
          p_account_id: user.id,
          p_address_snapshot: {
            address: destinationAddress,
            full_name: shipAddr.full_name,
            phone: shipAddr.phone,
            street: shipAddr.street,
            city: shipAddr.city,
            district: shipAddr.district,
            province: shipAddr.province,
            landmark: shipAddr.landmark ?? null,
            latitude: shipAddr.latitude ?? null,
            longitude: shipAddr.longitude ?? null,
          },
          p_delivery_slot: shipping === "express" ? "Express (30 Mins)" : "Standard (2-4 Hours)",
          p_payment_method: "Cash on Delivery",
          p_delivery_fee_paise: 4000,
          p_platform_fee_paise: 1000,
          p_slot_fee_paise: shipping === "express" ? 5000 : 0,
          p_device_address: shipAddr.latitude ? `GPS: ${shipAddr.latitude.toFixed(4)}, ${shipAddr.longitude?.toFixed(4)}` : "Device Location Unknown",
          p_device_lat: shipAddr.latitude ?? null,
          p_device_lng: shipAddr.longitude ?? null,
          p_dest_address: destinationAddress,
          p_dest_lat: shipAddr.latitude ?? null,
          p_dest_lng: shipAddr.longitude ?? null,
          p_direct_items: items,
        });

        if (rpcErr || !(rpcRes as any)?.success) {
          throw new Error(rpcErr?.message || (rpcRes as any)?.error || postErr?.message || "Failed to place order.");
        }

        orderId = (rpcRes as any).order_id;
        orderNumber = `DOV-${orderId?.substring(0, 8).toUpperCase()}`;
      }

      await reloadCart();

      toast.success(
        isNepali
          ? `अर्डर ${orderNumber} सफलतापूर्वक सम्पन्न भयो!`
          : `Order ${orderNumber} placed!`
      );
      void nav({ to: "/account/orders/$id", params: { id: orderId! }, search: { placed: true } });
    } catch (err: any) {
      console.error("Order placement error:", err);
      toast.error(err?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
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
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold">{t("delivery_address")}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isNepali
                    ? "आफ्नो पूर्वनिर्धारित ठेगाना प्रयोग गर्नुहोस् वा यो अर्डरका लागि नयाँ अनुकूलित ठेगाना प्रविष्ट गर्नुहोस्।"
                    : "Use your default saved address or specify a custom location for this order."}
                </p>
              </div>

              {/* Mode Switcher: Saved/Default vs Custom Location */}
              <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/60 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLocationMode("saved");
                    const def = addresses.find((a) => a.is_default) || addresses[0];
                    if (def) setSelected(def.id);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium transition cursor-pointer",
                    locationMode === "saved"
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>{isNepali ? "सुरक्षित मुख्य ठेगाना" : "Use Saved Location"}</span>
                  {addresses.length > 0 && (
                    <span className="hidden sm:inline-block rounded-full bg-accent/15 px-1.5 py-0.2 text-[10px] font-semibold text-accent">
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
                    "flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-medium transition cursor-pointer",
                    locationMode === "custom"
                      ? "bg-card text-foreground font-semibold shadow-xs border border-border"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Navigation className="h-4 w-4 text-primary" />
                  <span>{isNepali ? "नयाँ / अनुकूलित ठेगाना" : "Custom Location"}</span>
                </button>
              </div>

              {/* Mode 1: Saved / Default Addresses */}
              {locationMode === "saved" && addresses.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500 text-white font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {isNepali ? "सुरक्षित ठेगाना प्रयोग गरिँदैछ" : "Using Your Saved Location"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isNepali ? "यो अर्डर तपाईंको पूर्वनिर्धारित ठेगानामा डेलिभर हुनेछ।" : "Your order will be delivered to this saved location."}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={next}
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium cursor-pointer"
                    >
                      <span>{isNepali ? "डेलिभरीमा जानुहोस्" : "Continue with This Address"} &rarr;</span>
                    </Button>
                  </div>

                  {defaultAddress && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {isNepali ? "पूर्वनिर्धारित मुख्य ठेगाना" : "Default Delivery Address"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent bg-accent/15 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-current" />
                          {isNepali ? "पूर्वनिर्धारित" : "Default"}
                        </span>
                      </div>

                      <div
                        onClick={() => setSelected(defaultAddress.id)}
                        className={cn(
                          "relative flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition",
                          selected === defaultAddress.id
                            ? "border-emerald-500 bg-emerald-500/5 shadow-xs"
                            : "border-border hover:border-border/80 bg-card"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value={defaultAddress.id}
                            checked={selected === defaultAddress.id}
                            onClick={() => setSelected(defaultAddress.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-base">{defaultAddress.full_name}</span>
                              <span className="text-xs font-mono text-muted-foreground">{defaultAddress.phone}</span>
                            </div>
                            <p className="mt-1.5 text-sm text-foreground/90">
                              {defaultAddress.street}, {defaultAddress.city}, {defaultAddress.district},{" "}
                              {translateProvince(defaultAddress.province)}
                            </p>
                            {defaultAddress.landmark && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                <span className="font-medium text-foreground/80">{isNepali ? "ल्यान्डमार्क:" : "Landmark:"}</span>{" "}
                                {defaultAddress.landmark}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
                          <Button
                            type="button"
                            onClick={next}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm h-9 cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                            <span>{isNepali ? "यो सुरक्षित ठेगानामा डेलिभरी गर्नुहोस्" : "Deliver to this saved location"} &rarr;</span>
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            {isNepali ? "१-क्लिक छिटो डेलिभरी" : "1-Click fast checkout"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Other saved addresses if multiple */}
                  {otherAddresses.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {isNepali ? "अन्य सुरक्षित गरिएका ठेगानाहरू" : "Other Saved Addresses"}
                      </span>
                      <div className="space-y-2">
                        {otherAddresses.map((a) => (
                          <label
                            key={a.id}
                            className={cn(
                              "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5 transition",
                              selected === a.id
                                ? "border-foreground bg-secondary/30"
                                : "border-border hover:border-foreground/40 bg-card"
                            )}
                          >
                            <RadioGroupItem
                              value={a.id}
                              checked={selected === a.id}
                              onClick={() => setSelected(a.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-medium text-sm">{a.full_name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">{a.phone}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-accent"
                                    onClick={(e) => handleSetAsDefault(a.id, e)}
                                  >
                                    {isNepali ? "पूर्वनिर्धारित बनाउनुहोस्" : "Make Default"}
                                  </Button>
                                </div>
                              </div>
                              <p className="mt-1 text-xs text-foreground/80">
                                {a.street}, {a.city}, {a.district}, {translateProvince(a.province)}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        setLocationMode("custom");
                        setSelected("custom");
                      }}
                      className="flex items-center gap-1 font-medium text-accent hover:underline cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {isNepali ? "यो अर्डरका लागि नयाँ / अनुकूलित ठेगाना प्रयोग गर्नुहोस्" : "Deliver to a custom / different location instead"}
                    </button>
                    <Link to="/account/addresses" className="hover:underline">
                      {isNepali ? "ठेगाना पुस्तिका व्यवस्थापन" : "Manage address book"} &rarr;
                    </Link>
                  </div>
                </div>
              )}

              {/* Mode 1 Empty State: when no saved addresses exist yet */}
              {locationMode === "saved" && addresses.length === 0 && (
                <div className="rounded-xl border border-dashed border-border p-6 text-center space-y-3">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">
                      {isNepali ? "कुनै सुरक्षित ठेगाना फेला परेन" : "No saved delivery address yet"}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                      {isNepali
                        ? "एकपटक आफ्नो ठेगाना प्रविष्ट गर्नुहोस्, र DOVAN ले तपाईंको आगामी सबै अर्डरहरूका लागि यसलाई सुरक्षित राख्नेछ।"
                        : "Enter your delivery address once, and DOVAN will automatically save it for 1-click checkout on all future orders."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      setLocationMode("custom");
                      setSelected("custom");
                      setMakeDefault(true);
                    }}
                    className="gap-2 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {isNepali ? "ठेगाना प्रविष्ट गर्नुहोस्" : "Enter Delivery Address"}
                  </Button>
                </div>
              )}

              {/* Mode 2: Custom Location */}
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
                        className="gap-1.5 text-xs text-accent hover:underline h-7 px-2 cursor-pointer"
                      >
                        <span>&larr; {isNepali ? "मेरो सुरक्षित ठेगानामा फर्कनुहोस्" : "Back to my saved location"}</span>
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Navigation className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">
                          {isNepali ? "अनुकूलित डेलिभरी स्थान" : "Custom Delivery Location"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isNepali
                            ? "यो अर्डरका लागि छुट्टै स्थान प्रविष्ट गर्नुहोस्। तपाईंको पूर्वनिर्धारित ठेगाना सुरक्षित रहनेछ।"
                            : "Specify a custom delivery location for this order."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDetectGps}
                        disabled={detectingLocation}
                        className="h-8 gap-1.5 text-xs"
                      >
                        {detectingLocation ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Compass className="h-3.5 w-3.5 text-accent" />
                        )}
                        {isNepali ? "GPS स्थान पत्ता लगाउनुहोस्" : "Detect GPS Pin"}
                      </Button>
                      {user && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleAutofillProfile}
                          className="h-8 text-xs"
                        >
                          {isNepali ? "प्रोफाइलबाट नाम र फोन" : "Autofill Info"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {addr.latitude && addr.longitude && (
                    <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3.5 py-2 text-xs text-success">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>
                        {isNepali ? "सटीक GPS समन्वय प्राप्त भयो:" : "Accurate GPS coordinates attached:"}{" "}
                        {addr.latitude.toFixed(4)}, {addr.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}

                  <AddressFields value={addr} onChange={setAddr} />

                  <div className="space-y-2 pt-3 border-t text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={saveCustom} onCheckedChange={(v) => setSaveCustom(Boolean(v))} />
                      <span>{isNepali ? "यो ठेगाना भविष्यका अर्डरहरूका लागि सुरक्षित गर्नुहोस्" : "Save this location to my address book"}</span>
                    </label>
                    {saveCustom && (
                      <label className="flex items-center gap-2 cursor-pointer pl-6 text-xs text-muted-foreground">
                        <Checkbox checked={makeDefault} onCheckedChange={(v) => setMakeDefault(Boolean(v))} />
                        <span>{isNepali ? "यसलाई मेरो नयाँ पूर्वनिर्धारित मुख्य ठेगाना बनाउनुहोस्" : "Set as my new default delivery address"}</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Billing address section */}
              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={sameBilling} onCheckedChange={(v) => setSameBilling(Boolean(v))} />
                  <span>{t("billing_same_as_delivery")}</span>
                </label>
                {!sameBilling && (
                  <div className="mt-4 space-y-2">
                    <h3 className="font-medium text-sm">{t("billing_address")}</h3>
                    <AddressFields value={billing} onChange={setBilling} />
                  </div>
                )}
              </div>
            </div>
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
                <div className="rounded-lg border bg-muted/30 p-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="eyebrow">{isNepali ? "डेलिभरी ठेगाना" : "Deliver to"}</p>
                    {isUsingSaved && shipAddr.is_default ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        {isNepali ? "पूर्वनिर्धारित ठेगाना" : "Default Location"}
                      </span>
                    ) : !isUsingSaved ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {isNepali ? "अनुकूलित ठेगाना" : "Custom Location"}
                      </span>
                    ) : null}
                  </div>
                  <p className="font-semibold text-foreground">
                    {shipAddr.full_name} · <span className="font-mono text-xs text-muted-foreground">{shipAddr.phone}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {shipAddr.street}, {shipAddr.city}, {shipAddr.district},{" "}
                    {translateProvince(shipAddr.province)}
                  </p>
                  {shipAddr.landmark && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground">{isNepali ? "ल्यान्डमार्क:" : "Landmark:"}</span> {shipAddr.landmark}
                    </p>
                  )}
                  {shipAddr.latitude && shipAddr.longitude && (
                    <p className="mt-1 text-[11px] text-success font-mono">
                      📍 GPS: {shipAddr.latitude.toFixed(4)}, {shipAddr.longitude.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/30 p-3.5">
                  <p className="eyebrow mb-1">{isNepali ? "डेलिभरी तथा भुक्तानी" : "Shipping · Payment"}</p>
                  <p className="font-semibold text-foreground">
                    {shipping === "express" ? t("express_shipping") : t("standard_shipping")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("cod_label")} ({isNepali ? "सामान आइपुगेपछि भुक्तानी" : "Pay on Doorstep Delivery"})
                  </p>
                </div>
              </div>

              <ul className="mt-6 divide-y border-y">
                {(quote?.lines ?? []).map((l, idx) => (
                  <li key={`${l.product_id || idx}-${l.size || ""}-${l.color || ""}-${idx}`} className="flex items-center gap-3 py-3 text-sm">
                    <img
                      src={l.image || "/assets/products/canvas-tote.jpg"}
                      alt=""
                      onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                      className="h-14 w-11 rounded object-cover bg-muted"
                    />
                    <span className="flex-1">
                      {translateProduct(l.name || "Item")}
                      <span className="block text-xs text-muted-foreground">
                        {[l.size, l.color].filter(Boolean).join(" · ")} × {l.quantity || 1}
                      </span>
                    </span>
                    <span className="font-semibold">{formatPrice(l.line_total || 0)}</span>
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
            {quote ? <SummaryRows q={quote} /> : <SummaryRowsSkeleton />}
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
