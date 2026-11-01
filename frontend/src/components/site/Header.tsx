import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Menu, ShoppingBag, User, ChevronDown, LogOut, Package, LayoutDashboard, Bell, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Logo } from "./Logo";
import { SearchBox } from "./SearchBox";
import { LanguageToggle } from "./LanguageToggle";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { categoriesQuery, allProductsQuery } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function AnnouncementItem() {
  const { t, isNepali } = useI18n();

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    void navigator.clipboard.writeText("WELCOME10");
    toast.success(isNepali ? "कुपन कोड WELCOME10 कपी भयो!" : "Promo code WELCOME10 copied to clipboard!");
  };

  return (
    <span className="inline-flex items-center gap-6 px-6">
      <span>
        {t("announcement")}{" "}
        <button
          type="button"
          onClick={copyCode}
          className="cursor-pointer font-bold underline decoration-white/60 underline-offset-2 transition hover:decoration-white"
          title="Click to copy WELCOME10"
        >
          WELCOME10
        </button>{" "}
        {t("announcement_suffix")}
      </span>
      <span aria-hidden="true" className="text-primary-foreground/40 text-xs">✦</span>
    </span>
  );
}

export function Header() {
  const { user, isAdmin, cartCount, wishlist, setCartOpen } = useShop();
  const { t, translateCategory, translateSubcategory } = useI18n();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(allProductsQuery);
  const [menu, setMenu] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const subsFor = (catId: string) => Array.from(new Set(products.filter((p) => p.category_id === catId && p.subcategory).map((p) => p.subcategory!)));

  const signOut = async () => {
    await qc.cancelQueries();
    await supabase.auth.signOut();
    void nav({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur no-print">
      <div className="group relative overflow-hidden bg-primary py-1 text-[11px] sm:text-xs text-primary-foreground select-none" role="region" aria-label="Announcement">
        <div className="animate-marquee flex items-center group-hover:[animation-play-state:paused]">
          <div className="flex shrink-0 items-center">
            <AnnouncementItem />
            <AnnouncementItem />
            <AnnouncementItem />
            <AnnouncementItem />
          </div>
          <div className="flex shrink-0 items-center" aria-hidden="true">
            <AnnouncementItem />
            <AnnouncementItem />
            <AnnouncementItem />
            <AnnouncementItem />
          </div>
        </div>
      </div>
      <div className="container-page flex h-[52px] sm:h-14 items-center gap-2 sm:gap-3 md:gap-5">
        <button className="p-1 -ml-1 md:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <Logo />
        <nav className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {/* Bilingual English / Nepali Switcher */}
          <LanguageToggle className="mr-1 hidden sm:inline-flex" />

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className={cn(
              "relative rounded-md p-1.5 transition hover:bg-muted",
              searchOpen && "bg-muted text-accent"
            )}
            aria-label={searchOpen ? t("close_search") : t("search")}
            title={t("search")}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden items-center gap-1 rounded-md px-2 py-1.5 text-sm hover:bg-muted sm:flex" aria-label="Account menu">
                <User className="h-5 w-5" /><ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/account" })}><User className="h-4 w-4" />{t("my_account")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/account/orders" })}><Package className="h-4 w-4" />{t("my_orders")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/account/notifications" })}><Bell className="h-4 w-4" />{t("notifications")}</DropdownMenuItem>
                {isAdmin && <DropdownMenuItem onClick={() => nav({ to: "/admin" })}><LayoutDashboard className="h-4 w-4" />{t("admin_dashboard")}</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="h-4 w-4" />{t("sign_out")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex sm:items-center sm:gap-1.5">
              <Link to="/login" className="rounded-md px-2.5 py-1 text-sm font-medium hover:bg-muted">{t("sign_in")}</Link>
              <Link to="/register" className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground hover:bg-primary/90">{t("register")}</Link>
            </div>
          )}
          <Link to="/wishlist" className="relative rounded-md p-1.5 hover:bg-muted" aria-label={`${t("saved")}, ${wishlist.length} items`}>
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{wishlist.length}</span>}
          </Link>
          <button onClick={() => setCartOpen(true)} className="relative rounded-md p-1.5 hover:bg-muted" aria-label={`${t("cart")}, ${cartCount} items`}>
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">{cartCount}</span>}
          </button>
        </nav>
      </div>
      {searchOpen && (
        <div className="border-b bg-background/98 shadow-md backdrop-blur animate-in fade-in-0 slide-in-from-top-2 duration-200 ease-out">
          <div className="container-page py-3">
            <div className="flex items-center gap-3">
              <SearchBox
                className="flex-1"
                autoFocus
                onDone={() => setSearchOpen(false)}
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label={t("close_search")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      <nav className="relative hidden border-t md:block" onMouseLeave={() => setHover(null)} aria-label="Categories">
        <ul className="container-page flex h-9 items-center gap-6 text-[13px]">
          <li>
            <Link to="/shop" className="hover:text-accent transition-colors" activeOptions={{ exact: true }}>
              {t("all_products")}
            </Link>
          </li>
          {cats.map((c) => {
            const subs = subsFor(c.id);
            const isHovered = hover === c.id;
            const catLabel = translateCategory(c.name);
            return (
              <li
                key={c.id}
                className="relative flex h-full items-center"
                onMouseEnter={() => setHover(c.id)}
                onMouseLeave={() => setHover(null)}
              >
                <Link
                  to="/shop"
                  search={{ category: c.slug }}
                  className={cn(
                    "flex items-center gap-1 transition-colors hover:text-accent",
                    isHovered && "text-accent font-medium"
                  )}
                >
                  {catLabel}
                  {subs.length > 0 && (
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform duration-200",
                        isHovered && "rotate-180 text-accent"
                      )}
                    />
                  )}
                </Link>

                {isHovered && subs.length > 0 && (
                  <div className="absolute left-0 top-full z-50 pt-1">
                    <div className="w-56 rounded-lg border bg-card p-3 shadow-card animate-in fade-in-0 zoom-in-95 duration-150">
                      <p className="eyebrow px-2 pb-1.5">{catLabel}</p>
                      <ul className="space-y-0.5">
                        {subs.map((s) => (
                          <li key={s}>
                            <Link
                              to="/shop"
                              search={{ category: c.slug, sub: s }}
                              onClick={() => setHover(null)}
                              className="block rounded-md px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                            >
                              {translateSubcategory(s)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2 border-t pt-2">
                        <Link
                          to="/shop"
                          search={{ category: c.slug }}
                          onClick={() => setHover(null)}
                          className="flex items-center justify-between rounded-md px-2.5 py-1 text-xs font-medium text-accent hover:underline"
                        >
                          <span>{t("shop")} {catLabel}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          <li className="ml-auto flex items-center gap-5">
            <Link to="/offers" className="font-semibold text-sale hover:underline transition-colors">
              {t("offers")}
            </Link>
            <Link to="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("compare")}
            </Link>
            <Link to="/stores" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("stores")}
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              {t("our_story")}
            </Link>
          </li>
        </ul>
      </nav>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl">DOVAN</SheetTitle>
            <LanguageToggle />
          </div>
          <nav className="mt-6 space-y-1 text-sm">
            <Link to="/shop" onClick={() => setMenu(false)} className="block rounded px-2 py-2.5 font-medium hover:bg-muted">{t("all_products")}</Link>
            {cats.map((c) => (
              <details key={c.id} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded px-2 py-2.5 hover:bg-muted">{translateCategory(c.name)}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" /></summary>
                <div className="ml-3 border-l pl-3">
                  {subsFor(c.id).map((s) => (
                    <Link key={s} to="/shop" search={{ category: c.slug, sub: s }} onClick={() => setMenu(false)} className="block py-2 text-muted-foreground">{translateSubcategory(s)}</Link>
                  ))}
                  <Link to="/shop" search={{ category: c.slug }} onClick={() => setMenu(false)} className="block py-2 font-medium">{t("all_products")} ({translateCategory(c.name)})</Link>
                </div>
              </details>
            ))}
            <hr className="my-3" />
            <Link to="/offers" onClick={() => setMenu(false)} className="block rounded px-2 py-2 font-semibold text-sale hover:bg-muted">{t("offers")}</Link>
            <Link to="/compare" onClick={() => setMenu(false)} className="block rounded px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">{t("compare")}</Link>
            <Link to="/stores" onClick={() => setMenu(false)} className="block rounded px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">{t("stores")}</Link>
            <Link to="/about" onClick={() => setMenu(false)} className="block rounded px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground">{t("our_story")}</Link>
            <Link to="/track" onClick={() => setMenu(false)} className="block rounded px-2 py-2 hover:bg-muted">{t("track_order")}</Link>
            <Link to="/support" onClick={() => setMenu(false)} className="block rounded px-2 py-2 hover:bg-muted">{t("support")}</Link>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
