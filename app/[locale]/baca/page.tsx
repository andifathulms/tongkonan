import { notFound } from 'next/navigation'
import { BacaClient } from '@/components/BacaClient'
import { LOCALES, isLocale } from '@/lib/i18n'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Baca({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return <BacaClient locale={params.locale} />
}
