import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./database.types"
import { supabasePublishableKey, supabaseUrl } from "./env"

/**
 * Supabase client for Server Components, Server Actions and Route Handlers,
 * acting as the signed-in user (cookie session, RLS applies).
 * Create one per request; never share it between requests.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Server Components can't set cookies. The proxy refreshes the
          // session on every request, so this is safe to ignore there.
        }
      },
    },
  })
}
