import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions, requireAuth } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/products/my-submissions — List current user's submitted products
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  let query = supabaseAdmin
    .from('products')
    .select('*, categories(id, name, image_url)')
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('approval_status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[products/my-submissions] error:', error);
    return err('Failed to fetch product submissions', 500);
  }

  const formatted = (data ?? []).map((p: any) => ({
    ...p,
    qr_payload: JSON.stringify({
      code: p.product_code || p.id,
      id: p.id,
      title: p.title,
      seller_id: p.seller_id,
      pickup_address: p.pickup_address,
      status: p.approval_status,
    }),
  }));

  return ok({
    products: formatted,
    total: formatted.length,
    counts: {
      pending: formatted.filter((p: any) => p.approval_status === 'pending').length,
      scheduled: formatted.filter((p: any) => p.approval_status === 'scheduled_for_pickup').length,
      listed: formatted.filter((p: any) => p.approval_status === 'listed').length,
      rejected: formatted.filter((p: any) => p.approval_status === 'rejected').length,
    },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/products/my-submissions?id=<id> — Seller: remove own product
// STRICT ISOLATION: A seller cannot delete any other seller's product.
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return err('Missing product id', 400);

  // 1. Fetch product to verify ownership
  const { data: existing, error: findError } = await supabaseAdmin
    .from('products')
    .select('id, seller_id, title')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    console.error('[products/my-submissions/DELETE] find error:', findError);
    return err('Database error while locating product', 500);
  }

  if (!existing) {
    return err('Product not found', 404);
  }

  // 2. Strict seller isolation check: Must match authenticated user unless admin
  if (existing.seller_id !== userId) {
    // Check if user is admin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      return err('Access denied: You cannot delete another seller’s product.', 403);
    }
  }

  // 3. Soft-deactivate product
  const { error: updateError } = await supabaseAdmin
    .from('products')
    .update({
      is_active: false,
      approval_status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) {
    console.error('[products/my-submissions/DELETE] update error:', updateError);
    return err('Failed to remove product from catalog', 500);
  }

  return ok({ message: `Product "${existing.title}" removed successfully` });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/products/my-submissions — Seller: update own product (e.g. stock, price)
// STRICT ISOLATION: A seller cannot edit any other seller's product.
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const body = await req.json();
    const { id, stock_quantity, price_paise, original_price_paise, is_active } = body;
    if (!id) return err('Missing product id', 400);

    // Verify ownership
    const { data: existing, error: findError } = await supabaseAdmin
      .from('products')
      .select('id, seller_id')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) return err('Product not found', 404);

    if (existing.seller_id !== userId) {
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        return err('Access denied: You cannot edit another seller’s product.', 403);
      }
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (stock_quantity !== undefined) updates.stock_quantity = Math.max(0, parseInt(stock_quantity, 10));
    if (price_paise !== undefined) updates.price_paise = Math.max(0, parseInt(price_paise, 10));
    if (original_price_paise !== undefined) updates.original_price_paise = original_price_paise;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[products/my-submissions/PATCH] error:', updateError);
      return err('Failed to update product', 500);
    }

    return ok({ product: updated });
  } catch (errCatch) {
    return err('Invalid request body', 400);
  }
}


