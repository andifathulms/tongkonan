import type { Config } from 'tailwindcss'

/*
 * Tokens come from DESIGN.md, are written down in app/globals.css, and are
 * mapped onto utility names here. This file declares no values of its own —
 * every entry below points at a custom property, so there is exactly one
 * place a colour or a size is decided and the renderer can read the same one.
 *
 * The pigment set is closed: four traditional pa'ssura colours, plus
 * interface neutrals that deliberately sit outside the set so pigment always
 * reads as content.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Below this the rail moves under the viewport and scrolls. The
        // viewport never gets less than half the screen.
        sheet: '860px',
      },
      colors: {
        bolu: 'var(--bolu)', // soot
        rara: 'var(--rara)', // red earth — the one accent
        riri: 'var(--riri)', // turmeric, as a fill
        'riri-ink': 'var(--riri-ink)', // turmeric dropped in value, for strokes and labels
        kapur: 'var(--kapur)', // slaked lime
        film: 'var(--film)', // drafting film
        ground: 'var(--ground)', // ground plane
        muted: 'var(--muted)', // muted ink
        'muted-on-ink': 'var(--muted-on-ink)', // muted ink, over a soot field
        hairline: 'var(--hairline)',
        wash: 'var(--wash)', // hover
        veil: 'var(--veil)', // panels floating over the model
      },
      fontFamily: {
        // Two families, both from the system. Sans reads; mono measures.
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      height: {
        // The minimum pointer target, from the tokens.
        control: 'var(--control-target)',
      },
      minHeight: {
        control: 'var(--control-target)',
      },
      spacing: {
        // 4px grid. Tailwind's default scale is already on it; this is the
        // rail width the surveyor's-sheet layout needs.
        rail: '320px',
      },
      borderRadius: {
        DEFAULT: '2px',
        none: '0',
      },
      transitionDuration: {
        // The only three timings in the app.
        state: '150ms',
        layout: '400ms',
        orchestrated: '1100ms',
      },
      fontSize: {
        // The one type scale. A bracketed pixel size in a component is a bug.
        micro: ['var(--fs-micro)', { lineHeight: 'var(--lh-snug)', letterSpacing: '0.1em' }],
        meta: ['var(--fs-meta)', { lineHeight: 'var(--lh-snug)' }],
        body: ['var(--fs-body)', { lineHeight: 'var(--lh-body)' }],
        lead: ['var(--fs-lead)', { lineHeight: 'var(--lh-snug)' }],
        title: ['var(--fs-title)', { lineHeight: 'var(--lh-tight)' }],
        display: ['var(--fs-display)', { lineHeight: 'var(--lh-tight)' }],
      },
    },
  },
  plugins: [],
}

export default config
