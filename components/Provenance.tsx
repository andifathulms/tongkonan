'use client'

import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { Dim } from '@/lib/banua/types'
import { provenanceSplit } from '@/lib/banua/rules'

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
  dims,
  locale,
  compact = false,
}: {
  dims: readonly Dim[]
  locale: Locale
  compact?: boolean
}) {
  const split = provenanceSplit(dims)
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
      <div
        className="flex h-3 w-full overflow-hidden rounded"
        role="img"
        aria-label={bands
          .map((b) => `${pick(b.label, locale)}: ${b.n}/${split.total}`)
          .join('; ')}
      >
        {bands.map((b) =>
          b.n === 0 ? null : (
            <div key={b.key} style={{ width: `${pct(b.n)}%`, background: b.colour }} />
          ),
        )}
      </div>

      {/* Legend contract: nothing on screen carries meaning only the code knows. */}
      <dl className="mt-3 flex flex-col gap-1.5">
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
            <dd className="num ml-auto text-meta text-bolu">
              {b.n}
              <span className="text-muted">/{split.total}</span>
            </dd>
          </div>
        ))}
      </dl>

      {!compact ? (
        <p className="mt-3 text-body text-muted">
          {pick(COPY.provenance.renderWarning, locale)}{' '}
          {pick(COPY.provenance.line, locale)}
        </p>
      ) : null}
    </div>
  )
}

/** The class of a single dimension, as a mono tag. Used in tables and readouts. */
export function ProvenanceTag({ dim, locale }: { dim: Dim; locale: Locale }) {
  const label =
    dim.class === 'measured'
      ? COPY.provenance.measured
      : dim.class === 'canon'
        ? COPY.provenance.canon
        : COPY.provenance.interpolated
  const colour =
    dim.class === 'measured'
      ? 'var(--bolu)'
      : dim.class === 'canon'
        ? 'var(--riri)'
        : 'var(--rara)'
  // Same reason as the legend swatch: turmeric needs its own ink round it.
  const edge = dim.class === 'canon' ? 'var(--riri-ink)' : colour
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
