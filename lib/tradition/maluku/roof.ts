/**
 * The roof of a baileo: large, heavy, and over nothing.
 *
 * A house's roof covers rooms. This one covers a floor with no walls on it, so
 * everything it does it does by reach: the overhang is what keeps the rain off
 * a building that has nothing else to keep it off, and the size of the roof
 * against the openness beneath is what makes the thing read as a public
 * building rather than as a shelter.
 *
 * Built from `steppedHip` with two levels and a ridge shorter than the
 * building, so the ends fall away as hips — the seventh form this project has
 * had out of that one primitive. The ridge runs along X, the way the building
 * is long, so the levels are given to the primitive turned and shifted back.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, swapXZ } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, MalukuKinds, Part } from './types'

const builders = partBuilders<MalukuKinds>()
const box = builders.box
const meshPart = builders.mesh

const ROOF_DIMS: readonly DimKey[] = [
  'ridgeRise',
  'eaveOversail',
  'rafterSection',
  'plateSection',
  'halfWidth',
  'soaBay',
  'openOnAllSides',
]

/**
 * The two levels, in the primitive's own axes.
 *
 * `halfX` is across the building and `halfZ` runs along the ridge; the mesh is
 * turned a quarter afterwards, because this building is long on X and the
 * primitive's ridge is on Z.
 */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const across = layout.halfZ + layout.eaveOversail
  const along = layout.length / 2 + layout.eaveOversail
  return [
    { key: 'eave', halfX: across, halfZ: along, y: layout.plateY },
    // The ridge stops short of the ends by the eave's own half-width, so the
    // ends fall as hips rather than standing as gables.
    { key: 'ridge', halfX: 0, halfZ: Math.max(0, along - across), y: layout.ridgeY },
  ]
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildRoof(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const plate = DIMS.plateSection.value
  const section = DIMS.rafterSection.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* The plate on the post heads, one run each side. */
  for (const sz of [-1, 1] as const) {
    const z = sz * (layout.halfZ - layout.postSection / 2)
    parts.push(
      box(
        `balok-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok kepala', nameEn: 'Wall plate' },
        /*
         * The plate is raised with the posts, not with the roof.
         *
         * It is what ties the post heads together, and `checkJointStages`
         * refused it in the roof stage — correctly: a member pegged to a post
         * cannot be fitted four stages after the post, with a floor, the seats
         * and a screen going in between. On site the heads are tied as soon as
         * they are standing, and then the frame is left to be plumbed.
         */
        'tiang',
        // After every post: the heads have to be standing before anything ties
        // them, and within a stage the order is what says so.
        100 + order++,
        'kayu',
        ROOF_DIMS,
        [0, layout.plateY - plate / 2, z],
        [layout.length, plate, plate],
      ),
    )
    layout.soa.forEach((s, i) => {
      joints.push({
        id: `pasak-balok-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'pasak',
        mortise: `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
        tenon: `balok-${sz > 0 ? 'a' : 'b'}`,
        at: [s.x, layout.plateY - plate / 2, z],
        halfExtents: [layout.postSection / 4, (plate * engage) / 2, layout.postSection / 4],
      })
    })
  }

  /*
   * Rafters, a pair per soa, leaning from the plate to the ridge.
   *
   * Set out over the ridge's own run rather than over the whole building, for
   * the reason the Banjar pack learned the hard way: past the end of the ridge
   * the roof falls away as a hip, and a full-height rafter there stands outside
   * the roof it is meant to carry.
   */
  const levels = roofLevels(layout)
  const ridge = levels[1]
  const ridgeHalf = ridge?.halfZ ?? layout.length / 2
  const rise = layout.ridgeY - layout.plateY
  const across = layout.halfZ + layout.eaveOversail
  const pitch = Math.atan2(across, rise)
  const run = Math.hypot(across, rise)

  const count = Math.max(2, Math.round((ridgeHalf * 2) / DIMS.soaBay.value))
  for (const sz of [-1, 1] as const) {
    for (let k = 0; k <= count; k++) {
      const x = -ridgeHalf + (k / count) * ridgeHalf * 2
      parts.push(
        box(
          `kasau-${sz > 0 ? 'a' : 'b'}-${k}`,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'kuda',
          order++,
          'kayu',
          ROOF_DIMS,
          [x, (layout.plateY + layout.ridgeY) / 2, (sz * across) / 2],
          [section, run, section],
          [-sz * pitch, 0, 0],
        ),
      )
    }
  }

  /* And the ridge piece, after the rafters that carry it. */
  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge' },
      'kuda',
      order++,
      'kayu',
      ROOF_DIMS,
      [0, layout.ridgeY - section / 2, 0],
      [ridgeHalf * 2, section, section],
    ),
  )

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.plateSection.value / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'eaveOversail',
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
        { name: 'rumbia', nameId: `Rumbia ${band.course + 1}`, nameEn: `Thatch course ${band.course + 1}` },
        'atap',
        order++,
        'rumbia',
        dims,
        swapXZ(
          steppedHip(levels, {
            uvScale: 0.5,
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
