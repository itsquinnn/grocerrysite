import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  head: () => ({
    meta: [
      { title: "Forgot password — DOVAN" },
      { name: "description", content: "Reset your DOVAN password. We'll send you a secure email link to choose a new password." },
      { property: "og:title", content: "Forgot password — DOVAN" },
      { property: "og:description", content: "Reset your DOVAN password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { redirect } = Route.useSearch();
  const { isNepali } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const sendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setBusy(true);
    try {
      // Safe-side URL: Always resolve to production app when live, or localhost when developing locally
      const redirectOrigin =
        typeof window !== "undefined" && window.location.hostname === "localhost"
          ? window.location.origin
          : "https://dovan-blond.vercel.app";

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${redirectOrigin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Reset link sent!");
    } finally {
      setBusy(false);
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
            <h1 className="text-2xl font-semibold">
              {"Check your email"}
            </h1>
            <p className="text-sm text-muted-foreground">
              If an account exists for <strong className="text-foreground">{email}</strong>, we have sent a password reset link (valid for 10 minutes). Please check your inbox and spam folder.
            </p>
            <div className="space-y-2 pt-2">
              <Button
                variant="outline"
                type="button"
                className="w-full"
                onClick={() => setSent(false)}
              >
                {"Send to a different email"}
              </Button>
              <Button variant="ghost" asChild className="w-full">
                <Link to="/login" search={{ redirect: redirect || undefined }}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {"Back to sign in"}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center sm:text-left">
              <Link
                to="/login"
                search={{ redirect: redirect || undefined }}
                className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline"
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                {"Back to sign in"}
              </Link>
              <h1 className="mt-3 text-3xl font-semibold">
                {"Forgot password?"}
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {"Enter your account's email address and we'll send you instructions to reset your password."}
              </p>
            </div>

            <form onSubmit={sendReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">
                  {"Email address"}
                </Label>
                <div className="relative">
                  <Input
                    id="forgot-email"
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

              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? ("Sending reset link...")
                  : ("Send reset link")}
              </Button>
            </form>

            <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
              {"Remember your password? "}
              <Link
                to="/login"
                search={{ redirect: redirect || undefined }}
                className="font-medium text-foreground underline underline-offset-4 hover:text-accent"
              >
                {"Sign in"}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

