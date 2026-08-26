import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BangunClient } from '@/components/BangunClient'
import { DEFAULT_LOCALE, LOCALES, isLocale, pageTitle } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return { title: pageTitle('bangun', locale) }
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Bangun({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <BangunClient locale={params.locale} />
}
