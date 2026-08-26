'use client'

import { useMemo } from 'react'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { derivation } from '@/lib/banua/derivation'
import type { Step, Term } from '@/lib/banua/derivation'
import type { Rules } from '@/lib/banua/types'
import { RailSection } from './Sheet'

/**
 * How this house was got.
 *
 * The app showed the rules and it showed the building and never the step
 * between, so its one claim — that a house follows from three social facts —
 * was the only thing on screen a reader had to believe rather than check.
 *
 * It sits directly under the controls it explains, it is open on arrival
 * rather than behind a disclosure, and it is filled in for the default house
 * before anyone has touched anything. That is deliberate: a newcomer needs a
 * worked example they can follow end to end before they are asked to change
 * a number, and an app that only explains itself after you poke it explains
 * itself to the wrong people.
 *
 * Every factor carries where it came from, at the point it is used. Most of
 * them came from nowhere, and that is what the reader should see.
 */
export function Derivation({ rules, locale }: { rules: Rules; locale: Locale }) {
  /*
   * Keyed on the rules, because that is all it depends on.
   *
   * This component re-renders whenever anything else on the route changes —
   * every step of the time slider, every scene toggle — and without this it
   * re-resolved the whole layout each time to print numbers that had not
   * moved. It is under a tenth of a millisecond, so this is not a fix for a
   * measured problem; it is not doing work on a drag that nothing asked for.
   */
  const steps = useMemo(() => derivation(rules), [rules])
  return (
    <RailSection title={pick(COPY.derivation.heading, locale)}>
      <p className="mb-4 text-body text-muted">{pick(COPY.derivation.intro, locale)}</p>
      <ol className="flex flex-col gap-5">
        {steps.map((step) => (
          <li key={step.key}>
            <StepBlock step={step} locale={locale} />
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-hairline pt-3 text-meta text-muted">
        {pick(COPY.derivation.foot, locale)}
      </p>
    </RailSection>
  )
}

function StepBlock({ step, locale }: { step: Step; locale: Locale }) {
  const id = locale === 'id'
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="micro">{id ? step.label : step.labelEn}</span>
        <span className="num text-body">{format(step.result, step.unit)}</span>
      </div>

      {/*
        The working itself, one term per line rather than one long expression:
        at 320px an expression wraps into nonsense, and a reader following a
        chain wants to see the terms stacked anyway.
      */}
      <dl className="mt-2 flex flex-col gap-1">
        {step.terms.map((term, i) => (
          <TermRow key={`${term.labelEn}-${i}`} term={term} step={step} index={i} locale={locale} />
        ))}
      </dl>

      <p className="mt-2 text-body text-muted">{id ? step.why : step.whyEn}</p>
    </div>
  )
}

function TermRow({
  term,
  step,
  index,
  locale,
}: {
  term: Term
  step: Step
  index: number
  locale: Locale
}) {
  const id = locale === 'id'
  return (
    <div className="flex items-baseline gap-2">
      <span aria-hidden className="num w-3 shrink-0 text-micro text-muted">
        {operator(step, index, term)}
      </span>
      <span className="text-meta">{id ? term.label : term.labelEn}</span>
      <Origin term={term} locale={locale} />
      <span className="num ml-auto text-meta">{format(term.value, term.unit)}</span>
    </div>
  )
}

/**
 * Where this factor came from, beside the factor.
 *
 * Three cases and they are genuinely different. The reader's own number is
 * theirs and has nothing to cite. A carried value is the answer to a step
 * above. Everything else is a rule, and a rule states its class here rather
 * than in a footnote — the citation key points into the bibliography on
 * /sumber, which is where the full reference lives.
 */
function Origin({ term, locale }: { term: Term; locale: Locale }) {
  if (term.input) {
    return <span className="micro text-bolu">{pick(COPY.derivation.yours, locale)}</span>
  }
  if (term.carried) {
    return <span className="micro">{pick(COPY.derivation.carried, locale)}</span>
  }
  if (!term.dim) return null

  const colour =
    term.dim.class === 'measured'
      ? 'var(--bolu)'
      : term.dim.class === 'canon'
        ? 'var(--riri)'
        : 'var(--rara)'
  const edge = term.dim.class === 'canon' ? 'var(--riri-ink)' : colour
  return (
    <span className="inline-flex items-baseline gap-1">
      <span
        aria-hidden
        className="inline-block h-2 w-2 shrink-0 rounded border"
        style={{ background: colour, borderColor: edge }}
      />
      <span className="micro">
        {term.dim.source === 'none'
          ? pick(COPY.sources.none, locale)
          : term.dim.source}
      </span>
    </span>
  )
}

function operator(step: Step, index: number, term: Term): string {
  if (index === 0) return ''
  if (step.op === 'product') return '×'
  if (step.op === 'quotient') return '÷'
  return term.value < 0 ? '−' : '+'
}

function format(value: number, unit: Term['unit']): string {
  if (unit === 'count') return String(value)
  if (unit === 'ratio') return `×${value.toFixed(2)}`
  if (unit === 'share') return `${(value * 100).toFixed(0)}%`
  // Negative terms carry their sign in the operator column, not on the number.
  return `${Math.abs(value).toFixed(2)} m`
}
