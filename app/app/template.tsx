import { PageTransition } from "@/components/ui/motion"

// Re-mounted on every navigation inside /app, unlike the layout, so each
// page fades in (components/ui/motion.tsx).
export default function MemberTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
