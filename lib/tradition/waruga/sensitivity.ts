/**
 * What a survey would change, for this building — and here a survey would be
 * unusually easy to do.
 *
 * A waruga is a stone box standing in a field with nothing on it that decays,
 * and hundreds of them survive. Of the twenty-two buildings in this project it
 * is the one whose figures could most readily stop being the author's, which
 * is worth saying next to a table of numbers that are all still guesses.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, WarugaKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<WarugaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'chamber', labelId: 'tinggi ruang', labelEn: 'height of the chamber', read: (l) => l.chamber.height },
  { key: 'block', labelId: 'tinggi peti dari blok', labelEn: 'height cut from the block', read: (l) => l.block.height },
  { key: 'plan', labelId: 'sisi denah peti', labelEn: 'plan of the box', read: (l) => l.block.halfX * 2 },
  { key: 'lid', labelId: 'tinggi tutup', labelEn: 'height of the lid', read: (l) => l.lid.rise },
  { key: 'headroom', labelId: 'ruang sisa di atas tubuh duduk', labelEn: 'room left over a seated body', read: (l) => l.chamber.height - l.body.seated },
  { key: 'base', labelId: 'tinggi alas', labelEn: 'height of the base', read: (l) => l.base.height },
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
