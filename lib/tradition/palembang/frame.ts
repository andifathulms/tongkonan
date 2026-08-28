/**
 * The rumah limas, from the stones to the front gallery.
 *
 * Axes as in the other eight: X runs front to rear, Y is up, Z is transverse,
 * and the building mirrors about z = 0 — and here that mirror is the *plain*
 * axis. Everything this house says, it says along X, which is the axis it is
 * deliberately not symmetric about.
 *
 * The posts are the thing to look at. In every other house here a rank of
 * posts is a rank of identical members; here each rank stands to its own
 * level, so no two ranks are the same length and the social sequence is
 * legible from underneath the building before a single board is laid. That is
 * not decoration — it is what makes `checkPostsFollowTheSteps` a real check
 * rather than a restatement.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, levelsFor } from './rules'
import type { DimKey } from './rules'
import type { Joint, Kijing, Layout, PalembangKinds, Part, Rules } from './types'

const builders = partBuilders<PalembangKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const names = levelsFor(rules.kekijing)
  const stepDepth = DIMS.stepDepth.value
  const stepRise = DIMS.stepRise.value
  const bayWidth = DIMS.bayWidth.value
  const tenggalungDepth = DIMS.tenggalungDepth.value

  const bodyDepth = stepDepth * names.length
  const depth = bodyDepth + tenggalungDepth
  const halfX = depth / 2
  const halfZ = (bayWidth * rules.lebar) / 2

  const stoneHeight = DIMS.stoneHeight.value
  const floorY = DIMS.floorHeight.value + stoneHeight

  /*
   * The levels, front to back and rising.
   *
   * The front gallery sits at the same height as the first level rather than
   * below it: it is the threshold, not a step in the sequence. Putting it a
   * rise below would have made a six-step house out of a five-step one and
   * quietly given the household a distinction it never claimed.
   */
  const levels: Kijing[] = names.map((n, i) => ({
    key: n.key,
    index: i,
    nameId: n.nameId,
    nameEn: n.nameEn,
    glossId: n.glossId,
    glossEn: n.glossEn,
    x: -halfX + tenggalungDepth + stepDepth * (i + 0.5),
    depth: stepDepth,
    y: floorY + stepRise * i,
  }))

  const topY = floorY + stepRise * (names.length - 1)
  const wallHeight = DIMS.wallHeight.value
  // From the lowest floor, because the wall is one board. The topmost level's
  // headroom is therefore what the sequence eats into as it steepens.
  const eaveY = floorY + wallHeight
  const eaveHalfX = halfX + DIMS.eaveOversail.value
  const eaveHalfZ = halfZ + DIMS.eaveOversail.value
  const ridgeY = eaveY + DIMS.ridgeRise.value
  // A limas: one pitch on four planes, so the ridge is shorter than the eave
  // by the eave's own half-depth at each end. Derived, never declared.
  const ridgeHalfZ = Math.max(0, eaveHalfZ - eaveHalfX)

  const slope = Math.hypot(eaveHalfX, ridgeY - eaveY)
  const tileCourses = Math.max(3, Math.round(slope / DIMS.tileCourseDepth.value))

  // A rank of posts at every level boundary, and one at each end.
  const postsX = [-halfX, ...levels.map((l) => l.x - l.depth / 2), halfX]
  const postsZ: number[] = []
  for (let i = 0; i <= rules.lebar; i++) postsZ.push(-halfZ + (i * halfZ * 2) / rules.lebar)

  return {
    rules,
    halfX,
    halfZ,
    bays: rules.lebar,
    levels,
    stepRise,
    floorY,
    topY,
    postSection: DIMS.postSection.value,
    stoneHeight,
    postsX,
    postsZ,
    wallHeight,
    tenggalung: { depth: tenggalungDepth, screened: rules.tenggalung, y: floorY },
    eaveY,
    ridgeY,
    eaveHalfX,
    eaveHalfZ,
    ridgeHalfZ,
    tileCourses,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'stepRise',
  'stepDepth',
  'bayWidth',
  'raisedOnPosts',
  'floorIsTheHierarchy',
]

