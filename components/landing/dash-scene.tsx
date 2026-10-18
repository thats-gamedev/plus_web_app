"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Color, type AnimationClip, type Group, type Mesh, type MeshStandardMaterial } from "three"
import { KNIGHT, animate, facing, play, step, useCharacters } from "@/components/three/kaykit"
import { Stage, useStage } from "@/components/three/stage"

// Code Your Hero's demo (loaded lazily by ./scenes, framed by ./dash-demo):
// the knight runs the Dash() snippet next to it, line by line. MoveBy(facing
// * d) rolls him across the little game window, SetInvulnerable(0.2f) makes
// him flash, and the next run he dashes back the other way. onStep tells the
// snippet which line to light up. "Reduce motion" keeps him standing still.

/** The knight's scale in the game window, in px per world unit (he's about 2.4 tall). */
const SCALE = { lg: 46, sm: 42 }
/** The ground line, in px up from the window's bottom edge (drawn by ./dash-demo). */
const GROUND_PX = 22
/** How far one dash goes, in world units (the d in Dash(float d)). */
const DISTANCE = 2.6

// One run of the snippet, in seconds: which line is lit (1–4, 0 for none) from when.
const LINES = [
  { line: 1, at: 0 }, // void Dash(float d) {
  { line: 2, at: 0.4 }, // MoveBy(facing * d);
  { line: 3, at: 1.05 }, // SetInvulnerable(0.2f);
  { line: 4, at: 1.75 }, // }
  { line: 0, at: 2.1 },
]
const RUN = 3.6
/** The dodge roll: the clip is 0.4 s; the move eases out over the same time. */
const DASH = { at: 0.45, time: 0.4 }
/** Invulnerable: soft white flashes. */
const FLASH = { at: 1.05, time: 0.6, count: 3 }
/** Turning around for the next run, slowly, while nothing else happens. */
const TURN_AT = 2.5
const TURN_SPEED = 4.5

const easeOut = (p: number) => 1 - (1 - p) ** 3

/**
 * The dodge clip moves the knight forward by itself (its root ends 0.25
 * forward) and snaps back when it ends. Here the scene does the moving, so
 * this copy keeps him in place: root and hips stay put across the ground.
 */
function inPlace(clip: AnimationClip) {
  const copy = clip.clone()
  for (const track of copy.tracks) {
    if (track.name !== "root.position" && track.name !== "hips.position") continue
    for (let i = 0; i < track.values.length; i += 3) {
      track.values[i] = 0 // x
      track.values[i + 2] = 0 // z (forward)
    }
  }
  return copy
}

function Dash({ onStep }: { onStep: (line: number) => void }) {
  const { still, ready } = useStage()
  const [k] = useCharacters([KNIGHT])
  const { camera, size } = useThree()
  const ground = useRef<Group>(null)

  const { knight, glow } = useMemo(() => {
    const clips = k.clips.map((clip) => (clip.name === "Dodge_Forward" ? inPlace(clip) : clip))
    // His own materials, so the invulnerable glow doesn't reach the other
    // scenes' knight. Once only: React may run this twice (Strict Mode).
    let glow = k.root.userData.glow as MeshStandardMaterial[] | undefined
    if (!glow) {
      glow = []
      k.root.traverse((o) => {
        const mesh = o as Mesh
        if (!mesh.isMesh) return
        const material = (mesh.material as MeshStandardMaterial).clone()
        material.emissive = new Color("#ffffff")
        material.emissiveIntensity = 0
        mesh.material = material
        glow!.push(material)
      })
      k.root.userData.glow = glow
    }
    return { knight: animate(k.root, clips), glow }
  }, [k])

  const clock = useRef(0)
  const lit = useRef(-1)
  const settled = useRef(-1) // the run whose dodge has handed back to idle

  useEffect(ready, [ready])

  useFrame((_, rawDelta) => {
    const delta = still ? 0 : Math.min(rawDelta, 0.1)
    clock.current += delta
    const t = clock.current
    if (ground.current) ground.current.position.y = -size.height / camera.zoom / 2 + GROUND_PX / camera.zoom

    const run = Math.floor(t / RUN)
    const into = t - run * RUN
    // Facing right on even runs, left on odd ones: start at one end, dash to the other.
    const dir = run % 2 === 0 ? 1 : -1
    const from = -dir * (DISTANCE / 2)

    const line = still ? 0 : [...LINES].reverse().find((l) => into >= l.at)!.line
    if (line !== lit.current) {
      lit.current = line
      onStep(line)
    }

    if (into < DASH.at) {
      knight.x = from
    } else if (into < DASH.at + DASH.time) {
      if (knight.current.getClip().name !== "Dodge_Forward") play(knight, "Dodge_Forward", 0.1)
      knight.x = from + dir * DISTANCE * easeOut((into - DASH.at) / DASH.time)
    } else {
      knight.x = from + dir * DISTANCE
      // Hand the roll back to idle smoothly, rather than at the clip's last frame.
      if (settled.current !== run) {
        settled.current = run
        play(knight, "Idle", 0.3)
      }
    }

    // Invulnerable: a few soft white flashes.
    const flashing = (into - FLASH.at) / FLASH.time
    const glowing = !still && flashing > 0 && flashing < 1 ? Math.sin(flashing * Math.PI * FLASH.count) ** 2 * 0.55 : 0
    for (const material of glow) material.emissiveIntensity = glowing

    // Turn around for the next run.
    knight.targetTurn = facing(into >= TURN_AT ? -dir : dir)
    if (still) knight.turn = knight.targetTurn

    step([knight], delta, still, TURN_SPEED)
  })

  return (
    <group ref={ground}>
      <primitive object={knight.root} scale={[-1, 1, 1]} />
    </group>
  )
}

export default function DashScene({ onStep }: { onStep: (line: number) => void }) {
  return (
    <Stage scale={SCALE} className="absolute inset-0">
      <Dash onStep={onStep} />
    </Stage>
  )
}
