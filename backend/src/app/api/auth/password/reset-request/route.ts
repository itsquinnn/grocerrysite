import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions } from '@/lib/api';
import { sendPasswordResetLink } from '@/lib/auth-helpers';

const ResetRequestSchema = z.object({
  email: z.string().email(),
  origin: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const parsed = await parseBody(req, ResetRequestSchema);
  if (parsed instanceof Response) return parsed;
  const { email, origin } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();

  // Rate limiting: prevent spamming reset requests (cooldown: 25 seconds)
  const twentyFiveSecsAgo = new Date(Date.now() - 25 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from('otp_requests')
    .select('id, created_at')
    .eq('email', cleanEmail)
    .eq('purpose', 'forgot_password')
    .gt('created_at', twentyFiveSecsAgo)
    .limit(1);

  if (recent && recent.length > 0) {
    return err('Please wait a few moments before requesting another password reset link.', 429);
  }

  // Look up account (exact match first, then case-insensitive)
  let user = (
    await supabaseAdmin
      .from('accounts')
      .select('id, email, name')
      .eq('email', cleanEmail)
      .maybeSingle()
  ).data;

  if (!user) {
    const { data: ilikeUser } = await supabaseAdmin
      .from('accounts')
      .select('id, email, name')
      .ilike('email', cleanEmail)
      .maybeSingle();
    user = ilikeUser;
  }

  if (user) {
    try {
      await sendPasswordResetLink(user.email, user.id, user.name, origin);
    } catch (sendErr: any) {
      console.error('[Reset Link Dispatch Error]:', sendErr?.message);
      return err('Failed to dispatch password reset link. Please try again.', 500);
    }
  }

  // Always return safe success message (avoids email enumeration)
  return ok({
    success: true,
    message: 'If an account exists with this email address, a password reset link has been sent.',
  });
}

export async function OPTIONS() {
  return handleOptions();
}

