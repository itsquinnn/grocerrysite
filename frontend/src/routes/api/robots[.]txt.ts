import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response("User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /admin\nDisallow: /checkout\nDisallow: /cart\n", {
          headers: { "content-type": "text/plain" },
        }),
    },
  },
});
