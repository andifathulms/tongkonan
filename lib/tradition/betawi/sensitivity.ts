/**
 * What a survey would change — and this is the one pack where a survey is the
 * least of it.
 *
 * Rumah kebaya still stand in Jakarta, at Condet and Setu Babakan and along
 * streets nobody has listed, and they have been measured. What no drawing
 * settles is the figure this pack turns on: how much room a house has to leave
 * to the line beside it. That is not a property of the building at all. It is
 * a rule about neighbours, and it changes from one street to the next.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BetawiKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BetawiKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'width', labelId: 'lebar rumah', labelEn: 'width of the house', read: (l) => l.house.halfX * 2 },
  { key: 'margin', labelId: 'sisa ke garis batas', labelEn: 'room left to the boundary', read: (l) => l.margin },
  { key: 'langkan', labelId: 'dalam langkan', labelEn: 'depth of the terrace', read: (l) => l.langkan.depth },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'fold', labelId: 'letak lipatan atap', labelEn: 'where the roof folds', read: (l) => l.fold.at },
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
