import { notFound } from 'next/navigation'
import { RakitClient } from '@/components/RakitClient'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Rakit({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <RakitClient locale={params.locale} />
}
