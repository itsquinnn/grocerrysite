import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: Products });

type F = { id?: string; name: string; slug: string; sku: string; description: string; category_id: string; brand_id: string; subcategory: string; price: string; compare_at_price: string; stock: string; images: string; sizes: string; colors: string; specs: string; is_featured: boolean; is_active: boolean };
const blank: F = { name: "", slug: "", sku: "", description: "", category_id: "", brand_id: "", subcategory: "", price: "", compare_at_price: "", stock: "0", images: "", sizes: "", colors: "", specs: "", is_featured: false, is_active: true };
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Products() {
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: brands = [] } = useQuery(brandsQuery);
  const { data: products = [] } = useQuery({ queryKey: ["admin", "products"], queryFn: async () => (await supabase.from("products").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [f, setF] = useState<F | null>(null);
  const [q, setQ] = useState("");
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["admin"] }); void qc.invalidateQueries({ queryKey: ["products"] }); void qc.invalidateQueries({ queryKey: ["product"] }); };

  const open = (p?: (typeof products)[0]) => setF(p ? {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku, description: p.description, category_id: p.category_id ?? "", brand_id: p.brand_id ?? "", subcategory: p.subcategory ?? "",
    price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", stock: String(p.stock), images: p.images.join(", "), sizes: p.sizes.join(", "), colors: p.colors.join(", "),
    specs: Object.entries(p.specs as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("\n"), is_featured: p.is_featured, is_active: p.is_active,
  } : blank);

  const upload = async (file: File) => {
    if (!f) return;
    if (!file.type.startsWith("image/")) return toast.error("Images only");
    const path = `products/${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) return toast.error("Upload failed");
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (data) setF({ ...f, images: [...list(f.images), data.signedUrl].join(", ") });
  };

  const save = async () => {
    if (!f) return;
    const price = Number(f.price), stock = parseInt(f.stock, 10), cmp = f.compare_at_price ? Number(f.compare_at_price) : null;
    if (f.name.trim().length < 2 || !f.sku.trim() || !(price >= 0) || !(stock >= 0) || (cmp !== null && !(cmp >= 0))) return toast.error("Check name, SKU, price and stock");
    const specs = Object.fromEntries(f.specs.split("\n").map((l) => l.split(":")).filter((x) => x.length >= 2).map(([k, ...v]) => [k.trim(), v.join(":").trim()]));
    const row = {
      name: f.name.trim(), slug: f.slug.trim() || slugify(f.name), sku: f.sku.trim().toUpperCase(), description: f.description.trim(),
      category_id: f.category_id || null, brand_id: f.brand_id || null, subcategory: f.subcategory.trim() || null,
      price, compare_at_price: cmp, stock, images: list(f.images), sizes: list(f.sizes), colors: list(f.colors), specs, is_featured: f.is_featured, is_active: f.is_active,
    };
    const { error } = f.id ? await supabase.from("products").update(row).eq("id", f.id) : await supabase.from("products").insert(row);
    if (error) return toast.error(error.message.includes("duplicate") ? "Slug or SKU already exists" : error.message);
    toast.success("Product saved"); setF(null); refresh();
  };
  const del = async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) return toast.error(error.message); toast.success("Product deleted"); refresh(); };
  const quickStock = async (id: string, stock: number) => { if (stock < 0) return; await supabase.from("products").update({ stock }).eq("id", id); refresh(); };

  const shown = products.filter((p) => !q || (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3"><h2 className="text-2xl">Products</h2><Input className="ml-auto w-56" placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} /><Button onClick={() => open()}>Add product</Button></div>
      <div className="mt-4 overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground"><tr className="border-b"><th className="p-3">Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th /></tr></thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="flex items-center gap-2 p-3">
                  <img
                    src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                    alt=""
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                    className="h-10 w-8 rounded object-cover"
                  />
                  {p.name}
                </td>
                <td>{p.sku}</td><td>{formatNPR(p.price)}</td>
                <td><Input type="number" min={0} defaultValue={p.stock} className="h-8 w-20" aria-label={`Stock for ${p.name}`} onBlur={(e) => Number(e.target.value) !== p.stock && quickStock(p.id, Number(e.target.value))} /></td>
                <td>{p.is_active ? "Active" : "Hidden"}</td>
                <td className="space-x-2 whitespace-nowrap pr-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => open(p)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive">Delete</Button></AlertDialogTrigger>
                    <AlertDialogContent><AlertDialogTitle>Delete {p.name}?</AlertDialogTitle><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => del(p.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle>{f?.id ? "Edit product" : "New product"}</DialogTitle>
          {f && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label>SKU</Label><Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} /></div>
              <div><Label>Slug (URL)</Label><Input value={f.slug} placeholder="auto from name" onChange={(e) => setF({ ...f, slug: e.target.value })} /></div>
              <div><Label>Subcategory</Label><Input value={f.subcategory} onChange={(e) => setF({ ...f, subcategory: e.target.value })} /></div>
              <div><Label>Category</Label><Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Brand</Label><Select value={f.brand_id} onValueChange={(v) => setF({ ...f, brand_id: v })}><SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger><SelectContent>{brands.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Price (Rs.)</Label><Input type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
              <div><Label>Original price (for discount)</Label><Input type="number" min={0} value={f.compare_at_price} onChange={(e) => setF({ ...f, compare_at_price: e.target.value })} /></div>
              <div><Label>Stock</Label><Input type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} /></div>
              <div><Label>Sizes (comma separated)</Label><Input value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} /></div>
              <div><Label>Colours (comma separated)</Label><Input value={f.colors} onChange={(e) => setF({ ...f, colors: e.target.value })} /></div>
              <div><Label>Upload image</Label><Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></div>
              <div className="sm:col-span-2"><Label>Image URLs (comma separated)</Label><Textarea rows={2} value={f.images} onChange={(e) => setF({ ...f, images: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Specifications (one "Key: Value" per line)</Label><Textarea rows={3} value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_featured} onCheckedChange={(v) => setF({ ...f, is_featured: v })} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />Visible in store</label>
              <Button className="sm:col-span-2" onClick={save}>Save product</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
