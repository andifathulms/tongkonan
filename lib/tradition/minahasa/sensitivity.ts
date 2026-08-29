/**
 * What a survey would change, for this building.
 *
 * `longest` is the probe worth watching, and it is not a dimension of the
 * building: it is the longest single piece the finished house contains. Every
 * other probe in this project reads a height or a span; this one reads what
 * would have to go on the lorry.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, MinahasaKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<MinahasaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang badan rumah', labelEn: 'length of the body', read: (l) => l.length },
  { key: 'width', labelId: 'lebar badan rumah', labelEn: 'width of the body', read: (l) => l.halfZ * 2 },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'height of the floor', read: (l) => l.floorY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  {
    key: 'longest',
    labelId: 'batang terpanjang yang harus diangkut',
    labelEn: 'longest piece that has to travel',
    read: (l) => Math.max(l.halfZ * 2, l.bays[0]?.halfX ? l.bays[0].halfX * 2 : 0, l.movable ? 0 : l.length),
  },
  { key: 'veranda', labelId: 'kedalaman serambi', labelEn: 'depth of the veranda', read: (l) => l.veranda.depth },
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
