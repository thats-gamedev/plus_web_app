"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Plane, Vector3, type Group, type Material, type Mesh, type Object3D } from "three"
import {
  BARBARIAN,
  animate,
  facing,
  jolt,
  measureBox,
  play,
  step,
  stuckPose,
  useCharacters,
  type Box,
} from "@/components/three/kaykit"
import { Stage, useStage } from "@/components/three/stage"

// The barbarian's comeback (loaded lazily by ./scenes): knocked off the strip
// at the top of the page (./fighters-scene), he climbs back up over the top
// edge of the closing CTA band, shakes it off, and throws his axe into the
// band's join button, where it sticks. Played once when the band comes into
// view; "reduce motion" gets the last picture.
//
// The stage spans the page width, from ABOVE px over the band's top edge (the
// ground, y = 0) down past its join button: he stands on the band, the axe
// flies down into it. While he climbs, a clipping plane hides whatever of him
// is still below the edge, so he comes out from behind the band.

/** The characters' scale, as on the strip, in px per world unit. */
const SCALE = { lg: 220 / 3.1, sm: 170 / 3.1 }
/** How far the stage reaches above the band's top edge (px). */
const ABOVE = { lg: 240, sm: 190 }
/** And below the join button (px). */
const BELOW_BUTTON = 24

// The climb
const CLIMB_FROM = -2.8
const CLIMB_TIME = 0.9
const CLIMB_HEIGHT = 1.3
// The throw
/** Where he stands: this far left of the button's middle. */
const STAND_OFFSET = 2.3
const SHAKE_AT = 0.7 // after landing
const THROW_AT = 1.9 // after landing
const RELEASE_AT = 0.32 // into the overhead chop
const FLIGHT_BASE = 0.42
const FLIGHT_PER_UNIT = 0.03
const SPINS = 1.5
/** How the axe sticks: the edge in the button's top edge, the handle up and to the right. */
const STICK_TILT = -0.6
/** Near the button's right end and not too deep, so the axe head stays clear of the label. */
const STICK_AT = { across: 0.47, down: 0.45 }
const THROWN_SCALE = 1.0
/** The axe's edge, the point that bites, in its own x/y before scaling (its head sits to the left at the top of the handle). */
const AXE_EDGE = { x: -0.55, y: 0.78 }

const JOIN = "[data-cta-join]"

type Layout = { width: number; standX: number; button: Box }

const isLg = () => window.matchMedia("(min-width: 1024px)").matches

type Phase = "climb" | "land" | "throw" | "done"

