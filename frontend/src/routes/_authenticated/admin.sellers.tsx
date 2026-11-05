import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatNPR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/alert-dialog";
import {
  Store,
  Clock,
  CheckCircle2,
  XCircle,
  Package,
  RefreshCw,
  QrCode,
  User,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  Trash2,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Building,
  CreditCard,
  Eye,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/sellers")({
  component: AdminSellersPage,
});

export interface SellerApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  store_name: string;
  seller_phone: string;
  pickup_address: string;
  business_type: string;
  citizenship_number: string;
  pan_number?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  seller_id?: string;
  applied_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

const DEFAULT_SELLER_APPLICATIONS: SellerApplication[] = [
  {
    id: "app_seed_1",
    userId: "usr_himalayan_crafts",
    userName: "Sujan Shrestha",
    userEmail: "sujan.crafts@gmail.com",
    store_name: "Himalayan Handcrafts & Woodwork",
    seller_phone: "9841234567",
    pickup_address: "Patan Industrial Estate, Ward 5, Lalitpur",
    business_type: "Individual Artisan / Craftsperson",
    citizenship_number: "27-01-78-04921",
    pan_number: "601239841",
    description: "Authentic handmade wooden carvings, prayer bowls, and traditional brass statues.",
    status: "pending",
    applied_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "app_seed_2",
    userId: "usr_kathmandu_wool",
    userName: "Pooja Gurung",
    userEmail: "pooja.woolens@hotmail.com",
    store_name: "Annapurna Pure Pashmina",
    seller_phone: "9808765432",
    pickup_address: "Thamel Marg, Ward 26, Kathmandu",
    business_type: "Direct Manufacturer",
    citizenship_number: "27-01-72-88124",
    pan_number: "Not Provided",
    description: "Certified hand-spun 100% Chyangra cashmere shawls and winter wraps.",
    status: "approved",
    seller_id: "DOV-SELLER-1084",
    applied_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewed_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

function AdminSellersPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"requests" | "sellers" | "products">("requests");
  const [searchQuery, setSearchQuery] = useState("");

  // Seller applications state from shared storage
  const [applications, setApplications] = useState<SellerApplication[]>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("dovan_seller_applications");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
      localStorage.setItem("dovan_seller_applications", JSON.stringify(DEFAULT_SELLER_APPLICATIONS));
    }
    return DEFAULT_SELLER_APPLICATIONS;
  });

  // Action states for dialogs
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Deletion modal state for Seller Products
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // Revoke seller modal state
  const [sellerToRevoke, setSellerToRevoke] = useState<SellerApplication | null>(null);

  // Query all products across DOVAN to moderate seller products
  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch: refetchProducts,
    isFetching: isFetchingProducts,
  } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get<{ products: any[] }>("/admin/products"),
  });

  const allProducts = productsData?.products || [];

  // Filter seller products (products that have a seller_id or are seller submissions)
  const sellerProducts = allProducts.filter((p: any) => Boolean(p.seller_id || p.pickup_address));

  // Sync back to local storage whenever applications change
  const updateApplications = (newList: SellerApplication[]) => {
    setApplications(newList);
    if (typeof window !== "undefined") {
      localStorage.setItem("dovan_seller_applications", JSON.stringify(newList));
    }
  };

  // Approve a Seller ID request
  const handleApproveSeller = (app: SellerApplication) => {
    setIsProcessing(true);
    const sellerId = `DOV-SELLER-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const updated = applications.map((a) =>
      a.id === app.id
        ? {
            ...a,
            status: "approved" as const,
            seller_id: sellerId,
            reviewed_at: now,
          }
        : a
    );

    updateApplications(updated);

    // Also persist user-specific seller approval in storage so if they log in as that user, they are approved
    if (typeof window !== "undefined") {
      localStorage.setItem(`dovan_seller_status_${app.userId}`, "approved");
      localStorage.setItem("dovan_seller_status", "approved");
    }

    setIsProcessing(false);
    setSelectedApp(null);
    setActionType(null);
    toast.success(`Seller ID ${sellerId} granted to "${app.store_name}"! They can now post products directly.`);
  };

  // Reject a Seller ID request
  const handleRejectSeller = () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    const now = new Date().toISOString();

    const updated = applications.map((a) =>
      a.id === selectedApp.id
        ? {
            ...a,
            status: "rejected" as const,
            rejection_reason: rejectionReason.trim() || "Criteria not met.",
            reviewed_at: now,
          }
        : a
    );

    updateApplications(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(`dovan_seller_status_${selectedApp.userId}`, "rejected");
    }

    setIsProcessing(false);
    setSelectedApp(null);
    setActionType(null);
    setRejectionReason("");
    toast.error(`Seller application for "${selectedApp.store_name}" was rejected.`);
  };

  // Revoke an active seller
  const handleRevokeSeller = () => {
    if (!sellerToRevoke) return;
    const updated = applications.map((a) =>
      a.id === sellerToRevoke.id
        ? {
            ...a,
            status: "rejected" as const,
            rejection_reason: "Seller privileges revoked by administrator.",
          }
        : a
    );
    updateApplications(updated);

    if (typeof window !== "undefined") {
      localStorage.setItem(`dovan_seller_status_${sellerToRevoke.userId}`, "none");
    }

    setSellerToRevoke(null);
    toast.success(`Seller permission revoked for "${sellerToRevoke.store_name}".`);
  };

  // Admin delete seller product (direct removal from DOVAN catalog)
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setIsDeletingProduct(true);
      await api.delete(`/admin/products?id=${productToDelete.id}`);
      toast.success(`"${productToDelete.title || productToDelete.name}" deleted from store catalog.`);
      setProductToDelete(null);
      void qc.invalidateQueries({ queryKey: ["admin", "products"] });
      void qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete seller product.");
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Counts for KPIs
  const pendingRequests = applications.filter((a) => a.status === "pending");
  const verifiedSellers = applications.filter((a) => a.status === "approved");
  const rejectedRequests = applications.filter((a) => a.status === "rejected");

  // Filtered lists according to search
  const filteredRequests = pendingRequests.filter(
    (a) =>
      a.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.citizenship_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.seller_phone.includes(searchQuery)
  );

  const filteredSellers = verifiedSellers.filter(
    (a) =>
      a.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.seller_id && a.seller_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      a.citizenship_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.seller_phone.includes(searchQuery)
  );

  const filteredProducts = sellerProducts.filter(
    (p) =>
      (p.title || p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.pickup_address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.product_code || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3.5">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <Store className="h-5 w-5 text-primary" />
              Seller Partners & Moderation
            </h1>
            <span className="rounded-xl bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10.5px] font-semibold">
              Admin Control Center
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Approve applicant Seller IDs, verify Citizenship & PAN identity documents, and moderate or delete seller products.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refetchProducts();
              toast.success("Refreshed seller data");
            }}
            disabled={isFetchingProducts}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isFetchingProducts ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div
          onClick={() => setActiveTab("requests")}
          className={`cursor-pointer rounded-2xl border p-3 shadow-2xs transition ${
            activeTab === "requests" ? "border-amber-500 bg-amber-500/10" : "bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Pending Requests</span>
            <Clock className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {pendingRequests.length}
          </div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">
            Require Seller ID approval
          </div>
        </div>

        <div
          onClick={() => setActiveTab("sellers")}
          className={`cursor-pointer rounded-2xl border p-3 shadow-2xs transition ${
            activeTab === "sellers" ? "border-emerald-500 bg-emerald-500/10" : "bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Verified Sellers</span>
            <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {verifiedSellers.length}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
            Active publishing rights
          </div>
        </div>

        <div
          onClick={() => setActiveTab("products")}
          className={`cursor-pointer rounded-2xl border p-3 shadow-2xs transition ${
            activeTab === "products" ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Seller Products</span>
            <Package className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {sellerProducts.length}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            Subject to admin deletion
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-3 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-[11px]">Rejected / Revoked</span>
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="mt-1 text-2xl font-bold text-foreground">
            {rejectedRequests.length}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-0.5">
            Access denied or revoked
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-card p-2 rounded-2xl border">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant={activeTab === "requests" ? "default" : "ghost"}
            onClick={() => setActiveTab("requests")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <Clock className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
            Seller ID Requests ({pendingRequests.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "sellers" ? "default" : "ghost"}
            onClick={() => setActiveTab("sellers")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <BadgeCheck className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
            Verified Sellers ({verifiedSellers.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "products" ? "default" : "ghost"}
            onClick={() => setActiveTab("products")}
            className="text-xs h-8 px-2.5 rounded-xl cursor-pointer"
          >
            <Package className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Seller Products ({sellerProducts.length})
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search store, citizen no, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8 bg-background rounded-xl"
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: PENDING SELLER ID REQUESTS (ADMIN PERMISSION APPROVAL)         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Applicant Permission Requests
              </h3>
              <p className="text-xs text-muted-foreground">
                Review applicant citizenship credentials to grant verified Seller IDs. Approved sellers can list products directly.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredRequests.length} Pending
            </span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-muted/15">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500/70" />
              <h4 className="mt-3 text-base font-semibold text-foreground">No Pending Requests</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                All customer seller applications have been reviewed. New applications submitted from the customer account will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((app) => (
                <div
                  key={app.id}
                  className="rounded-xl border bg-card p-5 shadow-2xs hover:shadow-xs transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-foreground">{app.store_name}</h4>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            <Clock className="h-3 w-3" />
                            Awaiting Seller ID
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {app.userName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {app.seller_phone}
                          </span>
                          {app.userEmail && (
                            <>
                              <span>•</span>
                              <span>{app.userEmail}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleApproveSeller(app)}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold cursor-pointer shadow-xs"
                      >
                        <BadgeCheck className="h-3.5 w-3.5 mr-1.5" />
                        Approve Seller ID
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(app);
                          setActionType("reject");
                        }}
                        disabled={isProcessing}
                        className="text-xs h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  {/* Verification Credentials Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/30 p-3.5 rounded-lg text-xs">
                    {/* Citizenship Card Number */}
                    <div className="border-r md:pr-3">
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3 w-3 text-primary" />
                        Citizenship Card No. (नागरिकता नं.)
                      </div>
                      <div className="mt-1 font-mono font-bold text-foreground text-sm">
                        {app.citizenship_number || "Not Provided"}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        Mandatory verification document
                      </div>
                    </div>

                    {/* PAN Card Number */}
                    <div className="border-r md:pr-3">
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        PAN Number (स्थायी लेखा नं.)
                      </div>
                      <div className="mt-1 font-mono font-medium text-foreground text-sm">
                        {app.pan_number || "Not Provided (Optional)"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Tax registration status
                      </div>
                    </div>

                    {/* Business Category & Applied Date */}
                    <div>
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        Category & Submission Time
                      </div>
                      <div className="mt-1 font-medium text-foreground">
                        {app.business_type}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Applied {new Date(app.applied_at).toLocaleDateString()} at{" "}
                        {new Date(app.applied_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  {/* Pickup Location & Notes */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      <strong className="text-foreground">Pickup Location: </strong>
                      {app.pickup_address}
                    </div>
                    {app.description && (
                      <div>
                        <strong className="text-foreground">Product Intent: </strong>
                        {app.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: VERIFIED SELLERS DIRECTORY                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "sellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Active Verified Sellers
              </h3>
              <p className="text-xs text-muted-foreground">
                Merchants authorized to post products directly to the DOVAN marketplace.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredSellers.length} Active Sellers
            </span>
          </div>

          {filteredSellers.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-muted/15">
              <Store className="mx-auto h-10 w-10 text-muted-foreground" />
              <h4 className="mt-3 text-base font-semibold text-foreground">No Verified Sellers Found</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Approve pending applicant requests to grant verified seller status.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredSellers.map((seller) => {
                const sellerProductsCount = sellerProducts.filter(
                  (p: any) => p.seller_id === seller.userId
                ).length;

                return (
                  <div
                    key={seller.id}
                    className="rounded-xl border bg-card p-4 sm:p-5 shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 shrink-0">
                          <Store className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-foreground">
                              {seller.store_name}
                            </h4>
                            <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                              {seller.seller_id || "DOV-SELLER-VERIFIED"}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <BadgeCheck className="h-3 w-3" />
                              Direct Publishing Authorized
                            </span>
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>Owner: <strong className="text-foreground">{seller.userName}</strong></span>
                            <span>Phone: <strong className="text-foreground">{seller.seller_phone}</strong></span>
                            <span>Citizenship: <strong className="font-mono text-foreground">{seller.citizenship_number}</strong></span>
                            {seller.pan_number && seller.pan_number !== "Not Provided" && (
                              <span>PAN: <strong className="font-mono text-foreground">{seller.pan_number}</strong></span>
                            )}
                          </div>

                          <div className="mt-1.5 text-xs text-muted-foreground">
                            <span>Pickup: {seller.pickup_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right stats and Revoke Action */}
                      <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
                        <div className="text-right">
                          <div className="text-xs font-semibold text-muted-foreground">Products</div>
                          <div className="text-base font-bold text-foreground">
                            {sellerProductsCount} items
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSellerToRevoke(seller)}
                          className="text-xs h-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Revoke Seller
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SELLER PRODUCTS MODERATION & DELETION (ADMIN CONTROL)           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">
                Seller Marketplace Products
              </h3>
              <p className="text-xs text-muted-foreground">
                Sellers post directly without per-product review. As admin, you can delete or remove any seller's product from the store catalog at any time.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">
              {filteredProducts.length} Items Listed
            </span>
          </div>

          {loadingProducts ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2 text-primary" />
              Loading marketplace seller listings...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center bg-muted/15">
              <Package className="mx-auto h-10 w-10 text-muted-foreground" />
              <h4 className="mt-3 text-base font-semibold text-foreground">No Seller Products Found</h4>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                When verified sellers add products from their dashboard, they will publish live and appear here for admin moderation.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredProducts.map((p: any) => {
                const priceNpr = (p.price_paise || 0) / 100 || p.price || 0;
                const stockQty = p.stock_quantity ?? p.stock ?? 0;
                const isActive = p.is_active !== false && p.approval_status !== "rejected";

                return (
                  <div
                    key={p.id}
                    className="rounded-xl border bg-card p-4 shadow-2xs hover:shadow-xs transition flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Product Thumbnail */}
                      <div className="h-16 w-16 sm:h-18 sm:w-18 shrink-0 rounded-lg border bg-muted overflow-hidden relative">
                        {p.image_url || (Array.isArray(p.images) && p.images[0]) ? (
                          <img
                            src={p.image_url || p.images[0]}
                            alt={p.title || p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                            <Package className="h-7 w-7 opacity-30" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">
                            {p.title || p.name}
                          </h4>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Live in Store
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              <XCircle className="h-3 w-3" />
                              Inactive / Deleted
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">{formatNPR(priceNpr)}</span>
                          <span>•</span>
                          <span>Stock: <strong className={stockQty > 0 ? "text-foreground" : "text-rose-600"}>{stockQty}</strong></span>
                          {p.product_code && (
                            <>
                              <span>•</span>
                              <span className="font-mono">{p.product_code}</span>
                            </>
                          )}
                          {p.category_name && (
                            <>
                              <span>•</span>
                              <span>{p.category_name}</span>
                            </>
                          )}
                        </div>

                        <div className="mt-1 text-[11px] text-muted-foreground truncate">
                          Seller pickup: <span className="text-foreground">{p.pickup_address || "On file"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Moderation Controls: Delete Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <a
                        href={`/product/${p.slug || p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground border px-2.5 py-1.5 rounded-lg bg-background"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Live
                      </a>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setProductToDelete(p)}
                        className="text-xs h-8 px-3 font-semibold cursor-pointer shadow-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete Product
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Dialog: Reject Seller Application ──────────────────────────────── */}
      <Dialog open={actionType === "reject"} onOpenChange={(open) => !open && setActionType(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Reject Seller Application
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to decline seller privileges for <strong>"{selectedApp?.store_name}"</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="reject_reason" className="text-xs font-semibold">
                Reason for Rejection (Visible to Applicant)
              </Label>
              <Input
                id="reject_reason"
                placeholder="e.g. Unverified citizenship document, contact number invalid..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionType(null)}
              disabled={isProcessing}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectSeller}
              disabled={isProcessing}
              className="text-xs font-semibold cursor-pointer"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert Dialog: Delete Seller Product ────────────────────────────── */}
      <AlertDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="h-5 w-5" />
              Delete Seller Product from DOVAN Store?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove <strong>"{productToDelete?.title || productToDelete?.name}"</strong> from the public store catalog. Regular shoppers will no longer be able to discover or order this item.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
            <div><strong className="text-foreground">Product Code:</strong> {productToDelete?.product_code || productToDelete?.id}</div>
            <div><strong className="text-foreground">Price:</strong> {formatNPR(((productToDelete?.price_paise || 0) / 100) || productToDelete?.price || 0)}</div>
            <div><strong className="text-foreground">Seller Address:</strong> {productToDelete?.pickup_address || "Registered Address"}</div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingProduct} className="text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteProduct}
              disabled={isDeletingProduct}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              {isDeletingProduct ? "Deleting..." : "Yes, Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Alert Dialog: Revoke Seller Permission ─────────────────────────── */}
      <AlertDialog
        open={Boolean(sellerToRevoke)}
        onOpenChange={(open) => !open && setSellerToRevoke(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
              Revoke Verified Seller Status?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke selling permissions for <strong>"{sellerToRevoke?.store_name}"</strong>?
              They will no longer be able to publish products directly to DOVAN.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSeller}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
            >
              Revoke Permission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
