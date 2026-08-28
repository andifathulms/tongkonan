/**
 * The rumah kaki seribu, from the legs to the walls.
 *
 * Axes as in the other ten: X runs front to rear, Y is up, Z along the ridge,
 * and the building mirrors about z = 0.
 *
 * The legs are the file. Every other house here puts up as few posts as it can
 * and makes each one count; this one puts up as many as it can and asks
 * nothing of any single pole. They lean — each a little, and no two the same
 * way — which is why `legLean` is a dimension and why the lean is derived from
 * the leg's own position rather than randomised: `lib/` is pure, and a lean
 * that changed between two runs would make the model a different building each
 * time it was drawn.
 *
 * There are no diagonals here and there must not be. See
 * `checkNothingIsBraced`, which is the negation of the Nias omo's central
 * claim and the reason both houses are in this project.
 */

import { tubeMesh } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, huniInfo } from './rules'
import type { DimKey } from './rules'
import type { ArfakKinds, Joint, Kaki, Layout, Part, Rules } from './types'

const builders = partBuilders<ArfakKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * A lean that is deterministic and looks arbitrary.
 *
 * Poles leaning every which way is the whole visual character of this
 * substructure, and the obvious way to get it is `Math.random`, which `lib/`
 * forbids — a house that came out different on every load would be a
 * screensaver, and two readers comparing screens would not be comparing the
 * same building. So the lean is a hash of the leg's own grid position: fixed,
 * reproducible, and with no pattern a viewer will pick out.
 */
function leanOf(row: number, col: number, amount: number): { x: number; z: number } {
  const h = Math.sin(row * 12.9898 + col * 78.233) * 43758.5453
  const a = h - Math.floor(h)
  const g = Math.sin(row * 39.3468 + col * 11.135) * 24634.6345
  const b = g - Math.floor(g)
  const angle = a * Math.PI * 2
  const reach = (0.35 + 0.65 * b) * amount
  return { x: Math.cos(angle) * reach, z: Math.sin(angle) * reach }
}

