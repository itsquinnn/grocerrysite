import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';
import { sendEmail } from '@/lib/auth-helpers';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  
  try {
    let query = supabaseAdmin
      .from('ticket')
      .select('*')
      .order('created_at', { ascending: false });

    // Non-admins only see their own tickets
    if (auth.role !== 'admin') {
      query = query.eq('account_id', auth.userId);
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.warn('[tickets/GET] notice:', error.message);
      return ok({ tickets: [] });
    }

    // Attach customer account info for admin view
    const accountIds = Array.from(
      new Set((tickets ?? []).map((t: any) => t.account_id).filter(Boolean))
    );
    let accountMap: Record<string, any> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await supabaseAdmin
        .from('accounts')
        .select('id, name, email, phone, profile_image')
        .in('id', accountIds);
      if (accounts) {
        for (const a of accounts) {
          accountMap[a.id] = a;
        }
      }
    }

    const formattedTickets = (tickets ?? []).map((t: any) => {
      const isCallback = t.message?.toLowerCase().includes('callback') || t.subject?.toLowerCase().includes('callback');
      const phoneMatch = t.message?.match(/(\+?\d[\d -]{7,15}\d)/)?.[0];
      const acc = accountMap[t.account_id] || {};
      return {
        ...t,
        user_id: t.account_id,
        account_id: t.account_id,
        attachments: t.attachments || [],
        customer_name: isCallback
          ? 'Callback Request'
          : (acc.name || (t.account_id ? 'Customer' : 'Guest Visitor')),
        customer_email: acc.email || '',
        customer_phone: (isCallback && phoneMatch) ? phoneMatch : (acc.phone || ''),
        customer_avatar: acc.profile_image || null,
      };
    });

    return ok({ tickets: formattedTickets });
  } catch (err) {
    return ok({ tickets: [] });
  }
}

const UpdateTicketStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['Open', 'In Progress', 'Resolved', 'Closed']),
});

export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  if (auth.role !== 'admin') return err('Admin access required', 403);

  const parsed = await parseBody(req, UpdateTicketStatusSchema);
  if (parsed instanceof Response) return parsed;
  const { id, status } = parsed.data;

  try {
    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'Resolved' || status === 'Closed') {
      updatePayload.resolved_at = new Date().toISOString();
    }

    const { data: updatedTicket, error } = await supabaseAdmin
      .from('ticket')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) return err(error.message, 500);

    // Send instant notification to customer account as soon as ticket status changes
    if (updatedTicket && updatedTicket.account_id) {
      let notifTitle = `Support Ticket ${status}`;
      let notifBody = `Your support ticket status has been updated to "${status}".`;
      if (status === 'Resolved') {
        notifTitle = 'Ticket Resolved 🎉';
        notifBody = `Your support ticket "${updatedTicket.subject || 'Support Request'}" has been resolved.`;
      } else if (status === 'Closed') {
        notifTitle = 'Ticket Closed';
        notifBody = `Your support ticket "${updatedTicket.subject || 'Support Request'}" is now closed.`;
      } else if (status === 'In Progress') {
        notifTitle = 'Support Team Reviewing';
        notifBody = `An agent is now reviewing your ticket "${updatedTicket.subject || 'Support Request'}".`;
      }

      try {
        await supabaseAdmin.from('notifications').insert({
          account_id: updatedTicket.account_id,
          title: notifTitle,
          body: notifBody,
          type: 'support',
          is_read: false,
        });
      } catch (notifError) {
        console.warn('[PATCH /api/tickets] notification dispatch error:', notifError);
      }
    }

    return ok({ message: `Ticket status updated to ${status}` });
  } catch (e: any) {
    return err(e?.message || 'Failed to update ticket', 500);
  }
}

