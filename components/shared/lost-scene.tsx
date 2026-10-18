"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import type { Group } from "three"
import { BARBARIAN, animate, step, useCharacters } from "@/components/three/kaykit"
import { Stage, useStage } from "@/components/three/stage"

// The 404 page's barbarian (loaded lazily by components/three/scenes): the
// one the knight knocked off the strip on the landing page, sitting on the
// floor of the "level not found" screen, a little lost.

/** His scale, in px per world unit (standing, he's about 2.4 tall; sitting, about 1.6). */
const SCALE = { lg: 70, sm: 58 }
/** The floor: this far (px) above the card's bottom edge. */
const FLOOR_PX = 8
/** The sitting clip lowers him below his origin; this lifts him back onto the floor (world units). */
const SIT_LIFT = 0.3

function Lost() {
  const { still, ready } = useStage()
  const [b] = useCharacters([BARBARIAN])
  const { camera, size } = useThree()
  const ground = useRef<Group>(null)
  const barbarian = useMemo(() => {
    b.root.getObjectByName("1H_Axe")!.visible = false
    const c = animate(b.root, b.clips, "Sit_Floor_Idle")
    c.targetTurn = c.turn = 0.35
    c.y = SIT_LIFT
    return c
  }, [b])

  useEffect(ready, [ready])

  useFrame((_, delta) => {
    if (ground.current) ground.current.position.y = -size.height / camera.zoom / 2 + FLOOR_PX / camera.zoom
    step([barbarian], still ? 0 : Math.min(delta, 0.1), still)
  })

  return (
    <group ref={ground}>
      <primitive object={barbarian.root} scale={[-1, 1, 1]} />
    </group>
  )
}

export default function LostScene() {
  return (
    <Stage scale={SCALE} className="absolute inset-0">
      <Lost />
    </Stage>
  )
}
