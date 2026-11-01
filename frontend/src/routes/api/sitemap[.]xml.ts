import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const sb = createClient(url, key, {
          auth: { persistSession: false },
          global: { fetch: (input, init) => { const h = new Headers(init?.headers); if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization"); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } },
        });
        const { data } = await sb.from("products").select("slug").eq("is_active", true);
        const origin = process.env["SITE_URL"] ?? "https://dovan.com.np";
        const urls = ["/", "/shop", "/track", "/support", "/faq", ...(data ?? []).map((p) => `/product/${p.slug}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${origin}${u}</loc></url>`).join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml" } });
      },
    },
  },
});
