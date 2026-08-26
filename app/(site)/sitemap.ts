import type { MetadataRoute } from 'next'
import { LOCALES, ROUTES, pageUrl } from '@/lib/i18n'

/**
 * Every page, from the same route table the navigation is built from.
 *
 * Generated rather than listed, so a route added to ROUTES appears here
 * without anyone remembering — a hand-written sitemap is a list that silently
 * stops matching the site.
 *
 * No lastModified. It would have to come from the clock, and the generator is
 * deterministic precisely so that nothing about this project depends on when
 * it was run; a date that changes on every deploy tells a crawler the content
 * changed when it did not.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    ROUTES.map((route) => ({
      url: pageUrl(route, locale),
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, pageUrl(route, l)])),
      },
    })),
  )
}
