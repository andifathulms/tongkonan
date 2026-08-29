/**
 * The rumoh Aceh, from the footings to the ladder.
 *
 * The axes matter more here than in any other pack, so they are stated first.
 * X runs front to rear as everywhere else — north to south — and the three
 * parts of the house are laid across it: the front veranda, the raised middle,
 * the back veranda. Z is the length, and it runs **east–west**, because that is
 * the direction prayer is made in. The ridge lies along it.
 *
 * That is the one rule this house has that came from outside the archipelago,
 * and in the geometry it is simply which axis is long. The check reads it off
 * the scene model rather than off a comment.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { AcehKinds, Joint, Layout, Part, Ruang, Rules } from './types'

const builders = partBuilders<AcehKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const bay = DIMS.bayLength.value
  const length = bay * rules.ruang
  const floorY = DIMS.floorHeight.value
  const raise = DIMS.raise.value

  /*
   * The three parts, across the width, front to back.
   *
   * The middle is raised, and the sequence is not a staircase of standing: the
   * rumah limas seats a guest on the step that says who they are, and this
   * house says instead how far in they may come. The front veranda is where a
   * visitor stops; the raised room is where a family sleeps and where children
   * are born; the back is the women's.
   */
  const keue = DIMS.keueDepth.value
  const tungai = DIMS.tungaiDepth.value
  const likot = rules.seuramoeLikot ? DIMS.likotDepth.value : 0
  const width = keue + tungai + likot
  let x = -width / 2
  const rooms: Ruang[] = []
  const push = (key: Ruang['key'], nameId: string, nameEn: string, depth: number, up: boolean) => {
    if (depth <= 0) return
    rooms.push({ key, nameId, nameEn, x: x + depth / 2, halfX: depth / 2, floorY: floorY + (up ? raise : 0) })
    x += depth
  }
  push('keue', 'Seuramoë keuë', 'The front veranda', keue, false)
  push('tungai', 'Tungai', 'The raised middle room', tungai, true)
  push('likot', 'Seuramoë likôt', 'The back veranda', likot, false)

  const rise = DIMS.treadRise.value
  const steps = Math.max(1, Math.round((floorY + DIMS.floorThickness.value) / rise))
  /*
   * The plate sits on the head of the veranda walls, not above them.
   *
   * Measured from the raised floor at first, which left the eave plate a third
   * of a metre clear of every wall in the house and carried by nothing — the
   * build-order check said so at once. The middle room is taller inside
   * because its floor is higher, not because its walls are.
   */
  const plateY = floorY + DIMS.floorThickness.value + DIMS.wallHeight.value

  return {
    rules,
    length,
    halfZ: length / 2,
    bays: rules.ruang,
    rooms,
    floorY,
    raise,
    postSection: DIMS.postSection.value,
    plateY,
    ridgeY: plateY + DIMS.ridgeRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    /*
     * The ladder's step count is *derived* from the rise, not declared.
     *
     * That is what makes the parity rule checkable: the tradition fixes
     * whether the number is odd, the height of the floor and the rise of a
     * tread fix what the number is, and nothing guarantees the two agree. A
     * declared count would have made the check a restatement — the fault this
     * project has now caught four times.
     */
    ladder: {
      steps,
      rise,
      width: DIMS.ladderWidth.value,
      z: 0,
    },
    rumbiaCourses: Math.max(
      3,
      Math.round(
        Math.hypot(width / 2 + DIMS.eaveOversail.value, DIMS.ridgeRise.value) /
          DIMS.rumbiaCourseDepth.value,
      ),
    ),
    dims: [],
  }
}

