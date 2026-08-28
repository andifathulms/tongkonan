/**
 * Which material keys each tradition has, as data — with no three.js in sight.
 *
 * These lived in `materials.ts` beside the generators, which meant nothing
 * could check them: `materials.ts` imports three.js and builds canvases, so a
 * test would need a DOM to ask it anything. The lists are pure data and the
 * question they answer is a real one, so they move here where a test can read
 * them.
 *
 * That is not a tidying. The fault it was extracted for shipped: the betang's
 * material set was built with `ulin` and `sirap`, the fallback key was written
 * as `tradition === 'jawa' ? 'jati' : 'kayu'`, and the betang has no `kayu` —
 * its timber is ironwood and is named because on that building the species is
 * the point. `assemble` threw on construction and the route showed a
 * client-side exception. A two-case ternary that quietly assumed every other
 * house has generic timber, seven houses after it was written.
 */

import type { TraditionKey } from '@/lib/tradition/registry'

/**
 * Substances that are the same substance in every house that uses them.
 *
 * `alang` joined this list the moment a second house was thatched in it. It sat
 * in the bale's own list while the bale was the only user, which was defensible
 * then and wrong the instant the uma appeared: alang-alang on a Sumbanese roof
 * is the same grass as on a Balinese one and comes off the same generator, and
 * that is exactly the test this list applies. Leaving it claimed meant the uma
 * asked for a key nothing declared — which in the static export does not throw,
 * it silently falls back, so the tower would have been drawn in timber.
 */
export const SHARED_MATERIALS: readonly string[] = ['kayu', 'papan', 'bambu', 'ijuk', 'alang', 'batu']

/**
 * What each tradition owns, because the generator genuinely differs.
 *
 * A key listed here is a substance or a motif that is this people's, not a
 * synonym for something another house already has. The distinction was learned
 * the hard way: the material sets were once split by key while the carving
 * *construction* behind the key stayed shared, and the rumah gadang wore the
 * Toraja sun disc across its front for a whole phase.
 */
export const OWN_MATERIALS: Record<TraditionKey, readonly string[]> = {
  /** pa'ssura, and buffalo horn on the tulak somba */
  toraja: ['ukiran', 'tanduk'],
  /** pucuak rabuang and kaluak paku, and woven bamboo in the end walls */
  minang: ['ukiran', 'anyaman'],
  /**
   * lung-lungan and wajikan; fired clay rather than thatch; and teak named
   * rather than called timber, because on a joglo it is named.
   */
  jawa: ['ukiran', 'genteng', 'jati'],
  /**
   * Nothing. The first house here that owns no material of its own.
   *
   * A mbaru niang carries no carving, so there is no `ukiran` to make its own
   * version of, and everything it is built from — timber, board, bamboo, river
   * stone, ijuk — is a substance one of the other houses already builds with.
   * An empty list is the honest entry, and it is worth having a field that can
   * be empty: the alternative would have been inventing a Manggarai carving to
   * fill a slot the others happen to have.
   */
  manggarai: [],
  /** quarried paras and brick; the grass thatch is shared, see above */
  bali: ['paras', 'bata'],
  /** sago-palm leaf, and a dressed standing stone that is not a river cobble */
  nias: ['rumbia', 'behu'],
  /** ironwood, named because the species is the point, and shingles split from it */
  dayak: ['ulin', 'sirap'],
  /**
   * Nothing, and for a better reason than the mbaru niang's.
   *
   * An uma is thatched in alang-alang — the same plant as the bale, so the same
   * generator, because it genuinely is the same substance, which is why that
   * key is in the shared list rather than either house's own. There, what was
   * missing was a carving; here nothing is missing at all.
   */
  sumba: [],
}

/**
 * The material a set falls back to when a part asks for one it does not have.
 *
 * One entry per tradition and typed as a total record, so a ninth house cannot
 * be added without choosing one. It was a ternary before, and the ternary was
 * wrong: it named `kayu` for six houses that have it and for one that does not.
 *
 * The right answer per house is its principal timber, which is what a missing
 * part would most likely be made of — and on two houses that timber is named
 * rather than generic, which is exactly the case the ternary could not express.
 */
export const FALLBACK_MATERIAL: Record<TraditionKey, string> = {
  toraja: 'kayu',
  minang: 'kayu',
  jawa: 'jati',
  manggarai: 'kayu',
  bali: 'kayu',
  nias: 'kayu',
  dayak: 'ulin',
  sumba: 'kayu',
}

/** Every key a tradition is entitled to use. */
export function materialKeysFor(tradition: TraditionKey): readonly string[] {
  return [...SHARED_MATERIALS, ...OWN_MATERIALS[tradition]]
}
