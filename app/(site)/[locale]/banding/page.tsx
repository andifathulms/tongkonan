import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BandingClient } from '@/components/BandingClient'
import { DEFAULT_LOCALE, bandingMetadata, isLocale } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return bandingMetadata(locale)
}

/**
 * The comparison, as one exported page per locale.
 *
 * The pair rides the query string, so every pairing of a growing collection
 * shares this one address — exporting the pairs themselves would be
 * quadratic and would put a count into the file system.
 */
export default function Banding({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <BandingClient locale={params.locale} />
}
