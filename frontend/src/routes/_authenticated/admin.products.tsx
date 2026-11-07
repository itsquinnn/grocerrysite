import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
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
import { useI18n } from "@/lib/i18n";
import { Store } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: Products });

type F = { id?: string; name: string; slug: string; sku: string; description: string; category_id: string; brand_id: string; subcategory: string; price: string; compare_at_price: string; stock: string; images: string; sizes: string; colors: string; specs: string; is_featured: boolean; is_active: boolean };
const blank: F = { name: "", slug: "", sku: "", description: "", category_id: "", brand_id: "", subcategory: "", price: "", compare_at_price: "", stock: "0", images: "", sizes: "", colors: "", specs: "", is_featured: false, is_active: true };
const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Products() {
  const { isNepali, translateProduct, translateCategory } = useI18n();
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: brands = [] } = useQuery(brandsQuery);
  const { data: products = [] } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return (data ?? []).map((p: any) => ({
        ...p,
        name: p.name ?? p.title ?? "Product",
        title: p.title ?? p.name ?? "Product",
        slug: p.slug ?? p.id,
        sku: p.sku ?? p.product_code ?? "",
        price: p.price ?? (p.price_paise != null ? p.price_paise / 100 : 0),
        compare_at_price: p.compare_at_price ?? (p.original_price_paise != null ? p.original_price_paise / 100 : null),
        stock: p.stock ?? p.stock_quantity ?? 0,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image_url ? [p.image_url] : []),
        sizes: Array.isArray(p.sizes) ? p.sizes : (p.unit ? [p.unit] : []),
        colors: Array.isArray(p.colors) ? p.colors : [],
        specs: p.specs && typeof p.specs === "object" ? p.specs : {},
        is_featured: Boolean(p.is_featured ?? (p.is_special_deal || p.is_popular || p.is_todays_choice || false)),
        is_active: p.is_active ?? true,
      }));
    },
  });
  const [f, setF] = useState<F | null>(null);
  const [q, setQ] = useState("");
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["product"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const open = (p?: (typeof products)[0]) => setF(p ? {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku, description: p.description, category_id: p.category_id ?? "", brand_id: p.brand_id ?? "", subcategory: p.subcategory ?? "",
    price: String(p.price), compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "", stock: String(p.stock), images: p.images.join(", "), sizes: p.sizes.join(", "), colors: p.colors.join(", "),
    specs: Object.entries(p.specs as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join("\n"), is_featured: p.is_featured, is_active: p.is_active,
  } : blank);

  const upload = async (file: File) => {
    if (!f) return;
    if (!file.type.startsWith("image/")) return toast.error("Images only");
    const path = `products/${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("dovan").upload(path, file, { upsert: true });
    if (error) return toast.error("Upload failed: " + error.message);
    const { data: { publicUrl } } = supabase.storage.from("dovan").getPublicUrl(path);
    if (publicUrl) {
      const finalUrl = `${publicUrl}?t=${Date.now()}`;
      setF({ ...f, images: [...list(f.images), finalUrl].join(", ") });
      toast.success("Image uploaded");
    }
  };

  const save = async () => {
    if (!f) return;
    const price = Number(f.price), stock = parseInt(f.stock, 10), cmp = f.compare_at_price ? Number(f.compare_at_price) : null;
    if (f.name.trim().length < 2 || !f.sku.trim() || !(price >= 0) || !(stock >= 0) || (cmp !== null && !(cmp >= 0))) return toast.error("Check name, SKU, price and stock");
    const specs = Object.fromEntries(f.specs.split("\n").map((l) => l.split(":")).filter((x) => x.length >= 2).map(([k, ...v]) => [k.trim(), v.join(":").trim()]));

    // Canonical schema fields
    const canonicalRow: any = {
      title: f.name.trim(),
      description: f.description.trim() || null,
      price_paise: Math.round(price * 100),
      original_price_paise: cmp ? Math.round(cmp * 100) : null,
      stock_quantity: stock,
      product_code: f.sku.trim().toUpperCase() || null,
      image_url: list(f.images)[0] || null,
      category_id: f.category_id || null,
      is_active: f.is_active,
      approval_status: f.is_active ? "listed" : "pending",
      is_special_deal: f.is_featured,
    };

    let error: any = null;
    try {
      if (f.id) {
        await api.patch("/admin/products", { id: f.id, ...canonicalRow });
      } else {
        await api.post("/admin/products", canonicalRow);
      }
    } catch (apiErr: any) {
      console.warn("[admin.products] API save fallback to Supabase direct:", apiErr?.message);
      let res = f.id ? await supabase.from("products").update(canonicalRow).eq("id", f.id) : await supabase.from("products").insert(canonicalRow);
      error = res.error;

      if (error && error.message.includes("column")) {
        // Fallback to legacy row schema
        const legacyRow = {
          name: f.name.trim(), slug: f.slug.trim() || slugify(f.name), sku: f.sku.trim().toUpperCase(), description: f.description.trim(),
          category_id: f.category_id || null, brand_id: f.brand_id || null, subcategory: f.subcategory.trim() || null,
          price, compare_at_price: cmp, stock, images: list(f.images), sizes: list(f.sizes), colors: list(f.colors), specs, is_featured: f.is_featured, is_active: f.is_active,
        };
        const legRes = f.id ? await supabase.from("products").update(legacyRow).eq("id", f.id) : await supabase.from("products").insert(legacyRow);
        error = legRes.error;
      }
    }

    if (error) return toast.error(error.message.includes("duplicate") ? "Slug or SKU already exists" : error.message);
    toast.success("Product saved"); setF(null); refresh();
  };
  const del = async (id: string) => { const { error } = await supabase.from("products").delete().eq("id", id); if (error) return toast.error(error.message); toast.success("Product deleted"); refresh(); };
  const quickStock = async (id: string, stock: number) => {
    if (stock < 0) return;
    try {
      await api.patch("/admin/products", { id, stock_quantity: stock });
      toast.success(`Stock updated to ${stock}`);
    } catch {
      let { error } = await supabase.from("products").update({ stock_quantity: stock } as any).eq("id", id);
      if (error) {
        await supabase.from("products").update({ stock } as any).eq("id", id);
      }
      toast.success(`Stock updated to ${stock}`);
    }
    refresh();
  };

  const shown = products.filter((p) => !q || (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <h2 className="text-xl sm:text-2xl font-bold">{"Products"}</h2>

        <Link
          to="/admin/seller-products"
          className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition shadow-2xs"
        >
          <Store className="h-3.5 w-3.5 text-primary" />
          Seller Products Control ({products.filter((p: any) => p.seller_id || p.pickup_address).length})
        </Link>

        <Input
          className="ml-auto w-56 h-8 text-xs rounded-xl"
          placeholder={"Search name or SKU"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button size="sm" onClick={() => open()} className="h-8 text-xs rounded-xl font-semibold">
          {"Add product"}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border bg-card shadow-2xs">
        <table className="w-full text-xs">
          <thead className="text-left uppercase text-muted-foreground text-[10.5px] bg-muted/40">
            <tr className="border-b">
              <th className="py-2.5 px-3">{"Product"}</th>
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">{"Price"}</th>
              <th className="py-2.5 px-3">{"Stock"}</th>
              <th className="py-2.5 px-3">{"Status"}</th>
              <th className="py-2.5 px-3" />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="flex items-center gap-2 p-3">
                  <img
                    src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                    alt=""
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")}
                    className="h-10 w-8 rounded object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="font-medium text-foreground block truncate">{translateProduct(p.name)}</span>
                    {isNepali && <span className="text-[11px] text-muted-foreground block truncate">{p.name}</span>}
                  </div>
                </td>
                <td className="font-mono text-xs">{p.sku}</td>
                <td className="font-semibold">{formatNPR(p.price)}</td>
                <td>
                  <Input
                    type="number"
                    min={0}
                    defaultValue={p.stock}
                    className="h-8 w-20"
                    aria-label={`Stock for ${p.name}`}
                    onBlur={(e) => Number(e.target.value) !== p.stock && quickStock(p.id, Number(e.target.value))}
                  />
                </td>
                <td>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-semibold ${
                      p.is_active
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.is_active ? ("Active") : ("Hidden")}
                  </span>
                </td>
                <td className="space-x-2 whitespace-nowrap pr-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => open(p)}>
                    {"Edit"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        {"Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogTitle>
                        {`Delete ${p.name}?`}
                      </AlertDialogTitle>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{"Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => del(p.id)}>
                          {"Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogTitle>
            {f?.id ? ("Edit product") : ("New product")}
          </DialogTitle>
          {f && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>{"Name"}</Label>
                <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              </div>
              <div>
                <Label>SKU ({"Product Code"})</Label>
                <Input value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />
              </div>
              <div>
                <Label>Slug (URL)</Label>
                <Input value={f.slug} placeholder="auto from name" onChange={(e) => setF({ ...f, slug: e.target.value })} />
              </div>
              <div>
                <Label>{"Subcategory"}</Label>
                <Input value={f.subcategory} onChange={(e) => setF({ ...f, subcategory: e.target.value })} />
              </div>
              <div>
                <Label>{"Category"}</Label>
                <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder={"Choose"} /></SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {translateCategory(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{"Brand"}</Label>
                <Select value={f.brand_id} onValueChange={(v) => setF({ ...f, brand_id: v })}>
                  <SelectTrigger><SelectValue placeholder={"Choose"} /></SelectTrigger>
                  <SelectContent>{brands.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{"Price (Rs.)"}</Label>
                <Input type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
              </div>
              <div>
                <Label>{"Original price (for discount)"}</Label>
                <Input type="number" min={0} value={f.compare_at_price} onChange={(e) => setF({ ...f, compare_at_price: e.target.value })} />
              </div>
              <div>
                <Label>{"Stock"}</Label>
                <Input type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
              </div>
              <div>
                <Label>{"Sizes (comma separated)"}</Label>
                <Input value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} />
              </div>
              <div>
                <Label>{"Colours (comma separated)"}</Label>
                <Input value={f.colors} onChange={(e) => setF({ ...f, colors: e.target.value })} />
              </div>
              <div>
                <Label>{"Upload image"}</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </div>
              <div className="sm:col-span-2">
                <Label>{"Image URLs (comma separated)"}</Label>
                <Textarea rows={2} value={f.images} onChange={(e) => setF({ ...f, images: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>{"Description"}</Label>
                <Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label>{"Specifications (one 'Key: Value' per line)"}</Label>
                <Textarea rows={3} value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={f.is_featured} onCheckedChange={(v) => setF({ ...f, is_featured: v })} />
                {"Featured"}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
                {"Visible in store"}
              </label>
              <Button className="sm:col-span-2" onClick={save}>
                {"Save product"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
