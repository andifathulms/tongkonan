/**
 * What a survey would change, for this house.
 *
 * `tinggiRise` is the row, and it is the third time in this project that the
 * most consequential number in a pack is also among the least supported — after
 * the Sumbanese tower and the Palembang step. The steepness of the core ridge
 * is the thing a photograph of a bubungan tinggi is recognisable by, and no
 * source the author could reach gives an angle.
 *
 * Three packs is enough to stop calling that a coincidence of which three. It
 * looks like a property of the published literature on vernacular building:
 * what gets written down is what a form *means* and what it is *called*, and
 * the number that makes it that form does not.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { BanjarKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<BanjarKinds>

const core = (l: Layout) => l.segments.find((s) => s.key === 'palidangan')

const PROBES: readonly Probe<Layout>[] = [
  { key: 'coreRidge', labelId: 'tinggi bubungan inti', labelEn: 'height of the core ridge', read: (l) => core(l)?.ridgeY ?? 0 },
  {
    key: 'margin',
    labelId: 'selisih inti terhadap tetangganya',
    labelEn: 'how far the core clears its neighbours',
    read: (l) => (core(l)?.ridgeY ?? 0) - Math.max(...l.segments.filter((s) => s.key !== 'palidangan').map((s) => s.ridgeY)),
  },
  { key: 'depth', labelId: 'panjang rumah', labelEn: 'length of the house', read: (l) => l.depth },
  { key: 'width', labelId: 'lebar rumah', labelEn: 'width of the house', read: (l) => l.halfZ * 2 },
  { key: 'floorY', labelId: 'tinggi lantai inti', labelEn: 'height of the core floor', read: (l) => core(l)?.floorY ?? 0 },
  { key: 'drop', labelId: 'turun sampai pelataran', labelEn: 'drop to the platform', read: (l) => (core(l)?.floorY ?? 0) - (l.segments[0]?.floorY ?? 0) },
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
