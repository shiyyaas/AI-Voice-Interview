import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export function getSupabaseServerClient(authToken?: string): SupabaseClient<Database> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder-project.supabase.co';

  // Explicit condition: Use the Anon key when a user token is provided to trigger RLS.
  // Otherwise, safely fallback to the high-privilege Service Role Key for webhooks.
  const supabaseKey = authToken
    ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key')
    : (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key');

  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {},
    },
  });
}