function Comeback() {
  const { still, ready } = useStage()
  const [b] = useCharacters([BARBARIAN])
  const { camera, gl, size } = useThree()
  const ground = useRef<Group>(null)

  const { barbarian, axes, edge } = useMemo(() => {
    // His own materials, so the clipping plane doesn't reach the other scenes'
    // barbarian. Once only: React may run this twice (Strict Mode), and the
    // plane we move must be the one the materials hold.
    let edge = b.root.userData.edge as Plane | undefined
    if (!edge) {
      const plane = new Plane(new Vector3(0, 1, 0), 0)
      b.root.traverse((o) => {
        const mesh = o as Mesh
        if (!mesh.isMesh) return
        mesh.material = (mesh.material as Material).clone()
        ;(mesh.material as Material).clippingPlanes = [plane]
      })
      edge = b.root.userData.edge = plane
    }
    const held = b.root.getObjectByName("1H_Axe") as Object3D
    const thrown = held.clone()
    thrown.visible = false
    thrown.position.set(0, 0, 0)
    thrown.rotation.set(0, 0, 0)
    return { barbarian: animate(b.root, b.clips, "Jump_Idle"), axes: { held, thrown }, edge }
  }, [b])

  useEffect(ready, [ready])

  const show = useRef({
    phase: "climb" as Phase,
    started: -1,
    clock: 0,
    layout: null as Layout | null,
    measuredAt: -Infinity,
    shook: false,
    swung: false,
    flight: null as null | { from: Vector3; at: number; duration: number; scale: number },
    hit: false,
    hitAt: 0,
  })

  useFrame((_, rawDelta) => {
    const s = show.current
    const delta = still ? 0 : Math.min(rawDelta, 0.1)
    s.clock += delta
    const t = s.clock
    const zoom = camera.zoom
    const abovePx = isLg() ? ABOVE.lg : ABOVE.sm
    // World y = 0 is the canvas's middle; the ground is abovePx below its top.
    const groundY = (size.height / 2 - abovePx) / zoom
    if (ground.current) ground.current.position.y = groundY

    if (!s.layout || t - s.measuredAt > 0.5 || still) {
      const width = size.width / zoom
      const button = measureBox(gl.domElement, zoom, abovePx, document.querySelector(JOIN)) ?? { x: 0, top: -2, width: 3, height: 0.7 }
      const side = width / 2 - 0.9
      s.layout = { width, standX: Math.min(side, Math.max(-side, button.x - STAND_OFFSET)), button }
      s.measuredAt = t
    }
    const layout = s.layout
    const edgeOf = () => ({ x: AXE_EDGE.x * (s.flight?.scale ?? 1), y: AXE_EDGE.y * (s.flight?.scale ?? 1) })

    if (s.started < 0) s.started = t
    if (still && s.phase !== "done") {
      // Skip to the end: standing on the band, the axe in the button.
      play(barbarian, "Idle", 0)
      axes.held.visible = false
      axes.thrown.visible = true
      const scale = Math.abs(axes.held.getWorldScale(new Vector3()).y) * THROWN_SCALE
      axes.thrown.scale.setScalar(scale)
      s.flight = { from: new Vector3(), at: 0, duration: 0, scale }
      s.hit = true
      s.hitAt = -Infinity
      s.phase = "done"
    }
    const since = t - s.started
    barbarian.x = layout.standX

    if (s.phase === "climb") {
      // Up from behind the band, over its edge.
      const p = Math.min(1, since / CLIMB_TIME)
      barbarian.y = CLIMB_FROM * (1 - p) + 4 * CLIMB_HEIGHT * p * (1 - p)
      barbarian.targetTurn = barbarian.turn = 0
      if (p >= 1) {
        barbarian.y = 0
        play(barbarian, "Jump_Land", 0.05)
        s.phase = "land"
        s.started = t
      }
    } else if (s.phase === "land") {
      // Shake it off, then turn to the button.
      if (since > SHAKE_AT && !s.shook) {
        s.shook = true
        play(barbarian, "Hit_A")
      }
      if (since > THROW_AT - 0.4) barbarian.targetTurn = facing(1)
      if (since > THROW_AT) {
        s.phase = "throw"
        s.started = t
      }
    } else if (s.phase === "throw") {
      if (!s.swung) {
        s.swung = true
        play(barbarian, "1H_Melee_Attack_Chop", 0.1)
      }
      if (!s.flight && ground.current && since > RELEASE_AT) {
        const scale = Math.abs(axes.held.getWorldScale(new Vector3()).y) * THROWN_SCALE
        const from = ground.current.worldToLocal(axes.held.getWorldPosition(new Vector3()))
        s.flight = { from, at: t, duration: 0, scale }
        const end = stuckPose(layout.button, edgeOf(), STICK_AT, STICK_TILT)
        s.flight.duration = FLIGHT_BASE + Math.hypot(end.x - from.x, end.y - from.y) * FLIGHT_PER_UNIT
        axes.held.visible = false
        axes.thrown.visible = true
        axes.thrown.scale.setScalar(scale)
      }
      if (s.hit && t - s.hitAt > 0.3) {
        play(barbarian, "Cheer")
        barbarian.targetTurn = 0
        s.phase = "done"
      }
    }

    // The clipping plane keeps what's above the edge while he climbs, then drops
    // well out of the way (a huge offset loses precision and clips his feet).
    edge.constant = s.phase === "climb" ? -groundY : -(groundY - 20)

    // The thrown axe: in the air, then stuck in the button (following it if the page reflows).
    if (s.flight) {
      const end = stuckPose(layout.button, edgeOf(), STICK_AT, STICK_TILT)
      const p = s.flight.duration > 0 ? Math.min(1, (t - s.flight.at) / s.flight.duration) : 1
      const { thrown } = axes
      if (p < 1) {
        const arc = 0.25 * Math.hypot(end.x - s.flight.from.x, end.y - s.flight.from.y)
        thrown.position.set(
          s.flight.from.x + (end.x - s.flight.from.x) * p,
          s.flight.from.y + (end.y - s.flight.from.y) * p + 4 * arc * p * (1 - p),
          0.5
        )
        thrown.rotation.z = (end.angle - SPINS * 2 * Math.PI) * p
      } else {
        if (!s.hit) {
          s.hit = true
          s.hitAt = t
          jolt(document.querySelector(JOIN))
        }
        const quivering = t - s.hitAt
        const quiver = quivering < 1 ? Math.sin(quivering * 45) * 0.12 * Math.exp(-quivering * 5) : 0
        thrown.position.set(end.x, end.y, 0.5)
        thrown.rotation.z = end.angle + quiver
      }
    }

    step([barbarian], delta, still)
  })

  return (
    <group ref={ground}>
      {/* Mirrored, like on the strip, so his weapon hand faces the camera. */}
      <primitive object={barbarian.root} scale={[-1, 1, 1]} />
      <primitive object={axes.thrown} />
    </group>
  )
}

export default function ComebackScene() {
  const wrapper = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<{ above: number; height: number }>()

  useEffect(() => {
    // From ABOVE px over the band's top edge down past its join button.
    const fit = () => {
      const band = wrapper.current?.parentElement?.getBoundingClientRect()
      const button = document.querySelector(JOIN)?.getBoundingClientRect()
      const above = isLg() ? ABOVE.lg : ABOVE.sm
      if (band && button) setFrame({ above, height: Math.round(above + button.bottom - band.top + BELOW_BUTTON) })
    }
    fit()
    const resize = new ResizeObserver(fit)
    resize.observe(document.body)
    return () => resize.disconnect()
  }, [])

  return (
    <div ref={wrapper} className="pointer-events-none absolute inset-x-0" style={{ top: -(frame?.above ?? 0), height: frame?.height ?? 0 }}>
      {frame && (
        <Stage scale={SCALE} startLine={frame.above} clipping className="absolute inset-0">
          <Comeback />
        </Stage>
      )}
    </div>
  )
}
