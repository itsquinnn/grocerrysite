import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, handleOptions, requireAdmin } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/dashboard — Unified High-Speed Aggregator for Admin Dashboard
// Runs all data queries in parallel on the server with elevated service role
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  try {
    const startTime = Date.now();

    // Execute all 5 queries simultaneously in parallel on the server
    const [ordersRes, productsRes, accountsCountRes, ticketsRes, reviewsRes] = await Promise.all([
      // 1. Recent Orders with line items
      supabaseAdmin
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(50),

      // 2. Products inventory & stock
      supabaseAdmin
        .from('products')
        .select('id, title, stock_quantity, price_paise, product_code, is_active')
        .limit(100),

      // 3. Total registered accounts count
      supabaseAdmin
        .from('accounts')
        .select('id', { count: 'exact', head: true }),

      // 4. Support Tickets (limit 20)
      supabaseAdmin
        .from('ticket')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20),

      // 5. Customer Reviews (limit 20)
      supabaseAdmin
        .from('reviews')
        .select('*, products(title)')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    // Format orders
    const rawOrders = ordersRes.data ?? [];
    const orders = rawOrders.map((ord: any) => ({
      ...ord,
      order_number: ord.order_number ?? `DOV-${ord.id.slice(0, 8).toUpperCase()}`,
      customer_name:
        ord.customer_name ??
        (ord.address_snapshot as any)?.full_name ??
        (ord.address_snapshot as any)?.name ??
        'Customer',
      customer_phone: ord.customer_phone ?? (ord.address_snapshot as any)?.phone ?? '',
      customer_email: ord.customer_email ?? '',
      destination:
        ord.destination_address ??
        (ord.address_snapshot as any)?.address ??
        'Kathmandu Valley',
      total: ord.total ?? (ord.total_paise ? ord.total_paise / 100 : 0),
      status: (ord.status ?? 'pending').toLowerCase(),
      payment_method: ord.payment_method ?? 'Cash on Delivery',
      payment_status: (ord.payment_status ?? 'pending').toLowerCase(),
      created_at: ord.created_at ?? new Date().toISOString(),
    }));

    // Format products
    const products = (productsRes.data ?? []).map((prd: any) => ({
      id: prd.id,
      name: prd.title ?? 'Product',
      stock: prd.stock_quantity ?? 0,
      slug: prd.product_code ?? prd.id,
    }));

    // Customer count
    const customerCount = accountsCountRes.count ?? accountsCountRes.data?.length ?? 0;

    // Format tickets
    const tickets = (ticketsRes.data ?? []).map((t: any) => {
      const isCallback =
        t.message?.toLowerCase().includes('callback') || t.subject?.toLowerCase().includes('callback');
      const phoneMatch = t.message?.match(/(\+?\d[\d -]{7,15}\d)/)?.[0];
      return {
        id: t.id,
        ticket_number: (t.ticket_number || t.id.slice(0, 8)).toUpperCase(),
        subject: t.subject || 'Customer Support Request',
        message: t.message || '',
        status: t.status || 'Open',
        customer_name:
          t.customer_name ||
          (isCallback ? 'Callback Request' : t.account_id ? 'Customer' : 'Guest Visitor'),
        customer_phone: t.customer_phone || (isCallback && phoneMatch ? phoneMatch : t.phone || ''),
        customer_email: t.customer_email || t.email || '',
        created_at: t.created_at || new Date().toISOString(),
      };
    });

    // Format reviews
    const reviews = (reviewsRes.data ?? []).map((r: any) => ({
      id: r.id,
      product_name: r.products?.title ?? r.products?.name ?? 'Grocery Item',
      author_name: r.author_name ?? 'Verified Buyer',
      rating: Number(r.rating) || 5,
      review_text: r.review_text ?? r.comment ?? r.body ?? 'No review text provided.',
      is_published: r.is_published ?? r.is_approved ?? true,
      created_at: r.created_at ?? new Date().toISOString(),
    }));

    const responseTimeMs = Date.now() - startTime;

    return ok({
      orders,
      products,
      customers: customerCount,
      tickets,
      reviews,
      _meta: {
        responseTimeMs,
        ordersCount: orders.length,
        productsCount: products.length,
      },
    });
  } catch (e: any) {
    console.error('[GET /api/admin/dashboard] error:', e);
    return err(e.message || 'Internal Server Error', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
