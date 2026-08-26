import Link from 'next/link'
import { COPY, LOCALES, href, pick } from '@/lib/i18n'
import type { Locale, Route } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The old address, still answering.
 *
 * When the second house arrived the path gained a tradition segment, and a
 * citable address that stops resolving is not much of a citation. So the old
 * paths stay and say where the page went. There is no server to redirect
 * from, so this is a real page with real links and a meta refresh on top: the
 * refresh handles the ordinary case in a frame, and the links handle every
 * case where it does not fire.
 *
 * It offers both houses rather than silently choosing one. Someone arriving
 * here followed a link to a tongkonan, so that is the first and default
 * option — but the reason the address changed is that there is now more than
 * one house, and saying so is more useful than a redirect that hides it.
 */
export function Moved({ locale, route }: { locale: Locale; route: Route }) {
  const first = TRADITIONS[0]
  if (!first) throw new Error('no traditions registered')
  const target = `${BASE}${href(locale, first.slug, route)}/`

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6 py-24">
      <p className="micro text-bolu">{pick(COPY.appName, locale)}</p>
      <p className="text-lead text-bolu">{pick(COPY.tradition.note, locale)}</p>
      <nav>
        <ul className="flex flex-col gap-3">
          {TRADITIONS.map((t) => (
            <li key={t.key}>
              <Link
                href={`${href(locale, t.slug, route)}/`}
                className="text-body underline underline-offset-4"
              >
                {pick(COPY.nav[route], locale)} — {t.house[locale]}{' '}
                <span aria-hidden>→</span>
              </Link>
              <p className="mt-1 text-body text-muted">{t.place[locale]}</p>
            </li>
          ))}
        </ul>
      </nav>
      {LOCALES.includes(locale) ? <meta httpEquiv="refresh" content={`0; url=${target}`} /> : null}
    </main>
  )
}
