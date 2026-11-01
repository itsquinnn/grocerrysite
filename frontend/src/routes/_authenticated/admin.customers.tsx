import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatNPR, statusLabel } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/customers")({ component: Customers });

function Customers() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const [p, o, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("id,user_id,order_number,total,status,created_at,customer_email"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      return { profiles: p.data ?? [], orders: o.data ?? [], roles: r.data ?? [] };
    },
  });
  if (!data) return <div className="h-40 animate-pulse rounded bg-muted" />;
  const rows = data.profiles.map((p) => {
    const os = data.orders.filter((o) => o.user_id === p.id);
    return { ...p, orders: os, email: os[0]?.customer_email, spent: os.filter((o) => o.status !== "cancelled").reduce((s, o) => s + Number(o.total), 0), admin: data.roles.some((r) => r.user_id === p.id && r.role === "admin") };
  }).filter((r) => !q || ((r.full_name ?? "") + (r.phone ?? "") + (r.email ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex items-center gap-3"><h2 className="text-2xl">Customers</h2><Input className="ml-auto w-60" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ul className="mt-4 divide-y rounded-md border bg-card">
        {rows.map((r) => (
          <li key={r.id} className="p-4 text-sm">
            <button className="flex w-full flex-wrap items-center gap-3 text-left" onClick={() => setOpen(open === r.id ? null : r.id)}>
              <span className="flex-1 font-medium">{r.full_name}{r.admin && <span className="ml-2 rounded bg-primary px-1.5 text-[10px] text-primary-foreground">Admin</span>}<span className="block text-xs font-normal text-muted-foreground">{r.email ?? "—"} · {r.phone ?? "no phone"} · joined {new Date(r.created_at).toLocaleDateString()}</span></span>
              <span>{r.orders.length} orders</span><span className="font-semibold">{formatNPR(r.spent)}</span>
            </button>
            {open === r.id && (
              <ul className="mt-3 space-y-1 border-t pt-3">
                {r.orders.map((o) => <li key={o.id} className="flex justify-between">{o.order_number} · {new Date(o.created_at).toLocaleDateString()}<span>{statusLabel(o.status)} · {formatNPR(o.total)}</span></li>)}
                {r.orders.length === 0 && <li className="text-muted-foreground">No orders yet.</li>}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
