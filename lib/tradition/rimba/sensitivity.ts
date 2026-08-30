/**
 * What a survey would change, and this is the pack where the answer is
 * bleakest.
 *
 * There is no measured drawing of a sudung and there is unlikely ever to be
 * one: the ethnography is about how people live and move rather than about how
 * they build, and going to measure a family's shelter is not a neutral act.
 * The Buton malige's zero is the easiest in this project to fix — the building
 * is standing and somebody already has the dimensions. This one's is the
 * hardest, and the reason is not that anybody has been careless.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { RimbaKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<RimbaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'floor', labelId: 'lebar lantai', labelEn: 'width of the floor', read: (l) => l.floor.halfZ * 2 },
  { key: 'depth', labelId: 'dalam lantai', labelEn: 'depth of the floor', read: (l) => l.floor.halfX * 2 },
  { key: 'longest', labelId: 'bagian terpanjang', labelEn: 'the longest member', read: (l) => l.longest },
  { key: 'margin', labelId: 'sisa terhadap batas angkut', labelEn: 'margin against what can be carried', read: (l) => l.carry - l.longest },
  { key: 'head', labelId: 'tinggi tepi atap yang tinggi', labelEn: 'height of the high edge', read: (l) => l.roof.highY },
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
