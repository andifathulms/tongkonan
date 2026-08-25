/**
 * The roof.
 *
 * The shape is downstream of the rules. There is no curvature control, and
 * there must never be one: if the roof looks wrong, the rule pack is wrong
 * and the provenance note has to say so.
 */

import { DIMS, rankInfo } from './rules'
import { meshPart, ridgeOf, sAtX } from './frame'
import {
  clamp01,
  lerp,
  mergeMeshes,
  mirrorZ,
  prowTaper,
  sweepSurface,
  tubeMesh,
} from './geometry'
import type { MeshData, Station } from './geometry'
import type { BoxPart, Joint, Layout, Part, Vec3 } from './types'

/** How narrow the roof closes to at a prow tip, as a fraction of full width. */
const TIP_FRACTION = 0.055
/** Stations along the ridge. Enough that the prow reads as a curve, not a fold. */
const STATIONS = 96
/** How far the slope bows out from the straight ridge-to-eave chord, metres. */
const SLOPE_BOW = 0.16

export interface RoofFrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

/* ── Stations ─────────────────────────────────────────────────────────── */

/**
 * The roof sampled along its length. Both the frame and every ijuk course
 * address this same parameter space, so a course cannot drift off the frame
 * it is supposed to be lying on.
 */
export function roofStations(layout: Layout, count = STATIONS): readonly Station[] {
  const ridge = ridgeOf(layout)
  const bodyStart = sAtX(layout, -layout.bodyLength / 2)
  const bodyEnd = sAtX(layout, layout.bodyLength / 2)
  const depth = layout.ridgeY - layout.eaveY

  const stations: Station[] = []
  for (let i = 0; i < count; i++) {
    const s = i / (count - 1)
    const { x, y } = ridge(s)
    const taper = prowTaper(s, bodyStart, bodyEnd, TIP_FRACTION)
    stations.push({
      x,
      ridgeY: y,
      halfWidth: layout.eaveHalfWidth * taper,
      // The eave rides with the ridge, so the whole roof plane sweeps up at
      // the prows instead of the ridge peeling away from a flat edge.
      eaveY: y - depth * taper,
    })
  }
  return stations
}

/* ── The roof frame ───────────────────────────────────────────────────── */

export function buildRoofFrame(layout: Layout): RoofFrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const stations = roofStations(layout)
  const s = rankInfo(layout.rules.rank).scale.value
  let order = 0

  /* The ridge beam, following the curve it defines. */
  const ridgePath: Vec3[] = stations.map((st) => [st.x, st.ridgeY, 0])
  parts.push(
    meshPart(
      'bubungan',
      { name: 'bubungan', nameId: 'Balok punggung', nameEn: 'Ridge beam' },
      'rangka-atap',
      order++,
      'kayu',
      tubeMesh(ridgePath, () => 0.075 * s, 8, 0.5),
    ),
  )

  /* Kasau — the rafters. One set per bay per side, plus a pair carrying each
     prow, so the cantilever is framed rather than implied by the surface. */
  const perBay = DIMS.raftersPerBay.value
  const total = Math.max(6, perBay * layout.rules.bays + 4)
  const rafterW = 0.07 * s
  const rafterD = 0.11 * s
  for (let i = 0; i < total; i++) {
    // Skip the very tips: there is no room for a full-depth rafter in a blade.
    const sParam = lerp(0.045, 0.955, i / (total - 1))
    const st = sampleStation(stations, sParam)
    const dy = st.ridgeY - st.eaveY
    const len = Math.hypot(st.halfWidth, dy)
    if (len < 0.2) continue
    const theta = Math.atan2(dy, st.halfWidth)
    for (const side of [1, -1] as const) {
      const cz = (side * st.halfWidth) / 2
      const cy = (st.ridgeY + st.eaveY) / 2
      parts.push(
        rafter(
          `kasau-${i}-${side > 0 ? 'kanan' : 'kiri'}`,
          order++,
          [st.x, cy, cz],
          [rafterW, rafterD, len],
          [side > 0 ? theta : Math.PI - theta, 0, 0],
        ),
      )
    }
    // Each rafter pair is pegged over the ridge beam. No nails anywhere in
    // the house, so the pegs are the structure and get checked as such.
    joints.push({
      id: `pasak-punggung-${i}`,
      kind: 'pasak',
      mortise: 'bubungan',
      tenon: `kasau-${i}-kanan`,
      at: [st.x, st.ridgeY - rafterD * 0.3, 0],
      halfExtents: [rafterW, rafterD * 0.6, rafterW * 1.6],
    })
  }

  /* Gording — the purlins, running the length of each slope. These are what
     the courses actually bear on. */
  const purlinFractions = [0.3, 0.58, 0.85]
  purlinFractions.forEach((f, i) => {
    for (const side of [1, -1] as const) {
      const path: Vec3[] = stations.map((st) => [
        st.x,
        lerp(st.ridgeY, st.eaveY, f),
        side * st.halfWidth * f,
      ])
      parts.push(
        meshPart(
          `gording-${i}-${side > 0 ? 'kanan' : 'kiri'}`,
          { name: 'gording', nameId: 'Gording', nameEn: 'Purlin' },
          'rangka-atap',
          order++,
          'bambu',
          tubeMesh(path, () => 0.045 * s, 6, 0.3),
        ),
      )
    }
  })

  /* Sheathing. Thin boarding closing the frame so the ijuk has something to
     lie on and the roof is never see-through from below. */
  for (const side of [1, -1] as const) {
    parts.push(
      meshPart(
        `papan-atap-${side > 0 ? 'kanan' : 'kiri'}`,
        { name: 'papan atap', nameId: 'Papan atap', nameEn: 'Roof boarding' },
        'rangka-atap',
        order++,
        'papan',
        sweepSurface(stations, { side, across: 6, bow: SLOPE_BOW, uvScale: 1.1 }),
      ),
    )
  }

  return { parts, joints }
}

