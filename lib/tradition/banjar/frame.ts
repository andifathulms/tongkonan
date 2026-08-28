/**
 * The Banjar house, from the posts to the wings.
 *
 * Axes as in the other thirteen: X runs front to rear — here that is the entry
 * axis, from the river or the road inward — Y is up, Z is across, and the
 * building mirrors about z = 0.
 *
 * The whole file is a walk along `layout.segments`. Nothing takes the depth as
 * an input, because the depth is what the chain adds up to; and the floors step
 * down toward the front because each segment sits a little lower than the one
 * behind it. That stepping looks like the Palembang rumah limas's and is not
 * the same thing at all: there the steps *are* the hierarchy and a guest is
 * seated on one of them; here they follow from the sequence of roofs and from
 * water needing to run away from a house built on a tidal swamp.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, jenisInfo, jenisRise } from './rules'
import type { DimKey } from './rules'
import type { BanjarKinds, Joint, Layout, Part, Ruas, Rules } from './types'

const builders = partBuilders<BanjarKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = jenisInfo(rules.jenis)
  const halfZ = DIMS.halfWidth.value
  const coreDepth = DIMS.bayDepth.value * rules.ruang
  const step = DIMS.stepDown.value
  const coreFloor = DIMS.floorHeight.value + DIMS.stoneHeight.value
  const coreEave = DIMS.eaveY.value

  /*
   * The chain, back to front, then reversed.
   *
   * Written this way because the core is the datum: its floor and eave are the
   * declared ones and everything else steps away from them. Building the list
   * from the front would have meant deriving the core from the platform, which
   * is the wrong way round for a house whose name comes from its middle.
   */
  const spec: readonly {
    key: string
    nameId: string
    nameEn: string
    depth: number
    bentuk: Ruas['bentuk']
    rise: number
    drop: number
  }[] = [
    { key: 'padu', nameId: 'Padu', nameEn: 'Padu', depth: DIMS.paduDepth.value, bentuk: 'sengkuap', rise: DIMS.shedRise.value, drop: 1 },
    { key: 'palidangan', nameId: 'Palidangan', nameEn: 'Palidangan', depth: coreDepth, bentuk: info.core, rise: jenisRise(rules.jenis), drop: 0 },
    { key: 'surambi', nameId: 'Surambi', nameEn: 'Surambi', depth: DIMS.surambiDepth.value, bentuk: 'sengkuap', rise: DIMS.shedRise.value, drop: 1 },
    { key: 'pelatar', nameId: 'Pelatar', nameEn: 'Pelatar', depth: DIMS.pelatarDepth.value, bentuk: 'sengkuap', rise: DIMS.shedRise.value, drop: 2 },
  ]

  const depth = spec.reduce((sum, r) => sum + r.depth, 0)
  const half = depth / 2

  // Laid out from the rear face forward, so the order of the list is the order
  // a person walks it: pelatar first at the front, padu last at the back.
  const segments: Ruas[] = []
  let x = half
  for (const r of spec) {
    const centre = x - r.depth / 2
    const floorY = coreFloor - step * r.drop
    const eaveY = coreEave - step * r.drop
    segments.push({
      key: r.key,
      nameId: r.nameId,
      nameEn: r.nameEn,
      bentuk: r.bentuk,
      x: centre,
      halfX: r.depth / 2,
      floorY,
      eaveY,
      ridgeY: eaveY + r.rise,
    })
    x -= r.depth
  }
  segments.reverse()

  const postsX: number[] = []
  for (const seg of segments) {
    postsX.push(seg.x - seg.halfX)
  }
  postsX.push(half)
  const postsZ = [-halfZ, 0, halfZ]

  const core = segments.find((s) => s.key === 'palidangan')
  const slope = Math.hypot(halfZ + DIMS.eaveOversail.value, (core?.ridgeY ?? 0) - (core?.eaveY ?? 0))
  const shingleCourses = Math.max(3, Math.round(slope / DIMS.shingleCourseDepth.value))

  return {
    rules,
    halfZ,
    depth,
    segments,
    postSection: DIMS.postSection.value,
    stoneHeight: DIMS.stoneHeight.value,
    postsX,
    postsZ,
    eaveOversail: DIMS.eaveOversail.value,
    shingleCourses,
    anjung: {
      present: rules.anjung,
      halfX: DIMS.anjungDepth.value / 2,
      reach: DIMS.anjungReach.value,
      eaveY: (core?.eaveY ?? coreEave) - DIMS.stepDown.value,
      ridgeY: (core?.eaveY ?? coreEave) - DIMS.stepDown.value + DIMS.anjungRise.value,
    },
    dims: [],
  }
}

