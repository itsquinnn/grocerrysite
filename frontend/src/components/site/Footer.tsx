import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid, Heart, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "./Logo";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function Newsletter() {
  const { isNepali } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return toast.error(isNepali ? "कृपया मान्य इमेल प्रविष्ट गर्नुहोस्" : "Please enter a valid email");
    }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.toLowerCase().trim() });
    setBusy(false);
    if (error && error.code !== "23505") {
      return toast.error(isNepali ? "दर्ता हुन सकेन, कृपया पुनः प्रयास गर्नुहोस्" : "Could not subscribe, please try again");
    }
    toast.success(
      error
        ? (isNepali ? "तपाईं पहिले नै दर्ता भइसक्नुभएको छ" : "You're already subscribed")
        : (isNepali ? "दर्ता भयो! नयाँ अफरहरू तपाईंको इमेलमा पठाइनेछ।" : "Subscribed! Watch your inbox for offers.")
    );
    setEmail("");
  };

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2">
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <input
        id="nl-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={isNepali ? "तपाईंको इमेल ठेगाना" : "you@example.com"}
        className="h-11 flex-1 rounded-md border bg-card px-3 text-sm text-foreground outline-none focus:border-ring"
      />
      <Button type="submit" variant="secondary" className="h-11" disabled={busy}>
        {isNepali ? "सदस्यता लिनुहोस्" : "Subscribe"}
      </Button>
    </form>
  );
}

export function Footer() {
  const { isNepali } = useI18n();

  const columns = isNepali
    ? [
        {
          t: "किनमेल",
          l: [
            ["सबै उत्पादनहरू", "/shop"],
            ["चाडपर्व अफरहरू", "/offers"],
            ["तुलना गर्नुहोस्", "/compare"],
            ["इच्छा सूची", "/wishlist"],
            ["शपिङ कार्ट", "/cart"],
          ],
        },
        {
          t: "हाम्रोबारे",
          l: [
            ["हाम्रो कथा", "/about"],
            ["स्टोरहरू", "/stores"],
            ["हस्तकला साझेदार", "/about"],
            ["७७ जिल्ला डेलिभरी", "/stores"],
          ],
        },
        {
          t: "सहायता",
          l: [
            ["अर्डर ट्र्याक", "/track"],
            ["ग्राहक सहायता", "/support"],
            ["प्रायः सोधिने प्रश्न", "/faq"],
          ],
        },
        {
          t: "नियम तथा नीति",
          l: [
            ["डेलिभरी नीति", "/policies/shipping"],
            ["फिर्ता र रिफन्ड", "/policies/returns"],
            ["नियम तथा सर्तहरू", "/policies/terms"],
            ["गोपनीयता नीति", "/policies/privacy"],
          ],
        },
      ]
    : [
        {
          t: "Shop",
          l: [
            ["All products", "/shop"],
            ["Festival offers", "/offers"],
            ["Compare items", "/compare"],
            ["Wishlist", "/wishlist"],
            ["Shopping cart", "/cart"],
          ],
        },
        {
          t: "About",
          l: [
            ["Our story", "/about"],
            ["Store locations", "/stores"],
            ["Artisan partners", "/about"],
            ["77 Districts", "/stores"],
          ],
        },
        {
          t: "Help",
          l: [
            ["Track order", "/track"],
            ["Customer support", "/support"],
            ["FAQ", "/faq"],
          ],
        },
        {
          t: "Policies",
          l: [
            ["Shipping", "/policies/shipping"],
            ["Returns & refunds", "/policies/returns"],
            ["Terms", "/policies/terms"],
            ["Privacy", "/policies/privacy"],
          ],
        },
      ];

  return (
    <footer className="mt-14 md:mt-16 bg-primary pb-20 text-primary-foreground md:pb-0 no-print">
      <div className="container-edge grid gap-8 py-10 md:grid-cols-6 md:py-12">
        <div className="md:col-span-2">
          <Logo className="text-primary-foreground" />
          <p className="mt-4 max-w-sm text-sm opacity-75">
            {isNepali
              ? "नेपाली मौलिकता र आधुनिक जीवनशैलीका लागि उत्कृष्ट सामग्री। ७७ वटै जिल्लामा क्यास अन डेलिभरी सुविधा।"
              : "Considered goods for modern Nepali homes and wardrobes. Delivered across all 77 districts with Cash on Delivery."}
          </p>
          <p className="mt-3 text-sm opacity-75">support@dovan.com.np · +977 1 4220192</p>
        </div>
        {columns.map((col) => (
          <div key={col.t}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] opacity-60">{col.t}</p>
            <ul className="space-y-2 text-sm">
              {col.l.map(([label, href]) => (
                <li key={label}>
                  <Link to={href} className="opacity-85 hover:opacity-100 hover:underline transition-opacity">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container-edge flex flex-col gap-2 py-4 text-xs opacity-60 sm:flex-row sm:justify-between sm:items-center">
          <span>© {new Date().getFullYear()} DOVAN. {isNepali ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}</span>
          <span>
            {isNepali
              ? "नेपालका सबै ७७ जिल्लामा क्यास अन डेलिभरी उपलब्ध · सबै करहरू समावेश"
              : "Cash on Delivery across all 77 districts · Prices include all applicable charges"}
          </span>
        </div>
      </div>
    </footer>
  );
}

export function BottomNav() {
  const { cartCount, wishlist, user, setCartOpen } = useShop();
  const { t } = useI18n();
  const item = "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card md:hidden no-print" aria-label="Mobile navigation">
      <Link to="/" className={item} activeProps={{ className: "text-accent font-semibold" }} activeOptions={{ exact: true }}>
        <Home className="h-5 w-5" />
        <span>{t("home")}</span>
      </Link>
      <Link to="/shop" className={item} activeProps={{ className: "text-accent font-semibold" }}>
        <LayoutGrid className="h-5 w-5" />
        <span>{t("shop")}</span>
      </Link>
      <Link to="/wishlist" className={item} activeProps={{ className: "text-accent font-semibold" }}>
        <Heart className="h-5 w-5" />
        <span>{t("saved")}{wishlist.length ? ` (${wishlist.length})` : ""}</span>
      </Link>
      <button onClick={() => setCartOpen(true)} className={item}>
        <ShoppingBag className="h-5 w-5" />
        <span>{t("cart")}{cartCount ? ` (${cartCount})` : ""}</span>
      </button>
      <Link to={user ? "/account" : "/login"} className={item} activeProps={{ className: "text-accent font-semibold" }}>
        <User className="h-5 w-5" />
        <span>{user ? t("account") : t("sign_in")}</span>
      </Link>
    </nav>
  );
}
