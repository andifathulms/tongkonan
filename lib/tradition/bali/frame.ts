/**
 * The bale, from the bataran to the post heads.
 *
 * Axes as in the other four: X runs front to rear, Y is up, Z runs along the
 * ridge, and the building mirrors about z = 0. Front here means kaja — toward
 * the mountain — and the note on orientation in `facade.ts` says why that is
 * not a compass bearing.
 *
 * The thing to look at in this file is that **no length is written as a
 * number**. Every set-out dimension comes through `sikutLength`, which is so
 * many of a named body measure plus the pengurip, and every section comes
 * through `stockLength`, which is the same without the increment. That is not
 * a stylistic constraint: it is what makes `checkModule` able to state
 * something true about the whole building rather than about the six lengths
 * someone remembered to route through the module. A metre written straight in
 * here would be a length nobody's body accounts for, and it would be invisible
 * to the provenance bar, which counts declarations rather than arithmetic.
 *
 * The `measured` list on the Layout is how the check sees the intent. Each
 * principal length records the count and unit it was set out in beside the
 * metres it came to, so the check compares a claim with a result instead of
 * re-deriving the claim from the result — which is the failure this codebase
 * has now found five times.
 */

import { partBuilders } from '@/lib/core/parts'
import type { RoofLevel } from '@/lib/core/hip'
import { sikut, sikutLength, stockLength } from './module'
import type { Sikut, Unit } from './module'
import { ALL_DIMS, DIMS, baleInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, BaliKinds, Layout, Measured, Part, Rules, Saka, Vec3 } from './types'

const builders = partBuilders<BaliKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * A running record of the set-out, so the check can read the intent.
 *
 * `principal` takes the pengurip; `stock` does not, and the two are separate
 * functions rather than a boolean argument because at the call site the
 * difference is a claim about what kind of dimension this is. A rafter's
 * section is a size of timber. A bay is a decision.
 */
function setOut() {
  const list: Measured[] = []
  return {
    list,
    principal(s: Sikut, key: string, nameId: string, nameEn: string, count: number, unit: Unit): number {
      const metres = sikutLength(s, count, unit)
      list.push({ key, nameId, nameEn, count, unit, metres })
      return metres
    },
    stock(s: Sikut, count: number, unit: Unit): number {
      return stockLength(s, count, unit)
    },
  }
}

