import Link from 'next/link'
import type { Silhouette } from '@/lib/core/silhouette'
import { packShelf } from '@/lib/draw/shelf'

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
const GAP = 3
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
 * Every house at one scale, on as many ground lines as it takes.
 *
 * It was one ground line while the collection fitted on one. At fourteen it
 * does not: the houses come to two hundred and eighteen metres, and a strip
 * that wide in a page-width container draws a honai thirty pixels tall with
 * its name written across its neighbour's roof. So the shelf wraps, and the
 * packing is in `lib/draw/shelf.ts` with a test on it, because the thing that
 * must survive wrapping is the claim the shelf makes.
 *
 * That claim is one scale, and it survives by every row being drawn in the
 * *same* viewBox width — so a row holding one house is drawn at the scale of a
 * row holding six, and the scale bar at the foot is a fraction of that same
 * width. Rows sized to their own contents would have been the natural way to
 * write this and would have quietly made the small houses large.
 *
 * A new house in the registry is packed by the same arithmetic; if it is the
 * one that overruns the last row, a third row appears and nothing here
 * changes. Nothing counts to fourteen.
 */
export function ElevationShelf({
  items,
  caption,
}: {
  items: readonly { key: string; href: string; label: string; s: Silhouette }[]
  caption: string
}) {
  const shelf = packShelf(
    items.map((i) => ({ ...i, width: i.s.max[0] - i.s.min[0], height: i.s.max[1] })),
    { gap: GAP, pad: PAD },
  )
  const W = shelf.width
  let raised = 0

  return (
    <div className="overflow-x-auto rounded border border-hairline">
      <div className="min-w-shelf px-4 pt-5">
        {shelf.rows.map((row, r) => {
          // Every row in the shelf's height, not its own: see the note on
          // `Shelf.height`. Uneven ground lines read as uneven scales.
          const baseY = shelf.height + PAD
          const H = baseY + BELOW
          return (
            <div key={r} className={r > 0 ? 'mt-2' : undefined}>
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
                  one state-timing apart — the landing's echo of the
                  frame-raising, run once on arrival. The delay counts across
                  rows rather than restarting, because it is one sequence read
                  left to right and then down. Reduced motion gets the finished
                  drawing.
                */}
                {row.items.map((p) => {
                  const delay = raised++
                  return (
                    <path
                      key={p.key}
                      d={pathOf(p.s, p.ox, baseY)}
                      fill="var(--bolu)"
                      fillRule="evenodd"
                      className="house-raise"
                      style={{
                        animationDelay: `calc(var(--t-layout) + ${delay} * var(--t-state))`,
                      }}
                    />
                  )
                })}
              </svg>
              {/*
                Each name sits over its own house and is allowed the width of
                its own slot — the house plus the gap either side of it. They
                were nowrap and centred on a point, which at fourteen houses
                meant "rumah bubungan tinggi" written straight through
                "lumbung" and "honai". A name that wraps onto two lines is
                legible; two names sharing one line are not.
              */}
              {/*
                Two lines of the micro step on the 4px scale: the tall names
                need the second line and the strip has to reserve it, because
                the labels are positioned and would otherwise hang over the
                next row's ground line.
              */}
              <div className="relative h-10">
                {row.items.map((p) => (
                  <Link
                    key={p.key}
                    href={p.href}
                    className="micro absolute top-1 -translate-x-1/2 text-center leading-tight text-bolu underline-offset-4 hover:underline"
                    style={{
                      left: `${(p.centre / W) * 100}%`,
                      width: `${((p.width + GAP) / W) * 100}%`,
                    }}
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
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
export function ElevationSheet({
  s,
  caption,
  frameless = false,
}: {
  s: Silhouette
  caption: string
  /** true when the caller draws its own sheet frame around this drawing */
  frameless?: boolean
}) {
  const W = s.max[0] - s.min[0] + PAD * 2
  const baseY = s.max[1] + PAD
  const H = baseY + BELOW
  return (
    <div className={frameless ? 'px-4 pt-5' : 'rounded border border-hairline px-4 pt-5'}>
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
