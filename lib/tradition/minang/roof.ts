/**
 * The roof, the singok that closes its ends, and the gonjong that crown it.
 *
 * The core's `sweepSurface` sweeps a transverse section along a ridge that
 * runs on X, with the half-width measured on Z. This house's ridge runs on Z.
 * Rather than widen the primitive with an axis flag on the strength of one
 * example, the surface is built in the primitive's own space and then turned
 * a quarter turn — `swapXZ` below. If a third house also has to do this, the
 * axis belongs in `SweepOptions`; two is not yet a pattern.
 *
 * What genuinely did not fit is the ends. The tongkonan's roof tapers to a
 * blade at each prow, so its stations narrow; this roof runs at full width to
 * both ends and stops against a flat gable, and the upsweep is carried by
 * four separate spires standing on the ridge rather than by the ridge itself
 * becoming the point. The gonjong are parts, not a profile.
 */

import {
  clamp01,
  computeNormals,
  emptyMesh,
  lerp,
  mergeMeshes,
  sweepSurface,
  tubeMesh,
} from '@/lib/core/geometry'
import type { MeshData, Station } from '@/lib/core/geometry'
import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import type { BoxPart, Joint, Layout, Part, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS, larasInfo } from './rules'
import { gonjongPath } from './ridge'
import { meshPart, ridgeOf, sAtZ } from './frame'

const STATIONS = 41

/**
 * A quarter turn about Y, applied to a finished mesh.
 *
 * Swapping two axes is a reflection, so the triangle winding has to be
 * reversed or every face would end up pointing into the roof. The normals are
 * recomputed rather than swapped for the same reason.
 */
export function swapXZ(mesh: MeshData): MeshData {
  const out: MeshData = {
    positions: mesh.positions.slice(),
    normals: mesh.normals.slice(),
    uvs: mesh.uvs.slice(),
    indices: [],
  }
  for (let i = 0; i < out.positions.length; i += 3) {
    const x = out.positions[i] ?? 0
    out.positions[i] = out.positions[i + 2] ?? 0
    out.positions[i + 2] = x
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    out.indices.push(mesh.indices[i + 2] ?? 0, mesh.indices[i + 1] ?? 0, mesh.indices[i] ?? 0)
  }
  computeNormals(out)
  return out
}

/**
 * Stations along the ridge.
 *
 * `Station.x` is the position along the sweep, which for this house is Z. The
 * name comes from the primitive and the turn happens in `swapXZ`; the
 * alternative was to fork the primitive, which would have been worse.
 */
export function roofStations(layout: Layout, count = STATIONS): readonly Station[] {
  const ridge = ridgeOf(layout)
  const out: Station[] = []
  for (let i = 0; i < count; i++) {
    const s = i / (count - 1)
    const { z, y } = ridge(s)
    out.push({
      x: z,
      ridgeY: y,
      halfWidth: layout.eaveHalfDepth,
      // The eave is level. Only the ridge sweeps, which is why the roof
      // planes twist rather than simply tilt.
      eaveY: layout.eaveY,
    })
  }
  return out
}

/* ── The frame ────────────────────────────────────────────────────────── */

export interface RoofFrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

function rafter(
  id: string,
  nameId: string,
  nameEn: string,
  order: number,
  from: readonly [number, number],
  to: readonly [number, number],
  z: number,
  dims: readonly DimKey[],
): BoxPart {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  return {
    kind: 'box',
    id,
    name: 'kasau',
    nameId,
    nameEn,
    stage: 'rangka-atap',
    order,
    material: 'kayu',
    dims,
    center: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z],
    size: [Math.hypot(dx, dy), DIMS.rafterDepth.value, DIMS.rafterWidth.value],
    rotation: [0, 0, Math.atan2(dy, dx)],
  }
}

/** The polygon of the roof seen end-on: eave, knee, ridge, knee, eave. */
function gableProfile(layout: Layout, z: number): (readonly [number, number])[] {
  const ridgeYz = ridgeOf(layout)(sAtZ(layout, z)).y
  const wallHeadX = layout.eaveHalfDepth * layout.breakFraction
  const kneeY = ridgeYz - (ridgeYz - layout.eaveY) * layout.kneeDrop
  // Counter-clockwise seen from +Z, so the front face of the prism points out.
  return [
    [-layout.eaveHalfDepth, layout.eaveY],
    [layout.eaveHalfDepth, layout.eaveY],
    [wallHeadX, kneeY],
    [0, ridgeYz],
    [-wallHeadX, kneeY],
  ]
}

