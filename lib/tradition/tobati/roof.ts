/**
 * The peak: an eight-sided cone standing well above the water.
 *
 * `coneSurface` takes a facet count, so an octagonal pyramid is what it makes
 * when asked for eight — the third house to use the primitive and the first to
 * ask it for a polygon rather than a circle. Nothing in it had to change,
 * which is the same evidence the bale gave for `steppedHip`: a primitive that
 * only works at the shape it was written for is not a primitive.
 */

import { coneSurface, coneRun } from '@/lib/core/cone'
import type { ConePoint } from '@/lib/core/cone'
import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import { cornerAngles } from './frame'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, TobatiKinds } from './types'

const builders = partBuilders<TobatiKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'apexRise',
  'eaveOversail',
  'rafterSection',
  'radius',
  'taper',
  'eightSided',
]

/** The outline turned about the axis: the eave, and the point. */
export function peakProfile(layout: Layout): readonly ConePoint[] {
  /*
   * The surface passes through the head of the wall and carries on past it.
   *
   * The overhang is the roof continuing down the same slope, not a flat brim
   * stuck on at plate level: drawn the other way the rafters' feet stood most
   * of a metre outboard of the building at exactly the height of the plate,
   * carried by nothing and touching nothing — the rumah gadang's cantilever
   * fault for the seventh time.
   */
  const slope = (layout.apexY - layout.plateY) / layout.topRadius
  return [
    { r: layout.topRadius + layout.eaveOversail, y: layout.plateY - layout.eaveOversail * slope },
    { r: 0, y: layout.apexY },
  ]
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildRoof(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  const angles = cornerAngles(layout.facets)
  const foot = peakProfile(layout)[0]
  const eaveR = foot?.r ?? layout.topRadius
  const eaveY = foot?.y ?? layout.plateY
  const rise = layout.apexY - eaveY
  const run = Math.hypot(eaveR, rise)
  const pitch = Math.atan2(eaveR, rise)

  /*
   * One rafter to each corner of the octagon, which is what makes the cone a
   * polygon rather than a circle: the eight arrises are members, not an
   * artefact of how finely the surface is divided.
   */
  angles.forEach((a, i) => {
    parts.push(
      box(
        `kasau-${i}`,
        { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
        'rangka',
        i,
        'kayu',
        ROOF_DIMS,
        [(Math.cos(a) * eaveR) / 2, (eaveY + layout.apexY) / 2, (Math.sin(a) * eaveR) / 2],
        [section, run, section],
        // Leaning inward: the head is at the point and the foot at the eave,
        // which is a sign the first draft had backwards.
        [-Math.sin(a) * pitch, 0, Math.cos(a) * pitch],
      ),
    )
    /*
     * The rafter is lashed to the head of the wall it lands on, not to a post
     * five stages earlier: `checkJointStages` refuses a joint that spans more
     * than one stage, and it is right to — a rafter tied to something fitted
     * long before it is a rafter tied to a memory.
     */
    joints.push({
      id: `ikat-${i}`,
      kind: 'ikat',
      mortise: `balok-${i}`,
      tenon: `kasau-${i}`,
      // Where the rafter crosses the plate: at the corner, at the height the
      // roof surface passes through the head of the wall.
      at: [
        Math.cos(a) * layout.topRadius,
        layout.plateY - section / 2,
        Math.sin(a) * layout.topRadius,
      ],
      halfExtents: [
        layout.postSection / 3,
        (section * engage) / 2,
        layout.postSection / 3,
      ],
    })
  })

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const profile = peakProfile(layout)
  const bed = DIMS.rafterSection.value / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'apexRise',
  ]
  const parts: Part[] = []
  let order = 0

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `rumbia-${band.course}`,
        {
          name: 'rumbia',
          nameId: `Rumbia ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'atap',
        order++,
        'rumbia',
        dims,
        coneSurface(profile, {
          facets: layout.facets,
          uvScale: 0.6,
          fFrom: from,
          fTo: to,
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

export function peakRun(layout: Layout): number {
  return coneRun(peakProfile(layout))
}
