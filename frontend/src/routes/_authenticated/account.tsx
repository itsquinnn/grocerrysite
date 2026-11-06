import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import {
  User,
  Package,
  MapPin,
  Store,
  LifeBuoy,
  Bell,
  Heart,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  LogOut,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, isAdmin, wishlist } = useShop();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

  // Check if current user is an approved seller partner
  const [isSellerApproved, setIsSellerApproved] = useState(() => {
    if (isAdmin) return true;
    if (typeof window === "undefined") return false;
    const directStatus = user?.id ? localStorage.getItem(`dovan_seller_status_${user.id}`) : null;
    if (directStatus === "approved") return true;
    if (directStatus === "rejected" || directStatus === "pending") return false;
    try {
      const raw = localStorage.getItem("dovan_seller_applications");
      if (raw && user?.id) {
        const list = JSON.parse(raw);
        const app = list.find((a: any) => a.userId === user.id || (user.email && a.userEmail === user.email));
        if (app) return app.status === "approved";
      }
    } catch {}
    return localStorage.getItem("dovan_seller_status") === "approved";
  });

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

  const links = useMemo(
    () => [
      {
        to: "/account",
        label: "Profile",
        icon: User,
        exact: true,
      },
      {
        to: "/account/orders",
        label: "Orders & Invoices",
        icon: Package,
      },
      {
        to: "/account/addresses",
        label: "Addresses",
        icon: MapPin,
      },
      {
        to: "/seller",
        label: isSellerApproved ? "Seller Dashboard" : "Sell & Submissions",
        icon: Store,
      },
      {
        to: "/account/support",
        label: "Support Tickets",
        icon: LifeBuoy,
      },
      {
        to: "/account/notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        to: "/wishlist",
        label: `Saved Items${wishlist.length > 0 ? ` (${wishlist.length})` : ""}`,
        icon: Heart,
      },
    ],
    [wishlist.length, isSellerApproved],
  );

  const currentPath = location.pathname;

  // Auto-scroll the active tab pill into view on mobile
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [currentPath]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate({ to: "/login" });
      toast.success("Signed out successfully");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <div className="container-page py-2.5 sm:py-3.5 md:py-4 max-w-full overflow-x-hidden">
      {/* ── Administrator Notice Banner ─────────────────────────────────── */}
      {isAdmin && (
        <div className="mb-3 sm:mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-primary/25 bg-primary/5 p-2.5 sm:p-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-xs">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">Administrator Account</p>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-primary uppercase shrink-0">
                  Staff
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                You are signed in with administrative access.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition shrink-0"
          >
            <span>Open Admin Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Page Title Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 no-print">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-display tracking-tight text-foreground">
          My Account
        </h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="md:hidden inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive px-2 py-1 rounded-lg transition"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign out</span>
        </button>
      </div>

      {/* ── Mobile Navigation Pill Tabs (Streamlined, 1-tap, Touch-Smooth) ─ */}
      <div className="md:hidden mt-3 sm:mt-4 -mx-3 px-3 overflow-x-auto no-scrollbar scroll-smooth no-print">
        <nav className="flex items-center gap-2 py-1" aria-label="Account Tabs">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.to === "/account"
                ? currentPath === "/account"
                : currentPath.startsWith(link.to);

            // If this is the seller link, open in a dedicated clean tab!
            if (link.to === "/seller") {
              return (
                <a
                  key={link.to}
                  href="/seller"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-all shadow-2xs shrink-0 active:scale-95 touch-manipulation",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                      : "bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20",
                  )}
                  title="Open Seller Dashboard in Dedicated New Tab"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{link.label}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              );
            }

            return (
              <Link
                key={link.to}
                ref={isActive ? activeTabRef : undefined}
                to={link.to}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold transition-all shadow-2xs shrink-0 active:scale-95 touch-manipulation",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs ring-1 ring-primary"
                    : "bg-card border border-border/80 text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-3.5 md:mt-5 grid gap-3.5 md:gap-5 md:grid-cols-[215px_1fr] items-start min-w-0 max-w-full">
        {/* ── Desktop Left Sidebar (hidden md:flex) ──────────────────────── */}
        <aside className="hidden md:flex flex-col gap-0.5 rounded-2xl border bg-card p-2 shadow-2xs sticky top-20 no-print">
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Account Navigation
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.to === "/account"
                ? currentPath === "/account"
                : currentPath.startsWith(link.to);

            // If this is the seller link, clicking it opens the dedicated Seller Dashboard in a new tab!
            if (link.to === "/seller") {
              return (
                <a
                  key={link.to}
                  href="/seller"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-medium transition group/seller-link",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-foreground/85 hover:bg-primary/10 hover:text-primary",
                  )}
                  title="Open Seller Dashboard in Dedicated New Tab"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="truncate">{link.label}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md border border-primary/25 shrink-0">
                    <span>New Tab</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </span>
                </a>
              );
            }

            return (
              <div key={link.to} className="relative group/side-item flex items-center">
                <Link
                  to={link.to}
                  className={cn(
                    "flex-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-medium transition",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{link.label}</span>
                </Link>
                {link.to === "/account/sell" && (
                  <a
                    href="/account/sell"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-2 opacity-0 group-hover/side-item:opacity-100 p-1 rounded-md text-foreground/70 hover:text-primary transition"
                    title="Open Seller Dashboard in New Tab"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            );
          })}

          {/* Admin shortcut at bottom of desktop sidebar for staff */}
          {isAdmin && (
            <div className="mt-2 pt-2 border-t">
              <Link
                to="/admin"
                className="flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Console</span>
                </span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            </div>
          )}

          {/* Sign out link on desktop sidebar */}
          <div className="mt-1.5 pt-1.5 border-t">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ── Main Content Area ─────────────────────────────────────────── */}
        <div className="min-w-0 max-w-full overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
