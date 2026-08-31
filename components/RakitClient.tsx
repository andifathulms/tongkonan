'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RailSection, Sheet } from './Sheet'
import { fill } from './Controls'
import { Viewport, usePrefersReducedMotion } from './viewport/Viewport'
import { ProvenanceStrip } from './Provenance'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { SEQUENCE_SECONDS } from '@/lib/core/assembly'
import type { StageView, Tradition, TraditionKey } from '@/lib/tradition/registry'
import { datePresets, presetInstant } from '@/lib/solar/presets'
import { solarPosition } from '@/lib/solar/position'
import { useReaderState } from './useReaderState'
import { useTradition } from './useTradition'
import { ModelLoading } from './ModelLoading'
import type { ModelIntro } from './ModelLoading'
import { readInt, unless } from '@/lib/reader'

const RAKIT_DEFAULTS = { stage: '', explode: 0 }
type RakitVantage = typeof RAKIT_DEFAULTS

/**
 * The stage is validated against the tradition on screen, not against a
 * union. Two houses have two sets of stage names and neither one's are the
 * other's, so a `?tahap=ijuk` arriving at the wrong house has to fall back to
 * no stage rather than to a name that happens to be shared.
 */
function decodeRakit(stages: readonly string[]) {
  return (p: ReadonlyMap<string, string>): RakitVantage => {
    const raw = p.get('tahap') ?? ''
    return {
      stage: stages.includes(raw) ? raw : '',
      explode: readInt(p.get('urai'), 0, 100, 0) / 100,
    }
  }
}

function encodeRakit(v: RakitVantage): readonly (readonly [string, string | null])[] {
  return [
    ['tahap', v.stage === '' ? null : v.stage],
    ['urai', unless(Math.round(v.explode * 100), 0, String)],
  ]
}

/**
 * The frame-raising sequence — the one orchestrated moment in this app.
 *
 * Parts arrive in the order a crew would work in, which is why the timeline
 * is generated data rather than an animation curve someone drew. Nothing else
 * on this screen may compete with it.
 */
/**
 * The route's shell: load this one house's facade, and until it arrives
 * show the intro the server rendered — whose house, its caution, and its
 * elevation. The intro is also the page's static HTML, so a reader without
 * JavaScript gets the words and the drawing rather than an empty sheet.
 */
