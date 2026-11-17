import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

// Server-only Supabase client. It uses the SECRET key, so it must never be
// imported into a client component. All database access goes through our API.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
      auth: { persistSession: false },
    });
  }
  return client;
}
