/**
 * The roof of a rumah kaki seribu: a plain gable in grass.
 *
 * `steppedHip` with equal half-lengths, the sixth form out of one primitive
 * and by now unremarkable — which is itself the result. Nothing about this
 * roof is the reason the house is here; the reason is under the floor.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { ArfakKinds, Joint, Layout, Part } from './types'

const builders = partBuilders<ArfakKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveOversail',
  'raftersPerBay',
  'tiedNotPegged',
]

export function roofLevels(layout: Layout): readonly RoofLevel[] {
  return [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ: layout.eaveHalfZ, y: layout.eaveY },
    { key: 'ridge', halfX: 0, halfZ: layout.eaveHalfZ, y: layout.ridgeY },
  ]
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
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
  const count = Math.max(1, Math.round(DIMS.raftersPerBay.value)) * Math.max(1, layout.bays)

  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= count; k++) {
      const z = -ridge.halfZ + (k / count) * ridge.halfZ * 2
      const id = `kasau-${sx > 0 ? 'a' : 'b'}-${k}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'rangka',
          order++,
          'bambu',
          FRAME_DIMS,
          [(sx * eave.halfX) / 2, (eave.y + ridge.y) / 2, z],
          [section, run, section],
          [0, 0, sx * pitch],
        ),
      )
      const lo = Math.max(z - section / 2, -ridge.halfZ)
      const hi = Math.min(z + section / 2, ridge.halfZ)
      joints.push({
        id: `ikat-kasau-${sx > 0 ? 'a' : 'b'}-${k}`,
        kind: 'ikat',
        mortise: 'bubungan',
        tenon: id,
        at: [sx * (section / 4), ridge.y - section / 2, (lo + hi) / 2],
        halfExtents: [section / 4, (section * engage) / 2, (hi - lo) / 2],
      })
    }
  }

  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
      'rangka',
      order++,
      'kayu',
      FRAME_DIMS,
      [0, ridge.y - section / 2, 0],
      [section, section, ridge.halfZ * 2],
    ),
  )

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
        `atap-${band.course}`,
        {
          name: 'alang-alang',
          nameId: `Lapis alang-alang ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'atap',
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

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
