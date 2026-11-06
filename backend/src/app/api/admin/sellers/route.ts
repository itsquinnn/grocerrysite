import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireAdmin } from '@/lib/api';

const ReviewSellerSchema = z.object({
  account_id: z.string().uuid('Valid account UUID required'),
  action: z.enum(['approve', 'reject', 'suspend']),
  rejection_reason: z.string().optional(),
});

export async function OPTIONS() {
  return handleOptions();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/sellers — List pending applications & verified active sellers
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('id, email, name, phone, role, seller_status, store_name, seller_phone, seller_description, seller_approved_at, created_at, updated_at')
      .or('seller_status.neq.none,role.eq.seller')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[admin/sellers/GET] Query error:', error);
      return err('Failed to retrieve sellers list', 500);
    }

    const allSellers = accounts || [];

    const sellerIds = allSellers.map((a: any) => a.id);
    const productCounts: Record<string, number> = {};

    if (sellerIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from('products')
        .select('id, seller_id')
        .in('seller_id', sellerIds);

      if (products) {
        for (const p of products) {
          if (p.seller_id) {
            productCounts[p.seller_id] = (productCounts[p.seller_id] || 0) + 1;
          }
        }
      }
    }

    const formatted = allSellers.map((s: any) => {
      let appMeta: any = {};
      if (s.seller_description) {
        try {
          appMeta = JSON.parse(s.seller_description);
        } catch {
          appMeta = { notes: s.seller_description };
        }
      }

      return {
        id: s.id,
        user_id: s.id,
        account_id: s.id,
        name: s.name || 'Merchant',
        email: s.email,
        store_name: s.store_name || appMeta.store_name || s.name || 'Merchant Store',
        seller_phone: s.seller_phone || s.phone || appMeta.seller_phone || '',
        pickup_address: appMeta.pickup_address || '',
        business_type: appMeta.business_type || 'Individual Artisan',
        citizenship_number: appMeta.citizenship_number || '',
        pan_number: appMeta.pan_number || '',
        notes: appMeta.notes || '',
        seller_status: s.seller_status || (s.role === 'seller' ? 'approved' : 'none'),
        seller_approved_at: s.seller_approved_at || null,
        rejection_reason: appMeta.rejection_reason || null,
        products_count: productCounts[s.id] || 0,
        applied_at: appMeta.applied_at || s.created_at,
        updated_at: s.updated_at,
      };
    });

    const pending = formatted.filter((s: any) => s.seller_status === 'pending');
    const active = formatted.filter((s: any) => s.seller_status === 'approved' || s.seller_status === 'suspended');
    const rejected = formatted.filter((s: any) => s.seller_status === 'rejected');

    return ok({
      sellers: formatted,
      pending_applications: pending,
      active_sellers: active,
      rejected_applications: rejected,
      counts: {
        total: formatted.length,
        pending: pending.length,
        active: active.length,
        rejected: rejected.length,
      },
    });
  } catch (error: any) {
    console.error('[admin/sellers/GET] Unexpected error:', error);
    return err(error?.message || 'Server error fetching sellers list', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/sellers — Admin approves, rejects, or suspends seller
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, ReviewSellerSchema);
  if (parsed instanceof Response) return parsed;
  const { account_id, action, rejection_reason } = parsed.data;

  try {
    const { data: existing, error: findError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, name, role, seller_status, seller_description')
      .eq('id', account_id)
      .maybeSingle();

    if (findError || !existing) {
      return err('Seller account not found', 404);
    }

    let existingMeta: any = {};
    if (existing.seller_description) {
      try {
        existingMeta = JSON.parse(existing.seller_description);
      } catch {
        existingMeta = { notes: existing.seller_description };
      }
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updated_at: now,
    };

    if (action === 'approve') {
      updatePayload.seller_status = 'approved';
      updatePayload.role = 'seller';
      updatePayload.seller_approved_at = now;
      delete existingMeta.rejection_reason;
      updatePayload.seller_description = JSON.stringify(existingMeta);
    } else if (action === 'reject') {
      updatePayload.seller_status = 'rejected';
      updatePayload.role = 'customer';
      existingMeta.rejection_reason = rejection_reason || 'Verification criteria not met.';
      existingMeta.rejected_at = now;
      updatePayload.seller_description = JSON.stringify(existingMeta);
    } else if (action === 'suspend') {
      updatePayload.seller_status = 'suspended';
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('accounts')
      .update(updatePayload)
      .eq('id', account_id)
      .select('id, email, name, role, seller_status, store_name, seller_approved_at')
      .maybeSingle();

    if (updateError) {
      console.error('[admin/sellers/PATCH] Update error:', updateError);
      return err(updateError.message || `Failed to ${action} seller`, 500);
    }

    return ok({
      message: `Seller account ${action}d successfully.`,
      action,
      account: updated,
    });
  } catch (error: any) {
    console.error('[admin/sellers/PATCH] Unexpected error:', error);
    return err(error?.message || `Server error during seller ${action}`, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/sellers — Revoke seller access & deactivate listed products
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const accountId = url.searchParams.get('account_id') || url.searchParams.get('id');

  if (!accountId) {
    return err('Missing account_id query parameter', 400);
  }

  try {
    const now = new Date().toISOString();

    // 1. Reset seller role and mark status rejected / suspended
    const { data: updated, error: accError } = await supabaseAdmin
      .from('accounts')
      .update({
        seller_status: 'rejected',
        role: 'customer',
        updated_at: now,
      })
      .eq('id', accountId)
      .select('id, email, name, role, seller_status')
      .maybeSingle();

    if (accError) {
      console.error('[admin/sellers/DELETE] Account update error:', accError);
      return err('Failed to revoke seller account privileges', 500);
    }

    // 2. Deactivate all active products posted by this seller for buyer safety
    const { error: prodError } = await supabaseAdmin
      .from('products')
      .update({
        is_active: false,
        approval_status: 'rejected',
        updated_at: now,
      })
      .eq('seller_id', accountId);

    if (prodError) {
      console.warn('[admin/sellers/DELETE] Warning deactivating products:', prodError.message);
    }

    return ok({
      message: 'Seller privileges revoked and listed products deactivated successfully.',
      account: updated,
    });
  } catch (error: any) {
    console.error('[admin/sellers/DELETE] Unexpected error:', error);
    return err(error?.message || 'Server error revoking seller', 500);
  }
}

