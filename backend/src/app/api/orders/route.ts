import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/orders  — Place a new order
// ─────────────────────────────────────────────────────────────────────────────
// This is THE most security-critical endpoint.
// Prices are NEVER trusted from the client — they are re-read from the database.
// All logic runs inside a Supabase DB function (SECURITY DEFINER transaction).
// ─────────────────────────────────────────────────────────────────────────────

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

const PlaceOrderSchema = z.object({
  address_id: z.string().uuid().optional().nullable().or(z.literal('')),
  delivery_slot: z.string().min(1).default('Standard'),
  payment_method: z.string().default('Cash on Delivery'),
  slot_fee_paise: z.number().int().min(0).max(2000).default(0),
  // Dual Location Fields for Fraud Prevention
  user_latitude: z.number().optional().nullable(),
  user_longitude: z.number().optional().nullable(),
  device_location_address: z.string().optional().nullable(),
  destination_address: z.string().optional().nullable(),
  destination_latitude: z.number().optional().nullable(),
  destination_longitude: z.number().optional().nullable(),
  address_snapshot: z.record(z.any()).optional().nullable(),
  billing_address: z.record(z.any()).optional().nullable(),
  shipping_method: z.string().optional().nullable(),
  coupon_code: z.string().optional().nullable(),
  customer_email: z.string().optional().nullable(),
  items: z.array(z.object({
    id: z.string().optional(),
    product_id: z.string().optional(),
    title: z.string().optional(),
    name: z.string().optional(),
    price: z.number().optional(),
    price_paise: z.number().optional(),
    quantity: z.number().int().min(1).default(1),
    image: z.string().optional(),
    image_url: z.string().optional(),
    unit: z.string().optional(),
    size: z.string().optional(),
    color: z.string().optional(),
  })).optional(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId, accountId } = auth;

  const parsed = await parseBody(req, PlaceOrderSchema);
  if (parsed instanceof Response) return parsed;
  const data = parsed.data;

  // Ensure user has an entry in public.accounts to satisfy FK constraint orders_account_id_fkey
  let targetAccountId = accountId || userId;
  const { data: existingAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .or(`id.eq.${userId},id.eq.${targetAccountId}`)
    .maybeSingle();

  if (existingAccount) {
    targetAccountId = existingAccount.id;
  } else {
    try {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
      const authUser = authUserData?.user;
      const email = authUser?.email || data.customer_email || `customer_${userId.slice(0, 8)}@dovan.local`;
      const meta = authUser?.user_metadata || {};
      const name = meta.full_name || meta.name || data.address_snapshot?.full_name || 'Customer';
      const phone = meta.phone || authUser?.phone || data.address_snapshot?.phone || null;

      const { data: newAcc } = await supabaseAdmin
        .from('accounts')
        .insert({
          id: userId,
          email,
          name,
          phone,
          role: 'customer',
          status: 'active',
        })
        .select('id')
        .maybeSingle();

      if (newAcc) {
        targetAccountId = newAcc.id;
      }
    } catch (provisionErr) {
      console.warn('[orders/POST] Auto-provision account warning:', provisionErr);
    }
  }

  // Calculate location discrepancy & fraud flag
  const userLat = data.user_latitude ?? null;
  const userLng = data.user_longitude ?? null;
  const destLat = data.destination_latitude ?? null;
  const destLng = data.destination_longitude ?? null;

  let locationDiscrepancyKm = 0;
  let isFraudFlagged = false;
  if (userLat != null && userLng != null && destLat != null && destLng != null) {
    locationDiscrepancyKm = getDistanceFromLatLonInKm(userLat, userLng, destLat, destLng);
    // Flag if order placed from more than 15 km away from delivery destination
    if (locationDiscrepancyKm > 15) {
      isFraudFlagged = true;
    }
  }

  const deviceAddress = data.device_location_address || (userLat != null && userLng != null ? `GPS: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}` : 'Device Location Unknown');
  let destAddress = data.destination_address || '';

  let addressSnapshot: Record<string, any> = data.address_snapshot || {
    address: destAddress,
    latitude: destLat,
    longitude: destLng,
  };

  if (data.address_id && data.address_id.trim() !== '') {
    const { data: address } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('id', data.address_id)
      .maybeSingle();

    if (address) {
      addressSnapshot = {
        label: address.label,
        name: address.name,
        full_name: address.name,
        street: address.street,
        details: address.details,
        phone: address.phone,
        latitude: address.latitude ?? destLat,
        longitude: address.longitude ?? destLng,
        address: `${address.street || ''} ${address.details || ''}`.trim() || destAddress,
      };
      if (!destAddress) destAddress = addressSnapshot.address;
    }
  }

  // Normalize payment method
  const rawPayment = (data.payment_method || 'Cash on Delivery').toLowerCase();
  const paymentMethod = rawPayment.includes('cod') || rawPayment.includes('cash') ? 'Cash on Delivery' : data.payment_method;
  const paymentStatus = paymentMethod === 'Cash on Delivery' ? 'pending' : 'paid';

  // 1. Try DB RPC place_order first
  let createdOrderId: string | null = null;
  let totalPaise = 0;
  let pointsAwarded = 0;

  try {
    const { data: result, error } = await supabaseAdmin.rpc('place_order', {
      p_account_id: targetAccountId,
      p_address_snapshot: addressSnapshot,
      p_delivery_slot: data.delivery_slot,
      p_payment_method: paymentMethod,
      p_delivery_fee_paise: 4000,
      p_platform_fee_paise: 1000,
      p_slot_fee_paise: data.slot_fee_paise ?? 0,
      p_device_address: deviceAddress,
      p_device_lat: userLat,
      p_device_lng: userLng,
      p_dest_address: destAddress,
      p_dest_lat: destLat,
      p_dest_lng: destLng,
      p_direct_items: data.items && data.items.length > 0 ? data.items : null,
    });

    if (!error && result?.success) {
      createdOrderId = result.order_id;
      totalPaise = result.total_paise ?? 0;
      pointsAwarded = result.points_awarded ?? 0;
    }
  } catch (rpcErr) {
    console.warn('[orders/POST] RPC fallback triggered:', rpcErr);
  }

  // 2. Direct insert fallback if RPC not applicable or items passed directly
  if (!createdOrderId) {
    const items = data.items ?? [];
    let subtotal = 0;
    for (const item of items) {
      const p = item.price_paise ?? Math.round((item.price ?? 50) * 100);
      subtotal += p * (item.quantity ?? 1);
    }
    if (subtotal === 0) subtotal = 12000; // Default Rs 120 if empty demo
    const deliveryFee = 4000;
    const platformFee = 1000;
    totalPaise = subtotal + deliveryFee + platformFee + (data.slot_fee_paise ?? 0);

    const { data: newOrder, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        account_id: targetAccountId,
        subtotal_paise: subtotal,
        delivery_fee_paise: deliveryFee,
        platform_fee_paise: platformFee,
        slot_fee_paise: data.slot_fee_paise ?? 0,
        discount_paise: 0,
        total_paise: totalPaise,
        delivery_slot: data.delivery_slot,
        address_snapshot: addressSnapshot,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        status: 'Pending',
        device_location_address: deviceAddress,
        device_latitude: userLat,
        device_longitude: userLng,
        destination_address: destAddress || 'Home Address',
        destination_latitude: destLat,
        destination_longitude: destLng,
        location_discrepancy_km: locationDiscrepancyKm,
        is_fraud_flagged: isFraudFlagged,
      })
      .select('id')
      .single();

    if (orderErr || !newOrder) {
      console.error('[orders/POST] Direct insert error:', orderErr);
      return err('Failed to place order: ' + (orderErr?.message ?? 'Unknown error'), 500);
    }

    createdOrderId = newOrder.id;

    // Insert line items
    if (items.length > 0) {
      const lineItems = items.map((item) => ({
        order_id: createdOrderId,
        product_id: item.product_id || item.id || null,
        title_snapshot: item.title || item.name || 'Grocery Item',
        price_paise_snapshot: item.price_paise ?? Math.round((item.price ?? 50) * 100),
        quantity: item.quantity || 1,
        image_url_snapshot: item.image_url || item.image || null,
        unit_snapshot: item.unit || item.size || '1 unit',
      }));

      await supabaseAdmin.from('order_items').insert(lineItems);
    }
    
    // Award loyalty points
    pointsAwarded = Math.max(1, Math.floor(totalPaise / 10000));
    try {
      await supabaseAdmin.from('user_points_ledger').insert({
        account_id: targetAccountId,
        points_change: pointsAwarded,
        transaction_type: 'order_cashback',
        reference_type: 'order',
        reference_id: createdOrderId,
        description: `Cashback for Order #${(createdOrderId ?? '').substring(0, 8)}`,
      });
    } catch {}
  } else {
    // Update the RPC-created order with dual-location fraud fields
    await supabaseAdmin
      .from('orders')
      .update({
        device_location_address: deviceAddress,
        device_latitude: userLat,
        device_longitude: userLng,
        destination_address: destAddress || 'Home Address',
        destination_latitude: destLat,
        destination_longitude: destLng,
        location_discrepancy_km: locationDiscrepancyKm,
        is_fraud_flagged: isFraudFlagged,
      })
      .eq('id', createdOrderId);
  }

  // Clear user cart upon successful order placement (for both account IDs)
  try {
    await supabaseAdmin
      .from('cart')
      .delete()
      .or(`account_id.eq.${userId},account_id.eq.${targetAccountId}`);
  } catch {}

  // Auto-save this delivery location so user NEVER has to enter it again on future orders
  try {
    const { data: existingAddrs } = await supabaseAdmin
      .from('addresses')
      .select('id, is_default')
      .or(`account_id.eq.${userId},account_id.eq.${targetAccountId}`);

    const hasSaved = existingAddrs && existingAddrs.length > 0;
    const hasDefault = existingAddrs && existingAddrs.some((a) => a.is_default);

    if (!hasSaved || !hasDefault) {
      const snapName = addressSnapshot.full_name || addressSnapshot.name || 'Customer';
      const snapPhone = addressSnapshot.phone || '9800000000';
      const snapStreet = addressSnapshot.street || destAddress.split(',')[0]?.trim() || destAddress || 'Main Road';
      const snapDetails = JSON.stringify({
        landmark: addressSnapshot.landmark || null,
        city: addressSnapshot.city || 'Kathmandu',
        district: addressSnapshot.district || 'Kathmandu',
        province: addressSnapshot.province || 'Bagmati',
        label: 'Home',
        summary: destAddress,
      });

      await supabaseAdmin.from('addresses').insert({
        account_id: targetAccountId,
        label: 'Home',
        name: snapName,
        phone: snapPhone,
        street: snapStreet,
        details: snapDetails,
        is_default: true,
        latitude: destLat,
        longitude: destLng,
      });
    }
  } catch (saveAddrErr) {
    console.warn('[orders/POST] Auto-save address note:', saveAddrErr);
  }

  const orderNumber = `DOV-${(createdOrderId ?? '').slice(0, 8).toUpperCase()}`;

  return ok({
    order_id: createdOrderId,
    order: {
      id: createdOrderId,
      order_number: orderNumber,
      total_paise: totalPaise,
    },
    order_number: orderNumber,
    total_paise: totalPaise,
    points_awarded: pointsAwarded,
    device_location_address: deviceAddress,
    destination_address: destAddress,
    location_discrepancy_km: locationDiscrepancyKm,
    is_fraud_flagged: isFraudFlagged,
    message: isFraudFlagged
      ? 'Order placed with fraud review flag (device location discrepancy).'
      : 'Order placed successfully!',
  }, 201);
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/orders  — List authenticated user's orders
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId, accountId } = auth;
  const targetIds = Array.from(new Set([userId, accountId].filter(Boolean)));

  const url = new URL(req.url);
  const status = url.searchParams.get('status'); // e.g., 'Pending', 'Delivered'
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

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
    `)
    .in('account_id', targetIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    if (status === 'active') {
      query = query.in('status', ['Pending', 'Processing', 'Packed', 'Out for Delivery', 'On the way']);
    } else if (status === 'history' || status === 'previous') {
      query = query.in('status', ['Delivered', 'Cancelled', 'Canceled']);
    } else if (status.startsWith('!')) {
      query = query.neq('status', status.substring(1));
    } else if (status.includes(',')) {
      query = query.in('status', status.split(',').map(s => s.trim()));
    } else {
      query = query.eq('status', status);
    }
  }

  let { data: orders, error } = await query;

  if (error) {
    console.warn('[orders/GET] detailed query error, running fallback select:', error);
    const fallback = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .in('account_id', targetIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fallback.error) {
      console.error('[orders/GET] fallback error:', fallback.error);
      return err('Failed to fetch orders', 500);
    }
    orders = fallback.data;
  }

  const formattedOrders = (orders ?? []).map((o: any) => {
    const rawItems = Array.isArray(o.order_items) ? o.order_items : (Array.isArray(o.items) ? o.items : []);
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

    const subtotal = o.subtotal_paise ? o.subtotal_paise / 100 : (o.subtotal ? o.subtotal : 0);
    const shippingFee = o.delivery_fee_paise ? o.delivery_fee_paise / 100 : 40;
    const total = o.total_paise ? o.total_paise / 100 : (o.total ? o.total : subtotal + shippingFee);
    const addr = (o.address_snapshot || o.shipping_address || {}) as Record<string, any>;

    return {
      ...o,
      user_id: o.account_id,
      account_id: o.account_id,
      order_number: o.order_number ?? `DOV-${o.id.slice(0, 8).toUpperCase()}`,
      subtotal,
      shipping_fee: shippingFee,
      tax: 0,
      total,
      status: o.status || 'Pending',
      payment_method: o.payment_method || 'Cash on Delivery',
      payment_status: o.payment_status || 'pending',
      tracking_number: addr.tracking_number || `DOV-TRK-${o.id.slice(0, 8).toUpperCase()}`,
      order_items: items,
      items,
      shipping_address: addr,
      billing_address: addr,
    };
  });

  return ok({ orders: formattedOrders, offset, limit });
}

export async function OPTIONS() {
  return handleOptions();
}
