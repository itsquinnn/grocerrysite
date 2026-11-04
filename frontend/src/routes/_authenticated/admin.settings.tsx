import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

function Settings() {
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => Object.fromEntries(((await supabase.from("settings").select("*")).data ?? []).map((s) => [s.key, s.value])),
  });
  const [vat, setVat] = useState("13");
  useEffect(() => { if (data?.vat_rate) setVat(data.vat_rate); }, [data]);

  const save = async () => {
    const { error } = await supabase.from("settings").upsert({ key: "vat_rate", value: vat }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("VAT rate updated");
  };
  return (
    <div className="max-w-md space-y-6">
      <h2 className="text-2xl">Settings</h2>
      <div className="rounded-md border bg-card p-5">
        <Label htmlFor="vat">VAT rate (%)</Label>
        <p className="mb-2 text-xs text-muted-foreground">Product prices are VAT-exclusive; this percentage is added at checkout and on invoices.</p>
        <div className="flex gap-2"><Input id="vat" type="number" min={0} max={40} step="0.1" value={vat} onChange={(e) => setVat(e.target.value)} /><Button onClick={save}>Save</Button></div>
      </div>
    </div>
  );
}
