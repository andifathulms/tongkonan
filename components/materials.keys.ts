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
  'nipah',
  'batu',
  /*
   * Bark and earth were each one pack's own until a second pack used them, and
   * both moved here on the test this list applies. The bark of an Arfak wall
   * and of a Korowai floor is the same sheet off the same tree and off the
   * same generator. Earth is the more interesting move: it was the Baduy
   * hillside, a thing nobody may cut, and it is now also a Korowai hearth — a
   * bed of clay hung twenty metres above the ground. Same substance, opposite
   * jobs, and the split-by-name fault would have been to keep two of it.
   */
  'kulit',
  'tanah',
  /*
   * Brick was the bale's own until a Madurese plinth turned out to be the same
   * fired clay — the sixth key to move here, and the list's test applied again.
   */
  'bata',
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
  bali: ['paras'],
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
  /** the nipa palm moved to the shared list when the lepa was roofed in it */
  bugis: [],
  /**
   * Bark sheet, and it is both the wall and the floor.
   *
   * The fifth distinct wall material here, and unlike board, woven bamboo,
   * paras or brick it is neither sawn nor fired nor plaited — it is taken off a
   * tree in one piece and flattened. It reads as a broad soft sheet with the
   * tree's own fibre still running through it, which nothing else in the set
   * does.
   */
  /** nothing of its own now: its bark sheet moved to the shared list when a second pack was built from the same tree */
  arfak: [],
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
  /** nothing of its own: pegged timber, boards, shingles and pad stones */
  minahasa: [],
  /** nothing of its own: timber, board, bamboo, ijuk and pad stones */
  karo: [],
  /**
   * Earth, and it is the only pack that owns it.
   *
   * `tanah` is the hillside this house may not cut, and it is in the model as
   * a part for that reason. No other building here has ground in its part
   * list, so no other building needs a material for it — which is exactly when
   * a key belongs to one tradition rather than to the shared list.
   */
  /** its earth moved to the shared list when a Korowai hearth turned out to be the same substance */
  sunda: [],
  /** nothing of its own: timber, board, bamboo and the same sago leaf */
  aceh: [],
  /**
   * Nipa leaf and sand, and no stone at all.
   *
   * `nipah` is the saoraja's, off the same generator — the same palm, so the
   * key is shared. `pasir` is this pack's own and is the only loose material
   * in the project: the bed of a fire that has to be carried along, because
   * there is no ground to build a hearth on.
   */
  bajau: ['pasir'],
  /** nothing of its own, and nothing else either: this building is stone */
  waruga: [],
  /**
   * Cloth and paper, and they are the first two materials here that are not
   * building materials at all.
   *
   * Every other substance in this project is quarried, felled, split, fired or
   * cut. These two are bought by the metre and are on the building because it
   * only has to hold together until the afternoon it is burned. Nothing else
   * here is clad in something that would be ruined by one night of rain.
   */
  bade: ['kain', 'kertas'],
  /**
   * A living tree, and it is the only material key in the project naming
   * something that is not dead.
   *
   * `pohon` is a standing wanbon with its roots in the ground, not timber —
   * timber is what a tree becomes when it is felled, and this one is not. It
   * cannot be shared with any other pack for the same reason the bark could:
   * every other building's supports stopped growing before they were put in.
   */
  korowai: ['pohon'],
  /**
   * Nothing of its own, and for the reason the empty lists exist.
   *
   * Timber, board, tile, brick, pad stone and beaten earth — every one of them
   * a substance another building here is already made of, off the same
   * generator. What is distinctive about this entry is not a material at all;
   * it is an arrangement, which is exactly the case an empty list states.
   */
  madura: [],
  /**
   * Nothing of its own: timber, board, shingle and coral-block stone, all of
   * them substances another building here is already made of. What is
   * distinctive about a malige is its shape and who may stand on which floor.
   */
  buton: [],
  /** nothing of its own: timber, board, palm-fibre thatch, stone and beaten earth */
  ngada: [],
  /** nothing of its own: timber, bamboo, grass thatch, hearth stone and earth */
  atoni: [],
  /**
   * Leaf, and only leaf.
   *
   * `daun` is a sheet of palm frond laid whole rather than a thatch built of
   * many courses — the difference between one afternoon's roof and a season's
   * work, and the reason it is not the shared thatch.
   *
   * Rattan was here too, and the test that asks whether a claimed material is
   * actually used took it away again: the lashings are joints, and a joint is
   * not a part. Nothing in that building is *made of* rattan, so the pack has
   * no business declaring it — which is the same discipline that keeps the
   * material sets honest everywhere else.
   */
  rimba: ['daun'],
  /** the jaraik's carving, which is the one thing on this house that is its own */
  mentawai: ['ukiran'],
  /**
   * Lontar leaf, and it is this pack's own for a reason that is about an
   * island rather than a surface: Sabu lives on this palm, and the roof and
   * what is stored under it come off the same tree. The other thatches here
   * are ijuk, alang-alang, sago and nipa; this is a fifth plant.
   */
  sabu: ['lontar'],
  /**
   * A fired floor tile, and it is this pack's own because of where it comes
   * from rather than what it looks like: every other floor in this collection
   * is split, sawn, beaten or laid from what was to hand, and this one was
   * bought by the piece from a shop.
   */
  betawi: ['ubin'],
  /**
   * The red and white cloth tied at the guests' opening.
   *
   * `kain` is the bade's too and it does not move to the shared list, because
   * on that building cloth is the *cladding* — bought by the metre and burned
   * the same afternoon — while here it is two pieces tied to a jamb. Same
   * substance, and the difference in what it is doing is large enough that one
   * generator for both would be the split-by-name fault in reverse.
   */
  sahu: ['kain'],
  /**
   * The selembayung, and it is carving even when it is built plain.
   *
   * `ukiran` is this pack's own for the reason every carving key is: the
   * motifs belong to particular carvers, and a shared generator would put one
   * people's work on another people's building — which is exactly how the
   * rumah gadang once wore a Toraja sun disc.
   */
  riau: ['ukiran'],
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
  minahasa: 'kayu',
  karo: 'kayu',
  sunda: 'kayu',
  aceh: 'kayu',
  bajau: 'kayu',
  waruga: 'batu',
  bade: 'bambu',
  korowai: 'kayu',
  madura: 'kayu',
  buton: 'kayu',
  ngada: 'kayu',
  atoni: 'kayu',
  rimba: 'kayu',
  mentawai: 'ulin',
  sabu: 'kayu',
  betawi: 'kayu',
  sahu: 'kayu',
  riau: 'kayu',
}

/** Every key a tradition is entitled to use. */
export function materialKeysFor(tradition: TraditionKey): readonly string[] {
  return [...SHARED_MATERIALS, ...OWN_MATERIALS[tradition]]
}
