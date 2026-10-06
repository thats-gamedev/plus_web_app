import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    // RLS tests need the dev database; run them with `npm run test:rls`.
    exclude: ["node_modules/**", ".next/**", "supabase/tests/**"],
  },
})
