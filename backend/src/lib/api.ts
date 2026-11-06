import { NextRequest, NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// Standard API response shapes & Security Headers
// ─────────────────────────────────────────────────────────────────────────────

export type ApiSuccess<T> = { success: true } & (T extends object ? T : { data: T });
export type ApiError = { success: false; error: string; details?: unknown };

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-device-id, x-device-name, x-location, X-Device-Id, X-Device-Name, X-Location, X-Requested-With, Accept',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Permissions-Policy': 'camera=(), microphone=(), payment=()',
};

export function ok<T>(data: T, status = 200): NextResponse {
  const isObj = typeof data === 'object' && data !== null && !Array.isArray(data);
  const payload = isObj ? { success: true, ...data } : { success: true, data };
  return NextResponse.json(payload, { status, headers: CORS_HEADERS });
}

export function err(
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error: message, ...(details ? { details } : {}) },
    { status, headers: CORS_HEADERS }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse + validate JSON body with Zod
// ─────────────────────────────────────────────────────────────────────────────

export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse<ApiError>> {
  try {
    const json = await req.json();
    const data = schema.parse(json);
    return { data };
  } catch (e) {
    if (e instanceof ZodError) {
      return err('Validation error', 422, e.flatten().fieldErrors);
    }
    return err('Invalid JSON body', 400);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CORS preflight handler
// ─────────────────────────────────────────────────────────────────────────────

export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth: extract Bearer token and resolve user_id
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  accountId: string;
  role: string;
}

export async function requireAuth(
  req: NextRequest
): Promise<AuthSession | NextResponse<ApiError>> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return err('Missing or malformed Authorization header', 401);
  }

  const token = auth.slice(7);

  // 1. Validate Supabase Auth Bearer JWT token (from frontend client)
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!authError && authData?.user) {
      let { data: account } = await supabaseAdmin
        .from('accounts')
        .select('id, role')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (!account && authData.user.email) {
        const { data: accByEmail } = await supabaseAdmin
          .from('accounts')
          .select('id, role')
          .eq('email', authData.user.email)
          .maybeSingle();
        if (accByEmail) account = accByEmail;
      }

      const metaRole = (authData.user.user_metadata?.role as string) || undefined;
      const resolvedRole = account?.role || metaRole || 'customer';

      return {
        userId: authData.user.id,
        accountId: account?.id || authData.user.id,
        role: resolvedRole,
      };
    }
  } catch {
    // Fall back to custom sessions table
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: session, error: sessionError } = await supabaseAdmin
    .from('sessions')
    .select('id, account_id, revoked_at')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .is('revoked_at', null)
    .maybeSingle();

  if (sessionError || !session) {
    return err('Invalid or expired session token', 401);
  }

  // Update last_active_at asynchronously
  supabaseAdmin.from('sessions').update({ last_active_at: new Date().toISOString() }).eq('id', session.id).then();

  const { data: account, error: accountError } = await supabaseAdmin
    .from('accounts')
    .select('id, role')
    .eq('id', session.account_id)
    .maybeSingle();

  if (accountError || !account) {
    return err('Account not found or inactive', 401);
  }

  return { 
    userId: account.id as string, 
    accountId: account.id as string, 
    role: (account.role || 'customer') as string 
  };
}

export async function requireAdmin(
  req: NextRequest
): Promise<{ userId: string; role: string; accountId: string } | NextResponse<ApiError>> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== 'admin') {
    return err('Admin access required', 403);
  }
  return result;
}

export async function requireSellerOrAdmin(
  req: NextRequest
): Promise<{ userId: string; role: string; accountId: string } | NextResponse<ApiError>> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role === 'admin' || result.role === 'seller') {
    return result;
  }

  // Check if account has seller_status = 'approved'
  try {
    const { data: acc } = await supabaseAdmin
      .from('accounts')
      .select('role, seller_status')
      .eq('id', result.userId)
      .maybeSingle();

    if (acc?.role === 'admin' || acc?.role === 'seller' || acc?.seller_status === 'approved') {
      return result;
    }
  } catch {}

  return err('Verified Seller or Admin access required', 403);
}
