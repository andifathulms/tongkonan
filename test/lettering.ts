/**
 * A stroke alphabet, for the share cards.
 *
 * The cards are drawn by a rasteriser this project wrote, on a machine with
 * no font stack, and they carry no font file — the vendored Plex is woff2,
 * which would mean brotli plus the woff2 glyf reconstruction to read, and a
 * font parser is a large thing to own for two lines of text on a picture.
 *
 * So the letters are geometry, like everything else here: each glyph is a
 * set of polylines on a grid, stroked with a round pen. That is not a
 * workaround dressed up — it is what lettering on a drawing *is*. A surveyor
 * letters a sheet with a stencil or a Leroy scriber, one weight, one stroke,
 * no thicks and thins, and the result is legible at any size and belongs to
 * the drawing rather than to a typeface. The card is a sheet, so it is
 * lettered.
 *
 * The grid: baseline y = 0, cap height 14, x-height 10, descender −4, y up.
 * Every glyph declares its own advance, so the alphabet is proportional
 * rather than monospaced — Plex Mono is the site's voice for measured
 * figures, and a house's name is not a figure.
 *
 * Pure arithmetic, no state, no clock: the same commit letters the same card
 * on any machine.
 */

/** Cap height in grid units. Everything scales from this. */
export const CAP = 14
/** Space between glyphs, in grid units. */
const TRACKING = 1.1

export type Pt = readonly [number, number]
/** A glyph: its advance width, and the polylines the pen walks. */
interface Glyph {
  readonly w: number
  readonly p: readonly (readonly Pt[])[]
}

/**
 * Points along an elliptical arc, angles in degrees, 0° east, y up.
 * Round letters are ellipses rather than circles because a circular O at cap
 * height is as wide as it is tall, which no alphabet has ever wanted.
 */
function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
): Pt[] {
  // One point per ~9° of sweep, so the largest bowl here stays smooth at the
  // biggest size the cards letter at.
  const n = Math.max(4, Math.round(Math.abs(a1 - a0) / 9))
  const out: Pt[] = []
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
    out.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)])
  }
  return out
}

/** A polyline that runs into an arc and out again, as one pen stroke. */
function path(...parts: (Pt | Pt[])[]): Pt[] {
  const out: Pt[] = []
  for (const p of parts) {
    if (Array.isArray(p[0])) out.push(...(p as Pt[]))
    else out.push(p as Pt)
  }
  return out
}

