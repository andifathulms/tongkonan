/**
 * What the reader is doing, in the fragment.
 *
 * The rules live in the query string because they are what the house *is* —
 * three social facts that fully determine it, and an address carrying them is
 * that claim written down. This is the other half: which way the camera is
 * pointing, what time of day it is, whether the rain is falling. None of that
 * is a fact about the building. It is a vantage on one.
 *
 * Keeping them in separate halves of the address keeps both honest. The
 * query string stays a complete description of a house that anyone can cite;
 * the fragment records where a particular reader happened to be standing, and
 * a link that carries it puts you where they were.
 *
 * Two consequences follow from that difference and they are deliberate:
 *
 * - The rules are always written in full, defaults included, because a
 *   description that omits what happens to be default is a diff rather than a
 *   description. Reader state omits its defaults, because an unmentioned
 *   vantage simply is the default vantage, and nobody should have to carry
 *   six parameters to say "I did not touch anything".
 * - A fragment never reaches a server and never reloads a page, which is
 *   exactly right for something that changes as fast as a dragged slider.
 *
 * Pure: strings in, strings out. Reading `window.location` is the renderer's
 * job, the same as it is for the rules.
 */

/** Decode a fragment into its parameters. Tolerates a leading `#` or nothing. */
export function parseHash(hash: string): ReadonlyMap<string, string> {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const out = new Map<string, string>()
  if (raw === '') return out
  for (const [key, value] of new URLSearchParams(raw)) out.set(key, value)
  return out
}

/**
 * Encode reader state, dropping everything left at its default.
 *
 * Returns the fragment without its `#`, or an empty string when the reader
 * has changed nothing — in which case the caller should leave the address
 * without a fragment at all rather than trailing a bare hash.
 */
export function formatHash(entries: readonly (readonly [string, string | null])[]): string {
  const params = new URLSearchParams()
  for (const [key, value] of entries) {
    if (value !== null) params.set(key, value)
  }
  const s = params.toString()
  return s
}

/* ── Field readers ────────────────────────────────────────────────────────
 * Each one falls back rather than failing. A hand-edited or truncated
 * fragment should still open the page looking at something sensible; losing
 * the vantage is a smaller harm than refusing to render.
 */

export function readChoice<T extends string>(
  raw: string | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  return raw !== undefined && (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback
}

export function readInt(
  raw: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (raw === undefined) return fallback
  const n = Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, Math.round(n)))
}

export function readFlag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === '1') return true
  if (raw === '0') return false
  return fallback
}

/** Write a value only when it differs from its default. */
export function unless<T>(value: T, fallback: T, encode: (v: T) => string): string | null {
  return value === fallback ? null : encode(value)
}

export const flag = (v: boolean): string => (v ? '1' : '0')
