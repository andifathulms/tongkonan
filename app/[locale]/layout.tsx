import { notFound } from 'next/navigation'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const dynamicParams = false

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()
  // The root <html> is Indonesian, the default. Marking the subtree here is
  // what tells a screen reader it has changed language on the English routes.
  return (
    <div lang={params.locale} className="min-h-dvh">
      {children}
    </div>
  )
}
