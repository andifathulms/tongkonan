'use client'

import { useMemo, useState } from 'react'
import { RailSection, Sheet } from './Sheet'
import { Viewport } from './viewport/Viewport'
import { ProvenanceStrip } from './Provenance'
import { Choice } from './Controls'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { buildHouse } from '@/lib/banua/assembly'
import { rankInfo, provenanceSplit } from '@/lib/banua/rules'
import type { Rules } from '@/lib/banua/types'
import { datePresets, presetInstant } from '@/lib/solar/presets'
import { solarPosition } from '@/lib/solar/position'

/**
 * The house read in reverse.
 *
 * Everything on this screen is something a stranger walking up to the
 * building could work out without being told: how many funerals it has held,
 * where the family stands, how many rooms are inside, which way is north.
 * That is what makes the geometry worth generating rather than drawing — the
 * shape is carrying information, and this route spends it.
 */

/** A specific house with a history, rather than a neutral default. */
const HOUSE: Rules = { rank: 'layuk', bays: 4, horns: 14 }

export function BacaClient({ locale }: { locale: Locale }) {
  const [section, setSection] = useState(false)
  const { house, layout } = useMemo(() => buildHouse(HOUSE), [])

  const sun = useMemo(() => {
    const preset = datePresets()[0]
    if (!preset) throw new Error('no date presets')
    return solarPosition(presetInstant(preset, 10 * 60))
  }, [])

  const rank = rankInfo(HOUSE.rank)
  const readings = [
    {
      title: pick(COPY.read.hornsTitle, locale),
      body: pick(COPY.read.hornsBody, locale),
      value: `${layout.hornCount}`,
      unit: locale === 'id' ? 'upacara' : 'funerals',
    },
    {
      title: pick(COPY.read.rankTitle, locale),
      body: pick(COPY.read.rankBody, locale),
      value: rank.name,
      unit: `${(rank.elaboration.value * 100).toFixed(0)}% ${locale === 'id' ? 'berukir' : 'carved'}`,
    },
    {
      title: pick(COPY.read.baysTitle, locale),
      body: pick(COPY.read.baysBody, locale),
      value: `${HOUSE.bays}`,
      unit: `${layout.postX.length} ${locale === 'id' ? 'baris tiang' : 'post rows'}`,
    },
    {
      title: pick(COPY.read.facingTitle, locale),
      body: pick(COPY.read.facingBody, locale),
      value: locale === 'id' ? 'Utara' : 'North',
      unit: `${layout.frontProwY.toFixed(1)} m ▲ ${layout.rearProwY.toFixed(1)} m`,
    },
    {
      title: pick(COPY.read.carvingTitle, locale),
      body: pick(COPY.read.carvingBody, locale),
      value: locale === 'id' ? "Indo' para" : 'Front board',
      unit: locale === 'id' ? 'muka utara' : 'north face',
    },
  ]

  const zones = [
    {
      name: pick(COPY.zones.sulluk, locale),
      gloss: pick(COPY.zones.sullukGloss, locale),
      from: 0,
      to: layout.floorFrameY,
    },
    {
      name: pick(COPY.zones.kale, locale),
      gloss: pick(COPY.zones.kaleGloss, locale),
      from: layout.deckY,
      to: layout.plateY,
    },
    {
      name: pick(COPY.zones.rattiang, locale),
      gloss: pick(COPY.zones.rattiangGloss, locale),
      from: layout.plateY,
      to: house.bounds.max[1],
    },
  ]

  return (
    <Sheet
      locale={locale}
      route="baca"
      rail={
        <>
          <RailSection title={pick(COPY.read.heading, locale)}>
            <p className="mb-4 text-body text-muted">
              {pick(COPY.read.intro, locale)}
            </p>
            <ol className="flex flex-col gap-4">
              {readings.map((r) => (
                <li key={r.title}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-body font-medium leading-tight">{r.title}</h3>
                    <span className="num shrink-0 text-body">{r.value}</span>
                  </div>
                  <p className="micro mt-0.5 text-right">{r.unit}</p>
                  <p className="mt-1 text-body text-muted">
                    {r.body}
                  </p>
                </li>
              ))}
            </ol>
          </RailSection>

          <RailSection title={pick(COPY.zones.heading, locale)}>
            <p className="mb-3 text-body text-muted">
              {pick(COPY.read.sectionGloss, locale)}
            </p>
            <dl className="flex flex-col gap-3">
              {zones.map((z) => (
                <div key={z.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-body leading-tight">{z.name}</dt>
                    <dd className="num text-meta">
                      {z.from.toFixed(2)}–{z.to.toFixed(2)} m
                    </dd>
                  </div>
                  <p className="mt-0.5 text-body text-muted">
                    {z.gloss}
                  </p>
                </div>
              ))}
            </dl>
          </RailSection>

          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip split={provenanceSplit(layout.dims)} locale={locale} />
          </RailSection>
        </>
      }
    >
      <Viewport
        locale={locale}
        house={house}
        layout={layout}
        sun={sun}
        view={section ? 'potongan' : 'tampak'}
        figure
        rain={false}
        section={section}
        reveal={null}
      >
        <fieldset className="absolute right-3 top-3 z-10 flex gap-px rounded border border-hairline bg-film p-px">
          <legend className="sr-only">{pick(COPY.read.sectionLegend, locale)}</legend>
          {[
            { on: false, label: pick(COPY.read.facade, locale) },
            { on: true, label: pick(COPY.read.section, locale) },
          ].map((o) => (
            <Choice
              key={o.label}
              name="potongan"
              value={String(o.on)}
              checked={o.on === section}
              onSelect={() => setSection(o.on)}
              face={[
                'micro inline-flex min-h-control items-center rounded px-2 transition-colors duration-state',
                o.on === section ? 'bg-bolu text-kapur' : 'text-bolu hover:bg-wash',
              ].join(' ')}
            >
              {o.label}
            </Choice>
          ))}
        </fieldset>
      </Viewport>
    </Sheet>
  )
}
