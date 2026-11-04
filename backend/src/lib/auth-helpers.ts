import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Persistent Pooled Transporter
// ─────────────────────────────────────────────────────────────────────────────

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const smtpUser = process.env.SMTP_USER;
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD)?.replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  if (!smtpUser || !smtpPass) return null;

  cachedTransporter = nodemailer.createTransport({
    pool: true,
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    family: 4, // Force IPv4 to prevent Windows 15-second IPv6 timeout
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    socketTimeout: 15000,
    connectionTimeout: 10000,
  } as any);

  return cachedTransporter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: OTP sending (Instant DB write + background mail dispatch)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendOTP(
  email: string, 
  purpose: 'login' | 'account_creation' | 'forgot_password',
  accountId?: string,
  skipDelete: boolean = false
): Promise<void> {
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const cleanEmail = email.toLowerCase().trim();

  // Invalidate any prior active OTPs for this email and purpose (unless already deleted in parallel)
  if (!skipDelete) {
    await supabaseAdmin
      .from('otp_requests')
      .delete()
      .eq('email', cleanEmail)
      .eq('purpose', purpose);
  }

  // Store new cryptographically hashed OTP request (takes ~40ms)
  const { error: insertError } = await supabaseAdmin.from('otp_requests').insert({
    account_id: accountId ?? null,
    email: cleanEmail,
    purpose,
    code_hash: codeHash,
    attempt_count: 0,
    max_attempts: 5,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`Database error saving OTP: ${insertError.message}`);
  }

  // Log code immediately to server output for instant local visibility
  console.log(`[AUTH OTP] Code for "${cleanEmail}" (${purpose}): ${otpCode}`);

  const emailHtml = `
    <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:32px;
                border:1px solid #e5e7eb;border-radius:12px;">
      <h2 style="color:#2E8B57;margin-top:0;">Dovan</h2>
      <p style="color:#374151;font-size:16px;">Your verification code:</p>
      <div style="background:#F0FDF4;border:2px dashed #86EFAC;border-radius:8px;
                  padding:20px;text-align:center;margin:20px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#16A34A">
          ${otpCode}
        </span>
      </div>
      <p style="color:#6B7280;font-size:14px;margin-bottom:0;">
        Expires in <strong>10 minutes</strong>. Do not share with anyone.
      </p>
      <p style="color:#9CA3AF;font-size:12px;margin-top:24px;border-top:1px solid #E5E7EB;padding-top:16px;text-align:center;">
        This is an automated message from DOVAN No-Reply. Please do not reply to this email.
      </p>
    </div>`;

  // Asynchronous background email delivery — does NOT block user UI!
  const dispatch = async () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpFrom = smtpUser ? `"DOVAN No-Reply" <${smtpUser}>` : (process.env.EMAIL_FROM || '"DOVAN No-Reply" <noreply@dovan.com>');
    const transporter = getTransporter();

    if (transporter) {
      try {
        console.log(`[SMTP] Dispatching OTP email TO: "${cleanEmail}"`);
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: cleanEmail,
          replyTo: 'no-reply@dovan.com',
          subject: `Your DOVAN Verification Code: ${otpCode}`,
          text: `Your DOVAN verification code is: ${otpCode}. It expires in 10 minutes. Please do not reply to this automated email.`,
          html: emailHtml,
        });
        console.log(`[SMTP] Delivered successfully to ${cleanEmail}. MessageId: ${info.messageId}`);
        return;
      } catch (smtpErr: any) {
        console.error(`[SMTP ERROR] Failed to send to ${cleanEmail}:`, smtpErr?.message);
      }
    }

    // Fallback: Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? 'noreply@dovan.com',
          to: cleanEmail,
          subject: `Your DOVAN Verification Code: ${otpCode}`,
          html: emailHtml,
        });
        console.log(`[Resend] Delivered successfully to ${cleanEmail}`);
        return;
      } catch (resendErr: any) {
        console.error('[Resend ERROR]:', resendErr?.message);
      }
    }
  };

  // Await email dispatch directly so serverless functions (Vercel) do not freeze/terminate
  // before the email is sent, with a 5s race timeout to prevent unbounded hanging.
  try {
    await Promise.race([
      dispatch(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email dispatch timeout (5s)')), 5000)
      ),
    ]);
  } catch (err: any) {
    console.error('[EMAIL DISPATCH ERROR/TIMEOUT]:', err?.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: General Email sending
// ─────────────────────────────────────────────────────────────────────────────

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<void> {
  const smtpUser = process.env.SMTP_USER;
  const smtpFrom = smtpUser ? `"DOVAN Support" <${smtpUser}>` : (process.env.EMAIL_FROM || '"DOVAN Support" <noreply@dovan.com>');
  const transporter = getTransporter();

  if (transporter) {
    try {
      console.log(`[Email] Sending "${subject}" TO: "${to}"`);
      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        replyTo: replyTo || 'no-reply@dovan.com',
        subject,
        text: text || '',
        html,
      });
      console.log(`[Email] Successfully delivered "${subject}" TO: "${to}". MessageId: ${info.messageId}`);
      return;
    } catch (err: any) {
      console.error('[sendEmail SMTP Error]:', err?.message);
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'noreply@dovan.com',
        to,
        subject,
        html,
      });
    } catch (err: any) {
      console.error('[sendEmail Resend Error]:', err?.message);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Session token generation
// ─────────────────────────────────────────────────────────────────────────────

export async function generateSession(
  accountId: string, 
  metadata?: { userAgent?: string; ipAddress?: string; deviceName?: string; location?: string }
): Promise<string> {
  const token = crypto.randomBytes(48).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 1000).toISOString();

  // Run session insert and accounts last_login_at in parallel
  await Promise.all([
    supabaseAdmin
      .from('sessions')
      .insert({ 
        account_id: accountId, 
        token_hash: tokenHash, 
        expires_at: expiresAt,
        user_agent: metadata?.userAgent,
        ip_address: metadata?.ipAddress,
        device_name: metadata?.deviceName,
        location: metadata?.location
      }),
    supabaseAdmin
      .from('accounts')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', accountId)
  ]);

  return token;
}
