'use client'

import { useMemo } from 'react'
import { RailSection, Sheet } from './Sheet'
import { Viewport } from './viewport/Viewport'
import { ProvenanceStrip } from './Provenance'
import { useReaderState } from './useReaderState'
import { flag, readFlag, unless } from '@/lib/reader'
import { Choice } from './Controls'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { tradition } from '@/lib/tradition/registry'
import type { TraditionKey } from '@/lib/tradition/registry'
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

export function BacaClient({ locale, tradisi }: { locale: Locale; tradisi: TraditionKey }) {
  /*
   * A specific house with a history, rather than a neutral default.
   *
   * Which one is the tradition's own choice: what a façade says depends on
   * what it has to say, and a house with no funerals held or no daughters
   * married would be a blank page on the route whose whole subject is what
   * can be read off a building.
   */
  const t0 = useMemo(() => tradition(tradisi), [tradisi])
  /* The one thing a reader chooses here: façade, or cut open. */
  const [vantage, setVantage] = useReaderState(
    { section: false },
    (p) => ({ section: readFlag(p.get('potongan'), false) }),
    (v) => [['potongan', unless(v.section, false, flag)]],
  )
  const section = vantage.section
  const setSection = (v: boolean) => setVantage({ section: v })
  const built = useMemo(() => t0.build(t0.showcaseQuery), [t0])

  const sun = useMemo(() => {
    const preset = datePresets(t0.site)[0]
    if (!preset) throw new Error('no date presets')
    return solarPosition(presetInstant(preset, 10 * 60, t0.site), t0.site)
  }, [t0])

  return (
    <Sheet
      locale={locale}
      route="baca"
      tradition={t0}
      rail={
        <>
          <RailSection title={pick(COPY.read.heading, locale)}>
            <p className="mb-4 text-body text-muted">
              {pick(COPY.read.intro, locale)}
            </p>
            <ol className="flex flex-col gap-4">
              {built.readings.map((r) => (
                <li key={r.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-body font-medium leading-tight">{r.title[locale]}</h3>
                    <span className="num shrink-0 text-body">{r.value[locale]}</span>
                  </div>
                  <p className="micro mt-0.5 text-right">{r.unit[locale]}</p>
                  <p className="mt-1 text-body text-muted">{r.body[locale]}</p>
                </li>
              ))}
            </ol>
          </RailSection>

          <RailSection title={pick(COPY.zones.heading, locale)}>
            <p className="mb-3 text-body text-muted">
              {pick(COPY.read.sectionGloss, locale)}
            </p>
            <dl className="flex flex-col gap-3">
              {built.scene.zones.map((z) => (
                <div key={z.key}>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-body leading-tight">
                      {locale === 'id' ? z.nameId : z.nameEn}
                    </dt>
                    <dd className="num text-meta">
                      {z.fromY.toFixed(2)}–{z.toY.toFixed(2)} m
                    </dd>
                  </div>
                  <p className="mt-0.5 text-body text-muted">
                    {locale === 'id' ? z.glossId : z.glossEn}
                  </p>
                </div>
              ))}
            </dl>
          </RailSection>

          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip split={built.split} locale={locale} />
          </RailSection>
        </>
      }
    >
      <Viewport
        locale={locale}
        built={built}
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
