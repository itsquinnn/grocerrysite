import { createFileRoute, Link } from "@tanstack/react-router";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Stars } from "@/components/site/Stars";
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
  AlertTriangle,
  LifeBuoy,
  Layers,
  Trash2,
  ExternalLink,
  Star,
  FolderPlus,
  MessageSquare,
  Zap,
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
  citizenship_number: string;
  pan_number: string;
  seller_description: string;
};

const initialApplication: SellerApplicationForm = {
  store_name: "",
  seller_phone: "",
  pickup_address: "",
  business_type: "Individual Artisan / Craftsperson",
  citizenship_number: "",
  pan_number: "",
  seller_description: "",
};

function AccountSellPage() {
  const qc = useQueryClient();
  const { user, isAdmin } = useShop();

  // ── SELLER VERIFICATION STATE (Frontend Simulated & Persistent in LocalStorage until DB chunk) ──
  // States: "none" (not requested) | "pending" (under review) | "approved" (verified seller) | "rejected"
  const storageKey = user?.id ? `dovan_seller_status_${user.id}` : null;
  const [sellerStatus, setSellerStatus] = useState<"none" | "pending" | "approved" | "rejected">(() => {
    if (typeof window !== "undefined" && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved === "pending" || saved === "approved" || saved === "rejected") {
        return saved;
      }
    }
    return "none";
  });

  const [applicationForm, setApplicationForm] = useState<SellerApplicationForm>(() => {
    try {
      const savedApp = typeof window !== "undefined" && storageKey ? localStorage.getItem(`${storageKey}_data`) : null;
      return savedApp ? JSON.parse(savedApp) : initialApplication;
    } catch {
      return initialApplication;
    }
  });

  const [rejectionReasonText, setRejectionReasonText] = useState<string>(() => {
    if (typeof window !== "undefined" && user?.id) {
      return localStorage.getItem(`dovan_seller_rejection_reason_${user.id}`) || "";
    }
    return "";
  });

  const [sellerIdTag, setSellerIdTag] = useState<string>(() => {
    if (user?.id) {
      const hash = user.id.replace(/\D/g, "").slice(0, 4) || "1084";
      return `DOV-SELLER-${hash}`;
    }
    return "DOV-SELLER-1084";
  });

  // ── LIVE SERVER SELLER STATUS (Chunk 2 & 3 Backend Integration) ───────────
  const { data: serverStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ["seller", "status"],
    queryFn: async () => {
      try {
        return await api.get<{
          seller_status: "none" | "pending" | "approved" | "rejected" | "suspended";
          store_name: string | null;
          seller_phone: string | null;
          seller_description: string | null;
          seller_approved_at: string | null;
          role: string;
          application_details: any;
          products_count: number;
        }>("/seller/status");
      } catch (e) {
        console.warn("Could not query backend seller status:", e);
        return null;
      }
    },
    enabled: !!user?.id,
  });

  // Dynamic real-time synchronization with server & Admin decisions
  useEffect(() => {
    if (!serverStatus) return;

    if (serverStatus.seller_status) {
      // Map 'suspended' to 'rejected' in gate view or handle directly
      const mapped = serverStatus.seller_status === "suspended" ? "rejected" : serverStatus.seller_status;
      setSellerStatus(mapped as any);
      if (typeof window !== "undefined" && storageKey) {
        localStorage.setItem(storageKey, mapped);
      }
    }

    if (serverStatus.application_details) {
      const details = serverStatus.application_details;
      if (details.rejection_reason) {
        setRejectionReasonText(details.rejection_reason);
      }
      setApplicationForm((prev) => ({
        ...prev,
        store_name: serverStatus.store_name || details.store_name || prev.store_name,
        seller_phone: serverStatus.seller_phone || details.seller_phone || prev.seller_phone,
        pickup_address: details.pickup_address || prev.pickup_address,
        business_type: details.business_type || prev.business_type,
        citizenship_number: details.citizenship_number || prev.citizenship_number,
        pan_number: details.pan_number || prev.pan_number,
        seller_description: details.notes || prev.seller_description,
      }));
    } else if (serverStatus.store_name || serverStatus.seller_phone) {
      setApplicationForm((prev) => ({
        ...prev,
        store_name: serverStatus.store_name || prev.store_name,
        seller_phone: serverStatus.seller_phone || prev.seller_phone,
      }));
    }
  }, [serverStatus, storageKey, user?.id]);

  // Fallback real-time synchronization with local storage events
  useEffect(() => {
    const syncSellerStatus = () => {
      if (typeof window === "undefined" || !user?.id) return;

      const directStatus = storageKey ? localStorage.getItem(storageKey) : null;
      const directReason = localStorage.getItem(`dovan_seller_rejection_reason_${user.id}`);
      if (directReason) setRejectionReasonText(directReason);

      if (directStatus) {
        setSellerStatus(directStatus as any);
      }

      try {
        const raw = localStorage.getItem("dovan_seller_applications");
        if (raw) {
          const list = JSON.parse(raw);
          const myApp = list.find(
            (a: any) => a.userId === user.id || (user.email && a.userEmail === user.email)
          );
          if (myApp) {
            if (!directStatus) {
              setSellerStatus(myApp.status);
            }
            if (myApp.seller_id) setSellerIdTag(myApp.seller_id);
            if (myApp.rejection_reason) setRejectionReasonText(myApp.rejection_reason);
            if (myApp.store_name) {
              setApplicationForm((prev) => ({
                ...prev,
                store_name: myApp.store_name || prev.store_name,
                seller_phone: myApp.seller_phone || prev.seller_phone,
                pickup_address: myApp.pickup_address || prev.pickup_address,
                business_type: myApp.business_type || prev.business_type,
                citizenship_number: myApp.citizenship_number || prev.citizenship_number,
                pan_number: myApp.pan_number || prev.pan_number,
                seller_description: myApp.description || prev.seller_description,
              }));
            }
            return;
          }
        }
      } catch (err) {
        console.error("Failed to sync seller application status:", err);
      }
    };

    syncSellerStatus();
    window.addEventListener("storage", syncSellerStatus);
    window.addEventListener("dovan:seller-status-changed", syncSellerStatus);
    return () => {
      window.removeEventListener("storage", syncSellerStatus);
      window.removeEventListener("dovan:seller-status-changed", syncSellerStatus);
    };
  }, [user?.id, user?.email, storageKey]);

  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  // Active view when approved: My Products | Add Product | Customer Reviews
  const [activeTab, setActiveTab] = useState<"submissions" | "new" | "reviews">("submissions");
  const [form, setForm] = useState<FormState>(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category & Subcategory on-the-fly creation
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newSubcatInput, setNewSubcatInput] = useState("");
  const [customCategories, setCustomCategories] = useState<{ id: string; name: string }[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dovan_custom_categories");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return toast.error("Category name is required");

    try {
      const res = await api.post<{ category: any; subcategory?: any }>("/categories", {
        name: newCatName.trim(),
        subcategory_name: newSubcatInput.trim() || undefined,
      });

      const catId = res?.category?.id || "cat_custom_" + Date.now();
      const newCat = {
        id: catId,
        name: newCatName.trim(),
      };
      const updated = [newCat, ...customCategories.filter((c) => c.id !== catId)];
      setCustomCategories(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("dovan_custom_categories", JSON.stringify(updated));
      }
      setForm((prev) => ({ ...prev, category_id: newCat.id }));
      setNewCatName("");
      setNewSubcatInput("");
      setIsCategoryModalOpen(false);
      void qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success(`Category "${newCat.name}" created and saved to catalog!`);
    } catch (err: any) {
      const newCat = {
        id: "cat_custom_" + Date.now(),
        name: newCatName.trim(),
      };
      const updated = [newCat, ...customCategories];
      setCustomCategories(updated);
      setForm((prev) => ({ ...prev, category_id: newCat.id }));
      setNewCatName("");
      setNewSubcatInput("");
      setIsCategoryModalOpen(false);
      toast.success(`Category "${newCat.name}" added and selected!`);
    }
  };

  // Live Seller Product Reviews (Chunk 5 Integration)
  const { data: serverReviewsData } = useQuery({
    queryKey: ["seller", "reviews"],
    queryFn: () => api.get<{ reviews: any[]; total: number }>("/reviews?for_seller=true"),
    enabled: sellerStatus === "approved",
  });

  const activeReviews = serverReviewsData?.reviews || [];

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

  // Handle Seller Permission Application Submission (Chunk 2 API Integration)
  const handleApplyForSeller = async (e: React.FormEvent) => {
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
    if (!applicationForm.citizenship_number.trim()) {
      return toast.error("Please enter your Citizenship Card Number (नागरिकता नं.) for identity verification");
    }
    if (applicationForm.citizenship_number.trim().length < 3) {
      return toast.error("Please enter a valid Citizenship Card Number (नागरिकता नं.)");
    }
    if (!applicationForm.pan_number.trim()) {
      return toast.error("Please enter your PAN Number (स्थायी लेखा नं.) for seller tax registration");
    }
    if (applicationForm.pan_number.trim().length < 3) {
      return toast.error("Please enter a valid PAN Number (स्थायी लेखा नं.)");
    }

    setIsSubmittingApplication(true);
    try {
      const payload = {
        store_name: applicationForm.store_name.trim(),
        seller_phone: applicationForm.seller_phone.trim(),
        pickup_address: applicationForm.pickup_address.trim(),
        business_type: applicationForm.business_type || "Individual Artisan / Craftsperson",
        citizenship_number: applicationForm.citizenship_number.trim(),
        pan_number: applicationForm.pan_number.trim(),
        seller_description: applicationForm.seller_description?.trim() || undefined,
      };

      await api.post("/seller/apply", payload);

      setSellerStatus("pending");
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, "pending");
        localStorage.setItem(`${storageKey}_data`, JSON.stringify(applicationForm));

        // Sync with shared seller applications for immediate cross-tab consistency
        try {
          const raw = localStorage.getItem("dovan_seller_applications");
          const list: any[] = raw ? JSON.parse(raw) : [];
          const currentUserId = user?.id || "usr_customer";
          const newApplication = {
            id: "app_" + Date.now(),
            userId: currentUserId,
            userName: user?.name || user?.email || "Customer Partner",
            userEmail: user?.email || "",
            store_name: applicationForm.store_name,
            seller_phone: applicationForm.seller_phone,
            pickup_address: applicationForm.pickup_address,
            business_type: applicationForm.business_type,
            citizenship_number: applicationForm.citizenship_number,
            pan_number: applicationForm.pan_number || "Not Provided",
            description: applicationForm.seller_description,
            status: "pending",
            applied_at: new Date().toISOString(),
          };
          const filtered = list.filter((a: any) => a.userId !== currentUserId);
          filtered.unshift(newApplication);
          localStorage.setItem("dovan_seller_applications", JSON.stringify(filtered));
          window.dispatchEvent(new Event("dovan:seller-status-changed"));
        } catch (e) {
          console.error("Failed to store seller application in local pool:", e);
        }
      }

      void qc.invalidateQueries({ queryKey: ["seller", "status"] });
      void qc.invalidateQueries({ queryKey: ["admin", "sellers"] });
      toast.success("Seller verification request sent to DOVAN Admin! Your application is now pending review.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit seller application");
    } finally {
      setIsSubmittingApplication(false);
    }
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

      toast.success("Product published! Your item is now live in the DOVAN store catalog.");
      setForm(initialForm);
      setActiveTab("submissions");
      void qc.invalidateQueries({ queryKey: ["products", "my-submissions"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product handler (seller can remove their own product with strict isolation)
  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    const product = submissions.find((p: any) => p.id === productId);
    if (product?.seller_id && product.seller_id !== user?.id && !isAdmin) {
      return toast.error("Access Denied: You cannot delete another seller's product.");
    }

    if (!window.confirm(`Are you sure you want to delete "${productTitle}" from your store catalog?`)) {
      return;
    }
    try {
      try {
        await api.delete(`/products/my-submissions?id=${productId}`);
      } catch {
        // Fallback for staff admin
        await api.delete(`/admin/products?id=${productId}`);
      }
      toast.success(`"${productTitle}" removed from store catalog`);
      void qc.invalidateQueries({ queryKey: ["products", "my-submissions"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "listed":
      case "active":
        return {
          label: "Live in Store",
          color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
          icon: CheckCircle2,
          desc: "Live in store catalog! Buyers across Nepal can now order this.",
        };
      case "pending":
        return {
          label: "Direct Published",
          color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
          icon: CheckCircle2,
          desc: "Published by verified seller! Live in store catalog.",
        };
      case "rejected":
        return {
          label: "Removed by Admin",
          color: "bg-rose-500/15 text-rose-700 border-rose-500/30",
          icon: XCircle,
          desc: "Moderated or removed by DOVAN Admin.",
        };
      default:
        return {
          label: "Active",
          color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
          icon: CheckCircle2,
          desc: "Active in DOVAN store catalog.",
        };
    }
  };

  if (sellerStatus === "none" || sellerStatus === "pending" || sellerStatus === "rejected") {
    return (
      <div className="space-y-4 max-w-3xl">

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
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-500/30">
                <Clock className="h-3.5 w-3.5" />
                <span>Application Under Admin Review</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Your Seller ID Verification is In Progress
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your request to sell on DOVAN as <strong>"{applicationForm.store_name || "Merchant"}"</strong> has been received by our operations team.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-4 max-w-md mx-auto text-left text-xs space-y-2 shadow-2xs">
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Store Name:</span>
                <span className="font-semibold text-foreground">{applicationForm.store_name}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Contact Phone:</span>
                <span className="font-semibold text-foreground">{applicationForm.seller_phone}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Citizenship No.:</span>
                <span className="font-semibold text-foreground">{applicationForm.citizenship_number}</span>
              </div>
              {applicationForm.pan_number && (
                <div className="flex justify-between border-b pb-1.5">
                  <span className="text-muted-foreground">PAN No. (Optional):</span>
                  <span className="font-semibold text-foreground">{applicationForm.pan_number}</span>
                </div>
              )}
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Pickup Location:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{applicationForm.pickup_address}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5">
                <span className="text-muted-foreground">Business Type:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{applicationForm.business_type}</span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-muted-foreground">Current Status:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="h-3 w-3 animate-spin" /> Awaiting Admin Approval
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Reviews are typically completed within 24 hours. You will receive an SMS and an account notification once approved.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSellerStatus("none")}
                className="text-xs h-8 cursor-pointer rounded-xl"
              >
                Edit Application Details
              </Button>

              <Link
                to="/account/support"
                className="inline-flex items-center justify-center text-xs h-8 px-3 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition"
              >
                Contact Operations Support
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE: REJECTED NOTICE ────────────────────────────────────── */}
        {sellerStatus === "rejected" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
              <XCircle className="h-8 w-8" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-500/30">
                <XCircle className="h-3.5 w-3.5" />
                <span>Application Not Approved</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Seller ID Application Rejected
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your previous seller partner request for <strong>"{applicationForm.store_name || "Merchant"}"</strong> could not be verified by the admin team.
              </p>
            </div>

            {/* Admin Rejection Reason Box */}
            <div className="rounded-xl border border-rose-500/30 bg-card p-4 max-w-md mx-auto text-left text-xs space-y-2 shadow-2xs">
              <div className="flex items-center gap-1.5 text-rose-600 font-bold uppercase tracking-wider text-[11px]">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Admin Rejection Reason:</span>
              </div>
              <p className="text-foreground font-medium text-xs sm:text-sm pl-5 bg-rose-500/5 p-2 rounded-lg border border-rose-500/20">
                "{rejectionReasonText || "The submitted identification number or pickup details could not be verified by the DOVAN operations team."}"
              </p>
            </div>

            {/* Previous Submission Snapshot */}
            <div className="rounded-xl border bg-card p-3.5 max-w-md mx-auto text-left text-xs space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground pb-1 border-b">Previously Submitted Details:</div>
              <div className="flex justify-between">
                <span>Store Name:</span>
                <span className="font-medium text-foreground">{applicationForm.store_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Phone:</span>
                <span className="font-medium text-foreground">{applicationForm.seller_phone}</span>
              </div>
              <div className="flex justify-between">
                <span>Citizenship No.:</span>
                <span className="font-medium text-foreground">{applicationForm.citizenship_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Pickup Address:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">{applicationForm.pickup_address}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
              Please check your information, correct any invalid numbers or addresses, and click re-apply below.
            </p>

            <div className="pt-2 flex flex-wrap justify-center gap-2.5">
              <Button
                size="sm"
                onClick={() => setSellerStatus("none")}
                className="text-xs h-9 px-4 rounded-xl cursor-pointer bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Fix Details & Re-apply Now
              </Button>

              <Link
                to="/account/support"
                className="inline-flex items-center justify-center text-xs h-9 px-3.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition"
              >
                <LifeBuoy className="h-3.5 w-3.5 mr-1.5" />
                Contact DOVAN Support
              </Link>
            </div>
          </div>
        )}

        {/* ── STATE: NOT APPLIED YET — PERMISSION APPLICATION FORM ──────── */}
        {sellerStatus === "none" && (
          <div className="space-y-3.5 sm:space-y-4">
            {/* Compact 3-Step Process Strip */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-3 p-2 sm:p-2.5 rounded-xl border bg-card/60 shadow-2xs">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">1. Apply</div>
                  <div className="text-[9px] sm:text-[10.5px] text-muted-foreground truncate">Admin review</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 border-l pl-1.5 sm:pl-3">
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 shrink-0">
                  <Truck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">2. Pickup</div>
                  <div className="text-[9px] sm:text-[10.5px] text-muted-foreground truncate">Doorstep dispatch</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 border-l pl-1.5 sm:pl-3">
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 shrink-0">
                  <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-bold text-foreground truncate">3. Sell</div>
                  <div className="text-[9px] sm:text-[10.5px] text-muted-foreground truncate">Direct listing</div>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                  {/* Citizen Card Number (Required) */}
                  <div>
                    <Label htmlFor="citizen_num" className="text-xs font-semibold">
                      Citizenship No. (नागरिकता नं.) *
                    </Label>
                    <Input
                      id="citizen_num"
                      type="number"
                      inputMode="numeric"
                      placeholder="Citizenship Number (e.g. 123456789)"
                      value={applicationForm.citizenship_number}
                      onChange={(e) => setApplicationForm({ ...applicationForm, citizenship_number: e.target.value })}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="mt-1 text-sm h-10 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
                    />
                  </div>

                  {/* PAN Number (Required) */}
                  <div>
                    <Label htmlFor="pan_num" className="text-xs font-semibold">
                      PAN No. (स्थायी लेखा नं.) *
                    </Label>
                    <Input
                      id="pan_num"
                      type="number"
                      inputMode="numeric"
                      placeholder="9-digit PAN Number (e.g. 123456789)"
                      value={applicationForm.pan_number}
                      onChange={(e) => setApplicationForm({ ...applicationForm, pan_number: e.target.value })}
                      onKeyDown={(e) => {
                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                      }}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="mt-1 text-sm h-10 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      required
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
    <div className="space-y-4">

      {/* ── Standalone Workspace Banner ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-xl border border-primary/25 bg-primary/5 p-2.5 sm:px-3.5 text-xs shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Store className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground truncate">
              Dedicated Seller Portal Tab
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Keep this workspace open in a dedicated browser tab for fast catalog management.
            </p>
          </div>
        </div>
        <a
          href="/seller"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-2xs hover:bg-primary/90 transition shrink-0"
          title="Open Seller Dashboard in a dedicated browser tab"
        >
          <span>Open in New Tab</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* ── Verified Seller Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Seller Dashboard
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified Seller
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-xs font-mono font-semibold text-primary">
              <ShieldCheck className="h-3 w-3" />
              {sellerIdTag}
            </span>
            {applicationForm.store_name && (
              <span className="text-xs font-bold text-muted-foreground hidden sm:inline">
                • {applicationForm.store_name}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>Manage your store catalog, check customer reviews, and publish products live to DOVAN.</span>
            <span className="text-[11px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Account: {user?.email}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Direct new tab link so seller can keep dashboard open in dedicated tab */}
          <a
            href="/seller"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition shadow-2xs"
            title="Open Seller Dashboard in a dedicated workspace tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>New Tab</span>
          </a>

          <Button
            size="sm"
            variant={activeTab === "submissions" ? "default" : "outline"}
            onClick={() => setActiveTab("submissions")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <Package className="h-3.5 w-3.5 mr-1.5" />
            My Products ({submissions.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "new" ? "default" : "outline"}
            onClick={() => setActiveTab("new")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Product
          </Button>

          <Button
            size="sm"
            variant={activeTab === "reviews" ? "default" : "outline"}
            onClick={() => setActiveTab("reviews")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            Reviews ({activeReviews.length})
          </Button>
        </div>
      </div>

      {/* ── SUBMISSIONS LIST TAB ─────────────────────────────────────────── */}
      {activeTab === "submissions" && (
        <div className="space-y-5">
          {/* Status KPI Summary Cards - Direct Publishing Model */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Live in Store</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {submissions.filter((p: any) => p.is_active !== false && p.approval_status !== "rejected").length}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">Direct published</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>In Stock</span>
                <Package className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {submissions.filter((p: any) => (p.stock_quantity ?? p.stock ?? 0) > 0).length}
              </div>
              <div className="text-[11px] text-muted-foreground">Ready for orders</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Out of Stock</span>
                <Clock className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">
                {submissions.filter((p: any) => (p.stock_quantity ?? p.stock ?? 0) <= 0).length}
              </div>
              <div className="text-[11px] text-muted-foreground">Needs inventory refill</div>
            </div>

            <div className="rounded-xl border bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Total Catalog Items</span>
                <Store className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="mt-2 text-2xl font-bold text-foreground">{submissions.length}</div>
              <div className="text-[11px] text-muted-foreground">Under your Seller ID</div>
            </div>
          </div>

          {/* Direct Publishing Banner */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-emerald-950">Direct Marketplace Listing Enabled</p>
              <p className="text-[11.5px] text-emerald-800">
                As a verified seller partner, products you add publish directly to the DOVAN catalog without waiting for individual approval. Regular buyers browse your products seamlessly under the DOVAN catalog. Admin maintains moderation authority.
              </p>
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

                        {/* Action buttons */}
                        <div className="mt-3.5 flex items-center justify-between border-t pt-2.5">
                          <a
                            href={`/product/${p.slug || p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View on Live Store
                          </a>

                          {/* Strict Seller Isolation: Only owner or admin can delete */}
                          {(!p.seller_id || p.seller_id === user?.id || isAdmin) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteProduct(p.id, p.title)}
                              className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                              title="Delete from store catalog"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete Product
                            </Button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                              <Lock className="h-3 w-3 text-muted-foreground/60" />
                              Seller ID Protected
                            </span>
                          )}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category" className="text-xs font-semibold">
                      Category *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <FolderPlus className="h-3 w-3" />
                      + Create Category
                    </button>
                  </div>
                  <Select
                    value={form.category_id}
                    onValueChange={(val) => setForm({ ...form, category_id: val })}
                  >
                    <SelectTrigger id="category" className="mt-1 h-10 text-sm">
                      <SelectValue placeholder="Select or create a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {customCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-[10px] font-bold uppercase text-primary">
                            Your Created Categories
                          </div>
                          {customCategories.map((c: any) => (
                            <SelectItem key={c.id} value={c.id}>
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary" />
                                <span>{c.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                          <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground border-t mt-1">
                            Store Categories
                          </div>
                        </>
                      )}
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subcat" className="text-xs font-semibold">
                    Subcategory (Optional)
                  </Label>
                  <Input
                    id="subcat"
                    placeholder="e.g. Pashmina Shawl, Herbal Tea, Metal Craft"
                    value={newSubcatInput}
                    onChange={(e) => setNewSubcatInput(e.target.value)}
                    className="mt-1 text-sm h-10"
                  />
                </div>
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

        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong className="text-foreground inline-flex items-center gap-1 mr-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Direct Publishing Enabled:
            </strong>
            As a verified DOVAN seller partner, your product goes live immediately on the marketplace catalog upon publishing. Admin maintains moderation authority and can delete or remove non-compliant items anytime.
          </span>
        </div>
      </div>

      {/* Submit Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 h-10 font-semibold cursor-pointer shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Publishing Product...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Publish Product to Store
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
  )
}

{/* ── CUSTOMER REVIEWS TAB ─────────────────────────────────────────── */ }
{
  activeTab === "reviews" && (
    <div className="space-y-4">
      {/* Review KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4 shadow-2xs flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">5.0 / 5.0</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Stars value={5} /> (100% positive)
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-2xs">
          <div className="text-xs text-muted-foreground">Total Customer Reviews</div>
          <div className="mt-1 text-2xl font-bold text-foreground">{activeReviews.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium">From verified store orders</div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-2xs">
          <div className="text-xs text-muted-foreground">Store Reputation Status</div>
          <div className="mt-1 text-base font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="h-4 w-4" /> {activeReviews.length > 0 ? "Top Quality Partner" : "Active Seller Partner"}
          </div>
          <div className="text-[11px] text-muted-foreground">Compliant with DOVAN standards</div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-semibold text-foreground">Buyer Reviews on Your Listed Products</h3>
        {activeReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/60 p-8 text-center space-y-2">
            <Star className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p className="text-sm font-medium text-foreground">No customer reviews yet</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              When buyers purchase your products and submit feedback, their ratings and reviews will appear here.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeReviews.map((r: any) => (
              <div key={r.id} className="rounded-2xl border bg-card p-4 shadow-2xs space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-semibold text-xs text-foreground">{r.product_title}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Reviewed by <strong className="text-foreground">{r.author_name}</strong> • {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed italic">
                  "{r.review_text}"
                </p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  Verified Purchase from DOVAN Store
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

{/* ── Dialog: Create New Category on-the-fly ───────────────────────── */ }
<Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
  <DialogContent className="max-w-md rounded-2xl">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <FolderPlus className="h-5 w-5 text-primary" />
        Create New Store Category
      </DialogTitle>
      <DialogDescription>
        Add a category that doesn't exist yet. Your products will be grouped under this category on DOVAN.
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
      <div>
        <Label htmlFor="new_cat_name" className="text-xs font-semibold">
          Category Name *
        </Label>
        <Input
          id="new_cat_name"
          placeholder="e.g. Traditional Nepali Musical Instruments"
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="mt-1 h-10 text-sm rounded-xl"
          required
        />
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCategoryModalOpen(false)}
          className="text-xs rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          className="text-xs font-semibold rounded-xl cursor-pointer"
        >
          Create & Select Category
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
    </div >
  );
}
