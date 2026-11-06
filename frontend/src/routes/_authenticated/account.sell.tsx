import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account/sell")({
  beforeLoad: () => {
    throw redirect({ to: "/seller" });
  },
  component: () => null,
});
