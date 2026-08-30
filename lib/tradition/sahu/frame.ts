/**
 * The sasadu, from the stones up.
 *
 * The hall runs along Z and stands in the open: no wall anywhere, a floor with
 * a bench around it, and a sago-leaf roof that comes down low enough that
 * every opening cut under it makes a person bow.
 *
 * The openings are emitted after the roof for a reason that is not tidiness:
 * each one's head is measured down from the eave over it, so the roof has to
 * exist before there is a height to cut to.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, pintuInfo } from './rules'
import type { DimKey } from './rules'
import type { Bukaan, Joint, Layout, Part, Rules, SahuKinds } from './types'

const builders = partBuilders<SahuKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * The openings, in descending order of head height.
 *
 * The guests' opening is the highest and each of the others steps down from
 * it. The order is the claim; the step is the unit the claim is said in.
 */
function doorsFor(rules: Rules, halfX: number, halfZ: number): readonly Bukaan[] {
  const count = pintuInfo(rules.pintu).count
  const plan: readonly {
    readonly key: string
    readonly nameId: string
    readonly nameEn: string
    readonly axis: 0 | 2
    readonly side: -1 | 1
  }[] = [
    { key: 'tamu', nameId: 'Bukaan tamu', nameEn: 'Guests’ opening', axis: 2, side: -1 },
    { key: 'laki', nameId: 'Bukaan laki-laki', nameEn: 'Men’s opening', axis: 0, side: -1 },
    { key: 'perempuan', nameId: 'Bukaan perempuan', nameEn: 'Women’s opening', axis: 0, side: 1 },
    { key: 'dapur', nameId: 'Bukaan belakang', nameEn: 'Back opening', axis: 2, side: 1 },
  ]
  const out: Bukaan[] = []
  for (let i = 0; i < count; i++) {
    const at = plan[i]
    if (!at) continue
    out.push({
      index: i,
      key: at.key,
      nameId: at.nameId,
      nameEn: at.nameEn,
      axis: at.axis,
      side: at.side,
      width: DIMS.doorWidth.value,
      // Each one steps down from the one before it: the difference between
      // people, said in centimetres over their heads.
      head: DIMS.headHigh.value - DIMS.headStep.value * i,
    })
  }
  return out
}

export function resolveLayout(rules: Rules): Layout {
  const halfX = DIMS.width.value / 2
  const halfZ = (DIMS.bayLength.value * rules.bentang) / 2
  const floorY = DIMS.floorHeight.value + DIMS.padHeight.value
  const eaveY = floorY + DIMS.eaveHeight.value
  const ridgeY = eaveY + DIMS.roofRise.value

  return {
    rules,
    halfX,
    halfZ,
    floorY,
    eaveY,
    ridgeY,
    doors: doorsFor(rules, halfX, halfZ),
    body: { standing: DIMS.standingHeight.value, stooping: DIMS.stoopingHeight.value },
    bench: { y: floorY + DIMS.benchHeight.value, depth: DIMS.benchDepth.value },
    kain: rules.kain,
    dims: [],
  }
}

/** How many people the hall seats, which is where its length comes from. */
export function seats(layout: Layout): number {
  return layout.rules.bentang * DIMS.seatsPerBay.value
}

/* ── The build ────────────────────────────────────────────────────────── */

const FRAME_DIMS: readonly DimKey[] = ['postSection', 'floorHeight', 'padHeight', 'width']

