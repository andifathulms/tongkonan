import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n'
import { TRADITION_KEYS, isTraditionKey } from '@/lib/tradition/registry'

/**
 * Every page of the site is one house, in one language.
 *
 * The two segments are enumerated rather than dynamic because both are closed
 * sets: there are two locales and there are two traditions, and a path
 * naming anything else is a 404 rather than an empty house.
 */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => TRADITION_KEYS.map((tradisi) => ({ locale, tradisi })))
}

export const dynamicParams = false

export default function TraditionLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string; tradisi: string }
}) {
  if (!isLocale(params.locale) || !isTraditionKey(params.tradisi)) notFound()
  return children
}
