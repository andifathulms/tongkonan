/**
 * The malige, from the stones up — and outward.
 *
 * Every storey is framed on the one below and then projects past it, so this
 * builder walks up a stack whose plan grows at each step. The brackets are
 * emitted before the floor they carry, which is not a nicety: a cantilever
 * built before what holds it is a cantilever hanging off nothing, and the
 * build-order check has caught that in five other packs.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse.
 * The ridge runs along X, so the building is long front to back and mirror
 * symmetric about z = 0.
 */

import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, paleInfo } from './rules'
import type { DimKey } from './rules'
import type { ButonKinds, Joint, Layout, Part, Rules, Tingkat } from './types'

const builders = partBuilders<ButonKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = paleInfo(rules.pale)
  /*
   * No brackets, no projection. That is the rule doing structural work rather
   * than decorating: a house entitled to no pale stands plumb, which is a
   * different building rather than a smaller one.
   */
  const oversail = info.count === 0 ? 0 : DIMS.oversail.value
  const padY = DIMS.padHeight.value
  const height = DIMS.storeyHeight.value

  const storeys: Tingkat[] = []
  let halfX = DIMS.baseWidth.value / 2
  let halfZ = DIMS.baseLength.value / 2
  for (let i = 0; i < rules.tingkat; i++) {
    if (i > 0) {
      halfX += oversail
      halfZ += oversail
    }
    storeys.push({
      index: i,
      y: padY + height * i,
      halfX,
      halfZ,
      oversail: i === 0 ? 0 : oversail,
      height,
    })
  }

  const top = storeys[storeys.length - 1]
  const wallTop = (top?.y ?? padY) + height
  const ridgeY = wallTop + DIMS.roofRise.value

  return {
    rules,
    storeys,
    brackets: info.count,
    reach: DIMS.paleReach.value,
    padY,
    wallTop,
    ridgeY,
    anjungan: {
      present: rules.anjungan,
      halfX: (top?.halfX ?? 0) * DIMS.anjunganShare.value,
      halfZ: (top?.halfZ ?? 0) * DIMS.anjunganShare.value,
      y: wallTop,
    },
    benteng: DIMS.bentengRadius.value,
    dims: [],
  }
}

/** The hipped roof over the topmost — and widest — floor. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const top = layout.storeys[layout.storeys.length - 1]
  const over = DIMS.eaveOversail.value
  const halfX = (top?.halfX ?? 0) + over
  const halfZ = (top?.halfZ ?? 0) + over
  return [
    { key: 'tritis', halfX, halfZ, y: layout.wallTop },
    { key: 'bubungan', halfX: 0, halfZ: halfZ * DIMS.ridgeShare.value, y: layout.ridgeY },
  ]
}

/* ── The build ────────────────────────────────────────────────────────── */

const FRAME_DIMS: readonly DimKey[] = ['postSection', 'storeyHeight', 'baseWidth', 'baseLength']

