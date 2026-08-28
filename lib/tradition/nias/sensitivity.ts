/**
 * What a survey would change, for this house.
 *
 * The probe worth watching is the brace angle, which is not a dimension at
 * all: it falls out of the bay spacing and the floor height together. Perturb
 * either and the diagonals change their lean, which changes what they resist.
 * No other house in this project has an output whose meaning is structural
 * rather than dimensional, and it is the reason `floorHeight` sits so high in
 * this table while the same figure in a tongkonan only moves a deck.
 */

import { sensitivities as coreSensitivities, sensitivityOf as coreSensitivityOf } from '@/lib/core/sensitivity'
import type { Probe, Sensitivity as CoreSensitivity } from '@/lib/core/sensitivity'
import { resolveLayout } from './frame'
import { DEFAULT_RULES, PACK } from './rules'
import type { DimKey } from './rules'
import type { Layout, NiasKinds, Rules } from './types'

export { PERTURBATION } from '@/lib/core/sensitivity'

export type Sensitivity = CoreSensitivity<NiasKinds>

/** The lean of a diagonal, in degrees from the vertical. */
function braceAngle(l: Layout): number {
  const cell = l.cells[0]
  if (!cell) return 0
  return (Math.atan2(cell.maxA - cell.minA, cell.maxY - cell.minY) * 180) / Math.PI
}

const PROBES: readonly Probe<Layout>[] = [
  { key: 'floorY', labelId: 'tinggi lantai', labelEn: 'floor height', read: (l) => l.floorY },
  { key: 'braceAngle', labelId: 'sudut driwa', labelEn: 'angle of the diagonals', read: braceAngle },
  { key: 'eaveY', labelId: 'tinggi tepi atap', labelEn: 'eave height', read: (l) => l.eaveY },
  { key: 'ridgeY', labelId: 'tinggi bubungan', labelEn: 'ridge height', read: (l) => l.ridgeY },
  { key: 'planX', labelId: 'kedalaman badan', labelEn: 'depth of the body', read: (l) => l.bodyHalfX * 2 },
  { key: 'planZ', labelId: 'panjang badan', labelEn: 'length of the body', read: (l) => l.bodyHalfZ * 2 },
  { key: 'loftY', labelId: 'tinggi loteng', labelEn: 'loft height', read: (l) => l.loft.y },
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
