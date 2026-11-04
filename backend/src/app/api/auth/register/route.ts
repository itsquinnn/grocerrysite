import { NextRequest } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions } from '@/lib/api';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(100),
  phone: z.string().min(7).max(30).trim().nullable().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').nullable().optional(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const parsed = await parseBody(req, RegisterSchema);
  if (parsed instanceof Response) return parsed;
  const { email, password, name, phone, username } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  // Check if email is already taken in accounts
  const { data: existing } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('email', cleanEmail)
    .maybeSingle();

  if (existing) {
    return err('An account with this email already exists', 409);
  }

  // Generate unique referral code
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codeSuffix = '';
  for (let i = 0; i < 4; i++) {
    codeSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const referralCode = `AERO${codeSuffix}`;

  // Resolve unique username
  let finalUsername = username ? username.trim().toLowerCase() : '';
  if (!finalUsername) {
    let baseUsername = (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'user').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (baseUsername.length < 3) baseUsername = 'user';
    finalUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
  }

  try {
    let userId: string;

    // 1. Create user in Supabase auth with pre-confirmed email (bypasses unconfigured email SMTP)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name.trim(),
        phone: phone ? phone.trim() : null,
      },
    });

    if (authError) {
      const msg = authError.message?.toLowerCase() || '';
      if (
        msg.includes('already') ||
        msg.includes('registered') ||
        msg.includes('exists')
      ) {
        // Recover user created in auth.users from a prior direct signUp that had unconfirmed email
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = listData?.users?.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        );

        if (existingAuthUser) {
          const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
            password,
            email_confirm: true,
            user_metadata: {
              full_name: name.trim(),
              phone: phone ? phone.trim() : null,
            },
          });
          if (updateErr) {
            return err(updateErr.message, 400);
          }
          userId = existingAuthUser.id;
        } else {
          return err('An account with this email already exists', 409);
        }
      } else {
        return err(authError.message, 400);
      }
    } else {
      userId = authData.user.id;
    }
    const passwordHash = await bcrypt.hash(password, 12);

    // 2. Insert corresponding record into public.accounts with the exact same ID
    const { error: accError } = await supabaseAdmin
      .from('accounts')
      .upsert({
        id: userId,
        email: cleanEmail,
        username: finalUsername,
        password_hash: passwordHash,
        provider: 'email',
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        role: 'customer',
        status: 'active',
        referral_code: referralCode,
      });

    if (accError) {
      console.error('Failed to create account in public.accounts:', accError);
    }

    return ok(
      {
        success: true,
        message: 'Account registered successfully',
        userId,
      },
      201
    );
  } catch (error: any) {
    return err(error?.message ?? 'Registration failed', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
