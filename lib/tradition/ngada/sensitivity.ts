/**
 * What a survey would change — and here it would change less than usual.
 *
 * Two of the numbers that matter most on this building are not the builders'
 * to state. The taper of a wanbon and the diameter it happens to have at the
 * ground are the tree's, and they differ from tree to tree in the same
 * village; a survey of one house would pin that house and nothing else. The
 * betang made the same point about its length: some figures are properties of
 * an instance rather than of a type, and measuring harder does not fix that.
 *
 * What a survey *would* settle is the height, which is the one figure everyone
 * quotes and the one most distorted in circulation. See the caution.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { NgadaKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<NgadaKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'post', labelId: 'tinggi tiang ngadhu', labelEn: 'height of the ngadhu post', read: (l) => l.pairs[0]?.ngadhu.postTop ?? 0 },
  { key: 'apex', labelId: 'puncak topi ijuk', labelEn: 'apex of the thatch cap', read: (l) => l.pairs[0]?.ngadhu.apexY ?? 0 },
  { key: 'bhaga', labelId: 'tinggi bubungan bhaga', labelEn: 'ridge of the bhaga', read: (l) => l.pairs[0]?.bhaga.ridgeY ?? 0 },
  { key: 'square', labelId: 'panjang nua', labelEn: 'length of the square', read: (l) => l.nua.halfZ * 2 },
  { key: 'door', labelId: 'sisa antara bukaan dan tubuh', labelEn: 'margin between the opening and a body', read: (l) => l.body.crouching - l.opening.height },
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
