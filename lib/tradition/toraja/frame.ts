/**
 * Layout resolution and everything below the roof.
 *
 * `resolveLayout` turns the rules into metres once, and every part after that
 * reads from the layout rather than recomputing. That is what keeps a
 * dimension from escaping the provenance layer: if a number is not in the
 * layout, it should not exist.
 */

import { DIMS, bayNames, rankInfo } from './rules'
import type { DimKey } from './rules'
import {
  clamp01,
  slopeLength,
  lerp,
  mergeMeshes,
  mirrorZ,
  tubeMesh,
} from '@/lib/core/geometry'
import { ridgeCurve } from './ridge'
import type { MeshData } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import type { Joint, Layout, Part, Rules, TorajaKinds, Vec3 } from './types'

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * How much of the ridge's rise has happened by quarter-span. Kept low so the
 * belly stays long and shallow and the upsweep sits out at the prows.
 */
// The ridge upsweep is a declared dimension; see DIMS.ridgeUpsweep.

export function resolveLayout(rules: Rules): Layout {
  const rank = rankInfo(rules.rank)
  const s = rank.scale.value

  const bodyLength = DIMS.bayLength.value * rules.bays * s
  const bodyWidth = DIMS.bodyWidth.value * s
  const postSection = DIMS.postSection.value * s
  const kolongHeight = DIMS.kolongHeight.value * s
  const wallHeight = DIMS.wallHeight.value * s

  const padTop = DIMS.padHeight.value * s
  const floorFrameY = padTop + kolongHeight
  const deckY = floorFrameY + DIMS.floorFrameDepth.value * s + DIMS.deckThickness.value * s
  const plateY = deckY + wallHeight

  const ridgeRise = DIMS.ridgeRise.value * s
  const ridgeSag = DIMS.ridgeSag.value * s
  const ridgeY = plateY + ridgeRise - ridgeSag
  const prowOverhang = DIMS.prowOverhang.value * s
  const frontProwX = -(bodyLength / 2 + prowOverhang)
  const rearProwX = bodyLength / 2 + prowOverhang
  const frontProwY = plateY + ridgeRise + DIMS.frontProwRise.value * s
  const rearProwY = plateY + ridgeRise + DIMS.rearProwRise.value * s

  const eaveOversail = DIMS.eaveOversail.value * s
  const eaveHalfWidth = bodyWidth / 2 + eaveOversail
  const eaveY = plateY - DIMS.eaveDrop.value * s
  // The roof crosses the wall plate here. The rafters break at this line: one
  // rank runs steeply from the ridge down to it, a second runs out from it to
  // the eave, and the plate is what they meet on.
  const outerPostZ = bodyWidth / 2 - postSection / 2
  const breakFraction = outerPostZ / eaveHalfWidth
  const kneeDrop = DIMS.roofKneeDrop.value
  const knee = { at: breakFraction, drop: kneeDrop }

  // Bay boundaries run front (north, negative X) to rear (south).
  const bayEdges: number[] = []
  for (let i = 0; i <= rules.bays; i++) {
    bayEdges.push(-bodyLength / 2 + (bodyLength * i) / rules.bays)
  }

  // Post rows stand on the bay boundaries, so the post count follows the
  // declared bay count rather than being chosen separately.
  const postX = bayEdges.slice()
  // Two posts per transverse row, symmetric about the ridge plane. Their
  // centres sit inside the wall line by half a section, so the wall face and
  // the outer post face are flush.
  const postZ = [-outerPostZ, outerPostZ]

  // How many ijuk courses it takes to clothe one slope at mid-span, given the
  // lap. Rounded up: a short last course is fine, a bare strip is not.
  const slope = slopeLength(eaveHalfWidth, ridgeY - eaveY, knee)
  const exposure = DIMS.ijukCourseDepth.value * s * (1 - DIMS.ijukLap.value)
  const ijukCourses = Math.max(4, Math.ceil(slope / exposure))

  // The tulak somba stands out under the front prow, roughly where the
  // cantilever's moment needs it rather than at the tip.
  const tulakSombaX = frontProwX + prowOverhang * DIMS.tulakSombaSet.value

  return {
    rules,
    bodyLength,
    bodyWidth,
    kolongHeight,
    wallHeight,
    postX,
    postZ,
    postSection,
    bayEdges,
    bayNames: bayNames(rules.bays),
    padTop,
    floorFrameY,
    deckY,
    plateY,
    ridgeY,
    ridgeSag,
    frontProwX,
    frontProwY,
    rearProwX,
    rearProwY,
    eaveHalfWidth,
    eaveY,
    breakFraction,
    kneeDrop,
    eaveOversail,
    ijukCourses,
    hornCount: rules.horns,
    tulakSombaX,
    dims: [],
  }
}

