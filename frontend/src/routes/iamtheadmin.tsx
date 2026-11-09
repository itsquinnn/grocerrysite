import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/iamtheadmin")({
  beforeLoad: () => {
    throw redirect({
      to: "/admin",
    });
  },
  component: () => null,
});

