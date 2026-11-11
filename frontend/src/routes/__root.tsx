import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { ShopProvider } from "@/lib/shop";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/site/Header";
import { Footer, BottomNav } from "@/components/site/Footer";
import { CartDrawer } from "@/components/site/CartDrawer";
import { TopLoader } from "@/components/site/TopLoader";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { allProductsQuery, categoriesQuery } from "@/lib/catalog";

function NotFoundComponent() {
  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold">404</h1>
        <h2 className="mt-4 text-xl">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong on our end. You can try refreshing or head back home.</p>
        {Boolean(error) && (
          <div className="mt-3 p-2.5 text-left bg-destructive/10 border border-destructive/20 rounded-lg text-[11px] font-mono text-destructive break-all max-h-32 overflow-auto">
            {(error as any)?.message || String(error)}
          </div>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Try again</button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm font-medium">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DOVAN : Considered goods, delivered across Nepal" },
      { name: "description", content: "Shop fashion, electronics, home, beauty, sports and accessories at DOVAN. Cash on delivery across Nepal." },
      { property: "og:site_name", content: "DOVAN" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png?v=dovan-3", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon.ico?v=dovan-3", type: "image/x-icon" },
      { rel: "shortcut icon", href: "/favicon.png?v=dovan-3" },
      { rel: "apple-touch-icon", href: "/favicon.png?v=dovan-3" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Manrope:wght@400;500;600;700&display=swap" },
    ],
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(categoriesQuery), context.queryClient.ensureQueryData(allProductsQuery)]),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSellerRoute = location.pathname.startsWith("/seller");
  const isStandaloneDashboard = isAdminRoute || isSellerRoute;

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (isAdminRoute) {
        document.documentElement.classList.add("admin-theme");
        document.body.classList.add("admin-theme");
      } else {
        document.documentElement.classList.remove("admin-theme");
        document.body.classList.remove("admin-theme");
      }
    }
  }, [isAdminRoute]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event === "SIGNED_OUT") queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === "me" });
      else queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "me" });
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <ShopProvider>
          <TopLoader />
          {isStandaloneDashboard ? (
            /* Pure Workspace / Dashboard Layout: zero public website clutter */
            <div className="min-h-screen bg-slate-50/70 dark:bg-background">
              <Outlet />
            </div>
          ) : (
            /* Public Website Mode */
            <>
              <div className="flex min-h-screen flex-col bg-white">
                <Header />
                <main key={location.pathname} className="flex-1 bg-white page-transition">
                  <Outlet />
                </main>
                <Footer />
              </div>
              <BottomNav />
              <CartDrawer />
            </>
          )}
          <Toaster position="top-center" richColors duration={2200} visibleToasts={2} />
        </ShopProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
