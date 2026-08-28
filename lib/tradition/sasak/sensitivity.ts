/**
 * What a survey would change, for this granary.
 *
 * The row to read is `guardOverhang`, and it is unlike anything in the other
 * eleven tables for a reason that has nothing to do with how far it moves
 * anything. It moves almost nothing: a fifth more overhang changes one disc's
 * radius by a few centimetres and the building is otherwise identical.
 *
 * But it is the only figure in this project on which a *function* turns rather
 * than a form. Every other sensitive dimension changes how a building looks or
 * how much of it there is; this one changes whether the defence works. A table
 * that ranked rows by displacement would put it near the bottom, and the note
 * on the dimension is there because the ranking would mislead.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, Rules, SasakKinds } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<SasakKinds>

type Partial = Omit<Layout, 'roof' | 'dims'>

const PROBES: readonly Probe<Partial>[] = [
  {
    key: 'guard',
    labelId: 'juraian cakram',
    labelEn: 'overhang of the guard',
    read: (l) => (l.posts[0]?.guardRadius ?? 0) - l.postSection / 2,
  },
  { key: 'floorY', labelId: 'tinggi lantai simpan', labelEn: 'height of the store floor', read: (l) => l.floorY },
  { key: 'storeH', labelId: 'tinggi ruang simpan', labelEn: 'height of the store', read: (l) => l.storeHeight },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'planX', labelId: 'jarak tiang melintang', labelEn: 'post spacing across', read: (l) => l.halfX * 2 },
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
