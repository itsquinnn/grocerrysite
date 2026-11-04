import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions } from '@/lib/api';

export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const url = new URL(req.url);
  const rawNum = url.searchParams.get('order_number') || '';
  const phone = (url.searchParams.get('phone') || '').trim();

  const cleanNum = rawNum.trim().replace(/^DOV-/i, '').toLowerCase();

  if (!cleanNum) {
    return err('Order number is required', 400);
  }

  if (!phone) {
    return err('Recipient phone number is required to track this order', 400);
  }

  // Find order by ID prefix or exact match
  let query = supabaseAdmin
    .from('orders')
    .select(`
      id, account_id, status, subtotal_paise, total_paise,
      delivery_slot, address_snapshot, created_at, updated_at,
      order_items (
        id, product_id, title_snapshot, price_paise_snapshot,
        quantity, unit_snapshot, image_url_snapshot
      )
    `);

  if (cleanNum.length === 36) {
    query = query.eq('id', cleanNum);
  } else {
    // 8-character prefix match
    query = query.ilike('id', `${cleanNum}%`);
  }

  const { data: orders, error } = await query.limit(1);

  if (error || !orders || orders.length === 0) {
    return err('Order not found', 404);
  }

  const order = orders[0];
  const addr = (order.address_snapshot as any) || {};

  // If phone was provided, verify it matches
  if (phone) {
    const orderPhone = (addr.phone || '').replace(/\D/g, '');
    const inputPhone = phone.replace(/\D/g, '');
    if (orderPhone && inputPhone && !orderPhone.endsWith(inputPhone) && !inputPhone.endsWith(orderPhone)) {
      return err('Order details do not match the provided phone number', 403);
    }
  }

  const items = Array.isArray(order.order_items)
    ? order.order_items.map((i: any) => ({
        name: i.title_snapshot || 'Item',
        quantity: i.quantity || 1,
        image: i.image_url_snapshot || '/placeholder.svg',
      }))
    : [];

  const createdTime = new Date(order.created_at).getTime();
  const estimatedDate = new Date(createdTime + 4 * 3600 * 1000).toISOString();

  const events = [
    { status: 'Order Placed', created_at: order.created_at },
  ];

  if (['Processing', 'Out for Delivery', 'Delivered'].includes(order.status)) {
    events.push({ status: 'Processing', created_at: new Date(createdTime + 30 * 60 * 1000).toISOString() });
  }
  if (['Out for Delivery', 'Delivered'].includes(order.status)) {
    events.push({ status: 'Out for Delivery', created_at: new Date(createdTime + 90 * 60 * 1000).toISOString() });
  }
  if (order.status === 'Delivered') {
    events.push({ status: 'Delivered', created_at: order.updated_at || new Date(createdTime + 180 * 60 * 1000).toISOString() });
  }
  if (order.status === 'Cancelled') {
    events.push({ status: 'Cancelled', created_at: order.updated_at || order.created_at });
  }

  return ok({
    order_number: `DOV-${order.id.slice(0, 8).toUpperCase()}`,
    status: order.status || 'Pending',
    created_at: order.created_at,
    estimated_delivery: estimatedDate,
    tracking_number: addr.tracking_number || `DOV-TRK-${order.id.slice(0, 8).toUpperCase()}`,
    city: addr.city || 'Kathmandu',
    district: addr.district || 'Kathmandu',
    items,
    events,
  });
}

export async function OPTIONS() {
  return handleOptions();
}

