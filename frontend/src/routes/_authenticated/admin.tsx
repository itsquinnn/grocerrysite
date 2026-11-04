import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Star,
  Package,
  FolderTree,
  Users,
  Tag,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  head: () => ({ meta: [{ title: "Admin Portal — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/tickets", label: "Tickets", icon: MessageSquare },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/catalog", label: "Catalog", icon: FolderTree },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Tag },
] as const;

function AdminLayout() {
  return (
    <div className="container-page py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
      {/* ── Top Admin Masthead ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow tracking-wider text-primary font-bold">DOVAN COMMERCE</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> Admin Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Store Administration
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs hover:bg-muted transition"
          >
            <span>View Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* ── Responsive Shell (Mobile Horizontal Bar / Desktop Sidebar) ── */}
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] items-start">
        {/* Navigation */}
        <aside className="w-full">
          {/* Mobile & Tablet: Horizontal Scrollable Pills */}
          <nav
            className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 text-xs sm:text-sm lg:hidden scrollbar-none"
            aria-label="Admin Navigation Mobile"
          >
            {links.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/admin" }}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition shrink-0 border border-transparent"
                activeProps={{
                  className: "bg-primary text-primary-foreground font-semibold shadow-2xs border-primary",
                }}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop: Polished Sidebar */}
          <nav
            className="hidden lg:flex flex-col gap-1 rounded-xl border bg-card p-2.5 shadow-2xs text-sm"
            aria-label="Admin Navigation Desktop"
          >
            <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main Menu
            </div>
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
                <span>{label}</span>
              </Link>
            ))}

            <div className="mt-4 pt-3 border-t px-1">
              <Link
                to="/"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
              >
                <span>Back to Customer View</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            </div>
          </nav>
        </aside>

        {/* Content Outlet */}
        <main className="min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
