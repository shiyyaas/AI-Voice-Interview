import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createServerSupabaseClient(authToken?: string): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
import type { Database } from '@/lib/supabase/types';

let cachedServerClient: SupabaseClient<Database> | null = null;

export function getSupabaseServerClient(): SupabaseClient<Database> {
  if (cachedServerClient) {
    return cachedServerClient;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://placeholder-project.supabase.co';

  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-anon-key';

  cachedServerClient = createClient<Database>(supabaseUrl, supabaseKey, {
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

  return client;
  });

  return cachedServerClient;
}
