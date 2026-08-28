/**
 * The saoraja, from the stones to the loft.
 *
 * Axes as in the other nine: X runs front to rear, Y is up, Z along the ridge,
 * and the building mirrors about z = 0.
 *
 * The joint to look at is the pattolo. Every other house here notches a beam
 * onto a post or lets it into the head; this one threads it through a mortise
 * cut clean through, so the frame is assembled rather than fixed — which is
 * why a Bugis house can be lifted off its stones and carried to a new site by
 * enough people, and is. That is a fact about the joinery with a consequence
 * for what a house *is*: a building you can move is not tied to a plot.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS, rumahInfo } from './rules'
import type { DimKey } from './rules'
import type { BugisKinds, Joint, Layout, Part, Rules, Timpa } from './types'

const builders = partBuilders<BugisKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const info = rumahInfo(rules.rumah)
  const s = info.scale

  const bayZ = DIMS.bayLength.value * s
  const bayX = DIMS.bayDepth.value * s
  const rows = Math.max(2, Math.round(DIMS.rows.value))
  const cols = rules.lontang + 1

  const halfX = ((rows - 1) * bayX) / 2
  const halfZ = ((cols - 1) * bayZ) / 2

  const stoneHeight = DIMS.stoneHeight.value * s
  const awaBola = DIMS.awaBola.value * s
  const aleBola = DIMS.aleBola.value * s
  const rakkeang = DIMS.rakkeang.value * s
  const floorY = stoneHeight + awaBola
  const eaveY = floorY + aleBola

  const eaveHalfX = halfX + DIMS.postSection.value * s + DIMS.eaveOversail.value * s
  const eaveHalfZ = halfZ + DIMS.postSection.value * s + DIMS.eaveOversail.value * s
  const ridgeY = eaveY + DIMS.ridgeRise.value * s

  const slope = Math.hypot(eaveHalfX, ridgeY - eaveY)
  const thatchCourses = Math.max(3, Math.round(slope / (DIMS.thatchCourseDepth.value * s)))

  const postsX: number[] = []
  for (let r = 0; r < rows; r++) postsX.push(-halfX + r * bayX)
  const postsZ: number[] = []
  for (let c = 0; c < cols; c++) postsZ.push(-halfZ + c * bayZ)

  /*
   * The stack on the gable, and it is placed from the roof rather than sized
   * on its own.
   *
   * Each board sits at a height on the gable and is as long as the gable is
   * wide there, shortened by the inset — so a taller stack does not overflow
   * the roof, it climbs it. That the boards follow the gable rather than being
   * given lengths is what keeps the rank legible at every count: seven boards
   * on a small house still read as seven boards, because they are seven bands
   * of the same triangle.
   */
  const rise = ridgeY - eaveY
  const timpaRise = DIMS.timpaRise.value * s
  const timpa: Timpa[] = []
  for (let i = 0; i < rules.timpa; i++) {
    // Stacked upward from just above the eave, and never past the ridge.
    const y = eaveY + timpaRise * (i + 0.6)
    const t = Math.min(1, Math.max(0, (y - eaveY) / rise))
    timpa.push({
      id: `timpa-${i}`,
      index: i,
      y,
      // As wide as the gable is at that height, less the inset — so the stack
      // climbs the triangle instead of overflowing it.
      halfSpan: eaveHalfX * (1 - t) * DIMS.timpaInset.value,
      depth: timpaRise * DIMS.timpaInset.value,
    })
  }

  return {
    rules,
    halfX,
    halfZ,
    bays: rules.lontang,
    floorY,
    wallHeight: aleBola,
    postSection: DIMS.postSection.value * s,
    stoneHeight,
    postsX,
    postsZ,
    awaBola,
    aleBola,
    rakkeang,
    eaveY,
    ridgeY,
    eaveHalfX,
    eaveHalfZ,
    thatchCourses,
    timpa,
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const POST_DIMS: readonly DimKey[] = [
  'postSection',
  'awaBola',
  'aleBola',
  'rakkeang',
  'bayLength',
  'bayDepth',
  'rows',
  'threeWorlds',
  'saorajaScale',
]

export function buildFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const seat = layout.stoneHeight * DIMS.postSeat.value
  const engage = DIMS.jointEngagement.value
  const beamD = DIMS.beamDepth.value
  const beamW = DIMS.beamWidth.value
  const board = DIMS.floorThickness.value

  /* Stones and posts. The posts run from the stone to the eave. */
  layout.postsX.forEach((x, xi) => {
    layout.postsZ.forEach((z, zi) => {
      const id = `alliri-${xi}-${zi}`
      parts.push(
        box(
          `pallangga-${xi}-${zi}`,
          { name: 'pallangga', nameId: 'Pallangga', nameEn: 'Pad stone' },
          'pallangga',
          xi * 100 + zi,
          'batu',
          ['stoneHeight', 'stoneWidth', 'seatedOnStone', 'saorajaScale'],
          [x, layout.stoneHeight / 2, z],
          [DIMS.stoneWidth.value, layout.stoneHeight, DIMS.stoneWidth.value],
        ),
        box(
          id,
          { name: 'alliri', nameId: 'Alliri', nameEn: 'Post' },
          'alliri',
          xi * 100 + zi,
          'kayu',
          POST_DIMS,
          [x, layout.stoneHeight - seat + (layout.eaveY - layout.stoneHeight + seat) / 2, z],
          [sec, layout.eaveY - layout.stoneHeight + seat, sec],
        ),
      )
      joints.push({
        id: `tumpu-${xi}-${zi}`,
        kind: 'tumpu',
        mortise: `pallangga-${xi}-${zi}`,
        tenon: id,
        at: [x, layout.stoneHeight - seat / 2, z],
        halfExtents: [sec / 2, seat / 2, sec / 2],
      })
    })
  })

  /*
   * The pattolo, threaded through.
   *
   * Two levels of them: at the floor and at the eave. The joint is a mortise
   * cut *through* the post, so the engagement is the post's own width and not
   * a notch in its face — which is why `kind` is `pattolo` and not `takik`.
   */
  const beamDims: readonly DimKey[] = ['beamDepth', 'beamWidth', 'bayLength', 'bayDepth', 'threadedPosts']
  const levels: readonly { y: number; key: string }[] = [
    { y: layout.floorY, key: 'lantai' },
    { y: layout.eaveY, key: 'atas' },
  ]
  levels.forEach((level, li) => {
    layout.postsX.forEach((x, xi) => {
      const id = `pattolo-${level.key}-${xi}`
      parts.push(
        box(
          id,
          { name: 'pattolo', nameId: 'Pattolo', nameEn: 'Threaded beam' },
          'pattolo',
          li * 100 + xi,
          'kayu',
          beamDims,
          [x, level.y - beamD / 2, 0],
          [beamW, beamD, layout.halfZ * 2],
        ),
      )
      layout.postsZ.forEach((z, zi) => {
        const lo = Math.max(z - sec / 2, -layout.halfZ)
        const hi = Math.min(z + sec / 2, layout.halfZ)
        joints.push({
          id: `pattolo-${level.key}-${xi}-${zi}`,
          kind: 'pattolo',
          mortise: `alliri-${xi}-${zi}`,
          tenon: id,
          at: [x, level.y - beamD / 2, (lo + hi) / 2],
          halfExtents: [beamW / 2, (beamD * engage) / 2, (hi - lo) / 2],
        })
      })
    })
  })

  /* The floor of the ale bola, and the loft above it. */
  parts.push(
    box(
      'lantai',
      { name: 'lantai', nameId: 'Lantai ale bola', nameEn: 'Floor of the ale bola' },
      'lantai',
      0,
      'papan',
      ['floorThickness', 'awaBola', 'bayLength', 'bayDepth', 'threeWorlds'],
      [0, layout.floorY + board / 2, 0],
      [layout.halfX * 2 + sec, board, layout.halfZ * 2 + sec],
    ),
  )

  /* The walls of the middle world. */
  const wallT = DIMS.wallThickness.value
  const wallDims: readonly DimKey[] = ['aleBola', 'wallThickness', 'bayLength', 'bayDepth']
  let w = 0
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `rinring-x-${sx > 0 ? 'a' : 'b'}`,
        { name: 'rinring', nameId: 'Rinring', nameEn: 'Wall' },
        'rinring',
        w++,
        'papan',
        wallDims,
        [sx * (layout.halfX + sec / 2 - wallT / 2), layout.floorY + layout.aleBola / 2, 0],
        [wallT, layout.aleBola, layout.halfZ * 2 + sec],
      ),
    )
  }
  for (const sz of [-1, 1] as const) {
    parts.push(
      box(
        `rinring-z-${sz > 0 ? 'a' : 'b'}`,
        { name: 'rinring', nameId: 'Rinring', nameEn: 'Wall' },
        'rinring',
        w++,
        'papan',
        wallDims,
        [0, layout.floorY + layout.aleBola / 2, sz * (layout.halfZ + sec / 2 - wallT / 2)],
        [layout.halfX * 2 + sec - wallT * 2, layout.aleBola, wallT],
      ),
    )
  }

  /*
   * The plate, running the whole length of the roof.
   *
   * The rafters reach past the walls at both gable ends — that overhang is the
   * roof's, not the room's — so the outermost of them had nothing beneath.
   * The plate spans the full roof and the walls carry it, which is the third
   * time in this project an open or overhanging edge has needed one.
   */
  const plateD = beamD
  const plateW = beamW
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `balok-atas-${sx > 0 ? 'a' : 'b'}`,
        { name: 'balok', nameId: 'Balok atas', nameEn: 'Wall plate' },
        'rinring',
        100 + (sx > 0 ? 1 : 0),
        'kayu',
        ['beamDepth', 'beamWidth', 'eaveOversail', 'aleBola'],
        [sx * (layout.halfX + sec / 2 - plateW / 2), layout.eaveY - plateD / 2, 0],
        [plateW, plateD, layout.eaveHalfZ * 2],
      ),
    )
  }

  /*
   * The rakkeang, and it is where the rice is.
   *
   * Sized to the roof at its own height rather than to the plan below, for the
   * reason four houses have now taught: a floor inside a roof that takes its
   * width from the storey underneath sits in the rafters touching nothing.
   */
  const rise = layout.ridgeY - layout.eaveY
  const t = Math.min(1, Math.max(0, DIMS.rakkeang.value / Math.max(1e-9, rise)))
  parts.push(
    box(
      'rakkeang',
      { name: 'rakkeang', nameId: 'Rakkeang', nameEn: 'Rice loft' },
      'rakkeang',
      0,
      'papan',
      ['rakkeang', 'floorThickness', 'threeWorlds', 'ridgeRise'],
      [0, layout.eaveY + board / 2, 0],
      [layout.eaveHalfX * 2 * (1 - t * 0.35), board, layout.halfZ * 2],
    ),
  )

  return { parts, joints }
}
