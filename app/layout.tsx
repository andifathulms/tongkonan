import type { Metadata, Viewport } from 'next'
import './globals.css'
import { BASE_PATH, SITE_ORIGIN } from '@/lib/i18n'

/*
 * Only what is genuinely shared. Every route generates its own title,
 * description, canonical and share card from its own on-page copy, so nothing
 * here may restate them — a description written once at the root is a
 * description that describes one page and mislabels the other seven.
 */
export const metadata: Metadata = {
  metadataBase: new URL(`${SITE_ORIGIN}${BASE_PATH}/`),
  title: { default: 'Tongkonan', template: '%s' },
}

export const viewport: Viewport = {
  themeColor: '#D8D7CD',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The lang attribute is set on the locale layout below this one, where the
  // locale is actually known.
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  )
}
