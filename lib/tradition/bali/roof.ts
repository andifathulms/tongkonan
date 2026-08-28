/**
 * The roof of a bale: four planes, a short ridge, and grass.
 *
 * `steppedHip` does the surface, and it is worth saying what that call proves.
 * The primitive was written for the joglo, where the stack is three or four
 * rectangles deep and every tier is a decision; here it is handed two levels —
 * an eave and a ridge — and asked for one band. It needed nothing. A primitive
 * that only works at the complexity it was written for is not a primitive, so
 * the degenerate case passing unmodified is better evidence that it belongs in
 * the core than a second elaborate case would have been.
 *
 * On a square bale the ridge has no length at all, and every one of the four
 * planes runs to a single point. `steppedHip` already declines to emit the
 * zero-area triangles that produces, because the joglo's molo has the same
 * problem at its ends. The pyramid therefore falls out of the post count with
 * nothing written to produce it — which is why `hipRoof` is canon and there is
 * no `ridgeLength` dimension for anyone to disagree with.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, tubeMesh } from '@/lib/core/geometry'
import { hipRun, hipSurfaceAt, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { stockLength } from './module'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Vec3 } from './types'
import { meshPart } from './frame'
import { partBuilders } from '@/lib/core/parts'
import type { BaliKinds } from './types'

const box = partBuilders<BaliKinds>().box

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSectionUnits',
  'ridgeRiseUnits',
  'eaveOversailUnits',
  'raftersPerBay',
  'hipRoof',
  'nyariRatio',
  'hastaRatio',
  'useranRatio',
]

function levels(layout: Layout): { eave: RoofLevel; ridge: RoofLevel } {
  const eave = layout.roof[0]
  const ridge = layout.roof[layout.roof.length - 1]
  if (!eave || !ridge) throw new Error('a bale roof needs an eave and a ridge')
  return { eave, ridge }
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

/* ── The frame ────────────────────────────────────────────────────────── */

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const s = layout.sikut
  const { eave, ridge } = levels(layout)
  const section = stockLength(s, DIMS.rafterSectionUnits.value, 'nyari')
  const engage = DIMS.jointEngagement.value
  let order = 0

  /*
   * The ridge piece, when there is one.
   *
   * On a square plan there is not, and the four hip rafters meet each other
   * instead. That is a real difference in how the roof is put together and not
   * a drawing convenience, so the part is absent rather than being emitted
   * with zero length — a zero-length member would sit in the part list, in the
   * build sequence and in the provenance count as though something were there.
   */
  const hasRidge = ridge.halfZ > 1e-6
  const lap = section * engage

  /*
   * The four hip rafters, from each end of the ridge down to each corner of
   * the eave. These are the members that make it a hip, and they are the only
   * ones in this house running diagonally in plan — so they are tubes rather
   * than rotated boxes. A box would need a two-axis Euler rotation and the
   * joint invariant would then be testing an exact AABB of a member whose
   * orientation was the thing most likely to be wrong.
   */
  const corners: readonly (readonly [number, number])[] = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  corners.forEach(([sx, sz], i) => {
    const from: Vec3 = [sx * eave.halfX, eave.y, sz * eave.halfZ]
    // The head runs a little past the ridge end and laps onto it, which is how
    // a hip rafter is actually fixed and what gives the joint a volume to be
    // engaged in. Butted exactly at the ridge end the two members would meet
    // on a plane, and a plane has no thickness for a check to test.
    const to: Vec3 = [0, ridge.y, sz * Math.max(0, ridge.halfZ - lap)]
    const id = `jurai-${i}`
    parts.push(
      meshPart(
        id,
        { name: 'jurai', nameId: 'Jurai', nameEn: 'Hip rafter' },
        'iga-iga',
        order++,
        'kayu',
        FRAME_DIMS,
        tubeMesh([from, to], () => section / 2, 4, 0.4),
      ),
    )
    if (hasRidge) {
      joints.push({
        id: `jurai-bubungan-${i}`,
        kind: 'takik',
        mortise: 'bubungan',
        tenon: id,
        /*
         * Offset to the side the rafter arrives from.
         *
         * Written centred on the ridge first, and the tenon came up loose: a
         * hip rafter runs *up to* the ridge and laps it from one side, so the
         * timber shared between the two lies on that side only. A joint box
         * spanning both sides is claiming an engagement into air.
         */
        at: [sx * (section / 4), ridge.y - section / 4, sz * (ridge.halfZ - lap / 2)],
        halfExtents: [section / 4, section / 4, lap / 2],
      })
    }
  })

  /*
   * The ridge, after the hips that carry it.
   *
   * Written first and placed first, which is how a drawing is made and not how
   * a roof is raised: the build-order check refused it, because at the moment
   * the ridge went on there was nothing under it. On a hip the ridge is landed
   * onto the hip rafters, and on a square bale there is no ridge at all and
   * the four hips meet each other — the absence is a real difference in how
   * the thing is put together, so the part is missing rather than zero-length.
   */
  if (hasRidge) {
    parts.push(
      box(
        'bubungan',
        { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
        'iga-iga',
        order++,
        'kayu',
        FRAME_DIMS,
        [0, ridge.y - section / 2, 0],
        [section, section, ridge.halfZ * 2],
      ),
    )
  }

  /*
   * Common rafters, on all four planes.
   *
   * Every one of them runs at a constant plan coordinate and leans on one
   * axis, so a single-axis rotation places it — which is the reason the hip
   * rafters above are tubes and these are boxes. The only real work is that a
   * rafter stops where its plane runs out: on a hip the faces close inward as
   * they rise, so a rafter near a corner is shorter than one near the middle,
   * and the fraction of the slope it gets is `t`.
   *
   * Written first without that, and the frame stood with every rafter full
   * length — four faces of parallel sticks passing straight through each
   * other above the hip lines and out into the air beyond them. The thatch
   * hid it completely. It is the same fault as the mbaru niang's door and the
   * rumah gadang's gable board: a member cut to a line the surface no longer
   * follows.
   */
  const rise = ridge.y - eave.y
  const perBay = Math.max(1, Math.round(DIMS.raftersPerBay.value))

  // The two long faces: constant z, leaning in x.
  const pitchX = Math.atan2(eave.halfX, rise)
  const runX = Math.hypot(eave.halfX, rise)
  const closeZ = eave.halfZ - ridge.halfZ
  const alongCount = perBay * Math.max(1, layout.cols - 1)
  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= alongCount; k++) {
      const z = -eave.halfZ + (k / alongCount) * eave.halfZ * 2
      const t = closeZ <= 1e-9 ? 1 : Math.min(1, (eave.halfZ - Math.abs(z)) / closeZ)
      if (t <= 1e-6) continue
      parts.push(
        box(
          `kasau-${sx > 0 ? 'a' : 'b'}-${k}`,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Common rafter' },
          'iga-iga',
          order++,
          'bambu',
          FRAME_DIMS,
          [sx * eave.halfX * (1 - t / 2), eave.y + (rise * t) / 2, z],
          [section, runX * t, section],
          // The head leans toward the ridge: for a rafter on +X that is a
          // move toward −X, which is a positive rotation about Z.
          [0, 0, sx * pitchX],
        ),
      )
    }
  }

  // The two hip ends: constant x, leaning in z.
  const pitchZ = Math.atan2(closeZ, rise)
  const runZ = Math.hypot(closeZ, rise)
  const acrossCount = perBay * Math.max(1, layout.rows - 1)
  if (closeZ > 1e-9) {
    for (const sz of [-1, 1] as const) {
      for (let k = 0; k <= acrossCount; k++) {
        const x = -eave.halfX + (k / acrossCount) * eave.halfX * 2
        const t = Math.min(1, 1 - Math.abs(x) / eave.halfX)
        if (t <= 1e-6) continue
        parts.push(
          box(
            `kasau-ujung-${sz > 0 ? 'a' : 'b'}-${k}`,
            { name: 'kasau', nameId: 'Kasau ujung', nameEn: 'Hip-end rafter' },
            'iga-iga',
            order++,
            'bambu',
            FRAME_DIMS,
            [x, eave.y + (rise * t) / 2, sz * (eave.halfZ - (closeZ * t) / 2)],
            [section, runZ * t, section],
            [-sz * pitchZ, 0, 0],
          ),
        )
      }
    }
  }

  return { parts, joints }
}

