/**
 * What a survey would change, for this house.
 *
 * The table reads differently from every other one here, and the difference is
 * the point. `shareLength` moves the length of the building more than any
 * dimension moves anything in any other pack — because it is multiplied by the
 * household count, so a fifth of an error in it is a fifth of an error in a
 * building that may be eighty metres long.
 *
 * And it says something the other packs cannot: measuring a real betang would
 * pin the share, not the house. Every figure in this table would improve; the
 * length would still be unknown, because the length is not a property of the
 * building type. That is the correct answer rather than a gap.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { DayakKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<DayakKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang rumah', labelEn: 'length of the house', read: (l) => l.length },
  { key: 'width', labelId: 'lebar rumah', labelEn: 'width of the house', read: (l) => l.halfX * 2 },
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'sami', labelId: 'lebar galeri', labelEn: 'depth of the gallery', read: (l) => l.samiDepth },
  { key: 'bilik', labelId: 'dalam bilik', labelEn: 'depth of a bilik', read: (l) => l.bilikDepth },
  { key: 'share', labelId: 'panjang bagian keluarga', labelEn: 'length of one share', read: (l) => (l.shares[0]?.halfZ ?? 0) * 2 },
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
