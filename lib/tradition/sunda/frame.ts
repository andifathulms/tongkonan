/**
 * The imah, from the hillside up.
 *
 * The first builder in this project that begins with the ground, because the
 * ground is the first thing in the part list — a slab of earth, tilted, that
 * the builders may not touch. Everything above it is cut to what it leaves:
 * the stones sit on its surface at whatever heights they find, and each post
 * is as long as the distance from its own stone to the one level floor.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse.
 * Uphill is +X, so the downhill posts — the long ones — are at the front,
 * which is also where the sosoro and the door are.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, slopeOf, wilayahInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, SundaKinds, Tihang } from './types'

const builders = partBuilders<SundaKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

/** The height of the untouched ground at a point along the slope. */
export function groundAt(layout: Pick<Layout, 'slope' | 'length' | 'groundBase'>, x: number): number {
  return layout.groundBase + (x + layout.length / 2) * layout.slope
}

export function resolveLayout(rules: Rules): Layout {
  const length = DIMS.length.value
  const halfZ = DIMS.halfWidth.value
  const slope = slopeOf(rules.lereng)
  const bay = DIMS.bay.value
  const stone = DIMS.stoneHeight.value

  /*
   * The slab of ground sits on the datum, and the surface is measured from it.
   *
   * A tilted box's lowest corner is not its centre less half its thickness, so
   * the drop is measured off the finished shape rather than guessed at — the
   * same arithmetic the invariants do, done once and read by both.
   */
  const margin = DIMS.groundMargin.value
  const span = length + margin * 2
  const tilt = Math.atan2(span * slope, span)
  const groundBase =
    (Math.abs(Math.sin(tilt)) * Math.hypot(span, span * slope)) / 2 +
    Math.abs(Math.cos(tilt)) * DIMS.groundThickness.value -
    (length / 2) * slope

  const lines = Math.max(2, Math.round(length / bay) + 1)
  const xs = Array.from({ length: lines }, (_, i) => -length / 2 + (length / (lines - 1)) * i)

  /*
   * The floor is level, and it is set by the *highest* stone.
   *
   * Measured from the uphill end, so the shortest post still clears the ground
   * by the stated clearance and every other post is longer than it needs to be
   * by exactly as much as the hill drops. On level ground they would all be
   * the same; the difference between them is the slope, in metres.
   */
  const highest = groundAt({ slope, length, groundBase }, length / 2) + stone
  const floorY = highest + DIMS.clearance.value + DIMS.beamSection.value

  const posts: Tihang[] = []
  for (const x of xs) {
    for (const sz of [-1, 1] as const) {
      const groundY = groundAt({ slope, length, groundBase }, x)
      posts.push({
        key: `${x.toFixed(2)}-${sz > 0 ? 'a' : 'b'}`,
        x,
        z: sz * (halfZ - DIMS.postSection.value / 2),
        groundY,
        // Up to the top of the beam it carries: a notched post head takes the
        // beam in it, so the post is as long as the ground leaves it *and*
        // reaches the member it holds — which is what the joint check asks.
        length: floorY - (groundY + stone),
      })
    }
  }

  const info = wilayahInfo(rules.wilayah)
  const plateY = floorY + DIMS.floorThickness.value + DIMS.wallHeight.value

  return {
    rules,
    length,
    halfZ,
    slope,
    groundBase,
    posts,
    floorY,
    floorThickness: DIMS.floorThickness.value,
    postSection: DIMS.postSection.value,
    stoneHeight: stone,
    plateY,
    ridgeY: plateY + DIMS.ridgeRise.value,
    eaveOversail: DIMS.eaveOversail.value,
    poleLength: DIMS.poleLength.value,
    sosoro: {
      present: rules.sosoro,
      depth: DIMS.sosoroDepth.value,
      floorY: floorY - DIMS.floorThickness.value * 3,
    },
    doors: info.doors,
    hateupCourses: Math.max(
      3,
      Math.round(
        Math.hypot(halfZ + DIMS.eaveOversail.value, DIMS.ridgeRise.value) /
          DIMS.hateupCourseDepth.value,
      ),
    ),
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'clearance',
  'bay',
  'length',
  'halfWidth',
  'groundIsNotCut',
  'poleLength',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const engage = DIMS.jointEngagement.value
  const beam = DIMS.beamSection.value
  const board = layout.floorThickness

  /*
   * The ground, first, and it is not a built part.
   *
   * A slab tilted to the slope, drawn wide enough to run past the house. It is
   * in the model because the rule that matters here is about it: a check can
   * ask whether the stones sit on this surface, and cannot ask anything at all
   * about a datum that is not there.
   */
  const margin = DIMS.groundMargin.value
  const thickness = DIMS.groundThickness.value
  const span = layout.length + margin * 2
  const rise = span * layout.slope
  const tilt = Math.atan2(rise, span)
  parts.push(
    box(
      'tanah',
      { name: 'tanah', nameId: 'Tanah', nameEn: 'The ground' },
      'tanah',
      0,
      'tanah',
      ['groundThickness', 'groundMargin', 'slopeMedium', 'groundIsNotCut'],
      [
        0,
        groundAt(layout, 0) - (thickness / 2) * Math.cos(tilt),
        0,
      ],
      [Math.hypot(span, rise), thickness, (layout.halfZ + margin) * 2],
      [0, 0, tilt],
    ),
  )

  /* Stones where they lie, and posts as long as that leaves them. */
  layout.posts.forEach((post, i) => {
    parts.push(
      box(
        `batu-${i}`,
        { name: 'batu', nameId: 'Batu tapak', nameEn: 'Foot stone' },
        'batu',
        i,
        'batu',
        ['stoneHeight', 'stoneWidth', 'groundIsNotCut'],
        [post.x, post.groundY + layout.stoneHeight / 2, post.z],
        [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
      ),
      box(
        `tihang-${i}`,
        { name: 'tihang', nameId: 'Tihang', nameEn: 'Post' },
        'tihang',
        i,
        'kayu',
        POST_DIMS,
        [post.x, post.groundY + layout.stoneHeight + post.length / 2, post.z],
        [sec, post.length, sec],
      ),
    )
  })

  /* Beams across the posts, at the one level the floor sits on. */
  const xs = [...new Set(layout.posts.map((p) => p.x))].sort((a, b) => a - b)
  xs.forEach((x, i) => {
    const id = `balok-${i}`
    parts.push(
      box(
        id,
        { name: 'balok', nameId: 'Balok', nameEn: 'Floor beam' },
        'palupuh',
        i,
        'kayu',
        ['beamSection', 'halfWidth', 'clearance'],
        [x, layout.floorY - beam / 2, 0],
        [beam, beam, layout.halfZ * 2],
      ),
    )
    layout.posts
      .filter((p) => Math.abs(p.x - x) < 1e-9)
      .forEach((post, k) => {
        joints.push({
          id: `takik-${i}-${k}`,
          kind: 'takik',
          mortise: `tihang-${layout.posts.indexOf(post)}`,
          tenon: id,
          at: [x, layout.floorY - beam / 2, post.z],
          halfExtents: [beam / 2, (beam * engage) / 2, sec / 4],
        })
      })
  })

  /* The floor: split bamboo, one level plane over ground that is not level. */
  parts.push(
    box(
      'palupuh',
      { name: 'palupuh', nameId: 'Palupuh', nameEn: 'Split-bamboo floor' },
      'palupuh',
      100,
      'bambu',
      ['floorThickness', 'length', 'halfWidth', 'groundIsNotCut'],
      [0, layout.floorY + board / 2, 0],
      [layout.length, board, layout.halfZ * 2],
    ),
  )

  /* Woven walls on the perimeter, with the doorway left out of the front. */
  const wallT = DIMS.wallThickness.value
  const height = DIMS.wallHeight.value
  const wallY = layout.floorY + board + height / 2
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `bilik-${sz > 0 ? 'a' : 'b'}`,
        { name: 'bilik', nameId: 'Bilik', nameEn: 'Woven wall' },
        'bilik',
        sz > 0 ? 1 : 0,
        'bambu',
        ['wallThickness', 'wallHeight', 'length', 'halfWidth'],
        [0, wallY, sz * (layout.halfZ - wallT / 2)],
        [layout.length, height, wallT],
      ),
    )
  }
  parts.push(
    box(
      'bilik-belakang',
      { name: 'bilik', nameId: 'Bilik belakang', nameEn: 'Rear wall' },
      'bilik',
      2,
      'bambu',
      ['wallThickness', 'wallHeight', 'halfWidth'],
      [layout.length / 2 - wallT / 2, wallY, 0],
      [wallT, height, layout.halfZ * 2 - wallT * 2],
    ),
  )
  /* The front, with the door left open in it. */
  const doorW = DIMS.postSection.value * 6
  for (const sz of [-1, 1] as const) {
    const inner = doorW / 2
    const outer = layout.halfZ
    parts.push(
      box(
        `bilik-depan-${sz > 0 ? 'a' : 'b'}`,
        { name: 'bilik', nameId: 'Bilik depan', nameEn: 'Front wall' },
        'bilik',
        3 + (sz > 0 ? 1 : 0),
        'bambu',
        ['wallThickness', 'wallHeight', 'halfWidth'],
        [-layout.length / 2 + wallT / 2, wallY, (sz * (inner + outer)) / 2],
        [wallT, height, outer - inner],
      ),
    )
  }
  /* And the side door the outer villages are allowed. */
  if (layout.doors > 1) {
    parts.push(
      box(
        'bilik-samping',
        { name: 'bilik', nameId: 'Ambang pintu samping', nameEn: 'Side door head' },
        'bilik',
        10,
        'bambu',
        ['wallThickness', 'wallHeight', 'innerVillagesStricter'],
        [layout.length * 0.15, layout.floorY + board + height * 0.85, layout.halfZ - wallT / 2],
        [doorW, height * 0.3, wallT],
      ),
    )
  }

  /*
   * The sosoro: the platform a visitor stops on.
   *
   * It stands on the downhill end, which is where the posts are longest — so
   * the part of this house that outsiders see is the part the slope has made
   * the most work.
   */
  if (layout.sosoro.present) {
    const depth = layout.sosoro.depth
    const front = -layout.length / 2
    const deckY = layout.sosoro.floorY
    for (const sz of [-1, 1] as const) {
      const x = front - depth + sec / 2
      const groundY = groundAt(layout, x)
      parts.push(
        box(
          `batu-sosoro-${sz > 0 ? 'a' : 'b'}`,
          { name: 'batu', nameId: 'Batu tapak', nameEn: 'Foot stone' },
          'batu',
          200 + (sz > 0 ? 1 : 0),
          'batu',
          ['stoneHeight', 'stoneWidth', 'groundIsNotCut'],
          [x, groundY + layout.stoneHeight / 2, sz * (layout.halfZ - sec / 2)],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
      )
      parts.push(
        box(
          `tihang-sosoro-${sz > 0 ? 'a' : 'b'}`,
          { name: 'tihang', nameId: 'Tihang sosoro', nameEn: 'Sosoro post' },
          'sosoro',
          sz > 0 ? 1 : 0,
          'kayu',
          ['postSection', 'sosoroDepth', 'guestStopsOutside'],
          [
            x,
            groundY + layout.stoneHeight + (deckY - groundY - layout.stoneHeight) / 2,
            sz * (layout.halfZ - sec / 2),
          ],
          [sec, deckY - groundY - layout.stoneHeight, sec],
        ),
      )
    }
    parts.push(
      box(
        'sosoro',
        { name: 'sosoro', nameId: 'Sosoro', nameEn: 'Front platform' },
        'sosoro',
        2,
        'bambu',
        ['sosoroDepth', 'floorThickness', 'halfWidth', 'guestStopsOutside'],
        [front - depth / 2, deckY + board / 2, 0],
        [depth, board, layout.halfZ * 2],
      ),
    )
  }

  return { parts, joints }
}
