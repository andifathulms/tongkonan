/**
 * What a survey would change.
 *
 * Balai of this kind still stand and are still built — several of them as
 * provincial adat halls — so most of this table is a morning's work with a
 * tape. The figure worth measuring first is the fall itself: everything this
 * pack claims turns on it being a step rather than a level, and one
 * measurement of one hall would say whether the author's guess is anywhere
 * near.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { RiauKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<RiauKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'fall', labelId: 'jatuhnya lantai selaso', labelEn: 'the fall of the aisle floor', read: (l) => l.drop.fall },
  { key: 'margin', labelId: 'sisa terhadap satu langkah', labelEn: 'margin against a single step', read: (l) => l.drop.step - l.drop.fall },
  { key: 'length', labelId: 'panjang balai', labelEn: 'length of the hall', read: (l) => l.middle.halfZ * 2 },
  { key: 'width', labelId: 'lebar seluruhnya', labelEn: 'width over all', read: (l) => l.middle.halfX * 2 + (l.aisles[0]?.halfX ?? 0) * 4 },
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
