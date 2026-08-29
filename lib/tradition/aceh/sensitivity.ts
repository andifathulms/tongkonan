/**
 * What a survey would change, for this building.
 *
 * `steps` is the odd one and it is not a length at all: it is a count, and it
 * is the only probe in the project whose interesting property is its parity.
 * A fifth off the rise of a tread moves it by two, which the table reports as
 * a number and the check reads as a rule broken.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, AcehKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<AcehKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang rumah (timur–barat)', labelEn: 'length of the house, east–west', read: (l) => l.length },
  { key: 'floorY', labelId: 'tinggi lantai serambi', labelEn: 'height of the veranda floor', read: (l) => l.floorY },
  { key: 'tungai', labelId: 'tinggi lantai tungai', labelEn: 'height of the raised room', read: (l) => l.floorY + l.raise },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'steps', labelId: 'jumlah anak tangga', labelEn: 'number of treads', read: (l) => l.ladder.steps },
  { key: 'plateY', labelId: 'tinggi tepi atap', labelEn: 'height of the eave', read: (l) => l.plateY },
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
