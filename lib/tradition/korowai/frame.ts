/**
 * The Korowai khaim, from the tree up.
 *
 * The order is the argument again. The tree is first because it was there
 * first: it is chosen standing, topped at the height the floor will sit, and
 * everything else is built around what is left of it. The ladder is last
 * because it is the one part meant to be taken away again.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse.
 * The ridge runs along Z, so the two sides of the house — women's and men's —
 * lie either side of z = 0 with one partition between them, and the building
 * is a mirror pair about that partition.
 */

import { steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, heightOf } from './rules'
import type { DimKey } from './rules'
import type { Joint, KorowaiKinds, Layout, Part, Perapian, Rules } from './types'

const builders = partBuilders<KorowaiKinds>()
const box = builders.box
const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const floorY = heightOf(rules.tinggi)
  const halfZ = (DIMS.bayLength.value * rules.perapian) / 2
  const halfX = DIMS.floorWidth.value / 2
  const inset = DIMS.postSection.value

  /*
   * The trunk thins as it rises, which is a property of the tree and not of
   * the builder — and it is the only number in this pack that can defeat a
   * height somebody chose. `atFloor` is where the floor is framed in, so that
   * is where it has to be thick enough.
   */
  const base = DIMS.trunkBase.value
  const atFloor = Math.max(0, base - DIMS.trunkTaper.value * floorY)

  /* Cut poles: four corners, and a pair at every bay line down the length. */
  const posts: [number, number][] = []
  for (let i = 0; i <= rules.perapian; i++) {
    const z = -halfZ + DIMS.bayLength.value * i
    for (const sx of [-1, 1] as const) posts.push([sx * (halfX - inset), z])
  }
  /*
   * With no tree in the middle there is nothing carrying the centre line, so
   * the house gets a row of poles down it instead. More poles, all of them
   * cut, all of them rotting from the day they are set — which is the trade
   * the rule is actually about.
   */
  if (!rules.pohon) {
    for (let i = 0; i <= rules.perapian; i++) {
      posts.push([0, -halfZ + DIMS.bayLength.value * i])
    }
  }

  const opening = DIMS.hearthSide.value / 2 + DIMS.hearthClear.value
  const hearths: Perapian[] = []
  for (let i = 0; i < rules.perapian; i++) {
    const zc = -halfZ + DIMS.bayLength.value * (i + 0.5)
    hearths.push({
      index: i,
      side: zc < 0 ? -1 : 1,
      at: [0, floorY - DIMS.hearthThickness.value / 2, zc],
      half: DIMS.hearthSide.value / 2,
    })
  }

  const wallTop = floorY + DIMS.wallHeight.value
  const ridgeY = wallTop + DIMS.roofRise.value

  return {
    rules,
    floorY,
    trunk: {
      alive: rules.pohon,
      base,
      atFloor,
      aboveRidge: DIMS.trunkAboveRidge.value,
      bearing: DIMS.trunkBearing.value,
    },
    floor: { halfX, halfZ, depth: DIMS.joistDepth.value },
    posts,
    hearths,
    wallTop,
    ridgeY,
    clearing: DIMS.clearingRadius.value,
    dims: [],
  }
}

/** The gable, as two levels of the stepped hip with the same length. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const over = DIMS.roofOverhang.value
  return [
    { key: 'tritis', halfX: layout.floor.halfX + over, halfZ: layout.floor.halfZ + over, y: layout.wallTop },
    // halfZ unchanged at the ridge, which is what makes this a gable rather
    // than a hip — the primitive needed to know nothing about that.
    { key: 'bubungan', halfX: 0, halfZ: layout.floor.halfZ + over, y: layout.ridgeY },
  ]
}

/* ── The build ────────────────────────────────────────────────────────── */

const TRUNK_DIMS: readonly DimKey[] = [
  'trunkBase',
  'trunkTaper',
  'trunkBearing',
  'trunkAboveRidge',
  'livingSupport',
  'heightIsTheDefence',
]

