import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/account/")({ component: Profile });

function Profile() {
  const { user } = useShop();
  const { isNepali } = useI18n();

  const [p, setP] = useState(() => ({
    full_name: (user?.user_metadata?.full_name as string) || (user?.user_metadata?.name as string) || "",
    phone: (user?.user_metadata?.phone as string) || (user?.phone as string) || "",
    avatar_url: (user?.user_metadata?.avatar_url as string) || (user?.user_metadata?.picture as string) || "",
    notify_email: true,
    notify_offers: true,
  }));
  const [pw, setPw] = useState({ current: "", next: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    const initialName = (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "";
    const initialPhone = (user.user_metadata?.phone as string) || (user.phone as string) || "";

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

  const save = async () => {
    if (p.full_name.trim().length < 2) return toast.error(isNepali ? "आफ्नो नाम प्रविष्ट गर्नुहोस्" : "Enter your name");
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
      toast.success(isNepali ? "विवरण बचत भयो" : "Profile saved");
    } catch {
      setBusy(false);
      toast.error(isNepali ? "बचत गर्न सकिएन" : "Could not save");
    }
  };

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 2_000_000) {
      return toast.error(isNepali ? "२ MB भन्दा सानो तस्बिर छान्नुहोस्" : "Choose an image under 2 MB");
    }
    const path = `avatars/${user.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) return toast.error(isNepali ? "अपलोड असफल भयो" : "Upload failed");
    const { data } = await supabase.storage.from("media").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (!data?.signedUrl) return;

    try {
      await api.patch("/profile", { profile_image: data.signedUrl });
      setP((prev) => ({ ...prev, avatar_url: data.signedUrl }));
      toast.success(isNepali ? "तस्बिर अद्यावधिक भयो" : "Photo updated");
    } catch {
      toast.error(isNepali ? "तस्बिर सुरक्षित गर्न सकिएन" : "Could not save photo");
    }
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error(isNepali ? "नयाँ पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ" : "New password must be at least 8 characters");
    const { error: e1 } = await supabase.auth.signInWithPassword({ email: user.email!, password: pw.current });
    if (e1) return toast.error(isNepali ? "हालको पासवर्ड मिलेन" : "Current password is incorrect");
    const { error } = await supabase.auth.updateUser({ password: pw.next });
    if (error) return toast.error(error.message);
    setPw({ current: "", next: "" });
    toast.success(isNepali ? "पासवर्ड परिवर्तन भयो" : "Password changed");
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="rounded-xl border bg-card p-4 sm:p-6 shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-semibold">{isNepali ? "व्यक्तिगत जानकारी" : "Personal information"}</h2>
        <div className="mt-5 flex items-center gap-4">
          <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border">
            <AvatarImage src={p.avatar_url} alt="" />
            <AvatarFallback>{(p.full_name || "DO").slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <label className="cursor-pointer text-xs sm:text-sm font-medium text-accent hover:underline">
              {isNepali ? "तस्बिर बदल्नुहोस्" : "Change photo"}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG or WEBP (Max 2 MB)</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name">{isNepali ? "पूरा नाम" : "Full name"}</Label>
            <Input id="p-name" value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="p-phone">{isNepali ? "फोन नम्बर" : "Phone"}</Label>
            <Input id="p-phone" placeholder="98XXXXXXXX" value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>{isNepali ? "इमेल" : "Email"}</Label>
            <Input value={user.email ?? ""} disabled className="bg-muted/50" />
          </div>
        </div>
        <h3 className="mt-6 font-medium text-sm sm:text-base">{isNepali ? "सूचना प्राथमिकताहरू" : "Notification preferences"}</h3>
        <label className="mt-3 flex items-center justify-between text-xs sm:text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition">
          <span className="pr-2">{isNepali ? "इमेल मार्फत अर्डर अपडेटहरू" : "Order updates by email"}</span>
          <Switch checked={p.notify_email} onCheckedChange={(v) => setP({ ...p, notify_email: v })} />
        </label>
        <label className="mt-2 flex items-center justify-between text-xs sm:text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/40 transition">
          <span className="pr-2">{isNepali ? "अफरहरू र नयाँ सामानहरूको सूचना" : "Offers & new arrivals"}</span>
          <Switch checked={p.notify_offers} onCheckedChange={(v) => setP({ ...p, notify_offers: v })} />
        </label>
        <Button className="mt-6 w-full sm:w-auto" onClick={save} disabled={busy}>
          {isNepali ? "परिवर्तनहरू बचत गर्नुहोस्" : "Save changes"}
        </Button>
      </section>
      <form onSubmit={changePw} className="rounded-xl border bg-card p-4 sm:p-6 shadow-2xs">
        <h2 className="text-xl sm:text-2xl font-semibold">{isNepali ? "पासवर्ड परिवर्तन गर्नुहोस्" : "Change password"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="cp1">{isNepali ? "हालको पासवर्ड" : "Current password"}</Label><Input id="cp1" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
          <div><Label htmlFor="cp2">{isNepali ? "नयाँ पासवर्ड" : "New password"}</Label><Input id="cp2" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        </div>
        <Button className="mt-4 w-full sm:w-auto" variant="outline">
          {isNepali ? "पासवर्ड अद्यावधिक गर्नुहोस्" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
