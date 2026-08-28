/**
 * What a survey would change, for this house.
 *
 * `stepRise` is the row to read, and it is unlike anything in the other eight
 * tables. Everywhere else the most sensitive dimension moves a height or a
 * span; this one moves *how sharply a household distinguishes between its
 * guests*, because the rise between levels is that distinction expressed in
 * metres. A fifth of an error in it is a fifth of an error in the building's
 * only social claim.
 *
 * And it is `interpolated` against no source. That combination — a figure
 * carrying the whole argument and resting on nothing — has now appeared twice,
 * here and in the uma's tower. It is what the table is for.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, PalembangKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<PalembangKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'topY', labelId: 'tinggi tingkat teratas', labelEn: 'height of the topmost level', read: (l) => l.topY },
  { key: 'rise', labelId: 'beda tinggi seluruh urutan', labelEn: 'rise across the whole sequence', read: (l) => l.topY - l.floorY },
  { key: 'depth', labelId: 'kedalaman rumah', labelEn: 'depth of the house', read: (l) => l.halfX * 2 },
  { key: 'width', labelId: 'lebar rumah', labelEn: 'width of the house', read: (l) => l.halfZ * 2 },
  { key: 'floorY', labelId: 'tinggi lantai terdepan', labelEn: 'height of the frontmost floor', read: (l) => l.floorY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'headroom', labelId: 'kepala di tingkat teratas', labelEn: 'headroom at the top level', read: (l) => l.eaveY - l.topY },
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
