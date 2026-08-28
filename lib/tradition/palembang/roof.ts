/**
 * The roof of a rumah limas: four planes over a floor that is anything but.
 *
 * `steppedHip` for the fourth time, and this makes the case as well as the
 * gable did. The primitive has now produced a stepped hip, a pyramid, a
 * gable, a tower and a plain limas from one description, and the only thing
 * any of them changed was the list of rectangles handed to it.
 *
 * Worth naming what this roof does *not* do: it does not step with the floor.
 * The kekijing rise inside the building and the roof runs level over all of
 * them, which is why the wall height is measured from the topmost level — the
 * lowest level simply has more air above it, and a person standing at the
 * street end of a limas is under a great deal of roof.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01, tubeMesh } from '@/lib/core/geometry'
import { hipRun, hipSurfaceAt, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, PalembangKinds, Part, Vec3 } from './types'

const builders = partBuilders<PalembangKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveOversail',
  'raftersPerBay',
  'limasRoof',
]

export function roofLevels(layout: Layout): readonly RoofLevel[] {
  return [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ: layout.eaveHalfZ, y: layout.eaveY },
    { key: 'ridge', halfX: 0, halfZ: layout.ridgeHalfZ, y: layout.ridgeY },
  ]
}

export function tileBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.tileCourses, DIMS.tileLap.value)
}

export function buildRoofFrame(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const levels = roofLevels(layout)
  const eave = levels[0]
  const ridge = levels[1]
  if (!eave || !ridge) throw new Error('a roof needs an eave and a ridge')
  const section = DIMS.rafterSection.value
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
    parts.push(
      meshPart(
        `jurai-${i}`,
        { name: 'jurai', nameId: 'Jurai', nameEn: 'Hip rafter' },
        'rangka',
        order++,
        'tembesu',
        FRAME_DIMS,
        tubeMesh([from, to], () => section / 2, 4, 0.4),
      ),
    )
  })

  const rise = ridge.y - eave.y
  const perBay = Math.max(1, Math.round(DIMS.raftersPerBay.value))
  const pitchX = Math.atan2(eave.halfX, rise)
  const runX = Math.hypot(eave.halfX, rise)
  const closeZ = eave.halfZ - ridge.halfZ
  const alongCount = perBay * Math.max(1, layout.bays)
  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= alongCount; k++) {
      const z = -eave.halfZ + (k / alongCount) * eave.halfZ * 2
      const t = closeZ <= 1e-9 ? 1 : Math.min(1, (eave.halfZ - Math.abs(z)) / closeZ)
      if (t <= 1e-6) continue
      parts.push(
        box(
          `kasau-${sx > 0 ? 'a' : 'b'}-${k}`,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'rangka',
          order++,
          'tembesu',
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
  const acrossCount = perBay * Math.max(1, layout.levels.length)
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
            'tembesu',
            FRAME_DIMS,
            [x, eave.y + (rise * t) / 2, sz * (eave.halfZ - (closeZ * t) / 2)],
            [section, runZ * t, section],
            [-sz * pitchZ, 0, 0],
          ),
        )
      }
    }
  }

  // The ridge, after the hips that carry it — the lesson two houses ago.
  if (hasRidge) {
    parts.push(
      box(
        'bubungan',
        { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
        'rangka',
        order++,
        'tembesu',
        FRAME_DIMS,
        [0, ridge.y - section / 2, 0],
        [section, section, ridge.halfZ * 2],
      ),
    )
    corners.forEach(([sx, sz], i) => {
      joints.push({
        id: `pasak-jurai-${i}`,
        kind: 'pasak',
        mortise: 'bubungan',
        tenon: `jurai-${i}`,
        at: [sx * (section / 4), ridge.y - section / 4, sz * (ridge.halfZ - lap / 2)],
        halfExtents: [section / 4, section / 4, lap / 2],
      })
    })
  }

  return { parts, joints }
}

export function buildTiles(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const levels = roofLevels(layout)
  const bed = DIMS.rafterSection.value / 2 + DIMS.tileBed.value
  const thickness = DIMS.tileThickness.value
  const dims: readonly DimKey[] = [
    'tileCourseDepth',
    'tileThickness',
    'tileLap',
    'tileBed',
    'rafterSection',
    'limasRoof',
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
          nameId: `Lapis genteng ${band.course + 1}`,
          nameEn: `Tile course ${band.course + 1}`,
        },
        'genteng',
        order++,
        'genteng',
        dims,
        steppedHip(levels, {
          uvScale: 0.35,
          fFrom: from,
          fTo: to,
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/** The ornaments at the ends of the ridge. */
export function buildSimbar(layout: Layout): readonly Part[] {
  const levels = roofLevels(layout)
  const bed = DIMS.rafterSection.value / 2 + DIMS.tileBed.value
  const top = hipSurfaceAt(levels, 1, bed)
  const sec = DIMS.simbarSection.value
  if (top.halfZ < sec) return []
  return [-1, 1].map((sz) =>
    box(
      `simbar-${sz > 0 ? 'a' : 'b'}`,
      { name: 'simbar', nameId: 'Simbar', nameEn: 'Ridge ornament' },
      'simbar',
      sz > 0 ? 1 : 0,
      'tembesu',
      ['simbarRise', 'simbarSection', 'limasRoof'],
      [0, top.y - DIMS.tileThickness.value + DIMS.simbarRise.value / 2, sz * (top.halfZ - sec)],
      [sec, DIMS.simbarRise.value, sec],
    ),
  )
}

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
