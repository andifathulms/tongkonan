/**
 * What a survey would change, for this house.
 *
 * The table has a row that behaves unlike any other in the project:
 * `timpaRise` moves nothing structural at all. Perturb it and no height, span
 * or clearance in the building shifts — only how far up the gable the claim
 * reaches, and therefore how far away it can be read. A survey would sharpen
 * it and the building would be identical.
 *
 * Which is the whole point of the house, arriving in the one place it can be
 * measured rather than argued: a dimension that changes what the building
 * *says* and nothing about what it *is*.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BugisKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BugisKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'planX', labelId: 'lebar rumah', labelEn: 'width of the house', read: (l) => l.halfX * 2 },
  { key: 'planZ', labelId: 'panjang rumah', labelEn: 'length of the house', read: (l) => l.halfZ * 2 },
  {
    key: 'rankReach',
    labelId: 'tinggi papan teratas',
    labelEn: 'height of the topmost board',
    read: (l) => l.timpa[l.timpa.length - 1]?.y ?? 0,
  },
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
