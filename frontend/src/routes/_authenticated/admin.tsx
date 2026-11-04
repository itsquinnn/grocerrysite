import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
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
    const { data: acc } = await supabase.from("accounts").select("role").eq("id", userId).maybeSingle();
    if (acc?.role === "admin") return;

    throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Admin — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const links = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/tickets", "Support tickets"],
  ["/admin/reviews", "Reviews"],
  ["/admin/products", "Products & stock"],
  ["/admin/catalog", "Categories & brands"],
  ["/admin/customers", "Customers"],
  ["/admin/coupons", "Coupons"],
] as const;

function AdminLayout() {
  return (
    <div className="container-page py-5 md:py-6">
      <p className="eyebrow">DOVAN</p>
      <h1 className="text-3xl">Admin</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[200px_1fr]">
        <nav className="flex gap-1 overflow-x-auto text-sm lg:flex-col" aria-label="Admin">
          {links.map(([to, l]) => <Link key={to} to={to} activeOptions={{ exact: to === "/admin" }} className="whitespace-nowrap rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "bg-primary text-primary-foreground" }}>{l}</Link>)}
        </nav>
        <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
