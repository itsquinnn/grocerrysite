import nodemailer, { type Transporter } from 'nodemailer';
import { Resend } from 'resend';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Registration JWT Session Tokens (Preserves signup form state during OTP flow)
// ─────────────────────────────────────────────────────────────────────────────

const REGISTRATION_JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'dovan-production-jwt-signup-secret-key-2026-auth'
);

export async function createRegistrationToken(payload: {
  email: string;
  name?: string;
  phone?: string;
  password?: string;
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(REGISTRATION_JWT_SECRET);
}

export async function verifyRegistrationToken(token: string): Promise<{
  email: string;
  name?: string;
  phone?: string;
  password?: string;
} | null> {
  try {
    const { payload } = await jwtVerify(token, REGISTRATION_JWT_SECRET);
    return payload as any;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Persistent Pooled Transporter
// ─────────────────────────────────────────────────────────────────────────────

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const smtpUser = process.env.SMTP_USER || 'qumitechnologies.web@gmail.com';
  const smtpPass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || 'frfvayzpqbbikhsr')?.replace(/\s+/g, '');
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 465);

  if (!smtpUser || !smtpPass) return null;

  // Serverless-optimized transporter (no persistent pool so connections don't freeze on Vercel)
  cachedTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    family: 4, // Force IPv4 to prevent Windows / cloud IPv6 timeout
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    socketTimeout: 12000,
    connectionTimeout: 8000,
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
  skipDelete: boolean = false,
  userName?: string | null
): Promise<void> {
  const otpCode = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = crypto.createHash('sha256').update(otpCode).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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

  // Mask email and suppress plaintext OTP logging in production
  const maskedEmail = cleanEmail.replace(/(^.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length)));
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH OTP DEV] Code for "${maskedEmail}" (${purpose}): ${otpCode}`);
  } else {
    console.log(`[AUTH OTP] Dispatched code to "${maskedEmail}" (${purpose})`);
  }

  // Extract first name from user's full name (fallback to looking up in accounts table or 'there')
  let rawFullName = userName?.trim();
  if (rawFullName && rawFullName.includes('@')) {
    rawFullName = ''; // Never treat an email address as a full name
  }
  if (!rawFullName) {
    try {
      const accQuery = accountId
        ? supabaseAdmin.from('accounts').select('name').eq('id', accountId).maybeSingle()
        : supabaseAdmin.from('accounts').select('name').eq('email', cleanEmail).maybeSingle();
      const { data: accData } = await accQuery;
      if (accData?.name && !accData.name.includes('@')) {
        rawFullName = accData.name.trim();
      }
    } catch {
      // Non-critical name lookup failure
    }
  }

  let firstName = 'there';
  if (rawFullName) {
    const firstWord = rawFullName.trim().split(/\s+/)[0];
    if (firstWord && !firstWord.includes('@')) {
      const cleanWord = firstWord.replace(/[^a-zA-Z\u0900-\u097F]/g, '');
      if (cleanWord) {
        firstName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      }
    }
  }

  let subject = `Your DOVAN Verification Code: ${otpCode}`;
  let pageTitle = 'Welcome to Dovan — verify your email';
  let heading = 'Welcome to Dovan';
  let preheader = `Welcome to Dovan. Your verification code is ${otpCode}. It expires in 5 minutes.`;
  let bodyText = `Thanks for registering. Your account has been created, and one quick step remains:
        verify this email address so we know it belongs to you. Enter the code below on
        the verification screen to finish setting up your account.`;
  let footerReason = 'This message was sent because someone registered at dovan.com using this address.';

  if (purpose === 'forgot_password') {
    subject = `Reset Your DOVAN Password — Code: ${otpCode}`;
    pageTitle = 'Reset your DOVAN password';
    heading = 'Reset Your Password';
    preheader = `Your DOVAN password reset code is ${otpCode}. It expires in 5 minutes.`;
    bodyText = `We received a request to reset the password for your DOVAN account. Enter the 6-digit verification code below on the password reset screen to set a new password. If you didn't request this, you can safely ignore this email.`;
    footerReason = 'This message was sent because a password reset was requested for your account at dovan.com.';
  } else if (purpose === 'login') {
    subject = `Your DOVAN Login Code: ${otpCode}`;
    pageTitle = 'DOVAN Login Verification';
    heading = 'Sign In to DOVAN';
    preheader = `Your DOVAN login verification code is ${otpCode}. It expires in 5 minutes.`;
    bodyText = `Enter the 6-digit verification code below on the login screen to verify your identity and access your account.`;
    footerReason = 'This message was sent because a sign-in attempt was made at dovan.com using this address.';
  }

  const emailHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>${pageTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@700&display=swap');

  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  table{border-collapse:collapse!important;}
  img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0!important;padding:0!important;width:100%!important;}

  .serif{font-family:'DM Serif Display',Georgia,'Times New Roman',serif;}
  .sans {font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}
  .mono {font-family:'JetBrains Mono','SF Mono',Menlo,Consolas,'Courier New',monospace;}

  @media screen and (max-width:480px){
    .pad  {padding:32px 24px!important;}
    .head {font-size:26px!important;}
    .code {font-size:30px!important;letter-spacing:7px!important;margin-right:-7px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;">

<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  ${preheader}
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
<tr><td align="center" style="padding:48px 16px;">

  <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0"
         style="width:480px;max-width:100%;background:#ffffff;
                border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;
                box-shadow:0 4px 24px rgba(0,0,0,0.04);">

    <!-- Brand -->
    <tr><td class="pad" style="padding:36px 40px 0;">
      <span class="serif" style="font-size:13px;font-weight:400;letter-spacing:4px;
            color:#1e6b45;text-transform:uppercase;">Dovan</span>
    </td></tr>

    <!-- Heading -->
    <tr><td class="pad" style="padding:20px 40px 0;">
      <h1 class="serif head" style="margin:0;font-size:32px;line-height:1.22;
            font-weight:400;color:#1a1a1a;letter-spacing:-0.2px;">
        ${heading}
      </h1>
    </td></tr>

    <!-- Body -->
    <tr><td class="pad" style="padding:16px 40px 0;">

      <p class="sans" style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#4b5563;">
        Hi ${firstName},
      </p>

      <p class="sans" style="margin:0 0 32px;font-size:15px;line-height:1.7;color:#4b5563;">
        ${bodyText}
      </p>

      <!-- Code block -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td align="center"
                style="background:#f4fbf7;border:1px solid #d1fae5;border-radius:18px;
                       padding:28px 16px;">
          <span class="mono code" style="display:inline-block;font-size:36px;font-weight:700;
                letter-spacing:10px;margin-right:-10px;color:#1e6b45;white-space:nowrap;">
            ${otpCode}
          </span>
        </td></tr>
      </table>

      <p class="sans" style="margin:18px 0 0;font-size:13px;line-height:1.6;
            color:#8a8a8a;text-align:center;letter-spacing:0.2px;">
        Expires in 5 minutes. Can be used once. Never share this code, even with Dovan staff.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td class="pad" style="padding:36px 40px 32px;">
      <hr style="border:none;border-top:1px solid #ece9e4;margin:0 0 20px;">
      <p class="sans" style="margin:0;font-size:12px;line-height:1.6;color:#9a9a9a;">
        ${footerReason}
        Replies are not monitored; write to support@dovan.com instead.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>

</body>
</html>`;

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
          subject,
          text: `Your DOVAN verification code is: ${otpCode}. It expires in 5 minutes. Please do not reply to this automated email.`,
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
          subject,
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
  // before the email is sent, with an 8s race timeout to prevent unbounded hanging.
  try {
    await Promise.race([
      dispatch(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email dispatch timeout (8s)')), 8000)
      ),
    ]);
  } catch (err: any) {
    console.error('[EMAIL DISPATCH ERROR/TIMEOUT]:', err?.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared: Direct Server Password Reset Link (10-minute validity)
// ─────────────────────────────────────────────────────────────────────────────

export async function sendPasswordResetLink(
  email: string,
  accountId: string,
  userName?: string | null,
  clientOrigin?: string
): Promise<void> {
  const cleanEmail = email.toLowerCase().trim();
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // Strict 10-minute expiry

  // Invalidate any prior active forgot_password tokens for this email
  await supabaseAdmin
    .from('otp_requests')
    .delete()
    .eq('email', cleanEmail)
    .eq('purpose', 'forgot_password');

  // Store new cryptographically hashed reset request (10 min TTL)
  const { error: insertError } = await supabaseAdmin.from('otp_requests').insert({
    account_id: accountId,
    email: cleanEmail,
    purpose: 'forgot_password',
    code_hash: tokenHash,
    attempt_count: 0,
    max_attempts: 5,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`Database error saving reset token: ${insertError.message}`);
  }

  // Determine user's first name
  let rawFullName = userName?.trim();
  if (rawFullName && rawFullName.includes('@')) {
    rawFullName = '';
  }
  if (!rawFullName) {
    try {
      const { data: acc } = await supabaseAdmin.from('accounts').select('name').eq('id', accountId).maybeSingle();
      if (acc?.name && !acc.name.includes('@')) {
        rawFullName = acc.name.trim();
      }
    } catch {
      // Non-critical
    }
  }

  let firstName = 'there';
  if (rawFullName) {
    const firstWord = rawFullName.trim().split(/\s+/)[0];
    if (firstWord && !firstWord.includes('@')) {
      const cleanWord = firstWord.replace(/[^a-zA-Z\u0900-\u097F]/g, '');
      if (cleanWord) {
        firstName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      }
    }
  }

  const baseOrigin = clientOrigin
    ? clientOrigin.replace(/\/+$/, '')
    : (process.env.NEXT_PUBLIC_APP_URL || 'https://dovan-blond.vercel.app').replace(/\/+$/, '');

  const resetUrl = `${baseOrigin}/reset-password?token=${resetToken}`;

  const maskedEmail = cleanEmail.replace(/(^.{2})(.*)(?=@)/, (_, a, b) => a + '*'.repeat(Math.max(1, b.length)));
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AUTH RESET LINK DEV] Token: ${resetToken} | Reset URL: ${resetUrl}`);
  } else {
    console.log(`[AUTH RESET LINK] Dispatched 10-minute reset link to "${maskedEmail}"`);
  }

  const emailHtml = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Reset your Dovan password</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;700&display=swap');

  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0;mso-table-rspace:0;}
  table{border-collapse:collapse!important;}
  img{border:0;height:auto;line-height:100%;outline:none;text-decoration:none;}
  body{margin:0!important;padding:0!important;width:100%!important;}

  .serif{font-family:'DM Serif Display',Georgia,'Times New Roman',serif;}
  .sans {font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;}

  /* Kept the beautiful rounding and shadow, removed the border */
  .card{
    border-radius:32px;
    border:none;
    box-shadow:0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
  }

  @media screen and (max-width:480px){
    .pad  {padding:24px 20px!important;}
    .head {font-size:26px!important;}
    .btn a{display:block!important;text-align:center!important;}
    .card {border-radius:24px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f8fafc;">

<!-- Preheader -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
  Choose a new password for your Dovan account. This link expires in 10 minutes.
  &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
</div>

<!-- Outer padding reduced from 64px to 32px to tighten the page -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;">
<tr><td align="center" style="padding:32px 16px;">

  <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" class="card"
         style="width:480px;max-width:100%;background:#ffffff;border-radius:32px;border:none;box-shadow:0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);overflow:hidden;">

    <!-- Brand -->
    <!-- Padding reduced to 32px top and sides -->
    <tr><td class="pad" style="padding:32px 32px 0;">
      <span class="serif" style="font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#1e6b45;">Dovan</span>
    </td></tr>

    <!-- Heading -->
    <!-- Spacing between brand and heading tightened -->
    <tr><td class="pad" style="padding:16px 32px 0;">
      <h1 class="serif head" style="margin:0;font-size:30px;line-height:1.24;font-weight:400;color:#1a1a1a;letter-spacing:-0.2px;">
        Reset your password
      </h1>
    </td></tr>

    <!-- Body -->
    <tr><td class="pad" style="padding:12px 32px 0;">
      <p class="sans" style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">
        We received a request to reset the password for your Dovan account.
        Click the button below to choose a new one.
      </p>

      <!-- Button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn">
        <tr>
          <td align="center" bgcolor="#16a34a" style="border-radius:999px;
                     box-shadow:0 2px 4px rgba(22,163,74,0.2);">
            <a href="${resetUrl}" target="_blank"
               style="display:inline-block;padding:14px 30px;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
                      font-size:14px;font-weight:600;letter-spacing:0.2px;
                      color:#ffffff;text-decoration:none;border-radius:999px;">
              Reset password
            </a>
          </td>
        </tr>
      </table>

      <!-- Fallback link -->
      <p class="sans" style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8a8a8a;">
        Button not working? Paste this link into your browser:<br>
        <a href="${resetUrl}" style="color:#1e6b45;text-decoration:underline;word-break:break-all;">${resetUrl}</a>
      </p>

      <!-- Expiry note -->
      <p class="sans" style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#8a8a8a;">
        This link expires in <strong style="color:#4b5563;">10 minutes</strong> and can be used once.
      </p>

    </td></tr>

    <!-- Security note -->
    <tr><td class="pad" style="padding:24px 32px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td style="background:#f8fafc;border-radius:16px;padding:16px 20px;">
          <p class="sans" style="margin:0;font-size:13px;line-height:1.65;color:#6b7280;">
            <strong style="color:#4b5563;">Didn't request this?</strong>
            You can safely ignore this email — your password won't change until you
            open the link and set a new one.
          </p>
        </td></tr>
      </table>
    </td></tr>

    <!-- Footer -->
    <!-- Footer padding tightened -->
    <tr><td class="pad" style="padding:28px 32px 32px;">
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:0 0 16px;">

      <p class="sans" style="margin:0;font-size:12px;line-height:1.6;color:#9a9a9a;">
        Dovan &middot; Nepal<br>
        This is an automated message. Replies are not monitored — write to
        <a href="mailto:support@dovan.com" style="color:#9a9a9a;text-decoration:underline;">support@dovan.com</a>.
      </p>
    </td></tr>

  </table>
</td></tr>
</table>

</body>
</html>`;

  const dispatch = async () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpFrom = smtpUser ? `"DOVAN No-Reply" <${smtpUser}>` : (process.env.EMAIL_FROM || '"DOVAN No-Reply" <noreply@dovan.com>');
    const transporter = getTransporter();

    if (transporter) {
      try {
        console.log(`[SMTP] Dispatching reset link email TO: "${cleanEmail}"`);
        const info = await transporter.sendMail({
          from: smtpFrom,
          to: cleanEmail,
          replyTo: 'no-reply@dovan.com',
          subject: 'Reset Your DOVAN Password',
          text: `Reset your DOVAN password by opening this link in your browser: ${resetUrl}\n\nThis link expires in 10 minutes. If you did not request this, please ignore this email.`,
          html: emailHtml,
        });
        console.log(`[SMTP] Delivered reset link successfully to ${cleanEmail}. MessageId: ${info.messageId}`);
        return;
      } catch (smtpErr: any) {
        console.error(`[SMTP ERROR] Failed to send reset link to ${cleanEmail}:`, smtpErr?.message);
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
          subject: 'Reset Your DOVAN Password',
          html: emailHtml,
        });
        console.log(`[Resend] Delivered reset link successfully to ${cleanEmail}`);
        return;
      } catch (resendErr: any) {
        console.error('[Resend ERROR]:', resendErr?.message);
      }
    }
  };

  try {
    await Promise.race([
      dispatch(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email dispatch timeout (8s)')), 8000)
      ),
    ]);
  } catch (err: any) {
    console.error('[EMAIL RESET DISPATCH ERROR/TIMEOUT]:', err?.message);
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
