/**
 * What a survey would change, for this building.
 *
 * Two of these probes are unusual and for the same reason: `tide` and
 * `waterDepth` are not dimensions of the building at all. They are facts about
 * the bay, and they set the height of every floor in it — so a survey of this
 * house without a tide table would leave the most consequential number in the
 * pack exactly where it is.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, TobatiKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<TobatiKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'firstFloor', labelId: 'tinggi lantai terbawah', labelEn: 'height of the lowest floor', read: (l) => l.levels[0]?.y ?? 0 },
  { key: 'freeboard', labelId: 'jarak bebas di atas pasang', labelEn: 'clearance above the tide', read: (l) => (l.levels[0]?.y ?? 0) - l.waterDepth - l.tide },
  { key: 'apexY', labelId: 'tinggi puncak', labelEn: 'height of the point', read: (l) => l.apexY },
  { key: 'plateY', labelId: 'tinggi kepala dinding', labelEn: 'height of the wall heads', read: (l) => l.plateY },
  { key: 'baseArea', labelId: 'luas tingkat terbawah', labelEn: 'area of the lowest level', read: (l) => l.levels[0]?.area ?? 0 },
  { key: 'topArea', labelId: 'luas tingkat teratas', labelEn: 'area of the topmost level', read: (l) => l.levels[l.levels.length - 1]?.area ?? 0 },
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
