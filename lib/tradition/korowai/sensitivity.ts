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
import type { KorowaiKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<KorowaiKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'floor', labelId: 'tinggi lantai', labelEn: 'height of the floor', read: (l) => l.floorY },
  { key: 'ridge', labelId: 'tinggi bubungan', labelEn: 'height of the ridge', read: (l) => l.ridgeY },
  { key: 'trunk', labelId: 'garis tengah batang di lantai', labelEn: 'trunk diameter at the floor', read: (l) => l.trunk.atFloor },
  { key: 'margin', labelId: 'sisa tebal batang di atas batas', labelEn: 'trunk left over the bearing limit', read: (l) => l.trunk.atFloor - l.trunk.bearing },
  { key: 'plan', labelId: 'panjang lantai', labelEn: 'length of the floor', read: (l) => l.floor.halfZ * 2 },
  { key: 'clearing', labelId: 'jari-jari tanah yang dibuka', labelEn: 'radius of the cleared ground', read: (l) => l.clearing },
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
