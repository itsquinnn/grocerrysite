import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { ok, err, parseBody, handleOptions, requireAuth } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for encoding / decoding location components in DB 'details' column
// ─────────────────────────────────────────────────────────────────────────────
function encodeDetails(input: {
  details?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  label?: string | null;
}): string {
  const meta = {
    landmark: input.landmark?.trim() || '',
    city: input.city?.trim() || '',
    district: input.district?.trim() || '',
    province: input.province?.trim() || 'Bagmati',
    label: input.label?.trim() || 'Home',
    extra: input.details?.trim() || '',
  };
  return JSON.stringify(meta);
}

function decodeDetails(detailsStr: string | null | undefined): {
  landmark: string | null;
  city: string;
  district: string;
  province: string;
  label: string;
  summary: string;
} {
  let landmark: string | null = null;
  let city = '';
  let district = '';
  let province = 'Bagmati';
  let label = 'Home';
  let summary = '';

  if (detailsStr) {
    const trimmed = detailsStr.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        landmark = parsed.landmark || null;
        city = parsed.city || '';
        district = parsed.district || '';
        province = parsed.province || 'Bagmati';
        label = parsed.label || 'Home';
        summary = [landmark ? `Near ${landmark}` : null, city, district, province].filter(Boolean).join(', ');
      } catch {
        summary = trimmed;
      }
    } else {
      // Plain text fallback (e.g. "Near Park, Kathmandu, Bagmati")
      summary = trimmed;
      const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 3) {
        province = parts[parts.length - 1];
        district = parts[parts.length - 2];
        city = parts[parts.length - 3];
        landmark = parts.slice(0, parts.length - 3).join(', ') || null;
      } else if (parts.length === 2) {
        city = parts[0];
        district = parts[1];
      } else if (parts.length === 1) {
        city = parts[0];
      }
    }
  }

  return { landmark, city, district, province, label, summary };
}

