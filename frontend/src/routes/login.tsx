import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/site/Logo";

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
  const { user, isAdmin } = useShop();
  const { isNepali, t } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const dest = safePath(redirect);

  useEffect(() => {
    if (user) {
      const isUserAdmin = isAdmin || (user.user_metadata as any)?.role === "admin";
      if (isUserAdmin) {
        const adminDest = redirect && redirect !== "/account" ? safePath(redirect) : "/admin";
        void nav({ to: adminDest as "/admin" });
      } else {
        void nav({ to: dest as "/account" });
      }
    }
  }, [user, isAdmin, dest, redirect, nav]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    setBusy(true);
    let emailToUse = email.trim();
    if (emailToUse.toLowerCase() === "admin@diovan.com") {
      emailToUse = "admin@dovan.com";
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? ("Incorrect email or password. Please try again.")
            : error.message
        );
      } else {
        toast.success("Welcome back!");
        const isUserAdmin = (data?.user?.user_metadata as any)?.role === "admin";
        if (isUserAdmin) {
          const target = redirect && redirect !== "/account" ? safePath(redirect) : "/admin";
          void nav({ to: target as "/admin" });
        } else {
          void nav({ to: dest as "/account" });
        }
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
    <div className="container-page py-10 sm:py-16 md:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 lg:gap-16 items-start">
        {/* Left Column: Editorial Brand Ledger (Flat, no card, directly on background) */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between pt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-5 w-5 text-foreground" />
              <span className="font-display text-base font-semibold tracking-wider">DOVAN</span>
            </div>

            <div className="mt-8">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Valley Provisions & Craft
              </span>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl font-normal leading-tight text-foreground">
                Crafted for daily living.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Fewer, better things: from valley-woven textiles to small-batch pantry essentials and honest provisions.
              </p>
            </div>

            <div className="my-8 border-t border-border/80" />

            <div className="space-y-4 text-xs text-foreground/80 font-mono">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">01</span>
                <span className="font-sans text-xs text-foreground/85">Small-batch pantry staples and cold-pressed oils</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">02</span>
                <span className="font-sans text-xs text-foreground/85">Valley-woven textiles and authentic handcrafted goods</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">03</span>
                <span className="font-sans text-xs text-foreground/85">Doorstep delivery across all 7 provinces with live tracking</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/80">
            <p className="font-serif italic text-xs text-muted-foreground leading-relaxed">
              "Chosen with intention, made to endure."
            </p>
            <p className="mt-1 text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">
              Kathmandu Valley, Nepal
            </p>
          </div>
        </div>

        {/* Right Column: Flat Authentication Form (No card, directly on background) */}
        <div className="md:col-span-7">
          <div className="max-w-md">
            <div className="mb-8">
              <div className="md:hidden flex items-center gap-2 mb-4">
                <LogoMark className="h-5 w-5 text-foreground" />
                <span className="font-display text-base font-semibold tracking-wider">DOVAN</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Account Sign In
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-normal text-foreground">
                {t("sign_in")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Enter your credentials to access your account, orders, and saved items.
              </p>
            </div>

            {/* Quick Admin Access Bar in DEV */}
            {import.meta.env.DEV && (
              <div className="mb-6 flex items-center justify-between py-2 border-b border-border/80 text-xs">
                <span className="font-mono text-[11px] text-muted-foreground">
                  Demo: <span className="text-foreground">admin@dovan.com</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("admin@dovan.com");
                    setPassword("Admin@123456");
                    toast.success("Admin credentials autofilled!");
                  }}
                  className="font-mono text-xs text-foreground underline underline-offset-4 hover:text-accent cursor-pointer"
                >
                  Autofill admin
                </button>
              </div>
            )}

            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-medium">Email address</Label>
                <div className="relative">
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10 h-10 rounded-md"
                  />
                  <Mail className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password" className="text-xs font-medium">Password</Label>
                  <Link
                    to="/forgot-password"
                    search={{ redirect: redirect || undefined }}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Forgot password?
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
                    className="pr-10 h-10 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-10 rounded-md font-medium cursor-pointer mt-2" disabled={busy}>
                {busy ? "Signing in..." : t("sign_in")}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground font-mono">
              <span className="h-px flex-1 bg-border" />
              <span>or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full h-10 rounded-md font-medium cursor-pointer flex items-center justify-center gap-2"
              onClick={google}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>

            <div className="mt-8 border-t border-border/80 pt-5 text-sm text-muted-foreground">
              Don't have an account yet?{" "}
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
      </div>
    </div>
  );
}

