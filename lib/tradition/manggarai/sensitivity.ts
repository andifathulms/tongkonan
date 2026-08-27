/**
 * What a survey would change, for this house.
 *
 * The mechanism is in `lib/core/sensitivity.ts`. What belongs here is which
 * outputs a reader would notice moving — and for a round house that is a
 * shorter list than for the others, because there are fewer independent
 * numbers. The five floors follow from two heights and the cone; the cone
 * follows from a radius and an apex. Almost everything visible traces back to
 * four figures, which is worth knowing: it means a survey of this building
 * would move the bar further per measurement than a survey of any other here.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, ManggaraiKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<ManggaraiKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'baseRadius', labelId: 'jari-jari dasar', labelEn: 'base radius', read: (l) => l.baseRadius },
  { key: 'apexY', labelId: 'tinggi puncak', labelEn: 'apex height', read: (l) => l.apexY },
  { key: 'luturY', labelId: 'tinggi lantai hunian', labelEn: 'living floor height', read: (l) => l.levels[0]?.y ?? 0 },
  { key: 'luturRadius', labelId: 'lebar lantai hunian', labelEn: 'living floor radius', read: (l) => l.levels[0]?.radius ?? 0 },
  { key: 'topY', labelId: 'tinggi lantai teratas', labelEn: 'top floor height', read: (l) => l.levels[l.levels.length - 1]?.y ?? 0 },
  { key: 'topRadius', labelId: 'lebar lantai teratas', labelEn: 'top floor radius', read: (l) => l.levels[l.levels.length - 1]?.radius ?? 0 },
  { key: 'postRadius', labelId: 'lingkaran tiang', labelEn: 'ring of posts', read: (l) => l.postRadius },
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
