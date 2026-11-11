import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Menu, ShoppingBag, User, ChevronDown, LogOut, Package, LayoutDashboard, Bell, Search, X, Globe, Store, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Logo, LogoMark } from "./Logo";
import { SearchBox } from "./SearchBox";
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
    toast.success("Promo code WELCOME10 copied to clipboard!");
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
  const { user, isAdmin, authReady, cartCount, wishlist, setCartOpen } = useShop();
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

  const [maxVisibleCats, setMaxVisibleCats] = useState(4);

  // Live server status check for current user
  const { data: serverStatus } = useQuery({
    queryKey: ["seller", "status"],
    queryFn: () => api.get<{ seller_status: string }>("/seller/status").catch(() => null),
    enabled: !!user?.id,
  });

  const [sellerStatus, setSellerStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");

  useEffect(() => {
    if (serverStatus?.seller_status) {
      const status = serverStatus.seller_status === "suspended" ? "rejected" : serverStatus.seller_status;
      setSellerStatus(status as any);
      if (user?.id) localStorage.setItem(`dovan_seller_status_${user.id}`, status);
    }
  }, [serverStatus, user?.id]);

  useEffect(() => {
    const checkStatus = () => {
      if (!user?.id) {
        setSellerStatus("none");
        return;
      }
      if (typeof window === "undefined") return;

      const directStatus = localStorage.getItem(`dovan_seller_status_${user.id}`);
      if (directStatus && (directStatus === "pending" || directStatus === "approved" || directStatus === "rejected")) {
        setSellerStatus(directStatus as any);
        return;
      }

      try {
        const raw = localStorage.getItem("dovan_seller_applications");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const app = list.find((a: any) => a.userId === user.id || (user.email && a.userEmail === user.email));
            if (app?.status) {
              setSellerStatus(app.status);
              return;
            }
          }
        }
      } catch { }

      setSellerStatus("none");
    };

    checkStatus();
    window.addEventListener("storage", checkStatus);
    window.addEventListener("dovan:seller-status-changed", checkStatus);
    return () => {
      window.removeEventListener("storage", checkStatus);
      window.removeEventListener("dovan:seller-status-changed", checkStatus);
    };
  }, [user]);

  const isSellerApproved = sellerStatus === "approved";

  useEffect(() => {
    const updateCount = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1200;
      if (w >= 1700) setMaxVisibleCats(7);
      else if (w >= 1480) setMaxVisibleCats(5);
      else if (w >= 1240) setMaxVisibleCats(4);
      else if (w >= 1024) setMaxVisibleCats(3);
      else setMaxVisibleCats(2);
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
    try {
      localStorage.removeItem("dovan_cached_user");
      localStorage.removeItem("dovan_cached_admin");
    } catch { }
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

        {/* Location selector trigger button */}
        <button
          type="button"
          onClick={() => toast.info("Location delivery picker coming soon!")}
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/50 hover:bg-muted/90 px-3 py-1.5 text-xs font-medium text-foreground hover:text-foreground transition shadow-2xs group ml-1"
          aria-label="Mark your location"
          title="Mark your delivery location"
        >
          <MapPin className="h-3.5 w-3.5 text-accent shrink-0 transition-transform group-hover:scale-110" />
          <span className="truncate max-w-[120px] lg:max-w-[160px]">Mark your location</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-y-0.5" />
        </button>

        <nav className="ml-auto flex items-center gap-2 sm:gap-3">
          <ul className="hidden md:flex items-center gap-3.5 lg:gap-5 whitespace-nowrap text-xs sm:text-[13px] text-muted-foreground mr-2 font-medium">
            <li>
              <Link to="/offers" className="font-semibold text-sale hover:underline transition-colors">
                {t("offers")}
              </Link>
            </li>
            <li>
              <Link to="/compare" className="text-foreground/90 hover:text-foreground transition-colors">
                {t("compare")}
              </Link>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="relative flex items-center justify-center p-1.5 text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            aria-label={searchOpen ? t("close_search") : t("search")}
            title={t("search")}
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                className="relative flex items-center justify-center p-1.5 text-foreground hover:opacity-80 transition-opacity cursor-pointer outline-none focus:outline-none"
                aria-label="Account menu"
              >
                <User className="h-5 w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => nav({ to: "/admin" })}
                    className="font-medium text-primary cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>Admin Console</span>
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => nav({ to: "/account" })} className="cursor-pointer">
                  <User className="h-4 w-4" />{t("my_account")}
                </DropdownMenuItem>
                {!isAdmin && (
                  <DropdownMenuItem
                    onClick={() => nav({ to: "/account/sell" })}
                    className="font-medium text-primary cursor-pointer flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-primary" />
                      <span>
                        {isSellerApproved
                          ? "Seller Dashboard"
                          : sellerStatus === "pending"
                            ? "Seller Status (Pending)"
                            : sellerStatus === "rejected"
                              ? "Seller Status (Action Required)"
                              : "Sell on DOVAN"}
                      </span>
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => nav({ to: "/account/orders" })} className="cursor-pointer">
                  <Package className="h-4 w-4" />{t("my_orders")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/account/notifications" })} className="cursor-pointer">
                  <Bell className="h-4 w-4" />{t("notifications")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <LogOut className="h-4 w-4" />{t("sign_out")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : !authReady ? (
            <div className="flex items-center justify-center p-1.5">
              <div className="h-5 w-5 rounded-full bg-muted/60 animate-pulse" />
            </div>
          ) : (
            <Link
              to="/login"
              className="relative flex items-center justify-center p-1.5 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
              aria-label={t("sign_in")}
              title={t("sign_in")}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <Link
            to="/wishlist"
            className="relative flex items-center justify-center p-1.5 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            aria-label={`${t("saved")}, ${wishlist.length} items`}
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative flex items-center justify-center p-1.5 text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            aria-label={`${t("cart")}, ${cartCount} items`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {cartCount}
              </span>
            )}
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

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          {/* Header row with Brand mark & title, leaving ample space for the top-right close (X) button */}
          <div className="flex items-center gap-2.5 pr-12">
            <LogoMark className="h-6 w-6" />
            <SheetTitle className="font-display text-xl font-semibold tracking-wide">DOVAN</SheetTitle>
          </div>

          {/* Delivery Location Selector in Mobile Sidebar */}
          <div className="mt-4 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                toast.info("Location delivery picker coming soon!");
              }}
              className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-2.5 shadow-2xs hover:bg-muted active:scale-[0.98] transition-all group text-left"
              aria-label="Mark your delivery location"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/15 text-accent shrink-0 group-hover:bg-accent/25 transition-colors">
                  <MapPin className="h-4 w-4" />
                </span>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 leading-none mb-1">
                    Deliver to
                  </span>
                  <span className="text-xs font-semibold text-foreground truncate">
                    Mark your location
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground/70 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5 mr-1" />
            </button>
          </div>

          <nav className="mt-4 space-y-1 text-sm">
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
            {isAdmin ? (
              <Link
                to="/admin"
                onClick={() => setMenu(false)}
                className="flex items-center justify-between rounded px-2 py-2 font-semibold text-primary hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Console</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            ) : (
              <a
                href="/seller"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenu(false)}
                className="flex items-center justify-between rounded px-2 py-2 font-semibold text-primary hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>{isSellerApproved ? "Seller Dashboard" : "Sell on DOVAN"}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </a>
            )}
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
