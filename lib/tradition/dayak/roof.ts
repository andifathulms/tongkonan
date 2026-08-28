/**
 * The roof of a betang: two slopes and a ridge the whole length of the house.
 *
 * The first roof in this project that is neither swept, hipped nor conical. It
 * is a plain gable — two planes and two ends — and it is worth saying why that
 * needed no new primitive and no old one either. `steppedHip` makes a hip
 * because its top level has a ridge *shorter* than the eave; give it a ridge
 * exactly as long as the building and the hip ends vanish, which is a gable.
 *
 * So this house gets its roof from `steppedHip` with `halfZ` equal at both
 * levels. That is the third distinct roof form out of one primitive — a
 * stepped hip, a pyramid, and now a gable — and it is a better argument for
 * the primitive being right than the joglo alone ever was.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { DayakKinds, Joint, Layout, Part } from './types'

const builders = partBuilders<DayakKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveOversail',
  'raftersPerShare',
  'shareLength',
]

/**
 * Eave and ridge, at the same half-length.
 *
 * `halfZ` equal at both levels is what makes this a gable rather than a hip:
 * the two end faces of the band become rectangles standing vertically instead
 * of triangles falling inward. Nothing in `steppedHip` needed to know.
 */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const halfZ = layout.halfZ + DIMS.eaveOversail.value
  return [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ, y: layout.eaveY },
    { key: 'ridge', halfX: 0, halfZ, y: layout.ridgeY },
  ]
}

export function shingleBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.shingleCourses, DIMS.shingleLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[1]
  if (!eave || !ridge) throw new Error('a roof needs an eave and a ridge')
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  const rise = ridge.y - eave.y
  const pitch = Math.atan2(eave.halfX, rise)
  const run = Math.hypot(eave.halfX, rise)
  const perShare = Math.max(1, Math.round(DIMS.raftersPerShare.value))
  const count = perShare * layout.shares.length

  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= count; k++) {
      const z = -ridge.halfZ + (k / count) * ridge.halfZ * 2
      const id = `kasau-${sx > 0 ? 'a' : 'b'}-${k}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'atap',
          order++,
          'ulin',
          FRAME_DIMS,
          [(sx * eave.halfX) / 2, (eave.y + ridge.y) / 2, z],
          [section, run, section],
          [0, 0, sx * pitch],
        ),
      )
      // The overlap of rafter and ridge, which at the two end rafters is half
      // of one rafter rather than all of it.
      const lo = Math.max(z - section / 2, -ridge.halfZ)
      const hi = Math.min(z + section / 2, ridge.halfZ)
      joints.push({
        id: `pasak-${sx > 0 ? 'a' : 'b'}-${k}`,
        kind: 'pasak',
        mortise: 'bubungan',
        tenon: id,
        at: [sx * (section / 4), ridge.y - section / 2, (lo + hi) / 2],
        halfExtents: [section / 4, (section * engage) / 2, (hi - lo) / 2],
      })
    }
  }

  /*
   * The ridge, after the rafters that carry it.
   *
   * Written first and placed first, which is how a drawing is made and not how
   * a roof is raised — the build-order check said so, exactly as it did on the
   * omo. Two houses in a row have made this mistake, which suggests it is the
   * natural way to write a roof and the wrong way to build one.
   */
  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
      'atap',
      order++,
      'ulin',
      FRAME_DIMS,
      [0, ridge.y - section / 2, 0],
      [section, section, ridge.halfZ * 2],
    ),
  )

  return { parts, joints }
}

export function buildShingles(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const levels = roofLevels(layout)
  const bed = DIMS.rafterSection.value / 2 + DIMS.shingleBed.value
  const thickness = DIMS.shingleThickness.value
  const dims: readonly DimKey[] = [
    'shingleCourseDepth',
    'shingleThickness',
    'shingleLap',
    'shingleBed',
    'rafterSection',
    'ironwood',
  ]
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
          nameId: `Lapis sirap ${band.course + 1}`,
          nameEn: `Shingle course ${band.course + 1}`,
        },
        'atap',
        1000 + order++,
        'sirap',
        dims,
        steppedHip(levels, {
          uvScale: 0.3,
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
