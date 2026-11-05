import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/seller")({
  beforeLoad: () => {
    throw redirect({ to: "/account/sell" });
  },
  component: () => null,
});
