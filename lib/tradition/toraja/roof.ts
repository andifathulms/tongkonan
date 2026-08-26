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
  slopeDrop,
  sweepSurface,
  tubeMesh,
} from '@/lib/core/geometry'
import type { MeshData, Station } from '@/lib/core/geometry'
import { prowTaper } from './ridge'
import type { BoxPart, Joint, Layout, Part, Vec3 } from './types'

/** How narrow the roof closes to at a prow tip, as a fraction of full width. */
// The prow tip taper is a declared dimension; see DIMS.tipFraction.
/** Stations along the ridge. Enough that the prow reads as a curve, not a fold. */
const STATIONS = 96

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
    const taper = prowTaper(s, bodyStart, bodyEnd, DIMS.tipFraction.value)
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
      [
        'ridgeRise',
        'ridgeSag',
        'ridgeUpsweep',
        'ridgeBeamRadius',
        'frontProwRise',
        'rearProwRise',
        'prowOverhang',
        'tipFraction',
        'ridgeSags',
        'frontHigher',
      ],
      tubeMesh(ridgePath, () => DIMS.ridgeBeamRadius.value * s, 8, 0.5),
    ),
  )

  /* Kasau — the rafters, in two ranks.
     The roof breaks where it crosses the wall plate: one rank runs steeply
     from the ridge down to that line, a second runs out from it to the eave.
     That break is the flare, and modelling it as two straight members rather
     than one is both what the building does and what puts a rafter foot on
     the plate for the joint to be real. */
  const perBay = DIMS.raftersPerBay.value
  const total = Math.max(6, perBay * layout.rules.bays + DIMS.raftersAtProws.value)
  const rafterW = DIMS.rafterWidth.value * s
  const rafterD = DIMS.rafterDepth.value * s
  const brk = layout.breakFraction
  const knee = { at: brk, drop: layout.kneeDrop }
  for (let i = 0; i < total; i++) {
    // Skip the very tips: there is no room for a full-depth rafter in a blade.
    const sParam = lerp(0.045, 0.955, i / (total - 1))
    const st = sampleStation(stations, sParam)
    const depth = st.ridgeY - st.eaveY
    if (st.halfWidth < 0.2) continue

    const at = (f: number) => ({
      z: st.halfWidth * f,
      y: st.ridgeY - depth * slopeDrop(f, knee),
    })
    const ranks: [number, number][] = [
      [0, brk],
      [brk, 1],
    ]

    ranks.forEach(([f0, f1], rank) => {
      const a = at(f0)
      const b = at(f1)
      const dz = b.z - a.z
      const dy = a.y - b.y
      const len = Math.hypot(dz, dy)
      if (len < 0.15) return
      const theta = Math.atan2(dy, dz)
      for (const side of [1, -1] as const) {
        parts.push(
          rafter(
            `kasau-${rank}-${i}-${side > 0 ? 'kanan' : 'kiri'}`,
            order++,
            [st.x, (a.y + b.y) / 2, (side * (a.z + b.z)) / 2],
            [rafterW, rafterD, len],
            [side > 0 ? theta : Math.PI - theta, 0, 0],
          ),
        )
      }
    })
    // Each rafter pair is pegged over the ridge beam. No nails anywhere in
    // the house, so the pegs are the structure and get checked as such.
    joints.push({
      id: `pasak-punggung-${i}`,
      kind: 'pasak',
      mortise: 'bubungan',
      tenon: `kasau-0-${i}-kanan`,
      at: [st.x, st.ridgeY - rafterD * DIMS.jointEngagement.value, 0],
      halfExtents: [
        rafterW * 0.4,
        rafterD * DIMS.jointEngagement.value,
        rafterW * 0.4,
      ],
    })
  }

  /* Gording — the purlins, running the length of each slope. These are what
     the courses actually bear on. */
  // One purlin sits on the break line itself: that is where the two ranks of
  // rafters meet, and it is the piece that makes the meeting a joint.
  const purlinFractions = [
    brk * DIMS.purlinAboveKnee.value,
    brk,
    brk + (1 - brk) * DIMS.purlinBelowKnee.value,
  ]
  purlinFractions.forEach((f, i) => {
    for (const side of [1, -1] as const) {
      const path: Vec3[] = stations.map((st) => [
        st.x,
        st.ridgeY - (st.ridgeY - st.eaveY) * slopeDrop(f, knee),
        side * st.halfWidth * f,
      ])
      parts.push(
        meshPart(
          `gording-${i}-${side > 0 ? 'kanan' : 'kiri'}`,
          { name: 'gording', nameId: 'Gording', nameEn: 'Purlin' },
          'rangka-atap',
          order++,
          'bambu',
          [
            'purlinRadius',
            'purlinAboveKnee',
            'purlinBelowKnee',
            'roofKneeDrop',
            'eaveOversail',
            'ridgeRise',
            'bodyWidth',
          ],
          tubeMesh(path, () => DIMS.purlinRadius.value * s, 6, 0.3),
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
        ['sheathingOffset', 'rafterDepth', 'roofKneeDrop', 'eaveOversail', 'eaveDrop', 'ridgeRise', 'ridgeSag'],
        sweepSurface(stations, {
          side,
          across: 8,
          knee,
          uvScale: 1.1,
          // Sits on top of the rafters rather than through them.
          offsetAt: () => rafterD * DIMS.sheathingOffset.value,
        }),
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
    dims: [
      'raftersPerBay',
      'raftersAtProws',
      'rafterWidth',
      'rafterDepth',
      'ridgeRise',
      'roofKneeDrop',
      'eaveOversail',
      'eaveDrop',
      'bodyWidth',
    ],
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

/** Where the ridge cap starts and stops, in slope-fraction space. */
export const RIDGE_CAP_BAND = { head: 0, foot: 0.1 } as const

export interface IjukBand {
  readonly course: number
  /** upper edge, toward the ridge; f runs 0 at the ridge to 1 at the eave */
  readonly head: number
  /** lower edge, toward the eave */
  readonly foot: number
}

/**
 * The course layout, derived once and used both to build the geometry and to
 * check it. The invariant reads the same numbers the courses were cut from,
 * which is the point: a lap that is claimed and a lap that is built cannot
 * drift apart.
 */
export function ijukBands(layout: Layout): readonly IjukBand[] {
  const lap = DIMS.ijukLap.value
  const courses = layout.ijukCourses
  // Exposure in slope-fraction space: f runs 0 at the ridge to 1 at the eave.
  const exposure = 1 / courses
  const bands: IjukBand[] = []
  for (let k = 0; k < courses; k++) {
    // k = 0 is the eave course. Each head sits one exposure further up.
    const head = 1 - (k + 1) * exposure
    // The foot reaches past the head of the course below by the lap, so there
    // is no line across the slope where the frame could show through.
    const foot = Math.min(1, head + exposure * (1 + lap * 2))
    bands.push({ course: k, head, foot })
  }
  return bands
}

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
  const knee = { at: layout.breakFraction, drop: layout.kneeDrop }
  // The courses lie on the boarding, which lies on the rafters.
  const bed =
    DIMS.rafterDepth.value * s * DIMS.sheathingOffset.value + DIMS.ijukBedClearance.value
  let order = 0

  for (const band of ijukBands(layout)) {
    const k = band.course
    const head = band.head
    const foot = band.foot
    const span = Math.max(1e-6, foot - head)

    const meshes: MeshData[] = []
    for (const side of [1, -1] as const) {
      meshes.push(
        sweepSurface(stations, {
          side,
          across: 3,
          knee,
          uvScale: 0.55,
          fFrom: Math.max(0, head),
          fTo: foot,
          // Flush at the head, standing proud at the foot: that step is the
          // shadow line, and it is why the roof reads as courses at all.
          offsetAt: (f) => bed + thickness * clamp01((f - head) / span),
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
        [
          'ijukCourseDepth',
          'ijukThickness',
          'ijukLap',
          'ijukBedClearance',
          'sheathingOffset',
          'roofKneeDrop',
          'eaveOversail',
        ],
        mergeMeshes(meshes),
      ),
    )
  }

  /* The ridge cap. The last course stops at the ridge line; the cap is what
     actually closes it, and the invariant checks the ridge is covered. */
  const capRight = sweepSurface(stations, {
    side: 1,
    across: 3,
    knee,
    uvScale: 0.55,
    fFrom: RIDGE_CAP_BAND.head,
    fTo: RIDGE_CAP_BAND.foot,
    offsetAt: (f) => bed + thickness * (1.1 + 0.9 * clamp01(f / RIDGE_CAP_BAND.foot)),
  })
  parts.push(
    meshPart(
      'ijuk-bubungan',
      { name: 'ijuk bubungan', nameId: 'Ijuk punggung', nameEn: 'Ridge cap course' },
      'ijuk',
      order++,
      'ijuk',
      ['ijukThickness', 'ijukLap', 'ijukBedClearance', 'ridgeRise', 'ridgeSag'],
      mergeMeshes([capRight, mirrorZ(capRight)]),
    ),
  )

  return parts
}