const TicketSchema = z.object({
  message: z.string().min(1),
  subject: z.string().optional(),
  name: z.string().optional(),
  email: z.string().optional(),
  category: z.string().optional(),
  order: z.string().optional(),
  order_number: z.string().optional(),
  attachments: z.array(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  const userId = auth instanceof Response ? null : auth.userId;

  const parsed = await parseBody(req, TicketSchema);
  if (parsed instanceof Response) return parsed;

  const { message, subject, name, email, category, order, order_number, attachments } = parsed.data;

  try {
    const isCallback = message.toLowerCase().includes('callback') || (category && category.toLowerCase().includes('callback'));
    const defaultSubject = isCallback ? 'Phone Callback Request' : 'Support Request';

    let finalMessage = message;
    if ((name || email) && !message.startsWith('From:')) {
      const headerLines = [
        `From: ${name || 'Customer'} <${email || ''}>`,
        category ? `Category: ${category}` : null,
        (order || order_number) ? `Order: ${order || order_number}` : null,
      ].filter(Boolean).join('\n');
      finalMessage = `${headerLines}\n\n${message}`;
    }

    const payload: any = {
      account_id: userId,
      subject: subject || defaultSubject,
      message: finalMessage,
      status: 'Open',
    };
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments;
    }

    let { data: insertedTicket, error } = await supabaseAdmin
      .from('ticket')
      .insert(payload)
      .select()
      .maybeSingle();

    // If account_id violated NOT NULL constraint for guest user, fallback to system/admin account
    if (error && error.message.toLowerCase().includes('account_id')) {
      const { data: fallbackAcc } = await supabaseAdmin
        .from('accounts')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (fallbackAcc) {
        payload.account_id = fallbackAcc.id;
        const retryRes = await supabaseAdmin
          .from('ticket')
          .insert(payload)
          .select()
          .maybeSingle();
        insertedTicket = retryRes.data;
        error = retryRes.error;
      }
    }

    // Fallback if 'attachments' column not yet in DB schema
    if (error && error.message.toLowerCase().includes('attachments')) {
      console.warn('[POST /api/tickets] attachments column missing in schema, appending to message:', error.message);
      delete payload.attachments;
      const links = (attachments ?? [])
        .map((a: any) => typeof a === 'string' ? a : (a.url || a.file_name || JSON.stringify(a)))
        .join('\n');
      payload.message = `${message}\n\nAttachments:\n${links}`;
      const fallbackRes = await supabaseAdmin
        .from('ticket')
        .insert(payload)
        .select()
        .maybeSingle();
      insertedTicket = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (error) {
      console.warn('[POST /api/tickets] insert error:', error.message);
      return err(error.message, 500);
    }

    // 1. If logged in, dispatch in-app notification to customer profile
    if (userId) {
      try {
        await supabaseAdmin.from('notifications').insert({
          account_id: userId,
          title: 'Support Ticket Received',
          body: `We received your ticket "${payload.subject}". Our team is on it!`,
          type: 'support',
          is_read: false,
        });
      } catch (_) {}
    }

    // Resolve customer identity and email
    let customerName = 'Valued Customer';
    let customerEmail: string | null = null;

    if (userId) {
      const { data: userAcc } = await supabaseAdmin
        .from('accounts')
        .select('name, email')
        .eq('id', userId)
        .maybeSingle();
      if (userAcc?.email) customerEmail = userAcc.email;
      if (userAcc?.name) customerName = userAcc.name;
    }

    // Check if name/email was formatted in message (e.g. From: Name <email>)
    const fromMatch = payload.message?.match(/From:\s*([^\n<]+)(?:<([^>]+)>)?/);
    if (fromMatch) {
      if (fromMatch[1]?.trim() && customerName === 'Valued Customer') {
        customerName = fromMatch[1].trim();
      }
      if (fromMatch[2]?.trim()) {
        customerEmail = fromMatch[2].trim();
      }
    }
    if (!customerEmail) {
      const emailRegexMatch = payload.message?.match(/[\w.-]+@[\w.-]+\.\w+/);
      if (emailRegexMatch) customerEmail = emailRegexMatch[0];
    }

    const ticketRef = (insertedTicket as any)?.ticket_number || insertedTicket?.id?.slice(0, 8).toUpperCase() || Date.now().toString().slice(-6);
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

    // Send emails in background (detached so HTTP response remains instant)
    setImmediate(async () => {
      // A. Alert email to Admin / Support Inbox
      if (adminEmail) {
        sendEmail({
          to: adminEmail,
          replyTo: customerEmail || 'no-reply@dovan.com',
          subject: `[New Support Ticket] ${payload.subject} (Ref: #${ticketRef})`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:10px;">
              <h2 style="color:#2E8B57;margin-top:0;">New Customer Support Ticket</h2>
              <p><strong>Ticket Reference:</strong> #${ticketRef}</p>
              <p><strong>Subject:</strong> ${payload.subject}</p>
              <p><strong>From:</strong> ${customerName} ${customerEmail ? `(&lt;${customerEmail}&gt;)` : ''}</p>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
              <div style="background:#f9fafb;padding:16px;border-radius:6px;white-space:pre-wrap;color:#374151;font-size:15px;line-height:1.5;">${payload.message}</div>
              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
                <a href="http://localhost:8080/admin/tickets" style="background:#2E8B57;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600;display:inline-block;">
                  View & Reply in Admin Dashboard
                </a>
              </div>
            </div>
          `,
        }).catch((err) => console.error('[Ticket Admin Email Error]:', err));
      }

      // B. Confirmation email with Blueprint copy to the Customer
      if (customerEmail) {
        sendEmail({
          to: customerEmail,
          replyTo: adminEmail || 'support@dovan.com',
          subject: `Ticket Received: ${payload.subject} (Ref: #${ticketRef})`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:auto;padding:28px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;color:#1f2937;">
              <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #f3f4f6;">
                <h1 style="color:#15803d;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">DOVAN</h1>
                <p style="color:#6b7280;font-size:13px;margin:4px 0 0 0;">Customer Care & Support &bull; Kathmandu, Nepal</p>
              </div>

              <p style="font-size:16px;line-height:1.5;margin-bottom:8px;">
                Namaste <strong>${customerName}</strong>,
              </p>
              <p style="font-size:15px;line-height:1.6;color:#4b5563;margin-top:0;">
                Thank you for contacting DOVAN Customer Care. We have received your request and our support team in Kathmandu is currently reviewing it.
              </p>

              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
                <p style="margin:0;font-size:14px;color:#166534;">
                  <strong>Ticket Reference:</strong> <span style="font-family:monospace;font-size:15px;font-weight:600;">#${ticketRef}</span>
                </p>
                <p style="margin:6px 0 0 0;font-size:13px;color:#166534;">
                  <strong>Status:</strong> Open &bull; In Queue
                </p>
              </div>

              <h3 style="font-size:15px;font-weight:600;color:#111827;margin:24px 0 10px 0;">
                Your Inquiry Blueprint (Copy of Message)
              </h3>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #15803d;border-radius:6px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px 0;font-size:13px;color:#6b7280;">
                  <strong>Subject:</strong> ${payload.subject}
                </p>
                <div style="font-size:14px;line-height:1.6;color:#374151;white-space:pre-wrap;">${payload.message}</div>
              </div>

              <div style="background:#f8fafc;border-radius:8px;padding:14px 16px;margin-bottom:24px;font-size:13px;color:#64748b;line-height:1.5;">
                <p style="margin:0;"><strong>What to expect next:</strong></p>
                <p style="margin:4px 0 0 0;">Our support team usually responds within a few hours (Sunday – Friday, 9:00 AM – 7:00 PM NPT). If you have additional details or photos to share, you can simply <strong>reply directly to this email</strong>.</p>
              </div>

              <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;">
                <a href="http://localhost:8080/account/support" style="background:#15803d;color:#ffffff;padding:10px 22px;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600;display:inline-block;">
                  View Ticket Status Online
                </a>
              </div>

              <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:24px;margin-bottom:0;">
                DOVAN Nepal &bull; Delivering across all 77 districts
              </p>
            </div>
          `,
        }).catch((err) => console.error('[Ticket Customer Confirmation Email Error]:', err));
      }
    });

    return ok({ message: 'Ticket submitted successfully', ticket: insertedTicket });
  } catch (err: any) {
    return err(err?.message || 'Failed to submit ticket', 500);
  }
}

export async function OPTIONS() {
  return handleOptions();
}
