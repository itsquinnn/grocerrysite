import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Menu, ShoppingBag, User, ChevronDown, LogOut, Package, LayoutDashboard, Bell, Search, X, Globe } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Logo, LogoMark } from "./Logo";
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
  const { t, translateCategory, translateSubcategory, isNepali } = useI18n();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: products = [] } = useQuery(allProductsQuery);
  const [menu, setMenu] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const [moreHover, setMoreHover] = useState(false);
  const [activeOverflowCat, setActiveOverflowCat] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const nav = useNavigate();
  const qc = useQueryClient();

  const [maxVisibleCats, setMaxVisibleCats] = useState(6);

  useEffect(() => {
    const updateCount = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      if (w >= 1800) setMaxVisibleCats(10);
      else if (w >= 1500) setMaxVisibleCats(8);
      else if (w >= 1280) setMaxVisibleCats(7);
      else if (w >= 1024) setMaxVisibleCats(5);
      else setMaxVisibleCats(4);
    };
    updateCount();
    window.addEventListener("resize", updateCount);
    return () => window.removeEventListener("resize", updateCount);
  }, []);

  const visibleCats = useMemo(() => cats.slice(0, maxVisibleCats), [cats, maxVisibleCats]);
  const overflowCats = useMemo(() => cats.slice(maxVisibleCats), [cats, maxVisibleCats]);

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

  const subcategoriesByCategory = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of products) {
      if (p.category_id && p.subcategory) {
        let list = map.get(p.category_id);
        if (!list) {
          list = [];
          map.set(p.category_id, list);
        }
        if (!list.includes(p.subcategory)) {
          list.push(p.subcategory);
        }
      }
    }
    return map;
  }, [products]);

  const subsFor = (catId: string) => subcategoriesByCategory.get(catId) ?? [];

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
      <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-16 container-edge flex h-[52px] sm:h-14 items-center gap-2 sm:gap-3 md:gap-5">
        <button className="p-1 -ml-1 md:hidden" onClick={() => setMenu(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <Logo />
        <nav className="ml-auto flex items-center gap-1 sm:gap-1.5">
          {/* Bilingual English / Nepali Switcher - Always accessible on mobile & desktop */}
          <LanguageToggle className="mr-1 inline-flex text-[11px] sm:text-xs" />

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/20 transition shadow-2xs mr-1"
              title={isNepali ? "एडमिन ड्यासबोर्ड खोल्नुहोस्" : "Open Admin Dashboard"}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>{t("admin_dashboard")}</span>
            </Link>
          )}

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
                {isAdmin && (
                  <>
                    <DropdownMenuItem
                      onClick={() => nav({ to: "/admin" })}
                      className="font-semibold text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-primary" />
                        <span>{t("admin_dashboard")}</span>
                      </span>
                      <span className="rounded bg-primary text-primary-foreground px-1.5 py-0.5 text-[9px] font-bold">
                        ADMIN
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => nav({ to: "/account" })}><User className="h-4 w-4" />{t("my_account")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/account/orders" })}><Package className="h-4 w-4" />{t("my_orders")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/account/notifications" })}><Bell className="h-4 w-4" />{t("notifications")}</DropdownMenuItem>
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
          <div className="container-edge py-3">
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
      <nav
        className="relative hidden border-t md:block text-[13px] w-full"
        onMouseLeave={() => {
          setHover(null);
          setMoreHover(false);
        }}
        aria-label="Categories"
      >
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-10 xl:px-14 2xl:px-16 container-edge flex h-9 items-center justify-between gap-4">
          <ul className="flex items-center gap-4 lg:gap-6 whitespace-nowrap min-w-0">
            <li className="shrink-0">
              <Link to="/shop" className="hover:text-accent transition-colors font-medium" activeOptions={{ exact: true }}>
                {t("all_products")}
              </Link>
            </li>
            {visibleCats.map((c) => {
              const subs = subsFor(c.id);
              const isHovered = hover === c.id;
              const catLabel = translateCategory(c.name);
              return (
                <li
                  key={c.id}
                  className="relative flex h-full items-center shrink-0"
                  onMouseEnter={() => {
                    setMoreHover(false);
                    setHover(c.id);
                  }}
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

            {overflowCats.length > 0 && (
              <li
                className="relative flex h-full items-center shrink-0"
                onMouseEnter={() => {
                  setHover(null);
                  setMoreHover(true);
                }}
                onMouseLeave={() => {
                  setMoreHover(false);
                  setActiveOverflowCat(null);
                }}
              >
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 transition-colors hover:text-accent font-medium",
                    moreHover && "text-accent"
                  )}
                >
                  <span>{t("more_categories")}</span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 transition-transform duration-200",
                      moreHover && "rotate-180 text-accent"
                    )}
                  />
                </button>

                {moreHover && (
                  <div className="absolute left-0 top-full z-50 pt-1">
                    <div className="w-64 max-h-[70vh] overflow-y-auto rounded-lg border bg-card p-2 shadow-card animate-in fade-in-0 zoom-in-95 duration-150">
                      <p className="eyebrow px-2 py-1 text-[11px] text-muted-foreground">
                        {t("all_categories")} ({cats.length})
                      </p>
                      <ul className="space-y-0.5">
                        {overflowCats.map((c) => {
                          const subs = subsFor(c.id);
                          const catLabel = translateCategory(c.name);
                          const isOpen = activeOverflowCat === c.id;
                          return (
                            <li key={c.id} className="rounded-md hover:bg-muted/70">
                              <div className="flex items-center justify-between">
                                <Link
                                  to="/shop"
                                  search={{ category: c.slug }}
                                  onClick={() => setMoreHover(false)}
                                  className="flex-1 px-2.5 py-1.5 text-xs text-foreground/90 hover:text-accent font-medium truncate"
                                >
                                  {catLabel}
                                </Link>
                                {subs.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveOverflowCat(isOpen ? null : c.id);
                                    }}
                                    className="p-1.5 text-muted-foreground hover:text-foreground"
                                    aria-label={`Toggle ${catLabel} subcategories`}
                                  >
                                    <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
                                  </button>
                                )}
                              </div>
                              {isOpen && subs.length > 0 && (
                                <ul className="ml-3 my-1 space-y-0.5 border-l pl-2 text-[11px]">
                                  {subs.map((s) => (
                                    <li key={s}>
                                      <Link
                                        to="/shop"
                                        search={{ category: c.slug, sub: s }}
                                        onClick={() => setMoreHover(false)}
                                        className="block py-1 px-1.5 text-muted-foreground hover:text-accent rounded"
                                      >
                                        {translateSubcategory(s)}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      <div className="mt-2 border-t pt-2">
                        <Link
                          to="/shop"
                          onClick={() => setMoreHover(false)}
                          className="flex items-center justify-between rounded-md px-2.5 py-1 text-xs font-semibold text-accent hover:underline"
                        >
                          <span>{t("all_products")}</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )}
          </ul>

          <ul className="flex shrink-0 items-center gap-4 lg:gap-5 whitespace-nowrap text-muted-foreground">
            <li>
              <Link to="/offers" className="font-semibold text-sale hover:underline transition-colors">
                {t("offers")}
              </Link>
            </li>
            <li>
              <Link to="/compare" className="hover:text-foreground transition-colors">
                {t("compare")}
              </Link>
            </li>
            <li>
              <Link to="/stores" className="hover:text-foreground transition-colors">
                {t("stores")}
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground transition-colors">
                {t("our_story")}
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          {/* Header row with Brand mark & title, leaving ample space for the top-right close (X) button */}
          <div className="flex items-center gap-2.5 pr-12">
            <LogoMark className="h-6 w-6" />
            <SheetTitle className="font-display text-xl font-semibold tracking-wide">DOVAN</SheetTitle>
          </div>

          {/* Dedicated language switcher card - separated from the close button */}
          <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Globe className="h-3.5 w-3.5" />
              <span>{isNepali ? "भाषा छान्नुहोस्" : "Language"}</span>
            </span>
            <LanguageToggle />
          </div>

          {isAdmin && (
            <div className="mt-3 rounded-xl border border-primary/30 bg-primary/10 p-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  {isNepali ? "एडमिन नियन्त्रण केन्द्र" : "Admin Control Center"}
                </span>
                <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase">
                  Admin
                </span>
              </div>
              <Link
                to="/admin"
                onClick={() => setMenu(false)}
                className="mt-2.5 flex items-center justify-between rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
              >
                <span>{isNepali ? "एडमिन ड्यासबोर्ड खोल्नुहोस्" : "Open Admin Dashboard"}</span>
                <span>→</span>
              </Link>
            </div>
          )}

          <nav className="mt-5 space-y-1 text-sm">
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
