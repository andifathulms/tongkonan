import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BacaClient } from '@/components/BacaClient'
import { DEFAULT_LOCALE, LOCALES, isLocale, routeMetadata } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return routeMetadata('baca', locale)
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Baca({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <BacaClient locale={params.locale} />
}
