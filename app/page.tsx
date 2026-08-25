import Link from 'next/link'
import { COPY, LOCALES, LOCALE_NAMES, pick } from '@/lib/i18n'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The root sends you to the Indonesian generator.
 *
 * A static export has no server to redirect from, so this is a real page with
 * a real link rather than a redirect that silently fails when JavaScript does.
 *
 * Nobody sees it for more than a frame when the refresh works, and everybody
 * sees it when it does not — a slow connection, a blocked meta refresh, a
 * reader arriving from a search result. So it says the same thing the rail
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
            href={`/${l}/bangun/`}
            className="text-body underline underline-offset-4"
          >
            {pick(COPY.openIn, l)} <span aria-hidden>→</span>
            <span className="sr-only"> — {LOCALE_NAMES[l]}</span>
          </Link>
        ))}
      </nav>
      <meta httpEquiv="refresh" content={`0; url=${BASE}/id/bangun/`} />
    </main>
  )
}