/* ── The thatch ───────────────────────────────────────────────────────── */

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const s = layout.sikut
  const bed = stockLength(s, DIMS.rafterSectionUnits.value, 'nyari') / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterSectionUnits',
    'hipRoof',
  ]
  let order = 0

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `alang-${band.course}`,
        {
          name: 'alang-alang',
          nameId: `Lapis alang-alang ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'alang',
        order++,
        'alang',
        dims,
        steppedHip(layout.roof, {
          uvScale: 0.4,
          fFrom: from,
          fTo: to,
          // Flush at the head, standing proud at the foot: the step between
          // courses is the shadow line, and on a hip it turns every corner.
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/** The finish over the line where the four planes meet. */
export function buildMurda(layout: Layout): readonly Part[] {
  const { ridge } = levels(layout)
  const s = layout.sikut
  const section = stockLength(s, DIMS.rafterSectionUnits.value, 'nyari')
  const bed = section / 2 + DIMS.thatchBed.value
  const width = stockLength(s, DIMS.murdaWidthUnits.value, 'nyari')
  /*
   * The top of the thatch, asked for rather than worked out again.
   *
   * The cap used to be placed at the ridge plus the bed depth, which is only
   * right on a roof flat enough for an offset along the normal to be almost
   * entirely vertical. Steepening the pitch from 24° to 42° left it hanging in
   * the air above its own roof, and the build-order check caught it.
   */
  const top = hipSurfaceAt(layout.roof, 1, bed)
  return [
    box(
      'murda',
      { name: 'murda', nameId: 'Tutup bubungan', nameEn: 'Ridge finish' },
      'murda',
      0,
      'alang',
      ['murdaRise', 'murdaWidthUnits', 'rafterSectionUnits', 'thatchThickness', 'hipRoof', 'nyariRatio'],
      // Bedded down into the top course rather than resting on its surface:
      // a cap that only touched would be a part supported by nothing.
      [0, top.y - DIMS.thatchThickness.value + DIMS.murdaRise.value / 2, 0],
      [width, DIMS.murdaRise.value, Math.max(width, ridge.halfZ * 2 + width)],
    ),
  ]
}

/** Total run from the eave to the ridge; the sensitivity probe reads it. */
export function roofRun(layout: Layout): number {
  return hipRun(layout.roof)
}
