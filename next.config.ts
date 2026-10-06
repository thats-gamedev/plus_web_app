import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: static shells prerender, and anything reading cookies
  // (the Supabase session) streams in behind <Suspense>. Cache shared data
  // such as the Fourthwall catalog with "use cache" + cacheLife.
  cacheComponents: true,
};

export default nextConfig;
