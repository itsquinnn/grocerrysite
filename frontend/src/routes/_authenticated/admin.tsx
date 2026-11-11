import { createFileRoute, Link, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";

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
  const { user, signOut } = useShop();
  const { isNepali } = useI18n();
  const qc = useQueryClient();
  const nav = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setMobileDrawerOpen(false);
    try {
      await qc.cancelQueries();
      await signOut();
      await nav({ to: "/login", replace: true });
      qc.removeQueries({
        predicate: (q) => q.queryKey[0] !== "products" && q.queryKey[0] !== "categories",
      });
    } finally {
      setSigningOut(false);
    }
  };

  const isRouteActive = (to: string) =>
    to === "/admin"
      ? location.pathname === "/admin" || location.pathname === "/admin/"
      : location.pathname === to || location.pathname.startsWith(`${to}/`);

  const navLinkClass = (isActive: boolean, compact = false) =>
    cn(
      "flex items-center gap-2.5 rounded-lg text-xs transition-colors",
      compact ? "px-2.5 py-2" : "px-3 py-2",
      isActive
        ? "bg-foreground text-background font-semibold shadow-2xs"
        : "text-foreground hover:bg-muted font-medium",
    );

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
              className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition"
              title="View live storefront"
            >
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">Storefront</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-border text-xs">
              <span className="text-foreground font-medium hidden sm:inline truncate max-w-[150px]">
                {user?.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition cursor-pointer disabled:opacity-50"
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
              {links.map(({ to, label, icon: Icon }) => {
                const isActive = isRouteActive(to);
                return (
                  <Link
                    key={to}
                    to={to}
                    className={navLinkClass(isActive, true)}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-background" : "text-muted-foreground")} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
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
          <div className="flex items-center justify-between border-b border-border pb-3 pr-8">
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6 object-contain shrink-0" />
              <SheetTitle className="text-sm font-semibold text-foreground">
                DOVAN Admin
              </SheetTitle>
            </div>
          </div>

          <nav className="mt-3 space-y-0.5">
            {links.map(({ to, label, icon: Icon }) => {
              const isActive = isRouteActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={navLinkClass(isActive)}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-background" : "text-muted-foreground")} />
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
              disabled={signingOut}
              className="w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>{signingOut ? "Signing out..." : "Sign out"}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}