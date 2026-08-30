/**
 * The tanean lanjang, from the yard outward.
 *
 * The yard is first because the yard is the thing being made. Everything after
 * it is placed against it: the langgar closing the west end, the row of houses
 * along the north side facing south into it, the kitchens opposite.
 *
 * Axes as everywhere else: X runs front (north, negative) to rear (south,
 * positive), Y is up, Z is transverse — and here Z is east–west with +Z east,
 * because the row grows eastward and something has to say which way that is.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { BENTUK, DIMS, MAX_RUMAH, bentukInfo, normaliseRules, riseOf } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, MaduraKinds, Part, Rules, Rumah } from './types'

const builders = partBuilders<MaduraKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const pitch = DIMS.housePitch.value
  /*
   * The yard's length is the household tally times the pitch, plus the stretch
   * at the east end where the next house will stand. A tanean always has that
   * stretch: a yard with no room left in it is a family that has stopped.
   */
  const length = pitch * rules.rumah + DIMS.yardMargin.value
  const halfZ = length / 2
  const westZ = -halfZ
  const halfX = DIMS.yardWidth.value / 2
  const floorY = DIMS.plinthHeight.value
  const wallTop = floorY + DIMS.wallHeight.value
  const rise = riseOf(rules.bentuk)

  const houses: Rumah[] = []
  for (let i = 0; i < rules.rumah; i++) {
    const tonghuh = i === 0
    houses.push({
      index: i,
      tonghuh,
      // Measured from the west end, which is where the row starts and where
      // the langgar is: the eldest household is the one nearest to it.
      z: westZ + pitch * (i + 0.5),
      width: tonghuh ? DIMS.tonghuhWidth.value : DIMS.houseWidth.value,
      depth: DIMS.houseDepth.value,
      ridgeY: wallTop + rise,
    })
  }

  const kitchens: [number, number][] = []
  if (rules.dapur) {
    for (let i = 0; i < rules.rumah; i++) {
      kitchens.push([halfX + DIMS.dapurDepth.value / 2, westZ + pitch * (i + 0.5)])
    }
  }

  return {
    rules,
    yard: { halfX, halfZ, westZ },
    houses,
    langgar: {
      z: westZ - DIMS.langgarSetback.value - DIMS.langgarSide.value / 2,
      side: DIMS.langgarSide.value,
      ridgeY: wallTop + DIMS.langgarRise.value,
    },
    kitchens,
    floorY,
    wallTop,
    lane: DIMS.laneWidth.value,
    dims: [],
  }
}

/** A roof, as two levels of the stepped hip: the ridge share decides the form. */
export function roofLevels(
  halfX: number,
  halfZ: number,
  wallTop: number,
  rise: number,
  ridgeShare: number,
): readonly RoofLevel[] {
  const over = DIMS.eaveOversail.value
  return [
    { key: 'tritis', halfX: halfX + over, halfZ: halfZ + over, y: wallTop },
    /*
     * A share of 1 leaves the ridge as long as the eave, which is a gable; a
     * short share leaves something close to a pyramid. Three Madurese roof
     * names out of one primitive, and the primitive needed to know nothing —
     * the fourth distinct form `steppedHip` has produced.
     */
    { key: 'bubungan', halfX: 0, halfZ: (halfZ + over) * ridgeShare, y: wallTop + rise },
  ]
}

/* ── The build ────────────────────────────────────────────────────────── */

const YARD_DIMS: readonly DimKey[] = [
  'yardWidth',
  'housePitch',
  'yardMargin',
  'yardThickness',
  'yardIsTheRoom',
]

