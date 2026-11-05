import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { categoriesQuery } from "@/lib/catalog";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Store,
  Package,
  Layers,
  Search,
  ExternalLink,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Phone,
  MapPin,
  QrCode,
  Tag,
  AlertTriangle,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/seller-products")({
  component: AdminSellerProductsPage,
});

interface EditFormState {
  id: string;
  title: string;
  price: string;
  original_price: string;
  stock_quantity: string;
  unit: string;
  category_id: string;
  description: string;
  is_active: boolean;
  image_url: string;
  pickup_address: string;
  pickup_phone: string;
}

function AdminSellerProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "out_of_stock">("all");
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>("all");

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<EditFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion state
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery(categoriesQuery);

  // Fetch all products from admin API
  const {
    data,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get<{ products: any[] }>("/admin/products"),
  });

  const allProducts = data?.products || [];

  // Filter products that belong to sellers (seller_id != null or pickup_address exists)
  const sellerProducts = useMemo(() => {
    return allProducts.filter((p: any) => Boolean(p.seller_id || p.pickup_address));
  }, [allProducts]);

  // Extract unique sellers for filter dropdown
  const sellerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of sellerProducts) {
      const sellerId = p.seller_id || "unknown";
      const sellerName = p.pickup_address ? `Seller (${p.pickup_address.split(",")[0]})` : `Seller ${sellerId.slice(0, 8)}`;
      if (!map.has(sellerId)) {
        map.set(sellerId, sellerName);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [sellerProducts]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return sellerProducts.filter((p: any) => {
      const title = (p.title || p.name || "").toLowerCase();
      const code = (p.product_code || p.id || "").toLowerCase();
      const address = (p.pickup_address || "").toLowerCase();
      const query = search.toLowerCase();

      // Search match
      const matchesSearch = !search || title.includes(query) || code.includes(query) || address.includes(query);

      // Seller filter match
      const matchesSeller = selectedSellerFilter === "all" || p.seller_id === selectedSellerFilter;

      // Status filter match
      const stock = p.stock_quantity ?? p.stock ?? 0;
      const isActive = p.is_active !== false && p.approval_status !== "rejected";

      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = isActive && stock > 0;
      if (statusFilter === "inactive") matchesStatus = !isActive;
      if (statusFilter === "out_of_stock") matchesStatus = stock <= 0;

      return matchesSearch && matchesSeller && matchesStatus;
    });
  }, [sellerProducts, search, selectedSellerFilter, statusFilter]);

  // Quick Stock update
  const handleQuickStock = async (id: string, newStock: number) => {
    if (newStock < 0) return;
    try {
      await api.patch("/admin/products", { id, stock_quantity: newStock });
      toast.success(`Stock updated to ${newStock}`);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update stock");
    }
  };

  // Toggle active visibility on live store
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const nextActive = !currentActive;
      await api.patch("/admin/products", {
        id,
        is_active: nextActive,
        approval_status: nextActive ? "listed" : "pending",
      });
      toast.success(nextActive ? "Product is now live on store" : "Product hidden from store");
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status");
    }
  };

  // Open Edit Modal
  const openEditModal = (p: any) => {
    const priceNpr = (p.price_paise || 0) / 100 || p.price || 0;
    const origNpr = (p.original_price_paise || 0) / 100 || p.compare_at_price || "";
    setEditingProduct({
      id: p.id,
      title: p.title || p.name || "",
      price: String(priceNpr),
      original_price: origNpr ? String(origNpr) : "",
      stock_quantity: String(p.stock_quantity ?? p.stock ?? 0),
      unit: p.unit || "1 Piece",
      category_id: p.category_id || "",
      description: p.description || "",
      is_active: p.is_active !== false,
      image_url: p.image_url || (Array.isArray(p.images) ? p.images[0] : "") || "",
      pickup_address: p.pickup_address || "",
      pickup_phone: p.pickup_phone || "",
    });
  };

  // Save Edit Changes
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    const priceNum = parseFloat(editingProduct.price);
    if (isNaN(priceNum) || priceNum <= 0) return toast.error("Please enter a valid price");
    const stockNum = parseInt(editingProduct.stock_quantity, 10);
    if (isNaN(stockNum) || stockNum < 0) return toast.error("Please enter a valid stock quantity");

    try {
      setIsSaving(true);
      const payload: any = {
        id: editingProduct.id,
        title: editingProduct.title.trim(),
        price_paise: Math.round(priceNum * 100),
        original_price_paise: editingProduct.original_price
          ? Math.round(parseFloat(editingProduct.original_price) * 100)
          : null,
        stock_quantity: stockNum,
        unit: editingProduct.unit.trim() || "1 Piece",
        category_id: editingProduct.category_id || null,
        description: editingProduct.description.trim() || null,
        is_active: editingProduct.is_active,
        approval_status: editingProduct.is_active ? "listed" : "pending",
        pickup_address: editingProduct.pickup_address.trim() || undefined,
        pickup_phone: editingProduct.pickup_phone.trim() || undefined,
      };

      await api.patch("/admin/products", payload);
      toast.success("Seller product updated successfully!");
      setEditingProduct(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Seller Product
  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/admin/products?id=${productToDelete.id}`);
      toast.success(`"${productToDelete.title || productToDelete.name}" deleted from store`);
      setProductToDelete(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete seller product");
    } finally {
      setIsDeleting(false);
    }
  };

  // KPI Calculations
  const activeCount = sellerProducts.filter(
    (p: any) => p.is_active !== false && (p.stock_quantity ?? p.stock ?? 0) > 0
  ).length;
  const outOfStockCount = sellerProducts.filter(
    (p: any) => (p.stock_quantity ?? p.stock ?? 0) <= 0
  ).length;
  const inactiveCount = sellerProducts.filter((p: any) => p.is_active === false).length;

  return (
    <div className="space-y-3.5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <Package className="h-5 w-5 text-primary" />
              Seller Products Control
            </h1>
            <span className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10.5px] font-semibold">
              Marketplace Moderation
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Control, adjust prices/stock, toggle active visibility, or delete seller-submitted products across DOVAN.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/sellers"
            className="inline-flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
          >
            <Store className="h-3.5 w-3.5 text-primary" />
            Seller Partners Hub
          </Link>

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── KPI Metric Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-2xl border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Total Seller Products</span>
            <Layers className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {sellerProducts.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Across verified merchants
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Live on Store</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {activeCount}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            Direct published & active
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Out of Stock</span>
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {outOfStockCount}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-0.5">
            Inventory at 0 units
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Hidden / Paused</span>
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {inactiveCount}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Deactivated by admin or seller
          </div>
        </div>
      </div>

      {/* ── Search & Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2.5 bg-card p-2 rounded-2xl border">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by title, code, pickup location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 text-xs h-8 bg-background rounded-xl"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(val: any) => setStatusFilter(val)}
          >
            <SelectTrigger className="h-8 text-xs w-36 rounded-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Live & In Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              <SelectItem value="inactive">Hidden / Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Seller Filter */}
          {sellerOptions.length > 0 && (
            <Select
              value={selectedSellerFilter}
              onValueChange={(val) => setSelectedSellerFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs w-44 rounded-xl">
                <SelectValue placeholder="All Sellers" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Sellers</SelectItem>
                {sellerOptions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── Products Table / List ────────────────────────────────────────────── */}
      <div className="rounded-2xl border bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase font-semibold text-[10.5px]">
              <tr>
                <th className="py-2.5 px-3.5">Product Details</th>
                <th className="py-2.5 px-3">Seller & Pickup</th>
                <th className="py-2.5 px-3">Price</th>
                <th className="py-2.5 px-3">Stock Units</th>
                <th className="py-2.5 px-3">Store Status</th>
                <th className="py-2.5 px-3.5 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading seller products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    No seller products found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p: any) => {
                  const priceNpr = (p.price_paise || 0) / 100 || p.price || 0;
                  const origNpr = (p.original_price_paise || 0) / 100 || p.compare_at_price || null;
                  const stock = p.stock_quantity ?? p.stock ?? 0;
                  const isActive = p.is_active !== false && p.approval_status !== "rejected";
                  const thumb = p.image_url || (Array.isArray(p.images) ? p.images[0] : null);

                  return (
                    <tr key={p.id} className="hover:bg-muted/20 transition">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 max-w-sm">
                          <div className="h-14 w-14 shrink-0 rounded-lg border bg-muted overflow-hidden relative">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={p.title || p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                <Package className="h-5 w-5 opacity-30" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold text-foreground text-sm block truncate">
                              {p.title || p.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                              {p.product_code && (
                                <span className="font-mono text-[10.5px] bg-muted px-1.5 py-0.2 rounded">
                                  {p.product_code}
                                </span>
                              )}
                              {p.categories?.name && (
                                <span className="text-[10.5px] truncate">
                                  • {p.categories.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Seller & Pickup info */}
                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5 max-w-[200px]">
                          <div className="font-semibold text-foreground flex items-center gap-1">
                            <Store className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">
                              {p.seller_id ? `Seller: ${p.seller_id.slice(0, 10)}` : "Verified Merchant"}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span>{p.pickup_address || "Standard Address"}</span>
                          </div>
                          {p.pickup_phone && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Phone className="h-2.5 w-2.5 shrink-0" />
                              <span>{p.pickup_phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-semibold text-foreground">
                        <div>{formatNPR(priceNpr)}</div>
                        {origNpr && origNpr > priceNpr && (
                          <div className="text-[10px] text-muted-foreground line-through">
                            {formatNPR(origNpr)}
                          </div>
                        )}
                        <span className="text-[10px] font-normal text-muted-foreground">
                          / {p.unit || "item"}
                        </span>
                      </td>

                      {/* Stock with quick inline editor */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number"
                            min={0}
                            defaultValue={stock}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== stock) {
                                handleQuickStock(p.id, val);
                              }
                            }}
                            className="h-8 w-16 text-center font-bold text-xs"
                          />
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              stock > 0
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-rose-500/10 text-rose-700"
                            }`}
                          >
                            {stock > 0 ? "In Stock" : "Out"}
                          </span>
                        </div>
                      </td>

                      {/* Store Visibility Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(p.id, isActive)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold cursor-pointer border transition ${
                            isActive
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/25"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Eye className="h-3 w-3 text-emerald-600" />
                              Live in Store
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-muted-foreground" />
                              Hidden
                            </>
                          )}
                        </button>
                      </td>

                      {/* Admin Controls: Edit, View, Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live View */}
                          <a
                            href={`/product/${p.slug || p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            title="View on public storefront"
                            className="p-1.5 rounded-lg border hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                          {/* Edit Product */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(p)}
                            className="text-xs h-8 px-2.5 cursor-pointer"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {/* Delete Product */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setProductToDelete(p)}
                            className="text-xs h-8 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal: Edit Seller Product ──────────────────────────────────────── */}
      <Dialog open={Boolean(editingProduct)} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4 text-primary" />
              Edit Seller Product Details
            </DialogTitle>
            <DialogDescription>
              Admin changes will immediately update the live DOVAN storefront.
            </DialogDescription>
          </DialogHeader>

          {editingProduct && (
            <div className="space-y-4 py-2 text-xs">
              <div>
                <Label htmlFor="edit_title" className="text-xs font-semibold">
                  Product Title *
                </Label>
                <Input
                  id="edit_title"
                  value={editingProduct.title}
                  onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_price" className="text-xs font-semibold">
                    Price (NPR) *
                  </Label>
                  <Input
                    id="edit_price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_original_price" className="text-xs font-semibold">
                    Original Price (NPR - for strike-through discount)
                  </Label>
                  <Input
                    id="edit_original_price"
                    type="number"
                    value={editingProduct.original_price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, original_price: e.target.value })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="edit_stock" className="text-xs font-semibold">
                    Stock Quantity *
                  </Label>
                  <Input
                    id="edit_stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_unit" className="text-xs font-semibold">
                    Unit (e.g. 1 Piece, 1 kg, Box)
                  </Label>
                  <Input
                    id="edit_unit"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit_category" className="text-xs font-semibold">
                  Category
                </Label>
                <Select
                  value={editingProduct.category_id}
                  onValueChange={(val) => setEditingProduct({ ...editingProduct, category_id: val })}
                >
                  <SelectTrigger id="edit_category" className="mt-1 h-9 text-xs">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit_desc" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="edit_desc"
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <Label htmlFor="edit_pickup" className="text-xs font-semibold">
                    Pickup Address
                  </Label>
                  <Input
                    id="edit_pickup"
                    value={editingProduct.pickup_address}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, pickup_address: e.target.value })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>

                <div>
                  <Label htmlFor="edit_phone" className="text-xs font-semibold">
                    Seller Contact Phone
                  </Label>
                  <Input
                    id="edit_phone"
                    value={editingProduct.pickup_phone}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, pickup_phone: e.target.value })
                    }
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div>
                  <div className="font-semibold text-foreground">Live Store Visibility</div>
                  <div className="text-[11px] text-muted-foreground">
                    Enable to keep this product available for buyers across Nepal.
                  </div>
                </div>
                <Switch
                  checked={editingProduct.is_active}
                  onCheckedChange={(checked) =>
                    setEditingProduct({ ...editingProduct, is_active: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingProduct(null)}
              disabled={isSaving}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving}
              className="text-xs font-semibold cursor-pointer"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Confirm Delete Seller Product ───────────────────────────── */}
      <AlertDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Delete Seller Product from DOVAN?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{productToDelete?.title || productToDelete?.name}"</strong>?
              This will remove the product permanently from the DOVAN catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
            <div><strong className="text-foreground">Product Code:</strong> {productToDelete?.product_code || productToDelete?.id}</div>
            <div><strong className="text-foreground">Seller Pickup:</strong> {productToDelete?.pickup_address || "Standard"}</div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              {isDeleting ? "Deleting..." : "Yes, Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