export function resolveLayout(rules: Rules): Layout {
  const info = baleInfo(rules.bale)
  const s = sikut(rules.depa, {
    hasta: DIMS.hastaRatio.value,
    musti: DIMS.mustiRatio.value,
    useran: DIMS.useranRatio.value,
    nyari: DIMS.nyariRatio.value,
  }, rules.pengurip)

  const m = setOut()

  const bay = m.principal(s, 'bay', 'jarak antar saka', 'bay between saka', DIMS.bayUnits.value, 'depa')
  const sakaHeight = m.principal(s, 'sakaHeight', 'tinggi saka', 'height of a saka', DIMS.sakaHeightUnits.value, 'hasta')
  const bataranHeight = m.principal(s, 'bataranHeight', 'tinggi bataran', 'height of the bataran', DIMS.bataranHeightUnits.value, 'musti')
  const bataranOversail = m.principal(s, 'bataranOversail', 'juraian bataran', 'bataran oversail', DIMS.bataranOversailUnits.value, 'musti')
  const eaveOversail = m.principal(s, 'eaveOversail', 'panjang tritisan', 'depth of the overhang', DIMS.eaveOversailUnits.value, 'hasta')
  const ridgeRise = m.principal(s, 'ridgeRise', 'tinggi bubungan', 'rise of the ridge', DIMS.ridgeRiseUnits.value, 'hasta')
  const deckHeight = m.principal(s, 'deckHeight', 'tinggi bale-bale', 'height of the sitting deck', DIMS.deckHeightUnits.value, 'musti')
  const deckDepth = m.principal(s, 'deckDepth', 'dalam bale-bale', 'depth of the sitting deck', DIMS.deckDepthUnits.value, 'hasta')
  const stepRise = m.principal(s, 'stepRise', 'tinggi anak tangga', 'rise of a step', DIMS.stepRiseUnits.value, 'musti')

  const sakaSection = m.stock(s, DIMS.sakaSectionUnits.value, 'musti')
  const sendiHeight = m.stock(s, DIMS.sendiHeightUnits.value, 'nyari')

  // The post grid. Rows run across X, columns along Z.
  const sakaHalfX = ((info.rows - 1) * bay) / 2
  const sakaHalfZ = ((info.cols - 1) * bay) / 2

  const saka: Saka[] = []
  for (let r = 0; r < info.rows; r++) {
    for (let c = 0; c < info.cols; c++) {
      const x = info.rows === 1 ? 0 : -sakaHalfX + r * bay
      const z = info.cols === 1 ? 0 : -sakaHalfZ + c * bay
      saka.push({ id: `saka-${r}-${c}`, x, z, row: r, col: c })
    }
  }

  const bataranHalfX = sakaHalfX + sakaSection / 2 + bataranOversail
  const bataranHalfZ = sakaHalfZ + sakaSection / 2 + bataranOversail

  const eaveY = bataranHeight + sendiHeight + sakaHeight
  const eaveHalfX = bataranHalfX + eaveOversail
  const eaveHalfZ = bataranHalfZ + eaveOversail

  /*
   * The ridge, derived rather than declared.
   *
   * A hip has its four planes at one pitch, so the two hip ends close in from
   * the gable ends at the same rate the long slopes close in from the sides.
   * The ridge is therefore shorter than the eave by exactly the eave's own
   * half-depth at each end — which on a square plan leaves no ridge at all and
   * turns the roof into a pyramid.
   *
   * That is the whole reason `hipRoof` is canon and `ridgeLength` is not a
   * dimension. Declaring a ridge length would have let the four planes fall at
   * four pitches and still be called a hip.
   */
  const ridgeHalfZ = Math.max(0, eaveHalfZ - eaveHalfX)
  const ridgeY = eaveY + ridgeRise

  const roof: readonly RoofLevel[] = [
    { key: 'eave', halfX: eaveHalfX, halfZ: eaveHalfZ, y: eaveY },
    { key: 'ridge', halfX: 0, halfZ: ridgeHalfZ, y: ridgeY },
  ]

  const slope = Math.hypot(eaveHalfX, ridgeRise)
  const thatchCourses = Math.max(2, Math.round(slope / DIMS.thatchCourseDepth.value))

  return {
    rules,
    sikut: s,
    bataranHalfX,
    bataranHalfZ,
    bataranHeight,
    stepRise,
    /*
     * One fewer than the rises, because the top rise is the platform itself.
     * The first version counted the platform as a step and emitted a last
     * block of negative height — the pengurip, arriving as a shortfall.
     */
    stepCount: Math.max(1, Math.round(bataranHeight / stepRise) - 1),
    saka,
    sakaHalfX,
    sakaHalfZ,
    sakaHeight,
    sakaSection,
    rows: info.rows,
    cols: info.cols,
    roof,
    eaveY,
    ridgeY,
    thatchCourses,
    deck: {
      halfX: deckDepth / 2,
      halfZ: sakaHalfZ,
      // On the kaja side: the head end, toward the mountain.
      centreX: -sakaHalfX + deckDepth / 2,
      y: bataranHeight + deckHeight,
    },
    measured: m.list,
    dims: ALL_DIMS,
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const BATARAN_DIMS: readonly DimKey[] = [
  'bataranHeightUnits',
  'bataranOversailUnits',
  'batturFacing',
  'raisedOnBataran',
  'triAngga',
  'hastaRatio',
  'mustiRatio',
  'useranRatio',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = layout.sikut
  const facing = DIMS.batturFacing.value

  /*
   * The bataran, as a body and a skin.
   *
   * Two parts rather than one because they are two materials and the reader
   * can see the joint: a brick core faced in paras, which is how the platform
   * is actually built and why its arrises are crisp where a brick edge would
   * not be. The facing is modelled as a slightly larger box behind the core
   * rather than as five plates, because at this scale the plates would be
   * five coincident surfaces and the mesh check is right to dislike those.
   */
  parts.push(
    box(
      'bataran-inti',
      { name: 'bataran', nameId: 'Badan bataran', nameEn: 'Body of the bataran' },
      'bataran',
      0,
      'bata',
      BATARAN_DIMS,
      [0, (layout.bataranHeight - facing) / 2, 0],
      [(layout.bataranHalfX - facing) * 2, layout.bataranHeight - facing, (layout.bataranHalfZ - facing) * 2],
    ),
    box(
      'bataran-paras',
      { name: 'paras', nameId: 'Lapis paras', nameEn: 'Paras facing' },
      'bataran',
      1,
      'paras',
      BATARAN_DIMS,
      [0, layout.bataranHeight / 2, 0],
      [layout.bataranHalfX * 2, layout.bataranHeight, layout.bataranHalfZ * 2],
    ),
  )

  /*
   * The steps, on the kelod side.
   *
   * Toward the sea, which is the direction a person arrives from within the
   * compound — the shrine and the head of the yard are kaja, so you come up
   * onto the bale from the low end. There is no dimension for that: it is
   * which end of the building the boxes are put on, and the reason it is that
   * end is `kajaKelod`.
   */
  const stepWidth = stockLength(s, DIMS.stepWidthUnits.value, 'musti')
  const stepDepth = stockLength(s, DIMS.stepDepthUnits.value, 'musti')
  for (let k = 0; k < layout.stepCount; k++) {
    // Solid from the ground to its own tread, like the masonry it is, rather
    // than a slab floating at tread height.
    const tread = layout.bataranHeight - (k + 1) * layout.stepRise
    parts.push(
      box(
        `tangga-${k}`,
        { name: 'tangga', nameId: `Anak tangga ${k + 1}`, nameEn: `Step ${k + 1}` },
        'bataran',
        2 + k,
        'paras',
        ['stepRiseUnits', 'stepWidthUnits', 'stepDepthUnits', 'bataranHeightUnits', 'mustiRatio', 'raisedOnBataran'],
        [layout.bataranHalfX + stepDepth * (k + 0.5), tread / 2, 0],
        [stepDepth, Math.max(1e-3, tread), stepWidth],
      ),
    )
  }

  /* The sendi, and the saka standing on them. */
  const sendiHeight = stockLength(s, DIMS.sendiHeightUnits.value, 'nyari')
  const sendiWidth = stockLength(s, DIMS.sendiWidthUnits.value, 'musti')
  const sakaDims: readonly DimKey[] = [
    'sakaHeightUnits',
    'sakaSectionUnits',
    'bayUnits',
    'nameIsCount',
    'bodyMeasured',
    'penguripRule',
    'hastaRatio',
    'mustiRatio',
    'useranRatio',
  ]

  // The dish the post foot sits into, as a share of the stone's height.
  const seat = sendiHeight * DIMS.postSeat.value

  layout.saka.forEach((post, i) => {
    parts.push(
      box(
        `sendi-${post.row}-${post.col}`,
        { name: 'sendi', nameId: 'Sendi', nameEn: 'Pad stone' },
        'sendi',
        i,
        'paras',
        ['sendiHeightUnits', 'sendiWidthUnits', 'seatedOnSendi', 'nyariRatio', 'mustiRatio'],
        [post.x, layout.bataranHeight + sendiHeight / 2, post.z],
        [sendiWidth, sendiHeight, sendiWidth],
      ),
      box(
        post.id,
        { name: 'saka', nameId: 'Saka', nameEn: 'Post' },
        'saka',
        i,
        'kayu',
        sakaDims,
        // Dropped into the dish by `seat` and lengthened to match, so the head
        // still arrives at the declared height. A post whose foot merely
        // touched the top face of its stone would be standing on it, not
        // seated in it, and the joint check is right to refuse that.
        [post.x, layout.bataranHeight + sendiHeight - seat + (layout.sakaHeight + seat) / 2, post.z],
        [layout.sakaSection, layout.sakaHeight + seat, layout.sakaSection],
      ),
    )

    joints.push({
      id: `sendi-${post.row}-${post.col}`,
      kind: 'sendi',
      mortise: `sendi-${post.row}-${post.col}`,
      tenon: post.id,
      at: [post.x, layout.bataranHeight + sendiHeight - seat / 2, post.z],
      halfExtents: [layout.sakaSection / 2, seat / 2, layout.sakaSection / 2],
    })
  })

  /* The sunduk, tying the post heads into a frame. */
  const sundukDepth = stockLength(s, DIMS.sunduSectionUnits.value, 'nyari')
  const sundukWidth = stockLength(s, DIMS.boardThicknessUnits.value * 2, 'nyari')
  const headY = layout.bataranHeight + sendiHeight + layout.sakaHeight
  const tieY = headY - sundukDepth / 2
  const engage = DIMS.jointEngagement.value
  const sundukDims: readonly DimKey[] = ['sunduSectionUnits', 'bayUnits', 'nyariRatio', 'useranRatio']
  let tie = 0

  // Along Z, one between each pair in a column run; then across X likewise.
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c + 1 < layout.cols; c++) {
      const a = layout.saka.find((p) => p.row === r && p.col === c)
      const b = layout.saka.find((p) => p.row === r && p.col === c + 1)
      if (!a || !b) continue
      const id = `sunduk-z-${r}-${c}`
      parts.push(
        box(
          id,
          { name: 'sunduk', nameId: 'Sunduk', nameEn: 'Tie beam' },
          'sunduk',
          tie++,
          'kayu',
          sundukDims,
          [a.x, tieY, (a.z + b.z) / 2],
          [sundukWidth, sundukDepth, b.z - a.z],
        ),
      )
      for (const post of [a, b]) {
        joints.push({
          id: `${id}-${post.col}`,
          kind: 'pemuput',
          mortise: post.id,
          tenon: id,
          at: [post.x, tieY, post.z + (post === a ? 1 : -1) * (layout.sakaSection / 2) * engage],
          halfExtents: [sundukWidth / 2, sundukDepth / 2, (layout.sakaSection / 2) * engage],
        })
      }
    }
  }
  for (let c = 0; c < layout.cols; c++) {
    for (let r = 0; r + 1 < layout.rows; r++) {
      const a = layout.saka.find((p) => p.row === r && p.col === c)
      const b = layout.saka.find((p) => p.row === r + 1 && p.col === c)
      if (!a || !b) continue
      const id = `sunduk-x-${r}-${c}`
      parts.push(
        box(
          id,
          { name: 'sunduk', nameId: 'Sunduk', nameEn: 'Tie beam' },
          'sunduk',
          tie++,
          'kayu',
          sundukDims,
          [(a.x + b.x) / 2, tieY - sundukDepth, a.z],
          [b.x - a.x, sundukDepth, sundukWidth],
        ),
      )
      for (const post of [a, b]) {
        joints.push({
          id: `${id}-${post.row}`,
          kind: 'pemuput',
          mortise: post.id,
          tenon: id,
          at: [post.x + (post === a ? 1 : -1) * (layout.sakaSection / 2) * engage, tieY - sundukDepth, post.z],
          halfExtents: [(layout.sakaSection / 2) * engage, sundukDepth / 2, sundukWidth / 2],
        })
      }
    }
  }

  /* The paving, and the sitting deck. */
  const board = stockLength(s, DIMS.boardThicknessUnits.value, 'nyari')
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai bataran', nameEn: 'Platform paving' },
      'lantai',
      0,
      'paras',
      ['boardThicknessUnits', 'bataranHeightUnits', 'nyariRatio'],
      [0, layout.bataranHeight + board / 2, 0],
      [(layout.bataranHalfX - facing) * 2, board, (layout.bataranHalfZ - facing) * 2],
    ),
    box(
      'bale-bale',
      { name: 'bale-bale', nameId: 'Bale-bale', nameEn: 'Sitting deck' },
      'lantai',
      1,
      'papan',
      ['deckHeightUnits', 'deckDepthUnits', 'boardThicknessUnits', 'hastaRatio', 'mustiRatio', 'useranRatio'],
      [layout.deck.centreX, layout.deck.y - board / 2, 0],
      [layout.deck.halfX * 2, board, layout.deck.halfZ * 2],
    ),
  )
  // Legs, so the deck is a platform rather than a floating plane.
  const legSection = stockLength(s, DIMS.deckLegUnits.value, 'musti')
  const legY = layout.bataranHeight + (layout.deck.y - board - layout.bataranHeight) / 2
  const legHeight = Math.max(1e-3, layout.deck.y - board - layout.bataranHeight)
  for (const sx of [-1, 1] as const) {
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `bale-bale-kaki-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`,
          { name: 'kaki', nameId: 'Kaki bale-bale', nameEn: 'Deck leg' },
          'lantai',
          2,
          'kayu',
          ['deckHeightUnits', 'deckLegUnits', 'mustiRatio'],
          [
            layout.deck.centreX + sx * (layout.deck.halfX - legSection),
            legY,
            sz * (layout.deck.halfZ - legSection),
          ],
          [legSection, legHeight, legSection],
        ),
      )
    }
  }

  return { parts, joints }
}

/** Where the roof surface sits directly above a point on the plan. */
export function eavePoint(layout: Layout): Vec3 {
  const eave = layout.roof[0]
  return [eave?.halfX ?? 0, eave?.y ?? 0, 0]
}
