/**
 * The betang, from the posts to the gallery.
 *
 * Axes as in the other six: X runs front to rear, Y is up, Z runs along the
 * ridge, and the building mirrors about z = 0 — except that here it does not,
 * and that is the point. See `checkSharesAreEqual` and the note on symmetry in
 * `invariants.ts`: a house whose households are added at one end is
 * deliberately asymmetric along its length, and the honest claim is about the
 * *section* rather than about the building.
 *
 * Everything here is built by walking `layout.shares`. Nothing takes the
 * building's length as an input, because the building has no length until the
 * shares are counted — which is the difference between this house and the
 * other six, expressed as a loop.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, tumbuhInfo } from './rules'
import type { DimKey } from './rules'
import type { DayakKinds, Joint, Layout, Part, Rules, Share } from './types'

const builders = partBuilders<DayakKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const share = DIMS.shareLength.value
  const n = rules.keluarga
  const length = share * n
  const halfZ = length / 2

  /*
   * Where the shares sit, and where the house grew from.
   *
   * The geometry of the shares themselves is identical whichever end is
   * growing — they are equal by rule. What `tumbuh` changes is which end the
   * *origin* of the building sits at, and therefore where the hejot is and
   * which end the model treats as the one that has always been there. Modelled
   * as an offset rather than as a different arrangement of parts, because the
   * bilik of a house that grew downstream are not shaped differently from the
   * bilik of one that grew upstream. Only their history differs, and history
   * is not geometry.
   */
  const shares: Share[] = []
  for (let i = 0; i < n; i++) {
    shares.push({
      id: `bagian-${i}`,
      index: i,
      z: -halfZ + share * (i + 0.5),
      halfZ: share / 2,
    })
  }

  const bilikDepth = DIMS.bilikDepth.value
  const samiDepth = DIMS.samiDepth.value
  const halfX = (bilikDepth + samiDepth) / 2

  const floorY = DIMS.floorHeight.value
  const wallHeight = DIMS.wallHeight.value
  const eaveY = floorY + wallHeight
  const eaveHalfX = halfX + DIMS.eaveOversail.value
  const ridgeY = eaveY + DIMS.ridgeRise.value

  const slope = Math.hypot(eaveHalfX, ridgeY - eaveY)
  const shingleCourses = Math.max(3, Math.round(slope / DIMS.shingleCourseDepth.value))

  // Post ranks: this many per share, so the frame grows with the census.
  const perShare = Math.max(1, Math.round(DIMS.postsPerShare.value))
  const postRanks: number[] = []
  for (let i = 0; i <= n * perShare; i++) postRanks.push(-halfZ + (i * length) / (n * perShare))
  // Rows across: one at each face and one on the line the bilik wall stands on.
  const postRows = [-halfX, -halfX + samiDepth, halfX]

  const info = tumbuhInfo(rules.tumbuh)
  // The way up is at the end that has always been there — the end the house
  // did not grow from. A house growing both ways is entered at the middle.
  const hejotZ =
    info.tumbuh === 'hilir' ? -halfZ + share / 2 : info.tumbuh === 'hulu' ? halfZ - share / 2 : 0

  return {
    rules,
    bilikDepth,
    samiDepth,
    halfX,
    halfZ,
    length,
    floorY,
    wallHeight,
    postSection: DIMS.postSection.value,
    shares,
    postRows,
    postRanks,
    eaveY,
    ridgeY,
    eaveHalfX,
    shingleCourses,
    // An unroofed far end is what a house does when its length has outrun its
    // means; the fraction is the author's, and the note on the rule says so.
    samiRoofed: rules.sami ? 1 : 0.62,
    hejot: { z: hejotZ, reach: DIMS.hejotReach.value },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'floorHeight',
  'shareLength',
  'postsPerShare',
  'raisedOnPosts',
  'ironwood',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const bearerD = DIMS.bearerDepth.value
  const bearerW = DIMS.bearerWidth.value

  /* Posts: a rank for every step along the shares, a row for each line across. */
  let p = 0
  layout.postRanks.forEach((z, ri) => {
    layout.postRows.forEach((x, xi) => {
      const id = `tiang-${xi}-${ri}`
      parts.push(
        box(
          id,
          { name: 'tiang', nameId: 'Tiang ulin', nameEn: 'Ironwood post' },
          'tiang',
          p++,
          'ulin',
          POST_DIMS,
          /*
           * Up to floor level, not up to the underside of the bearer.
           *
           * A bearer let into a notch has timber on both sides of it — the
           * post continues past the notch. Stopping the post where the bearer
           * begins left the two merely touching on a plane, and forty-odd
           * joints came up as engaging nothing.
           */
          [x, layout.floorY / 2, z],
          [sec, layout.floorY, sec],
        ),
      )
    })
  })

  /* Bearers along the length, on each row of posts. */
  const bearerDims: readonly DimKey[] = ['bearerDepth', 'bearerWidth', 'shareLength', 'ironwood']
  layout.postRows.forEach((x, xi) => {
    const id = `gelagar-x-${xi}`
    parts.push(
      box(
        id,
        { name: 'gelagar', nameId: 'Gelagar memanjang', nameEn: 'Bearer along the house' },
        'gelagar',
        xi,
        'ulin',
        bearerDims,
        [x, layout.floorY - bearerD / 2, 0],
        [bearerW, bearerD, layout.length],
      ),
    )
    layout.postRanks.forEach((z, ri) => {
      /*
       * The actual overlap of the two members, not a fixed box on the post.
       *
       * The end posts stand at the very ends of the bearer, so post and bearer
       * share only half a post's width there. A joint box sized for the middle
       * of the run reaches past the bearer at those two; pulling it inboard
       * instead just moves it off the post. What is engaged is the
       * intersection, so that is what is measured.
       */
      const lo = Math.max(z - sec / 2, -layout.halfZ)
      const hi = Math.min(z + sec / 2, layout.halfZ)
      joints.push({
        id: `takik-${xi}-${ri}`,
        kind: 'takik',
        mortise: `tiang-${xi}-${ri}`,
        tenon: id,
        at: [x, layout.floorY - (bearerD * engage) / 2, (lo + hi) / 2],
        halfExtents: [bearerW / 2, (bearerD * engage) / 2, (hi - lo) / 2],
      })
    })
  })

  /* One floor, end to end, under bilik and gallery alike. */
  const board = DIMS.floorThickness.value
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai', nameEn: 'Floor' },
      'lantai',
      0,
      'papan',
      ['floorThickness', 'bilikDepth', 'samiDepth', 'shareLength', 'galleryIsCommon'],
      [0, layout.floorY + board / 2, 0],
      [layout.halfX * 2, board, layout.length],
    ),
  )

  /*
   * The bilik: one per household, all the same, and the partitions between.
   *
   * Built by walking the shares rather than by dividing a length, which is the
   * same distinction the whole house rests on. The rear and end walls close
   * the private half; the front wall is the one the doors are in.
   */
  const wallT = DIMS.wallThickness.value
  const partT = DIMS.partitionThickness.value
  const bilikCentreX = layout.halfX - layout.bilikDepth / 2
  const wallY = layout.floorY + layout.wallHeight / 2
  const bilikDims: readonly DimKey[] = [
    'bilikDepth',
    'shareLength',
    'wallHeight',
    'wallThickness',
    'onePerHousehold',
    'lengthIsACensus',
  ]

  parts.push(
    box(
      'dinding-belakang',
      { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Rear wall' },
      'bilik',
      0,
      'papan',
      bilikDims,
      [layout.halfX - wallT / 2, wallY, 0],
      [wallT, layout.wallHeight, layout.length],
    ),
  )
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-ujung-${sz > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding ujung', nameEn: 'End wall' },
        'bilik',
        1,
        'papan',
        bilikDims,
        [bilikCentreX, wallY, sz * (layout.halfZ - wallT / 2)],
        [layout.bilikDepth, layout.wallHeight, wallT],
      ),
    )
  }

  layout.shares.forEach((share, i) => {
    // The wall between the bilik and the gallery, with this household's door
    // in it: two boards with the opening between them.
    const doorW = DIMS.doorWidth.value
    const faceX = layout.halfX - layout.bilikDepth + wallT / 2
    const side = (share.halfZ * 2 - doorW) / 2
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `muka-${share.id}-${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: `Dinding muka bilik ${i + 1}`, nameEn: `Bilik ${i + 1} front wall` },
          'bilik',
          2 + i,
          'papan',
          [...bilikDims, 'doorWidth'],
          [faceX, wallY, share.z + sz * (doorW / 2 + side / 2)],
          [wallT, layout.wallHeight, side],
        ),
      )
    }

    // The partition to the next household. One fewer than the households, and
    // that count is the building's own statement of how many live in it.
    if (i + 1 < layout.shares.length) {
      parts.push(
        box(
          `sekat-${i}`,
          { name: 'sekat', nameId: `Sekat ${i + 1}`, nameEn: `Partition ${i + 1}` },
          'bilik',
          200 + i,
          'papan',
          ['partitionThickness', 'bilikDepth', 'wallHeight', 'onePerHousehold', 'shareLength'],
          [bilikCentreX, wallY, share.z + share.halfZ],
          [layout.bilikDepth, layout.wallHeight, partT],
        ),
      )
    }
  })

  /*
   * The gallery rail, along the open front — the sami's only enclosure.
   *
   * Roofed for its whole length or not, the gallery is never walled: it is the
   * part of the building that belongs to everyone, and a wall on it would be
   * someone claiming it.
   */
  const railH = layout.wallHeight * 0.32
  parts.push(
    box(
      'pagar-sami',
      { name: 'pagar', nameId: 'Pagar sami', nameEn: 'Gallery rail' },
      'sami',
      0,
      'papan',
      ['samiDepth', 'wallHeight', 'wallThickness', 'galleryIsCommon', 'shareLength'],
      [-layout.halfX + wallT / 2, layout.floorY + railH / 2, 0],
      [wallT, railH, layout.length],
    ),
  )

  /*
   * The gallery posts and the two plates.
   *
   * A rafter lands on a plate, not on a wall board. Written without them at
   * first and six rafters came up unsupported — the ones that happened to fall
   * over a doorway, where the front wall of a bilik is not there. That is a
   * fault the eye would never find and the build-order check found at once:
   * the roof was resting on whatever happened to be beneath each rafter.
   *
   * The plate on the gallery side is carried on posts continuing up from the
   * floor, because there is no wall on that side to carry it — which is the
   * open gallery stated in structure rather than in copy.
   */
  const plateD = bearerD
  const plateW = bearerW
  const plateY = layout.eaveY - plateD / 2
  const plateDims: readonly DimKey[] = ['bearerDepth', 'bearerWidth', 'wallHeight', 'galleryIsCommon']
  layout.postRanks.forEach((z, ri) => {
    parts.push(
      box(
        `tiang-sami-${ri}`,
        { name: 'tiang', nameId: 'Tiang sami', nameEn: 'Gallery post' },
        'sami',
        10 + ri,
        'ulin',
        [...POST_DIMS, 'samiDepth'],
        [-layout.halfX + sec / 2, layout.floorY + (layout.eaveY - layout.floorY) / 2, z],
        [sec, layout.eaveY - layout.floorY, sec],
      ),
    )
  })
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `balok-atas-${sx > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok atas', nameEn: 'Wall plate' },
        'sami',
        100 + (sx > 0 ? 1 : 0),
        'ulin',
        plateDims,
        [sx * (layout.halfX - plateW / 2), plateY, 0],
        // Out to the verge, not just to the end wall: the two outermost
        // rafters sit beyond the building on the gable overhang, and a plate
        // stopping at the wall leaves them carried by the ridge alone.
        [plateW, plateD, layout.length + DIMS.eaveOversail.value * 2],
      ),
    )
  }

  /*
   * The notched log, at the end the house did not grow from.
   *
   * And it is jointed to nothing. Every other connection in this project is a
   * tenon, a notch or a seat; this one is a log leaned against an edge, and
   * that is the whole point of it — at night it is pulled in. A joint was
   * written for it at first and the stage check refused it, correctly: a
   * member placed last and resting on something built four stages earlier is
   * not engaged with it. The absence is the fact, so there is no `sandar`
   * joint kind and this house has the fewest of the seven.
   */
  const hejotSec = DIMS.hejotSection.value
  const reach = layout.hejot.reach
  const lean = Math.asin(Math.min(1, layout.floorY / reach))
  parts.push(
    box(
      'hejot',
      { name: 'hejot', nameId: 'Hejot', nameEn: 'Notched log' },
      'hejot',
      0,
      'ulin',
      ['hejotReach', 'hejotSection', 'floorHeight', 'oneWayUp', 'ironwood'],
      [
        -layout.halfX - (Math.cos(lean) * reach) / 2,
        // Lifted by the half-section its lean carries below the axis, so the
        // low corner grazes the ground rather than going under it.
        layout.floorY / 2 + (Math.cos(lean) * hejotSec) / 2,
        layout.hejot.z,
      ],
      [hejotSec, reach, hejotSec],
      [0, 0, Math.PI / 2 - lean],
    ),
  )
  return { parts, joints }
}
