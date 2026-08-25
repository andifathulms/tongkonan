import { Sheet } from '@/components/Sheet'
import { LOCALES, isLocale } from '@/lib/i18n'
import { notFound } from 'next/navigation'

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  return (
    <Sheet locale={params.locale} route="bangun" rail={null}>
      <div />
    </Sheet>
  )
}
