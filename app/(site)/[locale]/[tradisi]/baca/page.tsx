import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BacaClient } from '@/components/BacaClient'
import { silhouette } from '@/lib/core/silhouette'
import { DEFAULT_LOCALE, isLocale, routeMetadata } from '@/lib/i18n'
import { isTraditionKey, tradition } from '@/lib/tradition/registry'

export function generateMetadata({
  params,
}: {
  params: { locale: string; tradisi: string }
}): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  const t = tradition(isTraditionKey(params.tradisi) ? params.tradisi : 'toraja')
  return routeMetadata('baca', locale, { slug: t.slug, house: t.house[locale] })
}

export default function Baca({ params }: { params: { locale: string; tradisi: string } }) {
  if (!isLocale(params.locale) || !isTraditionKey(params.tradisi)) notFound()
  const t = tradition(params.tradisi)
  /*
   * The intro the client shows until its one facade arrives — and the page's
   * static HTML: whose building, its caution, and its elevation, computed at
   * export time so the first paint is the drawing rather than a blank sheet.
   */
  const b = t.build(t.showcaseQuery)
  const intro = {
    house: t.house[params.locale],
    place: t.place[params.locale],
    about: t.about[params.locale],
    caution: t.caution[params.locale],
    s: silhouette(b.house, b.scene.ridgeAxis ?? 0),
  }
  return <BacaClient locale={params.locale} tradisi={params.tradisi} intro={intro} />
}
