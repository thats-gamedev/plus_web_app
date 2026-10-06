import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Styleguide } from "./styleguide"

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } }

// Dev-only overview of every UI primitive, to compare against the mockups.
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound()
  return <Styleguide />
}
