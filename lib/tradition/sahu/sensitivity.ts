/**
 * What a survey would change.
 *
 * Sasadu still stand and are still built, and a tape measure would settle most
 * of this table in a morning. The figure it would settle that matters is the
 * step between one opening and the next: everything this pack claims rests on
 * those differences being real and ordered, and a survey of three halls would
 * say whether they are — or whether the difference is smaller, larger, or not
 * a constant step at all.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { SahuKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SahuKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'length', labelId: 'panjang balai', labelEn: 'length of the hall', read: (l) => l.halfZ * 2 },
  { key: 'high', labelId: 'bukaan tertinggi', labelEn: 'the highest opening', read: (l) => Math.max(...l.doors.map((d) => d.head)) },
  { key: 'low', labelId: 'bukaan terendah', labelEn: 'the lowest opening', read: (l) => Math.min(...l.doors.map((d) => d.head)) },
  { key: 'bow', labelId: 'sisa membungkuk pada bukaan tertinggi', labelEn: 'how far the highest opening makes you stoop', read: (l) => l.body.standing - Math.max(...l.doors.map((d) => d.head)) },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
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
