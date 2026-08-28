/**
 * The uma, from the stones to the loft.
 *
 * Axes as in the other seven: X runs front to rear, Y is up, Z runs along the
 * ridge, and the building mirrors about z = 0.
 *
 * The order in this file is the order of the argument. The four named posts go
 * up, they are tied, the floor and the low walls follow — and then the *loft*,
 * before the tower. That is not an implementation detail: the tower exists
 * because of the loft, so the loft is built first and the tower is put around
 * it. Every other house in this project builds its roof and then finds out
 * what is under it.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, KAMBANIRU, MENARA_SCALE, umaInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Kambaniru, Layout, Part, Rules, SumbaKinds } from './types'

const builders = partBuilders<SumbaKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = umaInfo(rules.uma)
  const halfX = DIMS.coreSpanX.value / 2
  const halfZ = DIMS.coreSpanZ.value / 2
  const stoneHeight = DIMS.stoneHeight.value
  const floorY = DIMS.floorHeight.value + stoneHeight
  const wallHeight = DIMS.wallHeight.value
  const plateY = floorY + wallHeight

  const posts: Kambaniru[] = KAMBANIRU.map((k) => ({
    id: k.key,
    name: k.name,
    glossId: k.glossId,
    glossEn: k.glossEn,
    x: k.sx * halfX,
    z: k.sz * halfZ,
  }))

  const banggaDepth = DIMS.banggaDepth.value
  const bangga = {
    present: true,
    depth: banggaDepth,
    full: rules.bangga,
    y: floorY - DIMS.banggaDrop.value,
  }

  const eaveY = plateY - DIMS.eaveDrop.value
  const eaveHalfX = halfX + banggaDepth + DIMS.eaveOversail.value
  const eaveHalfZ = halfZ + banggaDepth + DIMS.eaveOversail.value

  const shoulderY = eaveY + DIMS.shoulderRise.value
  /*
   * The shoulder is the core, not a fraction of the eave.
   *
   * Written as a share of the eave at first, which put the tower's footprint
   * *inboard of the four posts that carry it* — a container standing on
   * nothing, with its legs outside it. The shoulder is where the tower begins,
   * the tower stands on the kambaniru, so the shoulder is the square the
   * kambaniru make. Derived rather than declared: one fewer invented number,
   * and a tower that lands on its own posts. The same correction the joglo's
   * roof levels needed when they were interpolated instead of being taken from
   * the pillar rings, and the Nias loft after them.
   */
  const shoulderHalfX = halfX + DIMS.postSection.value / 2
  const shoulderHalfZ = halfZ + DIMS.postSection.value / 2

  /*
   * The tower, and the only place the rules do arithmetic.
   *
   * `menara` is carried in tenths, so a rule of 12 is 1.2 — see the note on
   * MENARA_SCALE. The height it produces is measured against the house beneath
   * it rather than declared, so a taller tower is literally a statement about
   * proportion to the building it stands on, which is what the sources say it
   * is. On an uma kamadungu none of this happens: the roof stops at the
   * shoulder and there is no loft to hold anything.
   */
  const houseHeight = shoulderY
  const towerHeight = info.tower ? houseHeight * DIMS.menaraRise.value * (rules.menara / MENARA_SCALE) : 0
  /*
   * The loft is the tower's floor.
   *
   * Written first as a fraction of the way up the tower, which put a platform
   * in mid-air and asked what held it. Nothing did — and nothing does in the
   * real building either, because the uma deta is not a level inside the peak.
   * It is the floor at the foot of it: the ceiling of the house below and the
   * base of the space the marapu occupy. So its height is where the tower
   * begins, on the heads of the four kambaniru, and it is not a number anyone
   * gets to choose.
   */
  const menara = {
    present: info.tower,
    footY: shoulderY,
    peakY: shoulderY + towerHeight,
    halfX: shoulderHalfX,
    halfZ: shoulderHalfZ,
    loftY: shoulderY,
    loftHalfX: shoulderHalfX,
    loftHalfZ: shoulderHalfZ,
  }

  const lowerSlope = Math.hypot(eaveHalfX - shoulderHalfX, shoulderY - eaveY)
  const thatchCourses = Math.max(3, Math.round(lowerSlope / DIMS.thatchCourseDepth.value))
  const towerCourses = info.tower
    ? Math.max(3, Math.round(towerHeight / DIMS.thatchCourseDepth.value))
    : 0

  return {
    rules,
    coreHalfX: halfX,
    coreHalfZ: halfZ,
    floorY,
    wallHeight,
    postSection: DIMS.postSection.value,
    stoneHeight,
    posts,
    bangga,
    eaveY,
    eaveHalfX,
    eaveHalfZ,
    shoulderY,
    shoulderHalfX,
    shoulderHalfZ,
    menara,
    thatchCourses,
    towerCourses,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'coreSpanX',
  'coreSpanZ',
  'floorHeight',
  'wallHeight',
  'fourNamedPosts',
  'raisedOnPosts',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const seat = layout.stoneHeight * DIMS.postSeat.value
  const engage = DIMS.jointEngagement.value
  const plateY = layout.floorY + layout.wallHeight
  const beamD = DIMS.beamDepth.value
  const beamW = DIMS.beamWidth.value

  /*
   * Four posts, each named — and each carrying the tower.
   *
   * They run from their stone all the way to the shoulder, because that is
   * where the tower's foot sits: these four are not the frame of a room with a
   * roof over it, they are the legs of the container. On an uma kamadungu they
   * do the same job for a roof that stops lower, which is the difference stated
   * in one number rather than in two kinds of post.
   */
  const postTop = layout.shoulderY

  layout.posts.forEach((post, i) => {
    parts.push(
      box(
        `batu-${post.id}`,
        { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
        'batu',
        i,
        'batu',
        ['stoneHeight', 'stoneWidth', 'seatedOnStone'],
        [post.x, layout.stoneHeight / 2, post.z],
        [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
      ),
      box(
        post.id,
        { name: 'kambaniru', nameId: post.name, nameEn: post.name },
        'kambaniru',
        i,
        'kayu',
        POST_DIMS,
        /*
         * Up to the shoulder, which is where the tower begins.
         *
         * These four are the container's legs, and the uma deta lands on their
         * heads — which is what lets the loft be built before the tower: it is
         * these posts and not the tower frame that carry it.
         */
        [
          post.x,
          layout.stoneHeight - seat + (postTop - layout.stoneHeight + seat) / 2,
          post.z,
        ],
        [sec, postTop - layout.stoneHeight + seat, sec],
      ),
    )
    joints.push({
      id: `tumpu-${post.id}`,
      kind: 'tumpu',
      mortise: `batu-${post.id}`,
      tenon: post.id,
      at: [post.x, layout.stoneHeight - seat / 2, post.z],
      halfExtents: [sec / 2, seat / 2, sec / 2],
    })
  })

  /* The beams that tie the four heads into a frame. */
  const beamDims: readonly DimKey[] = ['beamDepth', 'beamWidth', 'coreSpanX', 'coreSpanZ']
  const pairs: readonly (readonly [string, string, 'x' | 'z'])[] = [
    ['uratungu', 'kambaniru-uma', 'z'],
    ['kambaniru-padua', 'kambaniru-mata', 'z'],
    ['uratungu', 'kambaniru-padua', 'x'],
    ['kambaniru-uma', 'kambaniru-mata', 'x'],
  ]
  pairs.forEach(([a, b, axis], i) => {
    const pa = layout.posts.find((p) => p.id === a)
    const pb = layout.posts.find((p) => p.id === b)
    if (!pa || !pb) return
    const id = `balok-${i}`
    const y = plateY - beamD / 2 - (axis === 'x' ? beamD : 0)
    parts.push(
      box(
        id,
        { name: 'balok', nameId: 'Balok', nameEn: 'Tie beam' },
        'balok',
        i,
        'kayu',
        beamDims,
        axis === 'z' ? [pa.x, y, 0] : [0, y, pa.z],
        axis === 'z' ? [beamW, beamD, Math.abs(pb.z - pa.z)] : [Math.abs(pb.x - pa.x), beamD, beamW],
      ),
    )
    for (const post of [pa, pb]) {
      /*
       * The overlap of post and beam, which at the ends of a beam is half a
       * post rather than all of one. The same correction the betang's bearers
       * needed: a joint box sized for the middle of a run reaches past the
       * timber at either end of it.
       */
      const lo = axis === 'z' ? Math.max(post.z - sec / 2, -Math.abs(pa.z)) : Math.max(post.x - sec / 2, -Math.abs(pa.x))
      const hi = axis === 'z' ? Math.min(post.z + sec / 2, Math.abs(pa.z)) : Math.min(post.x + sec / 2, Math.abs(pa.x))
      joints.push({
        id: `pasak-${i}-${post.id}`,
        kind: 'pasak',
        mortise: post.id,
        tenon: id,
        at: axis === 'z' ? [post.x, y, (lo + hi) / 2] : [(lo + hi) / 2, y, post.z],
        halfExtents:
          axis === 'z'
            ? [beamW / 2, (beamD * engage) / 2, (hi - lo) / 2]
            : [(hi - lo) / 2, (beamD * engage) / 2, beamW / 2],
      })
    }
  })

  /* The floor, the veranda outside it, and the low walls. */
  const board = DIMS.floorThickness.value
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai inti', nameEn: 'Core floor' },
      'lantai',
      0,
      'papan',
      ['floorThickness', 'floorHeight', 'coreSpanX', 'coreSpanZ'],
      [0, layout.floorY + board / 2, 0],
      [layout.coreHalfX * 2 + sec, board, layout.coreHalfZ * 2 + sec],
    ),
  )

  /*
   * The bangga: all the way round, or the two long sides only.
   *
   * Four boards or two, rather than one ring with a hole, because a ring is a
   * mesh and the joint and bounds checks want exact extents. Which side is
   * "long" is the Z pair, and the choice of which two survive when the circuit
   * is not full is the author's — a house that receives on two sides receives
   * on the sides its neighbours are, and the model has no neighbours.
   */
  const bd = layout.bangga.depth
  const banggaDims: readonly DimKey[] = ['banggaDepth', 'banggaDrop', 'floorThickness']
  const sides: readonly (readonly ['x' | 'z', -1 | 1])[] = layout.bangga.full
    ? [
        ['x', -1],
        ['x', 1],
        ['z', -1],
        ['z', 1],
      ]
    : [
        ['z', -1],
        ['z', 1],
      ]
  sides.forEach(([axis, s], i) => {
    parts.push(
      box(
        `bangga-${axis}-${s > 0 ? 'a' : 'b'}`,
        { name: 'bangga', nameId: 'Bangga', nameEn: 'Veranda' },
        'lantai',
        1 + i,
        'papan',
        banggaDims,
        axis === 'x'
          ? [s * (layout.coreHalfX + sec / 2 + bd / 2), layout.bangga.y + board / 2, 0]
          : [0, layout.bangga.y + board / 2, s * (layout.coreHalfZ + sec / 2 + bd / 2)],
        axis === 'x'
          ? [bd, board, layout.coreHalfZ * 2 + sec + bd * 2]
          : [layout.coreHalfX * 2 + sec, board, bd],
      ),
    )
  })

  const wallT = DIMS.wallThickness.value
  const wallY = layout.floorY + layout.wallHeight / 2
  const wallDims: readonly DimKey[] = ['wallHeight', 'wallThickness', 'coreSpanX', 'coreSpanZ']
  let w = 0
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        w++,
        'papan',
        wallDims,
        [sx * (layout.coreHalfX + sec / 2 - wallT / 2), wallY, 0],
        [wallT, layout.wallHeight, layout.coreHalfZ * 2 + sec],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-z-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        w++,
        'papan',
        wallDims,
        [0, wallY, sz * (layout.coreHalfZ + sec / 2 - wallT / 2)],
        [layout.coreHalfX * 2 + sec - wallT * 2, layout.wallHeight, wallT],
      ),
    )
  }

  /*
   * The loft, before the tower — because the tower is here for the loft.
   *
   * It is its own stage for that reason. In every other pack a floor inside a
   * roof is built with the roof or after it; here the build order carries the
   * argument, and `checkLoftBeforeTower` says so.
   */
  if (layout.menara.present) {
    parts.push(
      box(
        'uma-deta',
        { name: 'uma deta', nameId: 'Uma deta', nameEn: 'The loft' },
        'uma-deta',
        0,
        'papan',
        ['loftIsTheTowerFloor', 'floorThickness', 'coreSpanX', 'coreSpanZ', 'towerHoldsTheMarapu'],
        [0, layout.menara.loftY + board / 2, 0],
        [layout.menara.loftHalfX * 2, board, layout.menara.loftHalfZ * 2],
      ),
    )
  }

  return { parts, joints }
}
