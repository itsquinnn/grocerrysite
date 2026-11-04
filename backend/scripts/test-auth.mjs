import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, '../.env.local');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const [k, ...v] = l.trim().split('=');
      return [k, v.join('=')];
    })
);

const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);

const { data: users } = await adminClient.auth.admin.listUsers();
console.log('Users in auth.users:', users?.users?.map(u => ({ id: u.id, email: u.email })));

const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
  email: 'admin@dovan.com',
  password: 'Admin@123456',
});

if (signInError) {
  console.log('Sign in error:', signInError.message);
} else {
  console.log('✅ Sign in SUCCESS! User ID:', signInData.user.id);
  
  // Check has_role RPC
  const { data: roleCheck, error: rpcError } = await adminClient.rpc('has_role', {
    _user_id: signInData.user.id,
    _role: 'admin',
  });
  console.log('has_role RPC:', roleCheck, rpcError?.message || '');
}
