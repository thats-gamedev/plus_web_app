"use client"

import dynamic from "next/dynamic"

// The site's 3D scenes, each in its own client bundle: three.js and the
// models load after the page has painted and never run on the server.

/** The fight on the landing page's stats strip. */
export const FightersScene = dynamic(() => import("@/components/landing/fighters-scene"), { ssr: false })
/** The barbarian's comeback on the closing CTA band. */
export const ComebackScene = dynamic(() => import("@/components/landing/comeback-scene"), { ssr: false })
/** Code Your Hero's dash demo. */
export const DashScene = dynamic(() => import("@/components/landing/dash-scene"), { ssr: false })
/** The 404 page's lost barbarian. */
export const LostScene = dynamic(() => import("@/components/shared/lost-scene"), { ssr: false })
