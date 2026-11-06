import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        throw redirect({ to: "/login", search: { redirect: location.pathname || "/account" } });
      }
      return { user: data.user };
    } catch (err: any) {
      // Re-throw valid TanStack Router redirects
      if (isRedirect(err)) {
        throw err;
      }
      throw redirect({ to: "/login", search: { redirect: location.pathname || "/account" } });
    }
  },
  component: () => <Outlet />,
});
