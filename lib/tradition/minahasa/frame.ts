/**
 * The woloan house, built the way it will be taken apart.
 *
 * Every member here stops at a bay line when the house is a movable one, and
 * runs the length of the building when it is not. That single difference is
 * the pack's whole argument, so it is written once — `pieceAlong` — and every
 * builder in this file goes through it.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse. The
 * front is −X, where the veranda and its two stairs are.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, tanggaInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, MinahasaKinds, Part, Ruang, Rules } from './types'

const builders = partBuilders<MinahasaKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const bay = DIMS.bayLength.value
  const halfZ = DIMS.halfWidth.value
  const length = bay * rules.ruang
  const floorY = DIMS.floorHeight.value + DIMS.stoneHeight.value
  const plateY = floorY + DIMS.wallHeight.value

  const bays: Ruang[] = []
  for (let i = 0; i < rules.ruang; i++) {
    bays.push({ index: i, x: -length / 2 + bay * (i + 0.5), halfX: bay / 2 })
  }

  const info = tanggaInfo(rules.tangga)
  const verandaDepth = DIMS.verandaDepth.value
  const offset = DIMS.stairOffset.value
  const stairs =
    info.count === 2
      ? [{ z: -(halfZ - offset - DIMS.stairWidth.value / 2) }, { z: halfZ - offset - DIMS.stairWidth.value / 2 }]
      : [{ z: 0 }]

  return {
    rules,
    bays,
    length,
    halfZ,
    floorY,
    postSection: DIMS.postSection.value,
    stoneHeight: DIMS.stoneHeight.value,
    wallHeight: DIMS.wallHeight.value,
    plateY,
    ridgeY: plateY + DIMS.ridgeRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    veranda: { depth: verandaDepth, floorY: floorY - DIMS.floorThickness.value * 3 },
    stairs,
    haulLength: DIMS.haulLength.value,
    movable: rules.pindah,
    shingleCourses: Math.max(
      3,
      Math.round(
        Math.hypot(halfZ + DIMS.eaveOversail.value, DIMS.ridgeRise.value) /
          DIMS.shingleCourseDepth.value,
      ),
    ),
    dims: [],
  }
}

/**
 * How a run along the building is cut into pieces.
 *
 * A movable house breaks every run at its bay lines, so nothing is longer than
 * one bay; a fixed one runs the member the whole way. This is the difference
 * the rule makes, and it is here rather than in six builders because a piece
 * length is one decision and ought to be written once.
 */
