import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User as UserIcon, Phone, ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { PasswordStrengthIndicator, getPasswordStrength } from "@/components/ui/password-strength";

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

  // Registration step: "form" -> "otp"
  const [step, setStep] = useState<"form" | "otp">("form");

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP field & state
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");

  const dest = safePath(redirect);

  useEffect(() => {
    if (user) {
      void nav({ to: dest as "/account" });
    }
  }, [user, dest, nav]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  /**
   * Step 1: Validate form details & send OTP code to email
   */
  const requestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const result = z
      .object({
        name: z.string().trim().min(2, "Please enter your full name (at least 2 characters)").max(80),
        phone: z.string().trim().min(7, "Please enter a valid phone number (at least 7 digits)").max(20),
        email: z.string().trim().email("Please enter a valid email address"),
        password: pwSchema,
      })
      .safeParse({ name, phone, email, password });

    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error(isNepali ? "पासवर्ड मिलेन" : "Passwords do not match");
      return;
    }

    const strength = getPasswordStrength(password);
    if (strength.score < 2) {
      toast.error(
        isNepali
          ? "कृपया अलि बलियो पासवर्ड राख्नुहोस् (कम्तीमा ८ अक्षर, अंक वा विशेष चिह्न)"
          : "Please choose a stronger password (at least 8 characters with letters, numbers or symbols)"
      );
      return;
    }

    setBusy(true);
    setBusyMessage(isNepali ? "कोड पठाउँदै..." : "Sending verification code...");
    try {
      const res = await api.post("/auth/otp/send", {
        email: result.data.email,
        flow: "signup",
      });

      toast.success(res?.message || "Verification code sent to your email!");
      setStep("otp");
      setOtp("");
      setResendTimer(30);
    } catch (apiErr: any) {
      if (apiErr?.message?.toLowerCase().includes("already exists") || apiErr?.status === 409) {
        toast.error("An account with this email already exists. Please sign in.");
        return;
      }
      toast.error(apiErr?.message || "Failed to send verification code. Please try again.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  };

  /**
   * Step 2: Verify OTP code & complete account registration
   */
  const verifyAndRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code");
      return;
    }

    setBusy(true);
    setBusyMessage(isNepali ? "कोड प्रमाणित गरिँदैछ..." : "Verifying code...");
    try {
      await api.post("/auth/otp/verify", {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        flow: "signup",
        name: name.trim(),
        phone: phone.trim(),
        newPassword: password,
      });

      setBusyMessage(isNepali ? "खाता लगइन गरिँदैछ..." : "Finalizing session...");
      // Immediately establish client session with Supabase
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!signInError && signInData.session) {
        toast.success("Account verified! Welcome to DOVAN.");
        void nav({ to: dest as "/account" });
        return;
      }

      if (signInError) {
        toast.success("Account created successfully! Please sign in with your credentials.");
        void nav({ to: "/login" });
      }
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP code. Please check and try again.");
    } finally {
      setBusy(false);
      setBusyMessage("");
    }
  };

  /**
   * Resend OTP code
   */
  const resendOtp = async () => {
    if (resendTimer > 0 || busy) return;
    setBusy(true);
    try {
      await api.post("/auth/otp/send", {
        email: email.trim().toLowerCase(),
        flow: "signup",
      });
      toast.success("New verification code sent to your email!");
      setResendTimer(30);
      setOtp("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to resend code");
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
        {step === "otp" ? (
          /* ── STEP 2: OTP VERIFICATION ────────────────────────── */
          <div className="space-y-6">
            <div className="text-center sm:text-left">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <p className="eyebrow">{isNepali ? "सुरक्षा प्रमाणीकरण" : "Security Verification"}</p>
              <h1 className="mt-1 text-2xl font-semibold">
                {isNepali ? "इमेल प्रमाणीकरण कोड" : "Enter Verification Code"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {isNepali ? (
                  <>हामीले <strong className="text-foreground">{email}</strong> मा ६-अंकको कोड पठाएका छौं। कोड प्रविष्ट गरी अगाडि बढ्नुहोस्।</>
                ) : (
                  <>We've sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>. Enter it below to get in.</>
                )}
              </p>
            </div>

            <form onSubmit={verifyAndRegister} className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-3">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    if (val.length === 6) {
                      setTimeout(() => {
                        const submitBtn = document.getElementById("verify-otp-btn") as HTMLButtonElement;
                        if (submitBtn) submitBtn.click();
                      }, 100);
                    }
                  }}
                  autoFocus
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-12 w-12 text-lg font-mono font-semibold" />
                    <InputOTPSlot index={1} className="h-12 w-12 text-lg font-mono font-semibold" />
                    <InputOTPSlot index={2} className="h-12 w-12 text-lg font-mono font-semibold" />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} className="h-12 w-12 text-lg font-mono font-semibold" />
                    <InputOTPSlot index={4} className="h-12 w-12 text-lg font-mono font-semibold" />
                    <InputOTPSlot index={5} className="h-12 w-12 text-lg font-mono font-semibold" />
                  </InputOTPGroup>
                </InputOTP>

                <p className="text-xs text-muted-foreground text-center">
                  {isNepali
                    ? "कृपया आफ्नो इमेलको Inbox वा Spam फोल्डर हेर्नुहोस्।"
                    : "Check your email inbox or spam folder for the code."}
                </p>
              </div>

              <Button
                id="verify-otp-btn"
                type="submit"
                className="w-full"
                disabled={busy || otp.trim().length < 6}
              >
                {busy
                  ? (busyMessage || (isNepali ? "प्रमाणित गरिँदैछ..." : "Verifying code..."))
                  : (isNepali ? "प्रमाणित गरी खाता खोल्नुहोस्" : "Verify & Get In")}
              </Button>

              <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                  }}
                  className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {isNepali ? "विवरण सच्याउनुहोस्" : "Edit details"}
                </button>

                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendTimer > 0 || busy}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 disabled:opacity-50 disabled:no-underline"
                >
                  {resendTimer > 0
                    ? (isNepali ? `${resendTimer} सेकेन्डमा पुन: पठाउनुहोस्` : `Resend in ${resendTimer}s`)
                    : (isNepali ? "कोड पुन: पठाउनुहोस्" : "Resend OTP")}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── STEP 1: REGISTRATION DETAILS FORM ──────────────── */
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

            <form onSubmit={requestOtp} className="space-y-4">
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
                <Label htmlFor="reg-phone">{isNepali ? "फोन नम्बर" : "Phone number"}</Label>
                <div className="relative">
                  <Input
                    id="reg-phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pr-10"
                  />
                  <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                <PasswordStrengthIndicator password={password} isNepali={isNepali} />
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
                {busy
                  ? (isNepali ? "कोड पठाउँदै..." : "Sending verification code...")
                  : (isNepali ? "अगाडि बढ्नुहोस् (OTP पाउनुहोस्)" : "Continue & Get Verification Code")}
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
