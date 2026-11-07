import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Camera,
  CheckCircle2,
  Package,
  MapPin,
  Heart,
  LifeBuoy,
  ShieldCheck,
  LogOut,
  Eye,
  EyeOff,
  Mail,
  Sparkles,
  Lock,
  User as UserIcon,
  Phone,
  Loader2,
  ChevronRight,
  Shield,
  Store,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/")({
  component: Profile,
});

function Profile() {
  const { user, isAdmin, wishlist } = useShop();
  const navigate = useNavigate();

  const [p, setP] = useState(() => ({
    full_name:
      (user?.user_metadata?.full_name as string) ||
      (user?.user_metadata?.name as string) ||
      "",
    phone:
      (user?.user_metadata?.phone as string) ||
      (user?.phone as string) ||
      "",
    avatar_url:
      (user?.user_metadata?.avatar_url as string) ||
      (user?.user_metadata?.picture as string) ||
      "",
    notify_email: true,
    notify_offers: true,
  }));

  const [pw, setPw] = useState({ current: "", next: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNextPw, setShowNextPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyPw, setBusyPw] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Check if current authenticated user is an approved seller
  const [isSellerApproved, setIsSellerApproved] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      if (isAdmin) {
        setIsSellerApproved(true);
        return;
      }
      if (!user?.id) {
        setIsSellerApproved(false);
        return;
      }
      if (typeof window === "undefined") return;

      const directStatus = localStorage.getItem(`dovan_seller_status_${user.id}`);
      if (directStatus === "approved") {
        setIsSellerApproved(true);
        return;
      }
      if (directStatus === "rejected" || directStatus === "pending") {
        setIsSellerApproved(false);
        return;
      }

      try {
        const raw = localStorage.getItem("dovan_seller_applications");
        if (raw) {
          const list = JSON.parse(raw);
          const app = list.find((a: any) => a.userId === user.id || (user.email && a.userEmail === user.email));
          if (app) {
            setIsSellerApproved(app.status === "approved");
            return;
          }
        }
      } catch {}

      const fallback = localStorage.getItem("dovan_seller_status");
      setIsSellerApproved(fallback === "approved");
    };

    checkStatus();
    window.addEventListener("storage", checkStatus);
    window.addEventListener("dovan:seller-status-changed", checkStatus);
    return () => {
      window.removeEventListener("storage", checkStatus);
      window.removeEventListener("dovan:seller-status-changed", checkStatus);
    };
  }, [user, isAdmin]);

  useEffect(() => {
    if (!user) return;
    const initialName =
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      "";
    const initialPhone =
      (user.user_metadata?.phone as string) ||
      (user.phone as string) ||
      "";

    if (initialName || initialPhone) {
      setP((prev) => ({
        ...prev,
        full_name: prev.full_name || initialName,
        phone: prev.phone || initialPhone,
      }));
    }

    const fetchProfile = async () => {
      try {
        const data = await api.get<any>("/profile");
        if (data) {
          setP((prev) => ({
            ...prev,
            full_name: data.name || data.full_name || prev.full_name || initialName || "",
            phone: data.phone || prev.phone || initialPhone || "",
            avatar_url: data.profile_image || data.avatar_url || prev.avatar_url || "",
            notify_email: data.notify_email ?? prev.notify_email ?? true,
            notify_offers: data.notify_offers ?? prev.notify_offers ?? true,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch profile via API:", err);
      }
    };
    void fetchProfile();
  }, [user]);

  if (!user) return null;

  const save = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (p.full_name.trim().length < 2) {
      return toast.error("Please enter your name (at least 2 characters)");
    }
    setBusy(true);
    try {
      await api.patch("/profile", {
        name: p.full_name.trim().slice(0, 100),
        phone: p.phone.trim().slice(0, 25),
      });

      // Synchronize with Supabase Auth metadata so local user state reflects immediately
      try {
        await supabase.auth.updateUser({
          data: { full_name: p.full_name.trim(), phone: p.phone.trim() },
        });
      } catch {}

      setBusy(false);
      toast.success("Profile updated successfully");
    } catch {
      setBusy(false);
      toast.error("Could not save profile changes");
    }
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 2_500_000) {
      return toast.error("Please choose a JPG or PNG image under 2.5 MB");
    }
    setUploadingAvatar(true);
    const path = `avatars/${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;
    try {
      const { error } = await supabase.storage.from("dovan").upload(path, file, { upsert: true });
      if (error) {
        setUploadingAvatar(false);
        return toast.error("Upload failed: " + error.message);
      }
      const { data: { publicUrl } } = supabase.storage.from("dovan").getPublicUrl(path);
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      await api.patch("/profile", { profile_image: finalUrl });
      setP((prev) => ({ ...prev, avatar_url: finalUrl }));
      setUploadingAvatar(false);
      toast.success("Profile photo updated");
    } catch {
      setUploadingAvatar(false);
      toast.error("Could not save photo");
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) {
      return toast.error("New password must be at least 8 characters");
    }
    setBusyPw(true);
    try {
      const { error: e1 } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: pw.current,
      });
      if (e1) {
        setBusyPw(false);
        return toast.error("Current password is incorrect");
      }
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) {
        setBusyPw(false);
        return toast.error(error.message);
      }
      setPw({ current: "", next: "" });
      setBusyPw(false);
      toast.success("Password updated successfully");
    } catch (err: any) {
      setBusyPw(false);
      toast.error(err?.message || "Could not update password");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({ to: "/login" });
      toast.success("Signed out successfully");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ── 1. Profile Summary Card (Mobile-First Identity & Quick Jump) ── */}
      <section className="relative overflow-hidden rounded-2xl border bg-card p-3.5 sm:p-4.5 shadow-xs">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-3.5 sm:gap-5">
          {/* Avatar with Touch-Friendly Camera Badge */}
          <div className="relative shrink-0 self-start sm:self-center">
            <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-background shadow-md">
              <AvatarImage
                src={p.avatar_url}
                alt={p.full_name || "User avatar"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-base sm:text-lg">
                {(p.full_name || user.email || "DO").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <label
              className="absolute -bottom-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 cursor-pointer active:scale-95 transition"
              title="Upload profile photo"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Camera className="h-3 w-3" />
              )}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploadingAvatar}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                {p.full_name || "Dovan Customer"}
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-primary">
                {isAdmin ? (
                  <>
                    <ShieldCheck className="h-3 w-3" />
                    <span>Staff Admin</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Verified Account</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {p.phone && (
              <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <Phone className="h-3 w-3" />
                <span>{p.phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Shortcut Navigation Tiles (Mobile & Tablet) */}
        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/60">
          <Link
            to="/account/orders"
            className="flex flex-col p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition border border-border/40"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-3.5 w-3.5" />
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground">My Orders</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Track shipments</p>
          </Link>

          <Link
            to="/account/addresses"
            className="flex flex-col p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition border border-border/40"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground">Addresses</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Delivery spots</p>
          </Link>

          <Link
            to="/wishlist"
            className="flex flex-col p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition border border-border/40"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <Heart className="h-3.5 w-3.5" />
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground">Wishlist</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">{wishlist.length} saved</p>
          </Link>

          <Link
            to="/account/support"
            className="flex flex-col p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 active:scale-[0.98] transition border border-border/40"
          >
            <div className="flex items-center justify-between w-full">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <LifeBuoy className="h-3.5 w-3.5" />
              </span>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-semibold text-foreground">Support</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">Help tickets</p>
          </Link>
        </div>

        {/* Verified Seller Shortcut Banner (Opens in New Tab) */}
        {isSellerApproved && (
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-primary/25 bg-primary/5 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
                <Store className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Verified Seller Dashboard</p>
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Publish products, monitor stock, and inspect customer reviews.
                </p>
              </div>
            </div>
            <a
              href="/seller"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90 transition shrink-0"
              title="Open Seller Dashboard in New Tab"
            >
              <span>Open in New Tab</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </section>

      {/* ── 2. Personal Information Form ─────────────────────────────────── */}
      <section className="rounded-2xl border bg-card p-3.5 sm:p-4.5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <UserIcon className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Personal Information</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Update your name and phone number for shipping and invoices.
            </p>
          </div>
        </div>

        <form onSubmit={save} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name" className="text-xs font-semibold text-foreground">
                Full Name
              </Label>
              <Input
                id="p-name"
                name="name"
                autoComplete="name"
                value={p.full_name}
                onChange={(e) => setP({ ...p, full_name: e.target.value })}
                className="mt-1 h-9.5 text-sm font-medium rounded-xl"
                placeholder="Your full name"
              />
            </div>

            <div>
              <Label htmlFor="p-phone" className="text-xs font-semibold text-foreground">
                Phone Number
              </Label>
              <Input
                id="p-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98XXXXXXXX"
                value={p.phone}
                onChange={(e) => setP({ ...p, phone: e.target.value })}
                className="mt-1 h-9.5 text-sm font-mono rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </Label>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Locked to account
                </span>
              </div>
              <Input
                id="p-email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="mt-1 h-9.5 text-sm bg-muted/50 cursor-not-allowed opacity-80 rounded-xl"
              />
            </div>
          </div>

          {/* ── Notification Preferences ───────────────────────────────── */}
          <div className="pt-3 border-t border-border/60">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Notification Preferences
            </h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                      Order Updates & Dispatch
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      Real-time invoice, courier, and delivery emails
                    </p>
                  </div>
                </div>
                <Switch
                  checked={p.notify_email}
                  onCheckedChange={(v) => setP({ ...p, notify_email: v })}
                />
              </label>

              <label className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition cursor-pointer">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                      Promotions & Exclusive Deals
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                      Festival discounts and new collection arrivals
                    </p>
                  </div>
                </div>
                <Switch
                  checked={p.notify_offers}
                  onCheckedChange={(v) => setP({ ...p, notify_offers: v })}
                />
              </label>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              disabled={busy}
              className="w-full sm:w-auto h-9.5 px-5 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* ── 3. Password & Security Section ──────────────────────────────── */}
      <section className="rounded-2xl border bg-card p-3.5 sm:p-4.5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-foreground">Change Password</h3>
            <p className="text-[11px] sm:text-xs text-muted-foreground">
              Ensure your account is using a secure, unique password of at least 8 characters.
            </p>
          </div>
        </div>

        <form onSubmit={changePw} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="cp1" className="text-xs font-semibold text-foreground">
                Current Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="cp1"
                  type={showCurrentPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  placeholder="Enter current password"
                  className="h-9.5 pr-9 text-sm font-medium rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label={showCurrentPw ? "Hide password" : "Show password"}
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="cp2" className="text-xs font-semibold text-foreground">
                New Password
              </Label>
              <div className="relative mt-1">
                <Input
                  id="cp2"
                  type={showNextPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="h-9.5 pr-9 text-sm font-medium rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowNextPw(!showNextPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition cursor-pointer"
                  aria-label={showNextPw ? "Hide password" : "Show password"}
                >
                  {showNextPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="outline"
              disabled={busyPw || !pw.current || !pw.next}
              className="w-full sm:w-auto h-9.5 px-5 rounded-xl font-semibold cursor-pointer text-xs sm:text-sm"
            >
              {busyPw ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </section>

      {/* ── 4. Account Sign Out Card ────────────────────────────────────── */}
      <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-foreground">Sign Out of Account</h4>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            You will need to sign back in with your email to access orders and wishlist.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          className="w-full sm:w-auto h-9 px-4 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer font-semibold gap-1.5 shrink-0 text-xs sm:text-sm"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </Button>
      </section>
    </div>
  );
}
