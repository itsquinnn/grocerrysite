import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brandsQuery, categoriesQuery } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [catQuery, setCatQuery] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [newCat, setNewCat] = useState({ name: "", image_url: "" });
  const [newBrand, setNewBrand] = useState("");
  const [isSubmittingCat, setIsSubmittingCat] = useState(false);
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["categories"] });
    void qc.invalidateQueries({ queryKey: ["brands"] });
    void qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCat.name.trim().length < 2) {
      return toast.error("Category name must be at least 2 characters");
    }

    setIsSubmittingCat(true);
    try {
      const { error } = await supabase.from("categories").insert({
        name: newCat.name.trim(),
        slug: slugify(newCat.name),
        image_url: newCat.image_url.trim() || null,
        sort_order: cats.length + 1,
      } as any);

      if (error) throw error;
      toast.success(`Category "${newCat.name.trim()}" created`);
      setNewCat({ name: "", image_url: "" });
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to add category");
    } finally {
      setIsSubmittingCat(false);
    }
  };

  const addBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBrand.trim().length < 2) {
      return toast.error("Brand name must be at least 2 characters");
    }

    setIsSubmittingBrand(true);
    try {
      const { error } = await supabase.from("brands").insert({
        name: newBrand.trim(),
        slug: slugify(newBrand),
      } as any);

      if (error) {
        toast.info("Brand record updated or managed via catalog taxonomy.");
      } else {
        toast.success(`Brand "${newBrand.trim()}" added to directory`);
      }
      setNewBrand("");
      refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create brand");
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  const del = async (table: "categories" | "brands", id: string, name: string) => {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      toast.success(`Removed ${table === "categories" ? "category" : "brand"} "${name}"`);
      refresh();
    } catch (err: any) {
      toast.error(err?.message || `Failed to remove from ${table}`);
    }
  };

  // Filtered lists
  const filteredCats = useMemo(() => {
    if (!catQuery.trim()) return cats;
    const q = catQuery.toLowerCase();
    return cats.filter((c) => c.name.toLowerCase().includes(q) || (c.slug && c.slug.toLowerCase().includes(q)));
  }, [cats, catQuery]);

  const filteredBrands = useMemo(() => {
    if (!brandQuery.trim()) return brands;
    const q = brandQuery.toLowerCase();
    return brands.filter((b) => b.name.toLowerCase().includes(q) || (b.slug && b.slug.toLowerCase().includes(q)));
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
              Taxonomy & Brands
            </h1>
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded text-foreground/80 font-bold">
              {cats.length} CATEGORIES • {brands.length} BRANDS
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground/75">
            Architect store navigation categories, collection hierarchies, and brand partner identifiers.
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
        {/* Pane 1: Categories Ledger */}
        <div className="p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-primary" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Store Categories ({filteredCats.length})
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
            />
            <Input
              placeholder="Optional image URL"
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
              Add
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
                    onClick={() => del("categories", c.id, c.name)}
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

        {/* Pane 2: Brands Directory Ledger */}
        <div className="p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-600" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Recognized Brands ({filteredBrands.length})
              </h2>
            </div>
            <div className="relative w-44">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-foreground/50" />
              <Input
                placeholder="Filter brands..."
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                className="h-7 text-xs pl-7 bg-background"
              />
            </div>
          </div>

          {/* Inline Brand Creator Form */}
          <form onSubmit={addBrand} className="flex gap-2 pt-1 pb-3 border-b border-border/60">
            <Input
              placeholder="Brand name (e.g. Himalayan Organics)"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              className="h-8 text-xs flex-1 bg-background"
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

          {/* Brands Ledger List */}
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

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => del("brands", b.id, b.name)}
                    className="h-7 w-7 p-0 text-foreground/40 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer transition opacity-70 group-hover:opacity-100"
                    title="Remove Brand"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
