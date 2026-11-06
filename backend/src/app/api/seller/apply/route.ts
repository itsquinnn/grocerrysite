import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';

const ApplySchema = z.object({
  store_name: z.string().trim().min(2, 'Store name must be at least 2 characters'),
  seller_phone: z.string().trim().min(7, 'Valid contact phone number is required'),
  pickup_address: z.string().trim().min(3, 'Pickup address is required'),
  business_type: z.string().optional(),
  citizenship_number: z.string().trim().min(3, 'Citizenship Card Number (नागरिकता नं.) is required for verification'),
  pan_number: z.string().trim().min(3, 'PAN Number (स्थायी लेखा नं.) is required for seller verification'),
  seller_description: z.string().optional(),
});

export async function OPTIONS() {
  return handleOptions();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/seller/apply — Customer submits application to become a seller
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const parsed = await parseBody(req, ApplySchema);
  if (parsed instanceof Response) return parsed;
  const data = parsed.data;

  try {
    const { data: account, error: accError } = await supabaseAdmin
      .from('accounts')
      .select('id, email, name, role, seller_status')
      .eq('id', userId)
      .maybeSingle();

    if (accError) {
      console.error('[seller/apply] Account query error:', accError);
      return err('Failed to verify user account', 500);
    }

    if (!account) {
      return err('Account not found', 404);
    }

    const descriptionPayload = JSON.stringify({
      business_type: data.business_type || 'Individual Artisan / Craftsperson',
      citizenship_number: data.citizenship_number || '',
      pan_number: data.pan_number || '',
      pickup_address: data.pickup_address,
      notes: data.seller_description || '',
      applied_at: new Date().toISOString(),
    });

    const updatePayload: Record<string, any> = {
      seller_status: 'pending',
      store_name: data.store_name,
      seller_phone: data.seller_phone,
      seller_description: descriptionPayload,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedAccount, error: updateError } = await supabaseAdmin
      .from('accounts')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, email, name, role, seller_status, store_name, seller_phone, updated_at')
      .maybeSingle();

    if (updateError) {
      console.error('[seller/apply] Update error:', updateError);
      return err(updateError.message || 'Failed to submit seller application', 500);
    }

    return ok({
      message: 'Seller application submitted successfully and is under review.',
      seller_status: 'pending',
      application: {
        account_id: userId,
        store_name: data.store_name,
        seller_phone: data.seller_phone,
        pickup_address: data.pickup_address,
        status: 'pending',
        applied_at: new Date().toISOString(),
      },
      account: updatedAccount,
    });
  } catch (error: any) {
    console.error('[seller/apply] Unexpected error:', error);
    return err(error?.message || 'Server error processing seller application', 500);
  }
}

