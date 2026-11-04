import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/catalog")({ component: Catalog });
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Catalog() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: brands = [] } = useQuery(brandsQuery);
  const [cat, setCat] = useState({ name: "", image_url: "" });
  const [brand, setBrand] = useState("");
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["categories"] }); void qc.invalidateQueries({ queryKey: ["brands"] }); };

  const addCat = async () => {
    if (cat.name.trim().length < 2) return;
    const { error } = await supabase.from("categories").insert({
      name: cat.name.trim(),
      slug: slugify(cat.name),
      image_url: cat.image_url || null,
      sort_order: cats.length + 1,
    } as any);
    if (error) return toast.error(error.message);
    setCat({ name: "", image_url: "" });
    refresh();
  };
  const addBrand = async () => {
    if (brand.trim().length < 2) return;
    toast.info("Brand management is handled via product tags or categories in this catalog.");
    setBrand("");
  };
  const del = async (table: "categories" | "brands", id: string) => {
    if (table === "brands") {
      refresh();
      return;
    }
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-md border bg-card p-5">
        <h2 className="text-xl">Categories</h2>
        <ul className="mt-3 divide-y text-sm">{cats.map((c) => <li key={c.id} className="flex items-center justify-between py-2">{c.name}<Button size="sm" variant="ghost" onClick={() => del("categories", c.id)}>Remove</Button></li>)}</ul>
        <div className="mt-3 flex gap-2"><Input placeholder="Name" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} /><Input placeholder="Image URL" value={cat.image_url} onChange={(e) => setCat({ ...cat, image_url: e.target.value })} /><Button onClick={addCat}>Add</Button></div>
      </section>
      <section className="rounded-md border bg-card p-5">
        <h2 className="text-xl">Brands</h2>
        <ul className="mt-3 divide-y text-sm">{brands.map((b) => <li key={b.id} className="flex items-center justify-between py-2">{b.name}<Button size="sm" variant="ghost" onClick={() => del("brands", b.id)}>Remove</Button></li>)}</ul>
        <div className="mt-3 flex gap-2"><Input placeholder="Brand name" value={brand} onChange={(e) => setBrand(e.target.value)} /><Button onClick={addBrand}>Add</Button></div>
      </section>
    </div>
  );
}