export function RakitClient({
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
  return <RakitInner locale={locale} t0={t0} />
}

function RakitInner({ locale, t0 }: { locale: Locale; t0: Tradition }) {
  const reducedMotion = usePrefersReducedMotion()
  const built = useMemo(() => t0.build(t0.defaultQuery), [t0])
  const { house, timeline } = built
  const stageInfo = useMemo(() => stageLookup(t0), [t0])

  const [t, setT] = useState(1)
  const [playing, setPlaying] = useState(false)

  /*
    The stage, not the clock.
    
    `t` moves sixty times a second during playback and writing it would churn
    the address for no one's benefit. What is worth sharing is where in the
    sequence you stopped, which is a stage — a discrete thing with a name — so
    that is what travels. Playing is deliberately not carried: a link that
    starts animating at someone is a link nobody wants twice.
  */
  const decode = useMemo(() => decodeRakit(t0.stageOrder), [t0])
  const [vantage, setVantage, settled] = useReaderState(RAKIT_DEFAULTS, decode, encodeRakit)
  const explode = vantage.explode
  const setExplode = (v: number) => setVantage({ explode: v })

  // Arriving at a stage means standing at the end of it, which is what
  // clicking that stage in the list does. Once only: after this the reader is
  // driving and the address follows them rather than the other way round.
  const arrived = useRef(false)
  useEffect(() => {
    if (!settled || arrived.current) return
    arrived.current = true
    if (vantage.stage === '') return
    const span = timeline.stages.find((sp) => sp.stage === vantage.stage)
    if (span) setT(span.end)
  }, [settled, vantage.stage, timeline])

  const sun = useMemo(() => {
    const preset = datePresets()[0]
    if (!preset) throw new Error('no date presets')
    return solarPosition(presetInstant(preset, 9 * 60))
  }, [])

  // The clock. Under reduced motion the sequence still runs — it steps stage
  // by stage instead of sweeping, because the sequence is content and is
  // de-animated rather than deleted.
  const raf = useRef(0)
  useEffect(() => {
    if (!playing) return
    if (reducedMotion) {
      const stages = timeline.stages
      const step = () => {
        setT((prev) => {
          const next = stages.find((s) => s.end > prev + 1e-4)
          if (!next) {
            setPlaying(false)
            return 1
          }
          return next.end
        })
      }
      const id = window.setInterval(step, 1200)
      return () => window.clearInterval(id)
    }
    let last = performance.now()
    const frame = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setT((prev) => {
        const next = prev + dt / SEQUENCE_SECONDS
        if (next >= 1) {
          setPlaying(false)
          return 1
        }
        return next
      })
      raf.current = requestAnimationFrame(frame)
    }
    raf.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, reducedMotion, timeline])

  const activeStage = timeline.stages.find((s) => t >= s.start && t < s.end) ?? null
  /*
   * Counted rather than declared, because the joinery is not the same in the
   * two houses: one seats a post foot in the dish of a pad stone and calls
   * that a tumpu, the other calls it a sandi. A fixed tally would have shown
   * three names to a house that uses two of them and none of its third.
   */
  const jointRows = useMemo(() => {
    const counts = new Map<string, number>()
    for (const j of house.joints) counts.set(j.kind, (counts.get(j.kind) ?? 0) + 1)
    return t0.joints.map((j) => ({ ...j, count: counts.get(j.kind) ?? 0 }))
  }, [house, t0])

  const replay = () => {
    setT(0)
    setPlaying(true)
  }

  return (
    <Sheet
      locale={locale}
      route="rakit"
      tradition={t0}
      rail={
        <>
          <RailSection title={pick(COPY.assembly.heading, locale)}>
            <button
              type="button"
              onClick={() => (t >= 1 ? replay() : setPlaying(!playing))}
              className="press mb-3 w-full rounded bg-bolu px-2 py-2 text-body text-kapur transition-opacity duration-state hover:opacity-90"
            >
              {t >= 1
                ? pick(COPY.assembly.replay, locale)
                : playing
                  ? pick(COPY.assembly.pause, locale)
                  : pick(COPY.assembly.play, locale)}
            </button>
            <label className="sr-only" htmlFor="urutan">
              {pick(COPY.assembly.heading, locale)}
            </label>
            <input
              id="urutan"
              type="range"
              min={0}
              max={1000}
              value={Math.round(t * 1000)}
              onChange={(e) => {
                const next = Number(e.target.value) / 1000
                setPlaying(false)
                setT(next)
                // The stage the scrubber has landed in, so a link made from a
                // hand-dragged position still opens somewhere nameable.
                const span = timeline.stages.find((sp) => next <= sp.end)
                setVantage({ stage: span ? span.stage : '' })
              }}
              /*
                The scrubber runs 0–1000 and announced "500", which names
                nothing. The stage it is standing in is what the control is
                for, so that is what it says.
              */
              aria-valuetext={fill(pick(COPY.assembly.stageValue, locale), {
                stage: activeStage
                  ? stageInfo(activeStage.stage).title
                  : pick(COPY.assembly.complete, locale),
                pct: String(Math.round(t * 100)),
              })}
              className="h-control w-full accent-bolu"
            />

            <ol className="mt-4 flex flex-col gap-px">
              {timeline.stages.map((span) => {
                const info = stageInfo(span.stage)
                const done = t >= span.end
                const active = activeStage?.stage === span.stage
                return (
                  <li key={span.stage}>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaying(false)
                        setT(span.end)
                        setVantage({ stage: span.stage })
                      }}
                      aria-current={active ? 'step' : undefined}
                      className={[
                        'press w-full rounded px-2 py-1.5 text-left transition-colors duration-state',
                        active
                          ? 'bg-bolu text-kapur'
                          : 'hover:bg-wash',
                      ].join(' ')}
                    >
                      <span className="flex items-baseline justify-between gap-2">
                        <span
                          className={[
                            'text-body leading-tight',
                            !active && !done ? 'text-muted' : '',
                          ].join(' ')}
                        >
                          {info.title}
                        </span>
                        <span className="num text-meta opacity-70">{span.partIds.length}</span>
                      </span>
                      {/*
                        How far through this stage the sequence stands, drawn
                        only on the row that is running. It follows the same
                        clock the viewport follows, so the rail and the model
                        agree about where the crew is.
                      */}
                      {active ? (
                        <span
                          className="mt-1.5 block h-0.5 rounded-none bg-kapur"
                          style={{
                            width: `${Math.round(
                              (Math.min(1, Math.max(0, (t - span.start) / (span.end - span.start))) *
                                1000) /
                                10,
                            )}%`,
                          }}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ol>

            {reducedMotion ? (
              <p className="mt-3 text-body text-muted">
                {pick(COPY.assembly.reducedMotion, locale)}
              </p>
            ) : null}
          </RailSection>

          <RailSection title={pick(COPY.joints.heading, locale)}>
            <p className="mb-3 text-body">
              {pick(COPY.assembly.noNails, locale)}
            </p>
            <dl className="flex flex-col gap-3">
              {jointRows.map((j) => (
                <JointRow
                  key={j.kind}
                  name={j.name[locale]}
                  gloss={j.gloss[locale]}
                  count={j.count}
                />
              ))}
            </dl>

            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <label className="micro" htmlFor="urai">
                  {pick(COPY.joints.explode, locale)}
                </label>
                <span className="num text-meta">{Math.round(explode * 100)}%</span>
              </div>
              <input
                id="urai"
                type="range"
                min={0}
                max={100}
                value={Math.round(explode * 100)}
                onChange={(e) => setExplode(Number(e.target.value) / 100)}
                aria-valuetext={fill(pick(COPY.joints.explodeValue, locale), {
                  pct: String(Math.round(explode * 100)),
                })}
                className="h-control w-full accent-bolu"
              />
              <p className="mt-2 text-body text-muted">
                {pick(COPY.joints.explodeGloss, locale)}
              </p>
            </div>
          </RailSection>

          <RailSection title={pick(COPY.provenance.heading, locale)}>
            <ProvenanceStrip split={built.split} locale={locale} compact />
          </RailSection>
        </>
      }
    >
      <Viewport
        locale={locale}
        built={built}
        label={fill(pick(COPY.modelLabel, locale), { house: t0.house[locale] })}
        sun={sun}
        view="perspektif"
        figure
        rain={false}
        explode={explode}
        reveal={t >= 1 ? null : { timeline, t }}
        caption={<StageCaption info={activeStage ? stageInfo(activeStage.stage) : null} locale={locale} />}
      />
    </Sheet>
  )
}

/**
 * The stage name and its gloss, over the viewport while that stage is active.
 * It is a caption on the act being performed, not a progress indicator.
 */
function StageCaption({ info, locale }: { info: StageView | null; locale: Locale }) {
  if (!info) return null
  return (
    // Clear of the masthead band under 860px, by the height that band reserves.
    // Same collision the scale bar had, and missed here at the time. The outer
    // div carries the margins and the inner one the cap, so the caption is
    // centred and never wider than the viewport leaves room for.
    <div className="pointer-events-none absolute inset-x-12 bottom-masthead-clear z-10 flex justify-center sheet:bottom-3">
      <div className="w-full max-w-caption rounded border border-hairline bg-veil px-3 py-2.5 backdrop-blur-veil">
        <p className="micro">{info.title}</p>
        <p className="mt-1 text-body">{info.gloss[locale]}</p>
      </div>
    </div>
  )
}

/** Stage names come from the tradition, so a lookup rather than an import. */
function stageLookup(t: Tradition): (stage: string) => StageView {
  const byKey = new Map(t.stages.map((s) => [s.stage, s]))
  return (stage) =>
    byKey.get(stage) ?? { stage, title: stage, gloss: { id: '', en: '' } }
}

function JointRow({ name, gloss, count }: { name: string; gloss: string; count: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <dt className="text-body leading-tight">{name}</dt>
        <dd className="num text-meta">{count}</dd>
      </div>
      <p className="mt-0.5 text-body text-muted">{gloss}</p>
    </div>
  )
}
