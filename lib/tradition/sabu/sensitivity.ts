/**
 * What a survey would change — and one thing it would settle that no other
 * pack's would.
 *
 * The metres here are the author's, as everywhere. But the figure this pack
 * turns on is a *ratio*, and a ratio survives a survey badly done: measure ten
 * houses on Sabu and the range of length to beam is exactly what you get, with
 * no interpretation in between. This is the one pack in the project whose
 * central claim a tape measure would confirm or refute outright.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { SabuKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SabuKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'ratio', labelId: 'perbandingan panjang terhadap lebar', labelEn: 'length to beam', read: (l) => l.ratio.actual },
  { key: 'beam', labelId: 'lebar lambung', labelEn: 'the beam', read: (l) => l.halfX * 2 },
  { key: 'length', labelId: 'panjang lambung', labelEn: 'length of the hull', read: (l) => l.halfZ * 2 },
  { key: 'keel', labelId: 'tinggi lunas di atas lantai', labelEn: 'keel above the floor', read: (l) => l.ridgeY - l.floorY },
  { key: 'way-in', labelId: 'tinggi celah masuk', labelEn: 'height of the way in', read: (l) => l.eaveY - l.floorY },
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