const FONT: Record<string, Glyph> = {
  ' ': { w: 5, p: [] },

  A: { w: 11, p: [[[0.5, 0], [5.5, 14], [10.5, 0]], [[2.7, 4.6], [8.3, 4.6]]] },
  B: {
    w: 10.8,
    p: [
      [[1, 0], [1, 14]],
      path([1, 14], [5.5, 14], arc(5.5, 10.75, 3.3, 3.25, 90, -90), [1, 7.5]),
      path([1, 7.5], [5.3, 7.5], arc(5.3, 3.75, 3.9, 3.75, 90, -90), [1, 0]),
    ],
  },
  C: { w: 12.2, p: [arc(6.2, 7, 5.4, 7, 55, 305)] },
  D: {
    w: 12.2,
    p: [
      [[1, 0], [1, 14]],
      path([1, 14], [5, 14], arc(5, 7, 6, 7, 90, -90), [1, 0]),
    ],
  },
  E: { w: 10, p: [[[1, 0], [1, 14]], [[1, 14], [9, 14]], [[1, 7], [7.6, 7]], [[1, 0], [9, 0]]] },
  F: { w: 9.6, p: [[[1, 0], [1, 14]], [[1, 14], [9, 14]], [[1, 7], [7.6, 7]]] },
  G: {
    w: 12.4,
    p: [path(arc(6.2, 7, 5.4, 7, 55, 340), [7.2, 4.7])],
  },
  H: { w: 11.6, p: [[[1, 0], [1, 14]], [[10.6, 0], [10.6, 14]], [[1, 7], [10.6, 7]]] },
  I: { w: 5, p: [[[2.5, 0], [2.5, 14]]] },
  J: { w: 9.2, p: [path([7.2, 14], [7.2, 4], arc(4.2, 4, 3, 4, 0, -180))] },
  K: {
    w: 11,
    p: [[[1, 0], [1, 14]], [[10.4, 14], [1.4, 6.4]], [[4.7, 8.8], [10.8, 0]]],
  },
  L: { w: 9.4, p: [[[1, 14], [1, 0], [9, 0]]] },
  M: { w: 14.2, p: [[[1, 0], [1, 14], [7.1, 3], [13.2, 14], [13.2, 0]]] },
  N: { w: 11.8, p: [[[1, 0], [1, 14], [10.8, 0], [10.8, 14]]] },
  O: { w: 12.6, p: [arc(6.3, 7, 5.5, 7, 0, 360)] },
  P: {
    w: 10.6,
    p: [
      [[1, 0], [1, 14]],
      path([1, 14], [5.4, 14], arc(5.4, 10.5, 3.6, 3.5, 90, -90), [1, 7]),
    ],
  },
  Q: { w: 12.6, p: [arc(6.3, 7, 5.5, 7, 0, 360), [[8, 3.4], [12.2, -1.2]]] },
  R: {
    w: 11,
    p: [
      [[1, 0], [1, 14]],
      path([1, 14], [5.4, 14], arc(5.4, 10.5, 3.6, 3.5, 90, -90), [1, 7]),
      [[5.2, 7], [10.6, 0]],
    ],
  },
  S: {
    w: 10.8,
    p: [
      [
        [9.8, 11.2], [8.6, 13.3], [5.6, 14], [2.7, 13.4], [1.2, 11.4],
        [1.6, 9.2], [3.6, 7.9], [7.9, 6.4], [9.8, 5], [10.1, 2.9],
        [8.6, 0.9], [5.6, 0], [2.6, 0.5], [1, 2.6],
      ],
    ],
  },
  T: { w: 10.6, p: [[[0.5, 14], [10.1, 14]], [[5.3, 14], [5.3, 0]]] },
  U: {
    w: 11.6,
    p: [path([1, 14], [1, 4], arc(5.8, 4, 4.8, 4, 180, 360), [10.6, 14])],
  },
  V: { w: 11, p: [[[0.5, 14], [5.5, 0], [10.5, 14]]] },
  W: { w: 15.6, p: [[[0.5, 14], [4.1, 0], [7.8, 11], [11.5, 0], [15.1, 14]]] },
  X: { w: 11, p: [[[0.5, 14], [10.5, 0]], [[0.5, 0], [10.5, 14]]] },
  Y: { w: 11, p: [[[0.5, 14], [5.5, 7], [10.5, 14]], [[5.5, 7], [5.5, 0]]] },
  Z: { w: 10.6, p: [[[0.8, 14], [9.8, 14], [0.8, 0], [9.8, 0]]] },

  a: { w: 9.8, p: [arc(4.7, 5, 4, 5, 0, 360), [[8.7, 10], [8.7, 0]]] },
  b: { w: 9.8, p: [[[1, 14], [1, 0]], arc(5.3, 5, 4.3, 5, 0, 360)] },
  c: { w: 9.4, p: [arc(4.9, 5, 4, 5, 55, 305)] },
  d: { w: 9.8, p: [[[8.7, 14], [8.7, 0]], arc(4.5, 5, 4.3, 5, 0, 360)] },
  e: { w: 9.6, p: [path(arc(4.9, 5, 4.1, 5, 0, 320)), [[0.8, 5], [9, 5]]] },
  f: {
    w: 6.6,
    p: [[[6, 13.2], [4.5, 14], [3, 13.4], [2.6, 11.6], [2.6, 0]], [[0.6, 10], [5.8, 10]]],
  },
  g: {
    w: 9.8,
    p: [
      arc(4.5, 5, 4.3, 5, 0, 360),
      path([8.7, 10], [8.7, -1.4], arc(5.7, -1.4, 3, 2.6, 0, -180)),
    ],
  },
  h: {
    w: 9.8,
    p: [
      [[1, 14], [1, 0]],
      path([1, 6.6], arc(4.9, 6.6, 3.9, 3.4, 180, 0), [8.8, 0]),
    ],
  },
  i: { w: 4.8, p: [[[2.4, 10], [2.4, 0]], [[2.4, 12.9], [2.4, 13.2]]] },
  j: {
    w: 4.8,
    p: [
      path([2.9, 10], [2.9, -1.4], arc(0.9, -1.4, 2, 2.4, 0, -180)),
      [[2.9, 12.9], [2.9, 13.2]],
    ],
  },
  k: { w: 9.2, p: [[[1, 14], [1, 0]], [[8.6, 10], [1.4, 4.2]], [[3.9, 6.2], [8.8, 0]]] },
  l: { w: 4.8, p: [[[2.4, 14], [2.4, 0]]] },
  m: {
    w: 15,
    p: [
      [[1, 10], [1, 0]],
      path([1, 6.4], arc(4.2, 6.4, 3.2, 3.4, 180, 0), [7.4, 0]),
      path([7.4, 6.4], arc(10.6, 6.4, 3.2, 3.4, 180, 0), [13.8, 0]),
    ],
  },
  n: {
    w: 9.8,
    p: [
      [[1, 10], [1, 0]],
      path([1, 6.6], arc(4.9, 6.6, 3.9, 3.4, 180, 0), [8.8, 0]),
    ],
  },
  o: { w: 9.8, p: [arc(4.9, 5, 4.1, 5, 0, 360)] },
  p: { w: 9.8, p: [[[1, 10], [1, -4]], arc(5.3, 5, 4.3, 5, 0, 360)] },
  q: { w: 9.8, p: [[[8.6, 10], [8.6, -4]], arc(4.3, 5, 4.3, 5, 0, 360)] },
  r: { w: 7, p: [[[1, 10], [1, 0]], path([1, 6.4], arc(4.2, 6.4, 3.2, 3.6, 180, 55))] },
  s: {
    w: 8.6,
    p: [
      [
        [7.8, 7.9], [6.7, 9.6], [4.3, 10], [2, 9.6], [1, 8.1],
        [1.3, 6.5], [2.8, 5.6], [6.2, 4.5], [7.7, 3.5], [7.9, 1.9],
        [6.6, 0.6], [4.3, 0], [1.9, 0.4], [0.7, 1.9],
      ],
    ],
  },
  t: {
    w: 6.6,
    p: [path([3, 14], [3, 2.4], arc(5, 2.4, 2, 2.4, 180, 270)), [[0.8, 10], [5.8, 10]]],
  },
  u: {
    w: 9.8,
    p: [
      path([1, 10], [1, 3.4], arc(4.9, 3.4, 3.9, 3.4, 180, 360)),
      [[8.8, 10], [8.8, 0]],
    ],
  },
  v: { w: 9.4, p: [[[0.6, 10], [4.7, 0], [8.8, 10]]] },
  w: { w: 13.6, p: [[[0.6, 10], [3.6, 0], [6.8, 7.6], [10, 0], [13, 10]]] },
  x: { w: 9.2, p: [[[0.8, 10], [8.4, 0]], [[0.8, 0], [8.4, 10]]] },
  y: { w: 9.4, p: [[[0.6, 10], [4.7, 0]], [[8.8, 10], [2.6, -4]]] },
  z: { w: 8.8, p: [[[0.8, 10], [8, 10], [0.8, 0], [8, 0]]] },

  '0': { w: 11, p: [arc(5.5, 7, 4.7, 7, 0, 360)] },
  '1': { w: 11, p: [[[2.4, 11.4], [5.4, 14], [5.4, 0]], [[2.4, 0], [8.4, 0]]] },
  '2': {
    w: 11,
    p: [[[1.2, 10.8], [2.2, 12.9], [4.6, 14], [7.2, 13.7], [9.2, 12.1], [9.5, 9.8], [8.2, 7.6], [1.2, 0], [9.8, 0]]],
  },
  '3': {
    w: 11,
    p: [
      [[1.3, 12.4], [3.2, 13.8], [5.9, 14], [8.3, 13.2], [9.4, 11.4], [8.9, 9.3], [6.6, 8], [4.4, 7.6]],
      [[4.4, 7.6], [7.1, 7.2], [9.4, 5.9], [9.9, 3.6], [8.6, 1.3], [5.9, 0.1], [3, 0.4], [1, 1.9]],
    ],
  },
  '4': { w: 11, p: [[[7.4, 0], [7.4, 14], [1, 4.2], [10, 4.2]]] },
  '5': {
    w: 11,
    p: [[[9, 14], [2.4, 14], [1.8, 7.6], [4.2, 8.6], [6.8, 8.6], [9, 7.2], [9.9, 4.8], [9.3, 2.3], [7.1, 0.6], [4.2, 0.2], [1.6, 1.2]]],
  },
  '6': {
    w: 11,
    p: [[[8.6, 13], [6, 14], [3.4, 13.2], [1.7, 10.6], [1.2, 6.6], [1.6, 3.4], [3.2, 1], [5.8, 0], [8, 0.9], [9.4, 3], [9.2, 5.4], [7.6, 7.2], [5, 7.8], [2.6, 7], [1.4, 5.2]]],
  },
  '7': { w: 11, p: [[[1, 14], [9.8, 14], [4.2, 0]]] },
  '8': { w: 11, p: [arc(5.5, 10.4, 3.7, 3.6, 0, 360), arc(5.5, 3.4, 4.3, 3.4, 0, 360)] },
  '9': {
    w: 11,
    p: [[[2.4, 1], [5, 0], [7.6, 0.8], [9.3, 3.4], [9.8, 7.4], [9.4, 10.6], [7.8, 13], [5.2, 14], [3, 13.1], [1.6, 11], [1.8, 8.6], [3.4, 6.8], [6, 6.2], [8.4, 7], [9.6, 8.8]]],
  },

  '.': { w: 4.6, p: [[[2.3, 0], [2.3, 0.25]]] },
  ',': { w: 4.6, p: [[[2.6, 0.6], [1.5, -2.4]]] },
  '-': { w: 7.2, p: [[[1.1, 5.6], [6.1, 5.6]]] },
  '(': { w: 5.4, p: [arc(6.6, 7, 5.4, 7.8, 148, 212)] },
  ')': { w: 5.4, p: [arc(-1.2, 7, 5.4, 7.8, 32, -32)] },
  "'": { w: 4, p: [[[2, 14], [2, 10.8]]] },
  '/': { w: 8, p: [[[0.8, -1], [7.2, 15]]] },
  '·': { w: 5.6, p: [[[2.8, 5.4], [2.8, 5.7]]] },
}

/** Every character this alphabet can letter. */
export function has(ch: string): boolean {
  return ch in FONT
}

/**
 * How wide a string sets, in grid units. Callers need this before drawing —
 * to centre a line, to right-align a plate number, or to find out that a
 * name does not fit and the size has to come down.
 */
export function widthOf(text: string, tracking = TRACKING): number {
  let w = 0
  for (const ch of text) {
    const g = FONT[ch]
    if (!g) throw new Error(`no glyph for ${JSON.stringify(ch)}`)
    w += g.w + tracking
  }
  return Math.max(0, w - tracking)
}

/**
 * The pen strokes for a string, in grid units with the baseline at y = 0 and
 * the first glyph's origin at x = 0. Rendering them is the caller's business
 * — this file knows about letterforms and nothing about pixels.
 */
export function strokes(text: string, tracking = TRACKING): Pt[][] {
  const out: Pt[][] = []
  let x = 0
  for (const ch of text) {
    const g = FONT[ch]
    if (!g) throw new Error(`no glyph for ${JSON.stringify(ch)}`)
    for (const poly of g.p) out.push(poly.map(([px, py]) => [x + px, py] as Pt))
    x += g.w + tracking
  }
  return out
}