/** A convex profile extruded a short way along Z. */
function prismZ(
  profile: readonly (readonly [number, number])[],
  z: number,
  thickness: number,
): MeshData {
  const mesh = emptyMesh()
  const n = profile.length
  const half = thickness / 2
  for (const side of [1, -1] as const) {
    const base = mesh.positions.length / 3
    for (const p of profile) {
      mesh.positions.push(p[0], p[1], z + side * half)
      mesh.normals.push(0, 0, side)
      mesh.uvs.push(p[0], p[1])
    }
    for (let i = 1; i < n - 1; i++) {
      if (side > 0) mesh.indices.push(base, base + i, base + i + 1)
      else mesh.indices.push(base, base + i + 1, base + i)
    }
  }
  const front = 0
  const back = n
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    mesh.indices.push(front + i, back + i, front + j)
    mesh.indices.push(front + j, back + i, back + j)
  }
  computeNormals(mesh)
  return mesh
}

export function buildRoofFrame(layout: Layout): RoofFrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const ridge = ridgeOf(layout)
  const stations = roofStations(layout)
  const wallHeadX = layout.eaveHalfDepth * layout.breakFraction
  const knee = { at: layout.breakFraction, drop: layout.kneeDrop }
  let order = 0

  /* The wall plate. Everything above lands on this. */
  const plateDims: readonly DimKey[] = [
    'plateDepth',
    'plateWidth',
    'wallHeight',
    'wallLean',
    'ruangLength',
    'lanjarDepth',
    'lanjarCount',
  ]
  for (const side of [-1, 1] as const) {
    parts.push({
      kind: 'box',
      id: `tumpuan-${side > 0 ? 'a' : 'b'}`,
      name: 'balok tumpuan',
      nameId: 'Balok tumpuan',
      nameEn: 'Wall plate',
      stage: 'rangka-atap',
      order: order++,
      material: 'kayu',
      dims: plateDims,
      center: [side * wallHeadX, layout.plateY, 0],
      size: [DIMS.plateWidth.value, DIMS.plateDepth.value, layout.bodyLength],
    })
  }

  /*
   * Rafters, in two ranks either side of the knee.
   *
   * The body rafters go up before the ridge beam, because the ridge has
   * nothing to rest on until they are there; the rafters over the two
   * overhangs go up after it, because they have nothing to rest on until it
   * is. The build-order invariant reads that sequence and will refuse either
   * one placed the other way round.
   */
  const rafterDims: readonly DimKey[] = [
    'rafterWidth',
    'rafterDepth',
    'raftersPerRuang',
    'ridgeRise',
    'ridgeSag',
    'ridgeEndRise',
    'plateDepth',
    'eaveOversail',
    'eaveDrop',
    'wallLean',
    'wallHeight',
  ]
