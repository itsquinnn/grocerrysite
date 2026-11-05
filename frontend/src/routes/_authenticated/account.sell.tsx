import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { categoriesQuery } from "@/lib/catalog";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { useShop } from "@/lib/shop";
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
  Sparkles,
  Lock,
  ArrowRight,
  FileCheck,
  Building2,
  Phone,
  MapPin,
  HelpCircle,
  AlertCircle,
  Layers,
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

type SellerApplicationForm = {
  store_name: string;
  seller_phone: string;
  pickup_address: string;
  business_type: string;
  id_type: string;
  id_number: string;
  seller_description: string;
};

const initialApplication: SellerApplicationForm = {
  store_name: "",
  seller_phone: "",
  pickup_address: "",
  business_type: "Individual Artisan / Craftsperson",
  id_type: "Citizenship (नागरिकता)",
  id_number: "",
  seller_description: "",
};

function AccountSellPage() {
  const qc = useQueryClient();
  const { user, isAdmin } = useShop();

  // ── SELLER VERIFICATION STATE (Frontend Simulated & Persistent in LocalStorage until DB chunk) ──
  // States: "none" (not requested) | "pending" (under review) | "approved" (verified seller) | "rejected"
  const storageKey = user?.id ? `dovan_seller_status_${user.id}` : "dovan_seller_status";
  const [sellerStatus, setSellerStatus] = useState<"none" | "pending" | "approved" | "rejected">(() => {
    if (isAdmin) return "approved"; // Admin automatically gets full seller access for preview
    const saved = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    return (saved as any) || "none";
  });

  const [applicationForm, setApplicationForm] = useState<SellerApplicationForm>(() => {
    const savedApp = typeof window !== "undefined" ? localStorage.getItem(`${storageKey}_data`) : null;
    return savedApp ? JSON.parse(savedApp) : initialApplication;
  });

  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  // Active view when approved
  const [activeTab, setActiveTab] = useState<"submissions" | "new">("submissions");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Fetch categories
  const { data: categories = [] } = useQuery(categoriesQuery);

  // 2. Fetch user's saved addresses to pre-fill pickup details
  const { data: addressData } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<{ addresses: any[] }>("/addresses"),
  });

  useEffect(() => {
    if (addressData?.addresses && addressData.addresses.length > 0) {
      const def = addressData.addresses.find((a: any) => a.is_default) || addressData.addresses[0];
      const addressString = def.summary || `${def.street}, ${def.city || ""}`;
      const phoneString = def.phone || "";

      // Pre-fill application form if empty
      setApplicationForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || addressString,
        seller_phone: prev.seller_phone || phoneString,
      }));

      // Pre-fill product form if empty
      setForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || addressString,
        pickup_phone: prev.pickup_phone || phoneString,
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
    queryFn: () =>
      api.get<{ products: any[]; total: number; counts: Record<string, number> }>("/products/my-submissions"),
    enabled: sellerStatus === "approved",
  });

  const submissions = submissionsData?.products || [];
  const counts = submissionsData?.counts || { pending: 0, scheduled: 0, listed: 0, rejected: 0 };

  // Handle Seller Permission Application Submission
  const handleApplyForSeller = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationForm.store_name.trim()) {
      return toast.error("Please enter your Store / Brand Name");
    }
    if (!applicationForm.seller_phone.trim() || applicationForm.seller_phone.length < 7) {
      return toast.error("Please enter a valid Nepal mobile number");
    }
    if (!applicationForm.pickup_address.trim()) {
      return toast.error("Please provide your physical pickup address");
    }

    setIsSubmittingApplication(true);
    setTimeout(() => {
      setSellerStatus("pending");
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "pending");
        localStorage.setItem(`${storageKey}_data`, JSON.stringify(applicationForm));
      }
      setIsSubmittingApplication(false);
      toast.success("Seller verification request sent to DOVAN Admin! You will be notified upon review.");
    }, 700);
  };

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

  // ═════════════════════════════════════════════════════════════════════════════
  // STATE 1 & 2: PERMISSION GATE (Customer Needs Admin Permission to Sell)
  // ═════════════════════════════════════════════════════════════════════════════
  if (sellerStatus === "none" || sellerStatus === "pending" || sellerStatus === "rejected") {
    return (
      <div className="space-y-6 max-w-3xl">
        {/* Top Header */}
        <div className="border-b pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Seller Partner Program
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              <Lock className="h-3 w-3" />
              Admin Permission Required
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            To ensure genuine authenticity and quality across DOVAN, customer selling requires verified seller approval from our administration team.
          </p>
        </div>

        {/* ── STATE: PENDING ADMIN REVIEW ───────────────────────────────── */}
        {sellerStatus === "pending" && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <Clock className="h-7 w-7 animate-pulse" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-foreground">
                Application Under Admin Review
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your request to sell on DOVAN as <strong>"{applicationForm.store_name || "Merchant"}"</strong> has been received by our operations team.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 max-w-md mx-auto text-left text-xs space-y-2">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Store Name:</span>
                <span className="font-semibold text-foreground">{applicationForm.store_name}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Contact Phone:</span>
                <span className="font-semibold text-foreground">{applicationForm.seller_phone}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Pickup Location:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{applicationForm.pickup_address}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Awaiting Verification
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Reviews are typically completed within 24 hours. You will receive an SMS and an account notification once approved.
            </p>

            {/* Quick action for test/demo mode to preview approved state */}
            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSellerStatus("approved");
                  localStorage.setItem(storageKey, "approved");
                  toast.success("Preview Mode: Seller permission approved!");
                }}
                className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
              >
                (Preview as Approved Seller)
              </Button>
            </div>
          </div>
        )}

        {/* ── STATE: REJECTED NOTICE ────────────────────────────────────── */}
        {sellerStatus === "rejected" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
              <XCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Seller Request Not Approved</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Your previous seller application was not approved. Please check that your contact details and pickup address are accurate, and feel free to re-apply below.
            </p>
            <Button
              size="sm"
              onClick={() => setSellerStatus("none")}
              className="text-xs h-8 cursor-pointer"
            >
              Re-apply with Updated Details
            </Button>
          </div>
        )}

        {/* ── STATE: NOT APPLIED YET — PERMISSION APPLICATION FORM ──────── */}
        {sellerStatus === "none" && (
          <div className="space-y-6">
            {/* Value Proposition & Trust Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-foreground">1. Request Permission</div>
                <div className="text-[11px] text-muted-foreground">
                  Provide your store name and pickup contact for admin verification.
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Truck className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-foreground">2. Courier Pickup</div>
                <div className="text-[11px] text-muted-foreground">
                  DOVAN dispatch collects items directly from your doorstep across Nepal.
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4 shadow-2xs space-y-1.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-xs font-bold text-foreground">3. Sell Securely</div>
                <div className="text-[11px] text-muted-foreground">
                  Your products are listed on the store with buyer payment & delivery handled.
                </div>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleApplyForSeller} className="rounded-xl border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b pb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  Seller Verification Request Form
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fill in your store information to request seller privileges.
                </p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="store_name" className="text-xs font-semibold">
                      Store / Brand Name *
                    </Label>
                    <Input
                      id="store_name"
                      placeholder="e.g. Kathmandu Artisan Craft"
                      value={applicationForm.store_name}
                      onChange={(e) => setApplicationForm({ ...applicationForm, store_name: e.target.value })}
                      className="mt-1 text-sm h-10"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="seller_phone" className="text-xs font-semibold">
                      Contact Mobile Number *
                    </Label>
                    <Input
                      id="seller_phone"
                      type="tel"
                      placeholder="98XXXXXXXX"
                      value={applicationForm.seller_phone}
                      onChange={(e) => setApplicationForm({ ...applicationForm, seller_phone: e.target.value })}
                      className="mt-1 text-sm h-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pickup_addr" className="text-xs font-semibold">
                    Physical Pickup Address (Where courier collects items) *
                  </Label>
                  <Input
                    id="pickup_addr"
                    placeholder="e.g. New Road, Ward 22, Kathmandu"
                    value={applicationForm.pickup_address}
                    onChange={(e) => setApplicationForm({ ...applicationForm, pickup_address: e.target.value })}
                    className="mt-1 text-sm h-10"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="business_type" className="text-xs font-semibold">
                      Seller Category / Type
                    </Label>
                    <Select
                      value={applicationForm.business_type}
                      onValueChange={(val) => setApplicationForm({ ...applicationForm, business_type: val })}
                    >
                      <SelectTrigger id="business_type" className="mt-1 h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Individual Artisan / Craftsperson">
                          Individual Artisan / Craftsperson
                        </SelectItem>
                        <SelectItem value="Local Shop / Retailer">Local Shop / Retailer</SelectItem>
                        <SelectItem value="Direct Manufacturer">Direct Manufacturer</SelectItem>
                        <SelectItem value="Home Creator / Producer">Home Creator / Producer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ID / PAN Placeholder for future decision */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="id_num" className="text-xs font-semibold">
                        PAN or Citizenship No. (Optional)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Optional for now</span>
                    </div>
                    <Input
                      id="id_num"
                      placeholder="PAN (9 digits) or Citizenship number"
                      value={applicationForm.id_number}
                      onChange={(e) => setApplicationForm({ ...applicationForm, id_number: e.target.value })}
                      className="mt-1 text-sm h-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="seller_desc" className="text-xs font-semibold">
                    What products do you plan to sell? (Optional)
                  </Label>
                  <Textarea
                    id="seller_desc"
                    placeholder="Briefly describe what items you make or stock (e.g. handmade Dhaka topis, copper utensils, organic tea)..."
                    rows={2}
                    value={applicationForm.seller_description}
                    onChange={(e) => setApplicationForm({ ...applicationForm, seller_description: e.target.value })}
                    className="mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  By submitting, you agree to DOVAN's seller quality & dispatch standards.
                </p>

                <Button
                  type="submit"
                  disabled={isSubmittingApplication}
                  className="font-semibold h-10 px-5 cursor-pointer shadow-xs shrink-0"
                >
                  {isSubmittingApplication ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                      Sending Request...
                    </>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4 mr-1.5" />
                      Request Seller Permission
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════════
  // STATE 3: VERIFIED SELLER DASHBOARD (Unlocked upon Admin Approval)
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Verified Seller Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Seller Dashboard
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Seller
            </span>
            {applicationForm.store_name && (
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                • {applicationForm.store_name}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your store catalog, check order pickup schedules, and submit items for DOVAN delivery.
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
            My Products ({submissions.length})
          </Button>
          <Button
            size="sm"
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className="text-xs h-9 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add New Product
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
            <h3 className="text-sm font-semibold text-foreground">Your Listed & Submitted Products</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refetch()}
              disabled={isFetching}
              className="text-xs h-8 text-muted-foreground hover:text-foreground cursor-pointer"
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
              <h4 className="mt-3 text-base font-semibold text-foreground">No products added yet</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                You are now a verified seller! Start adding your products to list them across DOVAN.
              </p>
              <Button
                onClick={() => setActiveTab("new")}
                size="sm"
                className="mt-4 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Your First Product
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
