/**
 * The kariwari, from the bed of the bay to the topmost floor.
 *
 * The datum needs stating, because it is not the one the other fifteen use.
 * In this project y = 0 is the ground; here the ground is the *bed of the bay*,
 * the water is a sheet lying on it, and the house begins under water. The posts
 * are driven into the mud below y = 0 — which is why `embedment` is declared
 * and why nothing in the model shows it — and everything a person touches
 * begins above the tide.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse. An
 * octagon has no long side to make a front of, so the front is the side the
 * walkway lands on, which is −X.
 */

import { partBounds } from '@/lib/core/invariants'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, gradesFor } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, Tingkat, TobatiKinds } from './types'

const builders = partBuilders<TobatiKinds>()
const box = builders.box

/** Eight corners, the first one on +X, so a flat side faces the walkway. */
export function cornerAngles(facets: number): readonly number[] {
  return Array.from({ length: facets }, (_, i) => ((i + 0.5) / facets) * Math.PI * 2)
}

/** Area of a regular polygon of this many sides at this corner radius. */
export function polygonArea(radius: number, facets: number): number {
  return (facets / 2) * radius * radius * Math.sin((Math.PI * 2) / facets)
}

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const facets = Math.round(DIMS.eightSided.value)
  const radius = DIMS.radius.value
  const water = DIMS.waterDepth.value
  const tide = DIMS.tide.value
  const bearerD = DIMS.bearerDepth.value
  const board = DIMS.floorThickness.value

  /*
   * The floor height is chosen and the clearance is measured.
   *
   * They were one number at first — the floor placed a freeboard above the
   * highest water — and that made `checkAboveTheTide` a restatement of its own
   * input: no value of any dimension could flood a floor that was defined as
   * being above the water. It is the fourth check in this project to be caught
   * doing that. How high to cut the posts is a decision; whether the sea
   * reaches the floor is not, and the two numbers have to be independent for
   * the question to mean anything.
   */
  const firstFloorY = DIMS.floorHeight.value
  const freeboard = firstFloorY - bearerD - board - (water + tide)

  /*
   * The posts lean inward over their whole height, and every level reads its
   * radius off that one line.
   *
   * Sized level by level at first, from a ratio between one floor and the
   * next, which left the posts standing outside the upper floors entirely —
   * the rafters landed on nothing and the walls stood clear of the frame. A
   * battered post is one description and the floors are cut to it, which is
   * the same lesson four other packs have already recorded: when a thing rests
   * on another thing, take its position from what it rests on.
   */
  const grades = gradesFor(rules.tingkat)
  const plateY = firstFloorY + DIMS.levelHeight.value * grades.length
  const topRadius = radius * DIMS.taper.value
  const radiusAt = (y: number) => radius + (topRadius - radius) * (y / plateY)

  const levels: Tingkat[] = grades.map((grade, i) => {
    const y = firstFloorY + DIMS.levelHeight.value * i
    const r = radiusAt(y)
    return {
      index: i,
      key: grade.key,
      nameId: grade.nameId,
      nameEn: grade.nameEn,
      y,
      radius: r,
      height: DIMS.levelHeight.value,
      area: polygonArea(r, facets),
    }
  })

  const top = levels[levels.length - 1]

  return {
    rules,
    facets,
    radius,
    postSection: DIMS.postSection.value,
    waterDepth: water,
    tide,
    freeboard,
    levels,
    plateY,
    topRadius,
    apexY: plateY + DIMS.apexRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    thatchCourses: Math.max(
      4,
      Math.round(
        Math.hypot((top?.radius ?? radius) + DIMS.eaveOversail.value, DIMS.apexRise.value) /
          DIMS.thatchCourseDepth.value,
      ),
    ),
    ladder: { radius: (top?.radius ?? radius) * DIMS.taper.value, width: DIMS.ladderWidth.value },
    walkway: {
      present: rules.titian,
      y: water + tide + DIMS.freeboard.value * 0.4,
      width: DIMS.walkwayWidth.value,
      reach: DIMS.walkwayReach.value,
    },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'embedment',
  'radius',
  'waterDepth',
  'tide',
  'freeboard',
  'standsInWater',
  'eightSided',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = DIMS.floorThickness.value
  const angles = cornerAngles(layout.facets)
  const top = layout.levels[layout.levels.length - 1]
  const postTop = layout.plateY

  /*
   * Eight posts, driven, and no stone under any of them.
   *
   * They are modelled from the bed upward: the part below y = 0 is real, is
   * declared as `embedment`, and is not drawn — a post in the mud is exactly
   * as load-bearing as one on a stone and exactly as invisible as one inside a
   * wall.
   */
  const batter = Math.atan2(layout.radius - layout.topRadius, layout.plateY)
  const postRun = Math.hypot(layout.radius - layout.topRadius, layout.plateY)
  angles.forEach((a, i) => {
    const midR = (layout.radius + layout.topRadius) / 2
    const lean: [number, number, number] = [-Math.sin(a) * batter, 0, Math.cos(a) * batter]
    const draft = box(
      `tiang-${i}`,
      { name: 'tiang', nameId: 'Tiang pancang', nameEn: 'Driven post' },
      'tiang',
      i,
      'kayu',
      POST_DIMS,
      [Math.cos(a) * midR, postTop / 2, Math.sin(a) * midR],
      [sec, postRun, sec],
      lean,
    )
    /*
     * Stood on the bed exactly, by measuring the leaning box rather than
     * guessing at how far its lowest corner drops.
     *
     * A leaning member's footprint is not its section, and the arithmetic for
     * how far a corner falls below the centre line is the same arithmetic the
     * invariants already do — so it is done once, here, with the same
     * function, instead of being approximated twice.
     */
    const dip = partBounds(draft).min[1]
    parts.push(
      box(
        `tiang-${i}`,
        { name: 'tiang', nameId: 'Tiang pancang', nameEn: 'Driven post' },
        'tiang',
        i,
        'kayu',
        POST_DIMS,
        [Math.cos(a) * midR, postTop / 2 - dip, Math.sin(a) * midR],
        [sec, postRun, sec],
        lean,
      ),
    )
  })

  /* Bearers, above the highest water, tying opposite posts. */
  const firstFloor = layout.levels[0]
  if (firstFloor) {
    const y = firstFloor.y - board / 2 - bearerD / 2
    for (let i = 0; i < layout.facets / 2; i++) {
      const a = angles[i]
      if (a === undefined) continue
      const id = `gelagar-${i}`
      parts.push(
        box(
          id,
          { name: 'gelagar', nameId: 'Gelagar', nameEn: 'Bearer' },
          'gelagar',
          i,
          'kayu',
          ['bearerDepth', 'bearerWidth', 'radius', 'freeboard', 'tide'],
          [0, y, 0],
          [layout.radius * 2, bearerD, bearerW],
          [0, -a, 0],
        ),
      )
      for (const end of [0, layout.facets / 2] as const) {
        const j = (i + end) % layout.facets
        const angle = angles[j]
        if (angle === undefined) continue
        // Inboard of the bearer's own end by a quarter section: a joint box
        // hung off the end of the member it is in engages nothing, which is
        // the correction this project has now made in six packs.
        const r = layout.radius - sec / 2
        joints.push({
          id: `takik-${i}-${j}`,
          kind: 'takik',
          mortise: `tiang-${j}`,
          tenon: id,
          at: [Math.cos(angle) * r, y, Math.sin(angle) * r],
          halfExtents: [sec / 4, (bearerD * engage) / 2, sec / 4],
        })
      }
    }
  }

  /*
   * One floor per grade, each smaller than the one below.
   *
   * Drawn as an octagonal prism approximated by a box at the inscribed width,
   * which is the one simplification in the plan and is stated in the caution:
   * the walls are eight and the floor is drawn as a plate they stand on.
   */
  layout.levels.forEach((level, i) => {
    const across = level.radius * Math.cos(Math.PI / layout.facets) * 2
    parts.push(
      box(
        `lantai-${level.key}`,
        { name: 'lantai', nameId: `Lantai ${level.nameId}`, nameEn: `${level.nameEn}’ floor` },
        'lantai',
        i,
        'papan',
        ['floorThickness', 'radius', 'taper', 'levelsAreAges', 'fewerHigherUp'],
        [0, level.y - board / 2, 0],
        [across, board, across],
      ),
    )
  })

  /* Eight walls per level, closing each octagon. */
  const wallT = DIMS.wallThickness.value
  layout.levels.forEach((level, i) => {
    const side = 2 * level.radius * Math.sin(Math.PI / layout.facets)
    const apothem = level.radius * Math.cos(Math.PI / layout.facets)
    angles.forEach((a, k) => {
      const mid = a + Math.PI / layout.facets
      parts.push(
        box(
          `dinding-${level.key}-${k}`,
          { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
          'dinding',
          i * 16 + k,
          'papan',
          ['wallThickness', 'levelHeight', 'radius', 'taper', 'eightSided'],
          [
            Math.cos(mid) * (apothem - wallT / 2),
            level.y + level.height / 2,
            Math.sin(mid) * (apothem - wallT / 2),
          ],
          [wallT, level.height, side],
          [0, -mid, 0],
        ),
      )
    })
  })

  /*
   * A plate ring on the heads of the top walls: eight chords, corner to
   * corner, and it is the member the rafters are lashed to.
   *
   * It was not there in the first draft and the rafters were lashed straight
   * to the posts, which `checkJointStages` refused — five stages apart — and
   * `checkJoints` refused again, because the foot of a rafter is most of a
   * metre outboard of the wall it is supposed to be sitting on.
   */
  const topLevel = layout.levels[layout.levels.length - 1]
  if (topLevel) {
    const chord = 2 * layout.topRadius * Math.sin(Math.PI / layout.facets)
    const apothem = layout.topRadius * Math.cos(Math.PI / layout.facets)
    angles.forEach((a, k) => {
      const mid = a + Math.PI / layout.facets
      parts.push(
        box(
          `balok-${k}`,
          { name: 'balok', nameId: 'Balok kepala', nameEn: 'Head plate' },
          'dinding',
          500 + k,
          'kayu',
          ['bearerWidth', 'radius', 'taper', 'eightSided'],
          [Math.cos(mid) * apothem, layout.plateY - bearerW / 2, Math.sin(mid) * apothem],
          // Run past the corners by a section, so a rafter landing on a corner
          // is landing on the plate rather than on the join between two of them.
          [bearerW, bearerW, chord + DIMS.rafterSection.value * 2],
          [0, -mid, 0],
        ),
      )
    })
  }

  /*
   * A pole between each pair of consecutive levels, and none that skips one.
   *
   * That is the check, and it is the building's argument: an age grade is left
   * by climbing into the next one, so there is no route from the boys' floor to
   * the elders' that does not pass through the floor between.
   */
  layout.levels.forEach((level, i) => {
    const above = layout.levels[i + 1]
    if (!above) return
    // On the axis, not at a corner: one pole off to one side of an eight-fold
    // building is the only thing in it without a mirror partner, and the
    // symmetry check said so.
    const rise = above.y - level.y
    parts.push(
      box(
        `tangga-${level.key}`,
        {
          name: 'tangga',
          nameId: `Tangga ke ${above.nameId}`,
          nameEn: `Pole up to ${above.nameEn}`,
        },
        'tangga',
        i,
        'kayu',
        ['ladderWidth', 'levelHeight', 'levelsAreAges'],
        [layout.ladder.radius, level.y + rise / 2, 0],
        [layout.ladder.width, rise, layout.ladder.width],
      ),
    )
  })

  /* The walkway from the shore, when there is one. */
  if (layout.walkway.present && firstFloor) {
    const deck = layout.walkway
    const from = -layout.radius
    const posts = Math.max(2, Math.round(deck.reach / 2.5))
    for (let k = 1; k <= posts; k++) {
      const x = from - (deck.reach / posts) * k + deck.reach / (posts * 2)
      for (const sz of [-1, 1] as const) {
        parts.push(
          box(
            `tiang-titian-${k}-${sz > 0 ? 'a' : 'b'}`,
            { name: 'tiang titian', nameId: 'Tiang titian', nameEn: 'Walkway post' },
            'titian',
            k * 2 + (sz > 0 ? 1 : 0),
            'kayu',
            ['postSection', 'walkwayReach', 'waterDepth', 'standsInWater'],
            [x, deck.y / 2, sz * (deck.width / 2 - bearerW / 2)],
            [bearerW, deck.y, bearerW],
          ),
        )
      }
    }
    parts.push(
      box(
        'titian',
        { name: 'titian', nameId: 'Titian', nameEn: 'Walkway' },
        'titian',
        50,
        'papan',
        ['walkwayWidth', 'walkwayReach', 'freeboard', 'standsInWater'],
        [from - deck.reach / 2, deck.y, 0],
        [deck.reach, board, deck.width],
      ),
    )
    /* And the flight up from the walkway to the lowest floor, on stringers. */
    const rise = firstFloor.y - deck.y
    const treads = Math.max(3, Math.round(rise / DIMS.ladderWidth.value))
    const flightRun = (rise / treads) * treads
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `ibu-tangga-${sz > 0 ? 'a' : 'b'}`,
          { name: 'ibu tangga', nameId: 'Ibu tangga', nameEn: 'Stair stringer' },
          'titian',
          60 + (sz > 0 ? 1 : 0),
          'kayu',
          ['ladderWidth', 'freeboard'],
          [
            from - flightRun / 2,
            deck.y + rise / 2 + bearerW / 2,
            sz * (layout.ladder.width - bearerW / 2),
          ],
          [Math.hypot(flightRun, rise), bearerW, bearerW],
          [0, 0, Math.atan2(rise, flightRun)],
        ),
      )
    }
    for (let k = 0; k < treads; k++) {
      parts.push(
        box(
          `anak-tangga-${k}`,
          { name: 'anak tangga', nameId: 'Anak tangga', nameEn: 'Tread' },
          'titian',
          100 + k,
          'papan',
          ['ladderWidth', 'freeboard', 'floorThickness'],
          [
            from - (rise / treads) * (treads - k - 0.5),
            deck.y + (rise / treads) * (k + 1) - board / 2,
            0,
          ],
          [rise / treads, board, layout.ladder.width * 2],
        ),
      )
    }
  }

  return { parts, joints }
}