function rafter(id: string, order: number, center: Vec3, size: Vec3, rotation: Vec3): BoxPart {
  return {
    kind: 'box',
    id,
    name: 'kasau',
    nameId: 'Kasau',
    nameEn: 'Rafter',
    stage: 'rangka-atap',
    order,
    material: 'kayu',
    center,
    size,
    rotation,
  }
}

/** Linear read of the station table at an arbitrary parameter. */
function sampleStation(stations: readonly Station[], s: number): Station {
  const n = stations.length
  const t = clamp01(s) * (n - 1)
  const i = Math.min(n - 2, Math.floor(t))
  const a = stations[i]
  const b = stations[i + 1]
  if (!a || !b) throw new Error('station table is too short')
  const f = t - i
  return {
    x: lerp(a.x, b.x, f),
    ridgeY: lerp(a.ridgeY, b.ridgeY, f),
    halfWidth: lerp(a.halfWidth, b.halfWidth, f),
    eaveY: lerp(a.eaveY, b.eaveY, f),
  }
}

/* ── Ijuk ─────────────────────────────────────────────────────────────── */

/**
 * The courses, laid from the eave upward.
 *
 * Each course is real geometry standing proud of the one below it. Flattening
 * the roof to a single surface with a thatch texture would throw away the
 * shadow line between courses, and that shadow is most of the material.
 */
export function buildIjuk(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const stations = roofStations(layout)
  const s = rankInfo(layout.rules.rank).scale.value
  const thickness = DIMS.ijukThickness.value * s
  const lap = DIMS.ijukLap.value
  const courses = layout.ijukCourses
  // Exposure in slope-fraction space: f runs 0 at the ridge to 1 at the eave.
  const exposure = 1 / courses
  let order = 0

  for (let k = 0; k < courses; k++) {
    // k = 0 is the eave course. Each head sits one exposure further up.
    const head = 1 - (k + 1) * exposure
    // The foot reaches past the head of the course below by the lap, so there
    // is no line across the slope where the frame could show through.
    const foot = Math.min(1, head + exposure * (1 + lap * 2))
    const span = Math.max(1e-6, foot - head)

    const meshes: MeshData[] = []
    for (const side of [1, -1] as const) {
      meshes.push(
        sweepSurface(stations, {
          side,
          across: 3,
          bow: SLOPE_BOW,
          uvScale: 0.55,
          fFrom: Math.max(0, head),
          fTo: foot,
          // Flush at the head, standing proud at the foot: that step is the
          // shadow line, and it is why the roof reads as courses at all.
          offsetAt: (f) => thickness * clamp01((f - head) / span),
        }),
      )
    }
    parts.push(
      meshPart(
        `ijuk-${k}`,
        {
          name: 'ijuk',
          nameId: `Lapis ijuk ${k + 1}`,
          nameEn: `Ijuk course ${k + 1}`,
        },
        'ijuk',
        order++,
        'ijuk',
        mergeMeshes(meshes),
      ),
    )
  }

  /* The ridge cap. The last course stops at the ridge line; the cap is what
     actually closes it, and the invariant checks the ridge is covered. */
  const capRight = sweepSurface(stations, {
    side: 1,
    across: 3,
    bow: SLOPE_BOW,
    uvScale: 0.55,
    fFrom: 0,
    fTo: 0.1,
    offsetAt: (f) => thickness * (1.1 + 0.9 * clamp01(f / 0.1)),
  })
  parts.push(
    meshPart(
      'ijuk-bubungan',
      { name: 'ijuk bubungan', nameId: 'Ijuk punggung', nameEn: 'Ridge cap course' },
      'ijuk',
      order++,
      'ijuk',
      mergeMeshes([capRight, mirrorZ(capRight)]),
    ),
  )

  return parts
}
