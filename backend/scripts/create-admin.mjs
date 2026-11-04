import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '..', '.env.local'),
  path.resolve(process.cwd(), 'backend', '.env.local'),
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '.env.local'),
];

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      const key = k.trim();
      const val = v.join('=').trim();
      if (key === 'SUPABASE_URL' && !supabaseUrl) supabaseUrl = val;
      if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !supabaseServiceKey) supabaseServiceKey = val;
    }
    if (supabaseUrl && supabaseServiceKey) {
      console.log(`[info] Loaded credentials from: ${p}`);
      break;
    }
  }
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@dovan.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const name = process.env.ADMIN_NAME || 'Dovan Administrator';
  const username = process.env.ADMIN_USERNAME || 'admin';

  console.log(`[1] Hashing password for ${email}...`);
  const passwordHash = await bcrypt.hash(password, 10);

  console.log('[2] Checking existing account in public.accounts...');
  const { data: existingAccount } = await supabaseAdmin
    .from('accounts')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  let accountId;

  if (existingAccount) {
    accountId = existingAccount.id;
    console.log(`[2] Found existing account: ${accountId}. Updating credentials and role...`);
    const { error: updateErr } = await supabaseAdmin
      .from('accounts')
      .update({
        password_hash: passwordHash,
        name: name,
        username: username,
        role: 'admin',
        status: 'active',
        referral_code: 'AEROADMIN',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    if (updateErr) throw updateErr;
  } else {
    console.log('[2] Inserting new account into public.accounts with role admin...');
    const { data: newAccount, error: createErr } = await supabaseAdmin
      .from('accounts')
      .insert({
        email: email,
        username: username,
        password_hash: passwordHash,
        name: name,
        role: 'admin',
        status: 'active',
        referral_code: 'AEROADMIN',
      })
      .select('id')
      .single();

    if (createErr) throw createErr;
    accountId = newAccount.id;
  }

  // Set up active master OTP (123456)
  console.log('[3] Registering active login OTP (123456)...');
  await supabaseAdmin
    .from('otp_requests')
    .delete()
    .eq('email', email.toLowerCase())
    .eq('purpose', 'login');

  const oneMonthAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const codeHash = crypto.createHash('sha256').update('123456').digest('hex');
  await supabaseAdmin
    .from('otp_requests')
    .insert({
      account_id: accountId,
      email: email.toLowerCase(),
      purpose: 'login',
      code_hash: codeHash,
      attempt_count: 0,
      max_attempts: 999,
      expires_at: oneMonthAhead,
    });

  // Ensure Supabase Auth user exists for frontend login
  console.log('[4] Ensuring auth.users identity for frontend web login...');
  try {
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let authUserId;
    if (!existingAuthUser) {
      const { data: newAuthUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' },
      });
      if (authErr) console.warn('   Note on Supabase Auth create:', authErr.message);
      else authUserId = newAuthUser?.user?.id;
    } else {
      authUserId = existingAuthUser.id;
      await supabaseAdmin.auth.admin.updateUserById(authUserId, {
        password,
        email_confirm: true,
        user_metadata: { name, role: 'admin' },
      });
    }

    if (authUserId) {
      const { error: roleErr } = await supabaseAdmin
        .from('user_roles')
        .upsert({ user_id: authUserId, role: 'admin' }, { onConflict: 'user_id,role' });
      if (!roleErr) console.log('   Assigned admin role to auth user.');
    }
  } catch (err) {
    console.warn('   Supabase Auth provisioning note:', err.message);
  }

  console.log('✅ Admin Account provisioning complete!');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Master OTP: 123456`);
}

main().catch(err => {
  console.error('Error creating admin account:', err);
  process.exit(1);
});
