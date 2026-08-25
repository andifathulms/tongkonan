import Link from 'next/link'
import { COPY, LOCALES, LOCALE_NAMES, ROUTES, href, pick } from '@/lib/i18n'
import type { Locale, Route } from '@/lib/i18n'

/**
 * The surveyor's sheet: title block on the left, drawing on the right.
 *
 * Below 860px the rail moves under the viewport and scrolls, and the viewport
 * keeps at least half the screen — the drawing is the argument, and a stack
 * of controls above it would make it the caption instead.
 */
export function Sheet({
  locale,
  route,
  rail,
  children,
}: {
  locale: Locale
  route: Route
  rail: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex h-dvh flex-col-reverse sheet:flex-row">
      <aside className="flex min-h-0 shrink-0 flex-col overflow-y-auto border-t border-[color:var(--hairline)] sheet:w-rail sheet:border-r sheet:border-t-0">
        <TitleBlock locale={locale} route={route} />
        <div className="flex flex-col">{rail}</div>
      </aside>
      <main className="relative min-h-[50dvh] flex-1 sheet:min-h-0">{children}</main>
    </div>
  )
}

function TitleBlock({ locale, route }: { locale: Locale; route: Route }) {
  return (
    <header className="px-4 pb-4 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={href(locale, 'bangun')} className="text-lg font-medium leading-tight">
          {pick(COPY.appName, locale)}
        </Link>
        <LocaleSwitch locale={locale} route={route} />
      </div>
      <p className="mt-1 text-[13px] leading-snug text-[color:var(--muted)]">
        {pick(COPY.tagline, locale)}
      </p>

      <hr className="rule my-4" />

      <nav>
        <ul className="flex flex-col gap-px">
          {ROUTES.map((r) => {
            const active = r === route
            return (
              <li key={r}>
                <Link
                  href={href(locale, r)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'block rounded px-2 py-1.5 transition-colors duration-state',
                    active
                      ? 'bg-bolu text-kapur'
                      : 'text-bolu hover:bg-[rgba(23,21,15,0.06)]',
                  ].join(' ')}
                >
                  <span className="block text-[15px] leading-tight">
                    {pick(COPY.nav[r], locale)}
                  </span>
                  <span
                    className={[
                      'mt-0.5 block text-[11px] leading-tight',
                      active ? 'text-[rgba(233,227,210,0.7)]' : 'text-[color:var(--muted)]',
                    ].join(' ')}
                  >
                    {pick(COPY.navGloss[r], locale)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}

function LocaleSwitch({ locale, route }: { locale: Locale; route: Route }) {
  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={href(l, route)}
          hrefLang={l}
          aria-label={LOCALE_NAMES[l]}
          aria-current={l === locale ? 'true' : undefined}
          className={[
            'micro rounded px-1.5 py-0.5 transition-colors duration-state',
            l === locale ? 'bg-bolu text-kapur' : 'hover:bg-[rgba(23,21,15,0.06)]',
          ].join(' ')}
        >
          {l}
        </Link>
      ))}
    </div>
  )
}

/** A ruled block in the rail. Every section of the title block is one of these. */
export function RailSection({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[color:var(--hairline)] px-4 py-4">
      {title ? <h2 className="micro mb-3">{title}</h2> : null}
      {children}
    </section>
  )
}
