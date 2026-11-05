import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrengthIndicator, getPasswordStrength } from "@/components/ui/password-strength";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Set new password — DOVAN" },
      { name: "description", content: "Choose a new secure password for your DOVAN account." },
      { property: "og:title", content: "Set new password — DOVAN" },
      { property: "og:description", content: "Choose a new secure password for your DOVAN account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { isNepali } = useI18n();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
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
    try {
      if (token) {
        // Direct server password reset using single-use secure token
        await api.post("/auth/password/reset-confirm", {
          token,
          password,
        });
      } else {
        // Fallback for legacy Supabase recovery session
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          const msg = error.message?.toLowerCase() || "";
          if (msg.includes("session") || msg.includes("token") || msg.includes("expired") || msg.includes("missing")) {
            toast.error(
              isNepali
                ? "यो पासवर्ड रिसेट लिङ्कको म्याद सकियो वा अमान्य छ। कृपया नयाँ लिङ्क अनुरोध गर्नुहोस्।"
                : "This reset link has expired or is invalid. Please request a new one."
            );
          } else {
            toast.error(error.message);
          }
          return;
        }
      }
      setDone(true);
      toast.success(
        isNepali
          ? "पासवर्ड सफलतापूर्वक परिवर्तन भयो!"
          : "Password updated successfully!"
      );
    } catch (err: any) {
      console.error("[Reset Password Confirm Error]:", err);
      toast.error(
        err?.message ||
          (isNepali
            ? "पासवर्ड परिवर्तन गर्न असफल भयो। लिङ्कको म्याद सकिएको हुन सक्छ।"
            : "Failed to update password. The link may have expired or is invalid.")
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-page flex justify-center py-10 md:py-16">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-card sm:p-8">
        {done ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold">
              {"Password updated"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {"Your password has been changed successfully. You can now access your account with your new password."}
            </p>
            <div className="pt-2">
              <Button asChild className="w-full">
                <Link to="/login">
                  {"Continue to sign in"}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center sm:text-left">
              <p className="eyebrow">{"Security"}</p>
              <h1 className="mt-1 text-3xl font-semibold">
                {"Set new password"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {"Enter and confirm your new password below."}
              </p>
            </div>

            {!token && (
              <div className="mb-4 flex items-start gap-2.5 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  {isNepali
                    ? "कुनै मान्य पासवर्ड रिसेट टोकन फेला परेन। यदि तपाईंसँग लिङ्क छैन भने, कृपया नयाँ अनुरोध गर्नुहोस्।"
                    : "No reset token found in URL. If you don't have an active reset link, please request one."}
                  <div className="mt-1">
                    <Link to="/forgot-password" className="font-medium underline hover:opacity-80">
                      {isNepali ? "पासवर्ड रिसेट अनुरोध गर्नुहोस्" : "Request reset link"}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">
                  {"New password"}
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder={"At least 8 characters"}
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
                <Label htmlFor="confirm-new-password">
                  {"Confirm new password"}
                </Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  placeholder={"Re-enter your new password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {"Make sure your password is at least 8 characters long and contains letters, numbers, or symbols."}
              </p>

              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? ("Updating password...")
                  : ("Update password")}
              </Button>
            </form>

            <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
              <Link
                to="/login"
                className="inline-flex items-center text-muted-foreground hover:text-foreground hover:underline"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                {"Back to sign in"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
