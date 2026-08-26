/**
 * Lapped courses on a slope.
 *
 * Both houses are thatched in ijuk and both lay it from the eave upward, each
 * course standing proud of the one below. The two implementations were
 * character-for-character the same arithmetic over different constants, which
 * is what an extraction is supposed to look like — not two things that felt
 * similar, but two that turned out to be one.
 *
 * `f` runs 0 at the ridge to 1 at the eave, so a course's `head` is its upper
 * edge and its `foot` its lower one. The bands are derived once and used both
 * to cut the geometry and to check it: a lap that is claimed and a lap that is
 * built cannot then drift apart.
 */

export interface CourseBand {
  readonly course: number
  /** upper edge, toward the ridge */
  readonly head: number
  /** lower edge, toward the eave */
  readonly foot: number
}

/**
 * @param count how many courses clothe one slope
 * @param lap the share of a course the course above it covers
 */
export function courseBands(count: number, lap: number): readonly CourseBand[] {
  const exposure = 1 / count
  const bands: CourseBand[] = []
  for (let k = 0; k < count; k++) {
    // k = 0 is the eave course. Each head sits one exposure further up.
    const head = 1 - (k + 1) * exposure
    // The foot reaches past the head of the course below by the lap, so there
    // is no line across the slope where the frame could show through.
    const foot = Math.min(1, head + exposure * (1 + lap * 2))
    bands.push({ course: k, head, foot })
  }
  return bands
}
