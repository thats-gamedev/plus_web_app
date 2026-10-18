"use client"

import { useMemo } from "react"
import { useLoader } from "@react-three/fiber"
import { AnimationMixer, LoopOnce, LoopRepeat, type AnimationAction, type AnimationClip, type Object3D } from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"

// The KayKit characters used across the site's 3D scenes (the landing page's
// fight, the barbarian's comeback, Code Your Hero's demo, the 404 page).
//
// The models are KayKit's Adventurers pack by Kay Lousberg (CC0,
// public/models/kaykit), trimmed to the clips below and meshopt-compressed
// with glTF-Transform. Clips: 1H_Melee_Attack_Chop / _Slice_Diagonal /
// _Slice_Horizontal / _Stab, Block, Block_Hit, Blocking, Cheer, Death_A,
// Dodge_Forward, Hit_A, Hit_B, Idle, Jump_Idle, Jump_Land, Running_A,
// Sit_Floor_Idle, Walking_A. The knight carries 1H_Sword and a shield, the
// barbarian 1H_Axe and a shield.

export const KNIGHT = "/models/kaykit/knight.glb"
export const BARBARIAN = "/models/kaykit/barbarian.glb"

/** How far a character facing sideways turns toward the camera. */
const TOWARD_CAMERA = 0.55

/**
 * Loads characters (fetched once, shared by every scene) and gives this scene
 * its own copies, so scenes can move, hide and re-equip them independently.
 */
export function useCharacters(urls: string[]) {
  const gltfs = useLoader(GLTFLoader, urls, (loader) => loader.setMeshoptDecoder(MeshoptDecoder))
  return useMemo(() => gltfs.map((gltf) => ({ root: clone(gltf.scene), clips: gltf.animations })), [gltfs])
}

export type Character = {
  root: Object3D
  mixer: AnimationMixer
  actions: Record<string, AnimationAction>
  current: AnimationAction
  x: number
  y: number
  turn: number // rotation about y
  targetTurn: number
}

const LOOPED = new Set(["Idle", "Running_A", "Walking_A", "Jump_Idle", "Sit_Floor_Idle"])

/** Sets a character up to play its clips, starting with `first` (back to Idle after a one-off clip). */
export function animate(root: Object3D, clips: AnimationClip[], first = "Idle"): Character {
  const mixer = new AnimationMixer(root)
  const actions = Object.fromEntries(clips.map((clip) => [clip.name, mixer.clipAction(clip)]))
  const current = actions[first]
  current.play()
  const character: Character = { root, mixer, actions, current, x: 0, y: 0, turn: 0, targetTurn: 0 }
  mixer.addEventListener("finished", (e) => {
    if (e.action === character.current && e.action.getClip().name !== "Death_A") play(character, "Idle")
  })
  return character
}

/** Crossfades to a clip; looping ones loop, the rest play once and hold. */
export function play(character: Character, name: string, fade = 0.15) {
  const next = character.actions[name]
  if (!next || next === character.current) return
  const once = !LOOPED.has(name)
  next.reset()
  next.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
  next.clampWhenFinished = once
  next.crossFadeFrom(character.current, fade, false).play()
  character.current = next
}

export const playing = (character: Character) => character.current.getClip().name

/** Facing +x (1), -x (-1) or the camera (0), turned toward the camera when sideways. */
export const facing = (dir: number) => dir * (Math.PI / 2 - TOWARD_CAMERA)

/** Moves the models into place and lets the clips pose them; turnSpeed sets how quickly they turn to targetTurn. */
export function step(characters: Character[], delta: number, still: boolean, turnSpeed = 8) {
  for (const c of characters) {
    c.turn = still ? c.targetTurn : c.turn + (c.targetTurn - c.turn) * Math.min(1, delta * turnSpeed)
    c.root.position.set(c.x, c.y, 0)
    c.root.rotation.y = c.turn
    c.mixer.update(delta)
  }
}

// ── Throwing a weapon into a button ─────────────────────────────────────────

/** A button's box in a scene's ground coordinates. */
export type Box = { x: number; top: number; width: number; height: number }

/** Measures an element in a scene's ground coordinates: x from the canvas's middle, y up from `groundPx` (px from the canvas's top). */
export function measureBox(canvas: HTMLCanvasElement, zoom: number, groundPx: number, el: Element | null): Box | null {
  if (!el) return null
  const c = canvas.getBoundingClientRect()
  const b = el.getBoundingClientRect()
  return {
    x: (b.left + b.width / 2 - c.left - c.width / 2) / zoom,
    top: (c.top + groundPx - b.top) / zoom,
    width: b.width / zoom,
    height: b.height / zoom,
  }
}

/**
 * Where a weapon stuck in a button's top edge sits: `bite` is the point that
 * goes in (the sword's tip, the axe's edge), in the weapon's own x/y, already
 * scaled; `at` places it on the button (share of its width from the middle,
 * share of its height down from the top); `tilt` leans it (radians, negative:
 * handle up and to the right). Returns the weapon's origin and z rotation.
 */
export function stuckPose(button: Box, bite: { x: number; y: number }, at: { across: number; down: number }, tilt: number) {
  const target = { x: button.x + button.width * at.across, y: button.top - button.height * at.down }
  // Turn the weapon so the bite points down, leaning by tilt.
  const angle = Math.atan2(-Math.cos(tilt), Math.sin(tilt)) - Math.atan2(bite.y, bite.x)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return { x: target.x - (bite.x * cos - bite.y * sin), y: target.y - (bite.x * sin + bite.y * cos), angle }
}

/** A little knock: the button jolts as the weapon hits it. */
export function jolt(el: Element | null) {
  ;(el as HTMLElement | null)?.animate(
    [
      { transform: "translate(0, 0)" },
      { transform: "translate(1px, 3px) rotate(-1.2deg)" },
      { transform: "translate(-1px, -1px) rotate(0.6deg)" },
      { transform: "translate(0, 0)" },
    ],
    { duration: 320, easing: "ease-out" }
  )
}
