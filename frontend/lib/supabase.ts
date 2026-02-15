import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set."
  );
}

/**
 * Supabase client for browser-side usage.
 *
 * Uses the **anon key** (public, safe to expose in the browser).
 * For server-side / admin operations, use the service_role key
 * in the backend only.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
