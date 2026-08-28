import localFont from 'next/font/local'

/*
 * IBM Plex, vendored.
 *
 * DESIGN.md's typography section always held the door open: "if a webfont is
 * added later it must be a grotesque or a technical face." Plex is both — a
 * type family drawn for engineering documentation, which is what this site
 * pretends every page is. The files live in the repo (OFL licence beside
 * them), are served same-origin by next/font, and are inlined into the build,
 * so the zero-runtime-network rule still holds: the app works with the wifi
 * off, now in its own face.
 *
 * The sans is the v23 variable file, one latin subset covering 400–700. The
 * mono ships as two static weights because that is all the interface uses:
 * figures and labels do not need a bold.
 */

export const plexSans = localFont({
  src: './fonts/IBMPlexSans-latin-var.woff2',
  weight: '400 700',
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
})

export const plexMono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-latin-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/IBMPlexMono-latin-500.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
})

/** The two variables together, for a root <html> className. */
export const fontVariables = `${plexSans.variable} ${plexMono.variable}`
