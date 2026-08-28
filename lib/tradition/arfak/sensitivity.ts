/**
 * What a survey would change, for this house.
 *
 * `legPitch` is the row that behaves unlike any other in the project. Perturb
 * it and the building's size does not change at all — the plan is set by the
 * bay length and the body width — but the *number of legs* moves sharply,
 * because the count follows from the spacing and the area rather than the
 * other way about. It is the only dimension in the collection whose effect is
 * best read as a count rather than a length, and the probe reports it as one.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { ArfakKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<ArfakKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'legCount', labelId: 'jumlah kaki', labelEn: 'number of legs', read: (l) => l.legs.length },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'planX', labelId: 'lebar badan', labelEn: 'width of the body', read: (l) => l.halfX * 2 },
  { key: 'planZ', labelId: 'panjang badan', labelEn: 'length of the body', read: (l) => l.halfZ * 2 },
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
