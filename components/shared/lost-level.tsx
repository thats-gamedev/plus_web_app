"use client"

import Link from "next/link"
import { useState } from "react"
import { MotionConfig, motion } from "motion/react"
import { buttonVariants } from "@/components/ui/button"
import { LostScene } from "@/components/three/scenes"

// The game engine's "missing texture": magenta and black checks.
const CHECKER = "repeating-conic-gradient(#ff00dc 0 25%, #121212 0 50%) 0 0 / 22px 22px"

/**
 * The 404 page: a "level not found" screen where the 0 of 404 is the
 * missing-texture checkerboard every game developer knows. Clicking it
 * "loads" the texture. Only transforms animate, so nothing is invisible in
 * the server HTML, and "reduce motion" keeps everything still.
 */
export function LostLevel({
  primary,
  secondary,
}: {
  primary: { href: string; label: string }
  secondary: { href: string; label: string }
}) {
  const [found, setFound] = useState(false)

  return (
    <MotionConfig reducedMotion="user">
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
        <div className="relative overflow-hidden rounded-[28px] bg-ink px-5 pt-5 text-white md:px-8 md:pt-6">
          {/* A faint pixel grid, like an empty editor viewport. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:28px_28px]"
          />

          <div className="relative flex items-center justify-between gap-4 font-mono text-[11px] tracking-wide md:text-xs">
            <span className="text-brand">ERR · LEVEL_NOT_FOUND</span>
            <span className="text-ink-muted">SCORE 000404</span>
          </div>

          <div
            aria-hidden
            className="relative mt-6 flex items-center justify-center gap-3 text-[104px] leading-none font-bold tracking-tighter select-none md:mt-8 md:gap-5 md:text-[152px]"
          >
            <motion.span
              className="[text-shadow:5px_5px_0_var(--brand)]"
              initial={{ y: -28, rotate: -10 }}
              animate={{ y: 0, rotate: -6 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
            >
              4
            </motion.span>

            <motion.button
              type="button"
              onClick={() => setFound((f) => !f)}
              aria-label={found ? "Unload the texture" : "Load the missing texture"}
              className="relative h-[0.78em] w-[0.6em] cursor-pointer overflow-hidden rounded-[0.16em] ring-4 ring-white/90 outline-none focus-visible:ring-brand"
              style={{ background: found ? "var(--brand)" : CHECKER }}
              animate={{ y: [0, -10, 0], rotate: [4, -3, 4] }}
              transition={{ duration: 3.2, ease: "easeInOut", repeat: Infinity }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
            >
              {found && (
                <motion.span
                  initial={{ scale: 0.4, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 320, damping: 16 }}
                  className="absolute inset-0 flex items-center justify-center text-[0.22em] font-bold text-white"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>

            <motion.span
              className="[text-shadow:5px_5px_0_var(--brand)]"
              initial={{ y: -28, rotate: 10 }}
              animate={{ y: 0, rotate: 5 }}
              transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.08 }}
            >
              4
            </motion.span>
          </div>

          <p className="relative mt-6 text-center font-mono text-xs text-ink-muted" aria-live="polite">
            {found ? "texture loaded. the page is still missing." : "missing_texture.png · click to load"}
          </p>

          {/* The barbarian from the landing page, sitting on the level's floor (the card's bottom edge). */}
          <div className="relative -mx-5 mt-2 h-[140px] md:-mx-8 md:h-[170px]">
            <LostScene />
          </div>
        </div>

        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">This level doesn&apos;t exist.</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            This page got knocked off the strip, or it was never shipped. No progress was lost.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href={primary.href} className={buttonVariants({ size: "lg" })}>
              {primary.label}
            </Link>
            <Link href={secondary.href} className={buttonVariants({ variant: "outline", size: "lg" })}>
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </MotionConfig>
  )
}
