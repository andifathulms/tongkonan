/**
 * The share cards, drawn by hand.
 *
 * A link unfurls into an image, and the only honest image this project has
 * is the one it computes: the houses' own silhouettes on drafting film. The
 * usual way to build og images is a headless rasteriser with an embedded
 * font; this project vendors no fonts and hand-writes its generation, so the
 * cards carry no text — the card's title and description are already text,
 * in the reader's own locale, beside the image — and the rasteriser is ours:
 * the silhouette loops scan-filled into a pixel buffer, supersampled twice
 * for clean edges, and encoded as PNG over node's zlib.
 *
 * Run through test/og.test.ts. Pure arithmetic end to end, so the same
 * commit draws the same card on any machine.
 */

import { deflateSync, inflateSync } from 'node:zlib'
import type { Silhouette } from '@/lib/core/silhouette'

export const CARD_W = 1200
export const CARD_H = 630
/** supersampling factor: rendered at twice the size, box-averaged down */
const SS = 2

/** The interface neutrals and the ink, as rgb. Values from app/globals.css. */
const FILM: Rgb = [0xd8, 0xd7, 0xcd]
const BOLU: Rgb = [0x17, 0x15, 0x0f]
const MUTED: Rgb = [0x57, 0x53, 0x49]

type Rgb = readonly [number, number, number]

/** One house placed on the card: its loops, offset and scale, world→card. */
export interface Placed {
  readonly s: Silhouette
  /** card x of the silhouette's left edge, in card pixels */
  readonly x: number
  /** pixels per metre */
  readonly scale: number
}

/**
 * Draw a card: film field, a ground line, and houses standing on it.
 * `baseline` is the ground line's y in card pixels. Returns the rgb pixel
 * buffer — encoding is separate, so a drift check can compare pixels and
 * stay indifferent to which zlib wrote the committed file.
 */
export function drawCard(placed: readonly Placed[], baseline: number): Uint8Array {
  const w = CARD_W * SS
  const h = CARD_H * SS
  const buf = new Uint8Array(w * h * 3)
  fillRect(buf, w, 0, 0, w, h, FILM)
  // the ground line: two card pixels of muted ink, full width
  fillRect(buf, w, 0, Math.round((baseline - 1) * SS), w, 2 * SS, MUTED)
  for (const p of placed) {
    fillLoops(
      buf,
      w,
      h,
      p.s.loops.map((loop) =>
        loop.map(
          ([x, y]) =>
            [
              (p.x + (x - p.s.min[0]) * p.scale) * SS,
              (baseline - y * p.scale) * SS,
            ] as const,
        ),
      ),
      BOLU,
    )
  }
  return downsample(buf, w, h)
}

/** Decode one of our own PNGs back to pixels. Filter 0 only — we wrote it. */
export function pixelsOf(bytes: Buffer): Uint8Array {
  let off = 8
  const idat: Buffer[] = []
  let w = 0
  let h = 0
  while (off < bytes.length) {
    const len = bytes.readUInt32BE(off)
    const type = bytes.toString('ascii', off + 4, off + 8)
    const data = bytes.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      w = data.readUInt32BE(0)
      h = data.readUInt32BE(4)
    }
    if (type === 'IDAT') idat.push(data)
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const out = new Uint8Array(w * h * 3)
  for (let y = 0; y < h; y++) {
    if (raw[y * (1 + w * 3)] !== 0) throw new Error('unexpected PNG filter')
    out.set(raw.subarray(y * (1 + w * 3) + 1, (y + 1) * (1 + w * 3)), y * w * 3)
  }
  return out
}

function fillRect(
  buf: Uint8Array,
  w: number,
  x0: number,
  y0: number,
  rw: number,
  rh: number,
  c: Rgb,
): void {
  for (let y = y0; y < y0 + rh; y++)
    for (let x = x0; x < x0 + rw; x++) {
      const i = (y * w + x) * 3
      buf[i] = c[0]
      buf[i + 1] = c[1]
      buf[i + 2] = c[2]
    }
}

/**
 * Scanline fill of a loop set with the even-odd rule — the same rule the
 * pages fill these loops with, so the card and the svg cannot disagree
 * about where a hole is.
 */
function fillLoops(
  buf: Uint8Array,
  w: number,
  h: number,
  loops: readonly (readonly (readonly [number, number])[])[],
  c: Rgb,
): void {
  let yMin = Infinity
  let yMax = -Infinity
  for (const loop of loops)
    for (const [, y] of loop) {
      yMin = Math.min(yMin, y)
      yMax = Math.max(yMax, y)
    }
  const y0 = Math.max(0, Math.floor(yMin))
  const y1 = Math.min(h - 1, Math.ceil(yMax))
  for (let y = y0; y <= y1; y++) {
    const yc = y + 0.5
    const xs: number[] = []
    for (const loop of loops)
      for (let k = 0; k < loop.length; k++) {
        const p = loop[k]!
        const q = loop[(k + 1) % loop.length]!
        if (p[1] <= yc !== q[1] <= yc)
          xs.push(p[0] + ((yc - p[1]) / (q[1] - p[1])) * (q[0] - p[0]))
      }
    xs.sort((a, b) => a - b)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.round(xs[k]!))
      const b = Math.min(w - 1, Math.round(xs[k + 1]!) - 1)
      for (let x = a; x <= b; x++) {
        const i = (y * w + x) * 3
        buf[i] = c[0]
        buf[i + 1] = c[1]
        buf[i + 2] = c[2]
      }
    }
  }
}

/** Box-average the supersampled buffer down to card size. */
function downsample(buf: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array((w / SS) * (h / SS) * 3)
  for (let y = 0; y < h / SS; y++)
    for (let x = 0; x < w / SS; x++)
      for (let ch = 0; ch < 3; ch++) {
        let sum = 0
        for (let dy = 0; dy < SS; dy++)
          for (let dx = 0; dx < SS; dx++)
            sum += buf[((y * SS + dy) * w + x * SS + dx) * 3 + ch]!
        out[(y * (w / SS) + x) * 3 + ch] = Math.round(sum / (SS * SS))
      }
  return out
}

/* ── PNG encoding ─────────────────────────────────────────────────────────
 * Truecolour, 8 bits, filter 0 on every scanline. Nothing this file needs
 * from the format is more than four chunks long.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'ascii')
  const body = Buffer.concat([head.subarray(4), Buffer.from(data)])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([head.subarray(0, 4), body, crc])
}

export function png(w: number, h: number, rgb: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolour
  const raw = Buffer.alloc(h * (1 + w * 3))
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0 // filter: none
    Buffer.from(rgb.buffer, y * w * 3, w * 3).copy(raw, y * (1 + w * 3) + 1)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ])
}
