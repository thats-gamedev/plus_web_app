import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "./database.types"
import { supabasePublishableKey, supabaseUrl } from "./env"

/** Supabase client for Client Components (publishable key, RLS applies). */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey)
}
