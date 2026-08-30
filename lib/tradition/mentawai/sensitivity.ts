/**
 * What a survey would change.
 *
 * A great deal, and less than you would think. The metres here are the
 * author's, as everywhere in this project — but the figure this pack turns on
 * is not a metre at all. Whether anybody is senior in an uma is not settled by
 * measuring it, and no drawing would say. A survey would fix the width, the
 * share, the spacing of the bearers; it would leave the thing that made this
 * building worth including exactly where it is.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { MentawaiKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<MentawaiKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang rumah', labelEn: 'length of the house', read: (l) => l.halfZ * 2 },
  { key: 'share', labelId: 'bagian tiap rumah tangga', labelEn: 'each household’s share', read: (l) => l.households[0]?.share ?? 0 },
  { key: 'front', labelId: 'dalam serambi depan', labelEn: 'depth of the front veranda', read: (l) => l.room.from - l.front.from },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'margin', labelId: 'sisa bentang papan lantai', labelEn: 'span left in a floor plank', read: (l) => l.span.plank - l.span.clear },
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