/*
   * Which rank goes up first says which way the load runs.
   *
   * Over the body the lower rank lands on the plate and the upper meets it at
   * the knee, so the roof is carried from below. Over the two overhangs there
   * is no plate: the upper rank hangs off the ridge and the lower hangs off
   * that, so the roof is carried from above. The build-order invariant reads
   * exactly this and refused the overhang until it was written down — which is
   * the check doing what it is for, since a cantilever built from the bottom
   * up is a cantilever with nothing holding it.
   */
  const placeRafters = (zs: readonly number[], tag: string, upperFirst: boolean) => {
    zs.forEach((z, i) => {
      const ridgeYz = ridge(sAtZ(layout, z)).y
      const kneeY = ridgeYz - (ridgeYz - layout.eaveY) * layout.kneeDrop
      for (const side of [-1, 1] as const) {
        const upper = () =>
          rafter(
            `kasau-${tag}-atas-${i}-${side > 0 ? 'a' : 'b'}`,
            'Kasau atas',
            'Upper rafter',
            order++,
            [0, ridgeYz],
            [side * wallHeadX, kneeY],
            z,
            rafterDims,
          )
        const lower = () =>
          rafter(
            `kasau-${tag}-bawah-${i}-${side > 0 ? 'a' : 'b'}`,
            'Kasau bawah',
            'Lower rafter',
            order++,
            [side * wallHeadX, kneeY],
            [side * layout.eaveHalfDepth, layout.eaveY],
            z,
            rafterDims,
          )
        if (upperFirst) parts.push(upper(), lower())
        else parts.push(lower(), upper())
      }
    })
  }

  const perRuang = Math.max(1, Math.round(DIMS.raftersPerRuang.value))
  const bodyCount = layout.rules.ruang * perRuang
  const bodyZs: number[] = []
  for (let i = 0; i < bodyCount; i++) {
    bodyZs.push(-layout.bodyLength / 2 + (layout.bodyLength * (i + 0.5)) / bodyCount)
  }
  placeRafters(bodyZs, 'badan', false)

  /* The ridge beam, following the curve the rafters were cut to. */
  const ridgePath: Vec3[] = []
  for (const st of stations) ridgePath.push([0, st.ridgeY, st.x])
  parts.push(
    meshPart(
      'bubungan',
      { name: 'bubungan', nameId: 'Balok bubungan', nameEn: 'Ridge beam' },
      'rangka-atap',
      order++,
      'kayu',
      ['ridgeBeamRadius', 'ridgeRise', 'ridgeSag', 'ridgeEndRise', 'ridgeOverhang', 'ridgeUpsweep'],
      tubeMesh(ridgePath, () => DIMS.ridgeBeamRadius.value, 8, 0.5),
    ),
  )

  const endCount = Math.max(2, Math.round(DIMS.raftersAtEnds.value))
  const endZs: number[] = []
  for (let i = 0; i < endCount / 2; i++) {
    const t = (i + 1) / (endCount / 2 + 1)
    const reach = layout.ridgeEndZ - layout.bodyLength / 2
    endZs.push(layout.bodyLength / 2 + reach * t, -(layout.bodyLength / 2 + reach * t))
  }
  placeRafters(endZs, 'ujung', true)

  /* Purlins: bamboo, one above the knee and one below, each side. */
  for (const side of [-1, 1] as const) {
    for (const [tag, f] of [
      ['atas', layout.breakFraction * DIMS.purlinAboveKnee.value],
      [
        'bawah',
        layout.breakFraction + (1 - layout.breakFraction) * DIMS.purlinBelowKnee.value,
      ],
    ] as const) {
      const path: Vec3[] = stations.map((st) => {
        const depth = st.ridgeY - st.eaveY
        const drop = f <= knee.at ? (knee.drop * f) / knee.at : knee.drop + ((1 - knee.drop) * (f - knee.at)) / (1 - knee.at)
        return [side * st.halfWidth * f, st.ridgeY - depth * drop, st.x]
      })
      parts.push(
        meshPart(
          `gording-${tag}-${side > 0 ? 'a' : 'b'}`,
          { name: 'gording', nameId: 'Gording', nameEn: 'Purlin' },
          'rangka-atap',
          order++,
          'bambu',
          ['purlinRadius', 'purlinAboveKnee', 'purlinBelowKnee', 'plateDepth', 'eaveOversail'],
          tubeMesh(path, () => DIMS.purlinRadius.value, 7, 0.4),
        ),
      )
    }
  }

  /* The boarding the thatch beds on. */
  const bed = DIMS.rafterDepth.value * DIMS.sheathingOffset.value
  const sheathing = mergeMeshes(
    ([1, -1] as const).map((side) =>
      swapXZ(
        sweepSurface(stations, {
          side,
          across: 6,
          knee,
          uvScale: 0.7,
          offsetAt: () => bed,
        }),
      ),
    ),
  )
  parts.push(
    meshPart(
      'papan-atap',
      { name: 'papan atap', nameId: 'Papan atap', nameEn: 'Roof boarding' },
      'rangka-atap',
      order++,
      'papan',
      ['sheathingOffset', 'rafterDepth', 'plateDepth', 'eaveOversail', 'eaveDrop'],
      sheathing,
    ),
  )

  /* The singok: the gable closed off at each end of the body. */
  for (const end of [1, -1] as const) {
    const z = (end * layout.bodyLength) / 2
    parts.push(
      meshPart(
        `singok-${end > 0 ? 'a' : 'b'}`,
        { name: 'singok', nameId: 'Singok', nameEn: 'Gable board' },
        'rangka-atap',
        order++,
        'ukiran',
        ['singokThickness', 'ridgeRise', 'ridgeSag', 'plateDepth', 'eaveOversail', 'eaveDrop'],
        prismZ(gableProfile(layout, z), z, DIMS.singokThickness.value),
      ),
    )
  }

  // Rafters lap over the plate they bear on. One joint per body rafter pair
  // is enough to make the claim testable without pretending to model every
  // fixing in the roof.
  bodyZs.forEach((z, i) => {
    const ridgeYz = ridge(sAtZ(layout, z)).y
    const kneeY = ridgeYz - (ridgeYz - layout.eaveY) * layout.kneeDrop
    for (const side of [-1, 1] as const) {
      const grip = Math.min(DIMS.rafterWidth.value, DIMS.plateWidth.value) * DIMS.jointEngagement.value
      // Where the two members actually share timber. Taking the span from the
      // rafter axis to the plate axis instead would claim an engagement that
      // reaches outside both of them.
      const lo = Math.max(layout.plateY - DIMS.plateDepth.value / 2, kneeY - DIMS.rafterDepth.value / 2)
      const hi = Math.min(layout.plateY + DIMS.plateDepth.value / 2, kneeY + DIMS.rafterDepth.value / 2)
      if (hi <= lo) continue
      joints.push({
        id: `takik-${i}-${side > 0 ? 'a' : 'b'}`,
        kind: 'takik',
        mortise: `tumpuan-${side > 0 ? 'a' : 'b'}`,
        tenon: `kasau-badan-bawah-${i}-${side > 0 ? 'a' : 'b'}`,
        at: [side * wallHeadX, (lo + hi) / 2, z],
        halfExtents: [grip / 2, ((hi - lo) / 2) * 0.9, grip / 2],
      })
    }
  })

  return { parts, joints }
}

