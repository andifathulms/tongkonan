import { notFound } from 'next/navigation'
import { RailSection, Sheet } from '@/components/Sheet'
import { ProvenanceStrip, ProvenanceTag } from '@/components/Provenance'
import { COPY, LOCALES, isLocale, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { DIMS, DIM_KEYS, SOURCES, dimsForLayout, sourceFor } from '@/lib/banua/rules'
import { DEFAULT_RULES } from '@/lib/banua/rules'
import { buildHouse } from '@/lib/banua/assembly'
import { runInvariants, summarise } from '@/lib/banua/invariants'
import type { Dim } from '@/lib/banua/types'

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
            <p className="mb-3 text-[13px] leading-snug text-[color:var(--muted)]">
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
          <h1 className="text-xl font-medium">{pick(COPY.sources.heading, locale)}</h1>
          <p className="mt-2 max-w-prose text-body">{pick(COPY.sources.intro, locale)}</p>

          <hr className="rule my-8" />

          <h2 className="micro">{pick(COPY.sources.tableHeading, locale)}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-[color:var(--hairline)]">
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
                    <tr key={key} className="border-b border-[color:var(--hairline)] align-top">
                      <td className="py-3 pr-4">
                        <span className="font-mono text-[12px]">{key}</span>
                      </td>
                      <td className="num whitespace-nowrap py-3 pr-4 text-[13px]">
                        {formatValue(dim)}
                      </td>
                      <td className="py-3 pr-4">
                        <ProvenanceTag dim={dim} locale={locale} />
                      </td>
                      <td className="py-3 text-[13px] leading-snug">
                        {locale === 'id' ? dim.note : dim.noteEn}
                        <span className="mt-1 block text-[11px] leading-snug text-[color:var(--muted)]">
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

          <hr className="rule my-8" />

          <h2 className="micro">{pick(COPY.checks.heading, locale)}</h2>
          <p className="mt-2 max-w-prose text-[13px] leading-snug text-[color:var(--muted)]">
            {pick(COPY.checks.line, locale)}
          </p>
          <ul className="mt-4 flex flex-col">
            {results.map((r) => (
              <li key={r.key} className="border-b border-[color:var(--hairline)] py-3">
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
                  <span className="text-[14px] leading-snug">
                    {locale === 'id' ? r.titleId : r.titleEn}
                  </span>
                </div>
                <p className="mt-1 pl-[3.6rem] text-[12px] leading-snug text-[color:var(--muted)]">
                  {r.detail}
                </p>
              </li>
            ))}
          </ul>

          <hr className="rule my-8" />

          <h2 className="micro">{pick(COPY.sources.sourceHeading, locale)}</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {SOURCES.filter((s) => s.key !== 'none').map((s) => (
              <li key={s.key}>
                <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[color:var(--muted)]">
                  {s.key} · {s.kind}
                </p>
                <p className="mt-1 max-w-prose text-[14px] leading-snug">{s.citation}</p>
              </li>
            ))}
          </ul>

          <hr className="rule my-8" />

          <p className="max-w-prose text-[13px] leading-snug text-[color:var(--muted)]">
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
      <dd className="num text-[13px]">{value}</dd>
    </div>
  )
}
