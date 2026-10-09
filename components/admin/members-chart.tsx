"use client"

import { useId, useMemo, useRef, useState } from "react"

// "Active members · last 90 days" (AW1): one series, so no legend; the card
// title names it. Area with a 2px line in the brand colour (validated
// against the card surface with the dataviz palette checks), a 10% wash,
// hairline grid, a crosshair that snaps to the nearest day (pointer and
// arrow keys), the latest value at the line end, and a table view.

type Point = { day: string; value: number }

const W = 640
const H = 260
const PAD = { top: 16, right: 44, bottom: 28, left: 40 }

const dayLabel = (day: string) =>
  new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })

/** Clean y-axis maximum and step: 0 / 50 / 100 / 150 … */
function niceScale(max: number) {
  if (max <= 4) return { top: 4, step: 1 }
  const raw = max / 4
  const magnitude = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? raw
  return { top: Math.ceil(max / step) * step, step }
}

export function MembersChart({ points }: { points: Point[] }) {
  const titleId = useId()
  const [active, setActive] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const geometry = useMemo(() => {
    const { top, step } = niceScale(Math.max(...points.map((p) => p.value), 0))
    const innerW = W - PAD.left - PAD.right
    const innerH = H - PAD.top - PAD.bottom
    const x = (i: number) => PAD.left + (points.length === 1 ? innerW : (i / (points.length - 1)) * innerW)
    const y = (v: number) => PAD.top + innerH - (v / top) * innerH
    const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("")
    const area = `${line}L${x(points.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`
    const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
    // Four evenly spaced date labels, always including the last day.
    const labelIdx = [...new Set([0, 1, 2, 3].map((k) => Math.round((k / 3) * (points.length - 1))))]
    return { x, y, line, area, ticks, labelIdx }
  }, [points])

  if (points.length < 2) {
    return (
      <p className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
        The chart fills in as the daily snapshot runs (03:00 UTC).
        {points.length === 1 && ` First snapshot: ${points[0].value} members on ${dayLabel(points[0].day)}.`}
      </p>
    )
  }

  const { x, y, line, area, ticks, labelIdx } = geometry
  const last = points.length - 1

  const nearest = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return null
    const svgX = ((clientX - rect.left) / rect.width) * W
    const ratio = (svgX - PAD.left) / (W - PAD.left - PAD.right)
    return Math.min(last, Math.max(0, Math.round(ratio * last)))
  }

  const shown = active ?? null
  const tooltipLeft = shown !== null ? `${(x(shown) / W) * 100}%` : undefined

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-none outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          role="img"
          aria-labelledby={titleId}
          tabIndex={0}
          onPointerMove={(e) => setActive(nearest(e.clientX))}
          onPointerLeave={() => setActive(null)}
          onFocus={() => setActive(last)}
          onBlur={() => setActive(null)}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setActive((i) => Math.max(0, (i ?? last) - 1))
            else if (e.key === "ArrowRight") setActive((i) => Math.min(last, (i ?? last) + 1))
            else return
            e.preventDefault()
          }}
        >
          <title id={titleId}>
            {`Active members from ${dayLabel(points[0].day)} to ${dayLabel(points[last].day)}: ${points[0].value} to ${points[last].value}`}
          </title>

          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground font-mono text-[11px]">
                {t.toLocaleString("en-US")}
              </text>
            </g>
          ))}
          {labelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? "start" : i === last ? "end" : "middle"}
              className="fill-muted-foreground font-mono text-[11px]"
            >
              {dayLabel(points[i].day)}
            </text>
          ))}

          <path d={area} fill="var(--brand)" fillOpacity={0.1} />
          <path d={line} fill="none" stroke="var(--brand)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {/* Latest value at the end of the line. */}
          <circle cx={x(last)} cy={y(points[last].value)} r={4} fill="var(--brand)" stroke="var(--card)" strokeWidth={2} />
          <text x={x(last) + 8} y={y(points[last].value)} dy="0.32em" className="fill-foreground font-mono text-[12px] font-semibold">
            {points[last].value}
          </text>

          {shown !== null && (
            <g pointerEvents="none">
              <line x1={x(shown)} x2={x(shown)} y1={PAD.top} y2={H - PAD.bottom} stroke="var(--ink)" strokeOpacity={0.35} strokeWidth={1} />
              <circle cx={x(shown)} cy={y(points[shown].value)} r={4} fill="var(--brand)" stroke="var(--card)" strokeWidth={2} />
            </g>
          )}
        </svg>

        {shown !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-1 -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: tooltipLeft }}
          >
            <p className="font-mono text-muted-foreground">{dayLabel(points[shown].day)}</p>
            <p className="font-semibold">{points[shown].value} active members</p>
          </div>
        )}
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Show as table</summary>
        <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-1.5 font-medium">Day</th>
                <th className="px-3 py-1.5 text-right font-medium">Active members</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {[...points].reverse().map((p) => (
                <tr key={p.day} className="border-t border-border">
                  <td className="px-3 py-1">{p.day}</td>
                  <td className="px-3 py-1 text-right">{p.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