/* ── Gonjong ──────────────────────────────────────────────────────────── */

/**
 * The spires. Four on the base form, six where there are anjuang.
 *
 * Nobody sets the count: it follows the laras, the same way the tongkonan's
 * post count follows its bay count. A control for it would turn a
 * consequence into an ornament budget.
 */
export function buildGonjong(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const ridge = ridgeOf(layout)
  const dims: readonly DimKey[] = [
    'gonjongRise',
    'gonjongSplay',
    'gonjongLean',
    'gonjongButtRadius',
    'gonjongTipRadius',
    'gonjongSplayCurve',
    'gonjongLeanCurve',
    'gonjongTaper',
    'gonjongBase',
    'ridgeEndRise',
    'ridgeOverhang',
  ]
  const anjuangDims: readonly DimKey[] = [
    ...dims,
    'anjuangGonjong',
    'anjuangGonjongRise',
    'anjuangGonjongLean',
    'anjuangGonjongGirth',
    'anjuangRise',
    'ruangLength',
  ]
  const radius = (t: number) =>
    lerp(DIMS.gonjongButtRadius.value, DIMS.gonjongTipRadius.value, clamp01(t) ** DIMS.gonjongTaper.value)
  let order = 0

  for (const end of [1, -1] as const) {
    for (const splay of [-1, 1] as const) {
      parts.push(
        meshPart(
          `gonjong-${end > 0 ? 'a' : 'b'}-${splay > 0 ? 'balakang' : 'muko'}`,
          { name: 'gonjong', nameId: 'Gonjong', nameEn: 'Gonjong' },
          'gonjong',
          order++,
          'ijuk',
          dims,
          tubeMesh(
            gonjongPath({
              base: [0, layout.ridgeEndY, end * layout.ridgeEndZ],
              rise: DIMS.gonjongRise.value,
              splay: splay * DIMS.gonjongSplay.value,
              lean: end * DIMS.gonjongLean.value * DIMS.gonjongRise.value,
              splayCurve: DIMS.gonjongSplayCurve.value,
              leanCurve: DIMS.gonjongLeanCurve.value,
            }),
            radius,
            8,
            0.4,
          ),
        ),
      )
    }
  }

  if (larasInfo(layout.rules.laras).anjuang) {
    for (const end of [1, -1] as const) {
      const z = end * (layout.bodyLength / 2 - layout.bodyLength / layout.rules.ruang)
      parts.push(
        meshPart(
          `gonjong-anjuang-${end > 0 ? 'a' : 'b'}`,
          { name: 'gonjong anjuang', nameId: 'Gonjong anjuang', nameEn: 'Anjuang gonjong' },
          'gonjong',
          order++,
          'ijuk',
          anjuangDims,
          tubeMesh(
            gonjongPath({
              base: [0, ridge(sAtZ(layout, z)).y, z],
              rise: DIMS.gonjongRise.value * DIMS.anjuangGonjongRise.value,
              splay: 0,
              lean:
                end *
                DIMS.gonjongLean.value *
                DIMS.gonjongRise.value *
                DIMS.anjuangGonjongLean.value,
              splayCurve: DIMS.gonjongSplayCurve.value,
              leanCurve: DIMS.gonjongLeanCurve.value,
            }),
            (t) => radius(t) * DIMS.anjuangGonjongGirth.value,
            8,
            0.4,
          ),
        ),
      )
    }
  }

  return parts
}

