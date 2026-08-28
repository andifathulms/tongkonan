/**
 * The roofs of a Banjar house — plural, and that is the whole point.
 *
 * Every other building in this project builds one roof. This one builds four,
 * in a row along a single ridge, and the form of the middle one is the name of
 * the house. So this file is a loop over `layout.segments`, and each turn of
 * it asks `steppedHip` for a different shape.
 *
 * The primitive puts its ridge on Z and this house runs its ridge on X, so
 * each segment is built in the primitive's own space and then given a quarter
 * turn. That turn — `swapXZ` — was written tradition-side for a swept roof
 * with a note saying a third house doing the same would move the axis into
 * `SweepOptions`. **This is not that.** What was needed here was the turn
 * itself, on a different primitive, so the operation moved to the core and the
 * axis flag stayed exactly where it was.
 *
 * Six forms out of one primitive across the project, and here three of them at
 * once in a single building.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, shiftMesh, swapXZ } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { BanjarKinds, Joint, Layout, Part, Ruas } from './types'

const builders = partBuilders<BanjarKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'eaveOversail',
  'tinggiRise',
  'shedRise',
  'halfWidth',
  'aChainOfRoofs',
  'namedForItsRoof',
]

/**
 * One segment's roof, in the primitive's own space.
 *
 * `halfX` is the across-direction and `halfZ` runs along the ridge — the
 * opposite of this building's world axes, which is what the quarter turn is
 * for. The three forms differ in one number: how long the top level is.
 *
 * - `pelana` and `tinggi`: the ridge runs the whole segment, so the ends stand
 *   as vertical gables. The two differ only in height, which is the entire
 *   difference between two named house types.
 * - `limasan`: the ridge is shorter by the eave's own half-width at each end,
 *   so the ends fall away as planes.
 * - `sengkuap`: a shed. Modelled as a very low gable, because a true
 *   single-slope is not symmetric about the ridge and this primitive is — see
 *   the note in `invariants.ts` on what that costs.
 */
export function segmentLevels(layout: Layout, seg: Ruas): readonly RoofLevel[] {
  const across = layout.halfZ + layout.eaveOversail
  const along = seg.halfX + (seg.key === 'pelatar' ? layout.eaveOversail : 0)
  const ridgeAlong = seg.bentuk === 'limasan' ? Math.max(0, along - across) : along
  return [
    { key: `${seg.key}-eave`, halfX: across, halfZ: along, y: seg.eaveY },
    { key: `${seg.key}-ridge`, halfX: 0, halfZ: ridgeAlong, y: seg.ridgeY },
  ]
}

/**
 * A wing's roof, in the primitive's own space.
 *
 * The wings are the two roofs that do *not* belong to the chain: they run out
 * to the side, so their ridges are transverse to the four along the spine, and
 * they are lower than the core because a wing that outranked the middle would
 * be reading the house backwards.
 */
export function anjungLevels(layout: Layout): readonly RoofLevel[] {
  const across = layout.anjung.reach / 2 + layout.eaveOversail
  const along = layout.anjung.halfX + layout.eaveOversail
  return [
    { key: 'anjung-eave', halfX: across, halfZ: along, y: layout.anjung.eaveY },
    { key: 'anjung-ridge', halfX: 0, halfZ: along, y: layout.anjung.ridgeY },
  ]
}