export function buildSasadu(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const pad = DIMS.padHeight.value
  const socket = DIMS.padSocket.value
  const engage = DIMS.jointEngagement.value
  const bearer = DIMS.bearerDepth.value
  const deck = DIMS.deckThickness.value
  const deckY = layout.floorY

  /* Stones and posts, standing in the open. */
  const lines: number[] = []
  for (let i = 0; i <= layout.rules.bentang; i++) {
    lines.push(-layout.halfZ + DIMS.bayLength.value * i)
  }
  let n = 0
  for (const z of lines) {
    for (const sx of [-1, 1] as const) {
      const x = sx * (layout.halfX - post)
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
          [...FRAME_DIMS, 'eaveHeight'],
          [x, (pad - socket + layout.eaveY) / 2, z],
          [post, layout.eaveY - pad + socket, post],
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

  /* The floor, and the bench that runs round it. */
  lines.forEach((z, i) => {
    parts.push(
      box(
        `gelagar-${i}`,
        { name: 'gelagar', nameId: `Gelagar ${i + 1}`, nameEn: `Bearer ${i + 1}` },
        'lantai',
        i,
        'kayu',
        ['bearerDepth', 'width', 'bayLength'],
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
      ['deckThickness', 'bayLength', 'seatsPerBay', 'eatenInTogether'],
      [0, deckY + deck / 2, 0],
      [layout.halfX * 2, deck, layout.halfZ * 2],
    ),
  )
  const bench = DIMS.benchHeight.value
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `bangku-${sx > 0 ? 'a' : 'b'}`,
        { name: 'bangku', nameId: 'Bangku', nameEn: 'Bench' },
        'lantai',
        200 + (sx > 0 ? 0 : 1),
        'papan',
        ['benchHeight', 'benchDepth', 'seatsPerBay', 'eatenInTogether'],
        [sx * (layout.halfX - DIMS.benchDepth.value / 2), deckY + deck + bench / 2, 0],
        [DIMS.benchDepth.value, bench, layout.halfZ * 2],
      ),
    )
  }

  /*
   * The roof, low over everything. It is the only wall this building has, and
   * it is what every opening's height is measured down from.
   */
  const over = DIMS.eaveOversail.value
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap daun sagu', nameEn: 'Sago-leaf roof' },
      'atap',
      0,
      'rumbia',
      ['roofRise', 'eaveOversail', 'roofThickness', 'eaveHeight', 'nobodyIsShutOut'],
      shiftMesh(
        steppedHip(
          [
            { key: 'tritis', halfX: layout.halfX + over, halfZ: layout.halfZ + over, y: layout.eaveY },
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

  /*
   * The openings. Each is a pair of jambs and a head cut to its own height —
   * and there is no leaf on any of them, because what this building has is a
   * difference in height rather than a lock.
   */
  const jamb = DIMS.jambSection.value
  layout.doors.forEach((door) => {
    const along = door.axis === 0 ? layout.halfX : layout.halfZ
    const across = door.axis === 0 ? layout.halfZ : layout.halfX
    void across
    for (const s of [-1, 1] as const) {
      const off = (s * door.width) / 2
      const centre: [number, number, number] =
        door.axis === 0
          ? [door.side * (along - jamb / 2), deckY + deck + door.head / 2, off]
          : [off, deckY + deck + door.head / 2, door.side * (along - jamb / 2)]
      const size: [number, number, number] =
        door.axis === 0 ? [jamb, door.head, jamb] : [jamb, door.head, jamb]
      parts.push(
        box(
          `kusen-${door.key}-${s > 0 ? 'a' : 'b'}`,
          { name: 'kusen', nameId: door.nameId, nameEn: door.nameEn },
          'pintu',
          door.index * 10 + (s > 0 ? 0 : 1),
          'kayu',
          ['doorWidth', 'jambSection', 'headHigh', 'headStep', 'doorsAreNotAlike'],
          centre,
          size,
        ),
      )
    }
    const headCentre: [number, number, number] =
      door.axis === 0
        ? [door.side * (along - jamb / 2), deckY + deck + door.head + jamb / 2, 0]
        : [0, deckY + deck + door.head + jamb / 2, door.side * (along - jamb / 2)]
    const headSize: [number, number, number] =
      door.axis === 0 ? [jamb, jamb, door.width + jamb * 2] : [door.width + jamb * 2, jamb, jamb]
    parts.push(
      box(
        `ambang-${door.key}`,
        { name: 'ambang', nameId: `${door.nameId} — ambang`, nameEn: `${door.nameEn} — head` },
        'pintu',
        door.index * 10 + 2,
        'kayu',
        ['headHigh', 'headStep', 'jambSection', 'doorsAreNotAlike', 'everybodyBows'],
        headCentre,
        headSize,
      ),
    )
  })

  /*
   * The cloths, tied at the guests' opening.
   *
   * They go on the jambs rather than on a post out in the frame, which is not
   * a decorative choice: a cloth lashed to something four stages older is a
   * joint between two things that were never on site together, and the
   * build-order and joint-stage checks say so.
   */
  const guest = layout.doors[0]
  if (layout.kain && guest) {
    const along = guest.axis === 0 ? layout.halfX : layout.halfZ
    const drop = DIMS.kainDrop.value
    for (const s of [-1, 1] as const) {
      const off = (s * guest.width) / 2
      const centre: [number, number, number] =
        guest.axis === 0
          ? [guest.side * (along - jamb / 2), deckY + deck + guest.head - drop / 2, off]
          : [off, deckY + deck + guest.head - drop / 2, guest.side * (along - jamb / 2)]
      parts.push(
        box(
          `kain-${s > 0 ? 'a' : 'b'}`,
          { name: 'kain', nameId: 'Kain merah putih', nameEn: 'Red and white cloth' },
          'kain',
          s > 0 ? 0 : 1,
          'kain',
          ['kainWidth', 'kainDrop', 'jambSection'],
          centre,
          [DIMS.kainWidth.value, drop, DIMS.kainWidth.value],
        ),
      )
    }
    const anchor: [number, number, number] =
      guest.axis === 0
        ? [guest.side * (along - jamb / 2), deckY + deck + guest.head - drop / 2, -guest.width / 2]
        : [-guest.width / 2, deckY + deck + guest.head - drop / 2, guest.side * (along - jamb / 2)]
    joints.push({
      id: 'tali-kain',
      kind: 'tali',
      mortise: `kusen-${guest.key}-b`,
      tenon: 'kain-b',
      at: anchor,
      halfExtents: [
        (jamb * engage) / 2,
        (drop * engage) / 4,
        (jamb * engage) / 2,
      ],
    })
  }

  return { parts, joints }
}
