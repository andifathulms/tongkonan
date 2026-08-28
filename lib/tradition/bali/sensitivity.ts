/**
 * What a survey would change, for this house.
 *
 * The probe list is short for the same reason the mbaru niang's is, but the
 * reason is one level further down. There, almost everything traced back to
 * four figures. Here almost everything traces back to *one* — the depa — and
 * the ratios that get from it to the smaller measures. Perturb `hastaRatio` by
 * a fifth and the post height, the overhang and the ridge rise all move
 * together, because they are all counted in hasta.
 *
 * That is worth reading off the table rather than being told: it means a
 * survey of a bale would not be a survey of a building at all. It would be a
 * measurement of the person who commissioned it.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BaliKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BaliKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'bataranHeight', labelId: 'tinggi bataran', labelEn: 'height of the bataran', read: (l) => l.bataranHeight },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'planX', labelId: 'lebar bataran', labelEn: 'width of the bataran', read: (l) => l.bataranHalfX * 2 },
  { key: 'planZ', labelId: 'panjang bataran', labelEn: 'length of the bataran', read: (l) => l.bataranHalfZ * 2 },
  { key: 'overhang', labelId: 'panjang tritisan', labelEn: 'depth of the overhang', read: (l) => (l.roof[0]?.halfX ?? 0) - l.bataranHalfX },
  { key: 'ridgeLength', labelId: 'panjang bubungan', labelEn: 'length of the ridge', read: (l) => (l.roof[l.roof.length - 1]?.halfZ ?? 0) * 2 },
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
