/**
 * Rules, to and from a query string.
 *
 * The query string is the house: a complete description anyone can cite, with
 * every rule always written, defaults included, because a description that
 * omits its defaults is a diff instead.
 *
 * What is *not* in here is which tradition is being described. That is a path
 * segment. A tradition selects a rule pack rather than being one of its rules,
 * and putting it in the query would make that string mean two kinds of thing
 * at once.
 *
 * Both houses had a hand-written copy of this and the copies agreed on
 * everything except their field names — which is the shape of a thing worth
 * extracting. Declaring the fields as data rather than as code also means the
 * registry can say what a tradition's parameters are called without importing
 * its parser.
 */

export type RuleField<R> =
  | {
      readonly kind: 'choice'
      readonly key: keyof R & string
      readonly param: string
      readonly options: readonly string[]
    }
  | {
      readonly kind: 'int'
      readonly key: keyof R & string
      readonly param: string
    }
  /**
   * A rule that is present or absent rather than counted.
   *
   * Added by the third house, which has one: whether the open pavilion stands
   * in front. The first two packs had only choices and counts, and a boolean
   * written as a number would have made `?pendhapa=1` look like a quantity of
   * pavilions. Written as `1` and `0` all the same, because the query string
   * is read by people as often as by parsers and `true` in an Indonesian
   * address would be the odd word out.
   */
  | {
      readonly kind: 'flag'
      readonly key: keyof R & string
      readonly param: string
    }

export interface RulesCodec<R extends object> {
  /** rule key to query parameter name, for anything that needs to say so */
  readonly params: readonly { readonly key: string; readonly param: string }[]
  fromQuery(search: string): R
  /** the query string, without a leading `?` */
  toQuery(rules: R): string
  equal(a: R, b: R): boolean
}

export function rulesCodec<R extends object>(spec: {
  readonly defaults: R
  /** the pack's own clamp. The generator refuses to invent a house. */
  readonly normalise: (rules: R) => R
  readonly fields: readonly RuleField<R>[]
}): RulesCodec<R> {
  const { defaults, normalise, fields } = spec

  return {
    params: fields.map((f) => ({ key: f.key, param: f.param })),

    fromQuery(search: string): R {
      const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
      const out: Record<string, unknown> = { ...(defaults as Record<string, unknown>) }
      for (const field of fields) {
        const raw = q.get(field.param)
        if (raw === null) continue
        if (field.kind === 'flag') {
          if (raw === '1' || raw === '0') out[field.key] = raw === '1'
        } else if (field.kind === 'choice') {
          // The single cast in this file, and it is guarded: the value has to
          // be one the tradition declared before it is written.
          if (field.options.includes(raw)) out[field.key] = raw
        } else {
          // An empty value says nothing, so it falls back rather than reading
          // as zero. `?tanduk=` is a truncated address, not a house with no
          // horns — and the two houses disagreed about this until the codec
          // was extracted and one of them had to be wrong.
          if (raw.trim() === '') continue
          const n = Number(raw)
          if (Number.isFinite(n)) out[field.key] = n
        }
      }
      return normalise(out as R)
    },

    toQuery(rules: R): string {
      const r = normalise(rules) as Record<string, unknown>
      const q = new URLSearchParams()
      for (const field of fields) {
        const value = r[field.key]
        q.set(field.param, field.kind === 'flag' ? (value ? '1' : '0') : String(value))
      }
      // No leading `?`. The caller owns the separator, because it is the one
      // that knows whether it is building a URL or comparing against
      // `location.search`.
      return q.toString()
    },

    equal(a: R, b: R): boolean {
      const ra = a as Record<string, unknown>
      const rb = b as Record<string, unknown>
      return fields.every((f) => ra[f.key] === rb[f.key])
    },
  }
}
