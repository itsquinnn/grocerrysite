import { NextRequest } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions } from '@/lib/api';

const ResetConfirmSchema = z.object({
  token: z.string().min(10, 'Invalid or missing reset token'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const parsed = await parseBody(req, ResetConfirmSchema);
  if (parsed instanceof Response) return parsed;
  const { token, password } = parsed.data;

  // Hash the incoming token with SHA-256 to compare against database code_hash
  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  // Verify token exists, purpose is forgot_password, and has not expired (10 min TTL)
  const { data: resetReq, error: lookupErr } = await supabaseAdmin
    .from('otp_requests')
    .select('id, account_id, email, expires_at')
    .eq('purpose', 'forgot_password')
    .eq('code_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (lookupErr || !resetReq || !resetReq.account_id) {
    return err(
      'This password reset link has expired or has already been used. Please request a new one.',
      400
    );
  }

  try {
    // Generate secure bcrypt hash for the new password
    const newHash = await bcrypt.hash(password, 10);

    // Update account with new password hash
    const { error: updateErr } = await supabaseAdmin
      .from('accounts')
      .update({
        password_hash: newHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resetReq.account_id);

    if (updateErr) {
      throw new Error(`Failed to update account: ${updateErr.message}`);
    }

    // Also sync Supabase auth.users password if account exists in Supabase Auth
    try {
      await supabaseAdmin.auth.admin.updateUserById(resetReq.account_id, { password });
    } catch {
      // Non-critical if user was registered directly without Supabase auth row
    }

    // Invalidate the reset token immediately (single-use guarantee)
    await supabaseAdmin
      .from('otp_requests')
      .delete()
      .eq('id', resetReq.id);

    // Revoke any prior active sessions for this account for maximum security
    await supabaseAdmin
      .from('sessions')
      .delete()
      .eq('account_id', resetReq.account_id);

    return ok({
      success: true,
      message: 'Your password has been changed successfully. You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('[Password Reset Confirm Error]:', error?.message);
    return err(error?.message || 'Failed to update password. Please try again.', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}

