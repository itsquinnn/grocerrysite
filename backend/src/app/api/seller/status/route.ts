import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions, requireAuth } from '@/lib/api';

export async function OPTIONS() {
  return handleOptions();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/seller/status — Retrieve current authenticated user's seller status
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const { data: account, error } = await supabaseAdmin
      .from('accounts')
      .select('id, email, name, phone, role, seller_status, store_name, seller_phone, seller_description, seller_approved_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('[seller/status] Error fetching account status:', error);
      return err('Failed to retrieve seller status', 500);
    }

    if (!account) {
      return err('Account not found', 404);
    }

    let applicationDetails: any = null;
    if (account.seller_description) {
      try {
        applicationDetails = JSON.parse(account.seller_description);
      } catch {
        applicationDetails = { notes: account.seller_description };
      }
    }

    const sellerStatus = (account.seller_status as string) || (account.role === 'admin' ? 'approved' : 'none');

    let productsCount = 0;
    if (sellerStatus === 'approved') {
      const { count } = await supabaseAdmin
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', userId);
      productsCount = count || 0;
    }

    return ok({
      seller_status: sellerStatus,
      store_name: account.store_name || null,
      seller_phone: account.seller_phone || account.phone || null,
      seller_description: account.seller_description || null,
      seller_approved_at: account.seller_approved_at || null,
      role: account.role,
      application_details: applicationDetails,
      products_count: productsCount,
    });
  } catch (error: any) {
    console.error('[seller/status] Unexpected error:', error);
    return err(error?.message || 'Server error retrieving seller status', 500);
  }
}

