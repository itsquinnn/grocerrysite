import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: (context as { user: { id: string } }).user.id, _role: "admin" });
    if (!data) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [{ title: "Admin — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const links = [
  ["/admin", "Dashboard"], ["/admin/products", "Products & stock"], ["/admin/catalog", "Categories & brands"],
  ["/admin/orders", "Orders"], ["/admin/customers", "Customers"], ["/admin/coupons", "Coupons"],
  ["/admin/reviews", "Reviews"], ["/admin/tickets", "Support tickets"],
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
