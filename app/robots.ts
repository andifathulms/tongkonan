import type { MetadataRoute } from 'next'
import { BASE_PATH, SITE_ORIGIN } from '@/lib/i18n'

/**
 * The whole site is public and there is nothing to keep out of an index.
 *
 * It exists to point at the sitemap: without a robots.txt a crawler has no
 * way to discover one on a project site served from a subpath.
 *
 * At app/ rather than inside a route group, because the metadata file
 * conventions resolve from the app root and this one is not picked up from a
 * group. sitemap.ts is, which is why the two are not in the same place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${SITE_ORIGIN}${BASE_PATH}/sitemap.xml`,
  }
}
