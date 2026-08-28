/**
 * The roof of an omo: four planes, a short ridge, and sago leaf.
 *
 * The same core primitive the joglo and the bale use, for a third time and
 * with nothing added — which is now enough evidence to stop wondering whether
 * `steppedHip` was extracted too early.
 *
 * What differs here is proportion rather than kind. This roof rises 5.6 m over
 * a body 2.3 m tall, so the greater part of the building is roof and the loft
 * inside it is a room rather than a void. A house whose roof is most of it is
 * not a new geometry; it is the same geometry asked to carry more.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, tubeMesh } from '@/lib/core/geometry'
import { hipRun, hipSurfaceAt, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, omoInfo } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, NiasKinds, Part, Vec3 } from './types'

const builders = partBuilders<NiasKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveOversail',
  'raftersPerBay',
  'sebuaScale',
]

export function roofLevels(layout: Layout): readonly RoofLevel[] {
  return [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ: layout.eaveHalfZ, y: layout.eaveY },
    { key: 'ridge', halfX: 0, halfZ: layout.ridgeHalfZ, y: layout.ridgeY },
  ]
}

export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[1]
  if (!eave || !ridge) throw new Error('a roof needs an eave and a ridge')
  const s = omoInfo(layout.rules.omo).scale
  const section = DIMS.rafterSection.value * s
  const engage = DIMS.jointEngagement.value
  const lap = section * engage
  let order = 0

  const hasRidge = ridge.halfZ > 1e-6
  const corners: readonly (readonly [number, number])[] = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ]
  corners.forEach(([sx, sz], i) => {
    const from: Vec3 = [sx * eave.halfX, eave.y, sz * eave.halfZ]
    const to: Vec3 = [0, ridge.y, sz * Math.max(0, ridge.halfZ - lap)]
    const id = `jurai-${i}`
    parts.push(
      meshPart(
        id,
        { name: 'jurai', nameId: 'Jurai', nameEn: 'Hip rafter' },
        'rangka',
        order++,
        'kayu',
        FRAME_DIMS,
        tubeMesh([from, to], () => section / 2, 4, 0.4),
      ),
    )
    if (hasRidge) {
      joints.push({
        id: `jurai-bubungan-${i}`,
        kind: 'pasak',
        mortise: 'bubungan',
        tenon: id,
        at: [sx * (section / 4), ridge.y - section / 4, sz * (ridge.halfZ - lap / 2)],
        halfExtents: [section / 4, section / 4, lap / 2],
      })
    }
  })

  if (hasRidge) {
    parts.push(
      box(
        'bubungan',
        { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
        'rangka',
        order++,
        'kayu',
        FRAME_DIMS,
        [0, ridge.y - section / 2, 0],
        [section, section, ridge.halfZ * 2],
      ),
    )
  }

  // Common rafters, shortened where their plane runs out. Same rule as the
  // bale's: on a hip the four faces close inward as they rise.
  const rise = ridge.y - eave.y
  const perBay = Math.max(1, Math.round(DIMS.raftersPerBay.value))
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
          'rangka',
          order++,
          'kayu',
          FRAME_DIMS,
          [sx * eave.halfX * (1 - t / 2), eave.y + (rise * t) / 2, z],
          [section, runX * t, section],
          [0, 0, sx * pitchX],
        ),
      )
    }
  }
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
            'rangka',
            order++,
            'kayu',
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

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const s = omoInfo(layout.rules.omo).scale
  const levels = roofLevels(layout)
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value * s
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterSection',
    'sebuaScale',
  ]
  let order = 0

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `rumbia-${band.course}`,
        {
          name: 'rumbia',
          nameId: `Lapis rumbia ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'rumbia',
        order++,
        'rumbia',
        dims,
        steppedHip(levels, {
          uvScale: 0.4,
          fFrom: from,
          fTo: to,
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/** Total run from the eave to the ridge; the sensitivity probe reads it. */
export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}

/** The outside of the thatch at the ridge, for anything that must sit on it. */
export function thatchTop(layout: Layout): number {
  const s = omoInfo(layout.rules.omo).scale
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value
  return hipSurfaceAt(roofLevels(layout), 1, bed).y
}
