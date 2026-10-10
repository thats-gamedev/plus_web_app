"use client"

import { MotionConfig, motion, type Variants } from "motion/react"
import { useMediaQuery } from "@/lib/use-media-query"

// Motion for the landing page. The sections stay server components and wrap
// their parts in these. Everything respects the visitor's "reduce motion"
// setting (MotionConfig reducedMotion="user"): then elements appear without
// moving.

const EASE = [0.22, 1, 0.36, 1] as const

export function LandingMotion({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

// The hero heading is the page's largest paint (LCP): it only moves, it
// never starts invisible, so it doesn't count as painted late.
const riseOnly: Variants = {
  hidden: { y: 16 },
  show: { y: 0, transition: { duration: 0.6, ease: EASE } },
}

const container = (stagger: number, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

/** Fades a block up as it scrolls into view (once). */
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -80px 0px" }}
    >
      {children}
    </motion.div>
  )
}

type Tag = "div" | "ul" | "ol"

/**
 * Shows its StaggerItem children one after another: on page load ("mount",
 * the hero) or when scrolled into view ("view", everything else).
 */
export function Stagger({
  children,
  className,
  as = "div",
  when = "view",
  stagger = 0.08,
  delay = 0,
  ...rest
}: {
  children: React.ReactNode
  className?: string
  as?: Tag
  when?: "mount" | "view"
  stagger?: number
  delay?: number
} & Pick<React.AriaAttributes, "aria-label">) {
  const Component = motion[as]
  const trigger = when === "mount" ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -80px 0px" } }
  return (
    <Component className={className} variants={container(stagger, delay)} initial="hidden" {...trigger} {...rest}>
      {children}
    </Component>
  )
}

export function StaggerItem({
  children,
  className,
  as = "div",
  variant = "fadeUp",
}: {
  children: React.ReactNode
  className?: string
  as?: "div" | "li"
  variant?: "fadeUp" | "riseOnly"
}) {
  const Component = motion[as]
  return (
    <Component className={className} variants={variant === "riseOnly" ? riseOnly : fadeUp}>
      {children}
    </Component>
  )
}

/**
 * A hero card (LW1): slides in from the right into its tilt on desktop,
 * straightens and lifts on hover. Phones get no tilt, as in LM1.
 */
export function HeroCard({ children, className, index, tilt }: { children: React.ReactNode; className?: string; index: number; tilt: number }) {
  const desktop = useMediaQuery("(min-width: 1024px)")
  const rotate = desktop ? tilt : 0
  return (
    <motion.li
      className={className}
      initial={{ opacity: 0, x: 48, rotate: 0 }}
      animate={{ opacity: 1, x: 0, rotate, transition: { duration: 0.7, ease: EASE, delay: 0.25 + index * 0.12 } }}
      whileHover={desktop ? { rotate: 0, y: -4, transition: { duration: 0.25, ease: EASE } } : undefined}
    >
      {children}
    </motion.li>
  )
}
