import { notFound } from 'next/navigation'
import { BangunClient } from '@/components/BangunClient'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Bangun({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <BangunClient locale={params.locale} />
}
