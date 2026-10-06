import { fileURLToPath } from "node:url"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

// RLS tests against the Supabase dev project (see supabase/tests).
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["supabase/tests/**/*.test.ts"],
    env: loadEnv("development", process.cwd(), ""),
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
})
