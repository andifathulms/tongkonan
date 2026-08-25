import Link from 'next/link'

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The root sends you to the Indonesian generator.
 *
 * A static export has no server to redirect from, so this is a real page with
 * a real link rather than a redirect that silently fails when JavaScript does.
 */
export default function Index() {
  return (
    <main className="mx-auto flex min-h-full max-w-xl flex-col justify-center gap-6 px-6 py-24">
      <h1 className="text-2xl font-medium">Tongkonan</h1>
      <p className="text-body">
        Rumah yang dihitung dari aturannya, bukan digambar.
      </p>
      <nav className="flex flex-col gap-2">
        <Link className="underline underline-offset-4" href="/id/bangun/">
          Buka dalam Bahasa Indonesia →
        </Link>
        <Link className="underline underline-offset-4" href="/en/bangun/">
          Open in English →
        </Link>
      </nav>
      <meta httpEquiv="refresh" content={`0; url=${BASE}/id/bangun/`} />
    </main>
  )
}
