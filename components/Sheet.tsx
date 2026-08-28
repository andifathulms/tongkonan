import Link from 'next/link'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { COPY, LOCALES, ROUTES, homeHref, houseHref, href, pick } from '@/lib/i18n'
import type { Locale, Route } from '@/lib/i18n'
import type { Tradition } from '@/lib/tradition/registry'

/** The same page, in the other language. */
function localeTargets(route: Route, tradition: Tradition): Record<Locale, string> {
  return Object.fromEntries(
    LOCALES.map((l) => [l, `${href(l, tradition.slug, route)}/`]),
  ) as Record<Locale, string>
}

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
  tradition,
  rail,
  variant = 'viewport',
  children,
}: {
  locale: Locale
  route: Route
  /** which house this sheet is showing; every link in the shell needs it */
  tradition: Tradition
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
      {/*
        The first tab stop. The rail holds every control on these routes, so
        without this a keyboard reader pays a walk through all of them to
        reach the thing the controls are about. Visible only while focused,
        drawn like any other primary control.
      */}
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-20 focus:rounded focus:bg-bolu focus:px-3 focus:py-2 focus:text-body focus:text-kapur"
      >
        {pick(COPY.skip, locale)}
      </a>
      <h1 className="sr-only">{pick(COPY.nav[route], locale)}</h1>
      <aside
        className={[
          'flex flex-col bg-sheet',
          'sheet:min-h-0 sheet:w-rail sheet:shrink-0 sheet:overflow-y-auto sheet:border-r sheet:border-t-0 sheet:border-hairline',
          isViewport
            ? 'order-2 border-t border-hairline sheet:order-none'
            : 'border-b border-hairline sheet:border-b-0',
        ].join(' ')}
      >
        <TitleBlock locale={locale} route={route} tradition={tradition} />
        <div className="flex flex-col">{rail}</div>
      </aside>
      {/*
        On a phone a drawing stays stuck to the top of the screen while the
        rail scrolls under it, so changing a rule and seeing the house answer
        does not cost a scroll in each direction. It keeps 55% of the screen:
        the drawing is the argument, and it never becomes the caption.
      */}
      <main
        id="isi"
        className={[
          'sheet:h-auto sheet:min-h-0 sheet:flex-1',
          isViewport
            ? 'sticky top-0 order-1 h-viewport shrink-0 sheet:static sheet:order-none'
            : 'min-h-0',
        ].join(' ')}
      >
        <div className={isViewport ? 'relative h-full w-full' : 'relative sheet:h-full'}>
          {children}
          {isViewport ? <Masthead locale={locale} route={route} tradition={tradition} /> : null}
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
function Masthead({
  locale,
  route,
  tradition,
}: {
  locale: Locale
  route: Route
  tradition: Tradition
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-masthead flex-col justify-center border-t border-hairline bg-veil px-3 py-2 backdrop-blur-veil sheet:hidden">
      <div className="flex items-center justify-between gap-3">
        {/*
          The house, not the app: on a band this narrow one of them has to go,
          and the reader is inside a house. The way back up to the collection
          is the wordmark in the title block, which on a phone sits with the
          rail below the viewport.
        */}
        <Link
          href={`${houseHref(locale, tradition.slug)}/`}
          className="pointer-events-auto micro text-bolu"
        >
          {tradition.house[locale]}
        </Link>
        <div className="pointer-events-auto">
          <LocaleSwitch locale={locale} targets={localeTargets(route, tradition)} />
        </div>
      </div>
      {/* Two lines is the contract --masthead-h is sized for. */}
      <p className="mt-1 line-clamp-2 text-body leading-snug text-bolu">
        {pick(COPY.tagline, locale)}
      </p>
    </div>
  )
}

function TitleBlock({
  locale,
  route,
  tradition,
}: {
  locale: Locale
  route: Route
  tradition: Tradition
}) {
  return (
    <header className="px-4 pb-4 pt-4">
      {/*
        Identity is rendered once per screen, not once per component.

        Under 860px the masthead over the model carries the wordmark, the claim
        and the language switch, and this block used to carry them again — two
        wordmarks, two full language controls and four extra tab stops in the
        same document. So above 860px, where there is no masthead, this is the
        title block; below it, this is the navigation and the masthead is the
        title block.
      */}
      <div className="hidden sheet:block">
        <div className="flex items-baseline justify-between gap-3">
          {/* The wordmark is the way back up: the collection is the landing page. */}
          <Link href={`${homeHref(locale)}/`} className="micro text-bolu">
            {pick(COPY.appName, locale)}
          </Link>
          <LocaleSwitch locale={locale} targets={localeTargets(route, tradition)} />
        </div>
        {/*
          The tagline is the largest thing in the rail and the wordmark is the
          smallest. That inversion is deliberate: a stranger needs the claim
          before the name, and the name means nothing until they have it.
        */}
        <p className="mt-2 text-lead text-bolu">{pick(COPY.tagline, locale)}</p>
      </div>

      <HouseCrumb locale={locale} tradition={tradition} />

      {/* The thesis is wanted on both, and the masthead has no room for it. */}
      <p className="mt-2 text-body text-muted sheet:mt-2">{pick(COPY.thesis, locale)}</p>

      <hr className="rule my-4" />

      <nav>
        <ul className="flex flex-col gap-px">
          {ROUTES.map((r) => {
            const active = r === route
            return (
              <li key={r}>
                <Link
                  href={href(locale, tradition.slug, r)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'press block rounded px-2 py-1.5 transition-colors duration-state',
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
 * Which house this is, and the way back up.
 *
 * This used to be a tab row over every tradition, which stopped scaling the
 * moment there were four; the collection now lives on the landing page, and
 * the rail states only where you are. Leaving a house goes up through the
 * index rather than sideways: the switch is a cut, and the address's query
 * half — this house's rules — does not survive it, because `?pangkat=layuk`
 * means nothing to a rumah gadang.
 */
function HouseCrumb({ locale, tradition }: { locale: Locale; tradition: Tradition }) {
  return (
    <div className="mt-4 flex items-baseline justify-between gap-3">
      <Link
        href={`${houseHref(locale, tradition.slug)}/`}
        className="min-w-0 rounded transition-colors duration-state hover:bg-wash"
      >
        <span className="block text-body leading-tight text-bolu">{tradition.house[locale]}</span>
        <span className="mt-0.5 block text-meta text-muted">{tradition.place[locale]}</span>
      </Link>
      <Link
        href={`${homeHref(locale)}/`}
        className="micro shrink-0 text-bolu underline underline-offset-4"
      >
        {pick(COPY.tradition.all, locale)} <span aria-hidden>→</span>
      </Link>
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
