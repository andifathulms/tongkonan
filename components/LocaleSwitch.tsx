import Link from 'next/link'
import { COPY, LOCALES, LOCALE_NAMES, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

/**
 * The language switch face, shared by every page that has one.
 *
 * Half the readers this is built for cannot read the locale it defaults to,
 * so the way out has to be findable without reading anything: full ink on the
 * inactive side, a rule between the two, and a target you can hit with a
 * thumb.
 *
 * The target for each language is the same page in that language, which only
 * the page knows — so it arrives as data rather than being computed here.
 */
export function LocaleSwitch({
  locale,
  targets,
}: {
  locale: Locale
  targets: Record<Locale, string>
}) {
  return (
    <div className="flex items-stretch overflow-hidden rounded border border-hairline">
      {LOCALES.map((l, i) => (
        <Link
          key={l}
          href={targets[l]}
          hrefLang={l}
          lang={l}
          aria-label={`${LOCALE_NAMES[l]} — ${pick(COPY.openIn, l)}`}
          title={pick(COPY.openIn, l)}
          aria-current={l === locale ? 'true' : undefined}
          className={[
            'micro flex min-h-control items-center px-2 transition-colors duration-state',
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
