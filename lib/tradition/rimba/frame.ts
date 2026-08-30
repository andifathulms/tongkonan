/**
 * The sudung, from the poles up — and there are not many of them.
 *
 * The smallest builder in this project, and the only one where the whole
 * sequence is an afternoon's work by the family that will sleep under it.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse.
 * The single slope falls from the front (−X, high) to the back (+X, low), and
 * the sleepers lie side by side along Z.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, dropOf } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, RimbaKinds, Rules } from './types'

const builders = partBuilders<RimbaKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  /*
   * The plan is a row of sleeping bodies: shoulders and the gap between them
   * along Z, one body's length across X, plus a little floor beyond the row.
   */
  const across = rules.orang * DIMS.shoulderWidth.value + (rules.orang - 1) * DIMS.sleepGap.value
  const halfZ = (across + DIMS.floorMargin.value * 2) / 2
  const halfX = (DIMS.lyingLength.value + DIMS.floorMargin.value * 2) / 2
  const floorY = rules.panggung ? DIMS.floorHeight.value : 0

  const highY = floorY + DIMS.frontHeight.value
  const lowY = highY - dropOf(rules.lama)

  /*
   * The longest member the shelter contains, which is what the carrying rule
   * bites on. It is the roof edge across the front: everything else is shorter
   * than it, and it grows with the number of people sleeping underneath.
   */
  const longest = halfZ * 2 + DIMS.ridgeSection.value * 2

  return {
    rules,
    floor: { halfX, halfZ, y: floorY },
    body: {
      lying: DIMS.lyingLength.value,
      shoulders: DIMS.shoulderWidth.value,
      gap: DIMS.sleepGap.value,
    },
    roof: { highY, lowY, reach: DIMS.eaveReach.value },
    carry: DIMS.carryLength.value,
    longest,
    abandoned: DIMS.abandonedAt.value,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const FRAME_DIMS: readonly DimKey[] = ['postSection', 'carryLength', 'everythingIsCarried', 'nothingIsFixed']

export function buildSudung(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const engage = DIMS.jointEngagement.value
  const edge = DIMS.ridgeSection.value
  const dropKey: DimKey = layout.rules.lama === 'sehari' ? 'dropShort' : 'dropLong'

  /* Four poles, standing on the ground: nothing is buried and nothing is pegged. */
  const columns: readonly (readonly [number, number, number])[] = [
    [-(layout.floor.halfX - post), layout.roof.highY, -(layout.floor.halfZ - post)],
    [-(layout.floor.halfX - post), layout.roof.highY, layout.floor.halfZ - post],
    [layout.floor.halfX - post, layout.roof.lowY, -(layout.floor.halfZ - post)],
    [layout.floor.halfX - post, layout.roof.lowY, layout.floor.halfZ - post],
  ]
  columns.forEach(([x, top, z], i) => {
    parts.push(
      box(
        `tiang-${i}`,
        { name: 'tiang', nameId: `Tiang ${i + 1}`, nameEn: `Pole ${i + 1}` },
        'tiang',
        i,
        'kayu',
        [...FRAME_DIMS, 'frontHeight', dropKey],
        [x, top / 2, z],
        [post, top, post],
      ),
    )
  })

  /* The two edge poles the slope runs between, front high and back low. */
  const edges: readonly (readonly [string, number, number])[] = [
    ['depan', -(layout.floor.halfX - post), layout.roof.highY],
    ['belakang', layout.floor.halfX - post, layout.roof.lowY],
  ]
  edges.forEach(([key, x, y], i) => {
    const id = `balok-${key}`
    parts.push(
      box(
        id,
        { name: 'balok', nameId: `Balok ${key}`, nameEn: `${i === 0 ? 'Front' : 'Back'} edge pole` },
        'tiang',
        10 + i,
        'kayu',
        ['ridgeSection', 'carryLength', 'everythingIsCarried', 'sizeIsSleepingBodies'],
        [x, y - edge / 2, 0],
        [edge, edge, layout.floor.halfZ * 2 + edge * 2],
      ),
    )
    joints.push({
      id: `ikat-${key}`,
      kind: 'ikat',
      mortise: `tiang-${i * 2}`,
      tenon: id,
      at: [x, y - edge / 2, -(layout.floor.halfZ - post)],
      halfExtents: [(post * engage) / 2, (edge * engage) / 2, (post * engage) / 2],
    })
  })

  /* The sleeping platform, or the bare ground if there is none. */
  if (layout.rules.panggung) {
    const deck = DIMS.deckThickness.value
    parts.push(
      box(
        'lantai',
        { name: 'lantai', nameId: 'Lantai', nameEn: 'Sleeping platform' },
        'lantai',
        0,
        'bambu',
        ['floorHeight', 'deckThickness', 'lyingLength', 'shoulderWidth', 'sleepGap', 'floorMargin', 'sizeIsSleepingBodies'],
        [0, layout.floor.y - deck / 2, 0],
        [layout.floor.halfX * 2, deck, layout.floor.halfZ * 2],
      ),
    )
  }

  /* The rafters, and one sheet of leaf over them. */
  const span = Math.hypot(layout.floor.halfX * 2, layout.roof.highY - layout.roof.lowY)
  const count = Math.max(2, Math.round((layout.floor.halfZ * 2) / DIMS.rafterSpacing.value))
  const lean = Math.atan2(layout.roof.highY - layout.roof.lowY, layout.floor.halfX * 2)
  for (let i = 0; i <= count; i++) {
    const t = count === 0 ? 0.5 : i / count
    const z = -layout.floor.halfZ + layout.floor.halfZ * 2 * t
    parts.push(
      box(
        `kasau-${i}`,
        { name: 'kasau', nameId: `Kasau ${i + 1}`, nameEn: `Rafter ${i + 1}` },
        'atap',
        i,
        'bambu',
        ['rafterSpacing', 'ridgeSection', dropKey, 'carryLength'],
        [0, (layout.roof.highY + layout.roof.lowY) / 2 - edge, z],
        [span, edge, edge],
        [0, 0, -lean],
      ),
    )
  }
  const leaf = DIMS.leafThickness.value
  const reach = DIMS.eaveReach.value
  parts.push(
    box(
      'daun',
      { name: 'daun', nameId: 'Atap daun', nameEn: 'Leaf roof' },
      'atap',
      100,
      'daun',
      ['leafThickness', 'eaveReach', dropKey, 'melangunEndsIt'],
      [reach / 2, (layout.roof.highY + layout.roof.lowY) / 2 - edge + leaf, 0],
      [span + reach, leaf, layout.floor.halfZ * 2 + edge * 2],
      [0, 0, -lean],
    ),
  )
  joints.push({
    id: 'ikat-daun',
    kind: 'ikat',
    mortise: 'kasau-0',
    tenon: 'daun',
    at: [0, (layout.roof.highY + layout.roof.lowY) / 2 - edge + leaf / 2, -layout.floor.halfZ],
    halfExtents: [(edge * engage) / 2, (leaf * engage) / 2, (edge * engage) / 2],
  })

  /*
   * The fire, on the ground beside the platform rather than under the roof.
   * It is one of the two things here that leave when the family does — and
   * what stays behind is the building.
   */
  parts.push(
    box(
      'perapian',
      { name: 'perapian', nameId: 'Perapian', nameEn: 'The fire' },
      'perkakas',
      0,
      'kayu',
      ['hearthSide', 'hearthHeight', 'melangunEndsIt'],
      [
        -(layout.floor.halfX + DIMS.hearthSide.value * 0.7),
        DIMS.hearthHeight.value / 2,
        0,
      ],
      [DIMS.hearthSide.value, DIMS.hearthHeight.value, DIMS.hearthSide.value],
    ),
  )

  return { parts, joints }
}
