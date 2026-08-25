'use client'

import { RailSection } from './Sheet'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { drawOrthographic, drawingFileName } from '@/lib/draw/orthographic'
import type { Projection } from '@/lib/draw/orthographic'
import type { House, Layout } from '@/lib/banua/types'

/**
 * Take the drawing away as lines.
 *
 * A measured drawing is checkable and a shaded render is not, so the export
 * is orthographic SVG rather than a screenshot of the viewport. Each sheet
 * carries its own title block with the interpolated share on it — a drawing
 * that leaves the room without saying how much of it is a guess is exactly
 * the failure this project exists to avoid.
 */
export function DrawingExport({
  house,
  layout,
  locale,
}: {
  house: House
  layout: Layout
  locale: Locale
}) {
  const views: { key: Projection; label: string }[] = [
    { key: 'denah', label: pick(COPY.draw.denah, locale) },
    { key: 'tampak', label: pick(COPY.draw.tampak, locale) },
    { key: 'potongan', label: pick(COPY.draw.potongan, locale) },
  ]

  const download = (view: Projection) => {
    const svg = drawOrthographic(house, layout, view, { locale })
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = drawingFileName(house, view)
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <RailSection title={pick(COPY.draw.heading, locale)}>
      <div className="flex flex-col gap-px">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => download(v.key)}
            className="rounded border border-[color:var(--hairline)] px-2 py-1.5 text-left text-[14px] transition-colors duration-state hover:bg-[rgba(23,21,15,0.06)]"
          >
            {v.label}
            <span className="micro ml-2">SVG</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-snug text-[color:var(--muted)]">
        {pick(COPY.draw.gloss, locale)}
      </p>
    </RailSection>
  )
}