export function pieceAlong(
  layout: Layout,
): readonly { readonly x: number; readonly length: number }[] {
  if (!layout.movable) return [{ x: 0, length: layout.length }]
  return layout.bays.map((b) => ({ x: b.x, length: b.halfX * 2 }))
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'wallHeight',
  'bayLength',
  'halfWidth',
  'builtToBeMoved',
  'everyJointReversible',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = DIMS.floorThickness.value
  const wallT = DIMS.wallThickness.value

  /* The stones, which are the part that stays behind. */
  const lines = [...layout.bays.map((b) => b.x - b.halfX), layout.length / 2]
  lines.forEach((x, i) => {
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - sec / 2)
      parts.push(
        box(
          `batu-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
          'batu',
          i * 2 + (sz > 0 ? 1 : 0),
          'batu',
          ['stoneHeight', 'stoneWidth', 'stonesStay'],
          [x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
      )
      parts.push(
        box(
          `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'tiang', nameId: 'Tiang', nameEn: 'Post' },
          'tiang',
          i * 2 + (sz > 0 ? 1 : 0),
          'kayu',
          POST_DIMS,
          [x, layout.stoneHeight + (layout.plateY - layout.stoneHeight) / 2, z],
          [sec, layout.plateY - layout.stoneHeight, sec],
        ),
      )
    }
  })

  /* Bearers across, at every line of posts. */
  lines.forEach((x, i) => {
    const id = `gelagar-${i}`
    parts.push(
      box(
        id,
        { name: 'gelagar', nameId: 'Gelagar', nameEn: 'Bearer' },
        'gelagar',
        i,
        'kayu',
        ['bearerDepth', 'bearerWidth', 'halfWidth', 'cutToTheRoad'],
        [x, layout.floorY - bearerD / 2, 0],
        [bearerW, bearerD, layout.halfZ * 2],
      ),
    )
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - sec / 2)
      const lo = Math.max(z - sec / 2, -layout.halfZ)
      const hi = Math.min(z + sec / 2, layout.halfZ)
      joints.push({
        id: `pasak-lantai-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'pasak',
        mortise: `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [x, layout.floorY - bearerD / 2, (lo + hi) / 2],
        halfExtents: [bearerW / 2, (bearerD * engage) / 2, (hi - lo) / 2],
      })
    }
  })

  /* The floor, in pieces the road allows. */
  pieceAlong(layout).forEach((piece, i) => {
    parts.push(
      box(
        `lantai-${i}`,
        { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
        'lantai',
        i,
        'papan',
        ['floorThickness', 'bayLength', 'halfWidth', 'cutToTheRoad'],
        [piece.x, layout.floorY + board / 2, 0],
        [piece.length, board, layout.halfZ * 2],
      ),
    )
  })

  /* Walls as panels, one to a piece, on both sides and across the back. */
  pieceAlong(layout).forEach((piece, i) => {
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `dinding-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Panel dinding', nameEn: 'Wall panel' },
          'dinding',
          i * 2 + (sz > 0 ? 1 : 0),
          'papan',
          ['wallThickness', 'wallHeight', 'bayLength', 'cutToTheRoad'],
          [
            piece.x,
            layout.floorY + board + layout.wallHeight / 2,
            sz * (layout.halfZ - wallT / 2),
          ],
          [piece.length, layout.wallHeight, wallT],
        ),
      )
    }
  })
  parts.push(
    box(
      'dinding-belakang',
      { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Rear wall' },
      'dinding',
      100,
      'papan',
      ['wallThickness', 'wallHeight', 'halfWidth'],
      [layout.length / 2 - wallT / 2, layout.floorY + board + layout.wallHeight / 2, 0],
      [wallT, layout.wallHeight, layout.halfZ * 2 - wallT * 2],
    ),
  )
  /* And the front wall, which stops where the veranda opens. */
  parts.push(
    box(
      'dinding-depan',
      { name: 'dinding', nameId: 'Dinding depan', nameEn: 'Front wall' },
      'dinding',
      101,
      'papan',
      ['wallThickness', 'wallHeight', 'halfWidth'],
      [-layout.length / 2 + wallT / 2, layout.floorY + board + layout.wallHeight / 2, 0],
      [wallT, layout.wallHeight, layout.halfZ * 2 - wallT * 2],
    ),
  )

  /*
   * The veranda: a lower deck across the whole front, on its own posts.
   *
   * Lower than the floor inside by three board thicknesses, which is what
   * makes the step at the door read as a step rather than as a join.
   */
  const vx = -layout.length / 2 - layout.veranda.depth / 2
  /*
   * Posts before the deck they carry.
   *
   * The deck was emitted first and `checkCanBeUnbuilt` caught it: run
   * backwards, the posts came out from under a deck that was still standing on
   * them. Forwards it looked fine, because the deck also touches the body of
   * the house — which is exactly the difference between a house that can be
   * taken apart and one that can only be pulled down.
   */
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `tiang-serambi-${sz > 0 ? 'a' : 'b'}`,
        { name: 'tiang', nameId: 'Tiang serambi', nameEn: 'Veranda post' },
        'serambi',
        sz > 0 ? 1 : 0,
        'kayu',
        ['postSection', 'verandaDepth', 'floorHeight'],
        [
          -layout.length / 2 - layout.veranda.depth + sec / 2,
          layout.veranda.floorY / 2,
          sz * (layout.halfZ - sec / 2),
        ],
        [sec, layout.veranda.floorY, sec],
      ),
    )
  }
  parts.push(
    box(
      'serambi',
      { name: 'serambi', nameId: 'Serambi', nameEn: 'Veranda' },
      'serambi',
      2,
      'papan',
      ['verandaDepth', 'floorThickness', 'halfWidth', 'twoStairs'],
      [vx, layout.veranda.floorY + board / 2, 0],
      [layout.veranda.depth, board, layout.halfZ * 2],
    ),
  )

  /* The stairs, at the ends of the veranda or in the middle of it. */
  const rise = layout.veranda.floorY + board
  const treads = Math.max(3, Math.round(rise / DIMS.treadDepth.value))
  const run = DIMS.treadDepth.value * treads
  layout.stairs.forEach((stair, s) => {
    const x0 = -layout.length / 2 - layout.veranda.depth
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `ibu-tangga-${s}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'ibu tangga', nameId: 'Ibu tangga', nameEn: 'Stringer' },
          'tangga',
          s * 10 + (sz > 0 ? 1 : 0),
          'kayu',
          ['stairWidth', 'treadDepth', 'floorHeight', 'twoStairs'],
          [
            x0 - run / 2,
            rise / 2 + bearerW / 2,
            stair.z + sz * (DIMS.stairWidth.value / 2 - bearerW / 2),
          ],
          [Math.hypot(run, rise), bearerW, bearerW],
          [0, 0, Math.atan2(rise, run)],
        ),
      )
    }
    for (let k = 0; k < treads; k++) {
      parts.push(
        box(
          `tangga-${s}-${k}`,
          { name: 'tangga', nameId: 'Anak tangga', nameEn: 'Tread' },
          'tangga',
          s * 10 + 2 + k,
          'papan',
          ['stairWidth', 'treadDepth', 'floorThickness'],
          [
            x0 - DIMS.treadDepth.value * (treads - k - 0.5),
            (rise / treads) * (k + 1) - board / 2,
            stair.z,
          ],
          [DIMS.treadDepth.value, board, DIMS.stairWidth.value],
        ),
      )
    }
  })

  return { parts, joints }
}
