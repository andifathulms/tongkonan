/**
 * The bade, from the lattice up.
 *
 * The order is the whole argument. The carrying lattice is built first because
 * it is the foundation — the only one this building has, and the only
 * foundation in this project that walks. Everything above it is stacked, tied
 * and papered, and none of it is fixed to anything that stays.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse. The
 * front is where the tower is carried toward, which is −X.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, frameOf, pemikulInfo } from './rules'
import type { DimKey } from './rules'
import type { BadeKinds, Joint, Layout, Part, Rules, Tumpang } from './types'

const builders = partBuilders<BadeKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = pemikulInfo(rules.pemikul)
  const side = frameOf(rules.pemikul)
  const half = side / 2
  const frameY = DIMS.frameDepth.value
  const bodyY = frameY
  const bodyHalf = half - DIMS.bodyInset.value
  const bodyHeight = DIMS.bodyHeight.value

  /*
   * The tiers: a stack of roofs that shelter nothing.
   *
   * Each is narrower than the one below and the count is the standing of the
   * dead. Nothing is under them, which is the difference between this stack
   * and the joglo's: there the tiers are a roof over a room, and here they are
   * the statement itself with air underneath.
   */
  const tiers: Tumpang[] = []
  let y = bodyY + bodyHeight
  for (let i = 0; i < rules.tumpang; i++) {
    const shrink = Math.pow(DIMS.tumpangTaper.value, i)
    tiers.push({
      index: i,
      y,
      halfX: bodyHalf * shrink + DIMS.tumpangEave.value,
      halfZ: bodyHalf * shrink + DIMS.tumpangEave.value,
      rise: DIMS.tumpangRise.value,
    })
    y += DIMS.tumpangRise.value
  }

  return {
    rules,
    frame: { halfX: half, halfZ: half, y: frameY, bearers: info.count },
    body: { y: bodyY, halfX: bodyHalf, halfZ: bodyHalf, height: bodyHeight },
    tiers,
    apexY: y,
    payung: {
      present: rules.payung,
      radius: DIMS.payungRadius.value,
      y: y + DIMS.tumpangRise.value * 0.4,
    },
    tipLimit: DIMS.tipLimit.value,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const FRAME_DIMS: readonly DimKey[] = [
  'frameDepth',
  'frameSection',
  'bearerSpacing',
  'shoulderY',
  'carriedNotFounded',
  'weightOverTheBearers',
]

export function buildTower(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const depth = DIMS.frameDepth.value
  const section = DIMS.frameSection.value
  const engage = DIMS.jointEngagement.value
  const post = DIMS.postSection.value

  /*
   * The lattice: beams one way, beams the other, and shoulders between them.
   *
   * How many beams there are follows from how many people have to fit
   * underneath — this project's only plan that comes from a headcount of the
   * living rather than from a room, a rank or a body.
   */
  const beams = Math.max(2, Math.round((layout.frame.halfX * 2) / DIMS.bearerSpacing.value))
  for (let i = 0; i <= beams; i++) {
    const t = beams === 0 ? 0.5 : i / beams
    const z = -layout.frame.halfZ + layout.frame.halfZ * 2 * t
    parts.push(
      box(
        `usungan-${i}`,
        { name: 'usungan', nameId: 'Balok usungan', nameEn: 'Carrying beam' },
        'usungan',
        i,
        'bambu',
        FRAME_DIMS,
        [0, depth / 2, z],
        [layout.frame.halfX * 2.4, depth, section],
      ),
    )
  }
  for (const sx of [-1, 1] as const) {
    const id = `usungan-lintang-${sx > 0 ? 'a' : 'b'}`
    parts.push(
      box(
        id,
        { name: 'usungan', nameId: 'Balok lintang', nameEn: 'Cross beam' },
        'usungan',
        100 + (sx > 0 ? 1 : 0),
        'bambu',
        FRAME_DIMS,
        [sx * (layout.frame.halfX - section), depth * 1.2, 0],
        // long enough to cross the outermost beam rather than stopping on its
        // centre line, which is what lets the lashing at that corner engage
        [section, depth, layout.frame.halfZ * 2 + section],
      ),
    )
    joints.push({
      id: `tali-usungan-${sx > 0 ? 'a' : 'b'}`,
      kind: 'tali',
      mortise: 'usungan-0',
      tenon: id,
      /*
       * A lashing is not a peg: it engages where the two lengths of bamboo lie
       * against each other, so the joint box is the overlap of the two and not
       * the plane they meet at. Written the second way it hangs off the end of
       * the lower beam, which is the fault this project has now made six times.
       */
      at: [sx * (layout.frame.halfX - section), depth * 0.85, -layout.frame.halfZ],
      halfExtents: [section / 2, (depth * 0.3 * engage) / 2, section / 2],
    })
  }

  /* The body, where the dead ride, standing on the lattice. */
  parts.push(
    box(
      'badan',
      { name: 'badan', nameId: 'Badan bade', nameEn: 'Body of the tower' },
      'badan',
      0,
      'kayu',
      ['bodyHeight', 'bodyInset', 'builtToBeBurned'],
      [0, layout.body.y + layout.body.height / 2, 0],
      [layout.body.halfX * 2, layout.body.height, layout.body.halfZ * 2],
    ),
  )
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `tiang-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`,
          { name: 'tiang', nameId: 'Tiang bambu', nameEn: 'Bamboo post' },
          'badan',
          1 + (sx > 0 ? 2 : 0) + (sz > 0 ? 1 : 0),
          'bambu',
          ['postSection', 'bodyHeight', 'tumpangRise'],
          [
            sx * (layout.body.halfX - post),
            layout.body.y + layout.body.height / 2,
            sz * (layout.body.halfZ - post),
          ],
          [post, layout.body.height, post],
        ),
      )
    }
  }

  /* The tiers: the count is the standing, and nothing is under them. */
  layout.tiers.forEach((tier, i) => {
    parts.push(
      box(
        `tumpang-${i}`,
        {
          name: 'tumpang',
          nameId: `Tumpang ${i + 1}`,
          nameEn: `Tier ${i + 1}`,
        },
        'tumpang',
        i,
        'bambu',
        ['tumpangRise', 'tumpangTaper', 'tumpangEave', 'tiersAreStanding'],
        [0, tier.y + tier.rise / 2, 0],
        [tier.halfX * 2, tier.rise, tier.halfZ * 2],
      ),
    )
  })

  /* Cloth and paper over all of it, and every gram of it burns. */
  const cloth = DIMS.clothThickness.value
  parts.push(
    box(
      'kain-badan',
      { name: 'kain', nameId: 'Kain badan', nameEn: 'Cloth over the body' },
      'kain',
      0,
      'kain',
      ['clothThickness', 'bodyHeight', 'everythingBurns'],
      [0, layout.body.y + layout.body.height / 2, 0],
      [layout.body.halfX * 2 + cloth, layout.body.height * 0.9, layout.body.halfZ * 2 + cloth],
    ),
  )
  layout.tiers.forEach((tier, i) => {
    parts.push(
      box(
        `kertas-${i}`,
        { name: 'kertas', nameId: `Kertas tumpang ${i + 1}`, nameEn: `Paper on tier ${i + 1}` },
        'kain',
        1 + i,
        'kertas',
        ['clothThickness', 'tumpangEave', 'everythingBurns'],
        [0, tier.y + tier.rise * 0.5, 0],
        [tier.halfX * 2 + cloth, cloth, tier.halfZ * 2 + cloth],
      ),
    )
  })

  /* The umbrella, last and highest. */
  if (layout.payung.present) {
    parts.push(
      box(
        'payung-tiang',
        { name: 'payung', nameId: 'Tiang payung', nameEn: 'Umbrella staff' },
        'payung',
        0,
        'bambu',
        ['payungRadius', 'tumpangRise'],
        [0, layout.apexY + (layout.payung.y - layout.apexY) / 2, 0],
        [post, layout.payung.y - layout.apexY, post],
      ),
    )
    parts.push(
      box(
        'payung',
        { name: 'payung', nameId: 'Payung', nameEn: 'Umbrella' },
        'payung',
        1,
        'kain',
        ['payungRadius', 'clothThickness', 'everythingBurns'],
        [0, layout.payung.y, 0],
        [layout.payung.radius * 2, cloth * 2, layout.payung.radius * 2],
      ),
    )
  }

  return { parts, joints }
}
