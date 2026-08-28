import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { ElevationMark, ElevationShelf } from '@/components/Elevation'
import { SplitBar, SplitLegend } from '@/components/split'
import { silhouette } from '@/lib/core/silhouette'
import type { Silhouette } from '@/lib/core/silhouette'
import {
  COPY,
  DEFAULT_LOCALE,
  LOCALES,
  homeHref,
  houseHref,
  isLocale,
  landingMetadata,
  pick,
} from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'
import type { Tradition } from '@/lib/tradition/registry'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return landingMetadata(locale, TRADITIONS.map((t) => t.house[locale]).join(' · '))
}

/**
 * The collection's front door.
 *
 * While there was one house the site could open inside it; with several, the
 * first page has to be the shelf and not one of the books. Everything here is
 * read from the registry, so a fifth house appears on the shelf, on the map
 * and in the index without this file changing — the copy is written without
 * counts for the same reason.
 *
 * The houses are built here, at export time, because everything honest on
 * this page — the silhouettes on the shelf, the interpolated share on each
 * card — is a property of a built house, not of a description of one. The
 * shelf is the page's largest thing on purpose: the claim is that the model
 * is computed, and the computed model is the only picture that can back it.
 */
export default function Landing({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const built = TRADITIONS.map((t) => {
    const b = t.build(t.defaultQuery)
    return { t, b, s: silhouette(b.house, b.scene.ridgeAxis ?? 0) }
  })
  /*
   * The frame every index card draws inside: the extents of the largest
   * house. One frame keeps the cards at one scale, the same claim the shelf
   * makes — the mbaru niang's card is mostly tower and the joglo's is mostly
   * eave, and that difference is content.
   */
  const frame = {
    w: Math.max(...built.map(({ s }) => s.max[0] - s.min[0])),
    h: Math.max(...built.map(({ s }) => s.max[1])),
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-10">
      <header className="flex items-baseline justify-between gap-3">
        <p className="micro text-bolu">{pick(COPY.appName, locale)}</p>
        <LocaleSwitch
          locale={locale}
          targets={
            Object.fromEntries(LOCALES.map((l) => [l, `${homeHref(l)}/`])) as Record<
              typeof locale,
              string
            >
          }
        />
      </header>

      {/*
        The claim before the name, as everywhere else: the tagline leads and
        the wordmark is the smallest thing on the page. The h1 is the tagline
        because that is what this page is about; the name is already in the
        title bar. The drawing under it is the claim made good — the same
        parts the invariants run over, projected and traced.
      */}
      <h1 className="mt-10 max-w-2xl text-display text-bolu">{pick(COPY.tagline, locale)}</h1>
      <p className="mt-4 max-w-2xl text-body text-muted">{pick(COPY.landing.lede, locale)}</p>

      <div className="mt-8">
        <ElevationShelf
          caption={pick(COPY.landing.shelfCaption, locale)}
          items={built.map(({ t, s }) => ({
            key: t.key,
            href: `${houseHref(locale, t.slug)}/`,
            label: t.house[locale],
            s,
          }))}
        />
      </div>

      <hr className="rule my-10" />

      <section className="max-w-2xl">
        <h2 className="micro mb-4">{pick(COPY.landing.storyHeading, locale)}</h2>
        <div className="flex flex-col gap-4">
          {COPY.landing.story.map((p, i) => (
            <p key={i} className="text-body text-bolu">
              {pick(p, locale)}
            </p>
          ))}
        </div>
      </section>

      <hr className="rule my-10" />

      <section className="max-w-2xl">
        <h2 className="micro mb-4">{pick(COPY.landing.sitesHeading, locale)}</h2>
        <SiteMap locale={locale} />
        <p className="mt-3 text-body text-muted">{pick(COPY.landing.sitesNote, locale)}</p>
      </section>

      <hr className="rule my-10" />

      <section>
        <h2 className="micro mb-4">{pick(COPY.landing.housesHeading, locale)}</h2>
        {/*
          The legend for the card bars, drawn once above the index rather than
          once per card: no colour may carry a meaning only the code knows.
        */}
        <div className="mb-4">
          <SplitLegend locale={locale} />
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sheet:grid-cols-4">
          {built.map(({ t, b, s }) => (
            <HouseCard
              key={t.key}
              locale={locale}
              tradition={t}
              s={s}
              frame={frame}
              parts={b.house.parts.length}
              joints={b.house.joints.length}
            />
          ))}
        </ul>
        <p className="mt-4 max-w-2xl text-body text-muted">{pick(COPY.tradition.note, locale)}</p>
      </section>
    </main>
  )
}

function HouseCard({
  locale,
  tradition,
  s,
  frame,
  parts,
  joints,
}: {
  locale: Locale
  tradition: Tradition
  s: Silhouette
  frame: { w: number; h: number }
  parts: number
  joints: number
}) {
  const split = tradition.split
  const share = split.total === 0 ? 0 : Math.round((split.interpolated / split.total) * 100)
  return (
    <li className="h-full">
      <Link
        href={`${houseHref(locale, tradition.slug)}/`}
        className="press flex h-full flex-col gap-2 rounded border border-hairline px-4 py-4 transition-colors duration-state hover:border-muted hover:bg-wash"
      >
        <ElevationMark s={s} frame={frame} />
        <span className="micro">
          {tradition.people[locale]} · {tradition.place[locale]}
        </span>
        <span className="text-title text-bolu">{tradition.house[locale]}</span>
        <span className="font-mono text-meta text-muted">
          {parts} {pick(COPY.landing.parts, locale)} · {joints}{' '}
          {pick(COPY.landing.joints, locale)}
        </span>
        {/* Each house's own bar. Never a merged one — see the note below the index. */}
        <span className="mt-auto block">
          <SplitBar split={split} />
        </span>
        <span className="font-mono text-meta text-muted">
          {pick(COPY.landing.interpolatedShare, locale).replace('{pct}', String(share))}
        </span>
        <span className="text-body text-bolu underline underline-offset-4">
          {pick(COPY.landing.enter, locale)} <span aria-hidden>→</span>
        </span>
      </Link>
    </li>
  )
}

/**
 * The sites, plotted. A graticule and the equator, not a coastline: inventing
 * a plausible outline of the archipelago by hand would be an interpolated
 * drawing presented as a measured one, which is the exact move this project
 * refuses everywhere else. The coordinates are the same ones the solar
 * arithmetic runs on, read from each tradition's registry entry.
 *
 * aria-hidden because everything it shows — which houses, where — is written
 * out in the index below it.
 */
function SiteMap({ locale }: { locale: Locale }) {
  // Degrees of the frame, and viewBox units per degree.
  const LON_MIN = 94
  const LON_MAX = 142
  const LAT_MIN = -12
  const LAT_MAX = 8
  const S = 10
  const w = (LON_MAX - LON_MIN) * S
  const h = (LAT_MAX - LAT_MIN) * S
  const x = (lon: number) => (lon - LON_MIN) * S
  const y = (lat: number) => (LAT_MAX - lat) * S
  const meridians = [100, 110, 120, 130, 140]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full rounded border border-hairline"
      aria-hidden="true"
    >
      {meridians.map((lon) => (
        <g key={lon}>
          <line x1={x(lon)} y1={0} x2={x(lon)} y2={h} stroke="var(--hairline)" />
          <text x={x(lon) + 4} y={h - 6} className="micro" fill="var(--muted)">
            {lon}°
          </text>
        </g>
      ))}
      {/* The equator, named: two of these sites sit close enough to it for a zero-shadow day. */}
      <line x1={0} y1={y(0)} x2={w} y2={y(0)} stroke="var(--muted)" />
      <text x={w - 8} y={y(0) - 6} textAnchor="end" className="micro" fill="var(--muted)">
        {pick(COPY.landing.equator, locale)} 0°
      </text>
      {TRADITIONS.map((t) => (
        <g key={t.key}>
          <rect
            x={x(t.site.longitude) - 3}
            y={y(t.site.latitude) - 3}
            width={6}
            height={6}
            fill="var(--bolu)"
          />
          <text
            x={x(t.site.longitude) + 9}
            y={y(t.site.latitude) + 4}
            className="micro"
            fill="var(--bolu)"
          >
            {t.house[locale]}
          </text>
          <text
            x={x(t.site.longitude) + 9}
            y={y(t.site.latitude) + 17}
            className="micro"
            fill="var(--muted)"
          >
            {t.site.name} {Math.abs(t.site.latitude).toFixed(1)}°{t.site.latitude < 0 ? 'S' : 'N'}
          </text>
        </g>
      ))}
    </svg>
  )
}
