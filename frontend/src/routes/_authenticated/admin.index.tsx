import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { formatNPR, statusLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "dash"],
    queryFn: async () => {
      const [o, p, c] = await Promise.all([
        supabase.from("orders").select("id,order_number,customer_name,total,status,payment_status,created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("id,name,stock,slug"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { orders: o.data ?? [], products: p.data ?? [], customers: c.count ?? 0 };
    },
  });
  if (!data) return <div className="h-60 animate-pulse rounded bg-muted" />;
  const live = data.orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const revenue = live.reduce((s, o) => s + Number(o.total), 0);
  const pending = data.orders.filter((o) => ["pending", "confirmed", "processing"].includes(o.status)).length;
  const low = data.products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return d.toISOString().slice(0, 10); });
  const chart = days.map((d) => ({ day: d.slice(5), revenue: live.filter((o) => o.created_at.slice(0, 10) === d).reduce((s, o) => s + Number(o.total), 0) }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {[["Revenue", formatNPR(revenue)], ["Orders", data.orders.length], ["Pending", pending], ["Customers", data.customers], ["Products", data.products.length]].map(([l, v]) => (
          <div key={l as string} className="rounded-md border bg-card p-4"><p className="eyebrow">{l}</p><p className="mt-1 font-display text-2xl">{v}</p></div>
        ))}
      </div>
      <div className="rounded-md border bg-card p-4">
        <p className="mb-4 font-medium">Revenue, last 14 days</p>
        <div className="h-64"><ResponsiveContainer><BarChart data={chart}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" fontSize={11} /><YAxis fontSize={11} /><Tooltip formatter={(v: number) => formatNPR(v)} /><Bar dataKey="revenue" fill="var(--accent)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border bg-card p-4">
          <p className="mb-3 font-medium">Recent transactions</p>
          <ul className="divide-y text-sm">
            {data.orders.slice(0, 8).map((o) => <li key={o.id} className="flex justify-between gap-2 py-2"><span>{o.order_number} · {o.customer_name}</span><span>{statusLabel(o.status)} · {formatNPR(o.total)}</span></li>)}
            {data.orders.length === 0 && <li className="py-2 text-muted-foreground">No orders yet.</li>}
          </ul>
          <Link to="/admin/orders" className="mt-3 inline-block text-sm underline">Manage orders</Link>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="mb-3 font-medium">Low stock</p>
          <ul className="divide-y text-sm">
            {low.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.name}</span><span className={p.stock === 0 ? "text-destructive" : "text-sale"}>{p.stock} left</span></li>)}
            {low.length === 0 && <li className="py-2 text-muted-foreground">All products well stocked.</li>}
          </ul>
          <Link to="/admin/products" className="mt-3 inline-block text-sm underline">Manage inventory</Link>
        </div>
      </div>
    </div>
  );
}
