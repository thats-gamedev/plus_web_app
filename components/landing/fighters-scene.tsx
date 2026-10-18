"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Vector3, type Group, type Mesh, type Object3D } from "three"
import {
  BARBARIAN,
  KNIGHT,
  animate,
  facing,
  jolt,
  measureBox,
  play,
  playing,
  step,
  stuckPose,
  useCharacters,
  type Box,
} from "@/components/three/kaykit"
import { Stage, useStage } from "@/components/three/stage"

// A knight and a barbarian on top of the dark stats strip, played once when
// the strip first comes into view (loaded lazily by ./scenes):
//
//   1. Both run in from the screen edges and leap into place under the hero cards.
//   2. They trade blows; the knight lands the last one.
//   3. The barbarian is knocked off the strip and falls behind it (he's back
//      at the bottom of the page: ./comeback-scene).
//   4. The knight walks over to the join button and throws his sword at it.
//      It sticks in the button's top edge and stays there; the knight cheers.
//
// Visitors with "reduce motion" get the last picture: the sword in the button.
// The stage spans the page width, stands on the strip's top edge (anything
// below y = 0 is hidden behind the strip) and reaches up past the join
// button, so the sword can fly to it.

/** The characters' scale, in px per world unit (they're about 2.4 tall). */
const SCALE = { lg: 220 / 3.1, sm: 170 / 3.1 }
/** The stage is at least this tall (px), and reaches this far above the join button. */
const STAGE_PX = { lg: 220, sm: 170 }
const ABOVE_BUTTON_PX = 190
/** Distance from the middle of the fight to each fighter. */
const APART = 1.12

// Entrance
const RUN_SPEED = 4.2
const JUMP_LENGTH = 2.2
const JUMP_TIME = 0.7
const JUMP_HEIGHT = 1.0
// Fight
const ATTACKS = ["1H_Melee_Attack_Chop", "1H_Melee_Attack_Slice_Diagonal", "1H_Melee_Attack_Slice_Horizontal"]
const ROUNDS = 5 // the knight attacks in even rounds, so he also gets the last one
const EXCHANGE = 1.6
const BLOCK_AT = 0.15
const HIT_AT = 0.42
const CLASH_AT = 0.45
// Knock-out
const GRAVITY = 9
// Finale: the throw
const WALK_SPEED = 1.9
/** Where the knight throws from: this far left of the button's middle. */
const THROW_OFFSET = 2.4
/** When the sword leaves his hand, into the overhead chop. */
const RELEASE_AT = 0.32
/** Flight time: a base plus a little per world unit travelled. */
const FLIGHT_BASE = 0.5
const FLIGHT_PER_UNIT = 0.03
/** Full end-over-end turns in the air. */
const SPINS = 2
/** How the sword sticks: leaning with the handle up and to the right, over the empty space beside the hero text. */
const STICK_TILT = -0.75
const STICK_AT = { across: 0.4, down: 0.8 }
/** The thrown sword is drawn a bit bigger than the one in his hand, so it reads well stuck in the button. */
const THROWN_SCALE = 1.2
/** The sword's tip, from its grip (its origin), along its own +y, before scaling. */
const SWORD_TIP = 1.41

const JOIN = "[data-join-cta]"

type Layout = { width: number; fightX: number; throwX: number; button: Box }

function measure(canvas: HTMLCanvasElement, zoom: number): Layout {
  const rect = canvas.getBoundingClientRect()
  const width = rect.width / zoom
  const cards = measureBox(canvas, zoom, rect.height, document.querySelector('[aria-label="Recently added"]'))
  const button = measureBox(canvas, zoom, rect.height, document.querySelector(JOIN)) ?? { x: 0, top: 4, width: 3, height: 0.7 }
  const edge = width / 2 - 0.9
  return {
    width,
    // The fight happens under the hero cards, the throw from below the button.
    fightX: cards ? cards.x : width / 4,
    throwX: Math.min(edge, Math.max(-edge, button.x - THROW_OFFSET)),
    button,
  }
}

const _v = new Vector3()

type Phase = "enter" | "fight" | "ko" | "walk" | "throw" | "done"

type Entrance = { startX: number; jumpX: number; landX: number; delay: number; runTime: number; landed: boolean }

