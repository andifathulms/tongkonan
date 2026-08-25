'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet } from './Sheet'
import { Viewport, usePrefersReducedMotion } from './viewport/Viewport'
import type { ViewKey } from './viewport/scene'
import {
  OrientationNote,
  RuleControls,
  SceneToggles,
  SunControls,
  ViewSwitch,
} from './Controls'
import { ProvenanceStrip } from './Provenance'
import { DrawingExport } from './DrawingExport'
import { RailSection } from './Sheet'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { buildHouse, buildTimeline } from '@/lib/banua/assembly'
import { DEFAULT_RULES, rankInfo } from '@/lib/banua/rules'
import type { Rules } from '@/lib/banua/types'
import { datePresets, presetInstant } from '@/lib/solar/presets'
import type { DatePreset } from '@/lib/solar/presets'
import { solarPosition } from '@/lib/solar/position'

/**
 * The generator.
 *
 * Change a socially meaningful number and the house rebuilds in place. That
 * is the thesis of the whole project, so it is the landing route and it is
 * the only screen where all three rules are on the page at once.
 */
export function BangunClient({ locale }: { locale: Locale }) {
  const [rules, setRules] = useState<Rules>(DEFAULT_RULES)
  const [view, setView] = useState<ViewKey>('perspektif')
  const [figure, setFigure] = useState(true) // on by default: it is the scale bar
  const [rain, setRain] = useState(false)
  const [presetKey, setPresetKey] = useState<DatePreset['key']>('kulminasi')
  // Mid-morning by default: raking enough to read the form, and a short drag
  // of the time control to noon shows the shadow all but disappear.
  const [minutes, setMinutes] = useState(9 * 60)

  const presets = useMemo(() => datePresets(), [])
  const { house, layout } = useMemo(() => buildHouse(rules), [rules])
  const timeline = useMemo(() => buildTimeline(house), [house])
  const rebuild = useRebuildTransition(rules, usePrefersReducedMotion())

  const sun = useMemo(() => {
    const preset = presets.find((p) => p.key === presetKey) ?? presets[0]
    if (!preset) throw new Error('no date presets')
    return solarPosition(presetInstant(preset, minutes))
  }, [presets, presetKey, minutes])

  const rank = rankInfo(rules.rank)

  return (
    <Sheet
      locale={locale}
      route="bangun"
      rail={
        <>
          <RuleControls rules={rules} onChange={setRules} locale={locale} />
          <SunControls
            presets={presets}
            presetKey={presetKey}
            minutes={minutes}
            onPreset={setPresetKey}
            onMinutes={setMinutes}
            altitude={sun.altitude}
            locale={locale}
          />
          <SceneToggles
            figure={figure}
            rain={rain}
            onFigure={setFigure}
            onRain={setRain}
            locale={locale}
          />
          <OrientationNote locale={locale} />
          <DrawingExport house={house} layout={layout} locale={locale} />
          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip dims={layout.dims} locale={locale} />
          </RailSection>
        </>
      }
    >
      <Viewport
        house={house}
        layout={layout}
        sun={sun}
        view={view}
        figure={figure}
        rain={rain}
        reveal={rebuild < 1 ? { timeline, t: rebuild } : null}
      >
        <ViewSwitch view={view} onChange={setView} locale={locale} />
        <Readout locale={locale} rules={rules} rankName={rank.name} layout={layout} />
      </Viewport>
    </Sheet>
  )
}

/**
 * The house rebuilding in place when a rule changes.
 *
 * Short — a fifth of the frame-raising — because it is punctuation on the
 * reader's own action, not the orchestrated moment. It exists so that
 * changing a socially meaningful number reads as the building answering,
 * rather than as one picture being swapped for another.
 *
 * It runs the same build-order timeline the assembly sequence uses, so the
 * house always reassembles in the order it would actually be built.
 */
const REBUILD_MS = 850

function useRebuildTransition(rules: Rules, reducedMotion: boolean): number {
  const [t, setT] = useState(1)
  const signature = `${rules.rank}|${rules.bays}|${rules.horns}`
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (reducedMotion) {
      // The alternative is the finished house, immediately. Nothing is lost:
      // the house is the content, and the drop was only ever punctuation.
      setT(1)
      return
    }
    let raf = 0
    const start = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / REBUILD_MS)
      setT(p)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    setT(0)
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [signature, reducedMotion])

  return t
}

/**
 * The computed dimensions, over the viewport.
 *
 * Numbers are mono, right-aligned, and carry their unit. These are outputs of
 * the rule pack, not inputs: there is nothing here to drag.
 */
function Readout({
  locale,
  rules,
  rankName,
  layout,
}: {
  locale: Locale
  rules: Rules
  rankName: string
  layout: ReturnType<typeof buildHouse>['layout']
}) {
  const rows: [string, string][] = [
    [locale === 'id' ? 'Panjang badan' : 'Body length', `${layout.bodyLength.toFixed(2)} m`],
    [locale === 'id' ? 'Lebar badan' : 'Body width', `${layout.bodyWidth.toFixed(2)} m`],
    [locale === 'id' ? 'Tinggi kolong' : 'Underfloor height', `${layout.kolongHeight.toFixed(2)} m`],
    [
      locale === 'id' ? 'Puncak haluan depan' : 'Front prow tip',
      `${layout.frontProwY.toFixed(2)} m`,
    ],
    [locale === 'id' ? 'Julur atap' : 'Eave oversail', `${layout.eaveOversail.toFixed(2)} m`],
    [locale === 'id' ? 'Lapis ijuk' : 'Ijuk courses', String(layout.ijukCourses)],
  ]

  return (
    // Below the view switch on a narrow screen, beside it on a wide one:
    // at 390px the two would otherwise sit on top of each other.
    <div className="pointer-events-none absolute left-3 top-14 z-10 max-w-[15rem] rounded border border-[color:var(--hairline)] bg-[rgba(216,215,205,0.88)] px-3 py-2.5 backdrop-blur-[2px] sheet:top-3">
      <p className="text-[13px] font-medium leading-tight">{rankName}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--muted)]">
        {layout.bayNames.join(' · ')} — {rules.horns}{' '}
        {pick(COPY.controls.horns, locale).toLowerCase()}
      </p>
      <hr className="rule my-2" />
      <dl className="flex flex-col gap-0.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3">
            <dt className="text-[11px] leading-snug text-[color:var(--muted)]">{label}</dt>
            <dd className="num text-[12px]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