export function buildMalige(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const post = DIMS.postSection.value
  const padY = DIMS.padHeight.value
  const engage = DIMS.jointEngagement.value
  const beam = DIMS.floorDepth.value
  const deck = DIMS.deckThickness.value
  const wallT = DIMS.wallThickness.value
  const inset = DIMS.wallInset.value
  const socket = DIMS.padSocket.value
  const base = layout.storeys[0]
  if (!base) return { parts, joints }

  /* The stones. Nothing is dug: the frame stands on them and stays by weight. */
  /*
   * A bay line for every arm.
   *
   * The pale spring from the posts, so a household entitled to four arms has
   * four post lines down each side to spring them from — the frame and the
   * rank rule are the same decision, which is what makes the arms structural
   * rather than applied. A house entitled to none still needs a frame, so it
   * gets three. The reading is the author's; the sources give the arm count.
   */
  const lines = Math.max(3, layout.brackets)
  const columns: [number, number][] = []
  const lineZ: number[] = []
  for (let k = 0; k < lines; k++) {
    const t = lines === 1 ? 0.5 : k / (lines - 1)
    lineZ.push(-(base.halfZ - post) + (base.halfZ - post) * 2 * t)
  }
  for (const sx of [-1, 1] as const) {
    for (const z of lineZ) columns.push([sx * (base.halfX - post), z])
  }
  columns.forEach(([x, z], i) => {
    parts.push(
      box(
        `batu-${i}`,
        { name: 'batu', nameId: `Batu ${i + 1}`, nameEn: `Pad stone ${i + 1}` },
        'batu',
        i,
        'batu',
        ['padHeight', 'padSpread', 'padSocket', 'postSection', 'noIron'],
        [x, padY / 2, z],
        [post * DIMS.padSpread.value, padY, post * DIMS.padSpread.value],
      ),
    )
  })

  /* The posts of the lowest storey, which is the narrowest one. */
  const postTop = padY + DIMS.storeyHeight.value * layout.storeys.length
  columns.forEach(([x, z], i) => {
    const id = `tiang-${i}`
    parts.push(
      box(
        id,
        { name: 'tiang', nameId: `Tiang ${i + 1}`, nameEn: `Post ${i + 1}` },
        'tiang',
        i,
        'kayu',
        FRAME_DIMS,
        [x, (padY - socket + postTop) / 2, z],
        [post, postTop - padY + socket, post],
      ),
    )
    joints.push({
      id: `pasak-tiang-${i}`,
      kind: 'pasak',
      mortise: `batu-${i}`,
      tenon: id,
      // The foot sits down into a hollow in the stone, so the two members
      // overlap and the peg has something to pass through.
      at: [x, padY - socket / 2, z],
      halfExtents: [(post * engage) / 2, (socket * engage) / 2, (post * engage) / 2],
    })
  })

  /*
   * The brackets and the floors, storey by storey, and the brackets first.
   *
   * A pale leans out of a post below and reaches under the edge of the floor
   * above, so its reach has to be at least the projection it is carrying. The
   * two numbers are independent — the reach is a carpenter's and the
   * projection follows from rank — and that is what the check is about.
   */
  const paleDims: readonly DimKey[] = ['paleReach', 'paleSection', 'paleSpacing', 'paleCarryTheOverhang', 'oversail']
  layout.storeys.forEach((storey, i) => {
    if (i > 0 && layout.brackets > 0) {
      /*
       * The arms spring from the frame of posts, which runs the whole height,
       * and each storey's floor is further out than the last — so the topmost
       * arm is always the longest one, and this building's limit is set at its
       * top rather than at its base.
       */
      const from = base.halfX - post / 2
      const span = storey.halfX - from
      let n = 0
      for (const sx of [-1, 1] as const) {
        for (const z of lineZ) {
          const id = `pale-${i}-${n++}`
          parts.push(
            box(
              id,
              { name: 'pale', nameId: `Pale tingkat ${i + 1}`, nameEn: `Bracket, storey ${i + 1}` },
              'pale',
              i * 20 + n,
              'kayu',
              paleDims,
              // Half housed into the floor beam it carries and half proud of
              // it, so the arm is both engaged and visible. Sitting it flush
              // under the beam leaves the two touching on one plane, which is
              // a joint holding nothing — the fault this project keeps making.
              [sx * (from + span / 2), storey.y - beam, z],
              [span, DIMS.paleSection.value, DIMS.paleSection.value],
            ),
          )
        }
      }
    }

    /* The floor: beams across, then the boards. */
    const id = `lantai-${i}`
    parts.push(
      box(
        id,
        {
          name: 'lantai',
          nameId: i === 0 ? 'Lantai bawah' : `Lantai tingkat ${i + 1}`,
          nameEn: i === 0 ? 'Ground floor' : `Floor, storey ${i + 1}`,
        },
        'lantai',
        i * 10,
        'kayu',
        ['floorDepth', 'oversail', 'widensUpward'],
        [0, storey.y - beam / 2, 0],
        [storey.halfX * 2, beam, storey.halfZ * 2],
      ),
    )
    parts.push(
      box(
        `papan-${i}`,
        { name: 'papan', nameId: `Papan lantai ${i + 1}`, nameEn: `Floor boards ${i + 1}` },
        'lantai',
        i * 10 + 1,
        'papan',
        ['deckThickness', 'oversail'],
        [0, storey.y + deck / 2, 0],
        [storey.halfX * 2, deck, storey.halfZ * 2],
      ),
    )
    if (i > 0 && layout.brackets > 0) {
      /*
       * The wedge that ties a floor down onto the arm carrying it. Between two
       * consecutive stages, because a joint that skips one is a joint between
       * two things that were never on site together.
       */
      joints.push({
        id: `baji-lantai-${i}`,
        kind: 'baji',
        mortise: `pale-${i}-0`,
        tenon: id,
        at: [
          -(storey.halfX - DIMS.paleSection.value),
          storey.y - beam + (DIMS.paleSection.value * engage) / 4,
          lineZ[0] ?? 0,
        ],
        halfExtents: [
          (DIMS.paleSection.value * engage) / 2,
          (DIMS.paleSection.value * engage) / 4,
          (DIMS.paleSection.value * engage) / 2,
        ],
      })
    }

    /* Boards between the posts, set in from the edge so the line shows. */
    const wallY = storey.y + storey.height / 2
    for (const sx of [-1, 1] as const) {
      parts.push(
        box(
          `dinding-x${i}${sx > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding papan', nameEn: 'Board wall' },
          'dinding',
          i * 10 + (sx > 0 ? 0 : 1),
          'papan',
          ['wallThickness', 'wallInset', 'storeyHeight'],
          [sx * (storey.halfX - inset), wallY, 0],
          [wallT, storey.height - deck, (storey.halfZ - inset) * 2],
        ),
      )
    }
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `dinding-z${i}${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
          'dinding',
          i * 10 + (sz > 0 ? 2 : 3),
          'papan',
          ['wallThickness', 'wallInset', 'storeyHeight'],
          [0, wallY, sz * (storey.halfZ - inset)],
          [(storey.halfX - inset) * 2, storey.height - deck, wallT],
        ),
      )
    }
  })

  /* The projecting room at the top, and then the roof over everything. */
  const top = layout.storeys[layout.storeys.length - 1]
  if (layout.anjungan.present && top) {
    /*
     * The projecting room, on the front of the topmost — and widest — storey:
     * the one part that reaches out past a building that is already reaching
     * out at every level.
     */
    parts.push(
      box(
        'anjungan',
        { name: 'anjungan', nameId: 'Anjungan', nameEn: 'The projecting room' },
        'dinding',
        900,
        'papan',
        ['anjunganShare', 'anjunganHeight', 'wallThickness'],
        [
          top.halfX + (layout.anjungan.halfX - inset) / 2,
          top.y + DIMS.anjunganHeight.value / 2 + deck,
          0,
        ],
        [layout.anjungan.halfX - inset, DIMS.anjunganHeight.value, layout.anjungan.halfZ * 2],
      ),
    )
  }

  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap sirap', nameEn: 'Shingle roof' },
      'atap',
      0,
      'sirap',
      ['roofRise', 'ridgeShare', 'eaveOversail', 'roofThickness'],
      shiftMesh(steppedHip(roofLevels(layout), { uvScale: 0.4 }), 0, 0, 0),
    ),
  )

  return { parts, joints }
}
