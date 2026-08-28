/**
 * The omo, from the stones to the wall heads.
 *
 * Axes as in the other five: X runs front to rear, Y is up, Z runs along the
 * ridge, and the building mirrors about z = 0.
 *
 * The understorey is the subject of this file and of this house. Every other
 * building in the project puts posts up and beams across; here the posts go up
 * and the driwa go *across the diagonal*, and the difference is not decoration
 * — a rectangle of four posts is a mechanism and a triangle is not.
 *
 * The cells and the braces are emitted from one walk. `resolveLayout` records
 * every rectangle of the substructure on the Layout, and `buildFrame` puts a
 * diagonal in each of them by reading that same list. `checkBracing` then
 * walks the recorded cells and looks for a member actually spanning each one.
 * The alternative — the check re-deriving the grid from the dimensions — is
 * how this codebase has produced five faults already: two places computing one
 * shape, and only one of them right.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, omoInfo } from './rules'
import type { DimKey } from './rules'
import type { Cell, Joint, Layout, NiasKinds, Part, Post, Rules } from './types'

const builders = partBuilders<NiasKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = omoInfo(rules.omo)
  const s = info.scale

  const bayZ = DIMS.bayLength.value * s
  const bayX = DIMS.bayDepth.value * s
  const rows = Math.max(2, Math.round(DIMS.bodyRows.value))
  const cols = rules.ruang + 1

  const postSection = DIMS.postSection.value * s
  const stoneHeight = DIMS.stoneHeight.value * s
  const floorY = DIMS.floorHeight.value * s + stoneHeight

  const halfX = ((rows - 1) * bayX) / 2
  const halfZ = ((cols - 1) * bayZ) / 2

  const posts: Post[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      posts.push({
        id: `ehomo-${r}-${c}`,
        x: -halfX + r * bayX,
        z: -halfZ + c * bayZ,
        row: r,
        col: c,
      })
    }
  }

  /*
   * Every rectangle of the understorey, in both vertical planes.
   *
   * A brace stiffens the plane it lies in and no other, so a substructure
   * braced only along its length is still a mechanism across its width. Both
   * families are enumerated here and `checkBracing` walks the lot — which is
   * the difference between a claim about the building and a claim about one
   * elevation of it.
   */
  const cells: Cell[] = []
  const top = floorY
  const bottom = stoneHeight
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + 1 < cols; c++) {
      cells.push({
        id: `petak-z-${r}-${c}`,
        plane: 0,
        minA: -halfZ + c * bayZ,
        maxA: -halfZ + (c + 1) * bayZ,
        minY: bottom,
        maxY: top,
        at: -halfX + r * bayX,
      })
    }
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r + 1 < rows; r++) {
      cells.push({
        id: `petak-x-${r}-${c}`,
        plane: 2,
        minA: -halfX + r * bayX,
        maxA: -halfX + (r + 1) * bayX,
        minY: bottom,
        maxY: top,
        at: -halfZ + c * bayZ,
      })
    }
  }

  const wallHeight = DIMS.wallHeight.value * s
  const wallLean = DIMS.wallLean.value * s
  const eaveY = floorY + wallHeight
  const bodyHalfX = halfX + postSection / 2
  const bodyHalfZ = halfZ + postSection / 2
  const eaveHalfX = bodyHalfX + wallLean + DIMS.eaveOversail.value * s
  const eaveHalfZ = bodyHalfZ + wallLean + DIMS.eaveOversail.value * s
  const ridgeY = eaveY + DIMS.ridgeRise.value * s
  // A hip: one pitch on four planes leaves the ridge shorter than the eave by
  // the eave's own half-depth at each end. Derived, never declared.
  const ridgeHalfZ = Math.max(0, eaveHalfZ - eaveHalfX)

  const slope = Math.hypot(eaveHalfX, ridgeY - eaveY)
  const thatchCourses = Math.max(3, Math.round(slope / (DIMS.thatchCourseDepth.value * s)))

  const behu: { id: string; x: number; z: number; height: number }[] = []
  if (rules.behu) {
    const n = Math.max(1, Math.round(DIMS.behuCount.value))
    const spacing = DIMS.behuSpacing.value
    for (let k = 0; k < n; k++) {
      behu.push({
        id: `behu-${k}`,
        // In front of the house: −X is the face the plaza lies against.
        x: -eaveHalfX - DIMS.plazaOffset.value,
        z: (k - (n - 1) / 2) * spacing,
        height: DIMS.behuHeight.value,
      })
    }
  }

  return {
    rules,
    bodyHalfX,
    bodyHalfZ,
    floorY,
    wallHeight,
    wallLean,
    posts,
    rows,
    cols,
    postSection,
    bay: bayZ,
    stoneHeight,
    cells,
    braceSection: DIMS.braceSection.value * s,
    eaveY,
    ridgeY,
    ridgeHalfZ,
    eaveHalfX,
    eaveHalfZ,
    thatchCourses,
    /*
     * The loft, taken from the roof it hangs in rather than declared.
     *
     * Written first as a share of the body width, and it floated: the roof has
     * closed in by the time it reaches loft height, so a loft sized from the
     * plan below sits inside the rafters touching nothing, and the build-order
     * check said so. Reading its half-extents off the hip at its own height
     * lands it on the frame that carries it and removes an invented number at
     * the same time — the identical correction the joglo's roof levels needed
     * when they were interpolated between the eave and the soko guru instead
     * of being taken from the pillar rings.
     */
    loft: (() => {
      const y = eaveY + DIMS.loftHeight.value * s
      const t = Math.max(0, Math.min(1, (y - eaveY) / (ridgeY - eaveY)))
      return {
        present: info.loft,
        y,
        halfX: eaveHalfX * (1 - t),
        halfZ: eaveHalfZ - (eaveHalfZ - ridgeHalfZ) * t,
      }
    })(),
    bukaan: {
      y: eaveY - DIMS.windowDrop.value * s - DIMS.windowHeight.value * s,
      height: DIMS.windowHeight.value * s,
      fromZ: -bodyHalfZ + DIMS.windowInset.value * s,
      toZ: bodyHalfZ - DIMS.windowInset.value * s,
    },
    behu,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'bayLength',
  'bayDepth',
  'bodyRows',
  'raisedOnPosts',
  'sebuaScale',
]

