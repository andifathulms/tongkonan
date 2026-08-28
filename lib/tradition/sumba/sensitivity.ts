/**
 * What a survey would change, for this house.
 *
 * One row dominates this table and it is the one that should: `menaraRise`
 * moves the peak further than any dimension moves anything in any other pack,
 * because it is a ratio applied to the whole house and then multiplied by the
 * tower rule. It is also `interpolated` with no source behind it.
 *
 * That combination — the most consequential number and among the least
 * supported — is exactly what the sensitivity table exists to surface. It is
 * not a defect to be tidied away by picking a firmer-sounding value; it is the
 * honest state of knowledge about this building, and the reason a survey of a
 * single uma would be worth more here than anywhere else in the project.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules, SumbaKinds } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SumbaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'peakY', labelId: 'tinggi puncak', labelEn: 'height of the peak', read: (l) => l.menara.peakY },
  { key: 'loftY', labelId: 'tinggi uma deta', labelEn: 'height of the loft', read: (l) => l.menara.loftY },
  { key: 'shoulderY', labelId: 'tinggi bahu', labelEn: 'height of the shoulder', read: (l) => l.shoulderY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
  { key: 'coreX', labelId: 'lebar inti', labelEn: 'width of the core', read: (l) => l.coreHalfX * 2 },
  { key: 'eaveX', labelId: 'lebar tepi atap', labelEn: 'width of the eave', read: (l) => l.eaveHalfX * 2 },
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
