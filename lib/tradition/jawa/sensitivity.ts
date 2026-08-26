/**
 * What a survey would change, for this house.
 *
 * The mechanism is in `lib/core/sensitivity.ts`. What belongs here is the
 * judgement it cannot make: which outputs a reader would notice moving.
 *
 * Two of these exist nowhere else. `tumpangTopY` is where the corbelled stack
 * finishes closing, which is the rank signal and the thing a person standing
 * in the middle of the house looks up at. `floorY` is the plinth — trivially
 * small, and worth probing precisely because it is: if it turns out to be
 * load-bearing on the rest of the model, that is a finding about a house that
 * is supposed to sit on the ground.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { JawaKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<JawaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'bodyDepth', labelId: 'dalam badan', labelEn: 'body depth', read: (l) => l.bodyDepth },
  { key: 'bodyLength', labelId: 'panjang badan', labelEn: 'body length', read: (l) => l.bodyLength },
  { key: 'ridgeY', labelId: 'tinggi molo', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'eaveReach', labelId: 'jangkauan atap', labelEn: 'roof reach', read: (l) => l.roof[0]?.halfX ?? 0 },
  { key: 'tumpangTopY', labelId: 'puncak tumpang sari', labelEn: 'top of the tumpang sari', read: (l) => l.tumpangTopY },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
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