/** One building, wherever it stands: plinth, walls, a door, a roof. */
function building(
  parts: Part[],
  joints: Joint[],
  o: {
    readonly id: string
    readonly nameId: string
    readonly nameEn: string
    readonly stage: MaduraKinds['stage']
    readonly order: number
    readonly x: number
    readonly z: number
    readonly halfX: number
    readonly halfZ: number
    readonly rise: number
    readonly ridgeShare: number
    readonly dims: readonly DimKey[]
    readonly door: boolean
    /**
     * Which way the building looks: +1 south, −1 north.
     *
     * Everything around a tanean faces the yard, so the row of houses on the
     * north side looks south and the kitchens opposite look north. Getting
     * this wrong is not a rendering detail — it turns the kitchens' backs on
     * the room they are part of, and puts their posts in the yard.
     */
    readonly facing: -1 | 1
  },
): void {
  const floorY = DIMS.plinthHeight.value
  const wallH = DIMS.wallHeight.value
  const wallT = DIMS.wallThickness.value
  const wallTop = floorY + wallH
  const engage = DIMS.jointEngagement.value
  const pad = DIMS.umpakHeight.value
  const post = DIMS.postSection.value
  const socket = DIMS.umpakSocket.value

  /* The stones, then the plinth they stand around: masonry, not posts. */
  for (const sz of [-1, 1] as const) {
    const id = `${o.id}-umpak-${sz > 0 ? 'a' : 'b'}`
    // In the plane of the back wall, because that is where a post in a walled
    // timber house stands — and because a peg through a wall and a post that
    // do not overlap is a joint holding air.
    const px = o.x - o.facing * (o.halfX - wallT / 2)
    const pz = o.z + sz * (o.halfZ - post)
    parts.push(
      box(
        id,
        { name: 'umpak', nameId: 'Umpak', nameEn: 'Pad stone' },
        o.stage,
        o.order,
        'batu',
        ['umpakHeight', 'postSection', 'umpakSocket'],
        [px, pad / 2, pz],
        [post * 1.6, pad, post * 1.6],
      ),
    )
    const tiang = `${o.id}-tiang-${sz > 0 ? 'a' : 'b'}`
    parts.push(
      box(
        tiang,
        { name: 'tiang', nameId: 'Tiang', nameEn: 'Post' },
        o.stage,
        o.order + 1,
        'kayu',
        ['postSection', 'wallHeight', 'plinthHeight'],
        [px, (pad - socket + wallTop) / 2, pz],
        [post, wallTop - pad + socket, post],
      ),
    )
    joints.push({
      id: `umpak-${id}`,
      kind: 'umpak',
      mortise: id,
      tenon: tiang,
      // The socket: the foot of the post sits down into the stone, so the two
      // members overlap and the lashing-free joint has something to test.
      at: [px, pad - socket / 2, pz],
      halfExtents: [(post * engage) / 2, (socket * engage) / 2, (post * engage) / 2],
    })
  }

  parts.push(
    box(
      `${o.id}-lantai`,
      { name: 'lantai', nameId: o.nameId, nameEn: o.nameEn },
      o.stage,
      o.order + 2,
      'bata',
      ['plinthHeight', ...o.dims],
      [o.x, floorY / 2, o.z],
      [o.halfX * 2, floorY, o.halfZ * 2],
    ),
  )

  /* Walls, with the front one interrupted by a door onto the yard. */
  const front = o.x + o.facing * (o.halfX - wallT / 2)
  if (o.door) {
    const half = DIMS.doorWidth.value / 2
    for (const sz of [-1, 1] as const) {
      const from = sz > 0 ? half : -o.halfZ
      const to = sz > 0 ? o.halfZ : -half
      parts.push(
        box(
          `${o.id}-muka-${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding muka', nameEn: 'Front wall' },
          o.stage,
          o.order + 3,
          'papan',
          ['wallHeight', 'wallThickness', 'doorWidth'],
          [front, floorY + wallH / 2, o.z + (from + to) / 2],
          [wallT, wallH, to - from],
        ),
      )
    }
  } else {
    parts.push(
      box(
        `${o.id}-muka`,
        { name: 'dinding', nameId: 'Dinding muka', nameEn: 'Front wall' },
        o.stage,
        o.order + 3,
        'papan',
        ['wallHeight', 'wallThickness'],
        [front, floorY + wallH / 2, o.z],
        [wallT, wallH, o.halfZ * 2],
      ),
    )
  }
  parts.push(
    box(
      `${o.id}-belakang`,
      { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Back wall' },
      o.stage,
      o.order + 4,
      'papan',
      ['wallHeight', 'wallThickness'],
      [o.x - o.facing * (o.halfX - wallT / 2), floorY + wallH / 2, o.z],
      [wallT, wallH, o.halfZ * 2],
    ),
  )
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `${o.id}-samping-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding samping', nameEn: 'Side wall' },
        o.stage,
        o.order + 5,
        'papan',
        ['wallHeight', 'wallThickness'],
        [o.x, floorY + wallH / 2, o.z + sz * (o.halfZ - wallT / 2)],
        [o.halfX * 2, wallH, wallT],
      ),
    )
  }

  const levels = roofLevels(o.halfX, o.halfZ, wallTop, o.rise, o.ridgeShare)
  parts.push(
    mesh(
      `${o.id}-atap`,
      { name: 'atap', nameId: 'Atap genteng', nameEn: 'Tiled roof' },
      o.stage,
      o.order + 6,
      'genteng',
      ['eaveOversail', 'roofThickness', 'ridgeShare', ...o.dims],
      // The hip primitive builds about the origin and nothing in this pack is
      // there, so every roof is moved to its own building.
      shiftMesh(steppedHip(levels, { uvScale: 0.5 }), o.x, 0, o.z),
    ),
  )
  joints.push({
    id: `pathok-${o.id}`,
    kind: 'pathok',
    mortise: `${o.id}-belakang`,
    tenon: `${o.id}-tiang-a`,
    at: [
      o.x - o.facing * (o.halfX - wallT / 2),
      wallTop - DIMS.wallHeight.value * 0.5,
      o.z + (o.halfZ - post),
    ],
    halfExtents: [
      (wallT * engage) / 2,
      (DIMS.wallHeight.value * engage) / 2,
      (post * engage) / 2,
    ],
  })
}

export function buildTanean(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const info = bentukInfo(layout.rules.bentuk)
  const rise = riseOf(layout.rules.bentuk)

  /*
   * The yard, first and lowest.
   *
   * It is a part rather than a site figure because it is the room. The Baduy
   * house is the only other pack with ground in its part list, and there the
   * ground is what may not be cut; here it is what everything else is arranged
   * around.
   */
  parts.push(
    box(
      'tanean',
      { name: 'tanean', nameId: 'Tanean', nameEn: 'The yard' },
      'tanean',
      0,
      'tanah',
      YARD_DIMS,
      [0, DIMS.yardThickness.value / 2, 0],
      [layout.yard.halfX * 2, DIMS.yardThickness.value, layout.yard.halfZ * 2],
    ),
  )

  /* The langgar, at the west end and before any house. */
  building(parts, joints, {
    id: 'langgar',
    nameId: 'Lantai langgar',
    nameEn: 'Langgar floor',
    stage: 'langgar',
    order: 0,
    x: 0,
    z: layout.langgar.z,
    halfX: layout.langgar.side / 2,
    halfZ: layout.langgar.side / 2,
    rise: DIMS.langgarRise.value,
    ridgeShare: DIMS.ridgeShare.value,
    dims: ['langgarSide', 'langgarRise', 'langgarSetback', 'langgarClosesTheWest'],
    facing: 1,
    // Its door faces east, down the length of the yard, not across it.
    door: false,
  })

  /* The row: one house per household, west to east, in birth order. */
  layout.houses.forEach((house, i) => {
    building(parts, joints, {
      id: `rumah-${i}`,
      nameId: house.tonghuh ? 'Lantai rumah induk' : `Lantai rumah ${i + 1}`,
      nameEn: house.tonghuh ? 'Tonghuh floor' : `House ${i + 1} floor`,
      stage: 'rumah',
      order: i * 10,
      x: -(layout.yard.halfX + house.depth / 2),
      z: house.z,
      halfX: house.depth / 2,
      halfZ: house.width / 2,
      rise,
      ridgeShare: info.ridge,
      dims: house.tonghuh
        ? ['tonghuhWidth', 'houseDepth', 'seniorityRunsEast', 'housesAreAlike']
        : ['houseWidth', 'houseDepth', 'seniorityRunsEast', 'housesAreAlike'],
      door: true,
      // South, into the yard: every house in the row does.
      facing: 1,
    })
  })

  /* The kitchens, opposite and later. */
  layout.kitchens.forEach(([x, z], i) => {
    building(parts, joints, {
      id: `dapur-${i}`,
      nameId: `Lantai dapur ${i + 1}`,
      nameEn: `Kitchen ${i + 1} floor`,
      stage: 'dapur',
      order: i * 10,
      x,
      z,
      halfX: DIMS.dapurDepth.value / 2,
      halfZ: DIMS.dapurWidth.value / 2,
      rise: DIMS.dapurRise.value,
      ridgeShare: DIMS.ridgeShare.value,
      dims: ['dapurWidth', 'dapurDepth', 'dapurRise'],
      door: false,
      // North, into the same yard from the other side.
      facing: -1,
    })
  })

  return { parts, joints }
}

/**
 * The same arrangement with one household more — or one fewer, at the top of
 * the range, where there is no "more".
 *
 * `checkRowIsRegular` compares two versions of the cluster, because what it
 * asserts is about growth rather than about any one state. Which side of the
 * pair is which does not matter: the claim is that the shorter one is a prefix
 * of the longer.
 */
export function neighbourLayout(rules: Rules): Layout {
  const next = rules.rumah < MAX_RUMAH ? rules.rumah + 1 : rules.rumah - 1
  return resolveLayout(normaliseRules({ ...rules, rumah: next }))
}

/** Which roof forms exist, for the tests that walk them. */
export const FORMS = BENTUK
