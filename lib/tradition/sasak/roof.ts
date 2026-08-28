/**
 * The hood of a lumbung: a curve made of steps.
 *
 * This roof is not a hip, a gable, a pyramid, a cone or a tower. Its section
 * swells outward from the ridge and then falls steeply away, and its eave ends
 * *below* the floor it shelters — which is why the thing reads as a hood pulled
 * over a box rather than as a roof on top of one.
 *
 * It is built from `steppedHip` anyway, with nine levels instead of two, and
 * that is the point worth recording. The primitive has now produced a stepped
 * hip, a pyramid, a gable, a tower, a plain limas — and now a curve, by being
 * handed enough rectangles that the steps stop reading as steps. No sixth roof
 * primitive was needed and none should be added: a curve is many steps, and the
 * only new thing here is the resolution.
 *
 * `checkHoodCurves` states the claim that makes this honest — each band must be
 * steeper than the one below it. A stack of levels at one pitch is a cone with
 * extra vertices; what makes this a curve is that the pitch changes all the way
 * up, and a check that only counted levels would not know the difference.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, milikInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, SasakKinds } from './types'

const builders = partBuilders<SasakKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveReach',
  'eaveDrop',
  'hoodBelly',
  'hoodSteps',
  'raftersPerSide',
]

/**
 * The stack, from the eave up to the short ridge.
 *
 * The hood is *convex*: steepest at the skirt, flattening into a rounded
 * shoulder as it nears the ridge. Written the other way round first — a sine
 * bulge that made the middle wider than the eave — which produced a shape that
 * flared outward as it rose and was neither a lumbung nor anything else.
 *
 * The curve is a quarter-cosine from the eave's reach to the ridge's, blended
 * against the straight line by `hoodBelly`: at zero it is an ordinary hip, at
 * one it is the full curve. A shape chosen rather than a fit to any
 * measurement, and the dimension note says so.
 */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const s = milikInfo(layout.rules.milik).scale
  const steps = Math.max(3, Math.round(DIMS.hoodSteps.value))
  const eaveReach = DIMS.eaveReach.value * s
  const ridgeHalf = DIMS.ridgeHalf.value * s
  const belly = DIMS.hoodBelly.value
  const levels: RoofLevel[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = layout.eaveY + (layout.ridgeY - layout.eaveY) * t
    // The straight line an ordinary hip would take, and the convex curve a
    // hood takes: the eave's reach falling away as a quarter-cosine, so the
    // inward movement per band grows and the pitch eases all the way up.
    const straight = eaveReach + (ridgeHalf - eaveReach) * t
    const curved = ridgeHalf + (eaveReach - ridgeHalf) * Math.cos((Math.PI * t) / 2)
    const halfX = straight + (curved - straight) * belly
    levels.push({
      key: i === 0 ? 'eave' : i === steps ? 'ridge' : `band-${i}`,
      halfX,
      // Along the ridge the hood is longer by the store's own length, so the
      // two ends are the same curve translated rather than a different shape.
      halfZ: halfX + layout.storeHalfZ,
      y,
    })
  }
  return levels
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = milikInfo(layout.rules.milik).scale
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[levels.length - 1]
  if (!eave || !ridge) throw new Error('a hood needs an eave and a ridge')
  const section = DIMS.rafterSection.value * s
  const engage = DIMS.jointEngagement.value
  let order = 0

  /*
   * Ties across the store, uprights on them, and a ridge plate on those.
   *
   * The hood springs from well above the box it covers, so nothing is under
   * its ridge unless something is put there — the build-order check has now
   * said so for four buildings running, which suggests raising a roof from the
   * top down is simply how a person writes one.
   *
   * And the ridge is a *plate* rather than a bar, because the top of this hood
   * is a short flat rather than a line: the rafters arrive at the edges of that
   * flat, and a bar on the axis would be a member none of them touches.
   */
  const kingY = layout.floorY + DIMS.floorThickness.value * s + layout.storeHeight
  const tieZ = layout.storeHalfZ * 0.6
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `balok-tudung-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok tudung', nameEn: 'Hood tie' },
        'rangka',
        order++,
        'kayu',
        FRAME_DIMS,
        [0, kingY - section / 2, sz * tieZ],
        [layout.storeHalfX * 2, section, section],
      ),
    )
    parts.push(
      box(
        `tiang-tudung-${sz > 0 ? 'a' : 'b'}`,
        { name: 'tiang tudung', nameId: 'Tiang tudung', nameEn: 'Hood post' },
        'rangka',
        order++,
        'kayu',
        FRAME_DIMS,
        [0, (kingY - section + ridge.y - section / 2) / 2, sz * tieZ],
        [section, ridge.y - section / 2 - (kingY - section), section],
      ),
    )
  }

  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge plate' },
      'rangka',
      order++,
      'kayu',
      FRAME_DIMS,
      [0, ridge.y - section / 2, 0],
      [ridge.halfX * 2, section, ridge.halfZ * 2],
    ),
  )

  /*
   * Rafters that follow the curve, as a chain of short members — and laid from
   * the top down.
   *
   * A single straight rafter from the eave to the ridge would cut the corner
   * off the curve and stand outside the surface over the middle of its length:
   * the fault this project has found five times, arriving here as a curve
   * rather than as a moved line. So each rafter is one member per band.
   *
   * And the chain is built downward, because that is how it is carried. The
   * lowest band ends below the floor of the store with nothing under it; what
   * holds it is the band above. Emitted eave-first, every skirt member was
   * unsupported and the check was right about all of them.
   */
  const perSide = Math.max(1, Math.round(DIMS.raftersPerSide.value))
  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= perSide; k++) {
      const z = -ridge.halfZ + (k / perSide) * ridge.halfZ * 2
      for (let i = levels.length - 1; i >= 1; i--) {
        const a = levels[i - 1]
        const b = levels[i]
        if (!a || !b) continue
        const run = Math.hypot(a.halfX - b.halfX, b.y - a.y)
        const lean = Math.atan2(a.halfX - b.halfX, b.y - a.y)
        parts.push(
          box(
            `kasau-${sx > 0 ? 'a' : 'b'}-${k}-${i}`,
            { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
            'rangka',
            order++,
            'bambu',
            FRAME_DIMS,
            [(sx * (a.halfX + b.halfX)) / 2, (a.y + b.y) / 2, z],
            [section, run, section],
            [0, 0, sx * lean],
          ),
        )
      }
    }
  }

  const top = levels[levels.length - 1]
  if (top) {
    for (const sx of [-1, 1] as const) {
      // The overlap of the ridge and the topmost rafter of the first pair,
      // which at the very end of the run is a quarter of one member.
      joints.push({
        id: `pasak-${sx > 0 ? 'a' : 'b'}`,
        kind: 'pasak',
        mortise: 'bubungan',
        tenon: `kasau-${sx > 0 ? 'a' : 'b'}-0-${levels.length - 1}`,
        // At the edge of the flat top, which is where a rafter actually
        // arrives — the axis is where nothing meets.
        // A sixth rather than a quarter: the topmost rafter leans, so its own
        // extent at the plate is narrower than a nominal half-section, and a
        // joint sized to the nominal reached four millimetres past its timber.
        at: [sx * (top.halfX - section / 6), top.y - section / 2, -top.halfZ + section / 4],
        halfExtents: [section / 6, (section * engage) / 2, section / 4],
      })
    }
  }

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const s = milikInfo(layout.rules.milik).scale
  const levels = roofLevels(layout)
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value * s
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterSection',
    'hoodFallsPastTheFloor',
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