/** The floor height at a given X, which is what a post there has to reach. */
export function levelAt(layout: Layout, x: number): number {
  let y = layout.floorY
  for (const level of layout.levels) {
    if (x >= level.x - level.depth / 2 - 1e-9) y = level.y
  }
  return y
}

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const seat = layout.stoneHeight * DIMS.postSeat.value
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = DIMS.floorThickness.value

  /*
   * A post for every rank, standing to its own level.
   *
   * The rank at a level boundary carries the higher of the two floors, which
   * is what a stepped floor actually does: the riser is the face of the level
   * above, and the bearer under it belongs to that level.
   */
  layout.postsX.forEach((x, xi) => {
    /*
     * Up to its own floor level, not to the underside of its bearer.
     *
     * The kijing is let into a notch in the post head, so the post continues
     * past it — stopping the post where the bearer starts left the two meeting
     * on a plane, and every joint in the house came up engaging nothing.
     */
    const top = levelAt(layout, x + 1e-6)
    layout.postsZ.forEach((z, zi) => {
      const id = `tiang-${xi}-${zi}`
      parts.push(
        box(
          `batu-${xi}-${zi}`,
          { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
          'tiang',
          xi * 100 + zi,
          'batu',
          ['stoneHeight', 'stoneWidth', 'seatedOnStone'],
          [x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
        box(
          id,
          { name: 'tiang', nameId: 'Tiang unglen', nameEn: 'Ironwood post' },
          'tiang',
          xi * 100 + zi + 1,
          'unglen',
          POST_DIMS,
          [x, layout.stoneHeight - seat + (top - layout.stoneHeight + seat) / 2, z],
          [sec, top - layout.stoneHeight + seat, sec],
        ),
      )
      joints.push({
        id: `tumpu-${xi}-${zi}`,
        kind: 'tumpu',
        mortise: `batu-${xi}-${zi}`,
        tenon: id,
        at: [x, layout.stoneHeight - seat / 2, z],
        halfExtents: [sec / 2, seat / 2, sec / 2],
      })
    })
  })

  /* The kijing: a bearer across the house at every rank, at that rank's level. */
  const bearerDims: readonly DimKey[] = ['bearerDepth', 'bearerWidth', 'stepRise', 'bayWidth']
  layout.postsX.forEach((x, xi) => {
    const top = levelAt(layout, x + 1e-6)
    const id = `kijing-${xi}`
    parts.push(
      box(
        id,
        { name: 'kijing', nameId: 'Kijing', nameEn: 'Level bearer' },
        'kijing',
        xi,
        'tembesu',
        bearerDims,
        [x, top - bearerD / 2, 0],
        [bearerW, bearerD, layout.halfZ * 2],
      ),
    )
    layout.postsZ.forEach((z, zi) => {
      // The overlap of post and bearer, which at the two end posts is half a
      // post rather than all of one: they stand at the very ends of the run.
      const lo = Math.max(z - sec / 2, -layout.halfZ)
      const hi = Math.min(z + sec / 2, layout.halfZ)
      joints.push({
        id: `takik-${xi}-${zi}`,
        kind: 'takik',
        mortise: `tiang-${xi}-${zi}`,
        tenon: id,
        // The bearer sits in a notch in the post head: they overlap over the
        // top of the post rather than meeting on a plane.
        at: [x, top - bearerD / 2, (lo + hi) / 2],
        halfExtents: [bearerW / 2, (bearerD * engage) / 2, (hi - lo) / 2],
      })
    })
  })

  /* One floor per level, and the riser that lifts it above the last. */
  const floorDims: readonly DimKey[] = [
    'floorThickness',
    'stepRise',
    'stepDepth',
    'bayWidth',
    'floorIsTheHierarchy',
    'threeOrFive',
  ]
  layout.levels.forEach((level, i) => {
    parts.push(
      box(
        `lantai-${level.key}`,
        { name: 'lantai', nameId: `Lantai ${level.nameId}`, nameEn: `${level.nameEn} floor` },
        'lantai',
        i * 2,
        'papan',
        floorDims,
        [level.x, level.y + board / 2, 0],
        [level.depth, board, layout.halfZ * 2],
      ),
    )
    if (i > 0) {
      // The riser: the visible face of the step, and the thing a person sees
      // when they are told where to sit.
      parts.push(
        box(
          `tanjakan-${level.key}`,
          { name: 'tanjakan', nameId: `Tanjakan ke ${level.nameId}`, nameEn: `Riser to the ${level.nameEn}` },
          'lantai',
          i * 2 + 1,
          'papan',
          floorDims,
          [level.x - level.depth / 2, level.y - layout.stepRise / 2 + board / 2, 0],
          [DIMS.wallThickness.value, layout.stepRise, layout.halfZ * 2],
        ),
      )
    }
  })

  /* The front gallery, at the threshold rather than in the sequence. */
  parts.push(
    box(
      'tenggalung-lantai',
      { name: 'pagar tenggalung', nameId: 'Lantai pagar tenggalung', nameEn: 'Front gallery floor' },
      'tenggalung',
      0,
      'papan',
      ['tenggalungDepth', 'floorThickness', 'floorHeight', 'entryIsLowest'],
      [-layout.halfX + layout.tenggalung.depth / 2, layout.floorY + board / 2, 0],
      [layout.tenggalung.depth, board, layout.halfZ * 2],
    ),
  )
  if (layout.tenggalung.screened) {
    /*
     * The lattice, as bars rather than as a panel.
     *
     * A screen you can see through is not a wall, and a solid box would say it
     * was. The bar count follows from the pitch, so widening the house adds
     * bars rather than stretching them — which is what the joiner does.
     */
    const pitch = DIMS.kisiPitch.value
    const barSec = DIMS.kisiSection.value
    const span = layout.halfZ * 2
    const bars = Math.max(2, Math.round(span / pitch))
    for (let k = 0; k <= bars; k++) {
      parts.push(
        box(
          `kisi-${k}`,
          { name: 'kisi-kisi', nameId: 'Kisi-kisi', nameEn: 'Lattice bar' },
          'tenggalung',
          1 + k,
          'kisi',
          ['kisiHeight', 'kisiPitch', 'kisiSection', 'tenggalungDepth'],
          [
            -layout.halfX + barSec / 2,
            layout.floorY + board + DIMS.kisiHeight.value / 2,
            -layout.halfZ + (k / bars) * span,
          ],
          [barSec, DIMS.kisiHeight.value, barSec],
        ),
      )
    }
  }

  /* The walls, from the lowest floor up to the plate. */
  const wallT = DIMS.wallThickness.value
  const wallBottom = layout.floorY
  const wallTop = layout.eaveY
  const wallDims: readonly DimKey[] = ['wallHeight', 'wallThickness', 'stepRise', 'bayWidth']
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-z-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        sz > 0 ? 1 : 0,
        'papan',
        wallDims,
        [0, (wallBottom + wallTop) / 2, sz * (layout.halfZ - wallT / 2)],
        [layout.halfX * 2, wallTop - wallBottom, wallT],
      ),
    )
  }
  parts.push(
    box(
      'dinding-belakang',
      { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Rear wall' },
      'dinding',
      2,
      'papan',
      wallDims,
      [layout.halfX - wallT / 2, (wallBottom + wallTop) / 2, 0],
      [wallT, wallTop - wallBottom, layout.halfZ * 2 - wallT * 2],
    ),
  )

  /*
   * The gallery posts, and the plate the rafters land on.
   *
   * A rafter lands on a plate, and three sides of this house have a wall to
   * carry one — but the front is a gallery, so its plate stands on posts
   * running up from the floor. Written without them, ten rafters over the open
   * front were resting on nothing, which the build-order check found at once.
   * The same fault the betang had, for the same reason: an open side has no
   * wall to hold up its roof.
   */
  const plateD = bearerD
  const plateW = bearerW
  const plateY = layout.eaveY - plateD / 2
  const plateDims: readonly DimKey[] = ['bearerDepth', 'bearerWidth', 'wallHeight', 'tenggalungDepth']
  const frontX = layout.postsX[0] ?? -layout.halfX
  layout.postsZ.forEach((z, zi) => {
    parts.push(
      box(
        `tiang-muka-${zi}`,
        { name: 'tiang', nameId: 'Tiang muka', nameEn: 'Gallery post' },
        'dinding',
        10 + zi,
        'unglen',
        [...POST_DIMS, 'tenggalungDepth'],
        [frontX, layout.floorY + (layout.eaveY - plateD - layout.floorY) / 2, z],
        [sec, layout.eaveY - plateD - layout.floorY, sec],
      ),
    )
  })
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `balok-atas-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok atas', nameEn: 'Wall plate' },
        'dinding',
        100 + (sx > 0 ? 1 : 0),
        'tembesu',
        plateDims,
        [sx * (layout.halfX - plateW / 2), plateY, 0],
        [plateW, plateD, layout.halfZ * 2],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `balok-atas-z-${sz > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok atas', nameEn: 'Wall plate' },
        'dinding',
        102 + (sz > 0 ? 1 : 0),
        'tembesu',
        plateDims,
        [0, plateY, sz * (layout.halfZ - plateW / 2)],
        [layout.halfX * 2, plateD, plateW],
      ),
    )
  }

  return { parts, joints }
}
