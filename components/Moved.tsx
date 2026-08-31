'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { COPY, homeHref, href, pick } from '@/lib/i18n'
import type { Locale, Route } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The old address, still answering — and now actually keeping its promise.
 *
 * When the second house arrived the path gained a tradition segment, and a
 * citable address that stops resolving is not much of a citation. The page
 * always said the query travelled with the reader; the static meta refresh
 * could never carry it, because it is written at export time and the query
 * arrives at read time. So the redirect is done on mount, with the query and
 * the fragment attached, and the refresh stays only as the no-JavaScript
 * fallback — those readers get the links below and their rules stay in the
 * address bar to reattach by hand.
 *
 * One primary door, not a wall: the first house is where every old citation
 * pointed, so that is the door. The rest of the collection is one link away
 * at the landing, which is built for choosing.
 */
export function Moved({ locale, route }: { locale: Locale; route: Route }) {
  const first = TRADITIONS[0]
  if (!first) throw new Error('no traditions registered')
  const target = `${BASE}${href(locale, first.slug, route)}/`

  useEffect(() => {
    window.location.replace(`${target}${window.location.search}${window.location.hash}`)
  }, [target])

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-5 px-6 py-24">
      <p className="micro text-bolu">{pick(COPY.appName, locale)}</p>
      <h1 className="text-title font-medium text-bolu">{pick(COPY.moved.heading, locale)}</h1>
      <p className="text-body text-bolu">{pick(COPY.moved.line, locale)}</p>
      <nav className="flex flex-col gap-3">
        <Link
          href={`${href(locale, first.slug, route)}/`}
          className="press w-fit rounded bg-bolu px-4 py-2 text-body text-kapur transition-opacity duration-state hover:opacity-90"
        >
          {pick(COPY.nav[route], locale)} — {first.house[locale]} <span aria-hidden>→</span>
        </Link>
        <Link
          href={`${homeHref(locale)}/`}
          className="w-fit text-body text-bolu underline underline-offset-4"
        >
          {pick(COPY.tradition.all, locale)} <span aria-hidden>→</span>
        </Link>
      </nav>
      <meta httpEquiv="refresh" content={`4; url=${target}`} />
    </main>
  )
}
