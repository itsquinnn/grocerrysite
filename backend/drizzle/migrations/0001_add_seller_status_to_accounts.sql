-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: 0001_add_seller_status_to_accounts.sql
-- Chunk 1: Database Migration (Accounts & Seller Status)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add seller tracking columns to accounts if not already present
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS seller_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS seller_phone text,
  ADD COLUMN IF NOT EXISTS seller_description text,
  ADD COLUMN IF NOT EXISTS seller_approved_at timestamptz;

-- 2. Drop existing seller_status check constraint if exists, then add valid check
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_seller_status_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_seller_status_check
  CHECK (seller_status IN ('none', 'pending', 'approved', 'rejected', 'suspended'));

-- 3. Update accounts role check constraint to support 'seller' role
ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_role_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_role_check
  CHECK (role IN ('customer', 'seller', 'admin', 'delivery_man'));

-- 4. Create performance index for seller status queries
CREATE INDEX IF NOT EXISTS idx_accounts_seller_status
  ON public.accounts (seller_status);

-- 5. Grant permissions for service_role and authenticated users
GRANT SELECT, UPDATE(seller_status, store_name, seller_phone, seller_description)
  ON public.accounts TO authenticated, service_role;

-- 6. Ensure products table has seller support columns
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_id uuid REFERENCES public.accounts (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_code text,
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'listed',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS pickup_address text,
  ADD COLUMN IF NOT EXISTS pickup_phone text,
  ADD COLUMN IF NOT EXISTS pickup_time text;

CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_approval ON public.products (approval_status);


