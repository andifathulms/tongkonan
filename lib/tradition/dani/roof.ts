/**
 * The cap over a honai: a low dome, and a great deal of grass.
 *
 * A surface of revolution, so it uses `coneSurface` — the mbaru niang's
 * primitive rather than the hip stack. That is the second use of it in the
 * project and the first outside the pack it was written in, which is the
 * evidence it was worth having: nothing in it knew about five floors or a
 * fifteen-metre point.
 *
 * The two houses set beside each other are the reason this one is here. The
 * mbaru niang is a cone fifteen metres tall over eleven metres of floor; this
 * is a cap a metre and a half tall over four. Both are round, both are thatched
 * to the ground, and roundness turns out to say nothing on its own — the mbaru
 * niang is round to stack five stores in a cone, and the honai is round because
 * a circle is the cheapest wall to warm.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, tubeMesh } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import { coneRun, coneSurface } from '@/lib/core/cone'
import type { ConePoint } from '@/lib/core/cone'
import { DIMS, bangunanInfo } from './rules'
import type { DimKey } from './rules'
import type { DaniKinds, Joint, Layout, Part, Vec3 } from './types'

const builders = partBuilders<DaniKinds>()
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'apexRise',
  'eaveOversail',
  'domeSteps',
  'domeShoulder',
  'facets',
]

/**
 * The outline of the cap, from the eave out at the overhang to the point.
 *
 * A quarter-ellipse blended against the straight line by `domeShoulder`: at
 * zero it is a cone, at one it is fully rounded. The same construction the
 * lumbung's hood uses and the opposite curvature — that one is convex and
 * flares at its skirt, this one is a dome that flattens at its crown.
 */
export function domeProfile(layout: Layout): readonly ConePoint[] {
  const s = bangunanInfo(layout.rules.bangunan).scale
  const steps = Math.max(3, Math.round(DIMS.domeSteps.value))
  const rise = layout.apexY - layout.eaveY
  const shoulder = DIMS.domeShoulder.value
  /*
   * The skirt first, then the dome from the wall top.
   *
   * The outline used to start at the overhang's tip *level with the wall*,
   * which meant no rafter ever passed over a post: each one began outboard and
   * climbed inward, crossing the wall line already above it. Every one of the
   * twenty joints engaged nothing. So the tip hangs out and down, and the
   * second point is the wall head itself — which is where a rafter actually
   * bears, and where the joint now is.
   */
  const oversail = DIMS.eaveOversail.value * s
  const points: ConePoint[] = [{ r: layout.radius + oversail, y: layout.eaveY - oversail }]
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const straight = layout.radius * (1 - t)
    const rounded = layout.radius * Math.cos((Math.PI * t) / 2)
    points.push({ r: straight + (rounded - straight) * shoulder, y: layout.eaveY + rise * t })
  }
  return points
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = bangunanInfo(layout.rules.bangunan).scale
  const section = DIMS.rafterSection.value * s
  const engage = DIMS.jointEngagement.value
  const profile = domeProfile(layout)
  let order = 0

  /*
   * One rafter per wall post, bent to the outline as a chain of points.
   *
   * A tube through the profile rather than a straight member, for the reason
   * the lumbung's hood gives: a straight rafter under a curved surface stands
   * outside it over the middle of its length.
   */
  for (let k = 0; k < layout.facets; k++) {
    const a = (k / layout.facets) * Math.PI * 2
    const path: Vec3[] = profile.map((p) => [Math.cos(a) * p.r, p.y, Math.sin(a) * p.r])
    const id = `kasau-${k}`
    parts.push(
      meshPart(
        id,
        { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
        'rangka',
        order++,
        'kayu',
        FRAME_DIMS,
        tubeMesh(path, () => section / 2, 4, 0.4),
      ),
    )
    const post = `tiang-${k}`
    const bearing = a > Math.PI ? a - Math.PI * 2 : a
    // No post where the door is, so no joint there either.
    if (Math.abs(bearing) >= layout.door.halfAngle) {
      joints.push({
        id: `tumpu-${k}`,
        kind: 'tumpu',
        mortise: post,
        tenon: id,
        // At the wall head, where the rafter crosses it — and small, because
        // what the two share there is a rafter's own thickness.
        at: [Math.cos(a) * layout.radius, layout.eaveY - section / 4, Math.sin(a) * layout.radius],
        halfExtents: [section / 4, section / 4, section / 4],
      })
    }
  }

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const s = bangunanInfo(layout.rules.bangunan).scale
  const profile = domeProfile(layout)
  // The blanket: the bed, plus whatever the household chose to pile on.
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value + layout.thatchDepth
  const thickness = DIMS.thatchThickness.value * s
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'layerDepth',
    'rafterSection',
    'smallToKeepWarm',
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
        coneSurface(profile, {
          facets: layout.facets,
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
  return coneRun(domeProfile(layout))
}
