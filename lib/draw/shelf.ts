/**
 * Laying the collection out on a shelf, as arithmetic.
 *
 * The landing's hero is every house standing at one scale, and for a long time
 * that was one row because it was one row's worth of houses. At fourteen it
 * stopped being: two hundred and eighteen metres of building in a container a
 * thousand pixels wide is seven pixels to the metre, and at seven pixels to
 * the metre a honai is thirty-five pixels tall and every label is written over
 * its neighbour's. The drawing had become a strip of grey teeth.
 *
 * So the shelf wraps. The thing that must not break in wrapping is the claim
 * the shelf exists to make — that these are drawn at one scale — which is why
 * this is a file of arithmetic with a test beside it rather than a flex
 * container: every row is laid out in the *same* viewBox width, so metres per
 * pixel is a constant of the sheet and not a property of a row. A row with one
 * house in it is drawn at the scale of the row with six.
 *
 * Nothing here counts to fourteen. A fifteenth house is packed by the same
 * arithmetic, and if it is the one that pushes the last row over, a third row
 * appears without this file changing.
 */

/** metres of house a row will hold before the next one starts */
export const ROW_TARGET = 105

export interface ShelfRow<T> {
  readonly items: readonly (T & { readonly ox: number; readonly centre: number })[]
  /** metres from the row's left edge to the right edge of its last house */
  readonly width: number
  /** the tallest house in this row, in metres */
  readonly height: number
}

export interface Shelf<T> {
  readonly rows: readonly ShelfRow<T>[]
  /** the viewBox width every row is drawn in — one scale for the whole sheet */
  readonly width: number
  /**
   * The height every row is drawn in, which is the tallest house on the shelf.
   *
   * Rows were sized to their own contents at first, and the ground lines came
   * out at uneven intervals down the page — a fifteen-metre gap under the row
   * with the uma in it and a five-metre one under the row of small buildings.
   * It read as a mistake, and worse, it read as the rows being at different
   * scales, which is the one thing this drawing must never suggest. One height
   * for every row is a grid: the air above a row of small buildings is the
   * measure of how much smaller they are.
   */
  readonly height: number
}

/**
 * Pack items into rows of at most `target` metres, in the order given.
 *
 * The order is the registry's, which is the order the houses joined the
 * collection — history, not a packing convenience. So this is a first-fit walk
 * and never a bin-packer: a bin-packer would reorder them to fill rows better
 * and would be sorting the collection by width, which says nothing about
 * anything.
 *
 * A house wider than the target gets a row to itself rather than being scaled
 * down to fit, because scaling it down is the one thing the shelf may not do.
 */
export function packShelf<T extends { readonly width: number; readonly height: number }>(
  items: readonly T[],
  opts: { readonly target?: number; readonly gap: number; readonly pad: number },
): Shelf<T> {
  const target = opts.target ?? ROW_TARGET
  const rows: (T & { ox: number; centre: number })[][] = []
  let row: (T & { ox: number; centre: number })[] = []
  let cursor = opts.pad

  for (const item of items) {
    const wouldEnd = cursor + item.width
    if (row.length > 0 && wouldEnd - opts.pad > target) {
      rows.push(row)
      row = []
      cursor = opts.pad
    }
    row.push({ ...item, ox: cursor, centre: cursor + item.width / 2 })
    cursor += item.width + opts.gap
  }
  if (row.length > 0) rows.push(row)

  const packed: ShelfRow<T>[] = rows.map((r) => {
    const last = r[r.length - 1]
    const width = last ? last.ox + last.width : 0
    return { items: r, width, height: Math.max(...r.map((i) => i.height)) }
  })

  // One width for every row, so one scale for every house. This is the line
  // that carries the claim.
  const width = Math.max(...packed.map((r) => r.width)) + opts.pad
  const height = Math.max(...packed.map((r) => r.height))

  return { rows: packed, width, height }
}
