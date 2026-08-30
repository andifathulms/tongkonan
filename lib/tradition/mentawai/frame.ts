/**
 * The uma, from the stones up.
 *
 * The length runs along Z: the front veranda at −Z facing the river, the
 * closed room with its hearths in the middle, the back veranda at +Z. The
 * building is symmetric across its length and deliberately not along it,
 * because front and back are public and private — which is a grading by what
 * is done there rather than by who does it.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, serambiInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Keluarga, Layout, MentawaiKinds, Part, Rules } from './types'

const builders = partBuilders<MentawaiKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const halfX = DIMS.width.value / 2
  const front = DIMS.frontDepth.value
  const room = DIMS.shareLength.value * rules.keluarga
  const back = serambiInfo(rules.serambi).count === 2 ? DIMS.backDepth.value : 0
  const length = front + room + back
  const halfZ = length / 2
  const z0 = -halfZ

  const floorY = DIMS.floorHeight.value + DIMS.padHeight.value
  const wallTop = floorY + DIMS.wallHeight.value
  const ridgeY = wallTop + DIMS.roofRise.value

  /*
   * One share to each household, all of them the same length, ranged down the
   * closed room. Which end a household is at says nothing, because there is no
   * end that means anything.
   */
  const households: Keluarga[] = []
  for (let i = 0; i < rules.keluarga; i++) {
    households.push({
      index: i,
      z: z0 + front + DIMS.shareLength.value * (i + 0.5),
      share: DIMS.shareLength.value,
    })
  }

  return {
    rules,
    halfX,
    front: { from: z0, to: z0 + front },
    room: { from: z0 + front, to: z0 + front + room },
    back: { present: back > 0, from: z0 + front + room, to: halfZ },
    halfZ,
    floorY,
    wallTop,
    ridgeY,
    households,
    span: { clear: DIMS.bearerSpacing.value, plank: DIMS.plankSpan.value },
    jaraik: {
      present: rules.jaraik,
      z: z0 + front * 0.35,
      height: DIMS.jaraikHeight.value,
    },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const FRAME_DIMS: readonly DimKey[] = ['postSection', 'floorHeight', 'padHeight', 'width']

export function buildUma(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const pad = DIMS.padHeight.value
  const engage = DIMS.jointEngagement.value
  const bearer = DIMS.bearerDepth.value
  const socket = DIMS.padSocket.value
  const plank = DIMS.plankThickness.value
  const deckY = layout.floorY

  /* Stones, then posts on them: nothing is buried on an island that shakes. */
  const lines: number[] = []
  const bays = Math.max(2, Math.round((layout.halfZ * 2) / DIMS.bearerSpacing.value))
  for (let i = 0; i <= bays; i++) {
    lines.push(-layout.halfZ + ((layout.halfZ * 2) / bays) * i)
  }
  let n = 0
  for (const z of lines) {
    for (const sx of [-1, 1] as const) {
      const id = `batu-${n}`
      const x = sx * (layout.halfX - post)
      parts.push(
        box(
          id,
          { name: 'batu', nameId: 'Batu tiang', nameEn: 'Pad stone' },
          'batu',
          n,
          'batu',
          ['padHeight', 'postSection', 'padSocket'],
          [x, pad / 2, z],
          [post * 1.5, pad, post * 1.5],
        ),
      )
      const tiang = `tiang-${n}`
      parts.push(
        box(
          tiang,
          { name: 'tiang', nameId: 'Tiang ulin', nameEn: 'Ironwood post' },
          'tiang',
          n,
          'ulin',
          FRAME_DIMS,
          // The foot sits down into a hollow in the stone, so the two members
          // overlap and the peg has something to pass through.
          [x, (pad - socket + deckY) / 2, z],
          [post, deckY - pad + socket, post],
        ),
      )
      joints.push({
        id: `pasak-${n}`,
        kind: 'pasak',
        mortise: id,
        tenon: tiang,
        at: [x, pad - socket / 2, z],
        halfExtents: [(post * engage) / 2, (socket * engage) / 2, (post * engage) / 2],
      })
      n++
    }
  }

  /*
   * The bearers and the planks over them.
   *
   * The spacing is the clear span of a plank, and the plank has to spring: the
   * front veranda is where turuk is danced. It is the only number in this pack
   * that comes from what people do on the floor rather than from the building.
   */
  lines.forEach((z, i) => {
    parts.push(
      box(
        `gelagar-${i}`,
        { name: 'gelagar', nameId: `Gelagar ${i + 1}`, nameEn: `Bearer ${i + 1}` },
        'lantai',
        i,
        'ulin',
        ['bearerDepth', 'bearerSpacing', 'plankSpan', 'theFloorIsDancedOn'],
        [0, deckY - bearer / 2, z],
        [layout.halfX * 2, bearer, post],
      ),
    )
  })
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai papan', nameEn: 'Plank floor' },
      'lantai',
      100,
      'papan',
      ['plankThickness', 'plankSpan', 'shareLength', 'theFloorIsDancedOn', 'gradedByActivity'],
      [0, deckY + plank / 2, 0],
      [layout.halfX * 2, plank, layout.halfZ * 2],
    ),
  )

  /*
   * Walls around the closed room only. The verandas have none at all — that is
   * what "open at the front" means here, and it is checkable where the absence
   * of a chief is not.
   */
  const wallH = DIMS.wallHeight.value
  const wallT = DIMS.wallThickness.value
  const wallY = deckY + plank + wallH / 2
  const roomMid = (layout.room.from + layout.room.to) / 2
  const roomLen = layout.room.to - layout.room.from
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding ruang dalam', nameEn: 'Wall of the closed room' },
        'dinding',
        sx > 0 ? 0 : 1,
        'papan',
        ['wallHeight', 'wallThickness', 'shareLength'],
        [sx * (layout.halfX - wallT / 2), wallY, roomMid],
        [wallT, wallH, roomLen],
      ),
    )
  }
  for (const [key, z, order] of [
    ['depan', layout.room.from + wallT / 2, 2],
    ['belakang', layout.room.to - wallT / 2, 3],
  ] as const) {
    parts.push(
      box(
        `sekat-${key}`,
        { name: 'sekat', nameId: `Sekat ${key}`, nameEn: `${key === 'depan' ? 'Front' : 'Back'} partition` },
        'dinding',
        order,
        'papan',
        ['wallHeight', 'wallThickness', 'gradedByActivity'],
        [0, wallY, z],
        [layout.halfX * 2, wallH, wallT],
      ),
    )
  }

  /* One roof over the whole length, and it comes down low over the verandas. */
  const over = DIMS.eaveOversail.value
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap daun sagu', nameEn: 'Sago-leaf roof' },
      'atap',
      0,
      'rumbia',
      ['roofRise', 'eaveOversail', 'roofThickness', 'eaveHeight'],
      shiftMesh(
        steppedHip(
          [
            { key: 'tritis', halfX: layout.halfX + over, halfZ: layout.halfZ + over, y: layout.wallTop },
            { key: 'bubungan', halfX: 0, halfZ: layout.halfZ + over, y: layout.ridgeY },
          ],
          { uvScale: 0.45 },
        ),
        0,
        0,
        0,
      ),
    ),
  )

  /* A hearth for each household, equally spaced, and none of them larger. */
  const hearth = DIMS.hearthSide.value
  layout.households.forEach((household) => {
    parts.push(
      box(
        `perapian-${household.index}`,
        {
          name: 'perapian',
          nameId: `Perapian ${household.index + 1}`,
          nameEn: `Hearth ${household.index + 1}`,
        },
        'perapian',
        household.index,
        'batu',
        ['hearthSide', 'hearthHeight', 'shareLength', 'nobodyIsSenior'],
        [0, deckY + plank + DIMS.hearthHeight.value / 2, household.z],
        [hearth, DIMS.hearthHeight.value, hearth],
      ),
    )
  })

  /*
   * The jaraik: one board for the whole house, hanging in the open veranda.
   * The carving on a real one is the point of it and is not modelled, on the
   * policy every other pack states.
   */
  if (layout.jaraik.present) {
    parts.push(
      box(
        'jaraik',
        { name: 'jaraik', nameId: 'Jaraik', nameEn: 'The jaraik' },
        'perapian',
        900,
        'ukiran',
        ['jaraikHeight', 'jaraikWidth', 'jaraikThickness', 'jaraikOverlap', 'theRecordIsShared'],
        // Hung from the roofing rather than stood on the floor, so its head
        // reaches up into the thatch that carries it.
        [0, layout.wallTop + DIMS.jaraikOverlap.value - layout.jaraik.height / 2, layout.jaraik.z],
        [DIMS.jaraikWidth.value, layout.jaraik.height, DIMS.jaraikThickness.value],
      ),
    )
    joints.push({
      id: 'tali-jaraik',
      kind: 'tali',
      mortise: 'atap',
      tenon: 'jaraik',
      at: [0, layout.wallTop + DIMS.jaraikOverlap.value / 2, layout.jaraik.z],
      halfExtents: [
        (DIMS.jaraikWidth.value * engage) / 2,
        (DIMS.jaraikThickness.value * engage) / 2,
        (DIMS.jaraikThickness.value * engage) / 2,
      ],
    })
  }

  return { parts, joints }
}
