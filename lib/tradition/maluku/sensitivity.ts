/**
 * What a survey would change, for this building.
 *
 * The interesting entry is `seatedEye`, which is not a dimension of the
 * building at all: it is how high the eye of somebody sitting in it is, and it
 * moves nothing in the model. It is in the table anyway, because it is what
 * `checkOpenOnAllSides` measures against — a number that changes no geometry
 * and decides whether the geometry is allowed.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, MalukuKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<MalukuKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang bangunan', labelEn: 'length of the building', read: (l) => l.length },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'height of the floor', read: (l) => l.floorY },
  { key: 'plateY', labelId: 'tinggi kepala tiang', labelEn: 'height of the post heads', read: (l) => l.plateY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'band', labelId: 'tinggi pita terbuka', labelEn: 'height of the open band', read: (l) => l.sightBand.toY - l.sightBand.fromY },
  { key: 'seat', labelId: 'tinggi tempat duduk', labelEn: 'height of a seat', read: (l) => l.seat.height },
]

export function sensitivities(rules: Rules = DEFAULT_RULES): readonly Sensitivity[] {
  return coreSensitivities(PACK, PROBES, () => resolveLayout(rules))
}

export function sensitivityOf(table: readonly Sensitivity[], key: DimKey): Sensitivity | undefined {
  return coreSensitivityOf(table, key)
}

export function probeLabel(key: string): { id: string; en: string } {
  const probe = PROBES.find((p) => p.key === key)
  return probe ? { id: probe.labelId, en: probe.labelEn } : { id: key, en: key }
}
