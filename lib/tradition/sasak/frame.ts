/**
 * The lumbung, from the stones to the walls of the store.
 *
 * Axes as in the other eleven: X runs front to rear, Y is up, Z along the
 * ridge, and the building mirrors about z = 0.
 *
 * The order in this file is the argument. Stones, posts, *then the discs*, and
 * only then the floor — because a guard threaded onto a post cannot be fitted
 * once there is a floor above it. That is a real constraint on the sequence of
 * work, and it is why `penghalang` is its own stage rather than a detail of the
 * floor: this building is put together in the order it is for the sake of a
 * defence against an animal.
 */

import { partBuilders } from '@/lib/core/parts'
import { computeNormals, emptyMesh } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import { DIMS, milikInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, SasakKinds, Tiang } from './types'

const builders = partBuilders<SasakKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Omit<Layout, 'roof' | 'dims'> {
  const info = milikInfo(rules.milik)
  const s = info.scale

  const spacing = DIMS.postSpacing.value * s
  const postSection = DIMS.postSection.value * s
  const stoneHeight = DIMS.stoneHeight.value * s
  const floorY = DIMS.floorHeight.value * s + stoneHeight

  /*
   * Four posts, or six in two rows of three along the ridge. The grid is
   * expressed as a list rather than as a rectangle because six is not a square
   * and the two cases share nothing but their spacing.
   */
  const cols = rules.tiang === 6 ? 3 : 2
  const halfX = spacing / 2
  const halfZ = (spacing * (cols - 1)) / 2

  /*
   * The disc is a size, not a margin.
   *
   * Its radius is declared and the post is whatever it is, so the overhang —
   * the thing that actually stops a rat — is a difference between two numbers
   * that move independently. Derived the other way round at first, which made
   * the overhang a constant and `checkRatGuard` a restatement of its own input.
   */
  const guardRadius = DIMS.guardRadius.value * s
  const guardY = floorY - DIMS.guardDrop.value * s

  const posts: Tiang[] = []
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < cols; c++) {
      posts.push({
        id: `tiang-${r}-${c}`,
        x: -halfX + r * spacing,
        z: -halfZ + (c * halfZ * 2) / (cols - 1),
        guardRadius,
        guardY,
      })
    }
  }

  const inset = DIMS.storeInset.value * s
  const storeHalfX = halfX - inset
  const storeHalfZ = halfZ + spacing * 0.5 - inset

  return {
    rules,
    halfX,
    halfZ,
    posts,
    postSection,
    stoneHeight,
    floorY,
    storeHalfX,
    storeHalfZ,
    storeHeight: DIMS.storeHeight.value * s,
    eaveY: floorY - DIMS.eaveDrop.value * s,
    ridgeY: floorY + DIMS.ridgeRise.value * s,
    thatchCourses: 0,
    seat: { present: rules.kolong, y: DIMS.seatHeight.value * s },
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'postSpacing',
  'floorHeight',
  'seatedOnStone',
  'guardOnEveryPost',
  'desaScale',
]

/**
 * The guard: a flat disc, threaded onto the post.
 *
 * A disc rather than a square, and built as a mesh rather than a box, because
 * the thing has to overhang *equally in every direction* — a square plate has
 * corners a rat can reach round from the diagonal, which is a real difference
 * and not a drawing preference. It is also why `guardOverhang` is a radius.
 */
