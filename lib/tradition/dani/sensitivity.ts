/**
 * What a survey would change, for this building.
 *
 * The shortest table in the project, and that is the finding rather than a
 * gap: a honai has very few independent numbers. A radius, a wall height, an
 * apex, a door, a loft. Almost nothing is derived from anything else because
 * there is almost nothing to derive — which is what a building reduced to one
 * job looks like from the inside.
 *
 * `layerDepth` is worth watching for the opposite reason to everything else in
 * these tables: it moves the outside of the roof and nothing whatever inside.
 * A thicker blanket is a bigger building containing exactly the same room.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { DaniKinds, Layout, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<DaniKinds>

const PROBES: readonly Probe<Layout>[] = [
  { key: 'volume', labelId: 'isi ruangnya', labelEn: 'volume of the room', read: (l) => l.volume },
  { key: 'radius', labelId: 'jari-jari dinding', labelEn: 'radius of the wall', read: (l) => l.radius },
  { key: 'apexY', labelId: 'tinggi puncak', labelEn: 'height of the apex', read: (l) => l.apexY },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'doorH', labelId: 'tinggi pintu', labelEn: 'height of the door', read: (l) => l.door.height },
  { key: 'loftY', labelId: 'tinggi loteng', labelEn: 'height of the loft', read: (l) => l.loft.y },
  { key: 'blanket', labelId: 'tebal selimut', labelEn: 'thickness of the blanket', read: (l) => l.thatchDepth },
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
