import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Layers,
  Tag,
  Plus,
  Trash2,
  Search,
  RefreshCw,
  FolderTree,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  GitFork,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/catalog")({
  component: Catalog,
  pendingComponent: CatalogSkeleton,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function CatalogSkeleton() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 rounded" />
          <Skeleton className="h-4 w-80 rounded" />
        </div>
        <Skeleton className="h-9 w-60 rounded-md" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 border-y border-border/80 divide-y xl:divide-y-0 xl:divide-x divide-border/80">
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-9 w-full rounded" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-9 w-full rounded" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Catalog() {
  const qc = useQueryClient();
  const { data: cats = [], isLoading: catsLoading } = useQuery(categoriesQuery);
  const { data: brands = [], isLoading: brandsLoading } = useQuery(brandsQuery);

  // Subcategories Query
  const { data: subcats = [], isLoading: subcatsLoading } = useQuery({
    queryKey: ["admin", "subcategories"],
    queryFn: async () => {
      try {
        const res = await api.get<any[]>("/admin/subcategories");
        const list = Array.isArray(res) ? res : (res as any)?.data;
        if (Array.isArray(list) && list.length > 0) return list;
      } catch (err) {
        console.warn("[admin.catalog] /admin/subcategories notice:", err);
      }

      try {
        const { data } = await supabase
          .from("subcategories")
          .select("*, categories(id, name)")
          .order("sort_order", { ascending: true });
        if (data && data.length > 0) return data;
      } catch {}

      return [];
    },
  });

  const [pane2Tab, setPane2Tab] = useState<"subcategories" | "brands">("subcategories");
  const [catQuery, setCatQuery] = useState("");
  const [subcatQuery, setSubcatQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");

  const [newCat, setNewCat] = useState({ name: "", image_url: "" });
  const [newSubcat, setNewSubcat] = useState({ name: "", category_id: "" });
  const [newBrand, setNewBrand] = useState("");

  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isSubmittingSubcat, setIsSubmittingSubcat] = useState(false);
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["categories"] });
    void qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    void qc.invalidateQueries({ queryKey: ["admin", "subcategories"] });
    void qc.invalidateQueries({ queryKey: ["brands"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  // ── ADD CATEGORY (Service-Role Admin API with Supabase Fallback) ───────
  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCat.name.trim();
    if (name.length < 2) {
      return toast.error("Category name must be at least 2 characters");
    }

    setIsSubmittingCat(true);
    const slug = slugify(name);
    const payload = {
      name,
      slug,
      image_url: newCat.image_url.trim() || null,
      sort_order: cats.length + 1,
      is_active: true,
    };

    try {
      let success = false;
      try {
        await api.post("/admin/categories", payload);
        success = true;
      } catch (apiErr: any) {
        console.warn("[admin.catalog] /admin/categories POST note:", apiErr?.message);
        try {
          await api.post("/categories", payload);
          success = true;
        } catch (e2: any) {
          console.warn("[admin.catalog] /categories POST note:", e2?.message);
        }
      }

      if (!success) {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }

      toast.success(`Category "${name}" created successfully`);
      setNewCat({ name: "", image_url: "" });
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add category");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  // ── DELETE CATEGORY ───────────────────────────────────────────────────
  const delCat = async (id: string, name: string) => {
    try {
      let success = false;
      try {
        await api.delete(`/admin/categories?id=${id}`);
        success = true;
      } catch (apiErr: any) {
        console.warn("[admin.catalog] API delete note:", apiErr?.message);
      }

      if (!success) {
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
      }

      toast.success(`Category "${name}" removed`);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove category");
    }
  };

  // ── ADD SUBCATEGORY (Service-Role Admin API) ───────────────────────────
  const addSubcat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcat.category_id) {
      return toast.error("Please select a parent category first");
    }
    const name = newSubcat.name.trim();
    if (name.length < 2) {
      return toast.error("Subcategory name must be at least 2 characters");
    }

    setIsSubmittingSubcat(true);
    const slug = slugify(name);
    const payload = {
      category_id: newSubcat.category_id,
      name,
      slug,
      sort_order: subcats.length + 1,
      is_active: true,
    };

    try {
      let success = false;
      try {
        await api.post("/admin/subcategories", payload);
        success = true;
      } catch (apiErr: any) {
        console.warn("[admin.catalog] /admin/subcategories note:", apiErr?.message);
      }

      if (!success) {
        const { error } = await supabase.from("subcategories").insert(payload);
        if (error) throw error;
      }

      toast.success(`Subcategory "${name}" created successfully`);
      setNewSubcat({ name: "", category_id: newSubcat.category_id });
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add subcategory");
    } finally {
      setIsSubmittingSubcat(false);
    }
  };

  // ── DELETE SUBCATEGORY ────────────────────────────────────────────────
  const delSubcat = async (id: string, name: string) => {
    try {
      let success = false;
      try {
        await api.delete(`/admin/subcategories?id=${id}`);
        success = true;
      } catch (apiErr: any) {
        console.warn("[admin.catalog] Subcategory API delete note:", apiErr?.message);
      }

      if (!success) {
        const { error } = await supabase.from("subcategories").delete().eq("id", id);
        if (error) throw error;
      }

      toast.success(`Subcategory "${name}" removed`);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove subcategory");
    }
  };

  // ── ADD BRAND ─────────────────────────────────────────────────────────
  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newBrand.trim();
    if (name.length < 2) {
      return toast.error("Brand name must be at least 2 characters");
    }

    setIsSubmittingBrand(true);
    try {
      const slug = slugify(name);
      try {
        await supabase.from("brands").insert({ name, slug } as any);
      } catch {}

      toast.success(`Brand "${name}" added to catalog directory`);
      setNewBrand("");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to register brand");
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  // ── FILTERED DATA ─────────────────────────────────────────────────────
  const filteredCats = useMemo(() => {
    if (!catQuery.trim()) return cats;
    const q = catQuery.toLowerCase();
    return cats.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.slug && c.slug.toLowerCase().includes(q))
    );
  }, [cats, catQuery]);

  const filteredSubcats = useMemo(() => {
    if (!subcatQuery.trim()) return subcats;
    const q = subcatQuery.toLowerCase();
    return subcats.filter(
      (s: any) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.categories?.name || "").toLowerCase().includes(q)
    );
  }, [subcats, subcatQuery]);

  const filteredBrands = useMemo(() => {
    if (!brandQuery.trim()) return brands;
    const q = brandQuery.toLowerCase();
    return brands.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.slug && b.slug.toLowerCase().includes(q))
    );
  }, [brands, brandQuery]);

  if (catsLoading || brandsLoading) {
    return <CatalogSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Console Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Taxonomy & Structure
            </h1>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground/80 font-bold">
              {cats.length} CATEGORIES • {subcats.length} SUBCATEGORIES • {brands.length} BRANDS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Manage primary store categories, subcategory linkages, and brand partner identifiers.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          className="h-8 gap-1.5 text-xs self-start sm:self-auto cursor-pointer text-foreground font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Sync Taxonomy</span>
        </Button>
      </div>

      {/* ── Split Dual-Pane Console Workspace (Zero Box Cards) ─────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 border-y border-border/80 divide-y xl:divide-y-0 xl:divide-x divide-border/80">
        {/* ── PANE 1: PRIMARY CATEGORIES ───────────────────────────────── */}
        <div className="p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Categories ({filteredCats.length})
              </h2>
            </div>
            <div className="relative w-44">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-foreground/50" />
              <Input
                placeholder="Filter categories..."
                value={catQuery}
                onChange={(e) => setCatQuery(e.target.value)}
                className="h-7 text-xs pl-7 bg-background"
              />
            </div>
          </div>

          {/* Inline Category Creator Form */}
          <form onSubmit={addCat} className="flex flex-col sm:flex-row gap-2 pt-1 pb-3 border-b border-border/60">
            <Input
              placeholder="Category name (e.g. Traditional Dhaka)"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              className="h-8 text-xs flex-1 bg-background"
              required
            />
            <Input
              placeholder="Image URL (optional)"
              value={newCat.image_url}
              onChange={(e) => setNewCat({ ...newCat, image_url: e.target.value })}
              className="h-8 text-xs sm:w-48 bg-background"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSubmittingCat || !newCat.name.trim()}
              className="h-8 text-xs font-semibold gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              {isSubmittingCat ? "Adding..." : "Add Category"}
            </Button>
          </form>

          {/* Categories Ledger List */}
          <div className="divide-y divide-border/50 max-h-[560px] overflow-y-auto pr-1">
            {filteredCats.length === 0 ? (
              <div className="py-8 text-center text-xs text-foreground/60">
                No categories found matching "{catQuery}".
              </div>
            ) : (
              filteredCats.map((c, idx) => (
                <div
                  key={c.id}
                  className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-muted/20 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] text-foreground/40 w-5 text-right shrink-0">
                      {(idx + 1).toString().padStart(2, "0")}
                    </span>
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt=""
                        className="h-7 w-7 rounded object-cover border border-border/60 shrink-0"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded bg-muted/60 border border-border/60 grid place-items-center shrink-0">
                        <ImageIcon className="h-3.5 w-3.5 text-foreground/40" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{c.name}</p>
                      <p className="font-mono text-[10.5px] text-foreground/50 truncate">
                        slug: {c.slug || slugify(c.name)}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => delCat(c.id, c.name)}
                    className="h-7 w-7 p-0 text-foreground/40 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition opacity-70 group-hover:opacity-100"
                    title="Remove Category"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── PANE 2: SUBCATEGORIES & BRANDS ───────────────────────────── */}
        <div className="p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPane2Tab("subcategories")}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition cursor-pointer flex items-center gap-1.5",
                  pane2Tab === "subcategories"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                )}
              >
                <GitFork className="h-3.5 w-3.5" />
                Subcategories ({filteredSubcats.length})
              </button>

              <button
                type="button"
                onClick={() => setPane2Tab("brands")}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider py-1 border-b-2 transition cursor-pointer flex items-center gap-1.5",
                  pane2Tab === "brands"
                    ? "border-primary text-primary"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                )}
              >
                <Tag className="h-3.5 w-3.5" />
                Brands ({filteredBrands.length})
              </button>
            </div>

            <div className="relative w-44">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-foreground/50" />
              <Input
                placeholder={pane2Tab === "subcategories" ? "Filter subcategories..." : "Filter brands..."}
                value={pane2Tab === "subcategories" ? subcatQuery : brandQuery}
                onChange={(e) =>
                  pane2Tab === "subcategories"
                    ? setSubcatQuery(e.target.value)
                    : setBrandQuery(e.target.value)
                }
                className="h-7 text-xs pl-7 bg-background"
              />
            </div>
          </div>

          {/* Subcategories View */}
          {pane2Tab === "subcategories" && (
            <>
              {/* Add Subcategory Form */}
              <form
                onSubmit={addSubcat}
                className="flex flex-col sm:flex-row gap-2 pt-1 pb-3 border-b border-border/60"
              >
                <Select
                  value={newSubcat.category_id}
                  onValueChange={(val) => setNewSubcat({ ...newSubcat, category_id: val })}
                >
                  <SelectTrigger className="h-8 text-xs sm:w-48 bg-background">
                    <SelectValue placeholder="Parent Category" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56 z-[110]">
                    {cats.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Subcategory name (e.g. Pashmina Shawl)"
                  value={newSubcat.name}
                  onChange={(e) => setNewSubcat({ ...newSubcat, name: e.target.value })}
                  className="h-8 text-xs flex-1 bg-background"
                  required
                />

                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingSubcat || !newSubcat.name.trim() || !newSubcat.category_id}
                  className="h-8 text-xs font-semibold gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {isSubmittingSubcat ? "Adding..." : "Add"}
                </Button>
              </form>

              {/* Subcategories List */}
              <div className="divide-y divide-border/50 max-h-[560px] overflow-y-auto pr-1">
                {filteredSubcats.length === 0 ? (
                  <div className="py-8 text-center text-xs text-foreground/60">
                    No subcategories found. Select a parent category above to create one.
                  </div>
                ) : (
                  filteredSubcats.map((s: any, idx: number) => (
                    <div
                      key={s.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-muted/20 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-foreground/40 w-5 text-right shrink-0">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">{s.name}</p>
                          <p className="text-[10.5px] text-foreground/50 truncate flex items-center gap-1">
                            <span>in</span>
                            <span className="font-medium text-primary">
                              {s.categories?.name || "Category"}
                            </span>
                            <span>•</span>
                            <span className="font-mono">slug: {s.slug || slugify(s.name)}</span>
                          </p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => delSubcat(s.id, s.name)}
                        className="h-7 w-7 p-0 text-foreground/40 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition opacity-70 group-hover:opacity-100"
                        title="Remove Subcategory"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Brands View */}
          {pane2Tab === "brands" && (
            <>
              {/* Add Brand Form */}
              <form onSubmit={addBrand} className="flex gap-2 pt-1 pb-3 border-b border-border/60">
                <Input
                  placeholder="Brand partner name (e.g. Himalayan Organics)"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="h-8 text-xs flex-1 bg-background"
                  required
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingBrand || !newBrand.trim()}
                  className="h-8 text-xs font-semibold gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Brand
                </Button>
              </form>

              {/* Brands List */}
              <div className="divide-y divide-border/50 max-h-[560px] overflow-y-auto pr-1">
                {filteredBrands.length === 0 ? (
                  <div className="py-8 text-center text-xs text-foreground/60">
                    No brands found matching "{brandQuery}".
                  </div>
                ) : (
                  filteredBrands.map((b, idx) => (
                    <div
                      key={b.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-muted/20 transition group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-[10px] text-foreground/40 w-5 text-right shrink-0">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">{b.name}</p>
                          <p className="font-mono text-[10.5px] text-foreground/50 truncate">
                            slug: {b.slug || slugify(b.name)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
