"use client"

import { useState } from "react"
import { cn } from "cn"
import { DashScene } from "@/components/three/scenes"

// Code Your Hero's snippet with a little game window under it, where the
// knight runs the code (./dash-scene). The line he's on lights up.

const LINES = [
  <>
    <span className="text-sky-300">void</span> <span className="text-brand">Dash</span>(<span className="text-sky-300">float</span> d){" "}
    {"{"}
  </>,
  <>
    {"  "}
    <span className="text-brand">MoveBy</span>(facing * d);
  </>,
  <>
    {"  "}
    <span className="text-brand">SetInvulnerable</span>(<span className="text-emerald-300">0.2f</span>);
  </>,
  <>{"}"}</>,
]

export function DashDemo() {
  const [lit, setLit] = useState(0)
  return (
    <div aria-hidden className="flex w-full shrink-0 flex-col gap-3 md:w-[340px]">
      <pre className="overflow-x-auto rounded-2xl bg-ink px-3 py-3 font-mono text-[13px] leading-relaxed text-white md:px-4 md:py-4 md:text-sm">
        {LINES.map((code, i) => (
          <span
            key={i}
            className={cn(
              "block rounded-r-md border-l-2 border-transparent px-2 transition-colors duration-200",
              lit === i + 1 && "border-brand bg-white/10"
            )}
          >
            {code}
          </span>
        ))}
      </pre>
      {/* The game window: a faint editor grid, the knight on a ground line. */}
      <div className="relative h-[150px] overflow-hidden rounded-2xl bg-ink md:h-[170px]">
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:24px_24px]" />
        {/* The ground line, GROUND_PX (22px) up, where ./dash-scene stands the knight. */}
        <div className="absolute inset-x-0 bottom-[22px] h-px bg-white/20" />
        <DashScene onStep={setLit} />
      </div>
    </div>
  )
}