function formatAddressRow(a: any) {
  const decoded = decodeDetails(a.details);
  const full_name = a.name || a.full_name || '';
  const city = decoded.city || 'Kathmandu';
  const district = decoded.district || 'Kathmandu';
  const province = decoded.province || 'Bagmati';
  const landmark = decoded.landmark;
  const label = a.label || decoded.label || 'Home';

  return {
    id: a.id,
    account_id: a.account_id,
    user_id: a.account_id,
    label,
    name: full_name,
    full_name,
    phone: a.phone || '',
    street: a.street || '',
    city,
    district,
    province,
    landmark,
    details: a.details,
    summary: decoded.summary || `${a.street}, ${city}, ${district}, ${province}`,
    is_default: Boolean(a.is_default),
    latitude: a.latitude ?? null,
    longitude: a.longitude ?? null,
    created_at: a.created_at,
    updated_at: a.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/addresses  — Fetch authenticated user's addresses
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  let { data: addresses, error } = await supabaseAdmin
    .from('addresses')
    .select('id, account_id, label, name, phone, street, details, is_default, latitude, longitude, created_at, updated_at')
    .eq('account_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[addresses/GET] error:', error);
    return err('Failed to fetch addresses', 500);
  }

  // Auto-seeding: If user has no saved addresses, attempt recovery from recent orders or accounts profile
  if (!addresses || addresses.length === 0) {
    try {
      const { data: pastOrders } = await supabaseAdmin
        .from('orders')
        .select('id, address_snapshot, destination_address, created_at')
        .eq('account_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: acc } = await supabaseAdmin
        .from('accounts')
        .select('name, phone')
        .eq('id', userId)
        .maybeSingle();

      if (pastOrders && pastOrders.length > 0 && pastOrders[0]) {
        const snap = (pastOrders[0].address_snapshot as any) || {};
        const dest = pastOrders[0].destination_address || snap.address || '';
        const seedName = snap.full_name || snap.name || acc?.name || 'Customer';
        const seedPhone = snap.phone || acc?.phone || '9800000000';
        const seedStreet = snap.street || dest.split(',')[0]?.trim() || dest || 'Main Road';
        const seedCity = snap.city || dest.split(',')[1]?.trim() || 'Kathmandu';
        const seedDistrict = snap.district || dest.split(',')[2]?.trim() || 'Kathmandu';
        const seedProvince = snap.province || 'Bagmati';
        const seedLandmark = snap.landmark || null;

        const { data: seeded } = await supabaseAdmin
          .from('addresses')
          .insert({
            account_id: userId,
            label: 'Home',
            name: seedName,
            phone: seedPhone,
            street: seedStreet,
            details: encodeDetails({ landmark: seedLandmark, city: seedCity, district: seedDistrict, province: seedProvince }),
            is_default: true,
            latitude: snap.latitude ?? null,
            longitude: snap.longitude ?? null,
          })
          .select()
          .single();

        if (seeded) {
          addresses = [seeded];
        }
      }
    } catch (seedErr) {
      console.warn('[addresses/GET] Auto-seeding failed silently:', seedErr);
    }
  }

  const formatted = (addresses ?? []).map(formatAddressRow);
  return ok({ addresses: formatted });
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/addresses
// ─────────────────────────────────────────────────────────────────────────────
const AddressSchema = z.object({
  label: z.string().default('Home').optional(),
  name: z.string().optional(),
  full_name: z.string().optional(),
  phone: z.string().min(7),
  street: z.string().min(2),
  district: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  landmark: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  is_default: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const parsed = await parseBody(req, AddressSchema);
  if (parsed instanceof Response) return parsed;
  const addressData = parsed.data;

  // Unset previous defaults if this new one is marked default
  if (addressData.is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('account_id', userId);
  }

  const jsonDetails = encodeDetails({
    details: addressData.details,
    landmark: addressData.landmark,
    city: addressData.city,
    district: addressData.district,
    province: addressData.province,
    label: addressData.label,
  });

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .insert({
      account_id: userId,
      label: addressData.label || 'Home',
      name: addressData.full_name || addressData.name || 'Home Address',
      street: addressData.street,
      details: jsonDetails,
      phone: addressData.phone,
      is_default: addressData.is_default,
      latitude: addressData.latitude ?? null,
      longitude: addressData.longitude ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error('[addresses/POST] error:', error);
    return err('Failed to create address', 500);
  }

  return ok(formatAddressRow(data), 201);
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/addresses
// ─────────────────────────────────────────────────────────────────────────────
const UpdateAddressSchema = AddressSchema.partial().extend({
  id: z.string().uuid(),
});

export async function PATCH(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const parsed = await parseBody(req, UpdateAddressSchema);
  if (parsed instanceof Response) return parsed;
  const { id, ...updates } = parsed.data;

  if (updates.is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('account_id', userId);
  }

  // Read existing address record to merge details if needed
  const { data: existing } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', id)
    .eq('account_id', userId)
    .maybeSingle();

  if (!existing) {
    return err('Address not found or permission denied', 404);
  }

  const currentDecoded = decodeDetails(existing.details);

  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.full_name !== undefined) dbUpdates.name = updates.full_name;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.street !== undefined) dbUpdates.street = updates.street;
  if (updates.label !== undefined) dbUpdates.label = updates.label;
  if (updates.is_default !== undefined) dbUpdates.is_default = updates.is_default;
  if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
  if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;

  // Re-encode details if any component changed
  if (
    updates.city !== undefined ||
    updates.district !== undefined ||
    updates.province !== undefined ||
    updates.landmark !== undefined ||
    updates.details !== undefined ||
    updates.label !== undefined
  ) {
    dbUpdates.details = encodeDetails({
      details: updates.details !== undefined ? updates.details : currentDecoded.summary,
      landmark: updates.landmark !== undefined ? updates.landmark : currentDecoded.landmark,
      city: updates.city !== undefined ? updates.city : currentDecoded.city,
      district: updates.district !== undefined ? updates.district : currentDecoded.district,
      province: updates.province !== undefined ? updates.province : currentDecoded.province,
      label: updates.label !== undefined ? updates.label : (existing.label || currentDecoded.label),
    });
  }

  const { data, error } = await supabaseAdmin
    .from('addresses')
    .update(dbUpdates)
    .eq('id', id)
    .eq('account_id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('[addresses/PATCH] error:', error);
    return err('Failed to update address', 500);
  }

  return ok(formatAddressRow(data));
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/addresses
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  if (req.method === 'OPTIONS') return handleOptions();

  const auth = await requireAuth(req);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const url = new URL(req.url);
  const address_id = url.searchParams.get('id');

  if (!address_id) {
    return err('Missing id parameter', 400);
  }

  const { error } = await supabaseAdmin
    .from('addresses')
    .delete()
    .eq('id', address_id)
    .eq('account_id', userId);

  if (error) {
    console.error('[addresses/DELETE] error:', error);
    return err('Failed to delete address', 500);
  }

  return ok({ message: 'Address deleted' });
}

export async function OPTIONS() {
  return handleOptions();
}
