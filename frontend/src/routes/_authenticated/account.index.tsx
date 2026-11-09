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
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Phone,
  Loader2,
  Store,
  ExternalLink,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/")({
  component: Profile,
});

function Profile() {
  const { user, isAdmin } = useShop();
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

  return (
    <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-xs">
      {/* ── 1. Profile Header ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border shrink-0">
            <AvatarImage
              src={p.avatar_url}
              alt={p.full_name || "User avatar"}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-foreground font-semibold text-sm sm:text-lg">
              {(p.full_name || user.email || "DO").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-lg font-semibold text-foreground truncate">
                {p.full_name || "Customer"}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 sm:px-2 py-0.5 text-[10px] font-semibold text-primary shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            {p.phone && (
              <p className="text-xs font-mono text-muted-foreground/90 flex items-center gap-1">
                <Phone className="h-3 w-3 text-muted-foreground/60" />
                <span>{p.phone}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {isSellerApproved && (
            <a
              href="/seller"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 sm:px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition"
              title="Open Seller Dashboard in New Tab"
            >
              <Store className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Seller Panel</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          )}

          <label
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 sm:px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 cursor-pointer transition"
            title="Upload profile photo"
          >
            {uploadingAvatar ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span>{uploadingAvatar ? "Uploading..." : "Change photo"}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploadingAvatar}
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* ── 2. Personal Details Form ──────────────────────────────────── */}
      <form onSubmit={save} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Personal Information</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Your name and contact number for order updates and deliveries.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-3.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name" className="text-xs font-medium text-muted-foreground">
              Full Name
            </Label>
            <Input
              id="p-name"
              name="name"
              autoComplete="name"
              value={p.full_name}
              onChange={(e) => setP({ ...p, full_name: e.target.value })}
              className="mt-1 h-9 text-xs sm:text-sm rounded-lg"
              placeholder="Your full name"
            />
          </div>

          <div>
            <Label htmlFor="p-phone" className="text-xs font-medium text-muted-foreground">
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
              className="mt-1 h-9 text-xs sm:text-sm font-mono rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="p-email" className="text-xs font-medium text-muted-foreground">
                Email Address
              </Label>
              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground/70">
                <Lock className="h-3 w-3" /> Account ID
              </span>
            </div>
            <Input
              id="p-email"
              type="email"
              value={user.email ?? ""}
              disabled
              className="mt-1 h-9 text-xs sm:text-sm bg-muted/40 cursor-not-allowed text-muted-foreground rounded-lg"
            />
          </div>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            disabled={busy}
            size="sm"
            className="w-full sm:w-auto h-9 px-4 text-xs font-medium rounded-lg"
          >
            {busy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Details"
            )}
          </Button>
        </div>
      </form>

      {/* ── 3. Notification Preferences (Clean flat rows) ────────────── */}
      <div className="p-4 sm:p-6 space-y-3">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Notification Preferences</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Manage what notifications you receive via email.
          </p>
        </div>

        <div className="divide-y divide-border/40">
          <div className="flex items-center justify-between gap-3 py-2 sm:py-2.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">Order Updates</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Invoice receipts, dispatch notices, and tracking alerts</p>
            </div>
            <Switch
              checked={p.notify_email}
              onCheckedChange={(v) => setP({ ...p, notify_email: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-2 sm:py-2.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">Exclusive Deals & Harvests</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Seasonal announcements and discounts</p>
            </div>
            <Switch
              checked={p.notify_offers}
              onCheckedChange={(v) => setP({ ...p, notify_offers: v })}
            />
          </div>
        </div>
      </div>

      {/* ── 4. Password & Security ────────────────────────────────────── */}
      <form onSubmit={changePw} className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-foreground">Password & Security</h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Update your account password for secure access.
          </p>
        </div>

        <div className="grid gap-3 sm:gap-3.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="cp1" className="text-xs font-medium text-muted-foreground">
              Current Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="cp1"
                type={showCurrentPw ? "text" : "password"}
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                placeholder="Current password"
                className="h-9 pr-8 text-xs sm:text-sm rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="cp2" className="text-xs font-medium text-muted-foreground">
              New Password
            </Label>
            <div className="relative mt-1">
              <Input
                id="cp2"
                type={showNextPw ? "text" : "password"}
                autoComplete="new-password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                placeholder="At least 8 characters"
                className="h-9 pr-8 text-xs sm:text-sm rounded-lg"
              />
              <button
                type="button"
                onClick={() => setShowNextPw(!showNextPw)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showNextPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={busyPw || !pw.current || !pw.next}
            className="w-full sm:w-auto h-9 px-4 text-xs font-medium rounded-lg"
          >
            {busyPw ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
