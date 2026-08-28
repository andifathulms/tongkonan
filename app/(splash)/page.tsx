import Link from 'next/link'
import { COPY, LOCALES, LOCALE_NAMES, homeHref, pick } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The root sends you to the Indonesian landing page.
 *
 * A static export has no server to redirect from, so this is a real page with
 * a real link rather than a redirect that silently fails when JavaScript does.
 *
 * Nobody sees it for more than a frame when the refresh works, and everybody
 * sees it when it does not — a slow connection, a blocked meta refresh, a
 * reader arriving from a search result. So it says the same thing the landing
 * says, in both languages, rather than being a bare pair of links.
 */
export default function Index() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-6 px-6 py-24">
      <p className="micro text-bolu">{pick(COPY.appName, 'id')}</p>
      <div className="flex flex-col gap-3">
        {LOCALES.map((l) => (
          <p key={l} lang={l} className={l === 'id' ? 'text-lead' : 'text-body text-muted'}>
            {pick(COPY.tagline, l)}
          </p>
        ))}
      </div>
      <nav className="flex flex-col gap-3">
        {LOCALES.map((l) => (
          <Link
            key={l}
            lang={l}
            hrefLang={l}
            href={`${homeHref(l)}/`}
            className="text-body underline underline-offset-4"
          >
            {pick(COPY.openIn, l)} <span aria-hidden>→</span>
            <span className="sr-only"> — {LOCALE_NAMES[l]}</span>
          </Link>
        ))}
      </nav>
      {/*
        Both houses are named here, under the language links, because the
        root is where someone arrives knowing nothing and the app is two
        buildings rather than one. The refresh still goes to the first: a
        splash nobody reads should not become a decision everybody has to
        make.
      */}
      <p className="text-body text-muted">
        {TRADITIONS.map((t) => t.house.id).join(' · ')}
      </p>
      <meta httpEquiv="refresh" content={`0; url=${BASE}${homeHref('id')}/`} />
    </main>
  )
}
