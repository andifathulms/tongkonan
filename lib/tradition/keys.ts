/**
 * The tradition keys, alone.
 *
 * They lived in the registry, which also imports every facade — so any
 * client that only wanted to ask "is this a tradition?" shipped all
 * thirty-five generators to answer it. The keys are the one part of the
 * registry a route needs before it knows which house it has, and splitting
 * them out is what lets the working routes load one facade instead of all.
 */

export const TRADITION_KEYS = ['toraja', 'minang', 'jawa', 'manggarai', 'bali', 'nias', 'dayak', 'sumba', 'palembang', 'bugis', 'arfak', 'sasak', 'dani', 'banjar', 'maluku', 'tobati', 'minahasa', 'karo', 'sunda', 'aceh', 'bajau', 'waruga', 'bade', 'korowai', 'madura', 'buton', 'ngada', 'atoni', 'rimba', 'mentawai', 'sabu', 'betawi', 'sahu', 'riau', 'sumbawa'] as const
export type TraditionKey = (typeof TRADITION_KEYS)[number]

export function isTraditionKey(value: string): value is TraditionKey {
  return (TRADITION_KEYS as readonly string[]).includes(value)
}
