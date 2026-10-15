import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Validates that both Supabase URL and publishable key are set.
 * Throws a descriptive error when either is missing so that callers
 * can distinguish configuration errors from network errors.
 */
function assertConfig(): void {
  if (!supabaseUrl) {
    throw new Error(
      'VITE_SUPABASE_URL is not set. Create .env.local with valid Supabase credentials.'
    );
  }
  if (!supabaseKey) {
    throw new Error(
      'VITE_SUPABASE_PUBLISHABLE_KEY is not set. Create .env.local with valid Supabase credentials.'
    );
  }
}

/**
 * Creates a Supabase client configured for the frontend.
 * Uses the anon (publishable) key — never the service_role key.
 *
 * @returns Supabase client typed against the full Database schema.
 * @throws Error when environment variables are missing.
 */
export function createSupabaseClient() {
  assertConfig();
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });
}

/**
 * Type alias for the client instance returned by createSupabaseClient.
 */
export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

/**
 * Lazy-loaded Supabase client singleton.
 * The client is instantiated only when first accessed,
 * which allows the application to render even when
 * credentials are missing (the error surfaces on first API call).
 */
let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}
