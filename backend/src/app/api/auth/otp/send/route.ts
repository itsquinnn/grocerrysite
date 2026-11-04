import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions } from '@/lib/api';
import { sendOTP } from '@/lib/auth-helpers';

const SendOTPSchema = z.object({
  email: z.string().email(),
  flow: z.enum(['signup', 'login', 'reset_password']).default('signup'),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const parsed = await parseBody(req, SendOTPSchema);
  if (parsed instanceof Response) return parsed;
  const { email, flow } = parsed.data;
  const cleanEmail = email.trim().toLowerCase();
  const purpose = flow === 'signup' ? 'account_creation' : flow === 'reset_password' ? 'forgot_password' : 'login';

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
    return ok({
      success: true,
      message: `Verification code sent to ${cleanEmail}`,
    });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return err(error?.message || 'Failed to send OTP code. Please try again.', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

