/**
 * The stepped hip, its frame, and the tiles on it.
 *
 * The surface comes from `hip.ts`; what is here is the timber under it and the
 * clay on it. Two things are worth noting against the other two houses.
 *
 * The rafters come in two kinds because a hip has two kinds. On the long faces
 * they run straight up the slope; at the four corners a hip rafter runs from
 * the eave corner up to the end of the ridge, and it is that member which
 * makes the ends fall away instead of rising. Neither other house has one,
 * because neither has a corner in its roof.
 *
 * The tiles reuse `courseBands` from the core, which was extracted when two
 * thatched houses turned out to lap their courses by the same arithmetic. It
 * holds for fired clay on a hip as well, which is the first evidence that the
 * extraction was about lapping rather than about thatch.
 */

import { clamp01, lerp, mergeMeshes, tubeMesh } from '@/lib/core/geometry'
import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import type { BoxPart, Joint, Layout, Part, RoofLevel, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS } from './rules'
import { hipLevelAt, hipRun, steppedHip } from '@/lib/core/hip'
import { meshPart } from './frame'

/* ── The frame ────────────────────────────────────────────────────────── */

export interface RoofFrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

const RAFTER_DIMS: readonly DimKey[] = [
  'rafterWidth',
  'rafterDepth',
  'raftersPerSide',
  'brunjungRise',
  'eaveOversail',
    'ridgeShare',
  'hipped',
]

/** A member running from one point to another in a vertical plane at constant Z. */
function memberXY(
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
    name: 'usuk',
    nameId,
    nameEn,
    stage: 'rangka-atap',
    order,
    material: 'jati',
    dims,
    center: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, z],
    size: [Math.hypot(dx, dy), DIMS.rafterDepth.value, DIMS.rafterWidth.value],
    rotation: [0, 0, Math.atan2(dy, dx)],
  }
}

/** A member between two arbitrary points: the hip rafters run diagonally in plan. */
function memberFree(
  id: string,
  nameId: string,
  nameEn: string,
  order: number,
  a: Vec3,
  b: Vec3,
  dims: readonly DimKey[],
): Part {
  return meshPart(
    id,
    { name: 'usuk', nameId, nameEn },
    'rangka-atap',
    order,
    'jati',
    dims,
    tubeMesh([a, b], () => DIMS.rafterWidth.value * DIMS.hipRafterGirth.value, 6, 0.4),
  )
}

