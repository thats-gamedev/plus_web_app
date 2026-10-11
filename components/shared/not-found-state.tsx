import { LostLevel } from "@/components/shared/lost-level"

/** The 404 body for public pages and unknown URLs. */
export function NotFoundState() {
  return <LostLevel primary={{ href: "/", label: "Respawn at the start" }} secondary={{ href: "/login", label: "Log in" }} />
}