export function shingleBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.shingleCourses, DIMS.shingleLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const section = DIMS.bearerWidth.value
  const engage = DIMS.jointEngagement.value
  let order = 0

  /* Rafters: a pair per bay of each segment, leaning on the width. */
  for (const seg of layout.segments) {
    const levels = segmentLevels(layout, seg)
    const rise = seg.ridgeY - seg.eaveY
    const across = layout.halfZ + layout.eaveOversail
    const pitch = Math.atan2(across, rise)
    const run = Math.hypot(across, rise)
    /*
     * Rafters are set out along the ridge, not along the segment.
     *
     * On a gable those are the same span. On the hipped core they are not: past
     * the end of the ridge the roof falls away as a plane, so a full-height
     * rafter there would stand outside the roof it is supposed to carry — the
     * same fault as the rumah gadang's rafters over its overhang, which is now
     * three buildings.
     */
    const ridgeHalf = levels[1]?.halfZ ?? seg.halfX
    /*
     * And never outboard of the plate they land on. The platform's ridge runs
     * out over the front overhang, where there is no plate and no wall: a
     * rafter set out there is a stick hanging in the air, which is the rumah
     * gadang's cantilever fault arriving at a fifth building. The overhang is
     * carried by the ridge instead, which is why the ridge is longer than the
     * run of rafters under it.
     */
    const rafterHalf = Math.min(ridgeHalf, seg.halfX)
    const count = Math.max(2, Math.round((rafterHalf * 2) / DIMS.bayDepth.value) + 1)
    for (const sz of [-1, 1] as const) {
      for (let k = 0; k <= count; k++) {
        const x = seg.x - rafterHalf + (k / count) * rafterHalf * 2
        const id = `kasau-${seg.key}-${sz > 0 ? 'a' : 'b'}-${k}`
        parts.push(
          box(
            id,
            { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
            'kuda',
            order++,
            'ulin',
            FRAME_DIMS,
            [x, (seg.eaveY + seg.ridgeY) / 2, (sz * across) / 2],
            [section, run, section],
            [-sz * pitch, 0, 0],
          ),
        )
        /*
         * The peg is where the two timbers actually overlap.
         *
         * A nominal half-section either side of the rafter puts the end pegs
         * past the end of the ridge they are pegged into, because the outermost
         * rafter sits exactly on it. Take the intersection instead — the same
         * correction this project has now made in five places, which is why it
         * is written as an intersection rather than as a pad.
         */
        const lo = Math.max(x - section / 4, seg.x - ridgeHalf)
        const hi = Math.min(x + section / 4, seg.x + ridgeHalf)
        if (hi > lo) {
          joints.push({
            id: `pasak-${seg.key}-${sz > 0 ? 'a' : 'b'}-${k}`,
            kind: 'pasak',
            mortise: `bubungan-${seg.key}`,
            tenon: id,
            at: [(lo + hi) / 2, seg.ridgeY - section / 2, (sz * section) / 4],
            halfExtents: [(hi - lo) / 2, (section * engage) / 2, section / 4],
          })
        }
      }
    }
  }

  /*
   * A ridge piece per segment, at that segment's own height — after the
   * rafters, because that is the order it happens in.
   *
   * A ridge laid before the rafters that carry it is a ridge resting on air,
   * and the build-order check says so. It is the fifth time in this project
   * that a roof was written top-down because that is how it is drawn.
   *
   * Four ridges rather than one, stepping up to the core and down again — and
   * `checkCoreIsTallest` is the claim that the middle one is the highest,
   * because if it were not the house would not be the type its name says.
   */
  for (const seg of layout.segments) {
    const levels = segmentLevels(layout, seg)
    const ridge = levels[1]
    if (!ridge) continue
    parts.push(
      box(
        `bubungan-${seg.key}`,
        { name: 'bubungan', nameId: `Bubungan ${seg.nameId}`, nameEn: `${seg.nameEn} ridge` },
        'kuda',
        order++,
        'ulin',
        FRAME_DIMS,
        [seg.x, ridge.y - section / 2, 0],
        [ridge.halfZ * 2, section, section],
      ),
    )
  }

  /* The wings' own ridges, which run across the four along the spine. */
  const core = layout.segments.find((s) => s.key === 'palidangan')
  if (layout.anjung.present && core) {
    const levels = anjungLevels(layout)
    const ridge = levels[1]
    const wingRise = layout.anjung.ridgeY - layout.anjung.eaveY
    const wingAcross = layout.anjung.reach / 2 + layout.eaveOversail
    const wingPitch = Math.atan2(wingAcross, wingRise)
    const wingRun = Math.hypot(wingAcross, wingRise)
    for (const sz of [-1, 1] as const) {
      const zc = sz * (layout.halfZ + layout.anjung.reach / 2)
      for (const sw of [-1, 1] as const) {
        for (let k = 0; k <= 2; k++) {
          parts.push(
            box(
              `kasau-anjung-${sz > 0 ? 'a' : 'b'}${sw > 0 ? 'a' : 'b'}-${k}`,
              { name: 'kasau', nameId: 'Kasau anjung', nameEn: 'Anjung rafter' },
              'anjung',
              order++,
              'ulin',
              ['anjungRise', 'anjungReach', 'anjungDepth'],
              [
                core.x - layout.anjung.halfX + (k / 2) * layout.anjung.halfX * 2,
                (layout.anjung.eaveY + layout.anjung.ridgeY) / 2,
                zc + (sw * wingAcross) / 2,
              ],
              [section, wingRun, section],
              [-sw * wingPitch, 0, 0],
            ),
          )
        }
      }
      if (!ridge) break
      parts.push(
        box(
          `bubungan-anjung-${sz > 0 ? 'a' : 'b'}`,
          { name: 'bubungan', nameId: 'Bubungan anjung', nameEn: 'Anjung ridge' },
          'anjung',
          order++,
          'ulin',
          ['anjungRise', 'anjungReach', 'anjungDepth'],
          [core.x, ridge.y - section / 2, sz * (layout.halfZ + layout.anjung.reach / 2)],
          [ridge.halfZ * 2, section, section],
        ),
      )
    }
  }

  return { parts, joints }
}