function discMesh(cx: number, cy: number, cz: number, radius: number, thickness: number, facets: number): MeshData {
  const mesh = emptyMesh()
  const n = Math.max(6, Math.round(facets))
  const push = (x: number, y: number, z: number) => {
    mesh.positions.push(x, y, z)
    mesh.normals.push(0, 0, 0)
    mesh.uvs.push((x - cx) / (radius * 2) + 0.5, (z - cz) / (radius * 2) + 0.5)
    return mesh.positions.length / 3 - 1
  }
  const top = cy + thickness / 2
  const bottom = cy - thickness / 2
  const topCentre = push(cx, top, cz)
  const bottomCentre = push(cx, bottom, cz)
  const rim: { top: number; bottom: number }[] = []
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2
    const x = cx + Math.cos(a) * radius
    const z = cz + Math.sin(a) * radius
    rim.push({ top: push(x, top, z), bottom: push(x, bottom, z) })
  }
  for (let k = 0; k < n; k++) {
    const a = rim[k]
    const b = rim[(k + 1) % n]
    if (!a || !b) continue
    mesh.indices.push(topCentre, a.top, b.top)
    mesh.indices.push(bottomCentre, b.bottom, a.bottom)
    mesh.indices.push(a.top, a.bottom, b.bottom)
    mesh.indices.push(a.top, b.bottom, b.top)
  }
  computeNormals(mesh)
  return mesh
}

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = milikInfo(layout.rules.milik).scale
  const sec = layout.postSection
  const seat = layout.stoneHeight * DIMS.postSeat.value
  const engage = DIMS.jointEngagement.value
  const guardT = DIMS.guardThickness.value * s
  const board = DIMS.floorThickness.value * s

  layout.posts.forEach((post, i) => {
    parts.push(
      box(
        `batu-${i}`,
        { name: 'batu', nameId: 'Batu alas', nameEn: 'Pad stone' },
        'batu',
        i,
        'batu',
        ['stoneHeight', 'stoneWidth', 'seatedOnStone', 'desaScale'],
        [post.x, layout.stoneHeight / 2, post.z],
        [DIMS.stoneWidth.value * s, layout.stoneHeight, DIMS.stoneWidth.value * s],
      ),
      box(
        post.id,
        { name: 'tiang', nameId: 'Tiang', nameEn: 'Post' },
        'tiang',
        i,
        'kayu',
        POST_DIMS,
        [post.x, layout.stoneHeight - seat + (layout.floorY - layout.stoneHeight + seat) / 2, post.z],
        [sec, layout.floorY - layout.stoneHeight + seat, sec],
      ),
    )
    joints.push({
      id: `tumpu-${i}`,
      kind: 'tumpu',
      mortise: `batu-${i}`,
      tenon: post.id,
      at: [post.x, layout.stoneHeight - seat / 2, post.z],
      halfExtents: [sec / 2, seat / 2, sec / 2],
    })

    parts.push(
      meshPart(
        `penghalang-${i}`,
        { name: 'penghalang tikus', nameId: 'Penghalang tikus', nameEn: 'Rat guard' },
        'penghalang',
        i,
        'kayu',
        ['guardRadius', 'guardThickness', 'guardDrop', 'guardFacets', 'guardOnEveryPost', 'noOtherWayUp'],
        discMesh(post.x, post.guardY, post.z, post.guardRadius, guardT, DIMS.guardFacets.value),
      ),
    )
    /*
     * The disc surrounds the post rather than the post entering the disc, so
     * the joint's mortise is the guard and its tenon is the post — which is the
     * one place in this project where the part being passed through is the
     * larger of the two.
     */
    joints.push({
      id: `sarung-${i}`,
      kind: 'sarung',
      mortise: `penghalang-${i}`,
      tenon: post.id,
      at: [post.x, post.guardY, post.z],
      halfExtents: [sec / 2, (guardT * engage) / 2, sec / 2],
    })
  })

  /* The floor of the store, above the discs. */
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai simpan', nameEn: 'Store floor' },
      'lantai',
      0,
      'papan',
      ['floorThickness', 'floorHeight', 'storeInset', 'postSpacing', 'builtForRice'],
      [0, layout.floorY + board / 2, 0],
      /*
       * Out to the posts, not to the walls.
       *
       * The floor rests on the post heads, so it has to reach them — it was
       * inset with the walls at first, which left it a hand's breadth short of
       * every post and bearing on nothing at all. The walls sit inboard of it;
       * that is what `storeInset` is for.
       */
      [
        (layout.halfX + layout.postSection / 2) * 2,
        board,
        (layout.storeHalfZ + DIMS.storeInset.value * s) * 2,
      ],
    ),
  )

  /* The store: four walls and one opening. */
  const wallT = DIMS.wallThickness.value * s
  const wallY = layout.floorY + board + layout.storeHeight / 2
  const wallDims: readonly DimKey[] = ['storeHeight', 'storeInset', 'wallThickness', 'builtForRice']
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding simpan', nameEn: 'Store wall' },
        'dinding',
        sx > 0 ? 1 : 0,
        'papan',
        wallDims,
        [sx * (layout.storeHalfX - wallT / 2), wallY, 0],
        [wallT, layout.storeHeight, layout.storeHalfZ * 2],
      ),
    )
  }
  /*
   * The two end walls: one whole, one with the opening in it.
   *
   * The opening is made by two boards with a gap rather than by a hole, for the
   * reason every pack here gives: a box cannot have a hole, and pretending
   * otherwise would need a mesh where the checks want an exact extent.
   */
  const hatch = DIMS.hatchWidth.value * s
  const side = (layout.storeHalfX * 2 - hatch) / 2
  for (const sz of [-1, 1] as const) {
    if (sz > 0) {
      parts.push(
        box(
          'dinding-z-a',
          { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
          'dinding',
          2,
          'papan',
          wallDims,
          [0, wallY, sz * (layout.storeHalfZ - wallT / 2)],
          [layout.storeHalfX * 2 - wallT * 2, layout.storeHeight, wallT],
        ),
      )
    } else {
      for (const sx of [-1, 1] as const) {
        parts.push(
          box(
            `dinding-z-b-${sx > 0 ? 'a' : 'b'}`,
            { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
            'dinding',
            3,
            'papan',
            [...wallDims, 'hatchWidth'],
            [sx * (hatch / 2 + side / 2), wallY, sz * (layout.storeHalfZ - wallT / 2)],
            [side, layout.storeHeight, wallT],
          ),
        )
      }
    }
  }

  /*
   * The sitting platform, and it stops short of every post.
   *
   * If it reached a post it would be a step, and a step beside a rat guard is
   * a way round it. `checkNoOtherWayUp` tests that in general; the geometry
   * here is where the general claim is kept true.
   */
  if (layout.seat.present) {
    const t = DIMS.seatThickness.value * s
    /*
     * Its own stumps, well inside the posts.
     *
     * The platform has to rest on something — it floated at first and the
     * build-order check said so — and it must not rest on the granary's posts,
     * because a stump touching one is a step beside a rat guard. So it carries
     * its own, short enough that nothing they offer reaches the discs.
     */
    const stump = DIMS.postSection.value * s * 0.7
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        parts.push(
          box(
            `kolong-kaki-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`,
            { name: 'kaki', nameId: 'Kaki lantai kolong', nameEn: 'Platform stump' },
            'kolong',
            0,
            'kayu',
            ['seatHeight', 'postSection', 'noOtherWayUp'],
            [
              sx * (layout.halfX - sec * 2),
              (layout.seat.y - t) / 2,
              sz * (layout.halfZ + DIMS.postSpacing.value * s * 0.5 - sec * 2),
            ],
            [stump, layout.seat.y - t, stump],
          ),
        )
      }
    }
    parts.push(
      box(
        'kolong',
        { name: 'lantai duduk', nameId: 'Lantai kolong', nameEn: 'Sitting platform' },
        'kolong',
        1,
        'bambu',
        ['seatHeight', 'seatThickness', 'floorHeight', 'noOtherWayUp'],
        [0, layout.seat.y - t / 2, 0],
        [(layout.halfX - sec) * 2, t, (layout.halfZ + DIMS.postSpacing.value * s * 0.5 - sec) * 2],
      ),
    )
  }

  return { parts, joints }
}
