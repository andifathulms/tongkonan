/**
 * The balai, from the stones up — and the fall of the aisle floors is in the
 * frame before it is in the floors.
 *
 * The hall runs along Z. The middle floor is in the centre, an aisle down each
 * side of it, and the posts beside those aisles are cut shorter: what makes
 * the selaso fall is the length of a post, not a step laid on afterwards.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { ANJUNG, DIMS, anjungInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, RiauKinds, Rules, Selaso } from './types'

const builders = partBuilders<RiauKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const middleHalfX = DIMS.middleWidth.value / 2
  const halfZ = (DIMS.bayLength.value * rules.ruang) / 2
  const floorY = DIMS.floorHeight.value + DIMS.padHeight.value
  const fall = DIMS.selasoDrop.value

  const aisles: Selaso[] = []
  for (const side of [-1, 1] as const) {
    aisles.push({
      side,
      halfX: DIMS.aisleWidth.value / 2,
      x: side * (middleHalfX + DIMS.aisleWidth.value / 2),
      floorY: floorY - fall,
    })
  }

  const anjung: { z: number; floorY: number; halfZ: number }[] = []
  const count = anjungInfo(rules.anjung).count
  const ends: readonly (-1 | 1)[] = count === 0 ? [] : count === 1 ? [-1] : [-1, 1]
  for (const end of ends) {
    anjung.push({
      z: end * (halfZ + DIMS.anjungDepth.value / 2),
      floorY: floorY + DIMS.anjungRise.value,
      halfZ: DIMS.anjungDepth.value / 2,
    })
  }

  const wallTop = floorY + DIMS.wallHeight.value
  return {
    rules,
    middle: { halfX: middleHalfX, halfZ, floorY },
    aisles,
    drop: { fall, step: DIMS.stepLimit.value },
    anjung,
    pelantar: {
      present: rules.pelantar,
      z: halfZ + DIMS.anjungDepth.value + DIMS.pelantarDepth.value / 2,
      floorY: floorY - fall,
    },
    wallTop,
    ridgeY: wallTop + DIMS.roofRise.value,
    selembayung: DIMS.selembayungHeight.value,
    dims: [],
  }
}

/** How far out the roof reaches, which is over the aisles and past them. */
export function roofHalfX(layout: Layout): number {
  return layout.middle.halfX + DIMS.aisleWidth.value + DIMS.eaveOversail.value
}

/* ── The build ────────────────────────────────────────────────────────── */

const FLOOR_DIMS: readonly DimKey[] = [
  'middleWidth',
  'aisleWidth',
  'selasoDrop',
  'theAisleHasFallen',
  'twinAndAlike',
]

