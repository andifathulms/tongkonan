/**
 * What a survey would change, for this building.
 *
 * `hearthGap` is the probe to watch, and it is a clearance rather than a size:
 * how much room there is between an open fire and the nearest post. On every
 * other house in this project that distance is settled by a partition; here
 * there is no partition, so it is settled by a number.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, KaroKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<KaroKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang ruangnya', labelEn: 'length of the room', read: (l) => l.length },
  { key: 'width', labelId: 'lebar ruangnya', labelEn: 'width of the room', read: (l) => l.halfZ * 2 },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'height of the floor', read: (l) => l.floorY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  {
    key: 'hearthGap',
    labelId: 'jarak tungku ke dinding terdekat',
    labelEn: 'gap from a hearth to the nearest wall',
    read: (l) => l.halfZ - (l.hearths[0]?.radius ?? 0),
  },
  {
    key: 'place',
    labelId: 'jarak antara dua tempat berurutan',
    labelEn: 'distance between consecutive places',
    read: (l) => (l.jabu[2]?.x ?? 0) - (l.jabu[0]?.x ?? 0),
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