export function buildShingles(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const bed = DIMS.bearerWidth.value / 2 + DIMS.shingleBed.value
  const thickness = DIMS.shingleThickness.value
  const dims: readonly DimKey[] = [
    'shingleCourseDepth',
    'shingleThickness',
    'shingleLap',
    'shingleBed',
    'ironwood',
    'aChainOfRoofs',
  ]
  let order = 0

  for (const seg of layout.segments) {
    const levels = segmentLevels(layout, seg)
    for (const band of shingleBands(layout)) {
      const from = 1 - band.foot
      const to = 1 - band.head
      const span = Math.max(1e-6, to - from)
      parts.push(
        meshPart(
          `sirap-${seg.key}-${band.course}`,
          {
            name: 'sirap',
            nameId: `Sirap ${seg.nameId} ${band.course + 1}`,
            nameEn: `${seg.nameEn} shingles ${band.course + 1}`,
          },
          'sirap',
          order++,
          'sirap',
          dims,
          // Built on the primitive's axes, turned a quarter, then slid into
          // place along the ridge this house actually has.
          shiftMesh(
            swapXZ(
              steppedHip(levels, {
                uvScale: 0.3,
                fFrom: from,
                fTo: to,
                offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
              }),
            ),
            seg.x,
            0,
            0,
          ),
        ),
      )
    }
  }

  /* And the wings, whose roofs are turned the same way and slid out sideways. */
  const core = layout.segments.find((s) => s.key === 'palidangan')
  if (layout.anjung.present && core) {
    const levels = anjungLevels(layout)
    for (const sz of [-1, 1] as const) {
      for (const band of shingleBands(layout)) {
        const from = 1 - band.foot
        const to = 1 - band.head
        const span = Math.max(1e-6, to - from)
        parts.push(
          meshPart(
            `sirap-anjung-${sz > 0 ? 'a' : 'b'}-${band.course}`,
            {
              name: 'sirap',
              nameId: `Sirap anjung ${band.course + 1}`,
              nameEn: `Anjung shingles ${band.course + 1}`,
            },
            'sirap',
            order++,
            'sirap',
            dims,
            shiftMesh(
              swapXZ(
                steppedHip(levels, {
                  uvScale: 0.3,
                  fFrom: from,
                  fTo: to,
                  offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
                }),
              ),
              core.x,
              0,
              sz * (layout.halfZ + layout.anjung.reach / 2),
            ),
          ),
        )
      }
    }
  }

  return parts
}

export function roofRun(layout: Layout, seg: Ruas): number {
  return hipRun(segmentLevels(layout, seg))
}
