import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My account — DOVAN" }, { name: "robots", content: "noindex" }] }),
  component: AccountLayout,
});

function AccountLayout() {
  const { isNepali, t } = useI18n();

  const links = [
    ["/account", isNepali ? "प्रोफाइल" : "Profile"],
    ["/account/orders", isNepali ? "अर्डर तथा कर बिल" : "Orders & invoices"],
    ["/account/addresses", isNepali ? "ठेगानाहरू" : "Addresses"],
    ["/account/support", isNepali ? "सहायता टिकट" : "Support tickets"],
    ["/account/notifications", isNepali ? "सूचनाहरू" : "Notifications"],
    ["/wishlist", t("saved")],
  ] as const;

  return (
    <div className="container-page py-6 md:py-8">
      <h1 className="text-4xl font-display no-print">{t("my_account")}</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[200px_1fr]">
        <nav className="flex gap-2 overflow-x-auto text-sm md:flex-col no-print" aria-label="Account">
          {links.map(([to, label]) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/account" }}
              className="whitespace-nowrap rounded-md px-3 py-2 hover:bg-muted"
              activeProps={{ className: "bg-secondary font-semibold" }}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
