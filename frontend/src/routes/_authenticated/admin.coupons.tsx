import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/coupons")({ component: Coupons });

function Coupons() {
  const qc = useQueryClient();
  const { data: list = [] } = useQuery({ queryKey: ["admin", "coupons"], queryFn: async () => (await supabase.from("coupons").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState({ code: "", description: "", discount_type: "percent", value: "", min_order: "0", max_discount: "", expires_at: "", usage_limit: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const add = async () => {
    const value = Number(f.value);
    if (!/^[A-Z0-9]{3,20}$/.test(f.code) || !(value > 0) || (f.discount_type === "percent" && value > 90)) return toast.error("Code must be 3–20 letters/numbers; value must be valid");
    const { error } = await supabase.from("coupons").insert({
      code: f.code, description: f.description || null, discount_type: f.discount_type, value, min_order: Number(f.min_order) || 0,
      max_discount: f.max_discount ? Number(f.max_discount) : null, expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : null, usage_limit: f.usage_limit ? parseInt(f.usage_limit) : null,
    });
    if (error) return toast.error(error.message.includes("duplicate") ? "Code already exists" : error.message);
    toast.success("Coupon created"); setF({ ...f, code: "", description: "", value: "" }); void refresh();
  };
  const toggle = async (id: string, v: boolean) => { await supabase.from("coupons").update({ is_active: v }).eq("id", id); void refresh(); };
  const del = async (id: string) => { await supabase.from("coupons").delete().eq("id", id); void refresh(); };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl">Coupons</h2>
      <div className="grid gap-3 rounded-md border bg-card p-5 sm:grid-cols-4">
        <div><Label>Code</Label><Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
        <div><Label>Type</Label><Select value={f.discount_type} onValueChange={(v) => setF({ ...f, discount_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percent">Percent</SelectItem><SelectItem value="fixed">Fixed Rs.</SelectItem></SelectContent></Select></div>
        <div><Label>Value</Label><Input type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
        <div><Label>Min order</Label><Input type="number" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} /></div>
        <div><Label>Max discount</Label><Input type="number" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} /></div>
        <div><Label>Expires</Label><Input type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></div>
        <div><Label>Usage limit</Label><Input type="number" value={f.usage_limit} onChange={(e) => setF({ ...f, usage_limit: e.target.value })} /></div>
        <div><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <Button className="sm:col-span-4" onClick={add}>Create coupon</Button>
      </div>
      <ul className="divide-y rounded-md border bg-card">
        {list.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
            <span className="font-mono font-semibold">{c.code}</span>
            <span className="flex-1 text-muted-foreground">{c.discount_type === "percent" ? `${c.value}%` : formatNPR(c.value)} off · min {formatNPR(c.min_order)}{c.max_discount ? ` · max ${formatNPR(c.max_discount)}` : ""} · used {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}{c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}</span>
            <Switch checked={c.is_active} onCheckedChange={(v) => toggle(c.id, v)} aria-label="Active" />
            <Button size="sm" variant="ghost" onClick={() => del(c.id)}>Delete</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
