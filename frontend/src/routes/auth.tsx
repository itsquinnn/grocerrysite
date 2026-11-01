import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => z.object({ redirect: z.string().optional() }).parse(s),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/login",
      search: { redirect: search.redirect || undefined },
    });
  },
  component: () => null,
});
