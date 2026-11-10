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
    <div className="space-y-8 sm:space-y-10">
      {/* ── 1. Profile Ledger Header ─────────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-8 border-b border-border/80">
        <div className="flex items-center gap-4 min-w-0">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-border/80 shrink-0">
            <AvatarImage
              src={p.avatar_url}
              alt={p.full_name || "User avatar"}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted font-mono font-medium text-foreground text-sm sm:text-base">
              {(p.full_name || user.email || "DO").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-medium text-foreground truncate">
                {p.full_name || "Account Holder"}
              </h2>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 border border-foreground/30 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-foreground shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  <span>Admin</span>
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-muted-foreground truncate">{user.email}</p>
            {p.phone && (
              <p className="text-xs font-mono text-muted-foreground/80 flex items-center gap-1.5">
                <Phone className="h-3 w-3 text-muted-foreground/60" />
                <span>{p.phone}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <label
            className="inline-flex items-center gap-2 border border-border/80 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:border-foreground hover:bg-muted/30 cursor-pointer transition-colors"
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
      </section>

      {/* ── 2. Personal Details Form ──────────────────────────────────── */}
      <section className="space-y-5 pb-8 border-b border-border/80">
        <div>
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground/75">
            Personal Record
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-medium text-foreground">
            Contact Information
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Primary name and phone used for fulfillment, courier dispatches, and delivery updates.
          </p>
        </div>

        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Full Name
              </Label>
              <Input
                id="p-name"
                name="name"
                autoComplete="name"
                value={p.full_name}
                onChange={(e) => setP({ ...p, full_name: e.target.value })}
                className="mt-1.5 h-10 text-xs sm:text-sm border-border/80 focus:border-foreground rounded-none"
                placeholder="Full legal name"
              />
            </div>

            <div>
              <Label htmlFor="p-phone" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
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
                className="mt-1.5 h-10 text-xs sm:text-sm font-mono border-border/80 focus:border-foreground rounded-none"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="p-email" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Email Address
                </Label>
                <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70">
                  <Lock className="h-3 w-3" /> Immutable Account ID
                </span>
              </div>
              <Input
                id="p-email"
                type="email"
                value={user.email ?? ""}
                disabled
                className="mt-1.5 h-10 text-xs sm:text-sm font-mono bg-muted/20 border-dashed border-border/80 cursor-not-allowed text-muted-foreground rounded-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={busy}
              size="sm"
              className="h-9 px-5 text-xs font-medium rounded-none bg-foreground text-background hover:bg-foreground/90 transition-colors cursor-pointer"
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
      </section>

      {/* ── 3. Notification Preferences (Clean flat rows) ────────────── */}
      <section className="space-y-4 pb-8 border-b border-border/80">
        <div>
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground/75">
            Communications
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-medium text-foreground">
            Notification Preferences
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Specify which account and order activity alerts reach your email inbox.
          </p>
        </div>

        <div className="divide-y divide-border/60 border-t border-b border-border/60">
          <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs sm:text-sm font-medium text-foreground">Order Updates & Receipts</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Invoice receipts, dispatch tracking, and fulfillment confirmations</p>
            </div>
            <Switch
              checked={p.notify_email}
              onCheckedChange={(v) => setP({ ...p, notify_email: v })}
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-3 sm:py-3.5">
            <div className="min-w-0 pr-2">
              <p className="text-xs sm:text-sm font-medium text-foreground">Curated Harvests & Offers</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">Seasonal updates, producer stories, and exclusive sale alerts</p>
            </div>
            <Switch
              checked={p.notify_offers}
              onCheckedChange={(v) => setP({ ...p, notify_offers: v })}
            />
          </div>
        </div>
      </section>

      {/* ── 4. Password & Security ────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <div className="text-[10px] sm:text-[11px] font-mono uppercase tracking-widest text-muted-foreground/75">
            Authentication
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-medium text-foreground">
            Security & Password
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Rotate your password regularly to safeguard your account and transaction history.
          </p>
        </div>

        <form onSubmit={changePw} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cp1" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Current Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="cp1"
                  type={showCurrentPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw({ ...pw, current: e.target.value })}
                  placeholder="Enter current password"
                  className="h-10 pr-9 text-xs sm:text-sm border-border/80 focus:border-foreground rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="cp2" className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                New Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="cp2"
                  type={showNextPw ? "text" : "password"}
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  placeholder="Minimum 8 characters"
                  className="h-10 pr-9 text-xs sm:text-sm border-border/80 focus:border-foreground rounded-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNextPw(!showNextPw)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showNextPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={busyPw || !pw.current || !pw.next}
              className="h-9 px-5 text-xs font-medium rounded-none border border-border/80 hover:border-foreground text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
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
      </section>
    </div>
  );
}
