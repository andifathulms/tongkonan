/**
 * The lepa, from the keel up.
 *
 * The datum needs stating because it is the third different one in this
 * project. On seventeen buildings y = 0 is the ground; on the kariwari it is
 * the bed of a bay; here it is **the bottom of the keel**, and the water is a
 * line partway up the hull. There is no ground in this pack at all.
 *
 * Axes as everywhere else, with one difference that is the whole point: X runs
 * along the boat and Z across it, and neither of them means north. This is the
 * only building in the collection whose axes carry no compass claim, because
 * its pack declares no orientation rule.
 */

import { partBuilders } from '@/lib/core/parts'
import { hullSide } from './hull'
import { DIMS, lengthOf } from './rules'
import type { DimKey } from './rules'
import type { BajauKinds, Joint, Layout, Part, Rules } from './types'

const builders = partBuilders<BajauKinds>()
const box = builders.box
const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const length = lengthOf(rules.ukuran)
  const halfBeam = (length * DIMS.beamRatio.value) / 2
  const keelY = DIMS.keelSection.value
  const sheerY = keelY + DIMS.depth.value

  return {
    rules,
    length,
    halfBeam,
    keelY,
    sheerY,
    draught: DIMS.draught.value,
    freeboard: sheerY - DIMS.draught.value,
    deckY: sheerY - DIMS.deckThickness.value,
    frames: Math.max(3, Math.round(DIMS.frames.value)),
    strakes: Math.max(2, Math.round(DIMS.strakes.value)),
    kajang: {
      present: rules.kajang,
      from: -length / 2 + length * DIMS.kajangFrom.value,
      to: -length / 2 + length * DIMS.kajangTo.value,
      rise: DIMS.kajangRise.value,
    },
    hearth: {
      x: -length / 2 + length * DIMS.hearthAt.value,
      side: 0,
      radius: DIMS.hearthRadius.value,
    },
    cadik: {
      present: rules.cadik,
      reach: DIMS.cadikReach.value,
      y: sheerY - DIMS.cadikSection.value,
    },
    centreLimit: DIMS.centreLimit.value,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const HULL_DIMS: readonly DimKey[] = [
  'depth',
  'beamRatio',
  'sheerRise',
  'keelRocker',
  'bilgeAt',
  'bilgeDrop',
  'plankThickness',
  'noGround',
]

export function buildHull(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const engage = DIMS.jointEngagement.value
  const keelSec = DIMS.keelSection.value

  /* The keel: the first thing laid, and this building's whole foundation. */
  parts.push(
    box(
      'lunas',
      { name: 'lunas', nameId: 'Lunas', nameEn: 'Keel' },
      'lunas',
      0,
      'kayu',
      ['keelSection', 'keelRocker', 'noGround'],
      [0, keelSec / 2, 0],
      [layout.length * 0.92, keelSec, keelSec],
    ),
  )

  /*
   * The strakes: bands of the swept surface, dowelled edge to edge.
   *
   * Each is a slice across the same parameter space the roofs use for their
   * courses of thatch — `fFrom` to `fTo`, keel to sheer — so a plank boat and
   * a thatched roof are drawn by one description with different words on it.
   */
  for (const side of [-1, 1] as const) {
    for (let k = 0; k < layout.strakes; k++) {
      const from = k / layout.strakes
      const to = (k + 1) / layout.strakes
      parts.push(
        meshPart(
          `papan-${side > 0 ? 'a' : 'b'}-${k}`,
          {
            name: 'papan',
            nameId: `Papan lambung ${k + 1}`,
            nameEn: `Strake ${k + 1}`,
          },
          'papan',
          k * 2 + (side > 0 ? 1 : 0),
          'papan',
          HULL_DIMS,
          hullSide(layout, side, { from, to }),
        ),
      )
    }
  }

  /*
   * The keelson: an inner keel laid over the garboards, and what the frames
   * are actually fastened to.
   *
   * It is here because `checkJointStages` refused a frame pegged straight to
   * the keel — two stages apart, with the whole planking of the boat fitted in
   * between — and it was right to. In a shell-first hull the frames go in
   * after the skin, so what they meet is not the keel that was laid first but
   * the timber lying on top of it.
   */
  parts.push(
    box(
      'kelson',
      { name: 'kelson', nameId: 'Kelson', nameEn: 'Keelson' },
      'papan',
      100,
      'kayu',
      ['keelSection', 'plankThickness', 'noGround'],
      [0, keelSec + DIMS.plankThickness.value, 0],
      [layout.length * 0.86, DIMS.plankThickness.value * 2, keelSec * 1.4],
    ),
  )

  /* Frames inside the shell, which is the order a boat is built in. */
  /*
   * The frames stand over the keelson, which stops well short of the stems.
   *
   * Spread over the whole length at first, which put the two end frames past
   * the end of the keelson and standing on nothing — and, because the keel
   * rockers up toward the stems, floating above the hull as well. A frame goes
   * where there is something for it to sit on.
   */
  const frameSec = DIMS.frameSection.value
  const kelsonHalf = (layout.length * 0.86) / 2
  const kelsonTop = keelSec + DIMS.plankThickness.value * 2
  const spread = layout.length * 0.64
  for (let i = 0; i < layout.frames; i++) {
    const t = (i + 0.5) / layout.frames
    const x = -spread / 2 + spread * t
    const u = (x / layout.length) * 2
    const taper = Math.cos((u * Math.PI) / 2)
    const half = layout.halfBeam * (0.12 + 0.88 * Math.pow(taper, 0.7))
    // Down onto the keelson rather than merely touching the keel's top face:
    // a frame that meets a timber at a plane shares no volume with it, and the
    // peg between them would be inside neither.
    const y = kelsonTop - DIMS.plankThickness.value
    const height = layout.sheerY + DIMS.sheerRise.value * u * u - y
    const id = `gading-${i}`
    parts.push(
      box(
        id,
        { name: 'gading', nameId: 'Gading', nameEn: 'Frame' },
        'gading',
        i,
        'kayu',
        ['frameSection', 'frames', 'depth'],
        [x, y + height / 2, 0],
        [frameSec, height, half * 2],
      ),
    )
    // Clamped to the keelson, which stops short of the stems while the end
    // frames stand at its ends — the seventh pack to need this correction.
    const lo = Math.max(x - frameSec / 2, -kelsonHalf)
    const hi = Math.min(x + frameSec / 2, kelsonHalf)
    joints.push({
      id: `pasak-${i}`,
      kind: 'pasak',
      mortise: 'kelson',
      tenon: id,
      at: [(lo + hi) / 2, kelsonTop - DIMS.plankThickness.value / 2, 0],
      halfExtents: [
        Math.max(1e-3, (hi - lo) / 2),
        (DIMS.plankThickness.value * 2 * engage) / 2,
        keelSec / 2,
      ],
    })
  }

  /* The deck, and the thwarts people sit on. */
  parts.push(
    box(
      'geladak',
      { name: 'geladak', nameId: 'Geladak', nameEn: 'Deck' },
      'geladak',
      0,
      'papan',
      ['deckThickness', 'depth', 'beamRatio'],
      [0, layout.deckY + DIMS.deckThickness.value / 2, 0],
      [layout.length * 0.66, DIMS.deckThickness.value, layout.halfBeam * 1.5],
    ),
  )

  return { parts, joints }
}

export function buildFittings(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const engage = DIMS.jointEngagement.value
  const deckTop = layout.deckY + DIMS.deckThickness.value

  /*
   * The kajang: the thing that makes this a house.
   *
   * Hoops of bamboo with nipa leaf over them, low enough to sit under and not
   * to stand under — which is a rule about balance rather than about headroom.
   */
  if (layout.kajang.present) {
    const span = layout.kajang.to - layout.kajang.from
    const hoops = Math.max(3, Math.round(span / 0.9))
    const section = DIMS.cadikSection.value / 2
    for (let i = 0; i <= hoops; i++) {
      const x = layout.kajang.from + (span / hoops) * i
      const id = `rangka-kajang-${i}`
      parts.push(
        box(
          id,
          { name: 'kajang', nameId: 'Rangka kajang', nameEn: 'Awning hoop' },
          'kajang',
          i,
          'bambu',
          ['kajangRise', 'kajangFrom', 'kajangTo', 'awningMakesItAHouse'],
          // Down into the deck by half its thickness, so the hoop and the deck
          // share the volume the lashing between them sits in.
          [
            x,
            deckTop - DIMS.deckThickness.value / 2 + layout.kajang.rise / 2,
            0,
          ],
          [section, layout.kajang.rise, layout.halfBeam * 1.5],
        ),
      )
      joints.push({
        id: `ikat-kajang-${i}`,
        kind: 'ikat',
        mortise: 'geladak',
        tenon: id,
        // Inside the deck rather than on its face: a lashing that straddles a
        // surface is inside neither member.
        at: [x, deckTop - DIMS.deckThickness.value / 4, 0],
        halfExtents: [section / 2, (DIMS.deckThickness.value * engage) / 2, section / 2],
      })
    }
    const courses = Math.max(2, Math.round(DIMS.kajangCourses.value))
    for (let c = 0; c < courses; c++) {
      const t = c / courses
      const width = layout.halfBeam * 1.5 * (1 - t * 0.25)
      parts.push(
        box(
          `kajang-${c}`,
          { name: 'kajang', nameId: `Atap kajang ${c + 1}`, nameEn: `Awning course ${c + 1}` },
          'kajang',
          100 + c,
          'nipah',
          ['kajangCourses', 'kajangRise', 'awningMakesItAHouse'],
          [
            (layout.kajang.from + layout.kajang.to) / 2,
            deckTop + layout.kajang.rise * (0.55 + 0.45 * t),
            0,
          ],
          [span * (1 - t * 0.06), DIMS.plankThickness.value, width],
        ),
      )
    }
  }

  /* The hearth: a fire on floating timber, in a box of sand. */
  const box_ = layout.hearth.radius
  parts.push(
    box(
      'kotak-dapur',
      { name: 'dapur', nameId: 'Kotak dapur', nameEn: 'Hearth box' },
      'dapur',
      0,
      'papan',
      ['hearthRadius', 'hearthSand', 'hearthAboard'],
      [layout.hearth.x, deckTop + DIMS.hearthSand.value / 2, layout.hearth.side],
      [box_ * 2, DIMS.hearthSand.value, box_ * 2],
    ),
  )
  parts.push(
    box(
      'pasir',
      { name: 'pasir', nameId: 'Pasir', nameEn: 'Sand' },
      'dapur',
      1,
      'pasir',
      ['hearthSand', 'hearthAboard'],
      [
        layout.hearth.x,
        deckTop + DIMS.hearthSand.value / 2 + DIMS.plankThickness.value,
        layout.hearth.side,
      ],
      [box_ * 1.7, DIMS.hearthSand.value * 0.8, box_ * 1.7],
    ),
  )

  /*
   * The outriggers: booms sloping down from the sheer to floats at the water.
   *
   * The booms are placed before the floats they carry, because a float hung on
   * nothing is what the build-order check found the first time — and because
   * that is the order they go on in.
   */
  if (layout.cadik.present) {
    const sec = DIMS.cadikSection.value
    const floatY = layout.draught + sec / 2
    const drop = layout.sheerY - floatY
    const reach = layout.cadik.reach + layout.halfBeam
    const boomRun = Math.hypot(reach, drop)
    const boomTilt = Math.atan2(drop, reach)
    for (const sz of [-1, 1] as const) {
      for (const ex of [-1, 1] as const) {
        parts.push(
          box(
            `galang-${sz > 0 ? 'a' : 'b'}${ex > 0 ? 'a' : 'b'}`,
            { name: 'cadik', nameId: 'Galang cadik', nameEn: 'Outrigger boom' },
            'cadik',
            (sz > 0 ? 2 : 0) + (ex > 0 ? 1 : 0),
            'bambu',
            ['cadikReach', 'cadikSection'],
            [
              ex * layout.length * 0.18,
              (layout.sheerY + floatY) / 2,
              (sz * reach) / 2,
            ],
            [sec, sec, boomRun],
            [sz * boomTilt, 0, 0],
          ),
        )
      }
      parts.push(
        box(
          `cadik-${sz > 0 ? 'a' : 'b'}`,
          { name: 'cadik', nameId: 'Cadik', nameEn: 'Outrigger float' },
          'cadik',
          10 + (sz > 0 ? 1 : 0),
          'bambu',
          ['cadikReach', 'cadikSection'],
          [0, floatY, sz * reach],
          [layout.length * 0.5, sec, sec],
        ),
      )
    }
  }

  return { parts, joints }
}
