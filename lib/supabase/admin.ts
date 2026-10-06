import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"
import { supabaseUrl } from "./env"

/**
 * Supabase client with the secret key: bypasses RLS. Only for the Stripe
 * webhook, cron jobs and admin actions, and only after requireAdmin() or a
 * signature/secret check.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) throw new Error("Missing SUPABASE_SECRET_KEY in the server environment.")

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
