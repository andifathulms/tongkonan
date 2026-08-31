import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, expect, test } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'
import { silhouette } from '@/lib/core/silhouette'
import type { Silhouette } from '@/lib/core/silhouette'
import { COPY, LOCALES, pick, plateNo } from '@/lib/i18n'
import { CARD_H, CARD_W, GROUND, MARGIN, SKY, drawCard, pixelsOf, png } from './og.gen'
import { packShelf } from '@/lib/draw/shelf'
import type { Shelf } from '@/lib/draw/shelf'
import type { Placed, Sheet } from './og.gen'
import { has } from './lettering'

/**
 * The share cards under public/og/, held against what the generator draws
 * today — the same contract as the silhouette: a committed picture of the
 * model is an output of the model, so it can drift, so it is tested.
 * Comparison is on decoded pixels, never on the PNG bytes, so the machine
 * that happened to compress the committed file does not matter.
 *
 * There is one card for the collection and one per registry entry, in each
 * locale — a house's name and the place it stands are written in the
 * reader's own language, and a card is the one part of a shared link that
 * cannot fall back to the other one. That is also how a thirty-sixth house
 * is caught: its cards do not exist yet and this fails until they are drawn.
 *
 * To regenerate after a deliberate model or copy change (or a new house):
 *   WRITE_OG=1 pnpm vitest run test/og.test.ts
 */

const DIR = 'public/og'
/** margin around the shelf on the collection card */
const SHELF_MARGIN = 48
/** the gap between houses on the shelf, in metres */
const GAP = 2.5


/** The pixels per metre a packing gets on this card, width or height bound. */
function shelfScaleOf(shelf: Shelf<unknown>): number {
  return Math.min(
    (CARD_W - SHELF_MARGIN * 2) / shelf.width,
    (GROUND - SKY) / (shelf.rows.length * shelf.height),
  )
}

/** How uneven a packing is: the widest row against the narrowest. */
function spread(shelf: Shelf<unknown>): number {
  const w = shelf.rows.map((r) => r.width)
  return Math.max(...w) - Math.min(...w)
}

/**
 * The packing that draws the collection largest on a card, and most evenly.
 *
 * The landing's ROW_TARGET is a number about a page a metre tall and a
 * thousand pixels wide, where rows are cheap and width is scarce. A card is
 * 1200 by 630 with a title block in it, where the opposite is true: at the
 * landing's target the thirty-five wrap to seven rows and every house is
 * three millimetres of ink. So the card asks the same packer a different
 * question — sweep the row target, and keep the packing that comes out at the
 * most pixels per metre.
 *
 * Scale alone is not enough to decide it. Several targets reach the same
 * scale, because past a point the height of the stack binds and widening the
 * rows buys nothing; among those, first-fit will happily leave one house
 * alone on the last ground line with a metre of empty rule beside it. So a
 * tie on scale is broken on evenness. It is a tie-break rather than a term in
 * the score, because a rounder-looking shelf is never worth a smaller one.
 *
 * Nothing here counts to thirty-five: a thirty-sixth house is packed by the
 * same walk and may well change the answer, which is the point of computing
 * it rather than writing it down.
 */
function bestShelf<T extends { readonly width: number; readonly height: number }>(
  items: readonly T[],
): Shelf<T> {
  const total = items.reduce((a, i) => a + i.width, 0) + GAP * (items.length - 1)
  let best: Shelf<T> | null = null
  for (let i = 0; i <= 120; i++) {
    const target = total * (1 / 6 + (i / 120) * (1 - 1 / 6))
    const shelf = packShelf(items, { target, gap: GAP, pad: 0 })
    if (!best) {
      best = shelf
      continue
    }
    const a = shelfScaleOf(shelf)
    const b = shelfScaleOf(best)
    // A hair of tolerance, because these are floating-point metres and two
    // targets that pack identically must not depend on the last bit.
    if (a > b * 1.001 || (a > b * 0.999 && spread(shelf) < spread(best))) best = shelf
  }
  if (!best) throw new Error('no packing')
  return best
}

interface Card {
  readonly file: string
  readonly placed: readonly Placed[]
  readonly sheet: Sheet
}

function cards(): Card[] {
  const sils = TRADITIONS.map((t) => {
    const b = t.build(t.defaultQuery)
    return { t, s: silhouette(b.house, b.scene.ridgeAxis ?? 0) }
  })
  const width = (s: Silhouette) => s.max[0] - s.min[0]
  const all: Card[] = []

  for (const locale of LOCALES) {
    /*
     * The collection: every house at one scale, on as many ground lines as
     * it takes — the landing's own packing, off the same module, so the two
     * pictures of the collection cannot disagree about how it wraps. Its
     * title is the claim rather than the name, because the name is already
     * at the head and a card that says one thing twice says nothing.
     */
    const shelf = bestShelf(sils.map(({ s }) => ({ s, width: width(s), height: s.max[1] })))
    const shelfScale = shelfScaleOf(shelf)
    const rowH = shelf.height * shelfScale
    const top = SKY + (GROUND - SKY - rowH * shelf.rows.length) / 2
    all.push({
      file: `${DIR}/${locale}/semua.png`,
      placed: shelf.rows.flatMap((row, r) =>
        row.items.map((it) => ({
          s: it.s,
          x: SHELF_MARGIN + it.ox * shelfScale,
          scale: shelfScale,
          baseline: top + rowH * (r + 1),
        })),
      ),
      sheet: {
        head: pick(COPY.appName, locale),
        plate: '',
        title: pick(COPY.tagline, locale),
        sub: '',
      },
    })

    // One card per house, fitted to the room the title block leaves it.
    sils.forEach(({ t, s }, i) => {
      const scale = Math.min(
        (CARD_W - MARGIN * 2) / width(s),
        (GROUND - SKY) / s.max[1],
      )
      all.push({
        file: `${DIR}/${locale}/${t.slug}.png`,
        placed: [{ s, x: (CARD_W - width(s) * scale) / 2, scale, baseline: GROUND }],
        sheet: {
          head: pick(COPY.appName, locale),
          plate: plateNo(i + 1),
          title: t.house[locale],
          sub: t.place[locale],
        },
      })
    })
  }
  return all
}

describe('share cards', () => {
  const drawn = cards().map((c) => ({
    file: c.file,
    rgb: drawCard(c.placed, c.sheet),
  }))

  if (process.env.WRITE_OG) {
    for (const l of LOCALES) mkdirSync(`${DIR}/${l}`, { recursive: true })
    for (const { file, rgb } of drawn) writeFileSync(file, png(CARD_W, CARD_H, rgb))
  }

  for (const { file, rgb } of drawn) {
    test(`${file} is what the generator draws`, () => {
      const committed = readFileSync(file)
      expect(Buffer.from(pixelsOf(committed)).equals(Buffer.from(rgb))).toBe(true)
    })
  }

  /*
   * The alphabet is hand-drawn and finite, and the copy it letters is not.
   * A house named with a character nobody drew would throw at generation
   * time, which is a fine way to find out — but only if somebody runs it.
   * This says so up front, and names the character.
   */
  test('the alphabet can letter every name and place on a card', () => {
    const missing = new Set<string>()
    for (const locale of LOCALES)
      for (const t of TRADITIONS)
        for (const ch of `${t.house[locale]}${t.place[locale]}${pick(COPY.appName, locale)}${pick(COPY.tagline, locale)}`)
          if (!has(ch)) missing.add(ch)
    expect([...missing]).toEqual([])
  })
})
