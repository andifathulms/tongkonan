/**
 * What a survey would change — and here a survey has a problem the other
 * twenty-two do not.
 *
 * A bade is built in a few weeks and burned the same afternoon. There is no
 * standing example anywhere to measure, and there never will be: the only
 * bade a surveyor could measure is one that has not been used yet. So the
 * figures here could stop being the author's, but not the way the others
 * could — somebody would have to be measuring a building on the morning of a
 * cremation, which is not a thing anybody does.
 *
 * The waruga, two buildings ago, is the exact other end of this: hundreds of
 * them survive, unchanged, in fields. Two buildings for the dead, and the one
 * made of stone is the one that can be measured.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, BadeKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BadeKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'frame', labelId: 'sisi usungan', labelEn: 'side of the lattice', read: (l) => l.frame.halfX * 2 },
  { key: 'apex', labelId: 'tinggi puncak', labelEn: 'height of the apex', read: (l) => l.apexY },
  { key: 'body', labelId: 'tinggi badan', labelEn: 'height of the body', read: (l) => l.body.height },
  { key: 'tier', labelId: 'lebar tingkat teratas', labelEn: 'width of the topmost tier', read: (l) => (l.tiers[l.tiers.length - 1]?.halfX ?? 0) * 2 },
  { key: 'slender', labelId: 'tinggi puncak per setengah lebar usungan', labelEn: 'apex height per half-width of lattice', read: (l) => l.apexY / l.frame.halfX },
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