/** How wide the house is across its three parts. */
export function houseWidth(layout: Layout): number {
  return layout.rooms.reduce((sum, r) => sum + r.halfX * 2, 0)
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'postGrid',
  'bayLength',
  'noNails',
  'ridgeRunsEastWest',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const beamD = DIMS.beamDepth.value
  const beamW = DIMS.beamWidth.value
  const board = DIMS.floorThickness.value
  const width = houseWidth(layout)

  /* The posts: a grid, standing free on their footings. */
  const xs: number[] = []
  const lines = Math.max(2, Math.round(width / DIMS.postGrid.value) + 1)
  for (let i = 0; i < lines; i++) xs.push(-width / 2 + (width / (lines - 1)) * i)
  const zs: number[] = []
  for (let i = 0; i <= layout.bays; i++) zs.push(-layout.length / 2 + DIMS.bayLength.value * i)

  xs.forEach((x, i) => {
    zs.forEach((z, k) => {
      const top = layout.floorY + (Math.abs(x) < DIMS.tungaiDepth.value / 2 ? layout.raise : 0)
      parts.push(
        box(
          `tameh-${i}-${k}`,
          { name: 'tameh', nameId: 'Tameh', nameEn: 'Post' },
          'tameh',
          i * 100 + k,
          'kayu',
          POST_DIMS,
          [x, top / 2, z],
          [sec, top, sec],
        ),
      )
    })
  })

  /*
   * The toi: beams threaded through the posts, along the length.
   *
   * They run east–west with the ridge, which is also the direction the house
   * is turned by. There is no iron in this frame — the beams pass through
   * mortises cut clean through the posts and are pegged — and that is what
   * lets it move on ground that moves.
   */
  xs.forEach((x, i) => {
    const top = layout.floorY + (Math.abs(x) < DIMS.tungaiDepth.value / 2 ? layout.raise : 0)
    const id = `toi-${i}`
    parts.push(
      box(
        id,
        { name: 'toi', nameId: 'Toi', nameEn: 'Threaded beam' },
        'toi',
        i,
        'kayu',
        ['beamDepth', 'beamWidth', 'bayLength', 'noNails'],
        [x, top - beamD / 2, 0],
        [beamW, beamD, layout.length],
      ),
    )
    zs.forEach((z, k) => {
      const lo = Math.max(z - sec / 4, -layout.length / 2)
      const hi = Math.min(z + sec / 4, layout.length / 2)
      joints.push({
        id: `toi-${i}-${k}`,
        kind: 'toi',
        mortise: `tameh-${i}-${k}`,
        tenon: id,
        at: [x, top - beamD / 2, (lo + hi) / 2],
        halfExtents: [beamW / 2, (beamD * engage) / 2, (hi - lo) / 2],
      })
    })
  })

  /* The floors: two verandas at one level and the middle room above them. */
  layout.rooms.forEach((room, i) => {
    parts.push(
      box(
        `aleue-${room.key}`,
        { name: 'aleue', nameId: `Lantai ${room.nameId}`, nameEn: `${room.nameEn} floor` },
        'aleue',
        i,
        'papan',
        ['floorThickness', 'raise', 'bayLength', 'threeParts'],
        [room.x, room.floorY + board / 2, 0],
        [room.halfX * 2, board, layout.length],
      ),
    )
  })

  /* Board walls: closed round the middle, open at the front. */
  const wallT = DIMS.wallThickness.value
  const wallH = DIMS.wallHeight.value
  const middle = layout.rooms.find((r) => r.key === 'tungai')
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `binteh-${sz > 0 ? 'a' : 'b'}`,
        { name: 'binteh', nameId: 'Binteh', nameEn: 'Wall' },
        'binteh',
        sz > 0 ? 1 : 0,
        'papan',
        ['wallThickness', 'wallHeight', 'bayLength'],
        [0, layout.floorY + board + wallH / 2, sz * (layout.length / 2 - wallT / 2)],
        [width, wallH, wallT],
      ),
    )
  }
  if (middle) {
    for (const sx of [-1, 1] as const) {
      const inner = layout.plateY - (middle.floorY + board)
      parts.push(
        box(
          `binteh-tungai-${sx > 0 ? 'a' : 'b'}`,
          { name: 'binteh', nameId: 'Binteh tungai', nameEn: 'Wall of the middle room' },
          'binteh',
          4 + (sx > 0 ? 1 : 0),
          'papan',
          ['wallThickness', 'wallHeight', 'raise', 'threeParts'],
          [
            middle.x + sx * (middle.halfX - wallT / 2),
            middle.floorY + board + inner / 2,
            0,
          ],
          [wallT, inner, layout.length],
        ),
      )
    }
  }
  parts.push(
    box(
      'binteh-belakang',
      { name: 'binteh', nameId: 'Binteh belakang', nameEn: 'Rear wall' },
      'binteh',
      10,
      'papan',
      ['wallThickness', 'wallHeight', 'bayLength'],
      [width / 2 - wallT / 2, layout.floorY + board + wallH / 2, 0],
      [wallT, wallH, layout.length - wallT * 2],
    ),
  )

  /*
   * The ladder, last, and counted.
   *
   * It comes up to the front veranda in the middle of the long side, and the
   * number of treads is what the tradition fixes. Nothing else about it is
   * remarkable, which is the point: the rule is about a count.
   */
  const rise = layout.ladder.rise
  const front = -width / 2
  const run = DIMS.treadDepth.value * layout.ladder.steps
  const flight = rise * layout.ladder.steps
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `reunyeun-tiang-${sz > 0 ? 'a' : 'b'}`,
        { name: 'reunyeun', nameId: 'Ibu tangga', nameEn: 'Ladder stringer' },
        'reunyeun',
        sz > 0 ? 1 : 0,
        'kayu',
        ['treadRise', 'ladderWidth', 'floorHeight'],
        [
          front - run / 2,
          flight / 2 + beamW / 2,
          layout.ladder.z + sz * (layout.ladder.width / 2 - beamW / 2),
        ],
        [Math.hypot(run, flight), beamW, beamW],
        [0, 0, Math.atan2(flight, run)],
      ),
    )
  }
  for (let k = 0; k < layout.ladder.steps; k++) {
    parts.push(
      box(
        `reunyeun-${k}`,
        { name: 'reunyeun', nameId: `Anak tangga ${k + 1}`, nameEn: `Tread ${k + 1}` },
        'reunyeun',
        10 + k,
        'kayu',
        ['treadRise', 'treadDepth', 'ladderWidth', 'oddSteps'],
        [
          front - DIMS.treadDepth.value * (layout.ladder.steps - k - 0.5),
          rise * (k + 1) - board / 2,
          layout.ladder.z,
        ],
        [DIMS.treadDepth.value, board, layout.ladder.width],
      ),
    )
  }
  return { parts, joints }
}
