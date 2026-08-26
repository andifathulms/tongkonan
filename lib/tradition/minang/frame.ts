/**
 * The rumah gadang, from the ground to the wall plate.
 *
 * Axes, because they are not the Toraja ones: X runs front (the halaman side,
 * negative) to rear, Z runs along the ridge, end to end, and the house mirrors
 * about z = 0. The shared convention — X front to rear, mirror plane at z = 0
 * — holds; what changed is that the ridge now lies along the mirror plane
 * instead of across it.
 *
 * Two things here have no counterpart in the first house. The walls lean
 * outward, so the body is wider at the plate than at the deck and a wall is a
 * rotated box rather than an upright one. And the floor is not one plane: the
 * Koto Piliang laras steps it up at both ends into anjuang, and the Bodi
 * Caniago laras does not, which is a claim about who sits where made in
 * timber. That switch is the reason this is the second house.
 */

import { clamp01, slopeLength } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import type { BoxPart, Joint, Layout, MeshPart, Part, Rules, Stage, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS, larasInfo, lanjarNames, ruangNames } from './rules'
import { ridgeCurve } from './ridge'

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const laras = larasInfo(rules.laras)

  const lanjarCount = Math.max(2, Math.round(DIMS.lanjarCount.value))
  const bodyLength = DIMS.ruangLength.value * rules.ruang
  const bodyDepth = DIMS.lanjarDepth.value * lanjarCount
  const postSection = DIMS.postSection.value
  const kolongHeight = DIMS.kolongHeight.value
  const wallHeight = DIMS.wallHeight.value

  // The lean, resolved once. Everything above the deck is measured from the
  // wall head rather than the wall foot, because the head is what the roof
  // actually lands on.
  const leanRad = (DIMS.wallLean.value * Math.PI) / 180
  const wallLeanRun = wallHeight * Math.tan(leanRad)

  const padTop = DIMS.padHeight.value
  const floorFrameY = padTop + kolongHeight
  const deckY = floorFrameY + DIMS.floorFrameDepth.value + DIMS.deckThickness.value
  const anjuangRise = laras.anjuang ? DIMS.anjuangRise.value : 0
  const anjuangY = deckY + anjuangRise
  const plateY = deckY + wallHeight

  const ridgeY = plateY + DIMS.ridgeRise.value - DIMS.ridgeSag.value
  const ridgeEndY = plateY + DIMS.ridgeRise.value + DIMS.ridgeEndRise.value
  const ridgeEndZ = bodyLength / 2 + DIMS.ridgeOverhang.value

  const eaveOversail = DIMS.eaveOversail.value
  const wallHeadX = bodyDepth / 2 + wallLeanRun
  const eaveHalfDepth = wallHeadX + eaveOversail
  const eaveY = plateY - DIMS.eaveDrop.value
  // The roof breaks where it crosses the wall head: one rank of rafters comes
  // steeply off the ridge to that line, a second runs out shallower to the
  // eave. The break is on the wall, not at an arbitrary fraction.
  const breakFraction = wallHeadX / eaveHalfDepth
  /*
   * The knee is derived, not declared.
   *
   * The tongkonan carries a `roofKneeDrop` dimension because nothing there
   * pins the break to a height. Here the rafters bear on the plate at the
   * wall head, so the height of the break is the top of the plate and the
   * drop that reaches it is arithmetic. Declaring it as well would have been
   * a guess competing with a fact — and the first version of this file did
   * declare it, which put the whole roof a hundred millimetres above the
   * plate it is supposed to sit on.
   */
  const plateTop = plateY + DIMS.plateDepth.value / 2
  const kneeDrop = clamp01((ridgeY - plateTop) / (ridgeY - eaveY))
  const knee = { at: breakFraction, drop: kneeDrop }

  const ruangEdges: number[] = []
  for (let i = 0; i <= rules.ruang; i++) {
    ruangEdges.push(-bodyLength / 2 + (bodyLength * i) / rules.ruang)
  }
  const lanjarEdges: number[] = []
  for (let i = 0; i <= lanjarCount; i++) {
    lanjarEdges.push(-bodyDepth / 2 + (bodyDepth * i) / lanjarCount)
  }

  // Posts stand on the grid. The outermost rows are set in by half a section
  // so the outer post face and the wall foot are flush.
  const inset = (edges: readonly number[]) =>
    edges.map((v, i) =>
      i === 0 ? v + postSection / 2 : i === edges.length - 1 ? v - postSection / 2 : v,
    )
  const postX = inset(lanjarEdges)
  const postZ = inset(ruangEdges)

  const slope = slopeLength(eaveHalfDepth, ridgeY - eaveY, knee)
  const exposure = DIMS.ijukCourseDepth.value * (1 - DIMS.ijukLap.value)
  const ijukCourses = Math.max(4, Math.ceil(slope / exposure))

  /*
   * The bilik fill the rear lanjar from one end, one ruang each, with no
   * gaps. That they are added one at a time as daughters marry is canon; the
   * direction and the absence of gaps are declared guesses, and they are the
   * reason this house is not mirror-symmetric in its partitions. The frame
   * is, and the invariant suite says which claim it is making.
   */
  const ruangCentre = (i: number) => (ruangEdges[i] ?? 0) + bodyLength / rules.ruang / 2
  const bilikZ: number[] = []
  for (let k = 0; k < rules.bilik; k++) {
    const index = rules.ruang - 2 - k
    if (index >= 1) bilikZ.push(ruangCentre(index))
  }

  /*
   * The gonjong. Four is the base form — a pair at each end of the ridge,
   * splaying front and rear — and the anjuang, where there are any, carry one
   * more each. The count follows the laras; nobody sets it directly, which is
   * the same move as the tongkonan's post count following its bay count.
   */
  const ridge = ridgeCurve({
    startZ: -ridgeEndZ,
    endZ: ridgeEndZ,
    lowY: ridgeY,
    endY: ridgeEndY,
    upsweep: DIMS.ridgeUpsweep.value,
  })
  const gonjongTips: Vec3[] = []
  for (const end of [1, -1] as const) {
    for (const splay of [-1, 1] as const) {
      gonjongTips.push([
        splay * DIMS.gonjongSplay.value,
        ridgeEndY + DIMS.gonjongRise.value,
        end * (ridgeEndZ + DIMS.gonjongLean.value * DIMS.gonjongRise.value),
      ])
    }
  }
  if (laras.anjuang) {
    for (const end of [1, -1] as const) {
      const z = end * (bodyLength / 2 - bodyLength / rules.ruang)
      const s = (z + ridgeEndZ) / (2 * ridgeEndZ)
      gonjongTips.push([
        0,
        ridge(s).y + DIMS.gonjongRise.value * DIMS.anjuangGonjongRise.value,
        z +
          end *
            DIMS.gonjongLean.value *
            DIMS.gonjongRise.value *
            DIMS.anjuangGonjongLean.value,
      ])
    }
  }

  return {
    rules,
    bodyLength,
    bodyDepth,
    kolongHeight,
    wallHeight,
    wallLeanRun,
    postX,
    postZ,
    postSection,
    lanjarCount,
    ruangEdges,
    ruangNames: ruangNames(rules),
    lanjarEdges,
    padTop,
    floorFrameY,
    deckY,
    anjuangY,
    anjuangRise,
    plateY,
    ridgeY,
    ridgeSag: DIMS.ridgeSag.value,
    ridgeEndZ,
    ridgeEndY,
    eaveHalfDepth,
    eaveY,
    breakFraction,
    kneeDrop,
    eaveOversail,
    gonjongTips,
    ijukCourses,
    bilikCount: bilikZ.length,
    bilikZ,
    dims: [],
  }
}

