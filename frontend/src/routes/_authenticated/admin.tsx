import { createFileRoute, Link, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Star,
  Package,
  FolderTree,
  Users,
  Tag,
  Store,
  ArrowRight,
  ShieldCheck,
  LogOut,
  User,
  Menu,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LogoMark } from "@/components/site/Logo";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const user = (context as { user: any })?.user;
    const userId = user?.id;
    if (!userId) throw redirect({ to: "/login" });

    // 1. Direct metadata check
    if (user?.user_metadata?.role === "admin") return;

    // 2. Security-definer RPC has_role check (bypasses RLS)
    try {
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      if (isAdmin) return;
    } catch {}

    // 3. Fallback direct accounts check
    const { data: acc } = await (supabase.from("accounts" as any) as any)
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (acc?.role === "admin") return;

    throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Admin Portal — DOVAN Control Center" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const links = [
  {
    to: "/admin",
    label: "Dashboard",
    desc: "Overview, real-time revenue & KPIs",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/insights",
    label: "Insights & Analytics",
    desc: "Monthly revenue, pie charts & yearly targets",
    icon: TrendingUp,
  },
  {
    to: "/admin/orders",
    label: "Orders & Fulfillment",
    desc: "Process, dispatch & track orders",
    icon: ShoppingBag,
  },
  {
    to: "/admin/tickets",
    label: "Support Tickets",
    desc: "Customer inquiries & callback requests",
    icon: MessageSquare,
  },
  {
    to: "/admin/reviews",
    label: "Reviews Moderation",
    desc: "Approve or hide buyer ratings",
    icon: Star,
  },
  {
    to: "/admin/products",
    label: "Products & Stock",
    desc: "Pricing, inventory & low-stock alerts",
    icon: Package,
  },
  {
    to: "/admin/catalog",
    label: "Categories & Brands",
    desc: "Store hierarchy & category banners",
    icon: FolderTree,
  },
  {
    to: "/admin/customers",
    label: "Customer Accounts",
    desc: "Registered users & customer details",
    icon: Users,
  },
  {
    to: "/admin/coupons",
    label: "Coupons & Discounts",
    desc: "Manage promo discount codes",
    icon: Tag,
  },
] as const;

function AdminLayout() {
  const { user } = useShop();
  const { isNepali } = useI18n();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    void nav({ to: "/login", replace: true });
  };

  return (
    <div className="admin-theme min-h-screen bg-white flex flex-col text-foreground">
      {/* ── Top Dedicated Admin Navbar (Zero Website Elements) ──────────── */}
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Identity & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden -ml-1 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
              aria-label="Open sidebar menu"
              title="Open sidebar menu"
            >
              <Menu className="h-5 w-5 text-foreground" />
            </button>

            <Link to="/admin" className="flex items-center gap-2.5 group">
              <LogoMark className="h-8 w-8 sm:h-9 sm:w-9 object-contain group-hover:scale-105 transition-transform shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="font-display font-bold text-base sm:text-lg tracking-wider text-foreground">
                  DOVAN
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                  {"Admin Console"}
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {"Live Operations"}
            </span>
          </div>

          {/* Right Action: Continue to Website Button + Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Primary Return Button */}
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-primary px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition group"
              title="Leave admin mode and continue shopping on the website"
            >
              <Store className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{"Continue to Website"}</span>
              <span className="sm:hidden">{"Website"}</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Admin Profile */}
            <div className="flex items-center gap-1 pl-2 border-l">
              <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-muted-foreground px-2">
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{user?.email || "Admin"}</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] items-start">
          {/* Desktop Left Sidebar (Only navigation sidebar) */}
          <aside className="hidden lg:flex flex-col gap-1 rounded-xl border bg-white p-3 shadow-2xs sticky top-20">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{"Management"}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>

            <nav className="flex flex-col gap-1 text-sm" aria-label="Admin Desktop Menu">
              {links.map(({ to, label, labelNe, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/admin" }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition group"
                  activeProps={{
                    className: "bg-primary text-primary-foreground font-semibold shadow-2xs",
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="truncate">{isNepali ? labelNe : label}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop Sidebar Bottom Branding */}
            <div className="mt-4 pt-3 border-t px-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <LogoMark className="h-5 w-5 object-contain" />
                <span className="font-semibold text-[11px] tracking-wide text-foreground/80 font-display">DOVAN</span>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">Admin</span>
            </div>
          </aside>

          {/* Dedicated Content Viewport */}
          <main className="min-w-0 w-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer (Slides in on mobile when clicking hamburger) ── */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-4 overflow-y-auto bg-white">
          <div className="flex items-center justify-between border-b pb-3 pr-8">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-7 w-7 sm:h-8 sm:w-8 object-contain shrink-0" />
              <div>
                <SheetTitle className="text-sm font-bold leading-tight font-display tracking-wide">
                  DOVAN {"Admin"}
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">
                  {"Store management console"}
                </p>
              </div>
            </div>
          </div>

          <nav className="mt-2 space-y-1">
            {links.map(({ to, label, labelNe, desc, descNe, icon: Icon }) => {
              const isActive = to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-start gap-3 rounded-xl p-2.5 transition ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                      isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-primary"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-bold leading-tight">{isNepali ? labelNe : label}</span>
                    <span
                      className={`block text-[11px] leading-snug truncate ${
                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {isNepali ? descNe : desc}
                    </span>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 mt-1 shrink-0 ${
                      isActive ? "text-primary-foreground" : "text-muted-foreground/60"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t space-y-2">
            <Link
              to="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between rounded-xl bg-primary/10 border border-primary/20 p-2.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
            >
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4" />
                <span>{"Return to Customer Website"}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>{"Sign out of Admin"}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}