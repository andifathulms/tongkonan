import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tongkonan',
  description:
    'Rumah tongkonan yang dihitung dari aturannya — pangkat, jumlah ruang, dan jumlah tanduk — bukan digambar.',
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
