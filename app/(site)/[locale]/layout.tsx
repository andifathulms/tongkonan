import { notFound } from 'next/navigation'
import { fontVariables } from '@/app/fonts'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

/**
 * The document, in the language it is actually written in.
 *
 * `<html lang>` used to be hardcoded to Indonesian for the whole site, with
 * the real locale marked on an inner div — so every English page declared
 * itself Indonesian at the document level and corrected it one element down.
 * The subtree marking was enough for a screen reader reading the content; it
 * was not enough for anything reading the document.
 *
 * The lang is a parameter here, so it is simply right, and the inner div that
 * existed only to correct it is gone.
 */
export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  return (
    <html lang={params.locale} className={fontVariables}>
      <body className="min-h-dvh">{children}</body>
    </html>
  )
}
