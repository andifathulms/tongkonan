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
  variant = 'viewport',
  children,
}: {
  locale: Locale
  route: Route
  rail: React.ReactNode
  /**
   * `viewport` puts a drawing in the drawing area. `document` puts prose and
   * a table there instead, and those want to flow down the page on a phone
   * rather than being penned into the slot the model would have had.
   */
  variant?: 'viewport' | 'document'
  children: React.ReactNode
}) {
  const isViewport = variant === 'viewport'
  return (
    <div className="flex min-h-dvh flex-col sheet:h-dvh sheet:flex-row">
      {/*
        The rail comes first in the DOM because it comes first on the page.

        It used to be second and was pulled left with `order`, which meant the
        first Tab landed on the view switch in the top-right and then jumped
        back to the far-left rail — focus order running backwards against
        reading order on every desktop screen. The mobile arrangement is the
        one that genuinely differs from source order, so that is the one
        `order` is spent on: the drawing goes above the rail on a phone.
      */}
      {/*
        The page's own name, as its heading.

        Three of the four routes had no h1 at all: five rail sections as h2 and
        nothing above them, so a screen reader's heading list gave the page's
        contents and never its title. It is not drawn, because the active nav
        item below already shows which route this is — this exists to root the
        heading outline, not to repeat the navigation.
      */}
      <h1 className="sr-only">{pick(COPY.nav[route], locale)}</h1>
      <aside
        className={[
          'flex flex-col bg-film',
          'sheet:min-h-0 sheet:w-rail sheet:shrink-0 sheet:overflow-y-auto sheet:border-r sheet:border-t-0 sheet:border-hairline',
          isViewport
            ? 'order-2 border-t border-hairline sheet:order-none'
            : 'border-b border-hairline sheet:border-b-0',
        ].join(' ')}
      >
        <TitleBlock locale={locale} route={route} />
        <div className="flex flex-col">{rail}</div>
      </aside>
      {/*
        On a phone a drawing stays stuck to the top of the screen while the
        rail scrolls under it, so changing a rule and seeing the house answer
        does not cost a scroll in each direction. It keeps 55% of the screen:
        the drawing is the argument, and it never becomes the caption.
      */}
      <main
        className={[
          'sheet:h-auto sheet:min-h-0 sheet:flex-1',
          isViewport
            ? 'sticky top-0 order-1 h-[55dvh] shrink-0 sheet:static sheet:order-none'
            : 'min-h-0',
        ].join(' ')}
      >
        <div className={isViewport ? 'relative h-full w-full' : 'relative sheet:h-full'}>
          {children}
          {isViewport ? <Masthead locale={locale} route={route} /> : null}
        </div>
      </main>
    </div>
  )
}

/**
 * What this is, over the drawing, on a narrow screen only.
 *
 * Under 860px the rail sits below the viewport, so the wordmark, the claim
 * and the language switch are all off-screen on arrival and the first thing a
 * stranger sees is an unexplained model. This band is the same three things,
 * put where they are unavoidable. Above 860px the rail is already beside the
 * drawing and the band would be saying it twice, so it is not rendered.
 */
function Masthead({ locale, route }: { locale: Locale; route: Route }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-[var(--masthead-h)] flex-col justify-center border-t border-hairline bg-veil px-3 py-2 backdrop-blur-[2px] sheet:hidden">
      <div className="flex items-center justify-between gap-3">
        <span className="micro text-bolu">{pick(COPY.appName, locale)}</span>
        <div className="pointer-events-auto">
          <LocaleSwitch locale={locale} route={route} />
        </div>
      </div>
      {/* Two lines is the contract --masthead-h is sized for. */}
      <p className="mt-1 line-clamp-2 text-body leading-snug text-bolu">
        {pick(COPY.tagline, locale)}
      </p>
    </div>
  )
}

function TitleBlock({ locale, route }: { locale: Locale; route: Route }) {
  return (
    <header className="px-4 pb-4 pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <Link href={href(locale, 'bangun')} className="micro text-bolu">
          {pick(COPY.appName, locale)}
        </Link>
        <LocaleSwitch locale={locale} route={route} />
      </div>
      {/*
        The tagline is the largest thing in the rail and the wordmark is the
        smallest. That inversion is deliberate: a stranger needs the claim
        before the name, and the name means nothing until they have it.
      */}
      <p className="mt-2 text-lead text-bolu">{pick(COPY.tagline, locale)}</p>
      <p className="mt-2 text-body text-muted">{pick(COPY.thesis, locale)}</p>

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
                    active ? 'bg-bolu text-kapur' : 'text-bolu hover:bg-wash',
                  ].join(' ')}
                >
                  <span className="block text-body leading-tight">
                    {pick(COPY.nav[r], locale)}
                  </span>
                  <span
                    className={[
                      'mt-0.5 block text-meta',
                      active ? 'text-muted-on-ink' : 'text-muted',
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

/**
 * The language switch.
 *
 * Half the readers this is built for cannot read the locale it defaults to,
 * so the way out has to be findable without reading anything: full ink on the
 * inactive side, a rule between the two, and a target you can hit with a
 * thumb. The label of each side is written in its own language, because a
 * reader looking for English is looking for the word English.
 */
function LocaleSwitch({ locale, route }: { locale: Locale; route: Route }) {
  return (
    <div className="flex items-stretch overflow-hidden rounded border border-hairline">
      {LOCALES.map((l, i) => (
        <Link
          key={l}
          href={href(l, route)}
          hrefLang={l}
          lang={l}
          aria-label={`${LOCALE_NAMES[l]} — ${pick(COPY.openIn, l)}`}
          title={pick(COPY.openIn, l)}
          aria-current={l === locale ? 'true' : undefined}
          className={[
            'micro flex min-h-[26px] items-center px-2 transition-colors duration-state',
            i > 0 ? 'border-l border-hairline' : '',
            l === locale ? 'bg-bolu text-kapur' : 'text-bolu hover:bg-wash',
          ].join(' ')}
        >
          {l.toUpperCase()}
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
    <section className="border-t border-hairline px-4 py-4">
      {title ? <h2 className="micro mb-3">{title}</h2> : null}
      {children}
    </section>
  )
}
