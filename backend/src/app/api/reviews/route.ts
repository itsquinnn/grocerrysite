import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reviews
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();
  const url = new URL(req.url);
  const productId = url.searchParams.get('product_id');
  const userId = url.searchParams.get('user_id') || url.searchParams.get('account_id');
  const forSeller = url.searchParams.get('for_seller') === 'true';
  const sellerId = url.searchParams.get('seller_id');

  // Handle seller reviews lookup
  if (forSeller || sellerId) {
    let resolvedSellerId = sellerId;
    if (!resolvedSellerId) {
      const auth = await requireAuth(req);
      if (auth instanceof Response) return auth;
      resolvedSellerId = auth.userId;
    }

    const { data: sellerProducts } = await supabaseAdmin
      .from('products')
      .select('id, title, slug, image_url')
      .eq('seller_id', resolvedSellerId);

    const productIds = (sellerProducts || []).map((p: any) => p.id);
    if (productIds.length === 0) {
      return ok({ reviews: [], total: 0 });
    }

    const { data: reviews, error } = await supabaseAdmin
      .from('reviews')
      .select('*, accounts(id, name, profile_image), products(id, title, slug, image_url)')
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    if (error) {
      return err('Failed to fetch seller reviews', 500);
    }

    const formatted = (reviews ?? []).map((r: any) => ({
      ...r,
      user_id: r.account_id,
      account_id: r.account_id,
      author_name: r.accounts?.name || 'Verified Customer',
      users: {
        name: r.accounts?.name || 'Verified Customer',
        avatar_url: r.accounts?.profile_image || null,
      },
      product_title: r.products?.title || 'Catalog Product',
      review_text: r.comment || r.review_text || '',
      verified: true,
    }));

    return ok({ reviews: formatted, total: formatted.length });
  }

  if (!productId && !userId) {
    return err('Missing product_id or user_id parameter', 400);
  }

  let query = supabaseAdmin
    .from('reviews')
    .select('*, accounts(id, name, profile_image), products(*)')
    .order('created_at', { ascending: false });

  if (productId) {
    query = query.eq('product_id', productId);
  } else if (userId) {
    query = query.eq('account_id', userId);
  }

  const { data: reviews, error } = await query;

  if (error) {
    return err('Failed to fetch reviews', 500);
  }

  const formatted = (reviews ?? []).map((r: any) => ({
    ...r,
    user_id: r.account_id,
    account_id: r.account_id,
    users: {
      name: r.accounts?.name || 'User',
      avatar_url: r.accounts?.profile_image || null,
    },
    accounts: r.accounts,
  }));

  return ok(formatted);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/reviews
// ─────────────────────────────────────────────────────────────────────────────
const ReviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const parsed = await parseBody(req, ReviewSchema);
  if (parsed instanceof Response) return parsed;
  const { product_id, rating, comment } = parsed.data;

  // Verify product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    return err('Product item not found', 404);
  }

  // Ensure account exists for foreign key constraint
  const { data: existingAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existingAccount) {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email || `user_${userId.slice(0, 8)}@dovan.com`;
    const name =
      authUser?.user?.user_metadata?.full_name ||
      authUser?.user?.user_metadata?.name ||
      email.split('@')[0];
    await supabaseAdmin.from('accounts').upsert(
      {
        id: userId,
        email,
        name,
        role: 'customer',
      },
      { onConflict: 'id' }
    );
  }

  // Insert or update review cleanly (avoids missing ON CONFLICT constraint error 42P10)
  const { data: existingReview } = await supabaseAdmin
    .from('reviews')
    .select('id')
    .eq('account_id', userId)
    .eq('product_id', product_id)
    .maybeSingle();

  let reviewData: any = null;
  let reviewError: any = null;

  if (existingReview) {
    const res = await supabaseAdmin
      .from('reviews')
      .update({
        rating,
        review_text: comment || '',
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingReview.id)
      .select()
      .single();
    reviewData = res.data;
    reviewError = res.error;
  } else {
    const res = await supabaseAdmin
      .from('reviews')
      .insert({
        account_id: userId,
        product_id,
        rating,
        review_text: comment || '',
        is_published: true,
      })
      .select()
      .single();
    reviewData = res.data;
    reviewError = res.error;
  }

  if (reviewError || !reviewData) {
    console.error('[reviews/POST] error:', reviewError);
    return err(reviewError?.message || 'Failed to submit review', 500);
  }

  // Recalculate product rating asynchronously
  try {
    const { data: allProdReviews } = await supabaseAdmin
      .from('reviews')
      .select('rating')
      .eq('product_id', product_id)
      .eq('is_published', true);

    if (allProdReviews && allProdReviews.length > 0) {
      const count = allProdReviews.length;
      const sum = allProdReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      const avg = Math.round((sum / count) * 10) / 10;
      await supabaseAdmin
        .from('products')
        .update({ avg_rating: avg, review_count: count })
        .eq('id', product_id);
    }
  } catch (ratingErr) {
    console.warn('[reviews/POST] rating recalculation warning:', ratingErr);
  }

  return ok({ ...reviewData, user_id: reviewData.account_id, account_id: reviewData.account_id }, 201);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/reviews/[id] (Using query param id for simplicity here)
// ─────────────────────────────────────────────────────────────────────────────
const UpdateReviewSchema = z.object({
  review_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});

export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const parsed = await parseBody(req, UpdateReviewSchema);
  if (parsed instanceof Response) return parsed;
  const { review_id, rating, comment } = parsed.data;

  if (rating === undefined && comment === undefined) {
    return err('Nothing to update', 400);
  }

  // Update only if it belongs to the user
  const updates: any = {};
  if (rating !== undefined) updates.rating = rating;
  if (comment !== undefined) updates.review_text = comment;

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .update(updates)
    .eq('id', review_id)
    .eq('account_id', userId)
    .select()
    .single();

  if (error || !data) {
    return err('Review not found or permission denied', 404);
  }

  return ok({ ...data, user_id: data.account_id, account_id: data.account_id });
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/reviews
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const url = new URL(req.url);
  const review_id = url.searchParams.get('review_id');

  if (!review_id) {
    return err('Missing review_id parameter', 400);
  }

  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', review_id)
    .eq('account_id', userId);

  if (error) {
    console.error('[reviews/DELETE] error:', error);
    return err('Failed to delete review', 500);
  }

  return ok({ message: 'Review deleted' });
}

export async function OPTIONS() {
  return handleOptions();
}
