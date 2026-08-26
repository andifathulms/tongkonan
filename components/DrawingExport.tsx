'use client'

import { RailSection } from './Sheet'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
/*
 * The drawing code is loaded when a drawing is asked for, not before.
 *
 * It is roughly a third of this route's page chunk and it does nothing until
 * someone presses one of these four buttons. Nothing above the fold depends
 * on it and it is not part of a first interaction — the first interaction on
 * this route is changing a rule, which is already loaded.
 *
 * A dynamic import, not a library: it is the platform's own, and the pass that
 * added this was not allowed to add a dependency to solve a size problem.
 */
import type { Projection } from '@/lib/draw/orthographic'
import type { TraditionKey } from '@/lib/tradition/registry'
import { buildHouse } from '@/lib/tradition/toraja/assembly'
import { rulesFromQuery } from '@/lib/tradition/toraja/address'

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
  tradition,
  query,
  locale,
}: {
  tradition: TraditionKey
  query: string
  locale: Locale
}) {
  /*
   * Orthographic export exists for one house so far.
   *
   * `lib/draw/` reads a tongkonan's Layout directly — prows, ijuk courses,
   * the knee across the slope — and generalising it is a second projection
   * problem rather than a threading one, because the rumah gadang's ridge
   * runs on the other axis and its plan is a grid rather than a row of bays.
   * Offering a button that produced a wrong sheet would be worse than not
   * offering one, so the section is absent and the gap is recorded.
   */
  if (tradition !== 'toraja') return null
  return <TorajaDrawings query={query} locale={locale} />
}

function TorajaDrawings({ query, locale }: { query: string; locale: Locale }) {
  const { house, layout } = buildHouse(rulesFromQuery(query))
  const views: { key: Projection; label: string }[] = [
    { key: 'denah', label: pick(COPY.draw.denah, locale) },
    { key: 'tampak', label: pick(COPY.draw.tampak, locale) },
    { key: 'potongan', label: pick(COPY.draw.potongan, locale) },
  ]

  const save = (svg: string, name: string) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = name
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
            onClick={async () => {
              const { drawOrthographic, drawingFileName } = await import(
                '@/lib/draw/orthographic'
              )
              save(drawOrthographic(house, layout, v.key, { locale }), drawingFileName(house, v.key))
            }}
            className="rounded border border-hairline px-2 py-1.5 text-left text-body transition-colors duration-state hover:bg-wash"
          >
            {v.label}
            <span className="micro ml-2">SVG</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-body text-muted">{pick(COPY.draw.gloss, locale)}</p>

      {/*
        Set apart from the three single views because it is a different thing:
        those are one drawing, this is the drawing and everything needed to
        check it, on one page.
      */}
      <button
        type="button"
        onClick={async () => {
          const { drawSheet, sheetFileName } = await import('@/lib/draw/sheet')
          save(drawSheet(house, layout, { locale }), sheetFileName(house))
        }}
        className="mt-4 w-full rounded bg-bolu px-2 py-2 text-left text-body text-kapur transition-opacity duration-state hover:opacity-90"
      >
        {pick(COPY.draw.sheet, locale)}
        <span className="micro ml-2 text-kapur">SVG</span>
      </button>
      <p className="mt-2 text-body text-muted">{pick(COPY.draw.sheetGloss, locale)}</p>
    </RailSection>
  )
}