/**
 * The ridge sampler for a resolved layout, `s` running 0 at the front tip to
 * 1 at the rear. The roof builds its stations from this; the tulak somba
 * finds its own height from it, so the prop always meets what it props.
 */
export function ridgeOf(layout: Layout): (s: number) => { x: number; y: number } {
  return ridgeCurve({
    frontX: layout.frontProwX,
    rearX: layout.rearProwX,
    lowY: layout.ridgeY,
    frontTipY: layout.frontProwY,
    rearTipY: layout.rearProwY,
    upsweep: DIMS.ridgeUpsweep.value,
  })
}

/** Where along the ridge parameter a given world X falls. */
export function sAtX(layout: Layout, x: number): number {
  return clamp01((x - layout.frontProwX) / (layout.rearProwX - layout.frontProwX))
}

/* ── Part helpers ─────────────────────────────────────────────────────── */

/*
 * The two ways to be a part, bound to this tradition.
 *
 * The builders are in `lib/core/parts.ts`. Both generators had them written
 * out, identical but for the type they were bound to, which is what an
 * extraction is supposed to look like.
 */
const builders = partBuilders<TorajaKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── The frame ────────────────────────────────────────────────────────── */

export interface FrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

export function buildFrame(layout: Layout): FrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = rankInfo(layout.rules.rank).scale.value
  const sec = layout.postSection
  const padH = DIMS.padHeight.value * s
  const padD = DIMS.padDiameter.value * s
  const frameDepth = DIMS.floorFrameDepth.value * s
  const deckT = DIMS.deckThickness.value * s
  const wallT = DIMS.wallThickness.value * s

  /* Pad stones. They go down first: the posts stand on them and are never
     buried, which is why a tongkonan can be dismantled and moved. */
  let n = 0
  for (const x of layout.postX) {
    for (const z of layout.postZ) {
      parts.push(
        box(
          `batu-${n}`,
          { name: 'batu umpak', nameId: 'Batu umpak', nameEn: 'Pad stone' },
          'batu',
          n,
          'batu',
          ['padHeight', 'padDiameter', 'bayLength', 'bodyWidth', 'postsPerRow'],
          [x, padH / 2, z],
          [padD, padH, padD],
        ),
      )
      n++
    }
  }

  /* A'riri — the posts. Raised in transverse pairs, symmetric about z = 0.
     The foot seats into the dished top of the stone rather than balancing on
     its face, so the post is located rather than merely resting. */
  const seat = padH * DIMS.postSeat.value
  let p = 0
  for (const x of layout.postX) {
    for (const z of layout.postZ) {
      const id = `ariri-${p}`
      const foot = layout.padTop - seat
      // The head runs up into the sill: a peg needs a tenon to pass through,
      // and a post that stops at the underside has nothing to be pegged to.
      const head = layout.floorFrameY + frameDepth * DIMS.tenonRun.value
      parts.push(
        box(
          id,
          { name: "a'riri", nameId: 'Tiang kolong', nameEn: 'Underfloor post' },
          'ariri',
          p,
          'kayu',
          [
            'postSection',
            'kolongHeight',
            'padHeight',
            'postSeat',
            'floorFrameDepth',
            'tenonRun',
            'bayLength',
            'bodyWidth',
            'postsPerRow',
          ],
          [x, (foot + head) / 2, z],
          [sec, head - foot, sec],
        ),
      )
      // A seat, not a peg: the engagement is the depth of the dish.
      joints.push({
        id: `tumpu-${p}`,
        kind: 'tumpu',
        mortise: `batu-${p}`,
        tenon: id,
        at: [x, layout.padTop - seat / 2, z],
        halfExtents: [sec / 2, seat / 2, sec / 2],
      })
      p++
    }
  }

  /* Roro — the longitudinal sills, carried on the post heads. */
  const sillW = sec * DIMS.sillWidth.value
  layout.postZ.forEach((z, i) => {
    parts.push(
      box(
        `roro-${i}`,
        { name: 'roro', nameId: 'Balok memanjang', nameEn: 'Longitudinal sill' },
        'rangka-lantai',
        i,
        'kayu',
        ['floorFrameDepth', 'sillWidth', 'postSection', 'bayLength', 'bodyWidth'],
        [0, layout.floorFrameY + frameDepth / 2, z],
        // Overruns the end posts by a section: a corner peg has to be inside
        // timber on both sides of the joint, not right at the cut end.
        [layout.bodyLength + sec, frameDepth, sillW],
      ),
    )
  })

  /* Pata' — the transverse joists, one on every post row. Each post head is
     pegged into the sill above it; there are no nails in the house, so every
     one of these has to be a real engagement the invariant can check. */
  layout.postX.forEach((x, i) => {
    parts.push(
      box(
        `pata-${i}`,
        { name: "pata'", nameId: 'Balok melintang', nameEn: 'Transverse joist' },
        'rangka-lantai',
        layout.postZ.length + i,
        'kayu',
        ['floorFrameDepth', 'sillWidth', 'postSection', 'bayLength', 'bodyWidth'],
        [x, layout.floorFrameY + frameDepth / 2, 0],
        [sillW, frameDepth, layout.bodyWidth + sec],
      ),
    )
    layout.postZ.forEach((z, j) => {
      joints.push({
        id: `pasak-lantai-${i}-${j}`,
        kind: 'pasak',
        mortise: `roro-${j}`,
        tenon: `ariri-${i * layout.postZ.length + j}`,
        at: [x, layout.floorFrameY + frameDepth * 0.4, z],
        halfExtents: [sec / 2, frameDepth * DIMS.jointEngagement.value, sillW / 2],
      })
    })
  })

  /* The deck. Boards run north–south, the way you walk the house. */
  const boardW = DIMS.deckBoardWidth.value * s
  const boards = Math.max(4, Math.round(layout.bodyWidth / boardW))
  for (let i = 0; i < boards; i++) {
    const z = -layout.bodyWidth / 2 + (layout.bodyWidth * (i + 0.5)) / boards
    parts.push(
      box(
        `lantai-${i}`,
        { name: 'papan lantai', nameId: 'Papan lantai', nameEn: 'Floor board' },
        'lantai',
        i,
        'papan',
        ['deckThickness', 'deckBoardWidth', 'bodyWidth', 'bayLength'],
        [0, layout.deckY - deckT / 2, z],
        [layout.bodyLength, deckT, layout.bodyWidth / boards],
      ),
    )
  }

  /* Rinding — the walls. One panel per bay per side, plus the two ends.
     These are the surfaces that later carry pa'ssura.
     Known simplification: the real body leans outward toward the plate. It is
     modelled vertical here, and that is a shape claim the sources would not
     support at a specific angle, so it is left flat rather than guessed. */
  const wallH = layout.plateY - layout.deckY
  const wallCY = layout.deckY + wallH / 2
  for (let b = 0; b < layout.rules.bays; b++) {
    const x0 = layout.bayEdges[b] ?? 0
    const x1 = layout.bayEdges[b + 1] ?? 0
    const cx = (x0 + x1) / 2
    const len = Math.abs(x1 - x0)
    layout.postZ.forEach((z, j) => {
      const side = z < 0 ? -1 : 1
      parts.push(
        box(
          `rinding-${b}-${j}`,
          { name: 'rinding', nameId: `Dinding ${layout.bayNames[b] ?? ''}`.trim(), nameEn: 'Wall panel' },
          'dinding',
          b * 2 + j,
          'papan',
          ['wallThickness', 'wallHeight', 'bayLength', 'bodyWidth'],
          [cx, wallCY, side * (layout.bodyWidth / 2 - wallT / 2)],
          [len, wallH, wallT],
        ),
      )
    })
  }
  /* The wall plate. The rafters bear on this, so it is the piece that makes
     the roof's load path real rather than implied — and it is what the eave
     has to clear on its way past the body. */
  const plateD = DIMS.plateDepth.value * s
  const plateW = DIMS.plateWidth.value * s
  layout.postZ.forEach((z, j) => {
    parts.push(
      box(
        `tumpuan-${j}`,
        { name: 'balok tumpuan', nameId: 'Balok tumpuan', nameEn: 'Wall plate' },
        'dinding',
        layout.rules.bays * 2 + j,
        'kayu',
        ['plateDepth', 'plateWidth', 'wallHeight', 'bayLength', 'bodyWidth'],
        [0, layout.plateY, z],
        [layout.bodyLength, plateD, plateW],
      ),
    )
  })

  const endOrder = layout.rules.bays * 2 + layout.postZ.length
  ;[-1, 1].forEach((side, i) => {
    parts.push(
      box(
        `rinding-ujung-${i}`,
        {
          name: side < 0 ? "indo' para" : 'rinding sumbung',
          nameId: side < 0 ? 'Papan muka (utara)' : 'Papan belakang (selatan)',
          nameEn: side < 0 ? 'Front gable board (north)' : 'Rear gable board (south)',
        },
        'dinding',
        endOrder + i,
        // The front gable is the carved face when rank permits it; the rear
        // stays plain even on a layuk.
        side < 0 && rankInfo(layout.rules.rank).carvedGable ? 'ukiran' : 'papan',
        ['wallThickness', 'wallHeight', 'bodyWidth', 'bayLength'],
        [side * (layout.bodyLength / 2 - wallT / 2), wallCY, 0],
        [wallT, wallH, layout.bodyWidth],
      ),
    )
  })

  /* Tulak somba — the front post that carries the cantilevered prow. It finds
     its own top from the ridge curve, so the prop always meets what it props. */
  const ridge = ridgeOf(layout)
  const tsSec = DIMS.tulakSombaSection.value * s
  const tsTop = ridge(sAtX(layout, layout.tulakSombaX)).y
  const tsFoot = layout.padTop - seat
  const tsH = tsTop - tsFoot
  // Laid in this stage rather than with the house stones. The tulak somba goes
  // up long after the body, and its stone is set when the post is raised — so
  // the joint between them does not jump five stages.
  parts.push(
    box(
      'batu-tulak-somba',
      { name: 'batu umpak', nameId: 'Batu umpak tulak somba', nameEn: 'Tulak somba pad stone' },
      'tulak-somba',
      0,
      'batu',
      ['padHeight', 'padDiameter', 'prowOverhang', 'tulakSombaSet', 'bayLength'],
      [layout.tulakSombaX, padH / 2, 0],
      [padD * 1.25, padH, padD * 1.25],
    ),
  )
  parts.push(
    box(
      'tulak-somba',
      { name: 'tulak somba', nameId: 'Tiang muka', nameEn: 'Front prow post' },
      'tulak-somba',
      1,
      rankInfo(layout.rules.rank).carvedGable ? 'ukiran' : 'kayu',
      [
        'tulakSombaSection',
        'prowOverhang',
        'tulakSombaSet',
        'ridgeRise',
        'ridgeSag',
        'ridgeUpsweep',
        'frontProwRise',
        'kolongHeight',
        'padHeight',
      ],
      [layout.tulakSombaX, tsFoot + tsH / 2, 0],
      [tsSec, tsH, tsSec],
    ),
  )
  joints.push({
    id: 'tumpu-tulak-somba',
    kind: 'tumpu',
    mortise: 'batu-tulak-somba',
    tenon: 'tulak-somba',
    at: [layout.tulakSombaX, layout.padTop - seat / 2, 0],
    halfExtents: [tsSec / 2, seat / 2, tsSec / 2],
  })

  return { parts, joints }
}

