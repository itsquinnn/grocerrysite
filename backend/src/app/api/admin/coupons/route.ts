import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions, requireAdmin } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/coupons — Fetch all coupons (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/coupons] error:', error);
      return err(error.message, 500);
    }

    return ok({ coupons: data ?? [] });
  } catch (e: any) {
    return err(e.message || 'Internal Server Error', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/coupons — Create a new coupon (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const {
      code,
      description,
      discount_type = 'percent',
      value,
      min_order = 0,
      max_discount,
      usage_limit,
      expires_at,
      is_active = true,
    } = body;

    const trimmedCode = (code || '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(trimmedCode)) {
      return err('Coupon code must be 3–30 uppercase alphanumeric characters or dashes', 400);
    }

    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return err('Discount value must be greater than zero', 400);
    }

    if (discount_type === 'percent' && numValue > 99) {
      return err('Percentage discount cannot exceed 99%', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert({
        code: trimmedCode,
        description: description?.trim() || null,
        discount_type,
        value: numValue,
        min_order: Number(min_order) || 0,
        max_discount: max_discount ? Number(max_discount) : null,
        usage_limit: usage_limit ? parseInt(usage_limit, 10) : null,
        expires_at: expires_at ? new Date(expires_at).toISOString() : null,
        is_active: Boolean(is_active),
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/coupons] error:', error);
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return err(`Coupon code '${trimmedCode}' already exists`, 409);
      }
      return err(error.message, 500);
    }

    return ok({ message: 'Coupon created successfully', coupon: data }, 201);
  } catch (e: any) {
    return err(e.message || 'Internal Server Error', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/admin/coupons — Update/Edit an existing coupon (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return err('Coupon ID is required', 400);

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.code !== undefined) {
      const trimmed = updates.code.trim().toUpperCase();
      if (!/^[A-Z0-9_-]{3,30}$/.test(trimmed)) {
        return err('Invalid coupon code format', 400);
      }
      payload.code = trimmed;
    }

    if (updates.description !== undefined) {
      payload.description = updates.description?.trim() || null;
    }

    if (updates.discount_type !== undefined) {
      payload.discount_type = updates.discount_type;
    }

    if (updates.value !== undefined) {
      const val = Number(updates.value);
      if (isNaN(val) || val <= 0) return err('Discount value must be greater than zero', 400);
      if (updates.discount_type === 'percent' && val > 99) return err('Percent cannot exceed 99%', 400);
      payload.value = val;
    }

    if (updates.min_order !== undefined) {
      payload.min_order = Number(updates.min_order) || 0;
    }

    if (updates.max_discount !== undefined) {
      payload.max_discount = updates.max_discount ? Number(updates.max_discount) : null;
    }

    if (updates.usage_limit !== undefined) {
      payload.usage_limit = updates.usage_limit ? parseInt(updates.usage_limit, 10) : null;
    }

    if (updates.expires_at !== undefined) {
      payload.expires_at = updates.expires_at ? new Date(updates.expires_at).toISOString() : null;
    }

    if (updates.is_active !== undefined) {
      payload.is_active = Boolean(updates.is_active);
    }

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/admin/coupons] error:', error);
      if (error.code === '23505' || error.message?.includes('duplicate')) {
        return err('Another coupon with this code already exists', 409);
      }
      return err(error.message, 500);
    }

    return ok({ message: 'Coupon updated successfully', coupon: data });
  } catch (e: any) {
    return err(e.message || 'Internal Server Error', 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/coupons — Delete a coupon (admin only)
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return err('Coupon ID is required', 400);

    const { error } = await supabaseAdmin
      .from('coupons')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/coupons] error:', error);
      return err(error.message, 500);
    }

    return ok({ message: 'Coupon deleted successfully' });
  } catch (e: any) {
    return err(e.message || 'Internal Server Error', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

