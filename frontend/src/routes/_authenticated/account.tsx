import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account: DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { user, isAdmin, wishlist, signOut } = useShop();
  const qc = useQueryClient();
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
      await qc.cancelQueries();
      await signOut();
      await navigate({ to: "/login", replace: true });
      toast.success("Signed out successfully");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <div className="container-page py-6 sm:py-8 md:py-10">
      <div className="w-full space-y-6 sm:space-y-8">
        {/* ── Editorial Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-5 border-b border-border gap-3">
          <div>
            <div className="text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-widest text-muted-foreground">
              Account Ledger
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-display font-medium tracking-tight text-foreground">
              Account & Settings
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Manage personal details, order records, addresses, and security credentials.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-tight text-muted-foreground hover:text-destructive transition-colors cursor-pointer self-start sm:self-auto pb-0.5 border-b border-transparent hover:border-destructive/40"
            title="Sign out of DOVAN"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>

        {/* ── Mobile Navigation: Crisp Minimalist Strip ────────────────── */}
        <div className="md:hidden border-b border-border pb-1">
          <nav
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x"
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
                    "inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors shrink-0 select-none border-b-2 -mb-1",
                    isActive
                      ? "border-foreground text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
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
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-xs font-medium text-foreground hover:text-foreground/80 transition-colors shrink-0 ml-auto border-b-2 border-transparent -mb-1"
                title="Go to Admin Console"
              >
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-foreground" />
                <span>Admin</span>
              </Link>
            )}
          </nav>
        </div>

        {/* ── Main Layout: Architectural Sidebar + Content Canvas ───────── */}
        <div className="grid gap-8 md:gap-12 md:grid-cols-[200px_1fr] items-start">
          {/* Desktop Left Navigation */}
          <aside className="hidden md:flex flex-col gap-1 sticky top-24 no-print">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-foreground mb-2 px-3">
              Navigation
            </div>
            <nav className="space-y-0.5 border-l border-border">
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
                        "flex-1 flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors border-l-2 -ml-px",
                        isActive
                          ? "border-foreground text-foreground font-semibold bg-muted/60"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/40",
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")} />
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
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-1"
                        title="Open Dedicated Seller Dashboard"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </nav>

            {isAdmin && (
              <div className="mt-6 pt-4 border-t border-border">
                <Link
                  to="/admin"
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors border border-border"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Admin Console</span>
                  </span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
