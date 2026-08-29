/**
 * The roof: a gable of sago thatch over a ridge that lies east–west.
 *
 * `steppedHip` with both levels the same half-length, for the sixth time —
 * and here the primitive's axes have to be turned the *other* way from every
 * other house that has used it, because on this building the long axis is Z
 * and not X. That is the rule about prayer showing up in the code as a
 * transformation, which is as far into the geometry as a doctrine gets.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { houseWidth } from './frame'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, AcehKinds, Part } from './types'

const builders = partBuilders<AcehKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'ridgeRise',
  'eaveOversail',
  'rafterSection',
  'plateSection',
  'bayLength',
  'ridgeRunsEastWest',
]

/** A gable: both levels the same half-length, so the ends stand vertical. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const across = houseWidth(layout) / 2 + layout.eaveOversail
  const along = layout.length / 2 + layout.eaveOversail
  return [
    { key: 'eave', halfX: across, halfZ: along, y: layout.plateY },
    { key: 'ridge', halfX: 0, halfZ: along, y: layout.ridgeY },
  ]
}

export function rumbiaBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.rumbiaCourses, DIMS.rumbiaLap.value)
}

export function buildRoof(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const plate = DIMS.plateSection.value
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* The eave plate, one run along each long side of the house. */
  for (const sz of [-1, 1] as const) {
    const x = sz * (houseWidth(layout) / 2 - plate / 2)
    parts.push(
      box(
        `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok tepi atap', nameEn: 'Eave plate' },
        'gaseue',
        order++,
        'kayu',
        ROOF_DIMS,
        [x, layout.plateY - plate / 2, 0],
        [plate, plate, layout.length],
      ),
    )
  }

  /* Rafters, a pair at every line of posts, lashed to the eave plate. */
  const across = houseWidth(layout) / 2 + layout.eaveOversail
  const foot = layout.plateY - plate
  const rise = layout.ridgeY - foot
  const pitch = Math.atan2(across, rise)
  const run = Math.hypot(across, rise)
  // A pair of rafters over every line of posts along the length.
  const lines = Array.from(
    { length: layout.bays + 1 },
    (_, i) => -layout.length / 2 + DIMS.bayLength.value * i,
  )
  lines.forEach((x, i) => {
    for (const sz of [-1, 1] as const) {
      const id = `kasau-${i}-${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'gaseue',
          order++,
          'kayu',
          ROOF_DIMS,
          // Leaning across the width, which on this house is X.
          [(sz * across) / 2, (foot + layout.ridgeY) / 2, x],
          [section, run, section],
          [0, 0, sz * pitch],
        ),
      )
      // Clamped to the plate, which stops at the ends of the house while the
      // rafters stand on those ends.
      const lo = Math.max(x - section / 2, -layout.length / 2)
      const hi = Math.min(x + section / 2, layout.length / 2)
      joints.push({
        id: `talo-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'talo',
        mortise: `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [
          sz * (houseWidth(layout) / 2 - plate / 2),
          layout.plateY - plate / 2,
          (lo + hi) / 2,
        ],
        halfExtents: [section / 2, (plate * engage) / 2, (hi - lo) / 2],
      })
    }
  })

  /* And the ridge, after the rafters that carry it, lying east–west. */
  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge' },
      'gaseue',
      order++,
      'kayu',
      ROOF_DIMS,
      [0, layout.ridgeY - section / 2, 0],
      [section, section, layout.length],
    ),
  )

  return { parts, joints }
}

export function buildRumbia(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.plateSection.value / 2 + DIMS.rumbiaBed.value
  const thickness = DIMS.rumbiaThickness.value
  const dims: readonly DimKey[] = [
    'rumbiaCourseDepth',
    'rumbiaThickness',
    'rumbiaLap',
    'rumbiaBed',
    'eaveOversail',
  ]
  const parts: Part[] = []
  let order = 0

  for (const band of rumbiaBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `bubong-${band.course}`,
        {
          name: 'bubong',
          nameId: `Bubong ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'bubong',
        order++,
        'rumbia',
        dims,
        /*
         * No quarter turn here, and this is the only roof in the project that
         * does not need one: `steppedHip` puts its ridge on Z, and on this
         * house the ridge is on Z because prayer is east–west. The rule and
         * the primitive happen to agree.
         */
        steppedHip(levels, {
          uvScale: 0.35,
          fFrom: from,
          fTo: to,
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
