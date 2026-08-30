/**
 * What a survey would change.
 *
 * More than usual, and for an unusual reason: the malige still stands at
 * Baubau and has been measured by people who were not this author. The
 * figures here are a reading of published descriptions rather than of a
 * drawing, which puts this pack in the same position as most of the others
 * and closer than some to being fixable — the building is there, it is
 * standing, and somebody has the dimensions.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { ButonKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<ButonKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'base', labelId: 'lebar lantai bawah', labelEn: 'width of the ground floor', read: (l) => (l.storeys[0]?.halfX ?? 0) * 2 },
  { key: 'top', labelId: 'lebar lantai teratas', labelEn: 'width of the topmost floor', read: (l) => (l.storeys[l.storeys.length - 1]?.halfX ?? 0) * 2 },
  { key: 'lean', labelId: 'selisih lebar puncak dan dasar', labelEn: 'how much wider the top is than the base', read: (l) => ((l.storeys[l.storeys.length - 1]?.halfX ?? 0) - (l.storeys[0]?.halfX ?? 0)) * 2 },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'margin', labelId: 'sisa jangkauan lengan teratas', labelEn: 'reach left in the topmost arm', read: (l) => l.reach - ((l.storeys[l.storeys.length - 1]?.halfX ?? 0) - (l.storeys[0]?.halfX ?? 0)) },
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
