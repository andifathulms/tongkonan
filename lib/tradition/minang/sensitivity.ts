/**
 * What a survey would change, for this house.
 *
 * The mechanism is in `lib/core/sensitivity.ts`. What belongs here is the
 * judgement it cannot make: which outputs a reader would notice moving.
 *
 * Two of these have no counterpart in the other house. `anjuangY` is where
 * the raised end floor sits, and it is the number the whole laras question
 * turns on; `ridgeEndY` is where the gonjong spring from. Probing what the
 * building is *about* is the point — a probe list copied from the tongkonan
 * would have measured this house against another one's concerns.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, MinangKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<MinangKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'bodyLength', labelId: 'panjang badan', labelEn: 'body length', read: (l) => l.bodyLength },
  { key: 'bodyDepth', labelId: 'dalam badan', labelEn: 'body depth', read: (l) => l.bodyDepth },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'ridgeEndY', labelId: 'ujung bubungan', labelEn: 'ridge end', read: (l) => l.ridgeEndY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'eaveHalfDepth', labelId: 'jangkauan atap', labelEn: 'roof reach', read: (l) => l.eaveHalfDepth },
  { key: 'deckY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.deckY },
  { key: 'anjuangY', labelId: 'tinggi anjuang', labelEn: 'anjuang height', read: (l) => l.anjuangY },
]

export function sensitivities(rules: Rules = DEFAULT_RULES): readonly Sensitivity[] {
  return coreSensitivities(PACK, PROBES, () => resolveLayout(rules))
}

export function sensitivityOf(
  table: readonly Sensitivity[],
  key: DimKey,
): Sensitivity | undefined {
  return coreSensitivityOf(table, key)
}

export function probeLabel(key: string): { id: string; en: string } {
  const probe = PROBES.find((p) => p.key === key)
  return probe ? { id: probe.labelId, en: probe.labelEn } : { id: key, en: key }
}
