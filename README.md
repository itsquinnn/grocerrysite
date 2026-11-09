# DOVAN (दोभान) — Nepal's Curated Multi-Vendor Commerce Platform

[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-React%2019-22c55e.svg)](https://tanstack.com/start)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20RLS-3ECF8E.svg)](https://supabase.com/)
[![Next.js Backend](https://img.shields.io/badge/Backend-Next.js%2015-black.svg)](https://nextjs.org/)

**DOVAN** (दोभान) is a high-performance, modern multi-vendor commerce platform engineered specifically for the Nepali market. Built with a full bilingual experience (English ↔ नेपाली), nationwide logistics across all 77 districts, native Nepali Bikram Sambat (BS) calendar scheduling, local payment rails (eSewa, Khalti, Fonepay, COD), and a custom ledger-style administration portal.

---

## 🌟 Key Highlights

### 🇳🇵 Purpose-Built for Nepal
* **Bilingual UI Engine:** Instant runtime switching between English and Nepali (`EN` ↔ `नेपाली`) across catalog items, menus, notifications, and orders.
* **All 77 Districts Logistics:** Tiered district-level shipping calculators, remote hub logistics, and trackable courier delivery statuses.
* **Local Payment Gateways:** Seamless integration with **eSewa**, **Khalti**, **Fonepay QR**, and verified **Cash on Delivery (COD)**.
* **Dual Calendar Scheduling (Bikram Sambat BS & Gregorian AD):** Native Nepali calendar date selection with quick presets (e.g. Month End, Fiscal Year End Chaitra).

### 🛍️ Modern Shopper Experience
* **Dynamic Catalog & Filtering:** Search and filter by parent category, subcategory, price, brand partner, and rating.
* **Side-by-Side Product Comparison:** Interactive spec-by-spec comparison matrix.
* **Persistent Cart & Wishlist:** Real-time cart drawer with Paise-level precision and discount calculation.
* **PDF Tax Invoices:** Auto-generated, downloadable tax receipts formatted with VAT and PAN details (`jspdf` + `jspdf-autotable`).
* **Customer Account & Ticket Desk:** Real-time order tracking, address book management, and responsive support ticket threads.

### ⚡ Professional Admin Workbench (`/admin/*`)
A non-templated, typography-led administrative system designed for high-density operations:
* **Taxonomy & Structure (`/admin/catalog`):** Real-time category and subcategory creation, parent linkages, image attachments, and slug resolution backed by Supabase service APIs.
* **Merchant & Seller Management (`/admin/sellers`):** Vendor verification, KYC document audits, custom commission fee structures, and merchant status control.
* **Seller Inventory Control (`/admin/seller-products` & `/admin/products`):** Approval queues for vendor product submissions, pricing audits, stock management, and featured placements.
* **Bikram Sambat Coupon Desk (`/admin/coupons`):** Create time-boxed or indefinite promotional codes with BS date selection, percentage/flat discounts, and minimum order requirements.
* **Support Ticket Operations (`/admin/tickets`):** Helpdesk triage with priority filters, skeleton loading states, status workflows (*Open*, *In Progress*, *Resolved*), and resolution timestamps.
* **Audited Order Ledger (`/admin/orders`):** Detailed fulfillment tracking, shipping status updates, courier tracking ID assignments, and print-ready invoices.
* **Financial Insights (`/admin/insights`):** Visual metrics on revenue volume, average order value, top performing categories, and payment gateway distribution.

---

## 🏗️ Architecture & Monorepo Structure

```text
dovan/
├── frontend/                     # TanStack Start / React 19 Client & SSR
│   ├── public/                   # Static assets & branded DOVAN icons
│   ├── src/
│   │   ├── components/           # UI library (Shadcn UI, Site Layout, Drawers, Modals)
│   │   ├── integrations/         # Supabase client & real-time hooks
│   │   ├── lib/                  # Catalog queries, i18n dictionaries, BS date helpers
│   │   └── routes/               # File-based routing via TanStack Router
│   │       ├── _authenticated/   # Protected customer & admin routes
│   │       │   ├── admin.catalog.tsx
│   │       │   ├── admin.coupons.tsx
│   │       │   ├── admin.orders.tsx
│   │       │   ├── admin.sellers.tsx
│   │       │   └── admin.tickets.tsx
│   │       ├── __root.tsx        # HTML document shell, head metadata & cache-busted icons
│   │       └── index.tsx         # Storefront landing page
│   └── vite.config.ts            # Vite + Nitro configuration with API reverse proxy
│
└── backend/                      # Next.js 15 API Backend & Service Engine
    └── src/app/api/
        ├── admin/
        │   ├── categories/       # Service-role category creation & management
        │   └── subcategories/    # Service-role subcategory linkage
        ├── auth/                 # OTP generation and session verification
        ├── cart/                 # Server-validated shopping cart APIs
        ├── orders/               # Transactional checkout & inventory reservation
        └── tickets/              # Customer support ticketing pipeline
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm** or **bun**
* **Supabase Project**: With PostgreSQL database and Auth enabled

### 1. Clone the Repository
```bash
git clone https://github.com/ma-nees/Dovan.git
cd dovan
```

### 2. Configure Backend Service
```bash
cd backend
npm install
```
Create a `.env.local` inside `backend/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3002
```
Start the backend server:
```bash
npm run dev
# Running on http://localhost:3002
```

### 3. Configure Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
```
Create a `.env` inside `frontend/`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Start the client dev server:
```bash
npm run dev
# Running on http://localhost:8080 (proxies /api requests to http://localhost:3002)
```

---

## 🛠️ Verification & Production Build

To test production compilation across both environments:

```bash
# Frontend production bundle
cd frontend
npm run build

# Backend production build
cd ../backend
npm run build
```

---

## 🔒 Security & Data Integrity
* **PostgreSQL Row Level Security (RLS):** All direct client queries to Supabase enforce strict user-isolation policies.
* **Service-Role Boundary:** Privileged operations (taxonomy management, admin ticket elevation, merchant verification) are routed through authenticated backend endpoints running under the `SUPABASE_SERVICE_ROLE_KEY`.
* **Zero Third-Party Asset Leakage:** Internalized branding, fonts, and cache-busted static vectors (`favicon.ico?v=dovan-3`, `favicon.png?v=dovan-3`).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.