export function buildKhaim(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const engage = DIMS.jointEngagement.value
  const section = DIMS.postSection.value
  const joist = DIMS.joistDepth.value
  const deck = DIMS.deckThickness.value
  const joistTop = layout.floorY - deck
  const heightDim: DimKey =
    layout.rules.tinggi === 'rendah' ? 'heightLow' : layout.rules.tinggi === 'sedang' ? 'heightMid' : 'heightTall'

  /*
   * The tree, first and alive.
   *
   * It runs from the ground to well above the ridge, because what is left of
   * a topped wanbon keeps growing. Modelled as a square section, which is a
   * simplification the caution states: what matters here is where it is and
   * how thick it is at the floor, and both of those are honest.
   */
  if (layout.trunk.alive) {
    const top = layout.ridgeY + layout.trunk.aboveRidge
    const mean = (layout.trunk.base + layout.trunk.atFloor) / 2
    parts.push(
      box(
        'wanbon',
        { name: 'wanbon', nameId: 'Pohon wanbon', nameEn: 'The wanbon tree' },
        'tiang',
        0,
        'pohon',
        [...TRUNK_DIMS, heightDim],
        [0, top / 2, 0],
        [mean, top, mean],
      ),
    )
  }

  layout.posts.forEach(([x, z], i) => {
    parts.push(
      box(
        `tiang-${i}`,
        { name: 'tiang', nameId: `Tiang ${i + 1}`, nameEn: `Pole ${i + 1}` },
        'tiang',
        1 + i,
        'kayu',
        ['postSection', heightDim, 'heightIsTheDefence'],
        [x, joistTop / 2, z],
        [section, joistTop, section],
      ),
    )
  })

  /*
   * The floor bearers run across the house at every bay line, and one runs
   * over the middle where the tree is. A bearer that missed the tree would
   * leave the one support this building is named for carrying nothing.
   */
  const stations: number[] = []
  for (let i = 0; i <= layout.rules.perapian; i++) {
    stations.push(-layout.floor.halfZ + DIMS.bayLength.value * i)
  }
  if (!stations.some((z) => Math.abs(z) < 1e-9)) stations.push(0)
  stations.sort((a, b) => a - b)

  stations.forEach((z, i) => {
    const id = `gelagar-${i}`
    parts.push(
      box(
        id,
        { name: 'gelagar', nameId: `Gelagar ${i + 1}`, nameEn: `Floor bearer ${i + 1}` },
        'lantai',
        i,
        'kayu',
        ['joistDepth', 'floorWidth', 'postSection'],
        [0, joistTop - joist / 2, z],
        [layout.floor.halfX * 2, joist, section],
      ),
    )
    if (layout.trunk.alive && Math.abs(z) < 1e-9) {
      // A fork: the bearer is dropped into the crotch left when the tree was
      // topped, and held by its own weight before anything is lashed.
      joints.push({
        id: 'cagak-wanbon',
        kind: 'cagak',
        mortise: 'wanbon',
        tenon: id,
        at: [0, joistTop - joist / 2, 0],
        halfExtents: [
          (layout.trunk.atFloor * engage) / 2,
          (joist * engage) / 2,
          (section * engage) / 2,
        ],
      })
    }
    for (const sx of [-1, 1] as const) {
      const post = layout.posts.findIndex(
        ([px, pz]) => Math.abs(pz - z) < 1e-9 && Math.sign(px) === sx && Math.abs(px) > 1e-9,
      )
      if (post < 0) continue
      const px = layout.posts[post]?.[0] ?? 0
      joints.push({
        id: `rotan-${i}-${sx > 0 ? 'a' : 'b'}`,
        kind: 'rotan',
        mortise: `tiang-${post}`,
        tenon: id,
        at: [px, joistTop - joist / 2, z],
        halfExtents: [(section * engage) / 2, (joist * engage) / 2, (section * engage) / 2],
      })
    }
  })

  /*
   * The deck, laid around the openings rather than over them.
   *
   * Four strips to a bay: the floor is required to be *open* under every fire,
   * so a hearth can be cut loose and dropped. On every other building here an
   * opening in a floor is a way through for a person; this one is a way out
   * for a fire.
   */
  const open = DIMS.hearthSide.value / 2 + DIMS.hearthClear.value
  const deckDims: readonly DimKey[] = ['deckThickness', 'bayLength', 'floorWidth', 'hearthClear', 'hearthCanBeDropped']
  layout.hearths.forEach((hearth, i) => {
    const zc = hearth.at[2]
    const z0 = zc - DIMS.bayLength.value / 2
    const z1 = zc + DIMS.bayLength.value / 2
    const strips: readonly (readonly [string, number, number, number, number])[] = [
      ['depan', 0, (z0 + (zc - open)) / 2, layout.floor.halfX * 2, zc - open - z0],
      ['belakang', 0, ((zc + open) + z1) / 2, layout.floor.halfX * 2, z1 - (zc + open)],
      ['kiri', -(layout.floor.halfX + open) / 2, zc, layout.floor.halfX - open, open * 2],
      ['kanan', (layout.floor.halfX + open) / 2, zc, layout.floor.halfX - open, open * 2],
    ]
    strips.forEach(([key, x, z, sx, sz], k) => {
      parts.push(
        box(
          `lantai-${i}-${key}`,
          { name: 'lantai', nameId: `Lantai ${i + 1} ${key}`, nameEn: `Floor ${i + 1} ${key}` },
          'lantai',
          100 + i * 4 + k,
          'kulit',
          deckDims,
          [x, layout.floorY - deck / 2, z],
          [sx, deck, Math.max(0.01, sz)],
        ),
      )
    })
  })

  /* Bark walls, and the one partition that is the whole division. */
  const wallH = DIMS.wallHeight.value
  const wallT = DIMS.wallThickness.value
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-x${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding kulit kayu', nameEn: 'Bark wall' },
        'dinding',
        sx > 0 ? 0 : 1,
        'kulit',
        ['wallHeight', 'wallThickness', 'floorWidth'],
        [sx * (layout.floor.halfX - wallT / 2), layout.floorY + wallH / 2, 0],
        [wallT, wallH, layout.floor.halfZ * 2],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-z${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
        'dinding',
        sz > 0 ? 2 : 3,
        'kulit',
        ['wallHeight', 'wallThickness', 'bayLength'],
        [0, layout.floorY + wallH / 2, sz * (layout.floor.halfZ - wallT / 2)],
        [layout.floor.halfX * 2, wallH, wallT],
      ),
    )
  }
  parts.push(
    box(
      'sekat',
      { name: 'sekat', nameId: 'Sekat', nameEn: 'Partition' },
      'dinding',
      4,
      'kulit',
      ['partitionThickness', 'wallHeight', 'twoSides'],
      [0, layout.floorY + wallH / 2, 0],
      [layout.floor.halfX * 2, wallH, DIMS.partitionThickness.value],
    ),
  )

  /* Sago leaf over the whole of it. */
  parts.push(
    meshPart(
      'atap',
      { name: 'atap', nameId: 'Atap daun sagu', nameEn: 'Sago-leaf roof' },
      'atap',
      0,
      'rumbia',
      ['roofRise', 'roofOverhang', 'roofThickness', 'wallHeight'],
      steppedHip(roofLevels(layout), { uvScale: 0.4 }),
    ),
  )

  /*
   * The fires, hung rather than stood.
   *
   * Each hangs from the wall plate on a pair of light poles, in an opening
   * with nothing under it. Cut the lashings and the whole hearth falls twenty
   * metres to the forest floor, which is the point.
   */
  const hearthT = DIMS.hearthThickness.value
  layout.hearths.forEach((hearth, i) => {
    const [, hy, hz] = hearth.at
    for (const sx of [-1, 1] as const) {
      const id = `gantungan-${i}${sx > 0 ? 'a' : 'b'}`
      const top = layout.floorY + wallH
      parts.push(
        box(
          id,
          { name: 'gantungan', nameId: `Penggantung ${i + 1}`, nameEn: `Hanger ${i + 1}` },
          'perapian',
          i * 3 + (sx > 0 ? 0 : 1),
          'kayu',
          ['hearthSide', 'wallHeight', 'hearthCanBeDropped'],
          /*
           * The hanger runs down past the *edge* of the slab rather than
           * stopping on top of it, because a lashing engages where two things
           * lie against each other. Written the other way the joint box sits
           * in the gap between them and engages nothing — the fault this
           * project has now made seven times.
           */
          [sx * (hearth.half - wallT / 2), (hy - hearthT / 2 + top) / 2, hz],
          [wallT, top - (hy - hearthT / 2), wallT],
        ),
      )
    }
    const id = `perapian-${i}`
    parts.push(
      box(
        id,
        { name: 'perapian', nameId: `Perapian ${i + 1}`, nameEn: `Hearth ${i + 1}` },
        'perapian',
        i * 3 + 2,
        'tanah',
        ['hearthSide', 'hearthThickness', 'hearthClear', 'hearthCanBeDropped'],
        [0, hy, hz],
        [hearth.half * 2, hearthT, hearth.half * 2],
      ),
    )
    joints.push({
      id: `rotan-perapian-${i}`,
      kind: 'rotan',
      mortise: `gantungan-${i}a`,
      tenon: id,
      at: [hearth.half - wallT / 2, hy, hz],
      halfExtents: [(wallT * engage) / 2, (hearthT * engage) / 2, (wallT * engage) / 2],
    })
  })

  /*
   * The ladders, leaned last against both ends.
   *
   * One for each side of the partition. They are lashed to nothing: a height
   * defends nothing if the way up stays where it is, so this part of the
   * building is the one designed not to be attached — and at night it is
   * pulled up after the last person.
   */
  const lean = DIMS.ladderLean.value
  const w = DIMS.ladderWidth.value
  for (const sz of [-1, 1] as const) {
    const foot = sz * (layout.floor.halfZ + lean)
    const head = sz * layout.floor.halfZ
    const run = Math.abs(foot - head)
    const length = Math.hypot(layout.floorY, run)
    /*
     * A leaning box reaches below its own end by half its width times the sine
     * of its lean, so the foot is lifted by exactly that: a ladder standing on
     * the ground rather than driven into it.
     */
    const sinLean = run / Math.max(length, 1e-6)
    parts.push(
      box(
        `tangga-${sz > 0 ? 'a' : 'b'}`,
        { name: 'tangga', nameId: 'Tangga bertakik', nameEn: 'Notched ladder' },
        'tangga',
        sz > 0 ? 0 : 1,
        'kayu',
        ['ladderWidth', 'ladderLean', heightDim, 'ladderIsTakenAway'],
        [0, layout.floorY / 2 + (w / 2) * sinLean, (foot + head) / 2],
        [w, length, w],
        [sz * Math.atan2(run, layout.floorY), 0, 0],
      ),
    )
  }

  return { parts, joints }
}