const BRACE_DIMS: readonly DimKey[] = [
  'braceSection',
  'floorHeight',
  'bayLength',
  'bayDepth',
  'everyBayTriangulated',
  'bracingVisible',
  'sebuaScale',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const stoneW = DIMS.stoneWidth.value * (layout.postSection / DIMS.postSection.value)
  const seat = layout.stoneHeight * DIMS.postSeat.value
  const engage = DIMS.jointEngagement.value

  /* Stones, then the posts seated into them. */
  layout.posts.forEach((post, i) => {
    parts.push(
      box(
        `batu-${post.row}-${post.col}`,
        { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
        'batu',
        i,
        'batu',
        ['stoneHeight', 'stoneWidth', 'seatedOnStone', 'sebuaScale'],
        [post.x, layout.stoneHeight / 2, post.z],
        [stoneW, layout.stoneHeight, stoneW],
      ),
      box(
        post.id,
        { name: 'ehomo', nameId: 'Ehomo', nameEn: 'Post' },
        'ehomo',
        i,
        'kayu',
        POST_DIMS,
        [
          post.x,
          layout.stoneHeight - seat + (layout.floorY - layout.stoneHeight + seat) / 2,
          post.z,
        ],
        [layout.postSection, layout.floorY - layout.stoneHeight + seat, layout.postSection],
      ),
    )
    joints.push({
      id: `tumpu-${post.row}-${post.col}`,
      kind: 'tumpu',
      mortise: `batu-${post.row}-${post.col}`,
      tenon: post.id,
      at: [post.x, layout.stoneHeight - seat / 2, post.z],
      halfExtents: [layout.postSection / 2, seat / 2, layout.postSection / 2],
    })
  })

  /*
   * One driwa across every recorded cell.
   *
   * Read from `layout.cells` rather than re-walked from the grid, so that the
   * rectangles the check tests are exactly the rectangles a brace was put in.
   * A brace lies in a vertical plane and leans on one axis, so a single-axis
   * rotation places it — the same reason the bale's common rafters are boxes
   * and its hip rafters are not.
   */
  const sec = layout.braceSection
  layout.cells.forEach((cell, i) => {
    const span = cell.maxA - cell.minA
    const rise = cell.maxY - cell.minY
    const length = Math.hypot(span, rise)
    const midA = (cell.minA + cell.maxA) / 2
    const midY = (cell.minY + cell.maxY) / 2

    /*
     * Splayed outward from the centre — and crossed where the centre is inside
     * the bay.
     *
     * Direction comes from the cell's own position rather than from its index.
     * An index-parity zigzag is perfectly sound structurally and is not
     * mirror-symmetric, and the symmetry check found five hundred points with
     * no partner.
     *
     * Taking the direction from position then left one case: an even number of
     * post columns puts a bay *astride* z = 0, and a single leaning diagonal in
     * that bay cannot be symmetric — its own mirror leans the other way. Which
     * is a fact about the building and not about the code: a bay on the axis of
     * a symmetric house takes a cross, not a lean. So it gets both diagonals,
     * and the pair mirrors onto itself. That is why the brace count is not
     * simply the cell count, and why an odd bay tally has more braces than an
     * even one of the same size.
     */
    const straddles = Math.abs(midA) < span / 2 - 1e-9
    const dirs = straddles ? ([1, -1] as const) : ([midA >= 0 ? 1 : -1] as const)

    dirs.forEach((dir, k) => {
      const lean = Math.atan2(span, rise) * dir
      const id = straddles ? `driwa-${cell.id}-${k === 0 ? 'a' : 'b'}` : `driwa-${cell.id}`
      parts.push(
        box(
          id,
          { name: 'driwa', nameId: 'Driwa', nameEn: 'Diagonal brace' },
          'driwa',
          i * 2 + k,
          'kayu',
          BRACE_DIMS,
          cell.plane === 0 ? [cell.at, midY, midA] : [midA, midY, cell.at],
          [sec, length, sec],
          cell.plane === 0 ? [lean, 0, 0] : [0, 0, -lean],
        ),
      )

      /*
       * Notched across the post at the low corner it bears into.
       *
       * At the post, not part-way along the diagonal. The first version put the
       * joint a fraction of the bay in from the corner — thirty per cent of a
       * 2.4 m bay is 360 mm, and the post it was supposed to be notched into is
       * 340 mm across — so every one of the forty-odd joints was engaging a post
       * that was not there. The engagement fraction belongs to the *depth* of
       * the notch, which is a size of timber, and not to the *position* of it,
       * which is where two members meet.
       */
      const footA = dir > 0 ? cell.minA : cell.maxA
      const notch = sec * engage
      joints.push({
        id: straddles ? `takik-${cell.id}-${k === 0 ? 'a' : 'b'}` : `takik-${cell.id}`,
        kind: 'takik',
        mortise:
          cell.plane === 0
            ? `ehomo-${rowOf(layout, cell.at)}-${colOf(layout, footA)}`
            : `ehomo-${rowOf(layout, footA)}-${colOf(layout, cell.at)}`,
        tenon: id,
        at: cell.plane === 0 ? [cell.at, cell.minY + sec, footA] : [footA, cell.minY + sec, cell.at],
        halfExtents: [notch, notch, notch],
      })
    })
  })

  /* The floor, and the walls leaning out over it. */
  const board = DIMS.floorThickness.value
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
      'lantai',
      0,
      'papan',
      ['floorThickness', 'floorHeight', 'bayLength', 'bayDepth', 'raisedOnPosts'],
      [0, layout.floorY + board / 2, 0],
      [layout.bodyHalfX * 2, board, layout.bodyHalfZ * 2],
    ),
  )

  const wallDims: readonly DimKey[] = ['wallHeight', 'wallLean', 'wallThickness', 'sebuaScale']
  const t = DIMS.wallThickness.value
  const lean = Math.atan2(layout.wallLean, layout.wallHeight)
  const run = Math.hypot(layout.wallLean, layout.wallHeight)
  let wall = 0
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        wall++,
        'papan',
        wallDims,
        [sx * (layout.bodyHalfX + layout.wallLean / 2), layout.floorY + layout.wallHeight / 2, 0],
        [t, run, layout.bodyHalfZ * 2],
        [0, 0, sx * lean],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-z-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding', nameEn: 'Wall' },
        'dinding',
        wall++,
        'papan',
        wallDims,
        [0, layout.floorY + layout.wallHeight / 2, sz * (layout.bodyHalfZ + layout.wallLean / 2)],
        [layout.bodyHalfX * 2, run, t],
        [-sz * lean, 0, 0],
      ),
    )
  }

  /*
   * The window band: one opening, not a row of holes.
   *
   * Built as the two boards that close above and below it rather than as a
   * hole cut in a wall, because a box cannot have a hole and pretending
   * otherwise would need a mesh where the check wants an exact extent. What
   * makes the claim testable is that the band is a single part spanning the
   * whole run between its insets — so a row of separate openings would be a
   * row of separate parts and `checkWindowBand` would count them.
   */
  const w = layout.bukaan
  parts.push(
    box(
      'jendela',
      { name: 'jendela', nameId: 'Pita jendela', nameEn: 'Window band' },
      'jendela',
      0,
      'kayu',
      ['windowHeight', 'windowDrop', 'windowInset', 'windowBand', 'wallLean'],
      [
        -(layout.bodyHalfX + layout.wallLean * ((w.y + w.height / 2 - layout.floorY) / layout.wallHeight)),
        w.y + w.height / 2,
        (w.fromZ + w.toZ) / 2,
      ],
      [t * 1.6, w.height, w.toZ - w.fromZ],
    ),
  )

  /*
   * The loft, in a si'ulu's house — and it belongs to the roof stage.
   *
   * Put in with the floor at first, which is where a reader would look for it
   * and is wrong: the floor goes down on a frame that is already standing,
   * and this one hangs inside a roof that has not been built yet. The
   * build-order check refused it, correctly — it is framed with the roof
   * because it is carried by the roof. A high order so it follows the rafters
   * it lands on.
   */
  if (layout.loft.present) {
    parts.push(
      box(
        'loteng',
        { name: 'loteng', nameId: 'Loteng', nameEn: 'Loft' },
        'rangka',
        9000,
        'papan',
        ['loftHeight', 'floorThickness', 'loftInRoof', 'ridgeRise', 'eaveOversail', 'sebuaScale'],
        [0, layout.loft.y + board / 2, 0],
        [layout.loft.halfX * 2, board, layout.loft.halfZ * 2],
      ),
    )
  }

  /* The stones on the plaza, which are not part of the house. */
  for (const stone of layout.behu) {
    parts.push(
      box(
        stone.id,
        { name: 'behu', nameId: 'Behu', nameEn: 'Standing stone' },
        'behu',
        0,
        'behu',
        ['behuHeight', 'behuWidth', 'behuCount', 'behuSpacing', 'plazaOffset', 'behuAreEarned'],
        [stone.x, stone.height / 2, stone.z],
        [DIMS.behuWidth.value, stone.height, DIMS.behuWidth.value],
      ),
    )
  }

  return { parts, joints }
}

function rowOf(layout: Layout, x: number): number {
  let best = 0
  let d = Infinity
  for (const p of layout.posts) {
    const k = Math.abs(p.x - x)
    if (k < d) {
      d = k
      best = p.row
    }
  }
  return best
}

function colOf(layout: Layout, z: number): number {
  let best = 0
  let d = Infinity
  for (const p of layout.posts) {
    const k = Math.abs(p.z - z)
    if (k < d) {
      d = k
      best = p.col
    }
  }
  return best
}
