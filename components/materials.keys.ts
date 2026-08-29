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
export const SHARED_MATERIALS: readonly string[] = [
  'kayu',
  'ulin',
  'sirap',
  'papan',
  'bambu',
  'ijuk',
  'alang',
  'rumbia',
  'genteng',
  'batu',
]

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
   * lung-lungan and wajikan, and teak named rather than called timber because
   * on a joglo it is named. The fired clay is shared — see above.
   */
  jawa: ['ukiran', 'jati'],
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
  /** the sago leaf moved to the shared list when the baileo was roofed in it */
  nias: ['behu'],
  /** ironwood, named because the species is the point, and shingles split from it */
  /** the ironwood moved to the shared list when a second Bornean house used it */
  dayak: [],
  /**
   * Nothing, and for a better reason than the mbaru niang's.
   *
   * An uma is thatched in alang-alang — the same plant as the bale, so the same
   * generator, because it genuinely is the same substance, which is why that
   * key is in the shared list rather than either house's own. There, what was
   * missing was a carving; here nothing is missing at all.
   */
  sumba: [],
  /**
   * Two named timbers and a turned lattice.
   *
   * `unglen` and `tembesu` are named rather than called timber for the same
   * reason the joglo's `jati` and the betang's `ulin` are: on this house the
   * species is a choice the builder made and stated. `kisi` is the turned bar
   * of the front screen, which reads as neither board nor post.
   */
  palembang: ['unglen', 'tembesu', 'kisi'],
  /**
   * Nipa-palm thatch: the fourth plant and the fourth generator.
   *
   * Ijuk is black palm fibre, alang-alang is grass, rumbia is sago leaf, nipah
   * is the frond of a mangrove palm folded over a lath. Four roofs, four
   * plants, four ways of catching light — and giving any two of them one
   * generator because both are "thatch" is the split-by-name fault waiting to
   * happen for the fifth time.
   */
  bugis: ['nipah'],
  /**
   * Bark sheet, and it is both the wall and the floor.
   *
   * The fifth distinct wall material here, and unlike board, woven bamboo,
   * paras or brick it is neither sawn nor fired nor plaited — it is taken off a
   * tree in one piece and flattened. It reads as a broad soft sheet with the
   * tree's own fibre still running through it, which nothing else in the set
   * does.
   */
  arfak: ['kulit'],
  /**
   * Nothing of its own, and it is the third entry here to be empty.
   *
   * A lumbung is stone, timber, board, bamboo and grass thatch — every one of
   * them a substance another building here already uses, off the same
   * generator. What makes this granary distinctive is a shape and a purpose
   * rather than a material, and the empty list says so.
   */
  sasak: [],
  /**
   * Nothing of its own either — timber, board, grass thatch and hearth stone,
   * all of them substances another building here already uses. A honai is
   * distinctive for its size and its purpose, not for what it is made of.
   */
  dani: [],
  /**
   * Nothing of its own: ironwood and its shingles are the betang's, off the
   * same generators, because the same forest and the same water. Two Bornean
   * buildings far apart in form, sharing a material for a reason — which is
   * exactly when a key belongs in the shared list rather than in either
   * house's own.
   */
  banjar: [],
  /**
   * Nothing of its own: the sago-leaf roof is the omo's `rumbia`, off the same
   * generator, because it is the same leaf. That key moved to the shared list
   * the moment a second building was roofed in it — the fourth time this has
   * happened, and the test that keeps the two lists apart is what asks.
   */
  maluku: [],
  /** nothing of its own: driven ironwood posts aside, it is board, bamboo and the same sago leaf */
  tobati: [],
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
  palembang: 'tembesu',
  bugis: 'kayu',
  arfak: 'kayu',
  sasak: 'kayu',
  dani: 'kayu',
  banjar: 'ulin',
  maluku: 'kayu',
  tobati: 'kayu',
}

/** Every key a tradition is entitled to use. */
export function materialKeysFor(tradition: TraditionKey): readonly string[] {
  return [...SHARED_MATERIALS, ...OWN_MATERIALS[tradition]]
}
