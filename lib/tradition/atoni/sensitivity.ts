/**
 * What a survey would change.
 *
 * These stand in thousands across the hills of South Central Timor and are
 * still built. The shapes are not in doubt and neither is the arrangement;
 * every number is, because the sources are ethnography — one of them is about
 * *order* in the Atoni house rather than about its dimensions — and the figure
 * that matters most here, how far up the smoke stays useful, is not a building
 * dimension at all. It is the author's, and no measured drawing would settle
 * it: it would take somebody hanging maize at different heights and coming
 * back at the next planting.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { AtoniKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<AtoniKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'apex', labelId: 'tinggi puncak', labelEn: 'height of the apex', read: (l) => l.apexY },
  { key: 'loft', labelId: 'tinggi para', labelEn: 'height of the loft', read: (l) => l.loft.y },
  { key: 'seed', labelId: 'puncak benih', labelEn: 'top of the seed', read: (l) => l.loft.y + l.loft.depth },
  { key: 'margin', labelId: 'sisa asap di atas benih', labelEn: 'smoke left above the seed', read: (l) => l.smoke.to - (l.loft.y + l.loft.depth) },
  { key: 'door', labelId: 'sisa antara pintu dan orang berdiri', labelEn: 'margin between the door and a standing person', read: (l) => l.body.standing - l.door.height },
  { key: 'plan', labelId: 'garis tengah rumah', labelEn: 'diameter of the house', read: (l) => l.radius * 2 },
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