export function buildRoofFrame(layout: Layout): RoofFrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const levels = layout.roof
  const eave = levels[0]
  const molo = levels[levels.length - 1]
  if (!eave || !molo) throw new Error('a roof needs an eave and a ridge')
  let order = 0

  /*
   * Rafters on the two long faces, band by band.
   *
   * They are placed from the eave upward so each one lands on something
   * already standing, and the last band leans on the tumpang sari, which is
   * why the stack goes up before the roof does.
   */
  const perSide = Math.max(2, Math.round(DIMS.raftersPerSide.value))
  // Downward from the brunjung. The top band lands on the tumpang sari, which
  // is already standing; every band below it lands on the one above. Going the
  // other way, the lowest band would have nothing under it — which is true of
  // the building as well as of the model.
  for (let b = levels.length - 1; b >= 1; b--) {
    const lower = levels[b - 1]
    const upper = levels[b]
    if (!lower || !upper) continue
    for (let i = 0; i < perSide; i++) {
      // Spread across the part of the face that is not taken by the hip.
      const t = perSide === 1 ? 0.5 : i / (perSide - 1)
      const z = lerp(-upper.halfZ, upper.halfZ, t)
      for (const side of [-1, 1] as const) {
        parts.push(
          memberXY(
            `usuk-${b}-${i}-${side > 0 ? 'a' : 'b'}`,
            'Usuk',
            'Rafter',
            order++,
            [side * lower.halfX, lower.y],
            [side * upper.halfX, upper.y],
            z,
            RAFTER_DIMS,
          ),
        )
      }
    }
  }

  /*
   * The hip rafters: eave corner to ridge end, one per corner per band.
   *
   * This is the member that makes a hip a hip. Both other houses run their
   * roof out to a gable and have nothing that does this job.
   */
  for (let b = levels.length - 1; b >= 1; b--) {
    const lower = levels[b - 1]
    const upper = levels[b]
    if (!lower || !upper) continue
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        parts.push(
          memberFree(
            `usuk-jurai-${b}-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`,
            'Usuk jurai',
            'Hip rafter',
            order++,
            [sx * lower.halfX, lower.y, sz * lower.halfZ],
            [sx * upper.halfX, upper.y, sz * upper.halfZ],
            RAFTER_DIMS,
          ),
        )
      }
    }
  }

  /*
   * The eave plate, carried by the rafter tails.
   *
   * It went up before the rafters in the first draft and floated: it sits
   * outboard of the last ring of pillars and below it, so there is nothing
   * under it but air until the rafters reach out to hold it. The build-order
   * check says so, which is the check doing exactly what it is for.
   */
  const plateDims: readonly DimKey[] = ['plateDepth', 'plateWidth', 'eaveOversail', 'ringDrop', 'ringStep', 'guruSpan']
  const rect: readonly (readonly [string, Vec3, Vec3])[] = [
    ['a', [eave.halfX, eave.y, 0], [DIMS.plateWidth.value, DIMS.plateDepth.value, eave.halfZ * 2]],
    ['b', [-eave.halfX, eave.y, 0], [DIMS.plateWidth.value, DIMS.plateDepth.value, eave.halfZ * 2]],
    ['c', [0, eave.y, eave.halfZ], [eave.halfX * 2, DIMS.plateDepth.value, DIMS.plateWidth.value]],
    ['d', [0, eave.y, -eave.halfZ], [eave.halfX * 2, DIMS.plateDepth.value, DIMS.plateWidth.value]],
  ]
  for (const [tag, centre, size] of rect) {
    parts.push({
      kind: 'box',
      id: `tumpuan-${tag}`,
      name: 'balok tumpuan',
      nameId: 'Balok tumpuan',
      nameEn: 'Eave plate',
      stage: 'rangka-atap',
      order: order++,
      material: 'jati',
      dims: plateDims,
      center: centre,
      size,
    })
  }

  /* The molo, shorter than the house it crowns. */
  parts.push(
    meshPart(
      'molo',
      { name: 'molo', nameId: 'Molo', nameEn: 'Ridge beam' },
      'rangka-atap',
      order++,
      'jati',
      ['moloRadius', 'ridgeShare', 'brunjungRise', 'guruSpan', 'hipped'],
      tubeMesh(
        [
          [0, molo.y, -molo.halfZ],
          [0, molo.y, molo.halfZ],
        ],
        () => DIMS.moloRadius.value,
        8,
        0.5,
      ),
    ),
  )

  /* The boarding the tiles bed on. */
  parts.push(
    meshPart(
      'reng',
      { name: 'reng', nameId: 'Reng dan papan atap', nameEn: 'Battens and roof boarding' },
      'rangka-atap',
      order++,
      'papan',
      ['rafterDepth', 'sheathingOffset', 'tileBedClearance', 'eaveOversail', 'brunjungRise', 'ringDrop'],
      steppedHip(levels, {
        uvScale: 0.7,
        offsetAt: () => DIMS.rafterDepth.value * DIMS.sheathingOffset.value,
      }),
    ),
  )

  // Rafters lap over the plate they land on, on the lowest band only: that is
  // where the roof meets something that is not more roof.
  const first = levels[1]
  if (first) {
    /*
     * How much timber a rafter presents at the plate, which is not its section
     * depth.
     *
     * A member lying at a pitch is thinner measured vertically than it is
     * measured square, by the cosine of that pitch — and the engagement was
     * being sized from the square depth. It fitted at twenty-one degrees with
     * half a millimetre to spare, and the moment the penanggap was steepened
     * to twenty-seven it stopped fitting, so the joint claimed more timber
     * than the rafter had. The check caught it; the arithmetic should not have
     * needed catching.
     */
    const pitch = Math.atan2(first.y - eave.y, Math.abs(eave.halfX - first.halfX))
    const halfThick = (DIMS.rafterDepth.value / 2) * Math.cos(pitch)
    for (let i = 0; i < perSide; i++) {
      for (const side of [-1, 1] as const) {
        const grip = Math.min(DIMS.rafterWidth.value, DIMS.plateWidth.value) * DIMS.jointEngagement.value
        const lo = Math.max(eave.y - DIMS.plateDepth.value / 2, eave.y - halfThick)
        const hi = Math.min(eave.y + DIMS.plateDepth.value / 2, eave.y + halfThick)
        const t = perSide === 1 ? 0.5 : i / (perSide - 1)
        joints.push({
          id: `takik-${i}-${side > 0 ? 'a' : 'b'}`,
          kind: 'takik',
          mortise: `tumpuan-${side > 0 ? 'a' : 'b'}`,
          tenon: `usuk-1-${i}-${side > 0 ? 'a' : 'b'}`,
          at: [side * eave.halfX, (lo + hi) / 2, lerp(-first.halfZ, first.halfZ, t)],
          halfExtents: [grip / 2, ((hi - lo) / 2) * 0.9, grip / 2],
        })
      }
    }
  }

  return { parts, joints }
}

/* ── Tiles ────────────────────────────────────────────────────────────── */

/**
 * The course layout, from the core.
 *
 * `f` there runs 0 at the ridge and 1 at the eave; the hip runs the other way,
 * so a course reaches the roof flipped. Two conventions is one too many and
 * the flip is done here, once.
 */
export function tileBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.tileCourses, DIMS.tileLap.value)
}

