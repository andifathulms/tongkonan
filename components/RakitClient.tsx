'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RailSection, Sheet } from './Sheet'
import { fill } from './Controls'
import { Viewport, usePrefersReducedMotion } from './viewport/Viewport'
import { ProvenanceStrip } from './Provenance'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { SEQUENCE_SECONDS, buildHouse, buildTimeline } from '@/lib/banua/assembly'
import { DEFAULT_RULES, stageInfo } from '@/lib/banua/rules'
import type { Stage } from '@/lib/banua/types'
import { datePresets, presetInstant } from '@/lib/solar/presets'
import { solarPosition } from '@/lib/solar/position'

/**
 * The frame-raising sequence — the one orchestrated moment in this app.
 *
 * Parts arrive in the order a crew would work in, which is why the timeline
 * is generated data rather than an animation curve someone drew. Nothing else
 * on this screen may compete with it.
 */
export function RakitClient({ locale }: { locale: Locale }) {
  const reducedMotion = usePrefersReducedMotion()
  const { house, layout } = useMemo(() => buildHouse(DEFAULT_RULES), [])
  const timeline = useMemo(() => buildTimeline(house), [house])

  const [t, setT] = useState(1)
  const [playing, setPlaying] = useState(false)
  const [explode, setExplode] = useState(0)

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
  const jointCounts = useMemo(() => {
    const counts = { pasak: 0, takik: 0, tumpu: 0 }
    for (const j of house.joints) counts[j.kind] += 1
    return counts
  }, [house])

  const replay = () => {
    setT(0)
    setPlaying(true)
  }

  return (
    <Sheet
      locale={locale}
      route="rakit"
      rail={
        <>
          <RailSection title={pick(COPY.assembly.heading, locale)}>
            <div className="mb-3 flex gap-px">
              <button
                type="button"
                onClick={() => (t >= 1 ? replay() : setPlaying(!playing))}
                className="flex-1 rounded bg-bolu px-2 py-2 text-body text-kapur transition-opacity duration-state hover:opacity-90"
              >
                {t >= 1
                  ? pick(COPY.assembly.replay, locale)
                  : playing
                    ? pick(COPY.assembly.pause, locale)
                    : pick(COPY.assembly.play, locale)}
              </button>
            </div>
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
                setPlaying(false)
                setT(Number(e.target.value) / 1000)
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
                      }}
                      aria-current={active ? 'step' : undefined}
                      className={[
                        'w-full rounded px-2 py-1.5 text-left transition-colors duration-state',
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
              <JointRow
                name={pick(COPY.joints.pasak, locale)}
                gloss={pick(COPY.joints.pasakGloss, locale)}
                count={jointCounts.pasak}
              />
              <JointRow
                name={pick(COPY.joints.takik, locale)}
                gloss={pick(COPY.joints.takikGloss, locale)}
                count={jointCounts.takik}
              />
              <JointRow
                name={pick(COPY.joints.tumpu, locale)}
                gloss={pick(COPY.joints.tumpuGloss, locale)}
                count={jointCounts.tumpu}
              />
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
            <ProvenanceStrip dims={layout.dims} locale={locale} compact />
          </RailSection>
        </>
      }
    >
      <Viewport
        locale={locale}
        house={house}
        layout={layout}
        sun={sun}
        view="perspektif"
        figure
        rain={false}
        explode={explode}
        reveal={t >= 1 ? null : { timeline, t }}
        caption={<StageCaption stage={activeStage?.stage ?? null} locale={locale} />}
      />
    </Sheet>
  )
}

/**
 * The stage name and its gloss, over the viewport while that stage is active.
 * It is a caption on the act being performed, not a progress indicator.
 */
function StageCaption({ stage, locale }: { stage: Stage | null; locale: Locale }) {
  if (!stage) return null
  const info = stageInfo(stage)
  return (
    // Clear of the masthead band under 860px, by the height that band reserves.
    // Same collision the scale bar had, and missed here at the time.
    <div className="pointer-events-none absolute bottom-[calc(var(--masthead-h)+0.75rem)] left-1/2 z-10 w-[min(30rem,calc(100%-6rem))] -translate-x-1/2 rounded border border-hairline bg-veil px-3 py-2.5 backdrop-blur-[2px] sheet:bottom-3">
      <p className="micro">{info.title}</p>
      <p className="mt-1 text-body">
        {locale === 'id' ? info.glossId : info.glossEn}
      </p>
    </div>
  )
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
