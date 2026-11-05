import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Home, Compass, ShoppingBag, Heart, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return toast.error("Please enter a valid email");
    }
    setBusy(true);
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.toLowerCase().trim() });
    setBusy(false);
    if (error && error.code !== "23505") {
      return toast.error("Could not subscribe, please try again");
    }
    toast.success(
      error
        ? "You're already subscribed"
        : "Subscribed! Watch your inbox for offers."
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
        placeholder="you@example.com"
        className="h-11 flex-1 rounded-md border bg-card px-3 text-sm text-foreground outline-none focus:border-ring"
      />
      <Button type="submit" variant="secondary" className="h-11" disabled={busy}>
        Subscribe
      </Button>
    </form>
  );
}

export function Footer() {
  const columns = [
    {
      t: "Shop",
      l: [
        ["All products", "/shop"],
        ["Offers", "/offers"],
        ["Compare", "/compare"],
        ["Wishlist", "/wishlist"],
        ["Cart", "/cart"],
      ],
    },
    {
      t: "About",
      l: [
        ["Our Story", "/about"],
        ["Stores", "/stores"],
        ["77 Districts", "/stores"],
      ],
    },
    {
      t: "Support",
      l: [
        ["Track Order", "/track"],
        ["Help & Support", "/support"],
        ["FAQ", "/faq"],
      ],
    },
    {
      t: "Legal",
      l: [
        ["Shipping Policy", "/policies/shipping"],
        ["Returns & Refund", "/policies/returns"],
        ["Terms of Service", "/policies/terms"],
        ["Privacy", "/policies/privacy"],
      ],
    },
  ];

  return (
    <footer className="mt-6 md:mt-14 bg-primary text-primary-foreground no-print">
      <div className="container-edge grid grid-cols-2 gap-x-4 gap-y-4 py-4 md:grid-cols-6 md:gap-8 md:py-10">
        {/* Brand block (spans full 2 cols on mobile, 2 cols on desktop) */}
        <div className="col-span-2 md:col-span-2">
          <Logo className="text-primary-foreground" />
          <p className="mt-2 max-w-sm text-xs leading-relaxed opacity-75 md:mt-3 md:text-sm">
            Considered goods for modern Nepali homes and wardrobes. Delivered across all 77 districts with Cash on Delivery.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] opacity-75 md:mt-2.5 md:text-xs">
            <a href="mailto:support@dovan.com.np" className="hover:underline">support@dovan.com.np</a>
            <span>·</span>
            <a href="tel:+97714220192" className="hover:underline">+977 1 4220192</a>
          </div>
        </div>

        {/* 4 Columns (2x2 grid on mobile, 4 columns on desktop) */}
        {columns.map((col) => (
          <div key={col.t} className="space-y-1 md:space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-60 md:text-xs">
              {col.t}
            </p>
            <ul className="space-y-0.5 md:space-y-1.5 text-xs md:text-sm">
              {col.l.map(([label, href]) => (
                <li key={label}>
                  <Link
                    to={href}
                    className="inline-block py-0.5 opacity-80 hover:opacity-100 hover:underline transition-opacity"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-primary-foreground/15">
        <div className="container-edge flex flex-col gap-0.5 pt-2 pb-14 text-[11px] opacity-60 sm:flex-row sm:justify-between sm:items-center text-center sm:text-left md:py-3.5 md:text-xs">
          <span>© {new Date().getFullYear()} DOVAN. All rights reserved.</span>
          <span>
            Cash on Delivery across all 77 districts · Prices include all applicable charges
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
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur md:hidden">
      <Link to="/" className={item} activeProps={{ className: `${item} text-foreground font-semibold` }} inactiveProps={{ className: `${item} text-muted-foreground` }}>
        <Home className="h-4 w-4" />
        <span>{t("home")}</span>
      </Link>
      <Link to="/shop" className={item} activeProps={{ className: `${item} text-foreground font-semibold` }} inactiveProps={{ className: `${item} text-muted-foreground` }}>
        <Compass className="h-4 w-4" />
        <span>{t("browse")}</span>
      </Link>
      <button onClick={() => setCartOpen(true)} className={`${item} text-muted-foreground relative`} aria-label="Open cart">
        <div className="relative">
          <ShoppingBag className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {cartCount}
            </span>
          )}
        </div>
        <span>{t("cart")}</span>
      </button>
      <Link to="/wishlist" className={item} activeProps={{ className: `${item} text-foreground font-semibold` }} inactiveProps={{ className: `${item} text-muted-foreground` }}>
        <div className="relative">
          <Heart className="h-4 w-4" />
          {wishlist.length > 0 && (
            <span className="absolute -right-1.5 -top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
              {wishlist.length}
            </span>
          )}
        </div>
        <span>{t("saved")}</span>
      </Link>
      <Link to={user ? "/account" : "/login"} className={item} activeProps={{ className: `${item} text-foreground font-semibold` }} inactiveProps={{ className: `${item} text-muted-foreground` }}>
        <UserIcon className="h-4 w-4" />
        <span>{user ? t("account") : t("sign_in")}</span>
      </Link>
    </nav>
  );
}
