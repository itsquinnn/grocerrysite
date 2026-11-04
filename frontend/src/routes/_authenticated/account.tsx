import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { cn } from "@/lib/utils";
import {
  User,
  Package,
  MapPin,
  LifeBuoy,
  Bell,
  Heart,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { isNepali, t } = useI18n();
  const { isAdmin } = useShop();
  const location = useLocation();
  const navigate = useNavigate();

  const links = useMemo(
    () => [
      {
        to: "/account",
        label: isNepali ? "प्रोफाइल" : "Profile",
        icon: User,
        exact: true,
      },
      {
        to: "/account/orders",
        label: isNepali ? "अर्डर तथा कर बिल" : "Orders & invoices",
        icon: Package,
      },
      {
        to: "/account/addresses",
        label: isNepali ? "ठेगानाहरू" : "Addresses",
        icon: MapPin,
      },
      {
        to: "/account/support",
        label: isNepali ? "सहायता टिकट" : "Support tickets",
        icon: LifeBuoy,
      },
      {
        to: "/account/notifications",
        label: isNepali ? "सूचनाहरू" : "Notifications",
        icon: Bell,
      },
      {
        to: "/wishlist",
        label: t("saved"),
        icon: Heart,
      },
    ],
    [isNepali, t],
  );

  const currentPath = location.pathname;
  const activeLink = useMemo(() => {
    if (currentPath === "/account") {
      return links.find((l) => l.to === "/account");
    }
    return links.find((l) => l.to !== "/account" && currentPath.startsWith(l.to)) || links[0];
  }, [currentPath, links]);

  return (
    <div className="container-page py-6 md:py-8">
      {/* ── Administrator Notice Banner (Dedicated & Distinct) ────────── */}
      {isAdmin && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">Administrator Account</p>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                  Staff
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You are signed in with administrative access.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition"
          >
            <span>Open Admin Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <h1 className="text-3xl sm:text-4xl font-display no-print tracking-tight">{t("my_account")}</h1>

      <div className="mt-6 md:mt-8 grid gap-6 md:gap-8 md:grid-cols-[220px_1fr] items-start">
        {/* ── Mobile Navigation Controls (md:hidden) ────────────────────── */}
        <div className="md:hidden space-y-3 no-print">
          {/* Quick Dropdown Selector: zero scrollbars, zero clipping, 1-tap jump */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              {isNepali ? "खाता सेक्सन चयन गर्नुहोस्" : "Jump to Section"}
            </label>
            <Select
              value={activeLink?.to || "/account"}
              onValueChange={(val) => {
                navigate({ to: val });
              }}
            >
              <SelectTrigger className="w-full h-11 bg-card border shadow-2xs font-medium">
                <div className="flex items-center gap-2.5 truncate">
                  {activeLink && <activeLink.icon className="h-4 w-4 text-primary shrink-0" />}
                  <span className="text-sm font-semibold truncate">{activeLink?.label}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <SelectItem key={link.to} value={link.to} className="cursor-pointer py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-sm">{link.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Touch-Friendly Horizontal Pill Bar (Hidden native scrollbar, smooth scroll) */}
          <nav
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs"
            aria-label="Account Tabs"
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
                  to={link.to}
                  className={cn(
                    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 font-medium transition shadow-2xs shrink-0",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "bg-card border text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Desktop Left Sidebar (hidden md:flex) ──────────────────────── */}
        <aside className="hidden md:flex flex-col gap-1 rounded-xl border bg-card p-3 shadow-2xs sticky top-20 no-print">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {isNepali ? "खाता मेनु" : "Account Navigation"}
          </div>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.to === "/account"
                ? currentPath === "/account"
                : currentPath.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-foreground/80 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}

          {/* Admin shortcut at bottom of desktop sidebar for staff */}
          {isAdmin && (
            <div className="mt-3 pt-3 border-t">
              <Link
                to="/admin"
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Admin Console</span>
                </span>
                <ExternalLink className="h-3 w-3 opacity-60" />
              </Link>
            </div>
          )}
        </aside>

        {/* ── Main Content Area ─────────────────────────────────────────── */}
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
