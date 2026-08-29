/**
 * The roof: a gable of palm thatch, lashed, with no iron in it.
 *
 * `steppedHip` with both levels the same half-length gives the gable — the
 * fifth house to take that route, and the primitive has still not had to
 * learn anything. What is particular here is only what is absent: no nails
 * anywhere in the frame, which the pack declares as a prohibition and the
 * joint list carries out.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, swapXZ } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, SundaKinds, Part } from './types'

const builders = partBuilders<SundaKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'ridgeRise',
  'eaveOversail',
  'rafterSection',
  'plateSection',
  'halfWidth',
  'bay',
  'groundIsNotCut',
]

/** A gable: both levels the same half-length, so the ends stand vertical. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const across = layout.halfZ + 0 + layout.eaveOversail
  const along = layout.length / 2 + layout.eaveOversail
  return [
    { key: 'eave', halfX: across, halfZ: along, y: layout.plateY },
    { key: 'ridge', halfX: 0, halfZ: along, y: layout.ridgeY },
  ]
}

export function hateupBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.hateupCourses, DIMS.hateupLap.value)
}

export function buildRoof(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const plate = DIMS.plateSection.value
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* The eave plate, one run each side, on the heads of the leaning walls. */
  for (const sz of [-1, 1] as const) {
    const z = sz * (layout.halfZ + 0 - plate / 2)
    parts.push(
      box(
        `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok tepi atap', nameEn: 'Eave plate' },
        'suhunan',
        order++,
        'kayu',
        ROOF_DIMS,
        [0, layout.plateY - plate / 2, z],
        [layout.length, plate, plate],
      ),
    )
  }

  /* Rafters, a pair at every line of posts, lashed to the eave plate. */
  const across = layout.halfZ + 0 + layout.eaveOversail
  const foot = layout.plateY - plate
  const rise = layout.ridgeY - foot
  const pitch = Math.atan2(across, rise)
  const run = Math.hypot(across, rise)
  const lines = [...new Set(layout.posts.map((p) => p.x))].sort((a, b) => a - b)
  lines.forEach((x, i) => {
    for (const sz of [-1, 1] as const) {
      const id = `kasau-${i}-${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'suhunan',
          order++,
          'kayu',
          ROOF_DIMS,
          [x, (foot + layout.ridgeY) / 2, (sz * across) / 2],
          [section, run, section],
          [-sz * pitch, 0, 0],
        ),
      )
      // Clamped to the plate, which stops at the ends of the house while the
      // rafters stand on those ends.
      const lo = Math.max(x - section / 2, -layout.length / 2)
      const hi = Math.min(x + section / 2, layout.length / 2)
      joints.push({
        id: `talian-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'talian',
        mortise: `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [
          (lo + hi) / 2,
          layout.plateY - plate / 2,
          sz * (layout.halfZ + 0 - plate / 2),
        ],
        halfExtents: [(hi - lo) / 2, (plate * engage) / 2, section / 2],
      })
    }
  })

  /* And the ridge, after the rafters that carry it. */
  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge' },
      'suhunan',
      order++,
      'kayu',
      ROOF_DIMS,
      [0, layout.ridgeY - section / 2, 0],
      [layout.length, section, section],
    ),
  )

  return { parts, joints }
}

export function buildHateup(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.plateSection.value / 2 + DIMS.hateupBed.value
  const thickness = DIMS.hateupThickness.value
  const dims: readonly DimKey[] = [
    'hateupCourseDepth',
    'hateupThickness',
    'hateupLap',
    'hateupBed',
    'eaveOversail',
  ]
  const parts: Part[] = []
  let order = 0

  for (const band of hateupBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `hateup-${band.course}`,
        {
          name: 'hateup',
          nameId: `Hateup ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'hateup',
        order++,
        'ijuk',
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
