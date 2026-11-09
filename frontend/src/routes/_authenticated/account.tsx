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
        mobileLabel: "Profile",
        icon: User,
        exact: true,
      },
      {
        to: "/account/orders",
        label: "Orders & Invoices",
        mobileLabel: "Orders",
        icon: Package,
      },
      {
        to: "/account/addresses",
        label: "Addresses",
        mobileLabel: "Addresses",
        icon: MapPin,
      },
      ...(isAdmin
        ? []
        : [
            {
              to: "/account/sell",
              label: isSellerApproved ? "Seller Dashboard" : "Sell on DOVAN",
              mobileLabel: isSellerApproved ? "Store" : "Sell",
              statusDot:
                sellerStatus === "pending"
                  ? "bg-amber-500"
                  : sellerStatus === "rejected"
                  ? "bg-rose-500"
                  : null,
              icon: Store,
            },
          ]),
      {
        to: "/account/support",
        label: "Support Tickets",
        mobileLabel: "Support",
        icon: LifeBuoy,
      },
      {
        to: "/account/notifications",
        label: "Notifications",
        mobileLabel: "Alerts",
        icon: Bell,
      },
      {
        to: "/wishlist",
        label: `Saved Items${wishlist.length > 0 ? ` (${wishlist.length})` : ""}`,
        mobileLabel: `Saved${wishlist.length > 0 ? ` (${wishlist.length})` : ""}`,
        icon: Heart,
      },
    ],
    [wishlist.length, isSellerApproved, sellerStatus, isAdmin],
  );

  const currentPath = location.pathname;
  const activeTabRef = useRef<HTMLAnchorElement | null>(null);

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
    <div className="container-page py-2.5 sm:py-5 md:py-8">
      <div className="w-full space-y-3 sm:space-y-6">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-border/60 gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl md:text-3xl font-display font-medium tracking-tight text-foreground">
              Account
            </h1>
            <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage your profile, order history, and delivery details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border/60 hover:bg-muted/40 transition cursor-pointer shrink-0"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* ── Mobile Navigation: Sleek Segmented Strip (1-tap, auto-centers, zero dropdown obstruction) ── */}
        <div className="md:hidden">
          <nav
            className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/60 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
            aria-label="Account sections"
          >
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
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all shrink-0 select-none",
                    isActive
                      ? "bg-background text-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "opacity-70")} />
                  <span>{link.mobileLabel || link.label}</span>
                  {(link as any).statusDot && (
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", (link as any).statusDot)} />
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-all shrink-0 ml-auto"
                title="Go to Admin Console"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* ── Main Layout: Sidebar + Content ──────────────────────────── */}
        <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-[220px_1fr] items-start">
          {/* Desktop Left Navigation */}
          <aside className="hidden md:flex flex-col gap-1 sticky top-24 no-print">
            <nav className="space-y-0.5">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === "/account"
                    ? currentPath === "/account"
                    : currentPath.startsWith(link.to);

                return (
                  <div key={link.to} className="flex items-center">
                    <Link
                      to={link.to}
                      className={cn(
                        "flex-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                        isActive
                          ? "bg-muted text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                      <span className="truncate">{link.label}</span>
                      {(link as any).statusDot && (
                        <span className={cn("ml-auto h-1.5 w-1.5 rounded-full shrink-0", (link as any).statusDot)} />
                      )}
                    </Link>
                    {link.to === "/account/sell" && isSellerApproved && (
                      <a
                        href="/seller"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground transition shrink-0 ml-1"
                        title="Open Dedicated Seller Dashboard"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </nav>

            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-border/40">
                <Link
                  to="/admin"
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Admin Console</span>
                  </span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </Link>
              </div>
            )}
          </aside>

          {/* Main Outlet Area */}
          <main className="min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
