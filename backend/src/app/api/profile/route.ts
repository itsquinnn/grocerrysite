import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';
import { supabaseAdmin } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/profile
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  let { data: account } = await supabaseAdmin
    .from('accounts')
    .select('id, email, username, name, phone, gender, profile_image, role, referral_code, created_at')
    .eq('id', userId)
    .maybeSingle();

  // Fetch Supabase Auth user record to get registration metadata (full_name, phone, etc.)
  const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(userId);
  const meta = authUserData?.user?.user_metadata || {};
  const authEmail = authUserData?.user?.email || '';
  const authName = meta.full_name || meta.name || '';
  const authPhone = meta.phone || authUserData?.user?.phone || '';

  if (!account && authEmail) {
    const { data: accByEmail } = await supabaseAdmin
      .from('accounts')
      .select('id, email, username, name, phone, gender, profile_image, role, referral_code, created_at')
      .eq('email', authEmail)
      .maybeSingle();
    if (accByEmail) account = accByEmail;
  }

  if (!account) {
    // If account row does not exist yet (e.g. OAuth or direct signup), auto-provision it
    const baseUsername = (authName || authEmail.split('@')[0] || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 20);
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeSuffix = '';
    for (let i = 0; i < 4; i++) {
      codeSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referralCode = `AERO${codeSuffix}`;

    const { data: newAcc } = await supabaseAdmin
      .from('accounts')
      .insert({
        id: userId,
        email: authEmail,
        username: `${baseUsername || 'user'}_${Math.floor(1000 + Math.random() * 9000)}`,
        name: authName || null,
        phone: authPhone || null,
        role: 'customer',
        status: 'active',
        referral_code: referralCode,
      })
      .select('id, email, username, name, phone, gender, profile_image, role, referral_code, created_at')
      .maybeSingle();

    if (newAcc) {
      account = newAcc;
    }
  } else {
    // Account exists: If name or phone is missing in accounts table but was captured during registration, sync it!
    const backfill: Record<string, any> = {};
    if (!account.name && authName) backfill.name = authName;
    if (!account.phone && authPhone) backfill.phone = authPhone;
    if (Object.keys(backfill).length > 0) {
      await supabaseAdmin.from('accounts').update(backfill).eq('id', account.id);
      account = { ...account, ...backfill };
    }
  }

  const resolvedName = account?.name || authName || '';
  const resolvedPhone = account?.phone || authPhone || '';
  const resolvedEmail = account?.email || authEmail || '';

  return ok({
    id: account?.id ?? userId,
    user_id: account?.id ?? userId,
    account_id: account?.id ?? userId,
    email: resolvedEmail,
    username: account?.username ?? '',
    name: resolvedName,
    full_name: resolvedName,
    phone: resolvedPhone,
    gender: account?.gender ?? '',
    profile_image: account?.profile_image ?? '',
    role: account?.role ?? 'customer',
    referral_code: account?.referral_code ?? '',
    created_at: account?.created_at,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/profile
// ─────────────────────────────────────────────────────────────────────────────
const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').trim().optional(),
  phone: z.string().max(25).trim().nullable().optional(),
  gender: z.string().max(30).trim().nullable().optional(),
  profile_image: z.string().url().trim().nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId, accountId } = auth;

  const parsed = await parseBody(req, UpdateProfileSchema);
  if (parsed instanceof Response) return parsed;
  
  const { name, username, phone, gender, profile_image } = parsed.data;

  if (name === undefined && username === undefined && phone === undefined && gender === undefined && profile_image === undefined) {
    return err('No valid fields provided for update', 400);
  }

  // If updating username, ensure unique across accounts
  if (username !== undefined) {
    const { data: existingUsername } = await supabaseAdmin
      .from('accounts')
      .select('id')
      .eq('username', username.toLowerCase())
      .neq('id', accountId)
      .maybeSingle();

    if (existingUsername) {
      return err('This username is already taken. Please choose another.', 409);
    }
  }

  const accountUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) accountUpdates.name = name;
  if (username !== undefined) accountUpdates.username = username.toLowerCase();
  if (phone !== undefined) accountUpdates.phone = phone;
  if (gender !== undefined) accountUpdates.gender = gender;
  if (profile_image !== undefined) accountUpdates.profile_image = profile_image;

  // Single atomic update directly on the resolved account
  const { data: updatedAccount, error: updateError } = await supabaseAdmin
    .from('accounts')
    .update(accountUpdates)
    .eq('id', accountId)
    .select('*')
    .single();

  if (updateError || !updatedAccount) {
    return err(updateError?.message || 'Failed to update profile', 500);
  }

  // Also sync full_name & phone into Supabase Auth user metadata
  if (name !== undefined || phone !== undefined) {
    try {
      const metaUpdates: Record<string, any> = {};
      if (name !== undefined) metaUpdates.full_name = name;
      if (phone !== undefined) metaUpdates.phone = phone;
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metaUpdates,
      });
    } catch (e) {
      console.warn('Failed to sync auth user metadata:', e);
    }
  }

  return ok({
    id: updatedAccount.id,
    user_id: updatedAccount.id,
    account_id: updatedAccount.id,
    email: updatedAccount.email,
    username: updatedAccount.username,
    name: updatedAccount.name,
    full_name: updatedAccount.name,
    phone: updatedAccount.phone ?? '',
    gender: updatedAccount.gender ?? '',
    profile_image: updatedAccount.profile_image,
  });
}

export async function OPTIONS() {
  return handleOptions();
}