/* ── Horns ────────────────────────────────────────────────────────────── */

/**
 * The horns.
 *
 * A count of funerals the house has held, mounted on the tulak somba and read
 * from the ground by anyone walking up. They are generated as swept tubes
 * because a horn is a curve with a shrinking radius — stacked boxes would
 * lose the only property that makes it read as a horn.
 */
export function buildHorns(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  if (layout.hornCount <= 0) return parts

  const s = rankInfo(layout.rules.rank).scale.value
  const spread = DIMS.hornSpread.value * s
  const tsSec = DIMS.tulakSombaSection.value * s
  // The column hangs from the plate line downward. That is the band a person
  // standing in the courtyard can actually read, and reading it is the whole
  // function of the horns — a tally mounted out of sight would be a decoration.
  const first = layout.plateY
  const lowest = DIMS.hornColumnFoot.value * s
  const available = first - lowest
  // Once the post runs out, the horns pack closer rather than being silently
  // dropped: the count is the point of them.
  const spacing = Math.min(
    DIMS.hornSpacing.value * s,
    available / Math.max(1, layout.hornCount),
  )
  const faceX = layout.tulakSombaX - tsSec / 2

  for (let i = 0; i < layout.hornCount; i++) {
    const y = first - i * spacing
    if (y < lowest) break
    // Horns get slightly smaller down the column: the oldest are at the top.
    const scale = lerp(1, DIMS.hornTaper.value, clamp01(i / Math.max(1, layout.hornCount - 1)))
    const right = hornMesh(faceX, y, spread * scale)
    parts.push(
      meshPart(
        `tanduk-${i}`,
        {
          name: 'tanduk',
          nameId: `Tanduk ke-${layout.hornCount - i}`,
          nameEn: `Horn ${layout.hornCount - i}`,
        },
        'tanduk',
        i,
        'tanduk',
        [
          'hornSpread',
          'hornSpacing',
          'hornTaper',
          'hornColumnFoot',
          'hornsAreTally',
          'tulakSombaSection',
          'wallHeight',
        ],
        mergeMeshes([right, mirrorZ(right)]),
      ),
    )
  }
  return parts
}

/** One horn, sweeping out and up from the face of the tulak somba. */
function hornMesh(baseX: number, baseY: number, spread: number): MeshData {
  const steps = 14
  const path: Vec3[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    path.push([
      baseX - spread * 0.16 * t,
      baseY + spread * 0.52 * (1 - Math.cos(t * 1.85)),
      (spread / 2) * Math.sin(t * 1.32),
    ])
  }
  const r0 = spread * 0.105
  return tubeMesh(path, (t) => r0 * Math.pow(1 - t, 0.7) + spread * 0.006, 10, 0.35)
}
