import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User as UserIcon, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/account");
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

export const Route = createFileRoute("/register")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Create an account — DOVAN" },
      { name: "description", content: "Create your DOVAN account for faster checkout, order tracking across Nepal, and personalized wishlist." },
      { property: "og:title", content: "Create an account — DOVAN" },
      { property: "og:description", content: "Create your DOVAN account." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { redirect } = Route.useSearch();
  const { user } = useShop();
  const { isNepali, t } = useI18n();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const dest = safePath(redirect);

  useEffect(() => {
    if (user) {
      void nav({ to: dest as "/account" });
    }
  }, [user, dest, nav]);

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = z
      .object({
        name: z.string().trim().min(2, "Please enter your full name (at least 2 characters)").max(80),
        email: z.string().trim().email("Please enter a valid email address"),
        password: pwSchema,
      })
      .safeParse({ name, email, password });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: result.data.email,
        password: result.data.password,
        options: {
          emailRedirectTo: window.location.origin + dest,
          data: { full_name: result.data.name },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success("Account created successfully!");
        void nav({ to: dest as "/account" });
      } else {
        setSent(result.data.email);
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/register?redirect=" + encodeURIComponent(dest),
      },
    });
    if (error) {
      toast.error("Google registration failed. Please try again.");
    }
  };

  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-card sm:p-8">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">Verify your email</h1>
            <p className="text-sm text-muted-foreground">
              We've sent a verification link to <strong className="text-foreground">{sent}</strong>.
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>
            <div className="pt-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/login" search={{ redirect: redirect || undefined }}>
                  Proceed to sign in
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center sm:text-left">
              <p className="eyebrow">{isNepali ? "खाता" : "Account"}</p>
              <h1 className="mt-1 text-3xl font-semibold">{t("create_account")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isNepali
                  ? "नेपालभर अर्डर ट्र्याक गर्न, इच्छा सूची सुरक्षित गर्न र सजिलो चेकआउटका लागि दोभानमा दर्ता हुनुहोस्।"
                  : "Join DOVAN for faster checkouts, order tracking across Nepal, and saved items."}
              </p>
            </div>

            <form onSubmit={signUp} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">{isNepali ? "पूरा नाम" : "Full name"}</Label>
                <div className="relative">
                  <Input
                    id="reg-name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Bipin Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pr-10"
                  />
                  <UserIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">{isNepali ? "इमेल ठेगाना" : "Email address"}</Label>
                <div className="relative">
                  <Input
                    id="reg-email"
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
                <Label htmlFor="reg-password">{isNepali ? "पासवर्ड" : "Password"}</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder={isNepali ? "कम्तिमा ८ अक्षर" : "At least 8 characters"}
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

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-password">{isNepali ? "पासवर्ड पुष्टि गर्नुहोस्" : "Confirm password"}</Label>
                <Input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder={isNepali ? "पासवर्ड पुनः प्रविष्ट गर्नुहोस्" : "Re-enter password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {isNepali ? (
                  <>दर्ता भएर, तपाईं हाम्रा <Link to="/policies/$page" params={{ page: "terms" }} className="underline hover:text-foreground">नियम तथा सर्तहरू</Link> र <Link to="/policies/$page" params={{ page: "privacy" }} className="underline hover:text-foreground">गोपनीयता नीति</Link> स्वीकार गर्नुहुन्छ।</>
                ) : (
                  <>By registering, you agree to our <Link to="/policies/$page" params={{ page: "terms" }} className="underline hover:text-foreground">Terms of Service</Link> and <Link to="/policies/$page" params={{ page: "privacy" }} className="underline hover:text-foreground">Privacy Policy</Link>.</>
                )}
              </p>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? (isNepali ? "खाता खोलिँदैछ..." : "Creating account...") : t("create_account")}
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
              {isNepali ? "पहिले नै खाता छ? " : "Already have an account? "}
              <Link
                to="/login"
                search={{ redirect: redirect || undefined }}
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
              >
                {t("sign_in")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