/* ── Ijuk ─────────────────────────────────────────────────────────────── */

export const RIDGE_CAP_BAND = { head: 0, foot: 0.1 } as const

/**
 * The course layout for this roof.
 *
 * The arithmetic is `courseBands` in the core: both houses lay ijuk from the
 * eave up with the same lap rule, and the two copies of it here were the same
 * function over different constants.
 */
export function ijukBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.ijukCourses, DIMS.ijukLap.value)
}

export function buildIjuk(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const stations = roofStations(layout)
  const thickness = DIMS.ijukThickness.value
  const knee = { at: layout.breakFraction, drop: layout.kneeDrop }
  const bed = DIMS.rafterDepth.value * DIMS.sheathingOffset.value + DIMS.ijukBedClearance.value
  const dims: readonly DimKey[] = [
    'ijukCourseDepth',
    'ijukThickness',
    'ijukLap',
    'ijukBedClearance',
    'sheathingOffset',
    'plateDepth',
    'eaveOversail',
  ]
  let order = 0

  for (const band of ijukBands(layout)) {
    const span = Math.max(1e-6, band.foot - band.head)
    const meshes = ([1, -1] as const).map((side) =>
      swapXZ(
        sweepSurface(stations, {
          side,
          across: 3,
          knee,
          uvScale: 0.55,
          fFrom: Math.max(0, band.head),
          fTo: band.foot,
          // Flush at the head, standing proud at the foot. That step is the
          // shadow line, and the shadow is most of what thatch looks like.
          offsetAt: (f) => bed + thickness * clamp01((f - band.head) / span),
        }),
      ),
    )
    parts.push(
      meshPart(
        `ijuk-${band.course}`,
        {
          name: 'ijuk',
          nameId: `Lapis ijuk ${band.course + 1}`,
          nameEn: `Ijuk course ${band.course + 1}`,
        },
        'ijuk',
        order++,
        'ijuk',
        dims,
        mergeMeshes(meshes),
      ),
    )
  }

  const cap = ([1, -1] as const).map((side) =>
    swapXZ(
      sweepSurface(stations, {
        side,
        across: 3,
        knee,
        uvScale: 0.55,
        fFrom: RIDGE_CAP_BAND.head,
        fTo: RIDGE_CAP_BAND.foot,
        offsetAt: (f) => bed + thickness * (1.1 + 0.9 * clamp01(f / RIDGE_CAP_BAND.foot)),
      }),
    ),
  )
  parts.push(
    meshPart(
      'ijuk-bubungan',
      { name: 'ijuk bubungan', nameId: 'Ijuk bubungan', nameEn: 'Ridge cap course' },
      'ijuk',
      order++,
      'ijuk',
      ['ijukThickness', 'ijukLap', 'ijukBedClearance', 'ridgeRise', 'ridgeSag'],
      mergeMeshes(cap),
    ),
  )

  return parts
}
