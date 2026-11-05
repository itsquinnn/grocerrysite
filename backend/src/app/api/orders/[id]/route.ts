import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions, requireAuth } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/orders/[id] — Cancel an order
// ─────────────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId, accountId } = auth;
  const targetIds = Array.from(new Set([userId, accountId].filter(Boolean)));

  const orderId = params.id;

  // 1. Try DB RPC cancel_order first
  const { data: result, error } = await supabaseAdmin.rpc('cancel_order', {
    p_account_id: targetIds[0] || userId,
    p_order_id: orderId,
  });

  if (!error && result?.success) {
    return ok({ message: 'Order cancelled successfully.' });
  }

  // 2. Fallback: direct ownership & status check if RPC fails or raises error
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from('orders')
    .select('id, account_id, status, order_items(product_id, quantity)')
    .eq('id', orderId)
    .in('account_id', targetIds)
    .maybeSingle();

  if (fetchErr || !order) {
    return err('Order not found', 404);
  }

  if (order.status !== 'Pending') {
    return err(`Cannot cancel an order with status: ${order.status}`, 409);
  }

  const { error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .in('account_id', targetIds);

  if (updateErr) {
    console.error('[cancel_order] Fallback update error:', updateErr);
    return err('Failed to cancel order', 500);
  }

  // Restore stock for each item (best-effort)
  const items = Array.isArray(order.order_items) ? order.order_items : [];
  for (const item of items) {
    if (item.product_id && item.quantity) {
      try {
        const { data: prod } = await supabaseAdmin
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .maybeSingle();
        if (prod && typeof prod.stock_quantity === 'number') {
          await supabaseAdmin
            .from('products')
            .update({ stock_quantity: prod.stock_quantity + item.quantity })
            .eq('id', item.product_id);
        }
      } catch (_) {}
    }
  }

  return ok({ message: 'Order cancelled successfully.' });
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders/[id]  — Single order detail & live tracking info
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId, accountId } = auth;
  const targetIds = Array.from(new Set([userId, accountId].filter(Boolean)));

  const cleanId = (params.id || '').replace(/^DOV-/i, '').toLowerCase();

  let query = supabaseAdmin
    .from('orders')
    .select(`
      id, account_id, subtotal_paise, delivery_fee_paise, platform_fee_paise,
      slot_fee_paise, total_paise, delivery_slot, address_snapshot,
      payment_method, payment_status, status,
      device_location_address, device_latitude, device_longitude,
      destination_address, destination_latitude, destination_longitude,
      created_at, updated_at,
      order_items (
        id, product_id, title_snapshot, price_paise_snapshot,
        image_url_snapshot, unit_snapshot, quantity
      )
    `);

  if (cleanId.length === 36) {
    query = query.eq('id', cleanId);
  } else {
    query = query.ilike('id', `${cleanId}%`);
  }

  // If user is not admin, enforce account ownership
  if (auth.role !== 'admin') {
    query = query.in('account_id', targetIds);
  }

  let { data: order, error } = await query.maybeSingle();

  if (error || !order) {
    // Try fallback select
    let fbQuery = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', cleanId);

    if (auth.role !== 'admin') {
      fbQuery = fbQuery.in('account_id', targetIds);
    }
    const fbRes = await fbQuery.maybeSingle();
    if (fbRes.data) {
      order = fbRes.data;
    } else {
      return err('Order not found', 404);
    }
  }

  if (!order) {
    return err('Order not found', 404);
  }

  const ord = order as any;

  // Look up delivery assignment & partner live GPS if assigned
  let deliveryAssignment: Record<string, any> | null = null;
  let deliveryPartner: Record<string, any> | null = null;

  try {
    const { data: assignment } = await supabaseAdmin
      .from('delivery_assignments')
      .select('*')
      .eq('order_id', ord.id)
      .maybeSingle();

    if (assignment) {
      deliveryAssignment = assignment;
      if (assignment.delivery_partner_id) {
        const { data: partner } = await supabaseAdmin
          .from('delivery_partners')
          .select('id, account_id, full_name, phone, vehicle_type, vehicle_number, avatar_url, rating, current_latitude, current_longitude, status')
          .or(`id.eq.${assignment.delivery_partner_id},account_id.eq.${assignment.delivery_partner_id}`)
          .maybeSingle();

        if (partner) {
          deliveryPartner = partner;
        }
      }
    }
  } catch (_) {}

  // Format line items
  const rawItems = Array.isArray(ord.order_items) ? ord.order_items : (Array.isArray(ord.items) ? ord.items : []);
  const items = rawItems.map((it: any) => ({
    id: it.id || it.product_id,
    product_id: it.product_id || it.id,
    name: it.title_snapshot || it.title || it.name || 'Grocery Item',
    title: it.title_snapshot || it.title || it.name || 'Grocery Item',
    price: it.price_paise_snapshot ? it.price_paise_snapshot / 100 : (it.price ? it.price : 0),
    unit_price: it.price_paise_snapshot ? it.price_paise_snapshot / 100 : (it.price ? it.price : 0),
    quantity: Number(it.quantity) || 1,
    line_total: (it.price_paise_snapshot ? it.price_paise_snapshot / 100 : (it.price ? it.price : 0)) * (Number(it.quantity) || 1),
    image: it.image_url_snapshot || it.image || it.image_url || '/placeholder.svg',
    image_url: it.image_url_snapshot || it.image || it.image_url || '/placeholder.svg',
    unit: it.unit_snapshot || it.unit || '1 unit',
  }));

  const subtotal = ord.subtotal_paise ? ord.subtotal_paise / 100 : (ord.subtotal ? ord.subtotal : 0);
  const shippingFee = ord.delivery_fee_paise ? ord.delivery_fee_paise / 100 : 40;
  const total = ord.total_paise ? ord.total_paise / 100 : (ord.total ? ord.total : subtotal + shippingFee);
  const addr = (ord.address_snapshot || ord.shipping_address || {}) as Record<string, any>;

  const createdTime = new Date(ord.created_at).getTime();
  const events = [
    { status: 'Order Placed', created_at: ord.created_at },
  ];
  if (['Processing', 'Packed', 'Out for Delivery', 'Delivered'].includes(ord.status)) {
    events.push({ status: 'Processing', created_at: new Date(createdTime + 30 * 60 * 1000).toISOString() });
  }
  if (['Packed', 'Out for Delivery', 'Delivered'].includes(ord.status)) {
    events.push({ status: 'Packed', created_at: new Date(createdTime + 60 * 60 * 1000).toISOString() });
  }
  if (['Out for Delivery', 'Delivered'].includes(ord.status)) {
    events.push({ status: 'Out for Delivery', created_at: new Date(createdTime + 90 * 60 * 1000).toISOString() });
  }
  if (ord.status === 'Delivered') {
    events.push({ status: 'Delivered', created_at: ord.updated_at || new Date(createdTime + 180 * 60 * 1000).toISOString() });
  }
  if (ord.status === 'Cancelled') {
    events.push({ status: 'Cancelled', created_at: ord.updated_at || ord.created_at });
  }

  // Fetch return requests if any
  let returnRequests: any[] = [];
  try {
    const { data: retData } = await supabaseAdmin
      .from('return_requests')
      .select('*')
      .eq('order_id', ord.id);
    if (retData) returnRequests = retData;
  } catch (_) {}

  return ok({
    order: {
      ...ord,
      user_id: ord.account_id,
      account_id: ord.account_id,
      order_number: ord.order_number ?? `DOV-${ord.id.slice(0, 8).toUpperCase()}`,
      subtotal,
      shipping_fee: shippingFee,
      tax: 0,
      total,
      status: ord.status || 'Pending',
      payment_method: ord.payment_method || 'Cash on Delivery',
      payment_status: ord.payment_status || 'pending',
      tracking_number: addr.tracking_number || `DOV-TRK-${ord.id.slice(0, 8).toUpperCase()}`,
      order_items: items,
      items,
      order_events: events,
      return_requests: returnRequests,
      shipping_address: addr,
      billing_address: addr,
      delivery_assignment: deliveryAssignment,
      delivery_partner: deliveryPartner,
    },
  });
}

export async function OPTIONS() {
  return handleOptions();
}
