/**
 * The roof of a saoraja: a gable, and the boards on its face.
 *
 * `steppedHip` with equal half-lengths at both levels, which is the same
 * gable the betang gets — the fifth distinct form out of one primitive, and by
 * now not news.
 *
 * What is new is what goes on the gable afterwards. The timpa laja is built
 * here because it is placed from the roof: each board is as wide as the gable
 * is at its own height. It is emitted in its own stage, last, and nothing
 * bears on it — which is the whole claim, and `checkRankCarriesNothing` is the
 * check that says so.
 */

import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { clamp01 } from '@/lib/core/geometry'
import { hipRun, steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, rumahInfo } from './rules'
import type { DimKey } from './rules'
import type { BugisKinds, Joint, Layout, Part } from './types'

const builders = partBuilders<BugisKinds>()
const box = builders.box
const meshPart = builders.mesh

const FRAME_DIMS: readonly DimKey[] = [
  'rafterSection',
  'ridgeRise',
  'eaveOversail',
  'raftersPerBay',
  'saorajaScale',
]

/** Eave and ridge at the same half-length: a gable, not a hip. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  return [
    { key: 'eave', halfX: layout.eaveHalfX, halfZ: layout.eaveHalfZ, y: layout.eaveY },
    { key: 'ridge', halfX: 0, halfZ: layout.eaveHalfZ, y: layout.ridgeY },
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
  const s = rumahInfo(layout.rules.rumah).scale
  const section = DIMS.rafterSection.value * s
  const engage = DIMS.jointEngagement.value
  let order = 0

  const rise = ridge.y - eave.y
  const pitch = Math.atan2(eave.halfX, rise)
  const run = Math.hypot(eave.halfX, rise)
  const perBay = Math.max(1, Math.round(DIMS.raftersPerBay.value))
  const count = perBay * Math.max(1, layout.bays)

  for (const sx of [-1, 1] as const) {
    for (let k = 0; k <= count; k++) {
      const z = -ridge.halfZ + (k / count) * ridge.halfZ * 2
      const id = `kasau-${sx > 0 ? 'a' : 'b'}-${k}`
      parts.push(
        box(
          id,
          { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
          'pamiring',
          order++,
          'bambu',
          FRAME_DIMS,
          [(sx * eave.halfX) / 2, (eave.y + ridge.y) / 2, z],
          [section, run, section],
          [0, 0, sx * pitch],
        ),
      )
      const lo = Math.max(z - section / 2, -ridge.halfZ)
      const hi = Math.min(z + section / 2, ridge.halfZ)
      joints.push({
        id: `takik-${sx > 0 ? 'a' : 'b'}-${k}`,
        kind: 'takik',
        mortise: 'bubungan',
        tenon: id,
        at: [sx * (section / 4), ridge.y - section / 2, (lo + hi) / 2],
        halfExtents: [section / 4, (section * engage) / 2, (hi - lo) / 2],
      })
    }
  }

  // The ridge, after the rafters that carry it.
  parts.push(
    box(
      'bubungan',
      { name: 'bubungan', nameId: 'Bubungan', nameEn: 'Ridge piece' },
      'pamiring',
      order++,
      'kayu',
      FRAME_DIMS,
      [0, ridge.y - section / 2, 0],
      [section, section, ridge.halfZ * 2],
    ),
  )

  return { parts, joints }
}

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const s = rumahInfo(layout.rules.rumah).scale
  const levels = roofLevels(layout)
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value * s
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterSection',
    'saorajaScale',
  ]
  let order = 0

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    parts.push(
      meshPart(
        `atap-${band.course}`,
        {
          name: 'nipah',
          nameId: `Lapis nipah ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'atap',
        order++,
        'nipah',
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

/**
 * The timpa laja: the rank, on the gable, holding nothing.
 *
 * Emitted last and standing proud of the gable face rather than let into it,
 * because a board set into the roof plane would be doing something. These are
 * screwed onto the outside of a finished building, and the model says so by
 * putting them outside it.
 */
export function buildTimpa(layout: Layout): readonly Part[] {
  const s = rumahInfo(layout.rules.rumah).scale
  const bed = (DIMS.rafterSection.value * s) / 2 + DIMS.thatchBed.value + DIMS.thatchThickness.value * s
  const thickness = DIMS.timpaThickness.value * s
  const dims: readonly DimKey[] = [
    'timpaRise',
    'timpaThickness',
    'timpaInset',
    'rankCarriesNothing',
    'oddOnly',
  ]
  const parts: Part[] = []
  for (const sz of [-1, 1] as const) {
    layout.timpa.forEach((board) => {
      parts.push(
        box(
          `${board.id}-${sz > 0 ? 'a' : 'b'}`,
          {
            name: 'timpa laja',
            nameId: `Timpa laja ${board.index + 1}`,
            nameEn: `Timpa laja ${board.index + 1}`,
          },
          'timpa',
          board.index,
          'papan',
          dims,
          // Flat on the gable: the inner face lies on the thatch, so the board is
          // carried by the roof even though it carries nothing itself.
          [0, board.y, sz * (layout.eaveHalfZ + bed + thickness / 2)],
          [board.halfSpan * 2, board.depth, thickness],
        ),
      )
    })
  }
  return parts
}

export function roofRun(layout: Layout): number {
  return hipRun(roofLevels(layout))
}
