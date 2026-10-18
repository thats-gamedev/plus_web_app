"use client"

import { Suspense, createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useThree } from "@react-three/fiber"
import { cn } from "cn"

// The frame around every 3D scene on the site: an orthographic canvas that
//
//  - is only created once the stage comes near the screen, and fades in when
//    the scene says it's ready (models loaded),
//  - starts the scene's clock once its start line is well in view (started),
//    then runs while any of it is on screen (so scrolling never freezes a
//    scene mid-move) and pauses while it's off screen,
//  - gives "reduce motion" visitors a still picture (useStage().still),
//  - lets clicks through to the page underneath,
//  - keeps the characters' size fixed (pxPerUnit), whatever its height.

type StageState = { still: boolean; ready: () => void }

const StageContext = createContext<StageState>({ still: false, ready: () => {} })

/** For scenes: whether to hold still, and a callback for when they've loaded. */
export const useStage = () => useContext(StageContext)

const isLg = () => window.matchMedia("(min-width: 1024px)").matches

/** Pixels per world unit: one value, or { lg, sm } for desktop and smaller screens. */
export type Scale = number | { lg: number; sm: number }

function Fit({ scale }: { scale: Scale }) {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.zoom = typeof scale === "number" ? scale : isLg() ? scale.lg : scale.sm
    camera.updateProjectionMatrix()
  }, [camera, scale, size.width, size.height])
  return null
}

export function Stage({
  scale,
  startLine,
  clipping = false,
  className,
  style,
  children,
}: {
  scale: Scale
  /** Where the start line sits, in px from the stage's top (default: its bottom edge). */
  startLine?: number
  /** Turns on clipping planes (for a character climbing out from behind something). */
  clipping?: boolean
  className?: string
  style?: React.CSSProperties
  children: React.ReactNode
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [started, setStarted] = useState(false)
  const [onScreen, setOnScreen] = useState(false)
  const [still, setStill] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const state = useMemo(() => ({ still, ready: () => setLoaded(true) }), [still])

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setStill(motion.matches)
    update()
    motion.addEventListener("change", update)
    const approach = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "400px 0px" })
    const start = new IntersectionObserver(([e]) => e.isIntersecting && setStarted(true), { rootMargin: "0px 0px -15% 0px" })
    const screen = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    if (wrapper.current) {
      approach.observe(wrapper.current)
      screen.observe(wrapper.current)
    }
    if (line.current) start.observe(line.current)
    return () => {
      motion.removeEventListener("change", update)
      approach.disconnect()
      start.disconnect()
      screen.disconnect()
    }
  }, [])

  return (
    <div
      ref={wrapper}
      aria-hidden
      className={cn("pointer-events-none transition-opacity duration-500", className)}
      style={{ ...style, opacity: loaded ? 1 : 0 }}
    >
      <div ref={line} className="absolute inset-x-0 h-px" style={startLine === undefined ? { bottom: 0 } : { top: startLine }} />
      {near && (
        <Canvas
          orthographic
          // Capped: the stages can be large, and the low-poly models barely show it.
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 10], zoom: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
          frameloop={still ? "demand" : started && onScreen ? "always" : "never"}
          onCreated={({ gl }) => void (gl.localClippingEnabled = clipping)}
          fallback={null}
          // r3f sets pointer-events: auto on its container, which would let the
          // (transparent) stage swallow clicks on the page underneath.
          style={{ pointerEvents: "none" }}
        >
          <Fit scale={scale} />
          <hemisphereLight args={["#ffffff", "#bdb6ab", 2]} />
          <directionalLight position={[3, 5, 6]} intensity={2.2} />
          <StageContext.Provider value={state}>
            <Suspense fallback={null}>{children}</Suspense>
          </StageContext.Provider>
        </Canvas>
      )}
    </div>
  )
}
