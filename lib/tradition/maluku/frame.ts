/**
 * The baileo, from the stone to the stair.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse, and
 * the building mirrors about z = 0. The front is where the stair and the stone
 * are, on −X.
 *
 * The whole frame is a count of clans turned into carpentry. One pair of posts
 * per soa, one bay of floor per soa, one seat per soa, and the only thing that
 * distinguishes any of them from any other is where it stands.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, MalukuKinds, Part, Rules, Soa } from './types'

const builders = partBuilders<MalukuKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const bay = DIMS.soaBay.value
  const halfZ = DIMS.halfWidth.value
  const length = bay * rules.soa
  const floorY = DIMS.floorHeight.value + DIMS.stoneHeight.value
  const plateY = floorY + DIMS.postHeight.value

  /*
   * One bay per clan, laid out from the front.
   *
   * The middle of the building is the middle of the *list*, so an odd number
   * of soa puts one bay on the centre line and an even number puts the joint
   * between two there. Neither is privileged, which is the point: there is no
   * head of this table.
   */
  const soa: Soa[] = []
  for (let i = 0; i < rules.soa; i++) {
    soa.push({ index: i, x: -length / 2 + bay * (i + 0.5), halfX: bay / 2 })
  }

  /*
   * Where an interior stone stands: on a joint between bays, never at a bay's
   * centre.
   *
   * A bearer runs across the middle of every bay, so a stone at the middle of
   * the building would be under one — and the check refused it, rightly: a
   * floor beam over the pamali is the one thing this arrangement is not. The
   * boundaries between bays are the places with nothing crossing them, and the
   * stone stands at whichever is nearest the centre. With an even number of
   * soa that is the middle of the building; with an odd number it is half a
   * bay off it, which is what a building put around a stone actually looks
   * like.
   */
  const inside = rules.pamali === 'dalam'
  const boundaries = Array.from({ length: rules.soa + 1 }, (_, i) => -length / 2 + bay * i)
  const stoneX = boundaries.reduce((best, x) => (Math.abs(x) < Math.abs(best) ? x : best), length)

  return {
    rules,
    soa,
    length,
    halfZ,
    floorY,
    floorThickness: DIMS.floorThickness.value,
    postSection: DIMS.postSection.value,
    stoneHeight: DIMS.stoneHeight.value,
    plateY,
    ridgeY: plateY + DIMS.ridgeRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    /*
     * The band a person outside looks through.
     *
     * From the floor to the head of the posts: the whole storey, because the
     * whole storey is open. It is carried on the Layout rather than computed
     * where it is checked, so the check and the geometry read one description.
     */
    sightBand: { fromY: floorY + DIMS.floorThickness.value, toY: plateY },
    screen: { present: rules.sekat, height: DIMS.screenHeight.value },
    seat: {
      width: DIMS.seatWidth.value,
      depth: DIMS.seatDepth.value,
      height: DIMS.seatHeight.value,
    },
    pamali: {
      where: rules.pamali,
      // Inside, it stands on the centre line at the middle of the floor; in
      // front, it stands clear of the stair on the ground.
      x: inside ? stoneX : -length / 2 - DIMS.pamaliOffset.value,
      radius: DIMS.pamaliRadius.value,
      height: DIMS.pamaliHeight.value,
    },
    stair: { x: -length / 2, width: DIMS.stairWidth.value },
    thatchCourses: Math.max(
      3,
      Math.round(
        Math.hypot(halfZ + DIMS.eaveOversail.value, DIMS.ridgeRise.value) /
          DIMS.thatchCourseDepth.value,
      ),
    ),
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'postHeight',
  'floorHeight',
  'soaBay',
  'halfWidth',
  'onePlaceEachSoa',
  'belongsToNobody',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = layout.floorThickness

  /*
   * The stone, before anything else.
   *
   * Not a construction sequence but a stated one: the building is raised in
   * relation to the pamali, so the pamali is on the ground first. Where the
   * rule puts it inside, the floor is opened around it below — and the stone
   * still stands on the earth, which is the only thing that makes an interior
   * stone different from an ornament.
   */
  parts.push(
    box(
      'batu-pamali',
      { name: 'batu pamali', nameId: 'Batu pamali', nameEn: 'The pamali stone' },
      'batu',
      0,
      'batu',
      ['pamaliRadius', 'pamaliHeight', 'pamaliOffset', 'standsWithTheStone'],
      [layout.pamali.x, layout.pamali.height / 2, 0],
      [layout.pamali.radius * 2, layout.pamali.height, layout.pamali.radius * 2],
    ),
  )

  /* A pair of posts per soa, on pad stones, all of one size. */
  layout.soa.forEach((s, i) => {
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - sec / 2)
      const id = `tiang-${i}-${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          `batu-alas-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'batu alas', nameId: 'Batu alas', nameEn: 'Pad stone' },
          'batu',
          1 + i * 2 + (sz > 0 ? 1 : 0),
          'batu',
          ['stoneHeight', 'stoneWidth'],
          [s.x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
        box(
          id,
          { name: 'tiang', nameId: 'Tiang soa', nameEn: 'Soa post' },
          'tiang',
          i * 2 + (sz > 0 ? 1 : 0),
          'kayu',
          POST_DIMS,
          [s.x, layout.stoneHeight + (layout.plateY - layout.stoneHeight) / 2, z],
          [sec, layout.plateY - layout.stoneHeight, sec],
        ),
      )
    }
  })

  /* Bearers across, at the floor, one per pair. */
  layout.soa.forEach((s, i) => {
    const id = `gelagar-${i}`
    parts.push(
      box(
        id,
        { name: 'gelagar', nameId: 'Gelagar', nameEn: 'Bearer' },
        'gelagar',
        i,
        'kayu',
        ['bearerDepth', 'bearerWidth', 'halfWidth', 'floorHeight'],
        [s.x, layout.floorY - bearerD / 2, 0],
        [bearerW, bearerD, layout.halfZ * 2],
      ),
    )
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - sec / 2)
      const lo = Math.max(z - sec / 2, -layout.halfZ)
      const hi = Math.min(z + sec / 2, layout.halfZ)
      joints.push({
        id: `takik-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'takik',
        mortise: `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [s.x, layout.floorY - bearerD / 2, (lo + hi) / 2],
        halfExtents: [bearerW / 2, (bearerD * engage) / 2, (hi - lo) / 2],
      })
    }
  })

  /*
   * The floor: one plane for the whole length, and no step anywhere in it.
   *
   * Laid as one board per soa so that the bays are legible, but every board is
   * at one height — the rumah limas puts its social claim in exactly this
   * member and this building's claim is that there is nothing to put there.
   *
   * Where the stone stands inside, the bay it stands in is laid as two boards
   * with a gap between them, so the floor is opened around it rather than
   * built over it.
   */
  const inside = layout.pamali.where === 'dalam'
  const gap = layout.pamali.radius + DIMS.stairWidth.value * 0.15
  layout.soa.forEach((s, i) => {
    // Any bay the stone reaches into is laid as two boards with a slot between
    // them, so the floor is opened around it rather than built over it. On a
    // bay boundary that is two bays, one either side.
    const crosses = inside && Math.abs(s.x - layout.pamali.x) < s.halfX + layout.pamali.radius
    if (!crosses) {
      parts.push(
        box(
          `lantai-${i}`,
          { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
          'lantai',
          i,
          'papan',
          ['floorThickness', 'soaBay', 'halfWidth', 'oneFloorNoStorey'],
          [s.x, layout.floorY + board / 2, 0],
          [s.halfX * 2, board, layout.halfZ * 2],
        ),
      )
      return
    }
    for (const sz of [-1, 1] as const) {
      const inner = gap
      const outer = layout.halfZ
      parts.push(
        box(
          `lantai-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
          'lantai',
          i * 2 + (sz > 0 ? 1 : 0),
          'papan',
          ['floorThickness', 'soaBay', 'halfWidth', 'standsWithTheStone'],
          [s.x, layout.floorY + board / 2, (sz * (inner + outer)) / 2],
          [s.halfX * 2, board, outer - inner],
        ),
      )
    }
  })

  /*
   * One seat per soa, all alike.
   *
   * Along both sides, facing in. The check on them is not that they exist but
   * that they are identical: a seat wider or higher than its neighbour would
   * be this building saying the opposite of what it is for.
   */
  layout.soa.forEach((s, i) => {
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `tempat-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'tempat', nameId: `Tempat soa ${i + 1}`, nameEn: `Seat of soa ${i + 1}` },
          'tempat',
          i * 2 + (sz > 0 ? 1 : 0),
          'papan',
          ['seatWidth', 'seatDepth', 'seatHeight', 'onePlaceEachSoa'],
          [
            s.x,
            layout.floorY + board + layout.seat.height - DIMS.floorThickness.value / 2,
            sz * (layout.halfZ - sec - layout.seat.depth / 2),
          ],
          [layout.seat.width, DIMS.floorThickness.value, layout.seat.depth],
        ),
      )
    }
  })

  /* The knee-high screen, when the negeri uses one. */
  if (layout.screen.present) {
    const t = DIMS.screenThickness.value
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `sekat-${sz > 0 ? 'a' : 'b'}`,
          { name: 'sekat', nameId: 'Sekat', nameEn: 'Screen' },
          'sekat',
          sz > 0 ? 1 : 0,
          'papan',
          ['screenHeight', 'screenThickness', 'openOnAllSides'],
          [
            0,
            layout.floorY + board + layout.screen.height / 2,
            sz * (layout.halfZ - t / 2),
          ],
          [layout.length, layout.screen.height, t],
        ),
      )
    }
    // And across the back, but never across the front: the stair is there and
    // so is the stone.
    parts.push(
      box(
        'sekat-belakang',
        { name: 'sekat', nameId: 'Sekat belakang', nameEn: 'Rear screen' },
        'sekat',
        2,
        'papan',
        ['screenHeight', 'screenThickness', 'openOnAllSides'],
        [layout.length / 2 - t / 2, layout.floorY + board + layout.screen.height / 2, 0],
        [t, layout.screen.height, layout.halfZ * 2],
      ),
    )
  }

  /*
   * The stair, at the front, facing the stone.
   *
   * Two stringers first and the treads on them. The treads were laid straight
   * into the air at first and the build-order check refused them: a tread
   * rests on a stringer, and a flight of treads resting on nothing is a
   * drawing of a stair rather than a stair.
   */
  const rise = layout.floorY + board
  const treads = Math.max(3, Math.round(rise / DIMS.treadDepth.value))
  const run = DIMS.treadDepth.value * treads
  const stringer = Math.hypot(run, rise)
  const slope = Math.atan2(rise, run)
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `ibu-tangga-${sz > 0 ? 'a' : 'b'}`,
        { name: 'ibu tangga', nameId: 'Ibu tangga', nameEn: 'Stair stringer' },
        'tangga',
        sz > 0 ? 1 : 0,
        'kayu',
        ['stairWidth', 'treadDepth', 'floorHeight'],
        [layout.stair.x - run / 2, rise / 2 + bearerW / 2, sz * (layout.stair.width / 2 - bearerW / 2)],
        [stringer, bearerW, bearerW],
        [0, 0, slope],
      ),
    )
  }
  for (let k = 0; k < treads; k++) {
    const y = (rise / treads) * (k + 1)
    parts.push(
      box(
        `tangga-${k}`,
        { name: 'tangga', nameId: 'Tangga', nameEn: 'Stair' },
        'tangga',
        2 + k,
        'papan',
        ['stairWidth', 'treadDepth', 'floorHeight'],
        [
          layout.stair.x - DIMS.treadDepth.value * (treads - k - 0.5),
          y - DIMS.floorThickness.value / 2,
          0,
        ],
        [DIMS.treadDepth.value, DIMS.floorThickness.value, layout.stair.width],
      ),
    )
  }

  return { parts, joints }
}
