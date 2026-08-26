import type { Metadata } from 'next'
import { Moved } from '@/components/Moved'
import { DEFAULT_LOCALE, LOCALES, isLocale, pageUrl } from '@/lib/i18n'
import { DEFAULT_TRADITION, tradition } from '@/lib/tradition/registry'

/**
 * Where this route used to live.
 *
 * The address gained a tradition segment when the second house arrived. A
 * query string that was a complete citation before is still one — it just
 * needs to know which rule pack it belongs to — so the old path stays and
 * says where it went, carrying the query with it. A static export has no
 * server to redirect from, which is why this is a real page.
 */
export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return {
    title: 'Pasak',
    robots: { index: false, follow: true },
    alternates: { canonical: pageUrl('rakit', locale, tradition(DEFAULT_TRADITION).slug) },
  }
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function RakitMoved({ params }: { params: { locale: string } }) {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return <Moved locale={locale} route="rakit" />
}
