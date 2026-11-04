import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
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
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { Button } from "@/components/ui/button";

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
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders & Fulfillment", icon: ShoppingBag },
  { to: "/admin/tickets", label: "Support Tickets", icon: MessageSquare },
  { to: "/admin/reviews", label: "Reviews Moderation", icon: Star },
  { to: "/admin/products", label: "Products & Stock", icon: Package },
  { to: "/admin/catalog", label: "Categories & Brands", icon: FolderTree },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons & Discounts", icon: Tag },
] as const;

function AdminLayout() {
  const { user } = useShop();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    void nav({ to: "/login", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col text-foreground">
      {/* ── Top Dedicated Admin Navbar (Zero Website Elements) ──────────── */}
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
                D
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                  DOVAN
                </span>
                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">
                  Admin Console
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
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
              <span className="hidden sm:inline">Continue to Website</span>
              <span className="sm:hidden">Website</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-1 pl-2 border-l">
              <span className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground px-2">
                <User className="h-3.5 w-3.5" />
                <span className="max-w-[140px] truncate">{user?.email || "Admin"}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Sign out of Admin"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Sign out</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Pill Bar */}
        <div className="lg:hidden border-t bg-card/60 px-3 py-2 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-1.5 text-xs">
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition shrink-0 border border-transparent"
                activeProps={{
                  className: "bg-primary text-primary-foreground font-semibold shadow-2xs border-primary",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main Dashboard Workspace ────────────────────────────────────── */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr] items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:flex flex-col gap-1 rounded-xl border bg-card p-3 shadow-2xs sticky top-20">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Management</span>
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            </div>

            <nav className="flex flex-col gap-1 text-sm" aria-label="Admin Desktop Menu">
              {links.map(({ to, label, icon: Icon }) => (
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
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </nav>

            <div className="mt-4 pt-3 border-t">
              <Link
                to="/"
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition group"
              >
                <span className="flex items-center gap-2">
                  <Store className="h-3.5 w-3.5" />
                  <span>Go to Website Store</span>
                </span>
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </aside>

          {/* Dedicated Content Viewport */}
          <main className="min-w-0 w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}