/** The ridge sampler for a resolved layout, `s` running 0 at one end to 1 at the other. */
export function ridgeOf(layout: Layout): (s: number) => { z: number; y: number } {
  return ridgeCurve({
    startZ: -layout.ridgeEndZ,
    endZ: layout.ridgeEndZ,
    lowY: layout.ridgeY,
    endY: layout.ridgeEndY,
    upsweep: DIMS.ridgeUpsweep.value,
  })
}

/** Where along the ridge a given Z falls, 0–1. */
export function sAtZ(layout: Layout, z: number): number {
  return clamp01((z + layout.ridgeEndZ) / (2 * layout.ridgeEndZ))
}

/* ── Part helpers ─────────────────────────────────────────────────────── */

interface Naming {
  readonly name: string
  readonly nameId: string
  readonly nameEn: string
}

/**
 * @param dims the dimensions that decided this part's size and place. Not
 *   optional and not decorative: `checkPartProvenance` fails the build on an
 *   empty list, because a part that claims to come from nowhere is a guess the
 *   provenance bar never counted.
 */
function box(
  id: string,
  naming: Naming,
  stage: Stage,
  order: number,
  material: BoxPart['material'],
  dims: readonly DimKey[],
  center: Vec3,
  size: Vec3,
  rotation?: Vec3,
): BoxPart {
  return rotation
    ? { kind: 'box', id, ...naming, stage, order, material, dims, center, size, rotation }
    : { kind: 'box', id, ...naming, stage, order, material, dims, center, size }
}

