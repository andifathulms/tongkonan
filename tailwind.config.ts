import type { Config } from 'tailwindcss'

// Tokens come from DESIGN.md and nowhere else. The pigment set is closed:
// four traditional pa'ssura colours, plus interface neutrals that deliberately
// sit outside the set so pigment always reads as content.
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
        bolu: '#17150F', // soot
        rara: '#8E3B25', // red earth — the one accent
        riri: '#C8912B', // turmeric
        kapur: '#E9E3D2', // slaked lime
        film: '#D8D7CD', // drafting film
        ground: '#C3BDA9', // ground plane
        muted: '#6B675C', // muted ink
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      spacing: {
        // 4px grid. Tailwind's default scale is already on it; these are the
        // rail widths the surveyor's-sheet layout needs.
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
        micro: ['10px', { lineHeight: '14px', letterSpacing: '0.1em' }],
        label: ['11px', { lineHeight: '16px', letterSpacing: '0.1em' }],
        body: ['16px', { lineHeight: '24px' }],
      },
    },
  },
  plugins: [],
}

export default config
