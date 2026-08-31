import type { MetadataRoute } from 'next'
import { BASE_PATH, COPY, DEFAULT_LOCALE, homeHref, pick } from '@/lib/i18n'

/**
 * What the app is called when it is not in a browser tab.
 *
 * The name is a proper name and identical in both locales, so nothing here
 * has to choose a language; the description does, and takes the default one,
 * because a manifest has one description and the site has two languages.
 *
 * Paths are written with the base path in them. Next rewrites the routes it
 * generates, but the strings in a manifest are data rather than links, so
 * they are the project's own to get right — and on Pages the site does not
 * live at the root.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: pick(COPY.appName, DEFAULT_LOCALE),
    short_name: pick(COPY.appName, DEFAULT_LOCALE),
    description: pick(COPY.tagline, DEFAULT_LOCALE),
    lang: DEFAULT_LOCALE,
    start_url: `${BASE_PATH}${homeHref(DEFAULT_LOCALE)}/`,
    scope: `${BASE_PATH}/`,
    display: 'standalone',
    // The film, the same colour the browser chrome is asked to take by day.
    background_color: '#D8D7CD',
    theme_color: '#D8D7CD',
    icons: [
      { src: `${BASE_PATH}/brand/icon-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `${BASE_PATH}/brand/icon-512.png`, sizes: '512x512', type: 'image/png' },
      // No rounded corners and a 20% safe-area inset, so Android may cut it to
      // whatever shape the launcher uses without taking a post off with it.
      {
        src: `${BASE_PATH}/brand/icon-maskable-512.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