export function buildBalai(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const pad = DIMS.padHeight.value
  const socket = DIMS.padSocket.value
  const engage = DIMS.jointEngagement.value
  const bearer = DIMS.bearerDepth.value
  const deck = DIMS.deckThickness.value

  /*
   * Stones and posts. The posts on the aisle lines are cut shorter by the
   * fall: what makes a selaso lower is the frame, not a step laid on top.
   */
  const lines: number[] = []
  for (let i = 0; i <= layout.rules.ruang; i++) {
    lines.push(-layout.middle.halfZ + DIMS.bayLength.value * i)
  }
  const columns: readonly (readonly [number, number])[] = [
    [-(layout.middle.halfX + DIMS.aisleWidth.value - post), layout.aisles[0]?.floorY ?? 0],
    [-(layout.middle.halfX - post), layout.middle.floorY],
    [layout.middle.halfX - post, layout.middle.floorY],
    [layout.middle.halfX + DIMS.aisleWidth.value - post, layout.aisles[1]?.floorY ?? 0],
  ]
  let n = 0
  for (const z of lines) {
    for (const [x, top] of columns) {
      const stone = `batu-${n}`
      parts.push(
        box(
          stone,
          { name: 'batu', nameId: 'Batu tiang', nameEn: 'Pad stone' },
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
          ['postSection', 'floorHeight', 'selasoDrop', 'theAisleHasFallen'],
          [x, (pad - socket + top) / 2, z],
          [post, top - pad + socket, post],
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
   * Posts for the raised end rooms and the rear deck, in the framing stage —
   * a platform beyond the frame is a platform standing on nothing, which the
   * build-order check says the first time it is written.
   */
  const ends: readonly { readonly z: number; readonly top: number }[] = [
    ...layout.anjung.map((a) => ({ z: a.z, top: a.floorY })),
    ...(layout.pelantar.present ? [{ z: layout.pelantar.z, top: layout.pelantar.floorY }] : []),
  ]
  ends.forEach((end, k) => {
    for (const sx of [-1, 1] as const) {
      const x = sx * (layout.middle.halfX - post)
      const stone = `batu-ujung-${k}${sx > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          stone,
          { name: 'batu', nameId: 'Batu tiang', nameEn: 'Pad stone' },
          'batu',
          900 + k * 2 + (sx > 0 ? 0 : 1),
          'batu',
          ['padHeight', 'padSocket', 'postSection'],
          [x, pad / 2, end.z],
          [post * 1.5, pad, post * 1.5],
        ),
      )
      parts.push(
        box(
          `tiang-ujung-${k}${sx > 0 ? 'a' : 'b'}`,
          { name: 'tiang', nameId: 'Tiang ujung', nameEn: 'End post' },
          'tiang',
          900 + k * 2 + (sx > 0 ? 0 : 1),
          'kayu',
          ['postSection', 'anjungRise', 'anjungDepth', 'pelantarDepth'],
          [x, (pad - socket + end.top) / 2, end.z],
          [post, end.top - pad + socket, post],
        ),
      )
    }
  })

  /* The middle floor, and the two fallen ones beside it. */
  lines.forEach((z, i) => {
    parts.push(
      box(
        `gelagar-${i}`,
        { name: 'gelagar', nameId: `Gelagar ${i + 1}`, nameEn: `Bearer ${i + 1}` },
        'lantai',
        i,
        'kayu',
        ['bearerDepth', 'middleWidth', 'bayLength'],
        [0, layout.middle.floorY - bearer / 2, z],
        [layout.middle.halfX * 2, bearer, post],
      ),
    )
  })
  parts.push(
    box(
      'lantai-tengah',
      { name: 'lantai', nameId: 'Lantai tengah', nameEn: 'The middle floor' },
      'lantai',
      100,
      'papan',
      ['deckThickness', 'bayLength', ...FLOOR_DIMS],
      [0, layout.middle.floorY + deck / 2, 0],
      [layout.middle.halfX * 2, deck, layout.middle.halfZ * 2],
    ),
  )
  layout.aisles.forEach((aisle, i) => {
    parts.push(
      box(
        `gelagar-selaso-${i}`,
        { name: 'gelagar', nameId: 'Gelagar selaso', nameEn: 'Aisle bearer' },
        'lantai',
        200 + i,
        'kayu',
        ['bearerDepth', 'aisleWidth', 'selasoDrop', 'postSection'],
        // Reaching in past the middle post line: an aisle bearer that starts
        // exactly at the edge of the middle floor is carried by nothing, and
        // the fall means it cannot lap the middle bearer either.
        [aisle.x - aisle.side * post * 0.75, aisle.floorY - bearer / 2, 0],
        [aisle.halfX * 2 + post * 1.5, bearer, layout.middle.halfZ * 2],
      ),
    )
    parts.push(
      box(
        `lantai-selaso-${i}`,
        {
          name: 'selaso',
          nameId: `Lantai selaso ${i + 1}`,
          nameEn: `Fallen aisle floor ${i + 1}`,
        },
        'lantai',
        202 + i,
        'papan',
        ['deckThickness', ...FLOOR_DIMS, 'youPassWithoutEntering', 'oneStepNotAStair'],
        [aisle.x, aisle.floorY + deck / 2, 0],
        [aisle.halfX * 2, deck, layout.middle.halfZ * 2],
      ),
    )
    /*
     * The wedge is between the aisle bearer and the post carrying it, not
     * between the two bearers: with a fall deeper than a bearer the two floors
     * never touch, so a joint written between them would hold air.
     */
    joints.push({
      id: `baji-selaso-${i}`,
      kind: 'baji',
      // The second frame line in, so the joint sits at a post's own centre and
      // inside the bearer rather than at either one's end.
      mortise: `tiang-${i === 0 ? 5 : 6}`,
      tenon: `gelagar-selaso-${i}`,
      at: [
        aisle.side * (layout.middle.halfX - post),
        aisle.floorY - bearer / 2,
        -layout.middle.halfZ + DIMS.bayLength.value,
      ],
      halfExtents: [(post * engage) / 2, (bearer * engage) / 2, (post * engage) / 2],
    })
  })

  /* The raised end rooms, and the rear deck. */
  layout.anjung.forEach((end, i) => {
    parts.push(
      box(
        `anjung-${i}`,
        { name: 'anjung', nameId: `Anjung ${i + 1}`, nameEn: `Anjung ${i + 1}` },
        'lantai',
        300 + i,
        'papan',
        ['anjungRise', 'anjungDepth', 'deckThickness', 'middleWidth'],
        [0, end.floorY + deck / 2, end.z],
        [layout.middle.halfX * 2, deck, end.halfZ * 2],
      ),
    )
  })
  if (layout.pelantar.present) {
    parts.push(
      box(
        'pelantar',
        { name: 'pelantar', nameId: 'Pelantar', nameEn: 'The rear deck' },
        'lantai',
        400,
        'papan',
        ['pelantarDepth', 'deckThickness', 'selasoDrop'],
        [0, layout.pelantar.floorY + deck / 2, layout.pelantar.z],
        [layout.middle.halfX * 2, deck, DIMS.pelantarDepth.value],
      ),
    )
  }

  /*
   * Walls round the middle room only, and a low rail along the aisles: a way
   * through is not closed off.
   */
  const wallH = DIMS.wallHeight.value
  const wallT = DIMS.wallThickness.value
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding ruang tengah', nameEn: 'Wall of the middle room' },
        'dinding',
        sx > 0 ? 0 : 1,
        'papan',
        ['wallHeight', 'wallThickness', 'middleWidth'],
        [sx * (layout.middle.halfX - wallT / 2), layout.middle.floorY + deck + wallH / 2, 0],
        [wallT, wallH, layout.middle.halfZ * 2],
      ),
    )
  }
  layout.aisles.forEach((aisle, i) => {
    parts.push(
      box(
        `pagar-${i}`,
        { name: 'pagar', nameId: 'Pagar selaso', nameEn: 'Aisle rail' },
        'dinding',
        10 + i,
        'kayu',
        ['railHeight', 'wallThickness', 'youPassWithoutEntering'],
        [
          aisle.x + aisle.side * (aisle.halfX - wallT / 2),
          aisle.floorY + deck + DIMS.railHeight.value / 2,
          0,
        ],
        [wallT, DIMS.railHeight.value, layout.middle.halfZ * 2],
      ),
    )
  })

  /* One roof over all three floors. */
  const halfX = roofHalfX(layout)
  const halfZ = layout.middle.halfZ + DIMS.eaveOversail.value
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap sirap', nameEn: 'Shingle roof' },
      'atap',
      0,
      'sirap',
      ['roofRise', 'ridgeShare', 'eaveOversail', 'roofThickness'],
      shiftMesh(
        steppedHip(
          [
            { key: 'tritis', halfX, halfZ, y: layout.wallTop },
            { key: 'bubungan', halfX: 0, halfZ: halfZ * DIMS.ridgeShare.value, y: layout.ridgeY },
          ],
          { uvScale: 0.45 },
        ),
        0,
        0,
        0,
      ),
    ),
  )

  /* The selembayung, crossing at both ends of the ridge. */
  const sel = DIMS.selembayungHeight.value
  const selSection = DIMS.selembayungSection.value
  for (const sz of [-1, 1] as const) {
    for (const sx of [-1, 1] as const) {
      const id = `selembayung-${sz > 0 ? 'a' : 'b'}${sx > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          id,
          { name: 'selembayung', nameId: 'Selembayung', nameEn: 'Selembayung' },
          'selembayung',
          (sz > 0 ? 0 : 2) + (sx > 0 ? 0 : 1),
          'ukiran',
          ['selembayungHeight', 'selembayungSection', 'ridgeShare'],
          [
            (sx * sel) / 5,
            layout.ridgeY + sel / 2 - selSection,
            sz * (halfZ * DIMS.ridgeShare.value - selSection),
          ],
          [selSection, sel, selSection],
          [sz * 0.5, 0, sx * 0.28],
        ),
      )
    }
  }

  return { parts, joints }
}

/** Which anjung arrangements exist, for the tests that walk them. */
export const ARRANGEMENTS = ANJUNG
