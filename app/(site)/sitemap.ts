import type { MetadataRoute } from 'next'
import { LOCALES, ROUTES, houseUrl, landingUrl, pageUrl } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'

/**
 * Every page, from the same route table the navigation is built from.
 *
 * Generated rather than listed, so a route added to ROUTES — or a house added
 * to the registry — appears here without anyone remembering. A hand-written
 * sitemap is a list that silently stops matching the site.
 *
 * The moved stubs at the old, tradition-less paths are deliberately absent:
 * they carry `noindex`, they exist for links already in the world, and a
 * sitemap that advertised them would be asking crawlers to index a signpost.
 *
 * No lastModified. It would have to come from the clock, and the generator is
 * deterministic precisely so that nothing about this project depends on when
 * it was run; a date that changes on every deploy tells a crawler the content
 * changed when it did not.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const landing = LOCALES.map((locale) => ({
    url: landingUrl(locale),
    alternates: {
      languages: Object.fromEntries(LOCALES.map((l) => [l, landingUrl(l)])),
    },
  }))
  const homes = LOCALES.flatMap((locale) =>
    TRADITIONS.map((tradition) => ({
      url: houseUrl(locale, tradition.slug),
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [l, houseUrl(l, tradition.slug)])),
      },
    })),
  )
  const routes = LOCALES.flatMap((locale) =>
    TRADITIONS.flatMap((tradition) =>
      ROUTES.map((route) => ({
        url: pageUrl(route, locale, tradition.slug),
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [l, pageUrl(route, l, tradition.slug)]),
          ),
        },
      })),
    ),
  )
  return [...landing, ...homes, ...routes]
}
