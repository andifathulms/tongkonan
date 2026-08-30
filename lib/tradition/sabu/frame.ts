/**
 * The ammu hawu, from the stones up — and it is framed like a hull.
 *
 * The length runs along Z: the bow at −Z, the stern at +Z, and the two are not
 * alike. Across X the building is symmetric, exactly as a hull is. The roof
 * falls from the keel to within a hand of the floor, so what would be a wall
 * on any other building here is the lower part of the roof, and the way in is
 * a gap left under the eave at the bow.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, SabuKinds } from './types'

const builders = partBuilders<SabuKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const halfX = DIMS.beam.value / 2
  const length = DIMS.bayLength.value * rules.ruang
  const halfZ = length / 2
  const floorY = DIMS.floorHeight.value + DIMS.padHeight.value
  const ridgeY = floorY + DIMS.keelRise.value
  /*
   * The eave follows from the beam: the roof falls at its own pitch from the
   * keel, so a wider hull has a lower eave. That is where this building's
   * limit comes from and it is not a metaphor — the gap under the eave is the
   * only way in.
   */
  const eaveY = ridgeY - DIMS.roofFall.value * halfX

  return {
    rules,
    halfX,
    halfZ,
    ratio: { actual: length / (halfX * 2), least: DIMS.hullLeast.value, most: DIMS.hullMost.value },
    floorY,
    ridgeY,
    eaveY,
    door: { width: DIMS.doorWidth.value, head: DIMS.doorHead.value },
    bow: -halfZ,
    stern: halfZ,
    duru: {
      present: rules.duru,
      y: floorY + DIMS.duruY.value,
      halfZ: halfZ * DIMS.duruShare.value,
    },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const HULL_DIMS: readonly DimKey[] = ['beam', 'bayLength', 'hullLeast', 'hullMost', 'theHouseIsAVessel']

export function buildAmmu(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const bowPost = DIMS.bowPost.value
  const pad = DIMS.padHeight.value
  const socket = DIMS.padSocket.value
  const engage = DIMS.jointEngagement.value
  const bearer = DIMS.bearerDepth.value
  const deck = DIMS.deckThickness.value
  const deckY = layout.floorY

  /* Stones and posts. The bow post is larger, and its place cannot be swapped. */
  const lines: number[] = []
  for (let i = 0; i <= layout.rules.ruang; i++) {
    lines.push(-layout.halfZ + DIMS.bayLength.value * i)
  }
  let n = 0
  lines.forEach((z, i) => {
    const atBow = i === 0
    const section = atBow ? bowPost : post
    for (const sx of [-1, 1] as const) {
      const x = sx * (layout.halfX - section)
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
          [section * 1.5, pad, section * 1.5],
        ),
      )
      const tiang = `tiang-${n}`
      parts.push(
        box(
          tiang,
          {
            name: atBow ? 'tiang-haluan' : 'tiang',
            nameId: atBow ? 'Tiang haluan' : `Tiang ${n + 1}`,
            nameEn: atBow ? 'Bow post' : `Post ${n + 1}`,
          },
          'tiang',
          n,
          'kayu',
          atBow
            ? ['bowPost', 'floorHeight', 'endsAreNotAlike']
            : ['postSection', 'floorHeight', 'beam'],
          [x, (pad - socket + deckY) / 2, z],
          [section, deckY - pad + socket, section],
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
  })

  /* The floor of the hull. */
  lines.forEach((z, i) => {
    parts.push(
      box(
        `gelagar-${i}`,
        { name: 'gelagar', nameId: `Gelagar ${i + 1}`, nameEn: `Bearer ${i + 1}` },
        'lantai',
        i,
        'kayu',
        ['bearerDepth', 'beam', 'bayLength'],
        [0, deckY - bearer / 2, z],
        [layout.halfX * 2, bearer, post],
      ),
    )
  })
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
      'lantai',
      100,
      'papan',
      ['deckThickness', ...HULL_DIMS],
      [0, deckY + deck / 2, 0],
      [layout.halfX * 2, deck, layout.halfZ * 2],
    ),
  )

  /*
   * What little wall there is: from the floor up to the eave, on both sides
   * and across the stern. The bow is left open, and that gap is the way in.
   *
   * It goes on with the floor rather than with the roof, because the ribs land
   * on top of it — a roof frame emitted before the thing it stands on is a
   * roof frame hanging in the air, which the build-order check said the first
   * time this was written.
   */
  const wallH = layout.eaveY - deckY - deck
  const wallT = DIMS.deckThickness.value
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding rendah', nameEn: 'Low wall' },
        'lantai',
        200 + (sx > 0 ? 0 : 1),
        'papan',
        ['roofFall', 'deckThickness', 'theRoofIsTheHull'],
        [sx * (layout.halfX - wallT / 2), deckY + deck + wallH / 2, 0],
        [wallT, wallH, layout.halfZ * 2],
      ),
    )
  }
  parts.push(
    box(
      'dinding-buritan',
      { name: 'dinding', nameId: 'Dinding buritan', nameEn: 'Stern wall' },
      'lantai',
      202,
      'papan',
      ['roofFall', 'deckThickness', 'endsAreNotAlike'],
      [0, deckY + deck + wallH / 2, layout.halfZ - wallT / 2],
      [layout.halfX * 2, wallH, wallT],
    ),
  )
  const half = layout.door.width / 2
  for (const sx of [-1, 1] as const) {
    const from = sx > 0 ? half : -layout.halfX
    const to = sx > 0 ? layout.halfX : -half
    parts.push(
      box(
        `dinding-haluan-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding haluan', nameEn: 'Bow wall' },
        'lantai',
        203 + (sx > 0 ? 0 : 1),
        'papan',
        ['doorWidth', 'doorHead', 'roofFall'],
        [(from + to) / 2, deckY + deck + wallH / 2, -layout.halfZ + wallT / 2],
        [to - from, wallH, wallT],
      ),
    )
  }

  /*
   * The keel, in segments following its camber. A boat's keel is not straight
   * and neither is this ridge; the camber is small and it is the reason the
   * beam is emitted as several pieces rather than one.
   */
  const keel = DIMS.keelSection.value
  const camber = DIMS.keelCamber.value
  const segments = Math.max(3, layout.rules.ruang)
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments
    const t1 = (i + 1) / segments
    const mid = (t0 + t1) / 2
    // Highest amidships, lowest at the two ends, like a hull turned over.
    const lift = camber * Math.sin(Math.PI * mid)
    const z0 = -layout.halfZ + layout.halfZ * 2 * t0
    const z1 = -layout.halfZ + layout.halfZ * 2 * t1
    parts.push(
      box(
        `lunas-${i}`,
        { name: 'lunas', nameId: `Lunas ${i + 1}`, nameEn: `Keel ${i + 1}` },
        'lunas',
        // After the ribs: a keel is carried by what leans up to it.
        500 + i,
        'kayu',
        ['keelSection', 'keelRise', 'keelCamber', 'theHouseIsAVessel'],
        [0, layout.ridgeY + lift - keel / 2, (z0 + z1) / 2],
        [keel, keel, z1 - z0],
      ),
    )
  }

  /*
   * The stern stands higher than the bow. It is a small difference and it is
   * the whole of `endsAreNotAlike` in the geometry: swap the two and the model
   * changes, which is what a check can see.
   */
  parts.push(
    box(
      'buritan',
      { name: 'buritan', nameId: 'Buritan', nameEn: 'The stern' },
      'lunas',
      900,
      'kayu',
      ['sternRise', 'keelSection', 'endsAreNotAlike'],
      [0, layout.ridgeY + DIMS.sternRise.value / 2, layout.halfZ - keel],
      [keel, DIMS.sternRise.value, keel * 2],
    ),
  )

  /* The ribs, from the eave up to the keel. */
  const rib = DIMS.ribSection.value
  const ribs = Math.max(2, Math.round((layout.halfZ * 2) / DIMS.ribSpacing.value))
  const run = Math.hypot(layout.halfX, layout.ridgeY - layout.eaveY)
  const lean = Math.atan2(layout.halfX, layout.ridgeY - layout.eaveY)
  for (let i = 0; i <= ribs; i++) {
    const z = -layout.halfZ + ((layout.halfZ * 2) / ribs) * i
    for (const sx of [-1, 1] as const) {
      parts.push(
        box(
          `gading-${i}${sx > 0 ? 'a' : 'b'}`,
          { name: 'gading', nameId: `Gading ${i + 1}`, nameEn: `Rib ${i + 1}` },
          'lunas',
          i * 2 + (sx > 0 ? 0 : 1),
          'bambu',
          ['ribSection', 'ribSpacing', 'roofFall', 'keelRise'],
          [(sx * layout.halfX) / 2, (layout.eaveY + layout.ridgeY) / 2, z],
          [rib, run, rib],
          [0, 0, sx * lean],
        ),
      )
    }
  }

  /*
   * The thatch, down to the eave — and the eave is nearly the floor. Two
   * levels of the stepped hip with the same length make the gable this wants,
   * which is the same degenerate case the betang found.
   */
  const over = DIMS.thatchOversail.value
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap daun', nameEn: 'Palm-leaf roof' },
      'atap',
      0,
      'lontar',
      ['thatchThickness', 'thatchOversail', 'roofFall', 'theRoofIsTheHull'],
      shiftMesh(
        steppedHip(
          [
            { key: 'tepi', halfX: layout.halfX, halfZ: layout.halfZ + over, y: layout.eaveY },
            { key: 'lunas', halfX: 0, halfZ: layout.halfZ + over, y: layout.ridgeY },
          ],
          { uvScale: 0.45 },
        ),
        0,
        0,
        0,
      ),
    ),
  )

  /* The duru, where the island's living hangs. */
  if (layout.duru.present) {
    parts.push(
      box(
        'duru',
        { name: 'duru', nameId: 'Duru', nameEn: 'The loft' },
        'duru',
        0,
        'bambu',
        ['duruY', 'duruShare', 'duruThickness', 'lontarPaysForIt'],
        [0, layout.duru.y, 0],
        [layout.halfX * 1.5, DIMS.duruThickness.value, layout.duru.halfZ * 2],
      ),
    )
    joints.push({
      id: 'ikat-duru',
      kind: 'ikat',
      mortise: 'atap',
      tenon: 'duru',
      at: [layout.halfX * 0.7, layout.duru.y, 0],
      halfExtents: [
        (DIMS.duruThickness.value * engage) / 2,
        (DIMS.duruThickness.value * engage) / 2,
        (DIMS.duruThickness.value * engage) / 2,
      ],
    })
  }

  return { parts, joints }
}
