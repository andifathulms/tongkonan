/**
 * The roof of an uma: a low hip, and then a tower standing on its shoulder.
 *
 * Two stacks rather than one, and that is the finding this house contributes.
 * `steppedHip` takes a list of rectangles and skins them, and it has now made
 * a stepped hip, a pyramid and a gable. Here it is asked for something it was
 * never designed for: a form that goes *out and up, then in and up a long
 * way*, and it does it without a change — because a tower is just three more
 * levels on the same stack.
 *
 * What it cannot do is treat them as two objects, and they are two objects: a
 * house that keeps no marapu has the lower stack and not the upper one. So
 * `roofLevels` returns one list or the other, and the difference between an
 * uma mbatangu and an uma kamadungu is which levels exist rather than which
 * code runs.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, tubeMesh } from '@/lib/core/geometry'
import { hipRun, hipSurfaceAt, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, SumbaKinds } from './types'

const builders = partBuilders<SumbaKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'shoulderRise',
  'coreSpanX',
  'coreSpanZ',
  'eaveOversail',
  'raftersPerSide',
]

/**
 * Eave, shoulder, and — on a towered house — the tower's flat top.
 *
 * Three levels where the other houses have two, and the middle one is the
 * shoulder: the line where the lower roof stops and the tower begins. On an
 * uma kamadungu the list ends there, and the shoulder becomes an ordinary
 * ridge.
 */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const lower: RoofLevel[] = [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ: layout.eaveHalfZ, y: layout.eaveY },
    { key: 'shoulder', halfX: layout.shoulderHalfX, halfZ: layout.shoulderHalfZ, y: layout.shoulderY },
  ]
  if (!layout.menara.present) {
    // No tower: the shoulder closes to a ridge and the roof is a plain hip.
    lower.push({
      key: 'ridge',
      halfX: 0,
      halfZ: Math.max(0, layout.shoulderHalfZ - layout.shoulderHalfX),
      y: layout.shoulderY + layout.shoulderHalfX,
    })
    return lower
  }
  const taper = DIMS.menaraTaper.value
  lower.push({
    key: 'peak',
    halfX: layout.menara.halfX * taper,
    halfZ: layout.menara.halfZ * taper,
    y: layout.menara.peakY,
  })
  return lower
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  const total = layout.thatchCourses + layout.towerCourses
  return courseBands(Math.max(3, total), DIMS.thatchLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const levels = roofLevels(layout)
  const eave = levels[0]
  const shoulder = levels[1]
  if (!eave || !shoulder) throw new Error('a roof needs an eave and a shoulder')
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* The lower roof: rafters from the eave up to the shoulder, on four planes. */
  const rise = shoulder.y - eave.y
  const perSide = Math.max(1, Math.round(DIMS.raftersPerSide.value))
  const runX = Math.hypot(eave.halfX - shoulder.halfX, rise)
  const pitchX = Math.atan2(eave.halfX - shoulder.halfX, rise)
  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= perSide; k++) {
      const z = -shoulder.halfZ + (k / perSide) * shoulder.halfZ * 2
      parts.push(
        box(
          `kasau-${sx > 0 ? 'a' : 'b'}-${k}`,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'menara',
          order++,
          'bambu',
          FRAME_DIMS,
          [sx * ((eave.halfX + shoulder.halfX) / 2), eave.y + rise / 2, z],
          [section, runX, section],
          [0, 0, sx * pitchX],
        ),
      )
    }
  }
  const runZ = Math.hypot(eave.halfZ - shoulder.halfZ, rise)
  const pitchZ = Math.atan2(eave.halfZ - shoulder.halfZ, rise)
  for (const sz of [-1, 1] as const) {
    for (let k = 0; k <= perSide; k++) {
      const x = -shoulder.halfX + (k / perSide) * shoulder.halfX * 2
      parts.push(
        box(
          `kasau-ujung-${sz > 0 ? 'a' : 'b'}-${k}`,
          { name: 'kasau', nameId: 'Kasau ujung', nameEn: 'Hip-end rafter' },
          'menara',
          order++,
          'bambu',
          FRAME_DIMS,
          [x, eave.y + rise / 2, sz * ((eave.halfZ + shoulder.halfZ) / 2)],
          [section, runZ, section],
          [-sz * pitchZ, 0, 0],
        ),
      )
    }
  }

  /*
   * The tower frame: four corner members from the shoulder to the peak.
   *
   * Slender and steep — they are the container's walls, not a roof's rafters,
   * and their length is the whole argument of the building.
   */
  const top = levels[2]
  if (layout.menara.present && top) {
    const towerSec = DIMS.towerSection.value
    const towerRise = top.y - shoulder.y
    const corners: readonly (readonly [-1 | 1, -1 | 1])[] = [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]
    /*
     * Tubes rather than rotated boxes, because a tapering tower narrows in
     * both directions at once.
     *
     * Built as boxes leaning on one axis first, which meant every corner post
     * stayed at a fixed z while its top was supposed to be pulled inward — so
     * the beams across the head of the tower reached for four posts that were
     * not where the corners are. A two-axis Euler would work and would put the
     * orientation of the member into exactly the arithmetic most likely to be
     * wrong; two endpoints cannot be wrong in that way.
     */
    corners.forEach(([sx, sz], i) => {
      parts.push(
        meshPart(
          `menara-tiang-${i}`,
          { name: 'tiang menara', nameId: 'Tiang menara', nameEn: 'Tower post' },
          'menara',
          100 + i,
          'kayu',
          ['towerSection', 'menaraRise', 'menaraTaper', 'towerHoldsTheMarapu'],
          tubeMesh(
            [
              [sx * shoulder.halfX, shoulder.y, sz * shoulder.halfZ],
              [sx * top.halfX, top.y, sz * top.halfZ],
            ],
            () => towerSec / 2,
            4,
            0.4,
          ),
        ),
      )
    })
    // Two beams across the top of the tower, tying the four corner posts —
    // and giving the ridge something to land on. Written without them and the
    // ridge floated between four posts it never touched.
    const towerSecTop = DIMS.towerSection.value
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `menara-balok-${sz > 0 ? 'a' : 'b'}`,
          { name: 'balok', nameId: 'Balok puncak', nameEn: 'Tower head beam' },
          'menara',
          150 + (sz > 0 ? 1 : 0),
          'kayu',
          ['towerSection', 'menaraTaper', 'peakIsFlat'],
          [0, top.y - towerSecTop / 2, sz * top.halfZ],
          [top.halfX * 2, towerSecTop, towerSecTop],
        ),
      )
    }
    parts.push(
      box(
        'menara-bubungan',
        { name: 'bubungan', nameId: 'Bubungan menara', nameEn: 'Tower ridge' },
        'menara',
        200,
        'kayu',
        ['towerSection', 'menaraTaper', 'peakIsFlat'],
        [0, top.y - towerSec / 2, 0],
        [towerSec, towerSec, top.halfZ * 2],
      ),
    )
    // The ridge lands on the two head beams, which is what it actually rests
    // on — it was jointed to the corner posts at first, which it never touches.
    for (const sz of [-1, 1] as const) {
      joints.push({
        id: `takik-menara-${sz > 0 ? 'a' : 'b'}`,
        kind: 'takik',
        mortise: `menara-balok-${sz > 0 ? 'a' : 'b'}`,
        tenon: 'menara-bubungan',
        // The overlap of ridge and beam: the ridge ends at the beam's centre
        // line, so they share half a section rather than a whole one.
        at: [0, top.y - towerSec / 2, sz * (top.halfZ - towerSec / 4)],
        halfExtents: [towerSec / 2, (towerSec * engage) / 2, towerSec / 4],
      })
    }
  }

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const levels = roofLevels(layout)
  const bed = DIMS.rafterSection.value / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterSection',
  ]
  let order = 0

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `alang-${band.course}`,
        {
          name: 'alang-alang',
          nameId: `Lapis alang-alang ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'alang',
        order++,
        'alang',
        dims,
        steppedHip(levels, {
          uvScale: 0.4,
          fFrom: from,
          fTo: to,
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/** The finials at the ends of the tower's ridge. */
export function buildTanduk(layout: Layout): readonly Part[] {
  if (!layout.menara.present) return []
  const levels = roofLevels(layout)
  const top = levels[levels.length - 1]
  if (!top) return []
  const bed = DIMS.rafterSection.value / 2 + DIMS.thatchBed.value
  const surface = hipSurfaceAt(levels, 1, bed)
  const sec = DIMS.tandukSection.value
  return [-1, 1].map((sz) =>
    box(
      `tanduk-${sz > 0 ? 'a' : 'b'}`,
      { name: 'tanduk', nameId: 'Tanduk', nameEn: 'Finial' },
      'tanduk',
      sz > 0 ? 1 : 0,
      'kayu',
      ['tandukRise', 'tandukSection', 'peakIsFlat', 'menaraTaper'],
      [0, surface.y - DIMS.thatchThickness.value + DIMS.tandukRise.value / 2, sz * (surface.halfZ - sec)],
      [sec, DIMS.tandukRise.value, sec],
    ),
  )
}

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