export function buildGenteng(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const bed = DIMS.rafterDepth.value * DIMS.sheathingOffset.value + DIMS.tileBedClearance.value
  const thickness = DIMS.tileThickness.value
  const dims: readonly DimKey[] = [
    'tileCourseDepth',
    'tileThickness',
    'tileLap',
    'tileBedClearance',
    'rafterDepth',
    'eaveOversail',
  ]
  let order = 0

  for (const band of tileBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `genteng-${band.course}`,
        {
          name: 'genteng',
          nameId: `Baris genteng ${band.course + 1}`,
          nameEn: `Tile course ${band.course + 1}`,
        },
        'genteng',
        order++,
        'genteng',
        dims,
        steppedHip(layout.roof, {
          uvScale: 0.45,
          fFrom: from,
          fTo: to,
          // Flush at the head, standing proud at the foot. That step is the
          // shadow line between courses, and on fired clay it is most of what
          // a tiled roof looks like.
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/* ── The pendhapa ─────────────────────────────────────────────────────── */

/**
 * The open pavilion in front, when the household builds one.
 *
 * Pillars and a roof and nothing else: no walls, because not having them is
 * the point — it is where the household meets people who are not the
 * household. The space between it and the dalem is the pringgitan, where the
 * wayang screen stands, and it is a room made of the gap rather than of walls.
 */
export function buildPendhapa(layout: Layout): readonly Part[] {
  if (!layout.pendhapa.present) return []
  const parts: Part[] = []
  const p = layout.pendhapa
  const umpakTop = DIMS.umpakHeight.value
  const seat = umpakTop * DIMS.sokoSeat.value
  const headY = umpakTop + DIMS.pendhapaHeight.value
  const guruHalf = p.halfX * 0.42
  const dims: readonly DimKey[] = ['pendhapaSpan', 'pendhapaGap', 'pendhapaHeight', 'sokoSection', 'umpakHeight', 'eaveOversail', 'ringDrop']

  const rings = [
    { half: guruHalf, height: DIMS.pendhapaHeight.value },
    { half: p.halfX, height: DIMS.pendhapaHeight.value - DIMS.ringDrop.value },
  ]

  let stone = 0
  let post = 0
  rings.forEach((ring, r) => {
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        const x = p.centreX + sx * ring.half
        const z = sz * ring.half
        parts.push(
          builderBox(`pendhapa-umpak-${r}-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`, 'Umpak pendhapa', 'Pendhapa pad stone', 'umpak', stone++, 'batu', dims, [x, umpakTop / 2, z], [DIMS.umpakWidth.value, umpakTop, DIMS.umpakWidth.value]),
        )
        const footY = umpakTop - seat
        const topY = umpakTop + ring.height
        parts.push(
          builderBox(`pendhapa-soko-${r}-${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`, 'Soko pendhapa', 'Pendhapa pillar', 'soko', post++, 'jati', dims, [x, (footY + topY) / 2, z], [layout.sokoSection, topY - footY, layout.sokoSection]),
        )
      }
    }
  })

  // Its roof, shifted to stand over its own pillars.
  const shifted = p.roof.map((level) => ({ ...level }))
  parts.push(
    shiftX(
      meshPart(
        'pendhapa-atap',
        { name: 'atap pendhapa', nameId: 'Atap pendhapa', nameEn: 'Pendhapa roof' },
        'genteng',
        900,
        'genteng',
        ['pendhapaSpan', 'pendhapaHeight', 'pendhapaBrunjung', 'pendhapaGuruShare', 'eaveOversail', 'sheathingOffset'],
        steppedHip(shifted, {
          uvScale: 0.45,
          offsetAt: () => DIMS.rafterDepth.value * DIMS.sheathingOffset.value,
        }),
      ),
      p.centreX,
    ),
  )

  void headY
  return parts
}

/** A box helper for the pavilion, which shares none of the dalem's naming. */
function builderBox(
  id: string,
  nameId: string,
  nameEn: string,
  stage: Part['stage'],
  order: number,
  material: Part['material'],
  dims: readonly DimKey[],
  center: Vec3,
  size: Vec3,
): BoxPart {
  return {
    kind: 'box',
    id,
    name: nameId.toLowerCase(),
    nameId,
    nameEn,
    stage,
    order,
    material,
    dims,
    center,
    size,
  }
}

/** Move a finished mesh along X. The pavilion is built at the origin and put in place. */
function shiftX(part: Part, dx: number): Part {
  if (part.kind !== 'mesh') return part
  const positions = part.positions.slice()
  for (let i = 0; i < positions.length; i += 3) positions[i] = (positions[i] ?? 0) + dx
  return { ...part, positions }
}

/** Where the roof sits at a fraction of its slope, for anything that needs it. */
export function roofLevelAt(layout: Layout, f: number): RoofLevel {
  return hipLevelAt(layout.roof, f)
}

export { hipRun }