function Fight() {
  const { still, ready } = useStage()
  const [k, b] = useCharacters([KNIGHT, BARBARIAN])
  const { camera, gl, size } = useThree()
  const ground = useRef<Group>(null)
  const spark = useRef<Mesh>(null)

  const { knight, barbarian, swords } = useMemo(() => {
    // The barbarian fights with a copy of the knight's sword instead of his axe.
    // (three drops the dots from node names: "handslot.r" loads as "handslotr".)
    const held = k.root.getObjectByName("1H_Sword") as Object3D
    const axe = b.root.getObjectByName("1H_Axe")
    if (axe) axe.visible = false
    const hand = b.root.getObjectByName("handslotr")
    if (hand && !hand.getObjectByName("1H_Sword")) hand.add(held.clone()) // once, even if React runs this twice
    // The knight's sword in his hand, and a copy of it that flies to the button.
    const thrown = held.clone()
    thrown.visible = false
    thrown.position.set(0, 0, 0)
    thrown.rotation.set(0, 0, 0)
    return { knight: animate(k.root, k.clips), barbarian: animate(b.root, b.clips), swords: { held, thrown } }
  }, [k, b])

  useEffect(ready, [ready])

  const show = useRef({
    phase: "enter" as Phase,
    started: -1, // phase start, on the show's clock
    clock: 0,
    layout: null as Layout | null,
    measuredAt: -Infinity,
    entrances: [] as Entrance[],
    round: -1,
    koVelocity: { x: 0, y: 0 },
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
    // World y = 0 is the canvas's middle; the ground (y = 0 in the scene) is
    // its bottom edge, where the strip starts.
    if (ground.current) ground.current.position.y = -size.height / camera.zoom / 2

    // Re-measure now and then: the page can reflow or resize.
    if (!s.layout || t - s.measuredAt > 0.5 || still) {
      s.layout = measure(gl.domElement, camera.zoom)
      s.measuredAt = t
    }
    const layout = s.layout
    const tip = () => ({ x: 0, y: SWORD_TIP * (s.flight?.scale ?? 1) })

    if (still && s.phase !== "done") {
      // Skip to the end: the sword in the button, the knight below it, the barbarian gone.
      barbarian.root.visible = false
      knight.x = layout.throwX
      knight.targetTurn = 0
      swords.held.visible = false
      swords.thrown.visible = true
      const scale = Math.abs(swords.held.getWorldScale(_v).y) * THROWN_SCALE
      swords.thrown.scale.setScalar(scale)
      s.flight = { from: new Vector3(), at: 0, duration: 0, scale }
      s.hit = true
      s.hitAt = -Infinity
      s.phase = "done"
      s.started = t
    }

    if (s.started < 0) {
      // Plan the entrance: both start off screen and land at the same moment.
      s.started = t
      const plans = [1, -1].map((dir) => {
        const startX = -dir * (layout.width / 2 + 1.5)
        const landX = layout.fightX - dir * APART
        const run = Math.max(0, Math.abs(landX - startX) - JUMP_LENGTH)
        return { startX, landX, jumpX: startX + dir * run, runTime: run / RUN_SPEED }
      })
      const longest = Math.max(...plans.map((p) => p.runTime))
      s.entrances = plans.map((p) => ({ ...p, delay: longest - p.runTime, landed: false }))
      play(knight, "Running_A", 0)
      play(barbarian, "Running_A", 0)
    }
    const since = t - s.started

    if (s.phase === "enter") {
      ;[knight, barbarian].forEach((f, i) => {
        const e = s.entrances[i]
        const dir = i === 0 ? 1 : -1
        const own = since - e.delay
        f.targetTurn = f.turn = facing(dir)
        if (own < e.runTime) {
          f.x = own < 0 ? e.startX : e.startX + dir * RUN_SPEED * own
          f.y = 0
        } else if (own < e.runTime + JUMP_TIME) {
          const p = (own - e.runTime) / JUMP_TIME
          if (playing(f) !== "Jump_Idle") play(f, "Jump_Idle", 0.1)
          f.x = e.jumpX + (e.landX - e.jumpX) * p
          f.y = 4 * JUMP_HEIGHT * p * (1 - p)
        } else {
          f.x = e.landX
          f.y = 0
          if (!e.landed) {
            e.landed = true
            play(f, "Jump_Land", 0.05)
          }
        }
      })
      const total = Math.max(...s.entrances.map((e) => e.delay + e.runTime + JUMP_TIME))
      if (since > total + 0.8) {
        s.phase = "fight"
        s.started = t
      }
    } else if (s.phase === "fight") {
      const round = Math.floor(since / EXCHANGE)
      const into = since - round * EXCHANGE
      const [attacker, defender] = round % 2 === 0 ? [knight, barbarian] : [barbarian, knight]
      const finalBlow = round === ROUNDS - 1
      // Once, the knight is too slow and takes a hit.
      const hit = finalBlow || round === ROUNDS - 2

      if (round !== s.round) {
        s.round = round
        play(attacker, ATTACKS[Math.floor(round / 2) % ATTACKS.length])
      }
      if (!hit && into >= BLOCK_AT && playing(defender) === "Idle") play(defender, "Block")
      if (hit && into >= HIT_AT && playing(defender) === "Idle") play(defender, finalBlow ? "Hit_B" : "Hit_A")

      if (spark.current) {
        const flash = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (into - CLASH_AT) / 0.16))))
        spark.current.visible = flash > 0.01
        spark.current.scale.setScalar(flash * 0.22)
        spark.current.rotation.z = t * 9
        spark.current.position.set(layout.fightX + (round % 2 === 0 ? 1 : -1) * 0.25, hit ? 1.5 : 1.35, 0.6)
      }

      if (finalBlow && into >= HIT_AT + 0.15) {
        s.phase = "ko"
        s.started = t
        s.koVelocity = { x: 2.4, y: 3.4 }
        play(barbarian, "Death_A", 0.1)
        if (spark.current) spark.current.visible = false
      }
    } else if (s.phase === "ko") {
      // The barbarian flies off backwards and drops below the strip's edge.
      if (barbarian.root.visible) {
        s.koVelocity.y -= GRAVITY * delta
        barbarian.x += s.koVelocity.x * delta
        barbarian.y += s.koVelocity.y * delta
        barbarian.root.rotation.z -= 3.2 * delta
        if (barbarian.y < -3) barbarian.root.visible = false
      }
      if (since > 1.2) {
        s.phase = "walk"
        s.started = t
      }
    } else if (s.phase === "walk") {
      const to = layout.throwX - knight.x
      if (Math.abs(to) > 0.08) {
        if (playing(knight) !== "Walking_A") play(knight, "Walking_A", 0.25)
        knight.targetTurn = facing(Math.sign(to))
        knight.x += Math.sign(to) * Math.min(Math.abs(to), WALK_SPEED * delta)
      } else {
        play(knight, "Idle", 0.25)
        s.phase = "throw"
        s.started = t
      }
    } else if (s.phase === "throw") {
      knight.x = layout.throwX
      knight.targetTurn = facing(1)
      // Turn to the button, then an overhead chop that lets go of the sword.
      if (since > 0.35 && !s.swung) {
        s.swung = true
        play(knight, "1H_Melee_Attack_Chop", 0.1)
      }
      if (s.swung && !s.flight && ground.current && since > 0.35 + RELEASE_AT) {
        const scale = Math.abs(swords.held.getWorldScale(_v).y) * THROWN_SCALE
        const from = ground.current.worldToLocal(swords.held.getWorldPosition(new Vector3()))
        s.flight = { from, at: t, duration: 0, scale }
        const end = stuckPose(layout.button, tip(), STICK_AT, STICK_TILT)
        s.flight.duration = FLIGHT_BASE + Math.hypot(end.x - from.x, end.y - from.y) * FLIGHT_PER_UNIT
        swords.held.visible = false
        swords.thrown.visible = true
        swords.thrown.scale.setScalar(scale)
      }
      if (s.hit && t - s.hitAt > 0.25) {
        play(knight, "Cheer")
        knight.targetTurn = 0
        s.phase = "done"
        s.started = t
      }
    }

    // The thrown sword: in the air, then stuck in the button (following it if the page reflows).
    if (s.flight) {
      const end = stuckPose(layout.button, tip(), STICK_AT, STICK_TILT)
      const p = s.flight.duration > 0 ? Math.min(1, (t - s.flight.at) / s.flight.duration) : 1
      const { thrown } = swords
      if (p < 1) {
        // An arc, spinning end over end (clockwise, as it flies to the right).
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
        // It quivers for a moment after it hits.
        const quivering = t - s.hitAt
        const quiver = quivering < 1 ? Math.sin(quivering * 45) * 0.12 * Math.exp(-quivering * 5) : 0
        thrown.position.set(end.x, end.y, 0.5)
        thrown.rotation.z = end.angle + quiver
      }
    }

    step([knight, barbarian], delta, still)
  })

  return (
    <group ref={ground}>
      {/* Mirrored (scale x -1, the materials are double-sided) so the sword hand faces the camera, not the shield. */}
      <primitive object={knight.root} scale={[-1, 1, 1]} />
      <primitive object={barbarian.root} scale={[-1, 1, 1]} />
      <primitive object={swords.thrown} />
      <mesh ref={spark} visible={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffe08a" />
      </mesh>
    </group>
  )
}

export default function FightersScene() {
  const wrapper = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number>()

  useEffect(() => {
    // The stage reaches from the strip up past the join button.
    const fit = () => {
      const bottom = wrapper.current?.getBoundingClientRect().bottom
      const button = document.querySelector(JOIN)?.getBoundingClientRect()
      const least = window.matchMedia("(min-width: 1024px)").matches ? STAGE_PX.lg : STAGE_PX.sm
      setHeight(bottom && button ? Math.max(least, Math.round(bottom - button.top + ABOVE_BUTTON_PX)) : least)
    }
    fit()
    const resize = new ResizeObserver(fit)
    resize.observe(document.body)
    return () => resize.disconnect()
  }, [])

  return (
    <div ref={wrapper} className="relative w-full" style={{ height }}>
      {height && (
        <Stage scale={SCALE} className="absolute inset-0">
          <Fight />
        </Stage>
      )}
    </div>
  )
}
