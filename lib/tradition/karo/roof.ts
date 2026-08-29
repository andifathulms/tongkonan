/**
 * The roof: a large steep gable of ijuk over a low body, and a second gable
 * standing above one end of it.
 *
 * `steppedHip` with both levels the same half-length gives the gable — the
 * fourth house to take that route. The tersek is the same primitive again at a
 * smaller size, standing on the roof rather than on the building, which is the
 * honest way to model a thing that shelters nothing: it is not a storey and it
 * is not an eave, it is a second roof over part of the first.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, shiftMesh, swapXZ } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, KaroKinds, Part } from './types'

const builders = partBuilders<KaroKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'ridgeRise',
  'eaveOversail',
  'rafterSection',
  'plateSection',
  'halfWidth',
  'bayLength',
  'manyHouseholdsOneRoom',
]

/** A gable: both levels the same half-length, so the ends stand vertical. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const across = layout.halfZ + DIMS.wallLean.value + layout.eaveOversail
  const along = layout.length / 2 + layout.eaveOversail
  return [
    { key: 'eave', halfX: across, halfZ: along, y: layout.plateY },
    { key: 'ridge', halfX: 0, halfZ: along, y: layout.ridgeY },
  ]
}

export function ijukBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.ijukCourses, DIMS.ijukLap.value)
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
    const z = sz * (layout.halfZ + DIMS.wallLean.value - plate / 2)
    parts.push(
      box(
        `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok tepi atap', nameEn: 'Eave plate' },
        'kuda',
        order++,
        'kayu',
        ROOF_DIMS,
        [0, layout.plateY - plate / 2, z],
        [layout.length, plate, plate],
      ),
    )
  }

  /* Rafters, a pair at every line of posts, lashed to the eave plate. */
  const across = layout.halfZ + DIMS.wallLean.value + layout.eaveOversail
  const foot = layout.plateY - plate
  const rise = layout.ridgeY - foot
  const pitch = Math.atan2(across, rise)
  const run = Math.hypot(across, rise)
  const lines = [
    ...layout.hearths.map((h) => h.x - DIMS.bayLength.value / 2),
    layout.length / 2,
  ]
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
      // Clamped to the plate, which stops at the ends of the house while the
      // rafters stand on those ends.
      const lo = Math.max(x - section / 2, -layout.length / 2)
      const hi = Math.min(x + section / 2, layout.length / 2)
      joints.push({
        id: `ikat-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'ikat',
        mortise: `balok-atap-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [
          (lo + hi) / 2,
          layout.plateY - plate / 2,
          sz * (layout.halfZ + DIMS.wallLean.value - plate / 2),
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
      'kuda',
      order++,
      'kayu',
      ROOF_DIMS,
      [0, layout.ridgeY - section / 2, 0],
      [layout.length, section, section],
    ),
  )

  return { parts, joints }
}

/**
 * The tersek: a second gable standing on the roof at the base end.
 *
 * It shelters nothing that is not already sheltered, which is why it is built
 * last and in its own stage. What it does is make one end of the house taller —
 * the only thing on the outside of this building that says anything about the
 * households inside it, and it says it at the end where the senior one is.
 */
export function tersekLevels(layout: Layout): readonly RoofLevel[] {
  const across = (layout.halfZ + DIMS.wallLean.value) * 0.55
  const along = layout.tersek.halfX
  const base = layout.ridgeY - DIMS.rafterSection.value
  return [
    { key: 'tersek-eave', halfX: across, halfZ: along, y: base },
    { key: 'tersek-ridge', halfX: 0, halfZ: along, y: base + layout.tersek.rise },
  ]
}

export function buildTersek(layout: Layout): readonly Part[] {
  if (!layout.tersek.present) return []
  const dims: readonly DimKey[] = ['tersekRise', 'tersekReach', 'ijukCourseDepth', 'ijukLap']
  const x = layout.benaX + layout.tersek.halfX
  return [
    meshPart(
      'tersek',
      { name: 'tersek', nameId: 'Tersek', nameEn: 'Upper gable tier' },
      'tersek',
      0,
      'ijuk',
      dims,
      shiftMesh(swapXZ(steppedHip(tersekLevels(layout), { uvScale: 0.4 })), x, 0, 0),
    ),
  ]
}

export function buildIjuk(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.plateSection.value / 2 + DIMS.ijukBed.value
  const thickness = DIMS.ijukThickness.value
  const dims: readonly DimKey[] = [
    'ijukCourseDepth',
    'ijukThickness',
    'ijukLap',
    'ijukBed',
    'eaveOversail',
  ]
  const parts: Part[] = []
  let order = 0

  for (const band of ijukBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `ijuk-${band.course}`,
        {
          name: 'ijuk',
          nameId: `Ijuk ${band.course + 1}`,
          nameEn: `Ijuk course ${band.course + 1}`,
        },
        'atap',
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
