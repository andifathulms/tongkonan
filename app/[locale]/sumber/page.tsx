import { notFound } from 'next/navigation'
import { RailSection, Sheet } from '@/components/Sheet'
import { ProvenanceStrip, ProvenanceTag } from '@/components/Provenance'
import { COPY, LOCALES, isLocale, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { DIMS, DIM_KEYS, SOURCES, dimsForLayout, sourceFor } from '@/lib/banua/rules'
import { DEFAULT_RULES } from '@/lib/banua/rules'
import { buildHouse } from '@/lib/banua/assembly'
import { runInvariants, summarise } from '@/lib/banua/invariants'
import { PERTURBATION, PROBE_LABELS, sensitivities, sensitivityOf } from '@/lib/banua/sensitivity'
import { ridgeCounterexample } from '@/lib/banua/counterexample'
import type { Sensitivity } from '@/lib/banua/sensitivity'
import type { Dim } from '@/lib/banua/types'
import type { CheckResult } from '@/lib/banua/invariants'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

/**
 * The honesty layer, given its own room.
 *
 * Deliberately a server component with no interactivity: this page is a
 * document, it renders to static HTML at build time, and it can be read with
 * JavaScript switched off. The whole point of it is that the claims are
 * checkable, and a table that needs a runtime to appear is a worse table.
 */
export default function Sumber({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale: Locale = params.locale

  const { house, layout } = buildHouse(DEFAULT_RULES)
  const results = runInvariants(house, layout)
  const totals = summarise(results)
  const dims = dimsForLayout(layout)
  // 35 rebuilds, run once at build time. This page is static HTML by the time
  // anyone reads it, so the cost is paid by the build and never by a reader.
  const sensitivity = sensitivities(DEFAULT_RULES)
  const pct = Math.round(PERTURBATION * 100)
  // Also build time. The broken house exists for the length of one check and
  // is never rendered — this page is the only route that ever sees it, and it
  // sees it as two numbers and a verdict.
  const counter = ridgeCounterexample(DEFAULT_RULES)

  return (
    <Sheet
      locale={locale}
      route="sumber"
      variant="document"
      rail={
        <>
          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip dims={dims} locale={locale} />
          </RailSection>
          <RailSection title={pick(COPY.checks.heading, locale)}>
            <p className="mb-3 text-body text-muted">
              {pick(COPY.checks.line, locale)}
            </p>
            <dl className="flex flex-col gap-1">
              <Tally label={pick(COPY.checks.pass, locale)} value={totals.passed} />
              <Tally label={pick(COPY.checks.fail, locale)} value={totals.failed} />
              <Tally label={pick(COPY.checks.skip, locale)} value={totals.skipped} />
            </dl>
          </RailSection>
        </>
      }
    >
      <div className="sheet:h-full sheet:overflow-y-auto">
        <div className="mx-auto max-w-3xl px-5 py-8 sheet:px-8">
          <h1 className="text-title font-medium">{pick(COPY.sources.heading, locale)}</h1>
          <p className="mt-2 max-w-prose text-body">{pick(COPY.sources.intro, locale)}</p>

          <hr className="rule mb-7 mt-12" />

          <h2 className="text-lead font-medium text-bolu">
            {pick(COPY.sources.sensitivityHeading, locale)}
          </h2>
          <p className="mt-2 max-w-prose text-body text-muted">
            {fill(pick(COPY.sources.sensitivityIntro, locale), { pct })}
          </p>
          <ol className="mt-5 flex flex-col">
            {sensitivity
              .filter((s) => s.worst > 0)
              .slice(0, 8)
              .map((s, i) => (
                <li
                  key={s.dim}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-hairline py-2.5"
                >
                  <span className="num w-10 shrink-0 text-meta text-muted">{i + 1}</span>
                  <span className="font-mono text-meta">{s.dim}</span>
                  <span className="num ml-auto whitespace-nowrap text-body">
                    {s.worst.toFixed(2)} m
                  </span>
                  <span className="w-full pl-[3.25rem] text-meta text-muted sheet:w-auto sheet:pl-0">
                    {PROBE_LABELS[s.worstProbe][locale]}
                  </span>
                </li>
              ))}
          </ol>
          <p className="mt-3 max-w-prose text-body text-muted">
            {pick(COPY.sources.measureFirst, locale)}{' '}
            {fill(pick(COPY.sources.sensitivityCaveat, locale), { pct })}
          </p>

          <hr className="rule mb-7 mt-12" />

          <h2 className="text-lead font-medium text-bolu">
            {pick(COPY.sources.tableHeading, locale)}
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-hairline">
                  <Th>{pick(COPY.sources.dimension, locale)}</Th>
                  <Th right>{pick(COPY.sources.value, locale)}</Th>
                  <Th>{pick(COPY.sources.klass, locale)}</Th>
                  <Th>{pick(COPY.sources.note, locale)}</Th>
                </tr>
              </thead>
              <tbody>
                {DIM_KEYS.map((key) => {
                  const dim: Dim = DIMS[key]
                  return (
                    <tr key={key} className="border-b border-hairline align-top">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-meta">{key}</span>
                      </td>
                      <td className="num whitespace-nowrap py-3 pr-4 text-meta">
                        {formatValue(dim)}
                        {/*
                          Kept inside the value cell rather than given a fifth
                          column: the table is already wide enough to scroll on
                          a phone, and this belongs beside the number it is
                          about.
                        */}
                        <IfWrong s={sensitivityOf(sensitivity, key)} pct={pct} locale={locale} />
                      </td>
                      <td className="py-3 pr-4">
                        <ProvenanceTag dim={dim} locale={locale} />
                      </td>
                      <td className="py-3 text-meta leading-snug">
                        {locale === 'id' ? dim.note : dim.noteEn}
                        <span className="mt-1 block text-meta leading-snug text-muted">
                          {dim.source === 'none'
                            ? pick(COPY.sources.none, locale)
                            : sourceFor(dim.source).citation}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <hr className="rule mb-7 mt-12" />

          <h2 className="text-lead font-medium text-bolu">
            {pick(COPY.checks.heading, locale)}
          </h2>
          <p className="mt-2 max-w-prose text-body text-muted">
            {pick(COPY.checks.line, locale)}
          </p>
          <ul className="mt-4 flex flex-col">
            {results.map((r) => (
              <li key={r.key} className="border-b border-hairline py-3">
                <div className="flex items-baseline gap-3">
                  <span
                    className="micro shrink-0 rounded px-1.5 py-0.5"
                    style={
                      r.status === 'fail'
                        ? { background: 'var(--rara)', color: 'var(--kapur)' }
                        : r.status === 'skip'
                          ? { background: 'var(--riri)', color: 'var(--bolu)' }
                          : { background: 'var(--bolu)', color: 'var(--kapur)' }
                    }
                  >
                    {r.status === 'pass'
                      ? pick(COPY.checks.pass, locale)
                      : r.status === 'fail'
                        ? pick(COPY.checks.fail, locale)
                        : pick(COPY.checks.skip, locale)}
                  </span>
                  <span className="text-body leading-snug">
                    {locale === 'id' ? r.titleId : r.titleEn}
                  </span>
                </div>
                <p className="mt-1 pl-[3.6rem] text-body text-muted">
                  {locale === 'id' ? r.detail : r.detailEn}
                </p>
              </li>
            ))}
          </ul>

          <hr className="rule mb-7 mt-12" />

          <h2 className="text-lead font-medium text-bolu">
            {pick(COPY.checks.counterHeading, locale)}
          </h2>
          <p className="mt-2 max-w-prose text-body text-muted">
            {pick(COPY.checks.counterIntro, locale)}
          </p>
          <p className="mt-3 max-w-prose text-body">{pick(COPY.checks.counterWhy, locale)}</p>

          <div className="mt-5 grid gap-px overflow-hidden rounded border border-hairline bg-[color:var(--hairline)] sheet:grid-cols-2">
            <CounterCase
              title={pick(COPY.checks.counterSound, locale)}
              result={counter.sound}
              prows={counter.prows.sound}
              locale={locale}
            />
            <CounterCase
              title={fill(pick(COPY.checks.counterBroken, locale), {
                value: Number(counter.value.toFixed(2)),
              })}
              result={counter.broken}
              prows={counter.prows.broken}
              locale={locale}
            />
          </div>
          <p className="mt-3 max-w-prose text-body text-muted">
            {pick(COPY.checks.counterNote, locale)}
          </p>

          <hr className="rule mb-7 mt-12" />

          <h2 className="text-lead font-medium text-bolu">
            {pick(COPY.sources.sourceHeading, locale)}
          </h2>
          <ul className="mt-4 flex flex-col gap-4">
            {SOURCES.filter((s) => s.key !== 'none').map((s) => (
              <li key={s.key}>
                <p className="micro">
                  {s.key} · {s.kind}
                </p>
                <p className="mt-1 max-w-prose text-body leading-snug">{s.citation}</p>
              </li>
            ))}
          </ul>

          <hr className="rule mb-7 mt-12" />

          <p className="max-w-prose text-body text-muted">
            {pick(COPY.provenance.line, locale)}
          </p>
        </div>
      </div>
    </Sheet>
  )
}

function formatValue(dim: Dim): string {
  if (dim.unit === 'count') return String(dim.value)
  if (dim.unit === 'ratio') return dim.value.toFixed(2)
  if (dim.unit === 'deg') return `${dim.value}°`
  return `${dim.value.toFixed(2)} m`
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`micro pb-2 pr-4 font-normal ${right ? 'text-right' : ''}`}>{children}</th>
  )
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="micro">{label}</dt>
      <dd className="num text-meta">{value}</dd>
    </div>
  )
}

/** How far the house moves if this one number is out. Computed, not claimed. */
function IfWrong({
  s,
  pct,
  locale,
}: {
  s: Sensitivity | undefined
  pct: number
  locale: Locale
}) {
  if (!s) return null
  return (
    // `num`, because this is a measurement and DESIGN.md says every number is
    // mono. `text-micro` alone carries the size and the tracking but not the
    // family, so this was the one figure in the app set in letter-spaced sans,
    // directly beneath a tabular one. Not `.micro` either: that uppercases,
    // and a unit is not a label — it would render "1.80 M".
    <span className="num mt-1 block text-micro text-muted">
      {s.worst > 0
        ? `${fill(pick(COPY.sources.ifWrong, locale), { pct })}: ${s.worst.toFixed(2)} m`
        : pick(COPY.sources.sensitivityNone, locale)}
    </span>
  )
}

function fill(template: string, values: Record<string, number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => String(values[key] ?? whole))
}

/** One house, one verdict. The status word is the check's, not the page's. */
function CounterCase({
  title,
  result,
  prows,
  locale,
}: {
  title: string
  result: CheckResult
  prows: { front: number; rear: number }
  locale: Locale
}) {
  const failed = result.status === 'fail'
  return (
    <div className="bg-film p-4">
      <p className="micro">{title}</p>
      <div className="mt-2 flex items-baseline gap-3">
        <span
          className="micro shrink-0 rounded px-1.5 py-0.5"
          style={
            failed
              ? { background: 'var(--rara)', color: 'var(--kapur)' }
              : { background: 'var(--bolu)', color: 'var(--kapur)' }
          }
        >
          {failed ? pick(COPY.checks.fail, locale) : pick(COPY.checks.pass, locale)}
        </span>
        <span className="num text-body">
          {prows.front.toFixed(2)} / {prows.rear.toFixed(2)} m
        </span>
        <span className="text-meta text-muted">{pick(COPY.checks.counterProws, locale)}</span>
      </div>
      <p className="mt-2 text-meta text-muted">
        {locale === 'id' ? result.detail : result.detailEn}
      </p>
    </div>
  )
}
