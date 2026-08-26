'use client'

import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { ProvenanceClass } from '@/lib/banua/types'

/** The three counts and their total. All this component needs. */
export interface Split {
  readonly measured: number
  readonly canon: number
  readonly interpolated: number
  readonly total: number
}

/**
 * The honesty layer, as a bar and a plain-language line.
 *
 * At launch the bar is mostly rara. That is not a defect to hide; it is the
 * most important thing on screen. A smooth shaded render implies a precision
 * the sources do not have, and this strip is what keeps the two honest.
 *
 * Rara is the one accent and it is expensive. It marks exactly two things in
 * this app: a number that has no source, and where rainwater lands. Both are
 * arguments.
 */
export function ProvenanceStrip({
  split,
  locale,
  compact = false,
  marking,
  onMarking,
  parts,
}: {
  /*
   * Counts, not the dimensions they were counted from.
   *
   * This is a client component, so whatever it is handed crosses a
   * serialisation boundary and is shipped to the browser. It was handed 53
   * whole Dim objects — every note, in both locales, on a page that displays
   * one of them — to render three numbers it could have been given directly.
   */
  split: Split
  locale: Locale
  compact?: boolean
  /**
   * When present, the strip also drives the overlay that marks the model
   * itself. It belongs here rather than with the scene toggles: the control
   * and the legend that explains its three colours are the same idea, and
   * splitting them would put a colour on screen whose meaning lives elsewhere.
   */
  marking?: boolean
  onMarking?: (v: boolean) => void
  /** part counts, shown only while the model is marked */
  parts?: { measured: number; canon: number; interpolated: number; total: number }
}) {
  const pct = (n: number) => (split.total === 0 ? 0 : (n / split.total) * 100)

  const bands = [
    {
      key: 'measured',
      n: split.measured,
      colour: 'var(--bolu)',
      edge: 'var(--bolu)',
      label: COPY.provenance.measured,
    },
    {
      key: 'canon',
      n: split.canon,
      colour: 'var(--riri)',
      edge: 'var(--riri-ink)',
      label: COPY.provenance.canon,
    },
    {
      key: 'interpolated',
      n: split.interpolated,
      colour: 'var(--rara)',
      edge: 'var(--rara)',
      label: COPY.provenance.interpolated,
    },
  ] as const

  return (
    <div>
      {/*
        Hidden from the accessibility tree, not labelled for it. The bar is a
        picture of the list immediately below, and that list is already three
        proper dt/dd pairs with the same three numbers — so an aria-label here
        made every screen reader user hear the split twice. The marked-up list
        is the accessible version of this bar.
      */}
      <div aria-hidden className="flex h-3 w-full overflow-hidden rounded">
        {bands.map((b) =>
          b.n === 0 ? null : (
            <div key={b.key} style={{ width: `${pct(b.n)}%`, background: b.colour }} />
          ),
        )}
      </div>

      {/*
        Legend contract: nothing on screen carries meaning only the code knows.

        Two counts, two denominators, and they disagree: one canon rule can
        govern a hundred parts while one invented metre governs three. Both are
        true, so both are named rather than one standing in for the other.

        Both columns are reserved whether or not the by-part count exists.
        Inserting a column when the checkbox is ticked slid the whole legend
        sideways at the exact moment the reader was looking at it, which reads
        as a glitch rather than as an answer.
      */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="micro ml-auto w-12 text-right">
          {pick(COPY.provenance.byPart, locale)}
        </span>
        <span className="micro w-16 text-right">
          {pick(COPY.provenance.byDimension, locale)}
        </span>
      </div>
      <dl className="mt-1 flex flex-col gap-1.5">
        {bands.map((b) => (
          <div key={b.key} className="flex items-baseline gap-2">
            {/*
              Turmeric is 1.93:1 on the film — below the floor for a mark that
              carries meaning — so the swatch is the pigment with its own ink
              drawn round it. The class is legible; the pigment is still the
              pigment.
            */}
            <span
              aria-hidden
              className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded border"
              style={{ background: b.colour, borderColor: b.edge }}
            />
            <dt className="micro text-bolu">{pick(b.label, locale)}</dt>
            <dd className="num ml-auto w-12 text-meta text-bolu">
              {/*
                An em dash, not a blank: the column exists and this house has
                not been counted that way yet. No aria-label — it is ignored on
                a span with no role, and where it is honoured it repeats the
                character that is already there.
              */}
              {parts ? parts[b.key] : <span className="text-muted">—</span>}
            </dd>
            <dd className="num w-16 text-meta text-bolu">
              {b.n}
              <span className="text-muted">/{split.total}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/*
        A rule, not another margin: below this the strip stops reporting and
        starts offering something to do.
      */}
      {onMarking ? <hr className="rule mt-4" /> : null}

      {onMarking ? (
        <label className="mt-4 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            checked={marking ?? false}
            onChange={(e) => onMarking(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-bolu"
          />
          <span>
            <span className="block text-body leading-tight">
              {pick(COPY.provenance.mark, locale)}
            </span>
            <span className="mt-1 block text-meta text-muted">
              {pick(COPY.provenance.markHint, locale)}
            </span>
          </span>
        </label>
      ) : null}

      {/*
        The finding is a result, not a caption. It was set identically to the
        standing warning below it, which made the most important sentence in
        the app the third of three grey paragraphs.
      */}
      {marking && parts ? (
        <p className="mt-4 text-body text-bolu">
          {fill(
            parts.interpolated === parts.total
              ? pick(COPY.provenance.markAll, locale)
              : pick(COPY.provenance.markSome, locale),
            { n: parts.interpolated, total: parts.total },
          )}{' '}
          <span className="text-muted">{pick(COPY.provenance.markWhy, locale)}</span>
        </p>
      ) : null}

      {/* The standing warning: always true, so it never competes for attention. */}
      {!compact ? (
        <p className="mt-4 border-t border-hairline pt-3 text-meta text-muted">
          {pick(COPY.provenance.renderWarning, locale)}{' '}
          {pick(COPY.provenance.line, locale)}
        </p>
      ) : null}
    </div>
  )
}

function fill(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => String(values[key] ?? whole))
}

/** The class of a single dimension, as a mono tag. Used in tables and readouts. */
export function ProvenanceTag({
  klass,
  locale,
}: {
  /* The class alone. The rest of the Dim is never read here. */
  klass: ProvenanceClass
  locale: Locale
}) {
  const label =
    klass === 'measured'
      ? COPY.provenance.measured
      : klass === 'canon'
        ? COPY.provenance.canon
        : COPY.provenance.interpolated
  const colour =
    klass === 'measured'
      ? 'var(--bolu)'
      : klass === 'canon'
        ? 'var(--riri)'
        : 'var(--rara)'
  // Same reason as the legend swatch: turmeric needs its own ink round it.
  const edge = klass === 'canon' ? 'var(--riri-ink)' : colour
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span
        aria-hidden
        className="inline-block h-2.5 w-2.5 shrink-0 rounded border"
        style={{ background: colour, borderColor: edge }}
      />
      <span className="micro">{pick(label, locale)}</span>
    </span>
  )
}
