import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions } from '@/lib/api';
import { sendOTP, createRegistrationToken } from '@/lib/auth-helpers';

const SendOTPSchema = z.object({
  email: z.string().email(),
  flow: z.enum(['signup', 'login', 'reset_password']).default('signup'),
  name: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  password: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const parsed = await parseBody(req, SendOTPSchema);
  if (parsed instanceof Response) return parsed;
  const { email, flow, name, phone, password } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();
  const purpose = flow === 'signup' ? 'account_creation' : flow === 'reset_password' ? 'forgot_password' : 'login';

  // ── Rate Limiting & Cooldown Protection ────────────────────────────────────
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: recentOtps } = await supabaseAdmin
    .from('otp_requests')
    .select('id, created_at')
    .eq('email', cleanEmail)
    .gt('created_at', fifteenMinsAgo)
    .order('created_at', { ascending: false });

  if (recentOtps && recentOtps.length > 0) {
    const latest = recentOtps[0];
    const diffMs = Date.now() - new Date(latest.created_at).getTime();
    if (diffMs < 25 * 1000) {
      const waitSecs = Math.ceil((25 * 1000 - diffMs) / 1000);
      return err(`Please wait ${waitSecs} second(s) before requesting another code.`, 429);
    }
    if (recentOtps.length >= 6) {
      return err('Too many verification code requests. Please wait 15 minutes before trying again.', 429);
    }
  }

  // If signup flow, verify email is not already registered and invalidate prior OTPs in parallel
  const [existingCheck] = await Promise.all([
    flow === 'signup'
      ? supabaseAdmin.from('accounts').select('id').eq('email', cleanEmail).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin.from('otp_requests').delete().eq('email', cleanEmail).eq('purpose', purpose),
  ]);

  if (existingCheck?.data) {
    return err('An account with this email already exists. Please sign in.', 409);
  }

  try {
    await sendOTP(cleanEmail, purpose, undefined, true);

    // If signup flow, generate a signed registration JWT containing form metadata
    let signupToken: string | undefined;
    if (flow === 'signup') {
      signupToken = await createRegistrationToken({
        email: cleanEmail,
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        password: password || undefined,
      });
    }

    return ok({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
      signup_token: signupToken,
      registration: {
        email: cleanEmail,
        name: name ? name.trim() : '',
        phone: phone ? phone.trim() : '',
      },
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return err(error?.message || 'Failed to send OTP code. Please try again.', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

