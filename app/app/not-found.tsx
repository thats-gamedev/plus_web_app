import { LostLevel } from "@/components/shared/lost-level"

// Missing pages inside the member area (e.g. an unpublished or mistyped
// library slug) keep the member shell instead of the bare default 404.
export default function MemberNotFound() {
  return <LostLevel primary={{ href: "/app", label: "Respawn at Home" }} secondary={{ href: "/app/library", label: "Open the library" }} />
}
