import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'
import { silhouette } from '@/lib/core/silhouette'
import type { Silhouette } from '@/lib/core/silhouette'
import { CARD_H, CARD_W, drawCard, pixelsOf, png } from './og.gen'
import type { Placed } from './og.gen'

/**
 * The share cards under public/og/, held against what the generator draws
 * today — the same contract as the favicon: a committed picture of the model
 * is an output of the model, so it can drift, so it is tested. Comparison is
 * on decoded pixels, never on the PNG bytes, so the machine that happened to
 * compress the committed file does not matter.
 *
 * There is one card for the collection and one per registry entry, which is
 * also how a fifth house is caught: its card does not exist yet and this
 * fails until it is drawn.
 *
 * To regenerate after a deliberate model change (or a new house):
 *   WRITE_OG=1 pnpm vitest run test/og.test.ts
 */

const DIR = 'public/og'
/** margin around the shelf on the collection card, and per-house margins */
const SHELF_MARGIN = 48
const HOUSE_MARGIN_X = 120
const HOUSE_MARGIN_TOP = 100
const GAP = 2.5

interface Card {
  readonly file: string
  readonly placed: readonly Placed[]
  readonly baseline: number
}

function cards(): Card[] {
  const sils = TRADITIONS.map((t) => {
    const b = t.build(t.defaultQuery)
    return { t, s: silhouette(b.house, b.scene.ridgeAxis ?? 0) }
  })
  const width = (s: Silhouette) => s.max[0] - s.min[0]

  // The collection: the shelf, all houses on one ground line at one scale.
  const totalM =
    sils.reduce((a, { s }) => a + width(s), 0) + GAP * (sils.length - 1)
  const maxH = Math.max(...sils.map(({ s }) => s.max[1]))
  const shelfScale = (CARD_W - SHELF_MARGIN * 2) / totalM
  let x = SHELF_MARGIN
  const shelf: Placed[] = sils.map(({ s }) => {
    const p = { s, x, scale: shelfScale }
    x += (width(s) + GAP) * shelfScale
    return p
  })
  const all: Card[] = [
    {
      file: `${DIR}/semua.png`,
      placed: shelf,
      baseline: (CARD_H + maxH * shelfScale) / 2,
    },
  ]

  // One card per house, fitted to its own extents on its own ground line.
  for (const { t, s } of sils) {
    const scale = Math.min(
      (CARD_W - HOUSE_MARGIN_X * 2) / width(s),
      (CARD_H - HOUSE_MARGIN_TOP * 2) / s.max[1],
    )
    all.push({
      file: `${DIR}/${t.slug}.png`,
      placed: [{ s, x: (CARD_W - width(s) * scale) / 2, scale }],
      baseline: (CARD_H + s.max[1] * scale) / 2,
    })
  }
  return all
}

describe('share cards', () => {
  const drawn = cards().map((c) => ({
    file: c.file,
    rgb: drawCard(c.placed, c.baseline),
  }))

  if (process.env.WRITE_OG) {
    mkdirSync(DIR, { recursive: true })
    for (const { file, rgb } of drawn) writeFileSync(file, png(CARD_W, CARD_H, rgb))
  }

  for (const { file, rgb } of drawn) {
    test(`${file} is what the generator draws`, () => {
      const committed = readFileSync(file)
      expect(Buffer.from(pixelsOf(committed)).equals(Buffer.from(rgb))).toBe(true)
    })
  }
})
