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
  ExternalLink,
  ShieldCheck,
  LogOut,
  User,
  Menu,
  ChevronRight,
  TrendingUp,
  Layers,
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
    to: "/admin/seller-products",
    label: "Seller Products Control",
    desc: "Manage, adjust stock & delete seller items",
    icon: Layers,
  },
  {
    to: "/admin/sellers",
    label: "Seller Partners & Requests",
    desc: "Approve seller IDs & verify citizenship",
    icon: Store,
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
    <div className="admin-theme min-h-screen bg-background flex flex-col text-foreground">
      {/* ── Top Dedicated Admin Navbar ──────────── */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          {/* Brand Identity & Mobile Menu Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              aria-label="Open sidebar menu"
              title="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/admin" className="flex items-center gap-2">
              <LogoMark className="h-6 w-6 object-contain shrink-0" />
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm tracking-wide text-foreground">
                  DOVAN
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  Admin
                </span>
              </div>
            </Link>
          </div>

          {/* Right Action: Storefront link + Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-foreground font-medium px-2.5 py-1.5 rounded-lg border border-border/70 hover:bg-muted/60 transition"
              title="View live storefront"
            >
              <Store className="h-3.5 w-3.5 text-foreground/70" />
              <span className="hidden sm:inline">Storefront</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-border/70 text-xs">
              <span className="text-foreground/80 font-medium hidden sm:inline truncate max-w-[150px]">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-foreground/70 hover:text-destructive hover:bg-muted/60 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ────────────────────────────────────── */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:flex flex-col gap-1 sticky top-16">
            <nav className="space-y-0.5" aria-label="Admin Navigation">
              {links.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  activeOptions={{ exact: to === "/admin" }}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:text-foreground hover:bg-muted/70 transition"
                  activeProps={{
                    className: "bg-muted text-foreground font-bold shadow-2xs",
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-85" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Dedicated Content Viewport */}
          <main className="min-w-0 w-full">
            <Outlet />
          </main>
        </div>
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm p-4 overflow-y-auto bg-background">
          <div className="flex items-center justify-between border-b border-border/60 pb-3 pr-8">
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6 object-contain shrink-0" />
              <SheetTitle className="text-sm font-semibold text-foreground">
                DOVAN Admin
              </SheetTitle>
            </div>
          </div>

          <nav className="mt-3 space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 text-xs font-medium text-foreground hover:bg-muted/50 transition"
            >
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span>Storefront</span>
              </span>
              <ExternalLink className="h-3.5 w-3.5 opacity-60" />
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}