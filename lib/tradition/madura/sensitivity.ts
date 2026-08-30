/**
 * What a survey would change.
 *
 * Unusually for this project, the most important thing about this subject is
 * not a length at all: it is an arrangement, and an arrangement is either
 * right or wrong rather than accurate to a centimetre. A survey would settle
 * the yard's width and the pitch of the row, which are the two figures that
 * decide whether the thing reads as one household group or as a street.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MaduraKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<MaduraKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'yard', labelId: 'panjang tanean', labelEn: 'length of the yard', read: (l) => l.yard.halfZ * 2 },
  { key: 'width', labelId: 'lebar tanean', labelEn: 'width of the yard', read: (l) => l.yard.halfX * 2 },
  { key: 'area', labelId: 'luas tanean', labelEn: 'area of the yard', read: (l) => l.yard.halfX * 2 * l.yard.halfZ * 2 },
  { key: 'rank', labelId: 'kelebihan lebar rumah induk', labelEn: 'how much wider the tonghuh is', read: (l) => (l.houses[0]?.width ?? 0) - (l.houses[1]?.width ?? l.houses[0]?.width ?? 0) },
  { key: 'ridge', labelId: 'tinggi bubungan rumah', labelEn: 'height of a house ridge', read: (l) => l.houses[0]?.ridgeY ?? 0 },
  { key: 'langgar', labelId: 'jarak langgar dari rumah induk', labelEn: 'setback of the langgar', read: (l) => Math.abs(l.langgar.z - (l.houses[0]?.z ?? 0)) },
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