export function resolveLayout(rules: Rules): Layout {
  const info = huniInfo(rules.huni)
  const bay = DIMS.bayLength.value
  const halfZ = (bay * rules.ruang) / 2
  const halfX = DIMS.bodyWidth.value / 2

  const floorY = DIMS.floorHeight.value
  const legSection = DIMS.legSection.value
  const lean = DIMS.legLean.value

  /*
   * The legs, on a grid whose spacing follows from the rule rather than the
   * other way about. `kaki` says how many stand across the width; the number
   * along the length is whatever that spacing gives, so the two directions
   * stay evenly crowded and the total is a consequence — which is what the
   * name of the house is about.
   */
  const cols = Math.max(2, Math.round(rules.kaki))
  const pitch = (halfX * 2) / (cols - 1)
  const rows = Math.max(2, Math.round((halfZ * 2) / pitch) + 1)

  const legs: Kaki[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const l = leanOf(r, c, lean)
      legs.push({
        id: `kaki-${r}-${c}`,
        x: -halfX + c * pitch,
        z: -halfZ + (r * (halfZ * 2)) / (rows - 1),
        row: r,
        col: c,
        leanX: l.x,
        leanZ: l.z,
      })
    }
  }

  const wallHeight = DIMS.wallHeight.value
  const eaveY = floorY + wallHeight
  const eaveHalfX = halfX + DIMS.eaveOversail.value
  const eaveHalfZ = halfZ + DIMS.eaveOversail.value
  const ridgeY = eaveY + DIMS.ridgeRise.value

  const slope = Math.hypot(eaveHalfX, ridgeY - eaveY)
  const thatchCourses = Math.max(3, Math.round(slope / DIMS.thatchCourseDepth.value))

  return {
    rules,
    halfX,
    halfZ,
    bays: rules.ruang,
    floorY,
    legSection,
    legs,
    rows,
    cols,
    wallHeight,
    divided: info.divided,
    passageWidth: DIMS.passageWidth.value,
    eaveY,
    ridgeY,
    eaveHalfX,
    eaveHalfZ,
    thatchCourses,
    doorZ: -halfZ,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const LEG_DIMS: readonly DimKey[] = [
  'legSection',
  'legPitch',
  'legLean',
  'floorHeight',
  'manyLegs',
  'legsNotBuried',
  'nothingIsBraced',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.legSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value
  const board = DIMS.floorThickness.value

  /*
   * The legs. Nothing braces anything.
   *
   * Each is a single pole leaning on both axes, which needs a two-axis
   * rotation — and unlike every earlier case in this project that is fine
   * here, because nothing is jointed to a leg part-way along its length. The
   * only thing a leg meets is the bearer at its head.
   */
  layout.legs.forEach((leg, i) => {
    /*
     * Built as a tube between two points rather than as a rotated box.
     *
     * A pole leaning on both axes needs a two-axis Euler, and a rotated box's
     * vertical extent is then larger than its rise — so every leg dipped below
     * grade and the build-order check said so. Two endpoints cannot be wrong
     * that way, which is the same reason the hip rafters and the tower posts
     * are tubes.
     *
     * And it is the *foot* that wanders, not the head. The heads all meet the
     * bearer on its own line — they were leaned at the top first, which put
     * each head up to 130 mm off a bearer 100 mm wide, so the lashings engaged
     * nothing. A pole is set out where it must land and its foot goes wherever
     * the ground allows, which is both the right way round and the buildable
     * one.
     */
    const head: [number, number, number] = [leg.x, layout.floorY, leg.z]
    /*
     * The foot sits its own half-section above grade.
     *
     * A tube's end ring is square to the pole, so on a leaning pole it dips
     * below the endpoint — only four millimetres here, and the build-order
     * check is right to count four millimetres as underground. The pole's end
     * is cut square and rests on the surface, so the lowest point of it is the
     * ground and not the centre of its end.
     */
    const drop = Math.hypot(leg.leanX, leg.leanZ)
    const reach = Math.hypot(drop, layout.floorY)
    const foot: [number, number, number] = [
      leg.x - leg.leanX,
      reach === 0 ? 0 : ((sec / 2) * drop) / reach,
      leg.z - leg.leanZ,
    ]
    parts.push(
      meshPart(
        leg.id,
        { name: 'kaki', nameId: 'Kaki', nameEn: 'Leg' },
        'kaki',
        i,
        'kayu',
        LEG_DIMS,
        tubeMesh([foot, head], () => sec / 2, 4, 0.4),
      ),
    )
  })

  /*
   * The bearers, lashed across the heads.
   *
   * One per row of legs, running the width. Every leg in that row meets it,
   * and the joint kind is `ikat` — a lashing — because that is the only kind
   * of connection in this building.
   */
  const bearerDims: readonly DimKey[] = ['bearerDepth', 'bearerWidth', 'legPitch', 'tiedNotPegged']
  const rowsZ = [...new Set(layout.legs.map((l) => l.z))].sort((a, b) => a - b)
  rowsZ.forEach((z, ri) => {
    const id = `balok-${ri}`
    parts.push(
      box(
        id,
        { name: 'balok', nameId: 'Balok', nameEn: 'Bearer' },
        'balok',
        ri,
        'kayu',
        bearerDims,
        [0, layout.floorY - bearerD / 2, z],
        [layout.halfX * 2 + sec, bearerD, bearerW],
      ),
    )
    for (const leg of layout.legs.filter((l) => Math.abs(l.z - z) < 1e-9)) {
      /*
       * A quarter-section, not a half.
       *
       * A leg is a four-sided tube, so its section is a square inscribed in
       * the pole's radius — across a diagonal it is the full width and across
       * a flat it is seven-tenths of it, depending on how the tube's frame
       * happened to land. A lashing sized to the full half-section reached
       * outside the timber on whichever legs came out rotated, which is what
       * the joint check found. The engagement is real either way; it is just
       * smaller than a nominal dimension suggests.
       */
      const grip = sec / 4
      const lo = Math.max(leg.x - grip, -layout.halfX - sec / 2)
      const hi = Math.min(leg.x + grip, layout.halfX + sec / 2)
      if (hi <= lo) continue
      joints.push({
        id: `ikat-${leg.id}`,
        kind: 'ikat',
        mortise: id,
        tenon: leg.id,
        // The head runs up into the bearer, so the lashing has timber on both
        // sides of it rather than a plane to sit on.
        at: [(lo + hi) / 2, layout.floorY - bearerD / 2, z],
        // Narrower than the bearer, because the leg is: the lashing is only as
        // wide as the thinner of the two members it ties.
        halfExtents: [(hi - lo) / 2, (bearerD * engage) / 2, Math.min(sec / 4, bearerW / 2)],
      })
    }
  })

  /* The sprung floor. */
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai kulit kayu', nameEn: 'Bark floor' },
      'lantai',
      0,
      'kulit',
      ['floorThickness', 'floorHeight', 'bodyWidth', 'bayLength'],
      [0, layout.floorY + board / 2, 0],
      [layout.halfX * 2, board, layout.halfZ * 2],
    ),
  )

  /* The walls, and the plate the rafters land on. */
  const wallT = DIMS.wallThickness.value
  const wallY = layout.floorY + layout.wallHeight / 2
  const wallDims: readonly DimKey[] = ['wallHeight', 'wallThickness', 'bodyWidth', 'bayLength']
  let w = 0
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        w++,
        'kulit',
        wallDims,
        [sx * (layout.halfX - wallT / 2), wallY, 0],
        [wallT, layout.wallHeight, layout.halfZ * 2],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    // The door end is left with a gap; both are boarded the same otherwise.
    const doorW = sz < 0 ? DIMS.doorWidth.value : 0
    const side = (layout.halfX * 2 - doorW) / 2
    for (const sx of [-1, 1] as const) {
      if (doorW === 0 && sx > 0) {
        parts.push(
          box(
            `dinding-z-${sz > 0 ? 'a' : 'b'}`,
            { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
            'dinding',
            w++,
            'kulit',
            wallDims,
            [0, wallY, sz * (layout.halfZ - wallT / 2)],
            [layout.halfX * 2 - wallT * 2, layout.wallHeight, wallT],
          ),
        )
      } else if (doorW > 0) {
        parts.push(
          box(
            `dinding-z-${sz > 0 ? 'a' : 'b'}-${sx > 0 ? 'a' : 'b'}`,
            { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
            'dinding',
            w++,
            'kulit',
            [...wallDims, 'doorWidth'],
            [sx * (doorW / 2 + side / 2), wallY, sz * (layout.halfZ - wallT / 2)],
            [side, layout.wallHeight, wallT],
          ),
        )
      }
    }
  }

  const plateD = bearerD
  const plateW = bearerW
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `balok-atas-${sx > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok atas', nameEn: 'Wall plate' },
        'dinding',
        100 + (sx > 0 ? 1 : 0),
        'kayu',
        ['bearerDepth', 'bearerWidth', 'wallHeight', 'eaveOversail'],
        [sx * (layout.halfX - plateW / 2), layout.eaveY - plateD / 2, 0],
        [plateW, plateD, layout.eaveHalfZ * 2],
      ),
    )
  }

  /* The division, in a clan house, and nothing at all in a family one. */
  if (layout.divided) {
    for (const sx of [-1, 1] as const) {
      parts.push(
        box(
          `sekat-${sx > 0 ? 'a' : 'b'}`,
          { name: 'sekat', nameId: 'Sekat', nameEn: 'Partition' },
          'sekat',
          sx > 0 ? 1 : 0,
          'kulit',
          ['passageWidth', 'wallHeight', 'wallThickness', 'clanDividesInTwo'],
          [sx * layout.passageWidth / 2, wallY, 0],
          [wallT, layout.wallHeight, layout.halfZ * 2 - wallT * 2],
        ),
      )
    }
  }

  /* The notched log at the door. */
  const ladderSec = DIMS.ladderSection.value
  const reach = DIMS.laddarReach.value
  const lean = Math.asin(Math.min(1, layout.floorY / reach))
  parts.push(
    box(
      'tangga',
      { name: 'tangga', nameId: 'Tangga', nameEn: 'Notched log' },
      'tangga',
      0,
      'kayu',
      ['laddarReach', 'ladderSection', 'floorHeight'],
      [
        0,
        layout.floorY / 2 + (Math.cos(lean) * ladderSec) / 2,
        -layout.halfZ - (Math.cos(lean) * reach) / 2,
      ],
      [ladderSec, reach, ladderSec],
      [Math.PI / 2 - lean, 0, 0],
    ),
  )

  return { parts, joints }
}
