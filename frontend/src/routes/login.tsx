import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");

export const Route = createFileRoute("/login")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — DOVAN" },
      { name: "description", content: "Sign in to your DOVAN account to track orders and manage your saved items." },
      { property: "og:title", content: "Sign in — DOVAN" },
      { property: "og:description", content: "Sign in to your DOVAN account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  const { user } = useShop();
  const { isNepali, t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const dest = safePath(redirect);

  useEffect(() => {
    if (user) {
      void nav({ to: dest as "/account" });
    }
  }, [user, dest, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Incorrect email or password. Please try again."
            : error.message
        );
      } else {
        toast.success("Welcome back!");
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/login?redirect=" + encodeURIComponent(dest),
      },
    });
    if (error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6 text-center sm:text-left">
          <p className="eyebrow">{isNepali ? "खाता" : "Account"}</p>
          <h1 className="mt-1 text-3xl font-semibold">{t("sign_in")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isNepali
              ? "आफ्नो अर्डर तथा इच्छा सूची हेर्नका लागि लग-इन गर्नुहोस्।"
              : "Enter your credentials to access your orders and wishlist."}
          </p>
        </div>

        {/* Temporary Demo Account Card */}
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-accent">Temporary Test Account</span>
            <button
              type="button"
              onClick={() => {
                setEmail("dovandemo2026@mailinator.com");
                setPassword("Dovan@TempUser2026#");
                toast.success("Temporary credentials filled in!");
              }}
              className="cursor-pointer rounded bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground transition hover:bg-accent/90"
            >
              1-Click Autofill
            </button>
          </div>
          <div className="mt-2 space-y-0.5 font-mono text-[11px] text-muted-foreground">
            <p>Email: <span className="font-medium text-foreground">dovandemo2026@mailinator.com</span></p>
            <p>Password: <span className="font-medium text-foreground">Dovan@TempUser2026#</span></p>
          </div>
        </div>

        <form onSubmit={signIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email">{isNepali ? "इमेल ठेगाना" : "Email address"}</Label>
            <div className="relative">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-10"
              />
              <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">{isNepali ? "पासवर्ड" : "Password"}</Label>
              <Link
                to="/forgot-password"
                search={{ redirect: redirect || undefined }}
                className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                {isNepali ? "पासवर्ड बिर्सनुभयो?" : "Forgot password?"}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (isNepali ? "लग-इन हुँदैछ..." : "Signing in...") : t("sign_in")}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>{isNepali ? "वा" : "or"}</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="outline" type="button" className="w-full" onClick={google}>
          {isNepali ? "गुगल खाताबाट अगाडि बढ्नुहोस्" : "Continue with Google"}
        </Button>

        <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
          {isNepali ? "खाता छैन? " : "Don't have an account yet? "}
          <Link
            to="/register"
            search={{ redirect: redirect || undefined }}
            className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
          >
            {t("create_account")}
          </Link>
        </div>
      </div>
    </div>
  );
}

