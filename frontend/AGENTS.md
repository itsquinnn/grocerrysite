# DOVAN architecture rules

- All money math (prices, coupons, VAT, shipping) lives only in the Postgres functions `quote_order` / `place_order`; the UI never computes order totals. Why: browser totals are untrusted.
- VAT rate is stored in the `settings` table (`vat_rate`) and changed by admins via `set_setting`; product prices are VAT-exclusive. Why: rate must be configurable without a deploy.
- Order placement is a single transactional SQL function with stock locking and an idempotency key. Why: no double orders, no overselling.
- Admin rights come only from `user_roles` + `has_role()`; every admin write is enforced by RLS/RPC, never by hiding UI. Why: client checks are bypassable.
- The first registered user becomes admin; every later signup is a customer. Why: bootstrap without seeds.
- Product and banner images live under `public/assets/` (branding, banners, products, categories); user-uploaded images go to the private `media` storage bucket with signed URLs. Why: one organized asset location.
- Query data is dehydrated via `@tanstack/react-router-ssr-query` (`wrapQueryClient: false`) with providers in `__root.tsx`. Why: SSR/client hydration must match.
- Toast notifications use `sonner`; there is no `use-toast` hook or `src/App.tsx` in this template.
