import { supabaseUrl } from "@/lib/supabase/env"

/** Public URL of an image in the `covers` bucket (public read, admins write). */
export function coverUrl(path: string): string {
  const encoded = path.split("/").map(encodeURIComponent).join("/")
  return `${supabaseUrl}/storage/v1/object/public/covers/${encoded}`
}
