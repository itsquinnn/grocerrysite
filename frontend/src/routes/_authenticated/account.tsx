import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  Lock,
  Clock,
  XCircle,
  CheckCircle2,
  Search,
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

  // Check live server seller status for current user
  const { data: serverStatus } = useQuery({
    queryKey: ["seller", "status"],
    queryFn: () => api.get<{ seller_status: string }>("/seller/status").catch(() => null),
    enabled: !!user?.id,
  });

  const [sellerStatus, setSellerStatus] = useState<"none" | "pending" | "approved" | "rejected">(() => {
    if (typeof window !== "undefined" && user?.id) {
      const directStatus = localStorage.getItem(`dovan_seller_status_${user.id}`);
      if (directStatus === "pending" || directStatus === "approved" || directStatus === "rejected") {
        return directStatus as any;
      }
    }
    return "none";
  });

  useEffect(() => {
    if (serverStatus?.seller_status) {
      const status = serverStatus.seller_status === "suspended" ? "rejected" : serverStatus.seller_status;
      setSellerStatus(status as any);
      if (user?.id) {
        localStorage.setItem(`dovan_seller_status_${user.id}`, status);
      }
    }
  }, [serverStatus, user?.id]);

  useEffect(() => {
    const checkStatus = () => {
      if (!user?.id) {
        setSellerStatus("none");
        return;
      }
      if (typeof window === "undefined") return;

      const directStatus = localStorage.getItem(`dovan_seller_status_${user.id}`);
      if (directStatus && (directStatus === "pending" || directStatus === "approved" || directStatus === "rejected")) {
        setSellerStatus(directStatus as any);
        return;
      }

      try {
        const raw = localStorage.getItem("dovan_seller_applications");
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const app = list.find((a: any) => a.userId === user.id || (user.email && a.userEmail === user.email));
            if (app?.status) {
              setSellerStatus(app.status);
              return;
            }
          }
        }
      } catch {}

      setSellerStatus("none");
    };

    checkStatus();
    window.addEventListener("storage", checkStatus);
    window.addEventListener("dovan:seller-status-changed", checkStatus);
    return () => {
      window.removeEventListener("storage", checkStatus);
      window.removeEventListener("dovan:seller-status-changed", checkStatus);
    };
  }, [user]);

  const isSellerApproved = sellerStatus === "approved";

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
        to: "/account/sell",
        label: isSellerApproved ? "Seller Dashboard" : "Sell on DOVAN",
        statusDot:
          sellerStatus === "pending"
            ? "bg-amber-500"
            : sellerStatus === "rejected"
            ? "bg-rose-500"
            : null,
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
    [wishlist.length, isSellerApproved, sellerStatus],
  );

  const currentPath = location.pathname;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLinks = useMemo(() => {
    if (!searchQuery.trim()) return links;
    const q = searchQuery.toLowerCase().trim();
    return links.filter(
      (l) =>
        l.label.toLowerCase().includes(q) ||
        l.to.toLowerCase().includes(q)
    );
  }, [links, searchQuery]);

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
      {/* ── Page Title Header ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print pb-2 border-b border-border/40">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-foreground">
            Manage Account
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage your personal profile, order history, addresses, and preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Header Search Settings Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-full bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground/60 focus:bg-background focus:border-foreground/50 focus:outline-hidden transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="md:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive px-3 py-1.5 rounded-full border border-border/60 transition shrink-0"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
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
                {(link as any).statusDot && (
                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", (link as any).statusDot)} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-3.5 md:mt-5 grid gap-6 md:gap-8 md:grid-cols-[230px_1fr] items-start min-w-0 max-w-full">
        {/* ── Desktop Left Sidebar (Clean borderless luxury styling) ──────── */}
        <aside className="hidden md:flex flex-col gap-1 sticky top-24 no-print pr-3">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
            Account Navigation
          </div>
          <nav className="space-y-0.5">
            {filteredLinks.length === 0 ? (
              <p className="px-3 py-3 text-xs text-muted-foreground/70 italic">No settings found</p>
            ) : (
              filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === "/account"
                    ? currentPath === "/account"
                    : currentPath.startsWith(link.to);

                return (
                  <div key={link.to} className="relative group/side-item flex items-center">
                    <Link
                      to={link.to}
                      className={cn(
                        "flex-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{link.label}</span>
                      {(link as any).statusDot && (
                        <span className={cn("ml-auto h-2 w-2 rounded-full shrink-0", (link as any).statusDot)} />
                      )}
                    </Link>
                    {link.to === "/account/sell" && isSellerApproved && (
                      <a
                        href="/seller"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-foreground/70 hover:text-primary transition shrink-0 ml-1"
                        title="Open Dedicated Seller Dashboard in New Tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </nav>

          {/* Admin shortcut at bottom of desktop sidebar for staff */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <Link
                to="/admin"
                className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition"
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
          <div className="mt-2 pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
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
