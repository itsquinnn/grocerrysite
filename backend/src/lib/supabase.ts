import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl) {
  console.warn(
    '[Supabase Config Warning] SUPABASE_URL is not set. Please configure it in .env.local.'
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    '[Supabase Admin Warning] SUPABASE_SERVICE_ROLE_KEY is not defined in environment or .env.local. ' +
    'Backend operations requiring elevated permissions will be limited until this is set.'
  );
}

/**
 * Server-side Supabase client.
 * Uses SERVICE ROLE key when available to bypass RLS in server routes.
 */
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-anon-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
