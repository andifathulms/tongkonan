'use client'

import { useMemo } from 'react'
import { RailSection, Sheet } from './Sheet'
import { Viewport } from './viewport/Viewport'
import { ProvenanceStrip } from './Provenance'
import { useReaderState } from './useReaderState'
import { useTradition } from './useTradition'
import { ModelLoading } from './ModelLoading'
import type { ModelIntro } from './ModelLoading'
import { flag, readFlag, unless } from '@/lib/reader'
import { Choice, Toggle, fill } from './Controls'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { Tradition, TraditionKey } from '@/lib/tradition/registry'
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

/**
 * The route's shell: load this one house's facade, and until it arrives
 * show the intro the server rendered — whose house, its caution, and its
 * elevation. The intro is also the page's static HTML, so a reader without
 * JavaScript gets the words and the drawing rather than an empty sheet.
 */
export function BacaClient({
  locale,
  tradisi,
  intro,
}: {
  locale: Locale
  tradisi: TraditionKey
  intro: ModelIntro
}) {
  const t0 = useTradition(tradisi)
  if (!t0) return <ModelLoading locale={locale} intro={intro} />
  return <BacaInner locale={locale} t0={t0} />
}

function BacaInner({ locale, t0 }: { locale: Locale; t0: Tradition }) {
  /*
   * A specific house with a history, rather than a neutral default.
   *
   * Which one is the tradition's own choice: what a façade says depends on
   * what it has to say, and a house with no funerals held or no daughters
   * married would be a blank page on the route whose whole subject is what
   * can be read off a building.
   */
  /* The one thing a reader chooses here: façade, or cut open. */
  const [vantage, setVantage] = useReaderState(
    { section: false, site: true },
    (p) => ({
      section: readFlag(p.get('potongan'), false),
      site: readFlag(p.get('tapak'), true),
    }),
    (v) => [
      ['potongan', unless(v.section, false, flag)],
      ['tapak', unless(v.site, true, flag)],
    ],
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

          {/*
            What the house stands in. The marks are drawn on the ground in the
            viewport and carry no lettering — a font inside the model would be
            the first typography in it — so this is where they are named, with
            the provenance of the *arrangement* beside each. The distances are
            ordinary dimensions and are counted in the bar below like any
            other.
          */}
          {built.scene.site.length > 0 && (
            <RailSection title={pick(COPY.site.heading, locale)}>
              <p className="mb-3 text-body text-muted">{pick(COPY.site.intro, locale)}</p>
              {/*
                The switch belongs beside the legend rather than only on the
                route that generates. This is the façade reading, and a façade
                is read off the building — a granary standing in front of the
                one being described is a granary in the way.
              */}
              <div className="mb-3">
                <Toggle
                  checked={vantage.site}
                  onChange={(v) => setVantage({ site: v })}
                  label={pick(COPY.controls.site, locale)}
                  hint={
                    locale === 'id'
                      ? 'Matikan dan yang tersisa hanya bangunannya.'
                      : 'Turn it off and the building is all that is left.'
                  }
                />
              </div>
              <dl className="flex flex-col gap-3">
                {built.scene.site.map((mark) => (
                  <div key={mark.key}>
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-body leading-tight">
                        {locale === 'id' ? mark.nameId : mark.nameEn}
                      </dt>
                      <dd className="micro shrink-0">
                        {pick(COPY.provenance[mark.provenance], locale)}
                      </dd>
                    </div>
                    <p className="mt-0.5 text-body text-muted">
                      {locale === 'id' ? mark.glossId : mark.glossEn}
                    </p>
                  </div>
                ))}
              </dl>
            </RailSection>
          )}

          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip split={built.split} locale={locale} />
          </RailSection>
        </>
      }
    >
      <Viewport
        locale={locale}
        built={built}
        label={fill(pick(COPY.modelLabel, locale), { house: t0.house[locale] })}
        sun={sun}
        view={section ? 'potongan' : 'tampak'}
        figure
        site={vantage.site}
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
