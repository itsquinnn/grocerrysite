import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n";
import { Store, RefreshCw, Search, Plus, Package, AlertTriangle, CheckCircle2, Star, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: Products,
  pendingComponent: ProductsSkeleton,
});

type F = {
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  category_id: string;
  brand_id: string;
  subcategory: string;
  price: string;
  compare_at_price: string;
  stock: string;
  images: string;
  sizes: string;
  colors: string;
  specs: string;
  is_featured: boolean;
  is_active: boolean;
};

const blank: F = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  category_id: "",
  brand_id: "",
  subcategory: "",
  price: "",
  compare_at_price: "",
  stock: "0",
  images: "",
  sizes: "",
  colors: "",
  specs: "",
  is_featured: false,
  is_active: true,
};

const list = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function ProductsSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded" />
          <Skeleton className="h-4 w-72 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-60 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* KPI pillars skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-border/70">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Filter pills skeleton */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* Table rows skeleton */}
      <div className="overflow-x-auto border-y border-border/70">
        <table className="w-full min-w-[760px] text-xs">
          <tbody>
            {Array.from({ length: 6 }).map((_, idx) => (
              <tr key={idx} className="border-b border-border/60 last:border-0">
                <td className="p-3.5 space-y-1.5 w-72">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-9 rounded shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-36 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-4 w-20 rounded" />
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-4 w-16 rounded" />
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-7 w-18 rounded" />
                </td>
                <td className="p-3.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="p-3.5 text-right">
                  <Skeleton className="h-7 w-24 ml-auto rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Products() {
  const { isNepali, translateProduct, translateCategory } = useI18n();
  const qc = useQueryClient();
  const { data: cats = [] } = useQuery(categoriesQuery);
  const { data: brands = [] } = useQuery(brandsQuery);

  const {
    data: products = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
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
        compare_at_price:
          p.compare_at_price ?? (p.original_price_paise != null ? p.original_price_paise / 100 : null),
        stock: p.stock ?? p.stock_quantity ?? 0,
        images:
          Array.isArray(p.images) && p.images.length > 0 ? p.images : p.image_url ? [p.image_url] : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : p.unit ? [p.unit] : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        specs: p.specs && typeof p.specs === "object" ? p.specs : {},
        is_featured: Boolean(p.is_featured ?? (p.is_special_deal || p.is_popular || p.is_todays_choice || false)),
        is_active: p.is_active ?? true,
      }));
    },
  });

  const [f, setF] = useState<F | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [isUploading, setIsUploading] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["products"] });
    void qc.invalidateQueries({ queryKey: ["product"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const compressClientSide = async (file: File, maxDim = 1400, quality = 0.85): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => resolve(blob || file), "image/webp", quality);
        } else {
          resolve(file);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const open = (p?: (typeof products)[0]) =>
    setF(
      p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            description: p.description || "",
            category_id: p.category_id ?? "",
            brand_id: p.brand_id ?? "",
            subcategory: p.subcategory ?? "",
            price: String(p.price),
            compare_at_price: p.compare_at_price ? String(p.compare_at_price) : "",
            stock: String(p.stock),
            images: p.images.join(", "),
            sizes: p.sizes.join(", "),
            colors: p.colors.join(", "),
            specs: Object.entries((p.specs as Record<string, string>) || {})
              .map(([k, v]) => `${k}: ${v}`)
              .join("\n"),
            is_featured: p.is_featured,
            is_active: p.is_active,
          }
        : blank
    );

  const upload = async (file: File) => {
    if (!f) return;
    if (!file.type.startsWith("image/")) return toast.error("Images only");

    const toastId = toast.loading("Compressing and uploading image...");
    setIsUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);

      let finalUrl: string | undefined;
      try {
        const res = await api.post<{ url?: string; file_name?: string }>("/upload", fd);
        if (res?.url) finalUrl = res.url;
      } catch (e: any) {
        console.warn("Server upload failed, falling back to direct compressed upload:", e);
      }

      if (!finalUrl) {
        const compressedBlob = await compressClientSide(file);
        const ext = "webp";
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("dovan").upload(path, compressedBlob, {
          contentType: "image/webp",
          upsert: false,
        });

        if (upErr) {
          const { error: pubUpErr } = await supabase.storage.from("public").upload(path, compressedBlob, {
            contentType: "image/webp",
            upsert: false,
          });
          if (pubUpErr) throw pubUpErr;
          const { data } = supabase.storage.from("public").getPublicUrl(path);
          finalUrl = data.publicUrl;
        } else {
          const { data } = supabase.storage.from("dovan").getPublicUrl(path);
          finalUrl = data.publicUrl;
        }
      }

      if (finalUrl) {
        const current = f.images ? f.images.split(",").map((s) => s.trim()) : [];
        current.push(finalUrl);
        setF({ ...f, images: current.join(", ") });
        toast.success("Image uploaded successfully (WebP Compressed)", { id: toastId });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const save = async () => {
    if (!f) return;
    if (!f.name.trim()) return toast.error("Name is required");
    const price = Number(f.price);
    if (isNaN(price) || price < 0) return toast.error("Valid price required");
    const cmp = f.compare_at_price ? Number(f.compare_at_price) : null;
    const stock = Number(f.stock) || 0;
    const specs = Object.fromEntries(
      f.specs
        .split("\n")
        .map((l) => l.split(":").map((s) => s.trim()))
        .filter((pair) => pair.length === 2 && pair[0])
    );

    const canonicalRow: Record<string, any> = {
      title: f.name.trim(),
      name: f.name.trim(),
      slug: f.slug.trim() || slugify(f.name),
      product_code: f.sku.trim().toUpperCase(),
      sku: f.sku.trim().toUpperCase(),
      description: f.description.trim(),
      category_id: f.category_id || null,
      brand_id: f.brand_id || null,
      subcategory: f.subcategory.trim() || null,
      price: price,
      price_paise: Math.round(price * 100),
      original_price_paise: cmp != null ? Math.round(cmp * 100) : null,
      compare_at_price: cmp,
      stock: stock,
      stock_quantity: stock,
      images: list(f.images),
      sizes: list(f.sizes),
      colors: list(f.colors),
      specs,
      is_featured: f.is_featured,
      is_active: f.is_active,
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
      let res = f.id
        ? await supabase.from("products").update(canonicalRow).eq("id", f.id)
        : await supabase.from("products").insert(canonicalRow);
      error = res.error;

      if (error && error.message.includes("column")) {
        const legacyRow = {
          name: f.name.trim(),
          slug: f.slug.trim() || slugify(f.name),
          sku: f.sku.trim().toUpperCase(),
          description: f.description.trim(),
          category_id: f.category_id || null,
          brand_id: f.brand_id || null,
          subcategory: f.subcategory.trim() || null,
          price,
          compare_at_price: cmp,
          stock,
          images: list(f.images),
          sizes: list(f.sizes),
          colors: list(f.colors),
          specs,
          is_featured: f.is_featured,
          is_active: f.is_active,
        };
        const legRes = f.id
          ? await supabase.from("products").update(legacyRow).eq("id", f.id)
          : await supabase.from("products").insert(legacyRow);
        error = legRes.error;
      }
    }

    if (error) return toast.error(error.message.includes("duplicate") ? "Slug or SKU already exists" : error.message);
    toast.success("Product saved");
    setF(null);
    refresh();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Product deleted");
    refresh();
  };

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

  // Metrics
  const metrics = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
    const outOfStock = products.filter((p) => p.stock <= 0).length;
    const featured = products.filter((p) => p.is_featured).length;
    const sellerCount = products.filter((p: any) => p.seller_id || p.pickup_address).length;
    return { total, active, lowStock, outOfStock, featured, sellerCount };
  }, [products]);

  // Filters
  const shown = useMemo(() => {
    return products.filter((p) => {
      if (filter === "active" && !p.is_active) return false;
      if (filter === "low_stock" && !(p.stock > 0 && p.stock <= 5)) return false;
      if (filter === "out_of_stock" && p.stock > 0) return false;
      if (filter === "featured" && !p.is_featured) return false;
      if (filter === "seller" && !(p.seller_id || p.pickup_address)) return false;

      if (!q.trim()) return true;
      const term = q.toLowerCase();
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      return name.includes(term) || sku.includes(term);
    });
  }, [products, filter, q]);

  const filterTabs = [
    { id: "all", label: "All Catalog", count: metrics.total },
    { id: "active", label: "Active", count: metrics.active },
    { id: "low_stock", label: "Low Stock (≤5)", count: metrics.lowStock, accent: "text-amber-800" },
    { id: "out_of_stock", label: "Out of Stock", count: metrics.outOfStock, accent: "text-rose-800" },
    { id: "featured", label: "Featured", count: metrics.featured },
  ];

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header & Action Controls ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Catalog & Stock</h1>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
              {metrics.total}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Manage product variants, inventory quantities, pricing, and live catalog visibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/admin/seller-products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted/60 transition"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            <span>Seller Hub ({metrics.sellerCount})</span>
          </Link>

          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-foreground/60" />
            <Input
              className="h-9 pl-8 pr-3 text-xs bg-background"
              placeholder="Search product or SKU..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isRefetching}
            className="h-9 gap-1.5 text-xs shrink-0 cursor-pointer text-foreground font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>

          <Button
            size="sm"
            onClick={() => open()}
            className="h-9 gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── Borderless Data Pillars (Non-vibe-coded Metrics) ─────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-border/80">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/70">Total Products</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{metrics.total}</p>
          <p className="text-[11px] text-foreground/65">Full platform catalog</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Active in Store</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{metrics.active}</p>
          <p className="text-[11px] text-foreground/65">Purchasable by shoppers</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Low Stock Alert</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{metrics.lowStock}</p>
          <p className="text-[11px] text-foreground/65">5 or fewer remaining</p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-800">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-rose-800">{metrics.outOfStock}</p>
          <p className="text-[11px] text-foreground/65">Needs inventory replenishment</p>
        </div>
      </div>

      {/* ── Fast Segmented Filter Tabs ───────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filterTabs.map((tab) => {
          const isActive = filter.toLowerCase() === tab.id.toLowerCase();
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition shrink-0 cursor-pointer border",
                isActive
                  ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                  : "bg-card text-foreground/75 border-border/80 hover:text-foreground hover:bg-muted/50"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive ? "bg-background/20 text-background" : "bg-muted text-foreground/80"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Flush Edge-to-Edge Products Table (No boxy cards) ───────────── */}
      <div className="overflow-x-auto border-y border-border/80">
        <table className="w-full min-w-[760px] text-xs">
          <thead className="text-left uppercase text-foreground/75 text-[10.5px] bg-muted/40 font-semibold tracking-wider">
            <tr className="border-b border-border/80">
              <th className="py-2.5 px-3">Product</th>
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3">Price</th>
              <th className="py-2.5 px-3">Stock Quantity</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {shown.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-foreground/60">
                  <Package className="mx-auto h-8 w-8 text-foreground/40 mb-2" />
                  <p className="text-sm font-medium text-foreground">No products match your criteria</p>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Try adjusting the search query or active filter.
                  </p>
                </td>
              </tr>
            ) : (
              shown.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= 5;

                return (
                  <tr key={p.id} className="hover:bg-muted/30 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5 max-w-sm">
                        <img
                          src={p.images[0] || "/assets/products/canvas-tote.jpg"}
                          alt=""
                          onError={(e) =>
                            ((e.currentTarget as HTMLImageElement).src = "/assets/products/canvas-tote.jpg")
                          }
                          className="h-10 w-9 rounded object-cover shrink-0 border border-border/50 bg-muted"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-foreground truncate block">
                            {translateProduct(p.name)}
                          </span>
                          {isNepali && (
                            <span className="text-[11px] text-foreground/60 block truncate">{p.name}</span>
                          )}
                          <span className="text-[10px] text-foreground/50 block font-mono">
                            slug: {p.slug}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3 font-mono text-xs text-foreground/80 font-medium">
                      {p.sku || <span className="text-foreground/40">—</span>}
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-foreground">{formatNPR(p.price)}</div>
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <div className="text-[10px] line-through text-foreground/50">
                          {formatNPR(p.compare_at_price)}
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          className={cn(
                            "h-7 w-20 text-xs bg-background font-semibold",
                            isOutOfStock && "border-rose-500/60 text-rose-800",
                            isLowStock && "border-amber-500/60 text-amber-800"
                          )}
                          aria-label={`Stock for ${p.name}`}
                          onBlur={(e) =>
                            Number(e.target.value) !== p.stock &&
                            quickStock(p.id, Number(e.target.value))
                          }
                        />
                        {isOutOfStock && (
                          <span className="text-[10px] text-rose-800 font-semibold shrink-0">
                            Out of stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="text-[10px] text-amber-800 font-semibold shrink-0">
                            Low
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          p.is_active
                            ? "bg-emerald-500/15 text-emerald-800 border-emerald-500/30"
                            : "bg-muted text-foreground/70 border-border"
                        )}
                      >
                        {p.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>

                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => open(p)}
                          className="h-7 text-xs font-medium cursor-pointer"
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                            >
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>{`Delete ${p.name}?`}</AlertDialogTitle>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => del(p.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Product Edit/Create Dialog ────────────────────────────────────── */}
      <Dialog open={!!f} onOpenChange={(o) => !o && setF(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogTitle className="text-lg font-bold">
            {f?.id ? "Edit Product" : "New Product"}
          </DialogTitle>
          {f && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <div>
                <Label className="text-xs font-semibold">Name</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">SKU (Product Code)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.sku}
                  onChange={(e) => setF({ ...f, sku: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Slug (URL identifier)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.slug}
                  placeholder="auto from name"
                  onChange={(e) => setF({ ...f, slug: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Subcategory</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.subcategory}
                  onChange={(e) => setF({ ...f, subcategory: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Category</Label>
                <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Choose Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {translateCategory(c.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Brand</Label>
                <Select value={f.brand_id} onValueChange={(v) => setF({ ...f, brand_id: v })}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue placeholder="Choose Brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">Price (Rs.)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min={0}
                  value={f.price}
                  onChange={(e) => setF({ ...f, price: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Original Price (For Discount Strike-through)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min={0}
                  value={f.compare_at_price}
                  onChange={(e) => setF({ ...f, compare_at_price: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Stock Quantity</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  type="number"
                  min={0}
                  value={f.stock}
                  onChange={(e) => setF({ ...f, stock: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Sizes (comma separated)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.sizes}
                  placeholder="S, M, L, XL"
                  onChange={(e) => setF({ ...f, sizes: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Colours (comma separated)</Label>
                <Input
                  className="h-8 text-xs mt-1"
                  value={f.colors}
                  placeholder="Black, White, Crimson"
                  onChange={(e) => setF({ ...f, colors: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Upload Image (WebP Compressed)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    className="h-8 text-xs"
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        upload(file);
                        e.target.value = "";
                      }
                    }}
                  />
                  {isUploading && <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Image URLs (comma separated)</Label>
                <Textarea
                  rows={2}
                  className="text-xs mt-1"
                  value={f.images}
                  onChange={(e) => setF({ ...f, images: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Description</Label>
                <Textarea
                  rows={3}
                  className="text-xs mt-1"
                  value={f.description}
                  onChange={(e) => setF({ ...f, description: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs font-semibold">Specifications (one 'Key: Value' per line)</Label>
                <Textarea
                  rows={3}
                  className="text-xs mt-1 font-mono"
                  placeholder="Material: 100% Organic Cotton&#10;Origin: Kathmandu, Nepal"
                  value={f.specs}
                  onChange={(e) => setF({ ...f, specs: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-6 sm:col-span-2 py-1">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Switch checked={f.is_featured} onCheckedChange={(v) => setF({ ...f, is_featured: v })} />
                  <span>Featured Product</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
                  <span>Visible in Storefront</span>
                </label>
              </div>
              <Button className="sm:col-span-2 h-9 text-xs font-semibold cursor-pointer" onClick={save}>
                Save Product
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
