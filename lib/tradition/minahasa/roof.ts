/**
 * The roof, in pieces.
 *
 * A gable out of `steppedHip` by giving both levels the same half-length — the
 * third house to take that shortcut, which the Dayak pack settled. What is
 * particular here is the plate: it is cut at every bay line when the house is
 * movable, because one plate the length of the building would not go on a
 * lorry. The trusses are per bay for the same reason, which is also how a
 * timber frame is put up anyway.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, swapXZ } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { pieceAlong } from './frame'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, MinahasaKinds, Part } from './types'

const builders = partBuilders<MinahasaKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'ridgeRise',
  'eaveOversail',
  'rafterSection',
  'plateSection',
  'halfWidth',
  'bayLength',
  'cutToTheRoad',
]

/** A gable: both levels the same half-length, so the ends stand vertical. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const across = layout.halfZ + layout.eaveOversail
  const along = layout.length / 2 + layout.eaveOversail
  return [
    { key: 'eave', halfX: across, halfZ: along, y: layout.plateY },
    { key: 'ridge', halfX: 0, halfZ: along, y: layout.ridgeY },
  ]
}

export function shingleBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.shingleCourses, DIMS.shingleLap.value)
}

export function buildRoof(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const plate = DIMS.plateSection.value
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* The plate, in pieces, on each side. */
  for (const sz of [-1, 1] as const) {
    const z = sz * (layout.halfZ - layout.postSection / 2)
    pieceAlong(layout).forEach((piece, i) => {
      parts.push(
        box(
          `balok-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'balok', nameId: 'Balok kepala', nameEn: 'Head plate' },
          'kuda',
          order++,
          'kayu',
          ROOF_DIMS,
          [piece.x, layout.plateY - plate / 2, z],
          [piece.length, plate, plate],
        ),
      )
    })
  }

  /* Rafters, a pair at every line of posts, pegged to the plate below them. */
  /*
   * The rafter's foot reaches the underside of the plate, not its top.
   *
   * Cut to the plate's top face the two members met at a plane and shared no
   * volume, so the peg between them was inside neither — `checkJoints` said
   * so. A rafter sits *on* a plate by lapping past it.
   */
  const across = layout.halfZ + layout.eaveOversail
  const foot = layout.plateY - plate
  const rise = layout.ridgeY - foot
  const pitch = Math.atan2(across, rise)
  const run = Math.hypot(across, rise)
  const lines = [...layout.bays.map((b) => b.x - b.halfX), layout.length / 2]
  lines.forEach((x, i) => {
    for (const sz of [-1, 1] as const) {
      const id = `kasau-${i}-${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'kuda',
          order++,
          'kayu',
          ROOF_DIMS,
          [x, (foot + layout.ridgeY) / 2, (sz * across) / 2],
          [section, run, section],
          [-sz * pitch, 0, 0],
        ),
      )
      const pieces = pieceAlong(layout)
      const holder = pieces.findIndex((p) => Math.abs(p.x - x) <= p.length / 2 + 1e-6)
      const at = pieces[Math.max(0, holder)]
      if (!at) continue
      const lo = Math.max(x - section / 2, at.x - at.length / 2)
      const hi = Math.min(x + section / 2, at.x + at.length / 2)
      if (hi <= lo) continue
      joints.push({
        id: `pasak-atap-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'pasak',
        mortise: `balok-${Math.max(0, holder)}-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [
          (lo + hi) / 2,
          layout.plateY - plate / 2,
          sz * (layout.halfZ - layout.postSection / 2),
        ],
        halfExtents: [(hi - lo) / 2, (plate * engage) / 2, section / 2],
      })
    }
  })

  /* And the ridge, after the rafters, in pieces like everything else. */
  pieceAlong(layout).forEach((piece, i) => {
    parts.push(
      box(
        `bubungan-${i}`,
        { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge' },
        'kuda',
        order++,
        'kayu',
        ROOF_DIMS,
        [piece.x, layout.ridgeY - section / 2, 0],
        [piece.length, section, section],
      ),
    )
  })

  return { parts, joints }
}

export function buildShingles(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.plateSection.value / 2 + DIMS.shingleBed.value
  const thickness = DIMS.shingleThickness.value
  const dims: readonly DimKey[] = [
    'shingleCourseDepth',
    'shingleThickness',
    'shingleLap',
    'shingleBed',
    'eaveOversail',
  ]
  const parts: Part[] = []
  let order = 0

  for (const band of shingleBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `sirap-${band.course}`,
        {
          name: 'sirap',
          nameId: `Sirap ${band.course + 1}`,
          nameEn: `Shingle course ${band.course + 1}`,
        },
        'atap',
        order++,
        'sirap',
        dims,
        swapXZ(
          steppedHip(levels, {
            uvScale: 0.35,
            fFrom: from,
            fTo: to,
            offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
          }),
        ),
      ),
    )
  }

  return parts
}

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
