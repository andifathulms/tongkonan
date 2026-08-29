/**
 * What a survey would change, for this building.
 *
 * `spread` is the probe that matters and it is not a dimension of anything: it
 * is the difference between the longest post and the shortest, which is the
 * slope of the ground stated in metres of timber. On every other building in
 * the collection that number is zero by construction.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, SundaKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SundaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang rumah', labelEn: 'length of the house', read: (l) => l.length },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'height of the level floor', read: (l) => l.floorY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  {
    key: 'longest',
    labelId: 'tiang terpanjang',
    labelEn: 'the longest post',
    read: (l) => l.posts.reduce((m, p) => Math.max(m, p.length), 0),
  },
  {
    key: 'spread',
    labelId: 'selisih tiang terpanjang dan terpendek',
    labelEn: 'difference between the longest post and the shortest',
    read: (l) =>
      l.posts.reduce((m, p) => Math.max(m, p.length), 0) -
      l.posts.reduce((m, p) => Math.min(m, p.length), Infinity),
  },
  {
    key: 'drop',
    labelId: 'turunnya tanah sepanjang rumah',
    labelEn: 'fall of the ground along the house',
    read: (l) => l.length * l.slope,
  },
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
