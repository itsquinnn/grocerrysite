import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { categoriesQuery } from "@/lib/catalog";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { useShop } from "@/lib/shop";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { LogoMark } from "@/components/site/Logo";
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
  Package,
  RefreshCw,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Trash2,
  ExternalLink,
  Star,
  FolderPlus,
  User,
  LogOut,
  Menu,
  ChevronRight,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/seller")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Seller Portal — DOVAN" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SellerPortalPage,
  errorComponent: ({ error, reset }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border rounded-xl p-6 text-center space-y-4 shadow-xs">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-5 w-5" />
        </div>
        <h2 className="text-base font-semibold text-foreground">Could not load seller portal</h2>
        <p className="text-xs text-muted-foreground break-all">
          {(error as any)?.message || "Please refresh or try again in a few moments."}
        </p>
        <div className="flex justify-center gap-2 pt-2">
          <Button size="sm" onClick={() => reset()} className="text-xs h-8">Try again</Button>
          <Link to="/account/sell" className="inline-flex items-center text-xs h-8 px-3 rounded-md border bg-card">
            Account settings
          </Link>
        </div>
      </div>
    </div>
  ),
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

function SellerPortalPage() {
  const qc = useQueryClient();
  const { user, isAdmin, signOut } = useShop();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    await signOut();
    await nav({ to: "/login", replace: true });
  };

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
      return `SELLER-${hash}`;
    }
    return "SELLER-1084";
  });

  // Query server seller status
  const { data: serverStatus } = useQuery({
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

  useEffect(() => {
    if (!serverStatus) return;

    if (serverStatus.seller_status) {
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
  const [activeTab, setActiveTab] = useState<"submissions" | "new" | "reviews">("submissions");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category creation
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
      toast.success(`Category "${newCat.name}" added`);
    } catch {
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
      toast.success(`Category "${newCat.name}" created`);
    }
  };

  // Reviews query
  const { data: serverReviewsData } = useQuery({
    queryKey: ["seller", "reviews"],
    queryFn: () => api.get<{ reviews: any[]; total: number }>("/reviews?for_seller=true"),
    enabled: sellerStatus === "approved",
  });

  const activeReviews = serverReviewsData?.reviews || [];

  // Categories query
  const { data: categories = [] } = useQuery(categoriesQuery);

  // Address pre-fill
  const { data: addressData } = useQuery({
    queryKey: ["addresses"],
    queryFn: () => api.get<{ addresses: any[] }>("/addresses"),
  });

  useEffect(() => {
    if (addressData?.addresses && addressData.addresses.length > 0) {
      const def = addressData.addresses.find((a: any) => a.is_default) || addressData.addresses[0];
      const addressString = def.summary || `${def.street}, ${def.city || ""}`;
      const phoneString = def.phone || "";

      setApplicationForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || addressString,
        seller_phone: prev.seller_phone || phoneString,
      }));

      setForm((prev) => ({
        ...prev,
        pickup_address: prev.pickup_address || addressString,
        pickup_phone: prev.pickup_phone || phoneString,
      }));
    }
  }, [addressData]);

  // Submissions query
  const {
    data: submissions = [],
    isLoading: loadingSubmissions,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["products", "my-submissions", user?.id],
    enabled: !!user?.id && sellerStatus === "approved",
    queryFn: async () => {
      try {
        const res = await api.get<{ products: any[] }>("/products/my-submissions");
        return res?.products || [];
      } catch {
        const { data } = await supabase
          .from("products")
          .select("*, categories(*)")
          .eq("seller_id", user?.id)
          .order("created_at", { ascending: false });
        return data || [];
      }
    },
  });

  // Apply handler
  const handleApplyForSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationForm.store_name.trim()) {
      return toast.error("Please enter your Store Name");
    }
    if (!applicationForm.seller_phone.trim() || applicationForm.seller_phone.length < 7) {
      return toast.error("Please enter a valid mobile number for dispatch coordination");
    }
    if (!applicationForm.pickup_address.trim()) {
      return toast.error("Please enter your physical pickup address");
    }
    if (!applicationForm.citizenship_number.trim()) {
      return toast.error("Citizenship Number is required for merchant verification");
    }
    if (applicationForm.pan_number.trim().length < 3) {
      return toast.error("Please enter a valid PAN Number");
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
        localStorage.setItem(storageKey!, "pending");
        localStorage.setItem(`${storageKey}_data`, JSON.stringify(applicationForm));

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
      toast.success("Application submitted for review");
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit seller application");
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Photo upload
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
        toast.success("Image uploaded");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Submit product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) return toast.error("Product title is required");
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) return toast.error("Please enter a valid price");
    const stockNum = parseInt(form.stock_quantity, 10);
    if (isNaN(stockNum) || stockNum < 0) return toast.error("Please enter a valid stock quantity");
    if (!form.pickup_address.trim()) return toast.error("Pickup address is required");
    if (!form.pickup_phone.trim() || form.pickup_phone.length < 7) {
      return toast.error("Valid contact phone is required for pickup");
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

      toast.success("Product published to store catalog");
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

  // Delete product
  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (!window.confirm(`Delete "${productTitle}" from store?`)) {
      return;
    }
    try {
      try {
        await api.delete(`/products/my-submissions?id=${productId}`);
      } catch {
        await api.delete(`/admin/products?id=${productId}`);
      }
      toast.success(`"${productTitle}" removed`);
      void qc.invalidateQueries({ queryKey: ["products", "my-submissions"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete product");
    }
  };

  // Top Portal Header
  const portalHeader = (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden h-8 w-8 text-foreground shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Link to="/" className="flex items-center gap-2 group">
            <LogoMark className="h-6 w-6 object-contain shrink-0" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-medium text-base tracking-tight text-foreground">
                DOVAN
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Seller
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {sellerStatus === "approved" && (
            <Button
              size="sm"
              onClick={() => setActiveTab("new")}
              className="text-xs h-8 px-3 rounded-lg font-medium"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              <span>Add Product</span>
            </Button>
          )}

          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Store</span>
          </Link>

          <Link
            to="/account"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition"
          >
            <User className="h-3.5 w-3.5" />
            <span>Account</span>
          </Link>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );

  // Sidebar navigation
  const sidebarNav = (
    <div className="space-y-4">
      {/* Store status row */}
      <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
        <p className="text-xs font-semibold text-foreground truncate">
          {applicationForm.store_name || "Merchant Store"}
        </p>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Status:</span>
          {sellerStatus === "approved" && (
            <span className="font-medium text-emerald-600">Verified Seller</span>
          )}
          {sellerStatus === "pending" && (
            <span className="font-medium text-amber-600">Under Review</span>
          )}
          {sellerStatus === "rejected" && (
            <span className="font-medium text-rose-600">Declined</span>
          )}
          {sellerStatus === "none" && (
            <span className="font-medium text-muted-foreground">Not Applied</span>
          )}
        </div>
      </div>

      {sellerStatus === "approved" && (
        <nav className="space-y-0.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab("submissions");
              setMobileDrawerOpen(false);
            }}
            className={cn(
              "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer text-left",
              activeTab === "submissions"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Products</span>
            </span>
            <span className="text-[11px] text-muted-foreground">{submissions.length}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("new");
              setMobileDrawerOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer text-left",
              activeTab === "new"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("reviews");
              setMobileDrawerOpen(false);
            }}
            className={cn(
              "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer text-left",
              activeTab === "reviews"
                ? "bg-muted text-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Reviews</span>
            </span>
            <span className="text-[11px] text-muted-foreground">{activeReviews.length}</span>
          </button>
        </nav>
      )}

      <div className="pt-3 border-t border-border/50 space-y-1">
        <Link
          to="/shop"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
        >
          <Store className="h-3.5 w-3.5" />
          <span>Browse Shop</span>
        </Link>
        <Link
          to="/account"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
        >
          <User className="h-3.5 w-3.5" />
          <span>My Account</span>
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Admin Console</span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      {portalHeader}

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid gap-6 md:gap-8 md:grid-cols-[220px_1fr] items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden md:block sticky top-20">
            {sidebarNav}
          </aside>

          {/* Main Content Area */}
          <main className="min-w-0">
            {/* ── STATE: PENDING REVIEW ── */}
            {sellerStatus === "pending" && (
              <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Application Under Review</span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Seller application submitted
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your request to sell on DOVAN as <strong>"{applicationForm.store_name || "Merchant"}"</strong> is being reviewed by the operations team.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-xs space-y-2 max-w-md">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Store Name:</span>
                    <span className="font-medium text-foreground">{applicationForm.store_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Contact Phone:</span>
                    <span className="font-medium text-foreground">{applicationForm.seller_phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Citizenship No.:</span>
                    <span className="font-medium text-foreground">{applicationForm.citizenship_number}</span>
                  </div>
                  {applicationForm.pan_number && (
                    <div className="flex justify-between border-b border-border/40 pb-1.5">
                      <span className="text-muted-foreground">PAN No.:</span>
                      <span className="font-medium text-foreground">{applicationForm.pan_number}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pickup Address:</span>
                    <span className="font-medium text-foreground truncate max-w-[220px]">{applicationForm.pickup_address}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Verification usually takes up to 24 hours. You will receive an update once verified.
                </p>

                <div className="pt-1 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSellerStatus("none")}
                    className="text-xs h-8"
                  >
                    Edit Application
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                    <Link to="/account/support">Contact Support</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE: REJECTED NOTICE ── */}
            {sellerStatus === "rejected" && (
              <div className="rounded-xl border border-border/70 bg-card p-6 sm:p-8 space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    Application not approved
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your seller request for <strong>"{applicationForm.store_name || "Merchant"}"</strong> could not be verified.
                  </p>
                </div>

                {rejectionReasonText && (
                  <div className="rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs space-y-1">
                    <span className="font-medium text-muted-foreground">Note from operations:</span>
                    <p className="text-foreground">{rejectionReasonText}</p>
                  </div>
                )}

                <div className="pt-1 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => setSellerStatus("none")}
                    className="text-xs h-8"
                  >
                    Update & Re-apply
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                    <Link to="/account/support">Contact Support</Link>
                  </Button>
                </div>
              </div>
            )}

            {/* ── STATE: NOT APPLIED (APPLICATION FORM) ── */}
            {sellerStatus === "none" && (
              <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-xs">
                <div className="p-5 sm:p-6 space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    Apply to Sell on DOVAN
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Partner with DOVAN to list authentic regional products, staples, and handcrafted goods.
                  </p>
                </div>

                <form onSubmit={handleApplyForSeller} className="p-5 sm:p-6 space-y-4">
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="store_name" className="text-xs font-medium text-muted-foreground">
                        Store / Brand Name *
                      </Label>
                      <Input
                        id="store_name"
                        placeholder="e.g. Himalayan Heritage Crafts"
                        value={applicationForm.store_name}
                        onChange={(e) => setApplicationForm({ ...applicationForm, store_name: e.target.value })}
                        className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="seller_phone" className="text-xs font-medium text-muted-foreground">
                        Contact Mobile Number *
                      </Label>
                      <Input
                        id="seller_phone"
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={applicationForm.seller_phone}
                        onChange={(e) => setApplicationForm({ ...applicationForm, seller_phone: e.target.value })}
                        className="mt-1 h-9 text-xs sm:text-sm font-mono rounded-lg"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="pickup_addr" className="text-xs font-medium text-muted-foreground">
                        Physical Pickup Address (Where courier collects orders) *
                      </Label>
                      <Input
                        id="pickup_addr"
                        placeholder="e.g. New Road, Ward 22, Kathmandu"
                        value={applicationForm.pickup_address}
                        onChange={(e) => setApplicationForm({ ...applicationForm, pickup_address: e.target.value })}
                        className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="citizen_num" className="text-xs font-medium text-muted-foreground">
                        Citizenship Number (नागरिकता नं.) *
                      </Label>
                      <Input
                        id="citizen_num"
                        type="text"
                        placeholder="Citizenship Number"
                        value={applicationForm.citizenship_number}
                        onChange={(e) => setApplicationForm({ ...applicationForm, citizenship_number: e.target.value })}
                        className="mt-1 h-9 text-xs sm:text-sm font-mono rounded-lg"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pan_num" className="text-xs font-medium text-muted-foreground">
                        PAN Number (स्थायी लेखा नं.) *
                      </Label>
                      <Input
                        id="pan_num"
                        type="text"
                        placeholder="9-digit PAN"
                        value={applicationForm.pan_number}
                        onChange={(e) => setApplicationForm({ ...applicationForm, pan_number: e.target.value })}
                        className="mt-1 h-9 text-xs sm:text-sm font-mono rounded-lg"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="business_type" className="text-xs font-medium text-muted-foreground">
                        Seller Type
                      </Label>
                      <Select
                        value={applicationForm.business_type}
                        onValueChange={(val) => setApplicationForm({ ...applicationForm, business_type: val })}
                      >
                        <SelectTrigger id="business_type" className="mt-1 h-9 text-xs sm:text-sm rounded-lg">
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

                    <div className="sm:col-span-2">
                      <Label htmlFor="seller_desc" className="text-xs font-medium text-muted-foreground">
                        What products do you plan to sell? (Optional)
                      </Label>
                      <Textarea
                        id="seller_desc"
                        placeholder="Briefly describe what items you produce or stock..."
                        rows={2}
                        value={applicationForm.seller_description}
                        onChange={(e) => setApplicationForm({ ...applicationForm, seller_description: e.target.value })}
                        className="mt-1 text-xs sm:text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">
                      By submitting, you agree to DOVAN's seller quality standards.
                    </p>

                    <Button
                      type="submit"
                      disabled={isSubmittingApplication}
                      size="sm"
                      className="h-9 px-4 text-xs font-medium rounded-lg shrink-0"
                    >
                      {isSubmittingApplication ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Application"
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* ── STATE: APPROVED VERIFIED SELLER DASHBOARD ── */}
            {sellerStatus === "approved" && (
              <div className="space-y-4">
                {/* Mobile / Tablet tabs */}
                <div className="flex md:hidden items-center gap-1.5 border-b border-border/60 pb-2.5">
                  <Button
                    size="sm"
                    variant={activeTab === "submissions" ? "default" : "outline"}
                    onClick={() => setActiveTab("submissions")}
                    className="text-xs h-8 px-2.5 rounded-lg"
                  >
                    Products ({submissions.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "new" ? "default" : "outline"}
                    onClick={() => setActiveTab("new")}
                    className="text-xs h-8 px-2.5 rounded-lg"
                  >
                    Add Product
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === "reviews" ? "default" : "outline"}
                    onClick={() => setActiveTab("reviews")}
                    className="text-xs h-8 px-2.5 rounded-lg"
                  >
                    Reviews ({activeReviews.length})
                  </Button>
                </div>

                {/* TAB 1: SUBMISSIONS / PRODUCTS LIST */}
                {activeTab === "submissions" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base sm:text-lg font-semibold text-foreground">
                          Products ({submissions.length})
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Items published under your merchant account
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refetch()}
                          disabled={isFetching}
                          className="h-8 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? "animate-spin" : ""}`} />
                          Refresh
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab("new")}
                          className="h-8 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Product
                        </Button>
                      </div>
                    </div>

                    {loadingSubmissions ? (
                      <div className="py-12 text-center text-xs text-muted-foreground">
                        Loading products...
                      </div>
                    ) : submissions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 p-8 text-center bg-muted/10 space-y-3">
                        <Package className="h-8 w-8 mx-auto text-muted-foreground/60" />
                        <div>
                          <p className="text-sm font-medium text-foreground">No products added yet</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Start adding products to sell them across DOVAN.
                          </p>
                        </div>
                        <Button
                          onClick={() => setActiveTab("new")}
                          size="sm"
                          className="text-xs h-8"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add your first product
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                        {submissions.map((p: any) => {
                          const priceNpr = (p.price_paise || 0) / 100;
                          const inStock = (p.stock_quantity ?? p.stock ?? 0) > 0;

                          return (
                            <div
                              key={p.id}
                              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 sm:gap-4 hover:bg-muted/20 transition"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-lg border bg-muted overflow-hidden">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                      <Package className="h-5 w-5 opacity-40" />
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs sm:text-sm font-medium text-foreground truncate">
                                      {p.title}
                                    </h4>
                                    <span
                                      className={cn(
                                        "text-[10px] font-medium px-1.5 py-0.2 rounded shrink-0",
                                        inStock
                                          ? "bg-emerald-500/10 text-emerald-700"
                                          : "bg-amber-500/10 text-amber-700"
                                      )}
                                    >
                                      {inStock ? "Live" : "Out of stock"}
                                    </span>
                                  </div>

                                  <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">
                                      {formatNPR(priceNpr)}
                                    </span>
                                    <span>/ {p.unit || "item"}</span>
                                    <span>• Stock: {p.stock_quantity ?? 0}</span>
                                    {p.categories?.name && (
                                      <span className="hidden sm:inline">• {p.categories.name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <a
                                  href={`/product/${p.slug || p.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1"
                                  title="View on store"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>

                                {(!p.seller_id || p.seller_id === user?.id || isAdmin) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id, p.title)}
                                    className="p-1 text-muted-foreground hover:text-destructive transition cursor-pointer"
                                    title="Delete product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ADD PRODUCT FORM */}
                {activeTab === "new" && (
                  <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-xs max-w-4xl">
                    <div className="p-5 sm:p-6 space-y-1">
                      <h2 className="text-base sm:text-lg font-semibold text-foreground">
                        Add New Product
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        List an item directly to the DOVAN store catalog.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                      <div className="space-y-3.5">
                        <div>
                          <Label htmlFor="title" className="text-xs font-medium text-muted-foreground">
                            Product Title *
                          </Label>
                          <Input
                            id="title"
                            placeholder="e.g. Organic Jumla Marsi Rice"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="description" className="text-xs font-medium text-muted-foreground">
                            Description
                          </Label>
                          <Textarea
                            id="description"
                            placeholder="Describe origin, harvest details, quality, and ingredients..."
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="mt-1 text-xs sm:text-sm rounded-lg"
                          />
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="category" className="text-xs font-medium text-muted-foreground">
                                Category *
                              </Label>
                              <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(true)}
                                className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              >
                                <FolderPlus className="h-3 w-3" />
                                <span>+ New Category</span>
                              </button>
                            </div>
                            <Select
                              value={form.category_id}
                              onValueChange={(val) => setForm({ ...form, category_id: val })}
                            >
                              <SelectTrigger id="category" className="mt-1 h-9 text-xs sm:text-sm rounded-lg">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {customCategories.map((c: any) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                                {categories.map((c: any) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="unit" className="text-xs font-medium text-muted-foreground">
                              Unit / Packaging *
                            </Label>
                            <Input
                              id="unit"
                              placeholder="e.g. 1 kg, 500 g, 1 Piece"
                              value={form.unit}
                              onChange={(e) => setForm({ ...form, unit: e.target.value })}
                              className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid gap-3.5 sm:grid-cols-3">
                          <div>
                            <Label htmlFor="price" className="text-xs font-medium text-muted-foreground">
                              Price (Rs. NPR) *
                            </Label>
                            <Input
                              id="price"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="e.g. 850"
                              value={form.price}
                              onChange={(e) => setForm({ ...form, price: e.target.value })}
                              className="mt-1 h-9 text-xs sm:text-sm rounded-lg font-mono"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="original_price" className="text-xs font-medium text-muted-foreground">
                              Original Price (Optional)
                            </Label>
                            <Input
                              id="original_price"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="e.g. 1000"
                              value={form.original_price}
                              onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                              className="mt-1 h-9 text-xs sm:text-sm rounded-lg font-mono"
                            />
                          </div>

                          <div>
                            <Label htmlFor="stock" className="text-xs font-medium text-muted-foreground">
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
                              className="mt-1 h-9 text-xs sm:text-sm rounded-lg font-mono"
                              required
                            />
                          </div>
                        </div>

                        {/* Photo upload */}
                        <div className="pt-2 border-t border-border/40">
                          <Label className="text-xs font-medium text-muted-foreground block mb-1.5">
                            Product Photo
                          </Label>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-lg border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                              {form.image_url ? (
                                <img
                                  src={form.image_url}
                                  alt="Preview"
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-muted-foreground/40" />
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <label className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer transition">
                                {isUploading ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                <span>{isUploading ? "Uploading..." : "Upload photo"}</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  disabled={isUploading}
                                  onChange={handleFileUpload}
                                />
                              </label>
                              <p className="text-[11px] text-muted-foreground">
                                JPG, PNG, or WebP format
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Pickup details */}
                        <div className="pt-2 border-t border-border/40 grid gap-3.5 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label htmlFor="pickup_address" className="text-xs font-medium text-muted-foreground">
                              Pickup Address *
                            </Label>
                            <Input
                              id="pickup_address"
                              placeholder="Where courier collects items"
                              value={form.pickup_address}
                              onChange={(e) => setForm({ ...form, pickup_address: e.target.value })}
                              className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="pickup_phone" className="text-xs font-medium text-muted-foreground">
                              Contact Phone for Pickup *
                            </Label>
                            <Input
                              id="pickup_phone"
                              type="tel"
                              placeholder="98XXXXXXXX"
                              value={form.pickup_phone}
                              onChange={(e) => setForm({ ...form, pickup_phone: e.target.value })}
                              className="mt-1 h-9 text-xs sm:text-sm font-mono rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="pickup_time" className="text-xs font-medium text-muted-foreground">
                              Pickup Window
                            </Label>
                            <Select
                              value={form.pickup_time}
                              onValueChange={(val) => setForm({ ...form, pickup_time: val })}
                            >
                              <SelectTrigger id="pickup_time" className="mt-1 h-9 text-xs sm:text-sm rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Standard Business Hours (10 AM - 5 PM)">
                                  Standard Business Hours (10 AM - 5 PM)
                                </SelectItem>
                                <SelectItem value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</SelectItem>
                                <SelectItem value="Evening (3 PM - 7 PM)">Evening (3 PM - 7 PM)</SelectItem>
                                <SelectItem value="Anytime with advance call">
                                  Anytime with advance call
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("submissions")}
                          className="text-xs h-9"
                        >
                          Cancel
                        </Button>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          size="sm"
                          className="h-9 px-4 text-xs font-medium rounded-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            "Publish Product"
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB 3: REVIEWS */}
                {activeTab === "reviews" && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-foreground">
                        Customer Reviews ({activeReviews.length})
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Feedback left by verified buyers for your products
                      </p>
                    </div>

                    {activeReviews.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/70 p-8 text-center bg-muted/10 space-y-1">
                        <Star className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                        <p className="text-sm font-medium text-foreground">No customer reviews yet</p>
                        <p className="text-xs text-muted-foreground">
                          Buyer ratings and reviews will appear here once orders are delivered.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 overflow-hidden shadow-xs">
                        {activeReviews.map((r: any) => (
                          <div key={r.id} className="p-4 space-y-1.5">
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                <Stars value={r.rating} />
                                <span className="font-medium text-foreground">{r.product_title}</span>
                              </div>
                              <span className="text-muted-foreground text-[11px]">
                                {r.author_name} • {new Date(r.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80 italic">
                              "{r.review_text}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-xs p-4 overflow-y-auto bg-card">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
            <LogoMark className="h-6 w-6 object-contain" />
            <div className="flex flex-col">
              <SheetTitle className="font-display font-medium text-sm text-foreground">
                DOVAN
              </SheetTitle>
              <span className="text-[10px] text-muted-foreground">Seller Portal</span>
            </div>
          </div>
          {sidebarNav}
        </SheetContent>
      </Sheet>

      {/* Category Creation Modal */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="max-w-md rounded-xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              Create Category
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add a new category to group your products in the store.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory} className="space-y-4 py-2">
            <div>
              <Label htmlFor="new_cat_name" className="text-xs font-medium text-muted-foreground">
                Category Name *
              </Label>
              <Input
                id="new_cat_name"
                placeholder="e.g. Traditional Handcrafts"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs h-8"
              >
                Create Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
