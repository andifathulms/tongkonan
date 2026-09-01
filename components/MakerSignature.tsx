import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

/**
 * Who built this.
 *
 * Everything else in this interface is about the buildings and says so
 * quietly; this is the one line that is about the author, so it is drawn at
 * the smallest step the scale has, in muted ink, at the bottom of whatever
 * the page's last band is. It is a credit and not a badge: no card, no
 * corner sticker, no rule of its own — it shares the seam that is already
 * there.
 *
 * It is deliberately kept apart from anything the site owes somebody else.
 * A licence, a data credit and a source table are obligations; this is a
 * signature. Running them together would make the signature read as a legal
 * notice and the obligations read as decoration.
 *
 * One array holds the identity, so changing a handle is one line.
 */

const PORTFOLIO = 'https://andifathulms.github.io/en/'

const MAKER = {
  name: 'Andi Fathul Mukminin',
  portfolio: PORTFOLIO,
} as const

/**
 * The icon links, in the order they are read: the author's own site first,
 * then the places they are found. Each carries its own path data rather than
 * an icon dependency — the same reason nothing else here is downloaded.
 */
const LINKS: readonly { label: string; href: string; path: React.ReactNode }[] = [
  {
    label: 'Portfolio',
    href: PORTFOLIO,
    // A globe: the meridian and the equator, which is as much as reads at 18px.
    path: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
      </>
    ),
  },
  {
    label: 'GitHub',
    href: 'https://github.com/andifathulms',
    path: (
      <>
        {/* Head, ears and both legs as one stroke, the tail as a second. */}
        <path d="M14.8 21.6v-3.9a3.9 3.9 0 0 0-1-2.9c3.1-.3 6.3-1.5 6.3-6.2a4.8 4.8 0 0 0-1.3-3.4 4.5 4.5 0 0 0-.1-3.4s-1.1-.3-3.5 1.3a11.9 11.9 0 0 0-6.4 0C6.4 1.5 5.3 1.8 5.3 1.8a4.5 4.5 0 0 0-.1 3.4A4.8 4.8 0 0 0 3.9 8.6c0 4.7 3.2 5.9 6.3 6.2a3.9 3.9 0 0 0-1 2.9v3.9" />
        <path d="M9.2 18.3c-4.4 1.9-4.9-1.9-6.8-1.9" />
      </>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/andifathulmukminin/',
    path: (
      <>
        <path d="M4.5 9.5v10M4.5 5.2v.02" />
        <path d="M10 19.5v-6a3.5 3.5 0 0 1 7 0v6" />
        <path d="M10 9.5v10" />
      </>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/andifathulms/',
    path: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <path d="M17.5 6.5v.02" />
      </>
    ),
  },
]

/** Every outbound link here leaves the site, and none of them may reach back. */
const OUT = { target: '_blank', rel: 'noopener noreferrer' } as const

export function MakerSignature({
  locale,
  className = '',
}: {
  locale: Locale
  className?: string
}) {
  /*
   * The year the export was built, which on a site with no server is the
   * honest reading of a copyright line: it dates the artefact the reader is
   * holding. It comes from next.config.mjs rather than from a clock read
   * here — this component reaches the client bundle, and a clock read on the
   * client would disagree with the committed HTML as soon as the build year
   * went stale. The fallback is for anything that renders this outside a
   * Next build, which today is nothing.
   */
  const year = process.env.NEXT_PUBLIC_BUILD_YEAR ?? ''
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`.trim()}>
      <p className="text-meta text-muted">
        {pick(COPY.maker.built, locale)}{' '}
        <a
          href={MAKER.portfolio}
          {...OUT}
          className="text-bolu underline underline-offset-4 transition-colors duration-state hover:text-rara"
        >
          {MAKER.name}
        </a>{' '}
        <span aria-hidden>·</span>{' '}
        {/* The year is a measured figure, so it is set in the measuring face. */}
        <span className="font-mono tabular-nums">© {year}</span>
      </p>
      <ul className="-mx-1 flex items-center">
        {LINKS.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              {...OUT}
              aria-label={l.label}
              className="press block rounded p-1 text-muted transition-colors duration-state hover:bg-wash hover:text-bolu"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {l.path}
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
