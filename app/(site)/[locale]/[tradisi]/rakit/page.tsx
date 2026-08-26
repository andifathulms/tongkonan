import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RakitClient } from '@/components/RakitClient'
import { DEFAULT_LOCALE, isLocale, routeMetadata } from '@/lib/i18n'
import { isTraditionKey, tradition } from '@/lib/tradition/registry'

export function generateMetadata({
  params,
}: {
  params: { locale: string; tradisi: string }
}): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  const t = tradition(isTraditionKey(params.tradisi) ? params.tradisi : 'toraja')
  return routeMetadata('rakit', locale, { slug: t.slug, house: t.house[locale] })
}

export default function Rakit({ params }: { params: { locale: string; tradisi: string } }) {
  if (!isLocale(params.locale) || !isTraditionKey(params.tradisi)) notFound()
  return <RakitClient locale={params.locale} tradisi={params.tradisi} />
}