/** The segment a given X falls in, which is what a post there has to reach. */
export function segmentAt(layout: Layout, x: number): Ruas | undefined {
  for (const seg of layout.segments) {
    if (x >= seg.x - seg.halfX - 1e-9 && x <= seg.x + seg.halfX + 1e-9) return seg
  }
  return layout.segments[layout.segments.length - 1]
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'stepDown',
  'bayDepth',
  'halfWidth',
  'raisedOnPosts',
  'ironwood',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = DIMS.floorThickness.value

  /* Posts, each to the floor of the segment behind it. */
  layout.postsX.forEach((x, xi) => {
    const seg = segmentAt(layout, x + 1e-6)
    const top = seg?.floorY ?? layout.segments[0]?.floorY ?? 0
    layout.postsZ.forEach((z, zi) => {
      const id = `tongkat-${xi}-${zi}`
      parts.push(
        box(
          `batu-${xi}-${zi}`,
          { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
          'tongkat',
          xi * 10 + zi,
          'batu',
          ['stoneHeight', 'stoneWidth', 'raisedOnPosts'],
          [x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
        box(
          id,
          { name: 'tongkat', nameId: 'Tongkat', nameEn: 'Post' },
          'tongkat',
          xi * 10 + zi + 1,
          'ulin',
          POST_DIMS,
          [x, top / 2, z],
          [sec, top, sec],
        ),
      )
    })
  })

  /* Bearers across, at each rank, at that rank's level. */
  layout.postsX.forEach((x, xi) => {
    const seg = segmentAt(layout, x + 1e-6)
    const top = seg?.floorY ?? 0
    const id = `gelagar-${xi}`
    parts.push(
      box(
        id,
        { name: 'gelagar', nameId: 'Gelagar', nameEn: 'Bearer' },
        'gelagar',
        xi,
        'ulin',
        ['bearerDepth', 'bearerWidth', 'halfWidth', 'stepDown'],
        [x, top - bearerD / 2, 0],
        [bearerW, bearerD, layout.halfZ * 2],
      ),
    )
    layout.postsZ.forEach((z, zi) => {
      const lo = Math.max(z - sec / 2, -layout.halfZ)
      const hi = Math.min(z + sec / 2, layout.halfZ)
      joints.push({
        id: `takik-${xi}-${zi}`,
        kind: 'takik',
        mortise: `tongkat-${xi}-${zi}`,
        tenon: id,
        at: [x, top - bearerD / 2, (lo + hi) / 2],
        halfExtents: [bearerW / 2, (bearerD * engage) / 2, (hi - lo) / 2],
      })
    })
  })

  /* One floor per segment, at its own level. */
  layout.segments.forEach((seg, i) => {
    parts.push(
      box(
        `lantai-${seg.key}`,
        { name: 'lantai', nameId: `Lantai ${seg.nameId}`, nameEn: `${seg.nameEn} floor` },
        'lantai',
        i,
        'papan',
        ['floorThickness', 'stepDown', 'halfWidth', 'aChainOfRoofs'],
        [seg.x, seg.floorY + board / 2, 0],
        [seg.halfX * 2, board, layout.halfZ * 2],
      ),
    )
  })

  /*
   * Walls round the core and the padu; the surambi and the platform stay open.
   *
   * Which segments are walled is what makes the sequence a sequence rather than
   * a long room: a person walks in under a low shed with no walls, then into
   * something enclosed under the tall roof.
   */
  const wallT = DIMS.wallThickness.value
  const walled = layout.segments.filter((s) => s.key === 'palidangan' || s.key === 'padu')
  walled.forEach((seg, i) => {
    const height = seg.eaveY - seg.floorY
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `dinding-${seg.key}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
          'dinding',
          i * 4 + (sz > 0 ? 1 : 0),
          'papan',
          ['wallThickness', 'eaveY', 'stepDown', 'halfWidth'],
          [seg.x, seg.floorY + height / 2, sz * (layout.halfZ - wallT / 2)],
          [seg.halfX * 2, height, wallT],
        ),
      )
    }
  })
  /*
   * Side posts and a plate at the eave, on every segment.
   *
   * The walled segments would have carried their rafters on the wall head, and
   * the open ones would have carried them on nothing: the build-order check
   * refused the platform's rafters outright, which is the honest answer to a
   * veranda drawn without the posts holding its roof up. A plate at the eave on
   * both sides of every segment is the member the rafters actually land on, and
   * under the open segments it stands on posts of its own.
   */
  layout.segments.forEach((seg, i) => {
    const open = seg.key !== 'palidangan' && seg.key !== 'padu'
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - bearerW / 2)
      if (open) {
        for (const ex of [-1, 1] as const) {
          const x = seg.x + ex * (seg.halfX - sec / 2)
          parts.push(
            box(
              `tiang-${seg.key}-${sz > 0 ? 'a' : 'b'}${ex > 0 ? 'a' : 'b'}`,
              { name: 'tiang', nameId: 'Tiang', nameEn: 'Veranda post' },
              'dinding',
              30 + i * 4 + (sz > 0 ? 2 : 0) + (ex > 0 ? 1 : 0),
              'ulin',
              POST_DIMS,
              [x, (seg.floorY + seg.eaveY) / 2, z],
              [sec, seg.eaveY - seg.floorY, sec],
            ),
          )
        }
      }
      parts.push(
        box(
          `kepala-${seg.key}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'kepala', nameId: 'Kepala tiang', nameEn: 'Wall plate' },
          'dinding',
          50 + i * 2 + (sz > 0 ? 1 : 0),
          'ulin',
          ['bearerWidth', 'bearerDepth', 'eaveY', 'halfWidth'],
          [seg.x, seg.eaveY - bearerD / 2, z],
          [seg.halfX * 2, bearerD, bearerW],
        ),
      )
    }
  })

  const rear = layout.segments[layout.segments.length - 1]
  if (rear) {
    parts.push(
      box(
        'dinding-belakang',
        { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Rear wall' },
        'dinding',
        20,
        'papan',
        ['wallThickness', 'eaveY', 'halfWidth'],
        [rear.x + rear.halfX - wallT / 2, rear.floorY + (rear.eaveY - rear.floorY) / 2, 0],
        [wallT, rear.eaveY - rear.floorY, layout.halfZ * 2 - wallT * 2],
      ),
    )
  }

  /* The wings, on either side of the core. */
  const core = layout.segments.find((s) => s.key === 'palidangan')
  if (layout.anjung.present && core) {
    for (const sz of [-1, 1] as const) {
      const zc = sz * (layout.halfZ + layout.anjung.reach / 2)
      /* Posts under the wing, because it hangs off nothing otherwise. */
      const wingFloor = layout.anjung.eaveY - DIMS.eaveY.value + core.floorY
      for (const ex of [-1, 1] as const) {
        for (const ez of [0, 1] as const) {
          const px = core.x + ex * (layout.anjung.halfX - sec / 2)
          const pz = sz * (layout.halfZ + (ez === 0 ? layout.anjung.reach - sec / 2 : sec / 2))
          parts.push(
            box(
              `batu-anjung-${sz > 0 ? 'a' : 'b'}${ex > 0 ? 'a' : 'b'}${ez}`,
              { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
              'tongkat',
              200 + (sz > 0 ? 8 : 0) + (ex > 0 ? 4 : 0) + ez,
              'batu',
              ['stoneHeight', 'stoneWidth', 'raisedOnPosts'],
              [px, layout.stoneHeight / 2, pz],
              [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
            ),
          )
          parts.push(
            box(
              `tongkat-anjung-${sz > 0 ? 'a' : 'b'}${ex > 0 ? 'a' : 'b'}${ez}`,
              { name: 'tongkat', nameId: 'Tongkat anjung', nameEn: 'Anjung post' },
              'tongkat',
              220 + (sz > 0 ? 8 : 0) + (ex > 0 ? 4 : 0) + ez,
              'ulin',
              POST_DIMS,
              [px, wingFloor / 2, pz],
              [sec, wingFloor, sec],
            ),
          )
        }
      }
      parts.push(
        box(
          `anjung-lantai-${sz > 0 ? 'a' : 'b'}`,
          { name: 'anjung', nameId: 'Lantai anjung', nameEn: 'Anjung floor' },
          'anjung',
          sz > 0 ? 1 : 0,
          'papan',
          ['anjungReach', 'anjungDepth', 'floorThickness', 'stepDown'],
          [core.x, layout.anjung.eaveY - DIMS.eaveY.value + core.floorY + board / 2, zc],
          [layout.anjung.halfX * 2, board, layout.anjung.reach],
        ),
      )
      parts.push(
        box(
          `anjung-dinding-${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding anjung', nameEn: 'Anjung wall' },
          'anjung',
          2 + (sz > 0 ? 1 : 0),
          'papan',
          ['anjungReach', 'anjungDepth', 'wallThickness'],
          [
            core.x,
            (layout.anjung.eaveY - DIMS.eaveY.value + core.floorY + layout.anjung.eaveY) / 2,
            sz * (layout.halfZ + layout.anjung.reach - wallT / 2),
          ],
          [
            layout.anjung.halfX * 2,
            Math.max(1e-3, layout.anjung.eaveY - (layout.anjung.eaveY - DIMS.eaveY.value + core.floorY)),
            wallT,
          ],
        ),
      )
    }
  }

  return { parts, joints }
}
