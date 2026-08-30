/**
 * Dalam Loka, from the stones up — and there are ninety-nine of them.
 *
 * The grid is the rule: nine post lines one way and eleven the other, because
 * that is what ninety-nine factors as. Everything else is arranged inside it,
 * and the building can only be made larger by stretching the spacing — which
 * is the one thing a beam has an opinion about.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, susunanInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, SumbawaKinds } from './types'

const builders = partBuilders<SumbawaKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const grid = susunanInfo(rules.susunan)
  const bay = DIMS.bayLength.value
  const halfX = ((grid.across - 1) * bay) / 2
  const halfZ = ((grid.along - 1) * bay) / 2
  const floorY = DIMS.floorHeight.value + DIMS.padHeight.value
  const wallTop = floorY + DIMS.wallHeight.value

  const from = -halfZ
  const split = from + halfZ * 2 * DIMS.hallShare.value
  const halls = [
    { key: 'bala-rea', from, to: split },
    { key: 'dalam', from: split, to: halfZ },
  ]

  const bilik: number[] = []
  for (let i = 1; i < rules.bilik; i++) {
    bilik.push(split + ((halfZ - split) * i) / rules.bilik)
  }

  return {
    rules,
    grid: { across: grid.across, along: grid.along, posts: grid.across * grid.along },
    spacing: { bay, limit: DIMS.beamSpan.value },
    halfX,
    halfZ,
    floorY,
    wallTop,
    ridgeY: wallTop + DIMS.roofRise.value,
    halls,
    bilik,
    serambi: {
      present: rules.serambi,
      x: halfX + DIMS.serambiReach.value / 2,
      reach: DIMS.serambiReach.value,
      floorY,
    },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const GRID_DIMS: readonly DimKey[] = [
  'bayLength',
  'postSection',
  'ninetyNinePosts',
  'theGridIsNotFree',
  'everyPostCarries',
]

export function buildIstana(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const pad = DIMS.padHeight.value
  const socket = DIMS.padSocket.value
  const engage = DIMS.jointEngagement.value
  const beam = DIMS.bearerDepth.value
  const deck = DIMS.deckThickness.value
  const bay = layout.spacing.bay

  /*
   * Ninety-nine stones and ninety-nine posts, and the count is the rule rather
   * than a consequence of the plan: what the plan does is find somewhere for
   * each of them to stand where it carries something.
   */
  const xs: number[] = []
  for (let i = 0; i < layout.grid.across; i++) xs.push(-layout.halfX + bay * i)
  const zs: number[] = []
  for (let i = 0; i < layout.grid.along; i++) zs.push(-layout.halfZ + bay * i)

  let n = 0
  for (const z of zs) {
    for (const x of xs) {
      const stone = `batu-${n}`
      parts.push(
        box(
          stone,
          { name: 'batu', nameId: `Batu ${n + 1}`, nameEn: `Pad stone ${n + 1}` },
          'batu',
          n,
          'batu',
          ['padHeight', 'padSocket', 'postSection'],
          [x, pad / 2, z],
          [post * 1.5, pad, post * 1.5],
        ),
      )
      const tiang = `tiang-${n}`
      parts.push(
        box(
          tiang,
          { name: 'tiang', nameId: `Tiang ${n + 1}`, nameEn: `Post ${n + 1}` },
          'tiang',
          n,
          'kayu',
          [...GRID_DIMS, 'floorHeight'],
          [x, (pad - socket + layout.floorY) / 2, z],
          [post, layout.floorY - pad + socket, post],
        ),
      )
      joints.push({
        id: `pasak-${n}`,
        kind: 'pasak',
        mortise: stone,
        tenon: tiang,
        at: [x, pad - socket / 2, z],
        halfExtents: [(post * engage) / 2, (socket * engage) / 2, (post * engage) / 2],
      })
      n++
    }
  }

  /*
   * A beam over every line of posts, so that each of the ninety-nine is under
   * something. That is what makes the count a fact about the frame rather than
   * about the arithmetic.
   */
  zs.forEach((z, i) => {
    const id = `balok-${i}`
    parts.push(
      box(
        id,
        { name: 'balok', nameId: `Balok ${i + 1}`, nameEn: `Beam ${i + 1}` },
        'lantai',
        i,
        'kayu',
        ['bearerDepth', 'bayLength', 'beamSpan', 'growthComesOutOfTheSpans', 'everyPostCarries'],
        [0, layout.floorY - beam / 2, z],
        [layout.halfX * 2 + post, beam, post],
      ),
    )
    if (i === 0) {
      joints.push({
        id: 'baji-balok',
        kind: 'baji',
        mortise: `tiang-0`,
        tenon: id,
        at: [-layout.halfX, layout.floorY - beam / 2, z],
        halfExtents: [(post * engage) / 2, (beam * engage) / 2, (post * engage) / 2],
      })
    }
  })
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
      'lantai',
      100,
      'papan',
      ['deckThickness', 'bayLength', 'hallShare'],
      [0, layout.floorY + deck / 2, 0],
      [layout.halfX * 2, deck, layout.halfZ * 2],
    ),
  )

  /* Walls round both halls, and the divisions inside the inner one. */
  const wallH = DIMS.wallHeight.value
  const wallT = DIMS.wallThickness.value
  const wallY = layout.floorY + deck + wallH / 2
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding samping', nameEn: 'Side wall' },
        'dinding',
        sx > 0 ? 0 : 1,
        'papan',
        ['wallHeight', 'wallThickness', 'bayLength'],
        [sx * (layout.halfX - wallT / 2), wallY, 0],
        [wallT, wallH, layout.halfZ * 2],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-ujung-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
        'dinding',
        sz > 0 ? 2 : 3,
        'papan',
        ['wallHeight', 'wallThickness', 'bayLength'],
        [0, wallY, sz * (layout.halfZ - wallT / 2)],
        [layout.halfX * 2, wallH, wallT],
      ),
    )
  }
  layout.bilik.forEach((z, i) => {
    parts.push(
      box(
        `sekat-${i}`,
        { name: 'sekat', nameId: `Sekat bilik ${i + 1}`, nameEn: `Room partition ${i + 1}` },
        'dinding',
        10 + i,
        'papan',
        ['wallHeight', 'wallThickness', 'bilikWidth', 'hallShare'],
        [0, wallY, z],
        [layout.halfX * 2, wallH, wallT],
      ),
    )
  })
  const split = layout.halls[1]?.from ?? 0
  parts.push(
    box(
      'sekat-bala-rea',
      { name: 'sekat', nameId: 'Sekat bala rea', nameEn: 'Partition of the great hall' },
      'dinding',
      50,
      'papan',
      ['hallShare', 'wallHeight', 'wallThickness'],
      [0, wallY, split],
      [layout.halfX * 2, wallH, wallT],
    ),
  )

  /* One roof over both halls. */
  const over = DIMS.eaveOversail.value
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap sirap', nameEn: 'Shingle roof' },
      'atap',
      0,
      'sirap',
      ['roofRise', 'ridgeShare', 'eaveOversail', 'roofThickness', 'hallShare'],
      shiftMesh(
        steppedHip(
          [
            { key: 'tritis', halfX: layout.halfX + over, halfZ: layout.halfZ + over, y: layout.wallTop },
            {
              key: 'bubungan',
              halfX: 0,
              halfZ: (layout.halfZ + over) * DIMS.ridgeShare.value,
              y: layout.ridgeY,
            },
          ],
          { uvScale: 0.45 },
        ),
        0,
        0,
        0,
      ),
    ),
  )

  /* The covered walkway, on posts of its own. */
  if (layout.serambi.present) {
    const width = DIMS.serambiWidth.value
    for (const sz of [-1, 1] as const) {
      const stone = `batu-serambi-${sz > 0 ? 'a' : 'b'}`
      const x = layout.halfX + layout.serambi.reach - post
      parts.push(
        box(
          stone,
          { name: 'batu', nameId: 'Batu serambi', nameEn: 'Walkway stone' },
          'batu',
          900 + (sz > 0 ? 0 : 1),
          'batu',
          ['padHeight', 'padSocket', 'serambiReach'],
          [x, pad / 2, (sz * width) / 2],
          [post * 1.5, pad, post * 1.5],
        ),
      )
      parts.push(
        box(
          `tiang-serambi-${sz > 0 ? 'a' : 'b'}`,
          { name: 'tiang-serambi', nameId: 'Tiang serambi', nameEn: 'Walkway post' },
          'tiang',
          900 + (sz > 0 ? 0 : 1),
          'kayu',
          ['serambiReach', 'serambiWidth', 'postSection'],
          [x, (pad - socket + layout.floorY) / 2, (sz * width) / 2],
          [post, layout.floorY - pad + socket, post],
        ),
      )
    }
    parts.push(
      box(
        'serambi',
        { name: 'serambi', nameId: 'Serambi', nameEn: 'The walkway' },
        'serambi',
        0,
        'papan',
        ['serambiReach', 'serambiWidth', 'deckThickness'],
        [layout.serambi.x, layout.floorY + deck / 2, 0],
        [layout.serambi.reach, deck, width],
      ),
    )
  }

  return { parts, joints }
}

/** How many posts the frame actually stands on, counted from the parts. */
export function postCount(parts: readonly Part[]): number {
  return parts.filter((p) => p.name === 'tiang').length
}
