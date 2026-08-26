/**
 * What a wrong number looks like.
 *
 * /sumber can say that bayLength being a fifth out moves the house 1.80 m. It
 * could not show it, and a reader who is told the consequence of a guess has
 * still only been told something — the whole argument of this app is that you
 * should be able to see the rule act.
 *
 * So: the same roof drawn twice, once from the rule pack and once with one
 * dimension pushed, on the same axes. Nothing here is a control. The
 * perturbation is fixed and stated, and there is no parameter outside rank,
 * bays and horns — which is the non-goal this figure exists to respect while
 * still showing the thing.
 *
 * Only the roof is drawn. It is where a changed dimension shows, and forty
 * polylines is a figure a static page can carry where sixteen hundred is not.
 */

import { buildHouse } from '../banua/assembly'
import { withDimValue } from '../banua/whatif'
import { DIMS } from '../banua/rules'
import type { DimKey } from '../banua/rules'
import type { Rules } from '../banua/types'
import { MARGIN, PIGMENT, linesForRoof } from './orthographic'
import type { Line, Projection } from './orthographic'

export interface Comparison {
  readonly svg: string
  /** the pushed value, so the caption can state it rather than imply it */
  readonly from: number
  readonly to: number
}

export function compareDimension(
  key: DimKey,
  factor: number,
  rules: Rules,
  view: Projection = 'potongan',
): Comparison {
  const from = DIMS[key].value
  const to = from * factor

  const trueLines = linesForRoof(buildHouse(rules).layout, view)
  const pushedLines = withDimValue(key, to, () => linesForRoof(buildHouse(rules).layout, view))

  const all = [...trueLines, ...pushedLines]
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const line of all) {
    for (const [x, y] of line.points) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (!Number.isFinite(minX)) return { svg: '', from, to }

  const pad = MARGIN / 2
  const width = maxX - minX + pad * 2
  const height = maxY - minY + pad * 2
  const ox = pad - minX
  const oy = pad - minY

  const draw = (lines: readonly Line[], stroke: string, dash: string | null, w: number) =>
    lines
      .map((line) => {
        const d = line.points
          .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${(x + ox).toFixed(1)} ${(y + oy).toFixed(1)}`)
          .join(' ')
        return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}"${
          dash ? ` stroke-dasharray="${dash}"` : ''
        } stroke-linecap="round" stroke-linejoin="round"/>`
      })
      .join('')

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}" width="100%" role="img">`,
    // The pushed house first, so the true one reads on top of it.
    draw(pushedLines, PIGMENT.rara, '3 2', 0.7),
    draw(trueLines, PIGMENT.ink, null, 0.7),
    '</svg>',
  ].join('')

  return { svg, from, to }
}
