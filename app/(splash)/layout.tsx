import type { Metadata, Viewport } from 'next'
import '../globals.css'
import { BASE_PATH, COPY, DEFAULT_LOCALE, SITE_ORIGIN, pick } from '@/lib/i18n'

export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_ORIGIN}${BASE_PATH}/`),
  // The one place the old name survived the rename.
  title: pick(COPY.appName, DEFAULT_LOCALE),
}

export const viewport: Viewport = {
  themeColor: '#D8D7CD',
  width: 'device-width',
  initialScale: 1,
}

/**
 * The root splash, which belongs to no locale.
 *
 * A second root layout, so the localised half of the site can declare its own
 * language on <html> rather than inheriting one. This half is Indonesian
 * because the splash leads with Indonesian and offers English beside it.
 */
export default function SplashLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={DEFAULT_LOCALE}>
      <body>{children}</body>
    </html>
  )
}
