import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { SplitBar, SplitLegend } from '@/components/split'
import {
  COPY,
  DEFAULT_LOCALE,
  LOCALES,
  ROUTES,
  homeHref,
  houseHref,
  houseMetadata,
  href,
  isLocale,
  pick,
} from '@/lib/i18n'
import { isTraditionKey, tradition } from '@/lib/tradition/registry'

export function generateMetadata({
  params,
}: {
  params: { locale: string; tradisi: string }
}): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  const t = tradition(isTraditionKey(params.tradisi) ? params.tradisi : 'toraja')
  return houseMetadata(locale, {
    slug: t.slug,
    house: t.house[locale],
    place: t.place[locale],
  })
}

/**
 * One house's front door.
 *
 * The four routes open straight onto a working drawing, which is the right
 * place to land from within the site and a poor one to land from outside it:
 * every word saying whose house this is sits down a rail, after the controls.
 * This page is those words first — whose house, where it stands, which way it
 * must face, and how much of it the author invented — with the four routes
 * as described doors rather than four bare nouns.
 */
export default function House({ params }: { params: { locale: string; tradisi: string } }) {
  if (!isLocale(params.locale) || !isTraditionKey(params.tradisi)) notFound()
  const locale = params.locale
  const t = tradition(params.tradisi)

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-10">
      <header className="flex items-baseline justify-between gap-3">
        <nav className="micro flex min-w-0 items-baseline gap-2 text-bolu">
          <Link href={`${homeHref(locale)}/`} className="shrink-0 underline underline-offset-4">
            {pick(COPY.appName, locale)}
          </Link>
          <span aria-hidden>/</span>
          <span aria-current="page" className="truncate">
            {t.house[locale]}
          </span>
        </nav>
        <LocaleSwitch
          locale={locale}
          targets={
            Object.fromEntries(
              LOCALES.map((l) => [l, `${houseHref(l, t.slug)}/`]),
            ) as Record<typeof locale, string>
          }
        />
      </header>

      <h1 className="mt-8 text-display text-bolu">{t.house[locale]}</h1>
      <p className="micro mt-2">
        {t.people[locale]} · {t.place[locale]}
      </p>
      <p className="mt-4 text-body text-bolu">{t.about[locale]}</p>
      <p className="mt-3 text-body text-muted">{t.caution[locale]}</p>

      <hr className="rule my-8" />

      <section>
        <h2 className="micro mb-3">{pick(COPY.orientation.heading, locale)}</h2>
        <p className="text-body text-bolu">{t.orientation[locale]}</p>
      </section>

      <hr className="rule my-8" />

      <section>
        <h2 className="micro mb-3">{pick(COPY.provenance.heading, locale)}</h2>
        <SplitBar split={t.split} className="h-2" />
        <div className="mt-3">
          <SplitLegend locale={locale} split={t.split} />
        </div>
        <p className="mt-3 text-body text-muted">{pick(COPY.provenance.line, locale)}</p>
      </section>

      <hr className="rule my-8" />

      <section>
        <h2 className="micro mb-4">{pick(COPY.landing.doorsHeading, locale)}</h2>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {ROUTES.map((r) => (
            <li key={r} className="h-full">
              <Link
                href={`${href(locale, t.slug, r)}/`}
                className="flex h-full flex-col gap-1 rounded border border-hairline px-4 py-4 transition-colors duration-state hover:bg-wash"
              >
                <span className="text-lead text-bolu">{pick(COPY.nav[r], locale)}</span>
                <span className="text-body text-muted">{pick(COPY.navGloss[r], locale)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-8 border-t border-hairline pt-4">
        <Link href={`${homeHref(locale)}/`} className="micro text-bolu underline underline-offset-4">
          <span aria-hidden>← </span>
          {pick(COPY.tradition.all, locale)}
        </Link>
      </footer>
    </main>
  )
}
