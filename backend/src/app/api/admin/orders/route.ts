import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireAdmin } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/orders  — All orders (admin only)
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit  = Math.min(parseInt(url.searchParams.get('limit') ?? '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  let query = supabaseAdmin
    .from('orders')
    .select(`
      id, account_id, subtotal_paise, total_paise, delivery_slot,
      address_snapshot, payment_method, payment_status, status,
      device_location_address, device_latitude, device_longitude,
      destination_address, destination_latitude, destination_longitude,
      location_discrepancy_km, is_fraud_flagged,
      created_at, updated_at,
      accounts:accounts ( id, name, email, phone ),
      order_items ( id, title_snapshot, price_paise_snapshot, quantity, image_url_snapshot )
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status && status !== 'All') query = query.eq('status', status);

  const { data: orders, error } = await query;

  if (error) {
    console.warn('[admin/orders/GET] direct join error, attempting fallback:', error);
    // Fallback query if relationships differ
    const fallback = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fallback.error) {
      console.error('[admin/orders/GET] fallback error:', fallback.error);
      return err('Failed to fetch orders', 500);
    }
    const mappedFallback = (fallback.data ?? []).map((o: any) => ({
      ...o,
      user_id: o.account_id,
      account_id: o.account_id,
    }));
    return ok({ orders: mappedFallback, offset, limit });
  }

  const mappedOrders = (orders ?? []).map((o: any) => ({
    ...o,
    user_id: o.account_id,
    account_id: o.account_id,
    users: o.accounts || o.users || null,
  }));

  return ok({ orders: mappedOrders, offset, limit });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/orders  — Update order status (admin only)
// ─────────────────────────────────────────────────────────────────────────────

const UpdateStatusSchema = z.object({
  order_id: z.string().uuid().optional(),
  id: z.string().uuid().optional(),
  status: z.string().optional(),
  action: z.string().optional(),
  payment_status: z.string().optional(),
  tracking_number: z.string().optional(),
});

function mapToAllowedStatus(raw: string): 'Pending' | 'Processing' | 'Packed' | 'Out for Delivery' | 'Delivered' | 'Cancelled' {
  const s = (raw || '').trim().toLowerCase().replace(/[_-]/g, ' ');
  if (s.includes('deliver') && !s.includes('out')) return 'Delivered';
  if (s.includes('out') || s.includes('way') || s.includes('ship')) return 'Out for Delivery';
  if (s.includes('pack')) return 'Packed';
  if (s.includes('process') || s.includes('confirm')) return 'Processing';
  if (s.includes('cancel') || s.includes('return') || s.includes('refund')) return 'Cancelled';
  return 'Pending';
}

export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const parsed = await parseBody(req, UpdateStatusSchema);
  if (parsed instanceof Response) return parsed;

  const targetId = parsed.data.order_id || parsed.data.id;
  if (!targetId) {
    return err('Missing order_id or id parameter', 400);
  }

  const rawStatus = parsed.data.status || 'Pending';
  const status = mapToAllowedStatus(rawStatus);

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  // If marked Delivered, also mark payment_status as paid for COD orders
  if (status === 'Delivered') {
    updates.payment_status = 'paid';
  } else if (parsed.data.payment_status) {
    updates.payment_status = parsed.data.payment_status.toLowerCase();
  }

  // Restore inventory stock if order is cancelled
  if (status === 'Cancelled') {
    try {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', targetId);

      if (items && items.length > 0) {
        for (const it of items) {
          if (it.product_id && it.quantity) {
            const { data: prod } = await supabaseAdmin
              .from('products')
              .select('stock_quantity')
              .eq('id', it.product_id)
              .maybeSingle();

            if (prod && typeof prod.stock_quantity === 'number') {
              await supabaseAdmin
                .from('products')
                .update({ stock_quantity: prod.stock_quantity + it.quantity })
                .eq('id', it.product_id);
            }
          }
        }
      }
    } catch (stockErr) {
      console.warn('[admin/orders/PATCH] stock restoration notice:', stockErr);
    }
  }

  // Tracking number is stored in address_snapshot JSONB to prevent 'column not found' schema error
  if (parsed.data.tracking_number !== undefined) {
    try {
      const { data: currentOrder } = await supabaseAdmin
        .from('orders')
        .select('address_snapshot')
        .eq('id', targetId)
        .maybeSingle();

      const currentSnapshot =
        currentOrder?.address_snapshot && typeof currentOrder.address_snapshot === 'object'
          ? (currentOrder.address_snapshot as Record<string, any>)
          : {};

      updates.address_snapshot = {
        ...currentSnapshot,
        tracking_number: parsed.data.tracking_number,
      };
    } catch (snapshotErr) {
      console.warn('[admin/orders/PATCH] snapshot tracking merge notice:', snapshotErr);
    }
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update(updates)
    .eq('id', targetId);

  if (error) {
    console.error('[admin/orders/PATCH] error:', error);
    return err(`Failed to update order status: ${error.message}`, 500);
  }

  return ok({ message: `Order status updated to ${status}`, status });
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}

export async function PUT(req: NextRequest) {
  return PATCH(req);
}

export async function OPTIONS() {
  return handleOptions();
}