export function meshPart(
  id: string,
  naming: Naming,
  stage: Stage,
  order: number,
  material: MeshPart['material'],
  dims: readonly DimKey[],
  mesh: MeshData,
): MeshPart {
  return {
    kind: 'mesh',
    id,
    ...naming,
    stage,
    order,
    material,
    dims,
    positions: mesh.positions,
    normals: mesh.normals,
    uvs: mesh.uvs,
    indices: mesh.indices,
  }
}

/* ── The frame ────────────────────────────────────────────────────────── */

export interface FrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

export function buildFrame(layout: Layout): FrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.postSection
  const laras = larasInfo(layout.rules.laras)
  const lanjar = lanjarNames(layout.lanjarCount)

  /* Batu sandi, and the tonggak that stand on them. */
  const seat = DIMS.padHeight.value * DIMS.postSeat.value
  const postFootY = layout.padTop - seat
  const postHeadY = layout.floorFrameY + DIMS.floorFrameDepth.value * DIMS.tenonRun.value
  let stoneOrder = 0
  let postOrder = 0

  for (let iz = 0; iz < layout.postZ.length; iz++) {
    for (let ix = 0; ix < layout.postX.length; ix++) {
      const px = layout.postX[ix] ?? 0
      const pz = layout.postZ[iz] ?? 0
      const id = `${ix}-${iz}`

      parts.push(
        box(
          `batu-${id}`,
          { name: 'batu sandi', nameId: 'Batu sandi', nameEn: 'Pad stone' },
          'batu-sandi',
          stoneOrder++,
          'batu',
          ['padHeight', 'padDiameter', 'ruangLength', 'lanjarDepth', 'lanjarCount'],
          [px, layout.padTop - DIMS.padHeight.value / 2, pz],
          [DIMS.padDiameter.value, DIMS.padHeight.value, DIMS.padDiameter.value],
        ),
      )

      parts.push(
        box(
          `tonggak-${id}`,
          { name: 'tonggak', nameId: 'Tonggak', nameEn: 'Post' },
          'tonggak',
          postOrder++,
          'kayu',
          ['postSection', 'kolongHeight', 'padHeight', 'postSeat', 'tenonRun', 'floorFrameDepth'],
          [px, (postFootY + postHeadY) / 2, pz],
          [sec, postHeadY - postFootY, sec],
        ),
      )

      // The post foot sits in the dish of its stone; the head runs up into
      // the rasuak. No nails, so both engagements are checked.
      const grip = Math.min(sec, DIMS.padDiameter.value) * DIMS.jointEngagement.value
      joints.push({
        id: `sandi-${id}`,
        kind: 'sandi',
        mortise: `batu-${id}`,
        tenon: `tonggak-${id}`,
        at: [px, layout.padTop - seat / 2, pz],
        halfExtents: [grip / 2, (seat / 2) * 0.9, grip / 2],
      })
    }
  }

  /* Rasuak: along the ridge over each post line, and across it over each. */
  const fd = DIMS.floorFrameDepth.value
  const sillW = sec * DIMS.sillWidth.value
  const frameDims: readonly DimKey[] = [
    'floorFrameDepth',
    'sillWidth',
    'postSection',
    'ruangLength',
    'lanjarDepth',
    'lanjarCount',
    'kolongHeight',
    'padHeight',
  ]
  let rasuakOrder = 0

  for (let ix = 0; ix < layout.postX.length; ix++) {
    const px = layout.postX[ix] ?? 0
    parts.push(
      box(
        `rasuak-panjang-${ix}`,
        { name: 'rasuak', nameId: 'Rasuak memanjang', nameEn: 'Longitudinal beam' },
        'rasuak',
        rasuakOrder++,
        'kayu',
        frameDims,
        [px, layout.floorFrameY + fd / 2, 0],
        [sillW, fd, layout.bodyLength],
      ),
    )
  }
  for (let iz = 0; iz < layout.postZ.length; iz++) {
    const pz = layout.postZ[iz] ?? 0
    parts.push(
      box(
        `rasuak-lintang-${iz}`,
        { name: 'rasuak', nameId: 'Rasuak melintang', nameEn: 'Transverse beam' },
        'rasuak',
        rasuakOrder++,
        'kayu',
        frameDims,
        [0, layout.floorFrameY + fd / 2, pz],
        [layout.bodyDepth, fd, sillW],
      ),
    )
  }

  // Post heads peg into the longitudinal rasuak above them.
  for (let iz = 0; iz < layout.postZ.length; iz++) {
    for (let ix = 0; ix < layout.postX.length; ix++) {
      const px = layout.postX[ix] ?? 0
      const pz = layout.postZ[iz] ?? 0
      const run = fd * DIMS.tenonRun.value
      const grip = Math.min(sec, sillW) * DIMS.jointEngagement.value
      joints.push({
        id: `pasak-${ix}-${iz}`,
        kind: 'pasak',
        mortise: `rasuak-panjang-${ix}`,
        tenon: `tonggak-${ix}-${iz}`,
        at: [px, layout.floorFrameY + run / 2, pz],
        halfExtents: [grip / 2, (run / 2) * 0.9, grip / 2],
      })
    }
  }

  /* The deck. Boards run along the ridge, the length of the house. */
  const boardW = DIMS.deckBoardWidth.value
  const boards = Math.max(1, Math.round(layout.bodyDepth / boardW))
  const deckDims: readonly DimKey[] = [
    'deckThickness',
    'deckBoardWidth',
    'lanjarDepth',
    'lanjarCount',
    'ruangLength',
    'floorFrameDepth',
    'kolongHeight',
    'padHeight',
  ]
  for (let i = 0; i < boards; i++) {
    const x = -layout.bodyDepth / 2 + (layout.bodyDepth * (i + 0.5)) / boards
    parts.push(
      box(
        `lantai-${i}`,
        { name: 'papan lantai', nameId: 'Papan lantai', nameEn: 'Floor board' },
        'lantai',
        i,
        'papan',
        deckDims,
        [x, layout.deckY - DIMS.deckThickness.value / 2, 0],
        [layout.bodyDepth / boards, DIMS.deckThickness.value, layout.bodyLength],
      ),
    )
  }

  /* The anjuang: the end floors, raised. Absent entirely under Bodi Caniago. */
  if (laras.anjuang && layout.anjuangRise > 0) {
    const ruangSpan = layout.bodyLength / layout.rules.ruang
    const anjuangDims: readonly DimKey[] = [
      'anjuangRise',
      'deckThickness',
      'deckBoardWidth',
      'ruangLength',
      'lanjarDepth',
      'lanjarCount',
    ]
    let order = 0
    for (const end of [-1, 1] as const) {
      const near = end < 0 ? -layout.bodyLength / 2 : layout.bodyLength / 2 - ruangSpan
      const centre = near + ruangSpan / 2

      // Bearers first: the raised floor has to stand on something, and the
      // build-order check will say so if it does not.
      for (const t of [0, 1] as const) {
        parts.push(
          box(
            `anjuang-galang-${end > 0 ? 'a' : 'b'}-${t}`,
            { name: 'galang anjuang', nameId: 'Balok anjuang', nameEn: 'Anjuang bearer' },
            'anjuang',
            order++,
            'kayu',
            anjuangDims,
            [0, (layout.deckY + layout.anjuangY - DIMS.deckThickness.value) / 2, near + ruangSpan * t],
            [layout.bodyDepth, layout.anjuangRise - DIMS.deckThickness.value, sillW],
          ),
        )
      }

      const n = Math.max(1, Math.round(ruangSpan / boardW))
      for (let i = 0; i < n; i++) {
        const z = near + (ruangSpan * (i + 0.5)) / n
        parts.push(
          box(
            `anjuang-lantai-${end > 0 ? 'a' : 'b'}-${i}`,
            { name: 'lantai anjuang', nameId: 'Papan lantai anjuang', nameEn: 'Anjuang floor board' },
            'anjuang',
            order++,
            'papan',
            anjuangDims,
            [0, layout.anjuangY - DIMS.deckThickness.value / 2, z],
            [layout.bodyDepth, DIMS.deckThickness.value, ruangSpan / n],
          ),
        )
      }
    }
  }

  /*
   * The walls, leaning out.
   *
   * A leaning wall is a rotated box, and its length along its own axis is the
   * vertical height over the cosine of the lean — otherwise the wall reaches
   * the plate short and the roof lands on nothing.
   */
  const leanRad = (DIMS.wallLean.value * Math.PI) / 180
  const slant = layout.wallHeight / Math.cos(leanRad)
  const wallDims: readonly DimKey[] = [
    'wallHeight',
    'wallLean',
    'wallThickness',
    'ruangLength',
    'lanjarDepth',
    'lanjarCount',
    'deckThickness',
    'floorFrameDepth',
    'kolongHeight',
    'padHeight',
  ]
  const wallY = layout.deckY + layout.wallHeight / 2
  let wallOrder = 0

  // The long faces, one panel per ruang. The front is the halaman side and
  // carries the carving; the rear is boarded plainly behind the bilik.
  for (const face of [-1, 1] as const) {
    for (let i = 0; i < layout.rules.ruang; i++) {
      const z0 = layout.ruangEdges[i] ?? 0
      const z1 = layout.ruangEdges[i + 1] ?? 0
      parts.push(
        box(
          `dindiang-${face < 0 ? 'muko' : 'balakang'}-${i}`,
          {
            name: 'dindiang',
            nameId: face < 0 ? 'Dinding muka' : 'Dinding belakang',
            nameEn: face < 0 ? 'Front wall' : 'Rear wall',
          },
          'dindiang',
          wallOrder++,
          face < 0 ? 'ukiran' : 'papan',
          wallDims,
          [
            face * (layout.bodyDepth / 2 + layout.wallLeanRun / 2),
            wallY,
            (z0 + z1) / 2,
          ],
          [DIMS.wallThickness.value, slant, z1 - z0],
          // Rotating about Z tips the top toward -X for a positive angle, so
          // the sign is flipped to make each face lean away from the middle.
          [0, 0, -face * leanRad],
        ),
      )
    }
  }

  // The gable ends, one panel per lanjar, leaning the same way about X.
  for (const end of [-1, 1] as const) {
    for (let i = 0; i < layout.lanjarCount; i++) {
      const x0 = layout.lanjarEdges[i] ?? 0
      const x1 = layout.lanjarEdges[i + 1] ?? 0
      parts.push(
        box(
          `dindiang-ujung-${end > 0 ? 'a' : 'b'}-${i}`,
          {
            name: 'dindiang ujung',
            nameId: `Dinding ujung, ${lanjar[i] ?? 'lanjar'}`,
            nameEn: `End wall, ${lanjar[i] ?? 'lanjar'}`,
          },
          'dindiang',
          wallOrder++,
          'anyaman',
          wallDims,
          [
            (x0 + x1) / 2,
            wallY,
            end * (layout.bodyLength / 2 + layout.wallLeanRun / 2),
          ],
          [x1 - x0, slant, DIMS.wallThickness.value],
          [end * leanRad, 0, 0],
        ),
      )
    }
  }

  /*
   * The bilik: partitions in the rear lanjar, one room per married daughter.
   *
   * These are the parts that break the house's mirror symmetry, and they are
   * meant to. A tally that grows from one end is a fact about the household,
   * so the symmetry check is made over the frame and says so rather than
   * being softened until it holds over everything.
   */
  const rearInner = layout.lanjarEdges[layout.lanjarCount - 1] ?? 0
  const rearOuter = layout.lanjarEdges[layout.lanjarCount] ?? 0
  const ruangSpan = layout.bodyLength / layout.rules.ruang
  const bilikDims: readonly DimKey[] = [
    'wallThickness',
    'wallHeight',
    'ruangLength',
    'lanjarDepth',
    'lanjarCount',
    'bilikFillOrder',
  ]
  layout.bilikZ.forEach((z, k) => {
    parts.push(
      box(
        `bilik-muko-${k}`,
        { name: 'dindiang bilik', nameId: `Dinding bilik ${k + 1}`, nameEn: `Bilik front wall ${k + 1}` },
        'bilik',
        k * 2,
        'papan',
        bilikDims,
        [rearInner, wallY, z],
        [DIMS.wallThickness.value, layout.wallHeight, ruangSpan],
      ),
    )
    parts.push(
      box(
        `bilik-sekat-${k}`,
        { name: 'sekat bilik', nameId: `Sekat bilik ${k + 1}`, nameEn: `Bilik partition ${k + 1}` },
        'bilik',
        k * 2 + 1,
        'papan',
        bilikDims,
        [(rearInner + rearOuter) / 2, wallY, z - ruangSpan / 2],
        [rearOuter - rearInner, layout.wallHeight, DIMS.wallThickness.value],
      ),
    )
  })

  return { parts, joints }
}
