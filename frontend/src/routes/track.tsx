import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { Timeline } from "@/components/site/Timeline";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track your order — DOVAN" },
      { name: "description", content: "Track a DOVAN order with your order number and phone number." },
      { property: "og:title", content: "Track your order — DOVAN" },
      { property: "og:description", content: "Track a DOVAN order with your order number and phone number." },
    ],
  }),
  component: Track,
});

type T = {
  order_number: string;
  status: string;
  created_at: string;
  estimated_delivery: string;
  tracking_number: string | null;
  city: string;
  district: string;
  items: { name: string; quantity: number; image: string }[];
  events: { status: string; created_at: string }[];
};

function Track() {
  const { t, formatStatus, isNepali, translateProduct } = useI18n();
  const [num, setNum] = useState("");
  const [phone, setPhone] = useState("");
  const [res, setRes] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.get<T>(`/orders/track?order_number=${encodeURIComponent(num.trim())}&phone=${encodeURIComponent(phone.trim())}`);
      setBusy(false);
      if (!data) {
        setRes(null);
        return toast.error(
          isNepali ? "उल्लेखित विवरण भएको कुनै अर्डर भेटिएन" : "No order found with those details"
        );
      }
      setRes(data);
    } catch (err: any) {
      setBusy(false);
      setRes(null);
      return toast.error(
        isNepali ? "उल्लेखित विवरण भएको कुनै अर्डर भेटिएन" : (err?.message || "No order found with those details")
      );
    }
  };

  return (
    <div className="container-page max-w-4xl py-8 md:py-10">
      <h1 className="text-4xl font-display">{t("track_title")}</h1>
      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 rounded-md border bg-card p-6 shadow-xs sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div>
          <Label htmlFor="t-num">{t("order_number")}</Label>
          <Input
            id="t-num"
            required
            placeholder="DV10001"
            value={num}
            onChange={(e) => setNum(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="t-phone">{t("phone_used")}</Label>
          <Input
            id="t-phone"
            required
            placeholder="98XXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <Button disabled={busy}>{t("track_btn")}</Button>
      </form>
      {res && (
        <div className="mt-8 rounded-md border bg-card p-6 shadow-xs">
          <div className="flex flex-wrap justify-between gap-4 text-sm">
            <div>
              <p className="eyebrow">{isNepali ? "अर्डर" : "Order"}</p>
              <p className="font-display text-2xl font-bold">{res.order_number}</p>
            </div>
            <div>
              <p className="eyebrow">{t("order_status")}</p>
              <p className="font-medium text-accent">{formatStatus(res.status)}</p>
            </div>
            <div>
              <p className="eyebrow">{t("order_placed_on")}</p>
              <p>{new Date(res.created_at).toLocaleDateString(isNepali ? "ne-NP" : "en-US")}</p>
            </div>
            <div>
              <p className="eyebrow">{t("est_delivery")}</p>
              <p>{res.estimated_delivery}</p>
            </div>
            <div>
              <p className="eyebrow">{t("ship_to")}</p>
              <p>{res.city}, {res.district}</p>
            </div>
            {res.tracking_number && (
              <div>
                <p className="eyebrow">{t("tracking_num")}</p>
                <p>{res.tracking_number}</p>
              </div>
            )}
          </div>
          <div className="mt-8">
            <Timeline status={res.status} events={res.events} />
          </div>
          <ul className="mt-8 flex flex-wrap gap-3 border-t pt-6">
            {res.items?.map((i) => (
              <li key={i.name} className="flex items-center gap-2 rounded-md border bg-muted/40 p-2 text-sm">
                <img src={i.image} alt="" className="h-12 w-10 rounded object-cover bg-muted" />
                <span>
                  {translateProduct(i.name)} × {i.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
