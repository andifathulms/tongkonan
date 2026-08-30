/**
 * What a survey would change, for this building.
 *
 * `freeboard` is the probe that matters, and it is the difference between two
 * figures neither of which is a room: how deep the hull sits and how deep it
 * is. Everywhere else in this project a survey would settle where a building
 * stands; here it would settle how much of it is under water.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, BajauKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BajauKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang perahu', labelEn: 'length of the boat', read: (l) => l.length },
  { key: 'beam', labelId: 'lebar perahu', labelEn: 'beam', read: (l) => l.halfBeam * 2 },
  { key: 'freeboard', labelId: 'sisa lambung di atas air', labelEn: 'freeboard above the water', read: (l) => l.freeboard },
  { key: 'draught', labelId: 'dalamnya terbenam', labelEn: 'how deep it sits', read: (l) => l.draught },
  { key: 'kajang', labelId: 'tinggi kajang di atas geladak', labelEn: 'height of the awning over the deck', read: (l) => l.kajang.rise },
  { key: 'deckY', labelId: 'tinggi geladak', labelEn: 'height of the deck', read: (l) => l.deckY },
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
