import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { categoriesQuery } from "@/lib/catalog";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Store,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  UploadCloud,
  Package,
  RefreshCw,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/sell")({
  component: AccountSellPage,
});

type FormState = {
  title: string;
  description: string;
  price: string;
  original_price: string;
  unit: string;
  category_id: string;
  stock_quantity: string;
  image_url: string;
  pickup_address: string;
  pickup_phone: string;
  pickup_time: string;
};

const initialForm: FormState = {
  title: "",
  description: "",
  price: "",
  original_price: "",
  unit: "1 Piece",
  category_id: "",
  stock_quantity: "5",
  image_url: "",
  pickup_address: "",
  pickup_phone: "",
  pickup_time: "Standard Business Hours (10 AM - 5 PM)",
};

function AccountSellPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"submissions" | "new">("submissions");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch categories
  const { data: categories = [] } = useQuery(categoriesQuery);

  // 2. Fetch user's saved addresses to auto-fill pickup details
  const { data: addressData } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<{ addresses: any[] }>("/addresses"),
  });

  useEffect(() => {
    if (addressData?.addresses && addressData.addresses.length > 0 && !form.pickup_address) {
      const def = addressData.addresses.find((a: any) => a.is_default) || addressData.addresses[0];
      setForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || def.summary || `${def.street}, ${def.city || ""}`,
        pickup_phone: prev.pickup_phone || def.phone || "",
      }));
    }
  }, [addressData]);

  // 3. Fetch user's submitted products
  const {
    data: submissionsData,
    isLoading: loadingSubmissions,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["products", "my-submissions"],
    queryFn: () => api.get<{ products: any[]; total: number; counts: Record<string, number> }>("/products/my-submissions"),
  });

  const submissions = submissionsData?.products || [];
  const counts = submissionsData?.counts || { pending: 0, scheduled: 0, listed: 0, rejected: 0 };

  // Image file upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, WEBP)");
      return;
    }

    try {
      setIsUploading(true);
      const fd = new FormData();
      fd.append("file", file);

      const res = await api.post<{ image_url?: string; url?: string }>("/products/upload", fd);
      const uploadedUrl = res.image_url || res.url;
      if (uploadedUrl) {
        setForm((prev) => ({ ...prev, image_url: uploadedUrl }));
        toast.success("Image uploaded successfully");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit product for admin review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Product title is required");
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) return toast.error("Please enter a valid price");
    const stockNum = parseInt(form.stock_quantity, 10);
    if (isNaN(stockNum) || stockNum < 0) return toast.error("Please enter a valid stock quantity");
    if (!form.pickup_address.trim()) return toast.error("Pickup address is required");
    if (!form.pickup_phone.trim() || form.pickup_phone.length < 7) {
      return toast.error("Valid contact phone is required for courier pickup");
    }

    try {
      setIsSubmitting(true);
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        price_paise: Math.round(priceNum * 100),
        original_price_paise: form.original_price ? Math.round(parseFloat(form.original_price) * 100) : undefined,
        unit: form.unit.trim() || "1 Piece",
        stock_quantity: stockNum,
        pickup_address: form.pickup_address.trim(),
        pickup_phone: form.pickup_phone.trim(),
        pickup_time: form.pickup_time || "Standard Business Hours (10 AM - 5 PM)",
      };

      if (form.category_id) payload.category_id = form.category_id;
      if (form.image_url) payload.image_url = form.image_url;

      await api.post("/products/submit", payload);

      toast.success("Product submitted successfully! Admin will review and schedule pickup.");
      setForm(initialForm);
      setActiveTab("submissions");
      void qc.invalidateQueries({ queryKey: ["products", "my-submissions"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending Review",
          color: "bg-amber-500/15 text-amber-700 border-amber-500/30",
          icon: Clock,
          desc: "Under admin review. Our team will verify listing details.",
        };
      case "scheduled_for_pickup":
      case "approved":
        return {
          label: "Pickup Scheduled",
          color: "bg-blue-500/15 text-blue-700 border-blue-500/30",
          icon: Truck,
          desc: "Approved! Courier will pick up item from your pickup address.",
        };
      case "listed":
        return {
          label: "Active on Store",
          color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
          icon: CheckCircle2,
          desc: "Live in store catalog! Buyers across Nepal can now order this.",
        };
      case "rejected":
        return {
          label: "Rejected",
          color: "bg-rose-500/15 text-rose-700 border-rose-500/30",
          icon: XCircle,
          desc: "Submission was not approved by admin.",
        };
      default:
        return {
          label: status,
          color: "bg-muted text-muted-foreground border-border",
          icon: Clock,
          desc: "",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Tab Switcher ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Seller Submissions
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              <Store className="h-3 w-3" />
              Customer Marketplace
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            List your own authentic handcrafted or curated goods on DOVAN with admin approval & express courier pickup.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeTab === "submissions" ? "default" : "outline"}
            onClick={() => setActiveTab("submissions")}
            className="text-xs h-9 cursor-pointer"
          >
            <Package className="h-3.5 w-3.5 mr-1.5" />
            My Submissions ({submissions.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className="text-xs h-9 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Sell a Product
          </Button>
        </div>
      </div>

      {/* ── SUBMISSIONS LIST TAB ─────────────────────────────────────────── */}
      {activeTab === "submissions" && (
        <div className="space-y-5">
          {/* Status KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Pending</span>
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{counts.pending || 0}</div>
              <div className="text-[11px] text-muted-foreground">Awaiting review</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Pickup Ready</span>
                <Truck className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{counts.scheduled || 0}</div>
              <div className="text-[11px] text-muted-foreground">Approved for pickup</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Live in Store</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{counts.listed || 0}</div>
              <div className="text-[11px] text-muted-foreground">Active catalog</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Rejected</span>
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{counts.rejected || 0}</div>
              <div className="text-[11px] text-muted-foreground">Criteria not met</div>
            </div>
          </div>

          {/* List of submissions */}
          <div className="flex items-center justify-between pt-2">
            <h3 className="text-sm font-semibold text-foreground">Submitted Products History</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {loadingSubmissions ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading your submitted products...
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center bg-muted/20">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <h4 className="mt-3 text-base font-semibold text-foreground">No products submitted yet</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Got handcrafted goods, local produce, or specialty wares to sell? Submit an item and our team will review & arrange courier pickup.
              </p>
              <Button
                onClick={() => setActiveTab("new")}
                size="sm"
                className="mt-4 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Submit Your First Product
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {submissions.map((p: any) => {
                const statusMeta = getStatusBadge(p.approval_status);
                const StatusIcon = statusMeta.icon;
                const priceNpr = (p.price_paise || 0) / 100;
                const origNpr = p.original_price_paise ? p.original_price_paise / 100 : null;

                return (
                  <div
                    key={p.id}
                    className="group rounded-xl border bg-card p-4 sm:p-5 shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      {/* Image Preview */}
                      <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-lg border bg-muted overflow-hidden relative">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8 opacity-40" />
                          </div>
                        )}
                      </div>

                      {/* Info & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <h4 className="text-base font-semibold text-foreground truncate">
                            {p.title}
                          </h4>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </span>
                        </div>

                        {/* Price & Unit */}
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-base font-bold text-foreground">
                            {formatNPR(priceNpr)}
                          </span>
                          {origNpr && origNpr > priceNpr && (
                            <span className="text-xs text-muted-foreground line-through">
                              {formatNPR(origNpr)}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground font-medium">
                            / {p.unit || "item"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • Stock: {p.stock_quantity ?? 0}
                          </span>
                        </div>

                        {/* Tracking Code & Category */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {p.product_code && (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold bg-muted px-2 py-0.5 rounded text-[11px] text-foreground">
                              <QrCode className="h-3 w-3" />
                              {p.product_code}
                            </span>
                          )}
                          {p.categories?.name && (
                            <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px]">
                              {p.categories.name}
                            </span>
                          )}
                        </div>

                        {/* Status Description Box */}
                        <div className="mt-3 rounded-lg border bg-muted/30 p-2.5 text-xs">
                          <div className="font-medium text-foreground flex items-center gap-1.5">
                            <StatusIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span>{statusMeta.desc}</span>
                          </div>

                          {/* Pickup schedule detail */}
                          {p.pickup_time && (
                            <div className="mt-1 text-muted-foreground text-[11px] pl-5">
                              Pickup Window: <strong className="text-foreground">{p.pickup_time}</strong>
                            </div>
                          )}

                          {/* Rejection reason if rejected */}
                          {p.approval_status === "rejected" && p.rejection_reason && (
                            <div className="mt-1 text-rose-600 text-[11px] pl-5 font-medium">
                              Reason: {p.rejection_reason}
                            </div>
                          )}

                          {/* Admin internal notes for seller */}
                          {p.admin_notes && (
                            <div className="mt-1 text-muted-foreground text-[11px] pl-5">
                              Admin note: {p.admin_notes}
                            </div>
                          )}
                        </div>

                        {/* Pickup address detail */}
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          Pickup from: <span className="text-foreground">{p.pickup_address}</span> (Phone: {p.pickup_phone})
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NEW PRODUCT SUBMISSION FORM TAB ──────────────────────────────── */}
      {activeTab === "new" && (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
          {/* Section: Basic Details */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Product Information
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide accurate details about what you are selling.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="title" className="text-xs font-semibold">
                  Product Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Handmade Himalayan Yak Wool Shawl"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 text-sm h-10"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe material, origin, quality, warranty, and special details..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="category" className="text-xs font-semibold">
                    Category
                  </Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(val) => setForm({ ...form, category_id: val })}
                  >
                    <SelectTrigger id="category" className="mt-1 h-10 text-sm">
                      <SelectValue placeholder="Select a category" />
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
                  <Label htmlFor="unit" className="text-xs font-semibold">
                    Unit / Packaging *
                  </Label>
                  <Input
                    id="unit"
                    placeholder="e.g. 1 Piece, 1 Set, 500 g, 1 Pair"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="mt-1 text-sm h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="price" className="text-xs font-semibold">
                    Selling Price (Rs. NPR) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1500"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 text-sm h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="original_price" className="text-xs font-semibold">
                    Original Price (Rs. optional)
                  </Label>
                  <Input
                    id="original_price"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 1800"
                    value={form.original_price}
                    onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                    className="mt-1 text-sm h-10"
                  />
                </div>

                <div>
                  <Label htmlFor="stock" className="text-xs font-semibold">
                    Available Stock *
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 10"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="mt-1 text-sm h-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Photo Upload */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-primary" />
                Product Photo
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clear, well-lit photos increase approval speed and customer trust.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="h-28 w-28 shrink-0 rounded-xl border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden relative">
                {form.image_url ? (
                  <img
                    src={form.image_url}
                    alt="Product preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-muted-foreground">
                    <Package className="h-8 w-8 mx-auto opacity-40" />
                    <span className="text-[10px] block mt-1">No image yet</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 w-full">
                <Label htmlFor="file_upload" className="text-xs font-semibold block">
                  Upload Image File (WebP, JPG, PNG)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file_upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="text-xs h-9 cursor-pointer"
                  />
                  {isUploading && (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary shrink-0" />
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Or paste a direct image URL:
                </div>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* Section: Courier Pickup & Verification */}
          <div className="rounded-xl border bg-card p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="border-b pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-600" />
                Pickup Location & Logistics
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Once approved, a DOVAN rider will collect the item from this address to dispatch to buyers.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="pickup_address" className="text-xs font-semibold">
                  Pickup Address (Full location with Landmark) *
                </Label>
                <Input
                  id="pickup_address"
                  placeholder="e.g. New Road, Ward 22, Near Bishal Bazar, Kathmandu"
                  value={form.pickup_address}
                  onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                  className="mt-1 text-sm h-10"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pickup_phone" className="text-xs font-semibold">
                    Contact Mobile Number for Pickup *
                  </Label>
                  <Input
                    id="pickup_phone"
                    type="tel"
                    placeholder="98XXXXXXXX"
                    value={form.pickup_phone}
                    onChange={(e) => setForm({ ...form, pickup_phone: e.target.value })}
                    className="mt-1 text-sm h-10"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="pickup_time" className="text-xs font-semibold">
                    Preferred Pickup Window
                  </Label>
                  <Select
                    value={form.pickup_time}
                    onValueChange={(val) => setForm({ ...form, pickup_time: val })}
                  >
                    <SelectTrigger id="pickup_time" className="mt-1 h-10 text-sm">
                      <SelectValue placeholder="Select pickup window" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</SelectItem>
                      <SelectItem value="Standard Business Hours (10 AM - 5 PM)">
                        Standard Business Hours (10 AM - 5 PM)
                      </SelectItem>
                      <SelectItem value="Evening (3 PM - 7 PM)">Evening (3 PM - 7 PM)</SelectItem>
                      <SelectItem value="Anytime with advance call">
                        Anytime with advance call
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>How DOVAN Seller Protection works:</strong> Your product will be reviewed by admin within 24 hours. Once approved, you will receive an SMS/notification, our courier collects the item, and it is listed live for buyers.
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 h-10 font-semibold cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Submitting Product...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("submissions")}
              className="h-10 text-xs cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
