import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: static shells prerender, and anything reading cookies
  // (the Supabase session) streams in behind <Suspense>. Cache shared data
  // such as the Fourthwall catalog with "use cache" + cacheLife.
  cacheComponents: true,
  images: {
    remotePatterns: [
      // Library covers come from the public `covers` storage bucket.
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL
        ? [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/**`)]
        : []),
      // The auth pages' picture (components/auth/auth-art.tsx).
      new URL("https://images.unsplash.com/**"),
    ],
  },
};

export default nextConfig;
