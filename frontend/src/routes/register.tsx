import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Mail, User as UserIcon, Phone, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/site/Logo";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { PasswordStrengthIndicator, getPasswordStrength } from "@/components/ui/password-strength";

const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : "/");
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);
const SIGNUP_SESSION_KEY = "dovan_signup_session_jwt";

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
  const [signupToken, setSignupToken] = useState("");

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

  // Restore signup session from signed JWT if mobile user switched tabs to check OTP email
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SIGNUP_SESSION_KEY) || localStorage.getItem(SIGNUP_SESSION_KEY);
      if (raw) {
        const session = JSON.parse(raw);
        if (session?.token && session?.expiresAt && Date.now() < session.expiresAt) {
          if (session.email) setEmail(session.email);
          if (session.name) setName(session.name);
          if (session.phone) setPhone(session.phone);
          setSignupToken(session.token);
          setStep("otp");
        } else {
          sessionStorage.removeItem(SIGNUP_SESSION_KEY);
          localStorage.removeItem(SIGNUP_SESSION_KEY);
        }
      }
    } catch {
      // Ignore parse failure
    }
  }, []);

  useEffect(() => {
    if (user) {
      void nav({ to: dest as "/" });
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
      toast.error("Passwords do not match");
      return;
    }

    const strength = getPasswordStrength(password);
    if (strength.score < 2) {
      toast.error(
        "Please choose a stronger password (at least 8 characters with letters, numbers or symbols)"
      );
      return;
    }

    setBusy(true);
    setBusyMessage("Sending verification code...");
    try {
      const res = await api.post("/auth/otp/send", {
        email: result.data.email,
        flow: "signup",
        name: result.data.name,
        phone: result.data.phone,
        password: result.data.password,
      });

      // Persist signed JWT registration session so state survives mobile tab switching & page reloads
      if (res?.signup_token) {
        setSignupToken(res.signup_token);
        const sessionData = {
          token: res.signup_token,
          email: result.data.email,
          name: result.data.name,
          phone: result.data.phone,
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        try {
          sessionStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(sessionData));
          localStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(sessionData));
        } catch {}
      }

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
    setBusyMessage("Verifying code...");
    try {
      const res = await api.post("/auth/otp/verify", {
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        flow: "signup",
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        newPassword: password || undefined,
        signup_token: signupToken || undefined,
      });

      setBusyMessage("Finalizing session...");

      // Clean up persisted registration session
      try {
        sessionStorage.removeItem(SIGNUP_SESSION_KEY);
        localStorage.removeItem(SIGNUP_SESSION_KEY);
      } catch {}

      let sessionEstablished = false;

      // 1. If backend returned Supabase session, set directly into client
      if (res?.supabaseSession?.access_token && res?.supabaseSession?.refresh_token) {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: res.supabaseSession.access_token,
            refresh_token: res.supabaseSession.refresh_token,
          });
          if (!error) sessionEstablished = true;
        } catch {}
      }

      // 2. Fallback: signInWithPassword if password was retained in memory
      if (!sessionEstablished && password) {
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
          });
          if (!signInError && signInData?.session) {
            sessionEstablished = true;
          }
        } catch {}
      }

      if (sessionEstablished) {
        toast.success("Account verified! Welcome to DOVAN.");
        void nav({ to: dest as "/" });
        return;
      }

      toast.success("Account created successfully! Please sign in with your credentials.");
      void nav({ to: "/login" });
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
      const res = await api.post("/auth/otp/send", {
        email: email.trim().toLowerCase(),
        flow: "signup",
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password || undefined,
      });

      if (res?.signup_token) {
        setSignupToken(res.signup_token);
        const sessionData = {
          token: res.signup_token,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          phone: phone.trim(),
          expiresAt: Date.now() + 15 * 60 * 1000,
        };
        try {
          sessionStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(sessionData));
          localStorage.setItem(SIGNUP_SESSION_KEY, JSON.stringify(sessionData));
        } catch {}
      }

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
    <div className="container-edge py-8 sm:py-12 md:py-16 lg:py-20">
      <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-16 xl:gap-24 items-start">
        {/* Left Column: Editorial Brand Community Story (Edge-on left) */}
        <div className="hidden md:flex md:col-span-6 lg:col-span-5 flex-col justify-between pt-1">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-5 w-5 text-foreground" />
              <span className="font-display text-base font-semibold tracking-wider">DOVAN</span>
            </div>

            <div className="mt-8">
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                DOVAN Collective
              </span>
              <h2 className="mt-2 font-display text-3xl lg:text-4xl xl:text-5xl font-normal leading-tight text-foreground">
                Thoughtful essentials for everyday life.
              </h2>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed max-w-md">
                Join our collective to unlock real-time tracking across 77 districts, curated wishlists, and seasonal provisions.
              </p>
            </div>

            <div className="my-8 border-t border-border/80" />

            <div className="space-y-4 text-xs text-foreground/80 font-mono">
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">01</span>
                <span className="font-sans text-xs text-foreground/85">Live order and parcel tracking from dispatch to delivery</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">02</span>
                <span className="font-sans text-xs text-foreground/85">Curated wishlists with price drops and restock alerts</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-muted-foreground">03</span>
                <span className="font-sans text-xs text-foreground/85">Dedicated customer support and seamless checkout</span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-border/80">
            <p className="font-serif italic text-xs text-muted-foreground leading-relaxed">
              "Honest provisions, transparent craft, and enduring quality."
            </p>
            <p className="mt-1 text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest">
              Kathmandu Valley, Nepal
            </p>
          </div>
        </div>

        {/* Right Column: Flat Registration & Verification Form (Edge-on right with vertical rule) */}
        <div className="md:col-span-6 lg:col-span-7 md:border-l md:border-border/60 md:pl-8 lg:pl-14 xl:pl-20">
          <div className="max-w-md w-full">
            {step === "otp" ? (
              /* ── STEP 2: OTP VERIFICATION ────────────────────────── */
              <div className="space-y-6">
                <div>
                  <div className="md:hidden flex items-center gap-2 mb-4">
                    <LogoMark className="h-5 w-5 text-foreground" />
                    <span className="font-display text-base font-semibold tracking-wider">DOVAN</span>
                  </div>
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted text-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Security Verification
                  </p>
                  <h1 className="mt-1 font-display text-3xl sm:text-4xl font-normal text-foreground">
                    Enter Verification Code
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    We've sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>. Enter it below to complete your registration.
                  </p>
                </div>

                <form onSubmit={verifyAndRegister} className="space-y-6">
                  <div className="flex flex-col items-center justify-center space-y-3 pt-2">
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
                        <InputOTPSlot index={0} className="h-11 w-11 text-lg font-mono font-semibold" />
                        <InputOTPSlot index={1} className="h-11 w-11 text-lg font-mono font-semibold" />
                        <InputOTPSlot index={2} className="h-11 w-11 text-lg font-mono font-semibold" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="h-11 w-11 text-lg font-mono font-semibold" />
                        <InputOTPSlot index={4} className="h-11 w-11 text-lg font-mono font-semibold" />
                        <InputOTPSlot index={5} className="h-11 w-11 text-lg font-mono font-semibold" />
                      </InputOTPGroup>
                    </InputOTP>

                    <p className="text-xs text-muted-foreground text-center">
                      Check your email inbox or spam folder for the code.
                    </p>
                  </div>

                  <Button
                    id="verify-otp-btn"
                    type="submit"
                    className="w-full h-10 rounded-md font-medium cursor-pointer"
                    disabled={busy || otp.trim().length < 6}
                  >
                    {busy
                      ? (busyMessage || "Verifying code...")
                      : "Verify & Complete Registration"}
                  </Button>

                  <div className="flex items-center justify-between border-t border-border/80 pt-4 text-xs text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          sessionStorage.removeItem(SIGNUP_SESSION_KEY);
                          localStorage.removeItem(SIGNUP_SESSION_KEY);
                        } catch {}
                        setSignupToken("");
                        setOtp("");
                        setStep("form");
                      }}
                      className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Edit details
                    </button>

                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={resendTimer > 0 || busy}
                      className="font-medium text-foreground underline underline-offset-4 hover:text-accent disabled:opacity-50 disabled:no-underline cursor-pointer"
                    >
                      {resendTimer > 0
                        ? `Resend in ${resendTimer}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* ── STEP 1: REGISTRATION DETAILS FORM ──────────────── */
              <>
                <div className="mb-8">
                  <div className="md:hidden flex items-center gap-2 mb-4">
                    <LogoMark className="h-5 w-5 text-foreground" />
                    <span className="font-display text-base font-semibold tracking-wider">DOVAN</span>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    New Account
                  </p>
                  <h1 className="mt-1 font-display text-3xl sm:text-4xl font-normal text-foreground">
                    {t("create_account")}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    Join DOVAN for faster checkouts, order tracking across Nepal, and saved items.
                  </p>
                </div>

                <form onSubmit={requestOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-xs font-medium">Full name</Label>
                    <div className="relative">
                      <Input
                        id="reg-name"
                        type="text"
                        autoComplete="name"
                        required
                        placeholder="Bipin Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pr-10 h-10 rounded-md"
                      />
                      <UserIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone" className="text-xs font-medium">Phone number</Label>
                    <div className="relative">
                      <Input
                        id="reg-phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        placeholder="98XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pr-10 h-10 rounded-md"
                      />
                      <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-xs font-medium">Email address</Label>
                    <div className="relative">
                      <Input
                        id="reg-email"
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
                    <Label htmlFor="reg-password" className="text-xs font-medium">Password</Label>
                    <div className="relative">
                      <Input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
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
                    <PasswordStrengthIndicator password={password} isNepali={isNepali} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reg-confirm-password" className="text-xs font-medium">Confirm password</Label>
                    <Input
                      id="reg-confirm-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 rounded-md"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    By registering, you agree to our <Link to="/policies/$page" params={{ page: "terms" }} className="underline hover:text-foreground">Terms of Service</Link> and <Link to="/policies/$page" params={{ page: "privacy" }} className="underline hover:text-foreground">Privacy Policy</Link>.
                  </p>

                  <Button type="submit" className="w-full h-10 rounded-md font-medium cursor-pointer mt-2" disabled={busy}>
                    {busy
                      ? "Sending verification code..."
                      : "Continue & Get Verification Code"}
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
                  Already have an account?{" "}
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
      </div>
    </div>
  );
}
