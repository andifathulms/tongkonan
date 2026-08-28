import Link from 'next/link'
import type { Silhouette } from '@/lib/core/silhouette'

/*
 * Elevation drawings, from computed silhouettes.
 *
 * The drawing side of lib/core/silhouette.ts: loops in, SVG out, nothing
 * computed here beyond placing houses on a sheet. Everything is in metres —
 * the viewBox is the world — so the scale bar can be honest: its width is a
 * fraction of the same viewBox the houses are drawn in, and both scale
 * together whatever size the sheet renders at.
 */

/** metres of sheet margin around the drawn houses */
const PAD = 1
/** metres between houses standing on the shared ground line */
const GAP = 2.5
/** metres of sheet below the ground line */
const BELOW = 0.4
/** the scale bar's length, metres — the drawing convention, not a dimension */
const BAR = 5

const f = (n: number) => (Math.round(n * 100) / 100).toString()

function pathOf(s: Silhouette, ox: number, baseY: number): string {
  return s.loops
    .map(
      (loop) =>
        'M' + loop.map(([x, y]) => `${f(ox + x - s.min[0])} ${f(baseY - y)}`).join('L') + 'Z',
    )
    .join('')
}

/**
 * The scale bar: alternating metre segments, sized as a fraction of the row
 * it sits in — which must be the full width of the same container the drawing
 * fills, so the two cannot disagree. `viewW` is the drawing's viewBox width
 * in metres. Rendered as siblings, not wrapped: a percentage width has to
 * resolve against the row, not against a shrink-wrapped span.
 */
function ScaleBar({ viewW }: { viewW: number }) {
  return (
    <>
      <span
        className="h-1 shrink-0 border border-bolu"
        style={{
          width: `${(BAR / viewW) * 100}%`,
          backgroundImage:
            'repeating-linear-gradient(90deg, var(--bolu) 0 20%, transparent 20% 40%)',
        }}
        aria-hidden
      />
      <span className="micro whitespace-nowrap">{BAR} m</span>
    </>
  )
}

/**
 * Every house on one ground line, at one scale.
 *
 * One svg rather than one per house, because the same-scale claim is the
 * point and separate viewBoxes could quietly break it. The svg is decoration
 * over the index below — aria-hidden — but the labels are real links.
 * A new house in the registry widens the sheet and appears; nothing here
 * counts to four.
 */
export function ElevationShelf({
  items,
  caption,
}: {
  items: readonly { key: string; href: string; label: string; s: Silhouette }[]
  caption: string
}) {
  const widths = items.map((i) => i.s.max[0] - i.s.min[0])
  const maxH = Math.max(...items.map((i) => i.s.max[1]))
  const W = widths.reduce((a, b) => a + b, 0) + GAP * (items.length - 1) + PAD * 2
  const baseY = maxH + PAD
  const H = baseY + BELOW
  let cursor = PAD
  const placed = items.map((item, i) => {
    const ox = cursor
    cursor += widths[i]! + GAP
    return { ...item, ox, centre: ox + widths[i]! / 2 }
  })

  return (
    <div className="overflow-x-auto rounded border border-hairline">
      <div className="min-w-shelf px-4 pt-5">
        <svg viewBox={`0 0 ${f(W)} ${f(H)}`} className="w-full" aria-hidden="true">
          <line
            x1={0}
            y1={f(baseY)}
            x2={f(W)}
            y2={f(baseY)}
            stroke="var(--muted)"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            className="rule-draw"
          />
          {/*
            The houses rise in shelf order once the ground line has drawn,
            one state-timing apart — the landing's echo of the frame-raising,
            run once on arrival. Reduced motion gets the finished drawing.
          */}
          {placed.map((p, i) => (
            <path
              key={p.key}
              d={pathOf(p.s, p.ox, baseY)}
              fill="var(--bolu)"
              fillRule="evenodd"
              className="house-raise"
              style={{ animationDelay: `calc(var(--t-layout) + ${i} * var(--t-state))` }}
            />
          ))}
        </svg>
        <div className="relative h-control">
          {placed.map((p) => (
            <Link
              key={p.key}
              href={p.href}
              className="micro absolute top-1 -translate-x-1/2 whitespace-nowrap text-bolu underline-offset-4 hover:underline"
              style={{ left: `${(p.centre / W) * 100}%` }}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-hairline py-3">
          <ScaleBar viewW={W} />
          <p className="micro ml-auto text-muted">{caption}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * One house on its own sheet, with the scale bar that makes it a drawing
 * rather than a picture.
 */
export function ElevationSheet({ s, caption }: { s: Silhouette; caption: string }) {
  const W = s.max[0] - s.min[0] + PAD * 2
  const baseY = s.max[1] + PAD
  const H = baseY + BELOW
  return (
    <div className="rounded border border-hairline px-4 pt-5">
      <svg viewBox={`0 0 ${f(W)} ${f(H)}`} className="w-full" aria-hidden="true">
        <line
          x1={0}
          y1={f(baseY)}
          x2={f(W)}
          y2={f(baseY)}
          stroke="var(--muted)"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          className="rule-draw"
        />
        <path
          d={pathOf(s, PAD, baseY)}
          fill="var(--bolu)"
          fillRule="evenodd"
          className="house-raise"
          style={{ animationDelay: 'var(--t-layout)' }}
        />
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-hairline py-3">
        <ScaleBar viewW={W} />
        <p className="micro ml-auto text-muted">{caption}</p>
      </div>
    </div>
  )
}

/**
 * A small elevation in a shared frame, for the index cards.
 *
 * Every card passes the same frame — the extents of the largest house in the
 * registry — so the cards stay at one scale too: the mbaru niang's card is
 * mostly tower and the joglo's is mostly eave, which is true.
 */
export function ElevationMark({
  s,
  frame,
}: {
  s: Silhouette
  frame: { w: number; h: number }
}) {
  const W = frame.w + PAD * 2
  const baseY = frame.h + PAD
  const H = baseY + BELOW
  const ox = PAD + (frame.w - (s.max[0] - s.min[0])) / 2
  return (
    <svg viewBox={`0 0 ${f(W)} ${f(H)}`} className="w-full" aria-hidden="true">
      <line
        x1={0}
        y1={f(baseY)}
        x2={f(W)}
        y2={f(baseY)}
        stroke="var(--hairline)"
        vectorEffect="non-scaling-stroke"
      />
      <path d={pathOf(s, ox, baseY)} fill="var(--bolu)" fillRule="evenodd" />
    </svg>
  )
}
