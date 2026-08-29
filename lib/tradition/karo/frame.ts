/**
 * The siwaluh jabu, from the stones to the hearths.
 *
 * The building is one room and this file has to keep it that way: every post
 * stands on the perimeter or on a cross line of the frame, every wall is on
 * the perimeter, and nothing at all is emitted between the households. What
 * marks a household's place is where its hearth is and which end of the timber
 * it is nearer, and neither of those is a member.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse. The
 * base end of the great beams — bena kayu, the root end of the tree, and the
 * senior household's end — is at −X.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, pintuInfo } from './rules'
import type { DimKey } from './rules'
import type { Dapur, Jabu, Joint, KaroKinds, Layout, Part, Rules } from './types'

const builders = partBuilders<KaroKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const pairs = rules.jabu / 2
  const bay = DIMS.bayLength.value
  const halfZ = DIMS.halfWidth.value
  const length = bay * pairs
  const floorY = DIMS.floorHeight.value + DIMS.stoneHeight.value
  const plateY = floorY + DIMS.wallHeight.value
  const benaX = -length / 2

  /*
   * The hearths first, because the places are read from them.
   *
   * One hearth to a bay, on the centre line, shared by the two households in
   * that bay — one on each side of it. A household's place is where it sits
   * relative to a fire and to the root end of the timber, and that is the
   * whole of what marks it.
   */
  const hearths: Dapur[] = []
  for (let i = 0; i < pairs; i++) {
    hearths.push({
      index: i,
      x: benaX + bay * (i + 0.5),
      z: 0,
      radius: DIMS.hearthRadius.value,
    })
  }

  /*
   * The places, ranked from the base end.
   *
   * Rank counts along the length first and then across, so the two households
   * sharing the hearth nearest the root end are the two most senior — which is
   * the arrangement the sources describe and the reason the beams' direction
   * matters at all.
   */
  const jabu: Jabu[] = []
  hearths.forEach((hearth, i) => {
    for (const sz of [-1, 1] as const) {
      const index = jabu.length
      const end = i === 0 ? 'bena' : i === pairs - 1 ? 'ujung' : `tengah-${i}`
      jabu.push({
        index,
        key: `${end}-${sz > 0 ? 'a' : 'b'}`,
        nameId:
          i === 0
            ? 'Jabu bena kayu'
            : i === pairs - 1
              ? 'Jabu ujung kayu'
              : `Jabu tengah ${i}`,
        nameEn:
          i === 0
            ? 'Jabu bena kayu — the base-of-the-tree place'
            : i === pairs - 1
              ? 'Jabu ujung kayu — the tip place'
              : `A middle place, ${i} bays from the root end`,
        x: hearth.x,
        z: sz * (halfZ / 2),
        rank: i * 2 + (sz > 0 ? 1 : 0),
        hearth: i,
      })
    }
  })

  const info = pintuInfo(rules.pintu)
  const doors = info.count === 2 ? [{ x: benaX }, { x: length / 2 }] : [{ x: benaX }]

  return {
    rules,
    jabu,
    hearths,
    length,
    halfZ,
    floorY,
    postSection: DIMS.postSection.value,
    stoneHeight: DIMS.stoneHeight.value,
    plateY,
    ridgeY: plateY + DIMS.ridgeRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    benaX,
    doors,
    tersek: {
      present: rules.tersek,
      rise: DIMS.tersekRise.value,
      halfX: DIMS.tersekReach.value / 2,
    },
    hearthClearance: DIMS.hearthClearance.value,
    ijukCourses: Math.max(
      3,
      Math.round(
        Math.hypot(halfZ + DIMS.eaveOversail.value, DIMS.ridgeRise.value) /
          DIMS.ijukCourseDepth.value,
      ),
    ),
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'wallHeight',
  'bayLength',
  'halfWidth',
  'manyHouseholdsOneRoom',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const beamD = DIMS.beamDepth.value
  const beamW = DIMS.beamWidth.value
  const board = DIMS.floorThickness.value
  const lines = [
    ...layout.hearths.map((h) => h.x - DIMS.bayLength.value / 2),
    layout.length / 2,
  ]

  /* Stones and posts, on the perimeter lines only. */
  lines.forEach((x, i) => {
    for (const sz of [-1, 1] as const) {
      const z = sz * (layout.halfZ - sec / 2)
      parts.push(
        box(
          `batu-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
          'batu',
          i * 2 + (sz > 0 ? 1 : 0),
          'batu',
          ['stoneHeight', 'stoneWidth'],
          [x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
        box(
          `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'tiang', nameId: 'Tiang', nameEn: 'Post' },
          'tiang',
          i * 2 + (sz > 0 ? 1 : 0),
          'kayu',
          POST_DIMS,
          [x, layout.stoneHeight + (layout.floorY - layout.stoneHeight) / 2, z],
          [sec, layout.floorY - layout.stoneHeight, sec],
        ),
      )
    }
  })

  /*
   * The two great beams, laid root end first.
   *
   * They run the whole length on the two lines of posts, and they are the
   * members that carry the order: the end their root is at is the end the
   * senior household stands at. Nothing about the geometry marks which end
   * that is — the timber does — so the model states it in the layout and the
   * check reads it there.
   */
  for (const sz of [-1, 1] as const) {
    const z = sz * (layout.halfZ - sec / 2)
    const id = `balok-${sz > 0 ? 'a' : 'b'}`
    parts.push(
      box(
        id,
        { name: 'balok', nameId: 'Balok bena kayu', nameEn: 'Great beam, root end first' },
        'rangka',
        sz > 0 ? 1 : 0,
        'kayu',
        ['beamDepth', 'beamWidth', 'bayLength', 'orderedByTheTree'],
        [0, layout.floorY - beamD / 2, z],
        [layout.length, beamD, beamW],
      ),
    )
    lines.forEach((x, i) => {
      // Inboard of the beam's own ends: a joint box hung off the end of the
      // member it is in engages nothing, which is the correction this project
      // has now made in seven packs.
      const lo = Math.max(x - sec / 4, -layout.length / 2)
      const hi = Math.min(x + sec / 4, layout.length / 2)
      joints.push({
        id: `takik-${i}-${sz > 0 ? 'a' : 'b'}`,
        kind: 'takik',
        mortise: `tiang-${i}-${sz > 0 ? 'a' : 'b'}`,
        tenon: id,
        at: [(lo + hi) / 2, layout.floorY - beamD / 2, z],
        halfExtents: [(hi - lo) / 2, (beamD * engage) / 2, beamW / 2],
      })
    })
  }

  /* Cross bearers, one to a bay line, under the floor. */
  lines.forEach((x, i) => {
    parts.push(
      box(
        `gelagar-${i}`,
        { name: 'gelagar', nameId: 'Gelagar', nameEn: 'Cross bearer' },
        'rangka',
        10 + i,
        'kayu',
        ['beamWidth', 'halfWidth', 'floorHeight'],
        [x, layout.floorY - beamW / 2, 0],
        [beamW, beamW, layout.halfZ * 2],
      ),
    )
  })

  /*
   * The floor: one plane, and one piece per bay so the bays are legible.
   *
   * Legible is all they are. Nothing stands on these lines, and the check that
   * matters here is the one that says so.
   */
  layout.hearths.forEach((hearth, i) => {
    parts.push(
      box(
        `lantai-${i}`,
        { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
        'lantai',
        i,
        'papan',
        ['floorThickness', 'bayLength', 'halfWidth', 'manyHouseholdsOneRoom'],
        [hearth.x, layout.floorY + board / 2, 0],
        [DIMS.bayLength.value, board, layout.halfZ * 2],
      ),
    )
  })

  /* Walls: leaning out, on the perimeter, with a doorway at the ends. */
  const wallT = DIMS.wallThickness.value
  const lean = DIMS.wallLean.value
  const height = layout.plateY - (layout.floorY + board)
  const tilt = Math.atan2(lean, height)
  const run = Math.hypot(lean, height)
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        sz > 0 ? 1 : 0,
        'papan',
        ['wallThickness', 'wallHeight', 'wallLean', 'halfWidth', 'wallsLeanOut'],
        [
          0,
          layout.floorY + board + height / 2,
          sz * (layout.halfZ - wallT / 2 + lean / 2),
        ],
        [layout.length, run, wallT],
        [sz * tilt, 0, 0],
      ),
    )
  }
  /* The ends, with the doorways left out of them. */
  const doorW = DIMS.doorWidth.value
  const doorH = DIMS.doorHeight.value
  for (const sx of [-1, 1] as const) {
    const x = sx * (layout.length / 2 - wallT / 2)
    const hasDoor = layout.doors.some((d) => Math.sign(d.x) === sx || (sx < 0 && d.x <= 0))
    if (hasDoor) {
      for (const sz of [-1, 1] as const) {
        const inner = doorW / 2
        const outer = layout.halfZ
        parts.push(
          box(
            `ujung-${sx > 0 ? 'a' : 'b'}-${sz > 0 ? 'a' : 'b'}`,
            { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
            'dinding',
            10 + (sx > 0 ? 2 : 0) + (sz > 0 ? 1 : 0),
            'papan',
            ['wallThickness', 'wallHeight', 'doorWidth', 'halfWidth'],
            [x, layout.floorY + board + height / 2, (sz * (inner + outer)) / 2],
            [wallT, height, outer - inner],
          ),
        )
      }
      parts.push(
        box(
          `ambang-${sx > 0 ? 'a' : 'b'}`,
          { name: 'ambang', nameId: 'Ambang pintu', nameEn: 'Door head' },
          'dinding',
          20 + (sx > 0 ? 1 : 0),
          'papan',
          ['wallThickness', 'doorWidth', 'doorHeight'],
          [
            x,
            layout.floorY + board + doorH + (height - doorH) / 2,
            0,
          ],
          [wallT, height - doorH, doorW],
        ),
      )
    } else {
      parts.push(
        box(
          `ujung-${sx > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
          'dinding',
          10 + (sx > 0 ? 1 : 0),
          'papan',
          ['wallThickness', 'wallHeight', 'halfWidth'],
          [x, layout.floorY + board + height / 2, 0],
          [wallT, height, layout.halfZ * 2 - wallT * 2],
        ),
      )
    }
  }

  /* The hearths, one to a bay, on the centre line and clear of everything. */
  layout.hearths.forEach((hearth, i) => {
    parts.push(
      box(
        `dapur-${i}`,
        {
          name: 'dapur',
          nameId: `Dapur ${i + 1}`,
          nameEn: `Hearth ${i + 1}, shared by two households`,
        },
        'dapur',
        i,
        'batu',
        ['hearthRadius', 'hearthDepth', 'hearthClearance', 'sharedHearths'],
        [hearth.x, layout.floorY + board + DIMS.hearthDepth.value / 2, hearth.z],
        [hearth.radius * 2, DIMS.hearthDepth.value, hearth.radius * 2],
      ),
    )
  })

  return { parts, joints }
}
