/**
 * What a survey would change — and one number it could not touch.
 *
 * Dalam Loka stands at Sumbawa Besar, restored and open, and every metre in
 * this table could be replaced by a measured one. Ninety-nine could not: it is
 * not a measurement, and a survey that came back with ninety-seven posts would
 * be a finding about a restoration rather than about the rule. It is the only
 * figure in this project that a tape measure can check and cannot correct.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { SumbawaKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SumbawaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'plan', labelId: 'panjang bangunan', labelEn: 'length of the building', read: (l) => l.halfZ * 2 },
  { key: 'width', labelId: 'lebar bangunan', labelEn: 'width of the building', read: (l) => l.halfX * 2 },
  { key: 'bay', labelId: 'jarak antar tiang', labelEn: 'spacing of the posts', read: (l) => l.spacing.bay },
  { key: 'margin', labelId: 'sisa terhadap bentang balok', labelEn: 'margin against what a beam crosses', read: (l) => l.spacing.limit - l.spacing.bay },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
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
