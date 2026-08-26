import type { Metadata, Viewport } from 'next'
import '../globals.css'
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

/**
 * The localised half of the site.
 *
 * This is a root layout in its own right — one of two — because <html lang>
 * has to be the page's actual language and the locale is only known inside
 * the [locale] segment. A single shared root could only ever hardcode one of
 * them, which is what it did: every English page declared lang="id" and
 * corrected it on an inner div, so the document language was wrong on half
 * the site.
 *
 * The lang attribute is set by the layout directly below this one, where the
 * locale is a parameter.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return children
}
