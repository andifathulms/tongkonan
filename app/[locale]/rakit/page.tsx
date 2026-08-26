import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RakitClient } from '@/components/RakitClient'
import { DEFAULT_LOCALE, LOCALES, isLocale, pageTitle } from '@/lib/i18n'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return { title: pageTitle('rakit', locale) }
}

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Rakit({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <RakitClient locale={params.locale} />
}
