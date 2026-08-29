'use client'

import { useEffect, useId, useRef, useState } from 'react'
import * as THREE from 'three'
import { HouseScene } from './scene'
import type { CameraState, ViewKey } from './scene'
import type { Built } from '@/lib/tradition/registry'
import type { SolarPosition } from '@/lib/solar/position'
import type { Kinds } from '@/lib/core/kinds'
import type { Timeline } from '@/lib/core/assembly'
import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'

export interface ViewportProps {
  locale: Locale
  /**
   * The house, its scene model and how to class its parts, all sealed by the
   * registry. The viewport never learns which tradition it is drawing beyond
   * the key it needs to generate the right materials.
   */
  built: Built
  sun: SolarPosition
  view: ViewKey
  figure: boolean
  rain: boolean
  reveal: { timeline: Timeline<Kinds>; t: number } | null
  explode?: number
  /** cut the house open to show the occupancy zones, on the axis the tradition names */
  section?: boolean
  /** mark each part by the provenance of the dimensions that produced it */
  provenance?: boolean
  /** Overlaid on the viewport while a stage is active. */
  caption?: React.ReactNode
  children?: React.ReactNode
}

/** View transitions are punctuation, not ambience. 1100ms, then done. */
const TRANSITION_MS = 1100

export function Viewport({
  locale,
  built,
  sun,
  view,
  figure,
  rain,
  reveal,
  explode = 0,
  section = false,
  provenance = false,
  caption,
  children,
}: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HouseScene | null>(null)
  const [scaleBar, setScaleBar] = useState<{ metres: number; pixels: number } | null>(null)
  /*
   * Where the site marks are on screen, so their names can be written beside
   * them. Without this the yard, the river bank and the rice barns are three
   * shapes on the ground that a reader has no way to identify — which is what
   * happened: the first version drew them and the answer was "where is it?".
   */
  const [siteLabels, setSiteLabels] = useState<
    readonly { key: string; left: number; top: number }[]
  >([])
  // The hint retires itself the moment the reader does the thing it names.
  const [touched, setTouched] = useState(false)
  // It is also the canvas's description, so the keys are available to someone
  // who cannot see it fade. It goes to opacity 0 rather than display:none for
  // exactly that reason.
  const hintId = useId()
  const reducedMotion = usePrefersReducedMotion()

  // Everything the render loop reads lives in a ref, so a prop change does not
  // tear down the scene and a re-render does not enter the loop.
  const state = useRef({
    figure,
    rain,
    reveal,
    explode,
    section,
    provenance,
    reducedMotion,
    transition: null as null | { from: CameraState; to: CameraState; startedAt: number },
  })
  state.current = {
    ...state.current,
    figure,
    rain,
    reveal,
    explode,
    section,
    provenance,
    reducedMotion,
  }

  /* ── Set up once ──────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const scene = new HouseScene(canvas, built.key)
    sceneRef.current = scene

    const observer = new ResizeObserver(() => {
      const rect = host.getBoundingClientRect()
      scene.resize(rect.width, rect.height)
      setScaleBar(measureScaleBar(scene, rect.height))
    })
    observer.observe(host)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const t = state.current.transition
      if (t) {
        const p = state.current.reducedMotion
          ? 1 // View changes cut instantly under reduced motion.
          : Math.min(1, (now - t.startedAt) / TRANSITION_MS)
        scene.setCamera(interpolate(t.from, t.to, easeInOutCubic(p)))
        if (p >= 1) state.current.transition = null
      }

      scene.apply(
        {
          figure: state.current.figure,
          rain: state.current.rain,
          reveal: state.current.reveal,
          explode: state.current.explode,
          section: state.current.section,
          provenance: state.current.provenance,
          reducedMotion: state.current.reducedMotion,
        },
        dt,
      )

      if (scene.dirty) {
        scene.render()
        const rect = host.getBoundingClientRect()
        const next = measureScaleBar(scene, rect.height)
        // Only re-render React when the bar would actually change; otherwise
        // a drag would push a state update on every frame.
        setScaleBar((prev) =>
          prev && prev.metres === next.metres && prev.pixels === next.pixels ? prev : next,
        )
        // Rounded to the nearest tenth of a percent before comparing, so a
        // drag updates React only when a caption would actually move.
        const labels = scene.siteLabels().map((l) => ({
          key: l.key,
          left: Math.round(l.left * 10) / 10,
          top: Math.round(l.top * 10) / 10,
        }))
        setSiteLabels((prev) =>
          prev.length === labels.length &&
          prev.every((p, i) => {
            const n = labels[i]
            return n && p.key === n.key && p.left === n.left && p.top === n.top
          })
            ? prev
            : labels,
        )
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  /* ── Feed the scene ───────────────────────────────────────────────── */
  useEffect(() => {
    sceneRef.current?.setHouse(built.house, built.scene, built.classOf)
  }, [built])

  useEffect(() => {
    sceneRef.current?.setSun(sun, built.house)
  }, [sun, built])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    state.current.transition = {
      from: {
        azimuth: scene.cam.azimuth,
        polar: scene.cam.polar,
        distance: scene.cam.distance,
        target: scene.cam.target.clone(),
      },
      to: scene.viewPreset(view),
      startedAt: performance.now(),
    }
  }, [view, built])

  /* ── Keyboard rotation ────────────────────────────────────────────── */
  /*
   * Rotation is drag-only by design, and a model that never idles gives a
   * mouse user the whole gesture and a keyboard user nothing. This is the
   * same functionality reached a different way — not a turntable and not idle
   * motion, which stay banned.
   *
   * The step is a fixed number of pixels of equivalent drag, so a key press
   * moves the camera exactly as far as the same drag would.
   */
  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const scene = sceneRef.current
    if (!scene) return
    const step = e.shiftKey ? 60 : 20
    switch (e.key) {
      case 'ArrowLeft':
        scene.orbit(-step, 0)
        break
      case 'ArrowRight':
        scene.orbit(step, 0)
        break
      case 'ArrowUp':
        scene.orbit(0, -step)
        break
      case 'ArrowDown':
        scene.orbit(0, step)
        break
      case '+':
      case '=':
        scene.dolly(1 / 1.12)
        break
      case '-':
      case '_':
        scene.dolly(1.12)
        break
      case 'Home':
        // Back to the preset the view switch is showing, so there is always a
        // way out of an orientation the reader cannot undo by eye.
        scene.setCamera(scene.viewPreset(view))
        break
      default:
        return
    }
    // Only now: an unhandled key keeps its default, so Tab still leaves.
    e.preventDefault()
    setTouched(true)
  }

  /* ── Drag-only rotation ───────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let dragging = false
    let lastX = 0
    let lastY = 0
    let pinch = 0

    const down = (e: PointerEvent) => {
      dragging = true
      setTouched(true)
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      // Rotation is something the reader does. Interrupting a scripted view
      // change is part of that, so the drag wins.
      state.current.transition = null
    }
    const move = (e: PointerEvent) => {
      if (!dragging) return
      sceneRef.current?.orbit(e.clientX - lastX, e.clientY - lastY)
      lastX = e.clientX
      lastY = e.clientY
    }
    const up = (e: PointerEvent) => {
      dragging = false
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId)
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      setTouched(true)
      sceneRef.current?.dolly(e.deltaY > 0 ? 1.08 : 1 / 1.08)
    }
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return
      const [a, b] = [e.touches[0], e.touches[1]]
      if (!a || !b) return
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      if (pinch > 0) sceneRef.current?.dolly(pinch / d)
      pinch = d
    }
    const touchEnd = () => {
      pinch = 0
    }

    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('wheel', wheel, { passive: false })
    canvas.addEventListener('touchmove', touchMove, { passive: true })
    canvas.addEventListener('touchend', touchEnd)
    return () => {
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('wheel', wheel)
      canvas.removeEventListener('touchmove', touchMove)
      canvas.removeEventListener('touchend', touchEnd)
    }
  }, [])

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="block h-full w-full touch-none"
        role="img"
        tabIndex={0}
        aria-label={pick(COPY.modelLabel, locale)}
        aria-describedby={hintId}
        onKeyDown={onKeyDown}
      />
      {caption}
      {children}
      {/*
        The names of what is on the ground, in the interface's type over the
        canvas. They are captions on a drawing, not lettering in the model, and
        they carry the provenance of the arrangement the way every other figure
        on this site does.
      */}
      {siteLabels.map((label) => {
        const mark = built.scene.site.find((m) => m.key === label.key)
        if (!mark) return null
        return (
          <p
            key={label.key}
            className="micro pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-on-model"
            style={{ left: `${label.left}%`, top: `${label.top}%` }}
          >
            {locale === 'id' ? mark.nameId : mark.nameEn}
          </p>
        )
      })}
      {scaleBar ? <ScaleBar {...scaleBar} /> : null}
      {/*
        Rotation is drag-only and deliberately never idles, so nothing about a
        still model says it can be turned. Saying so is the only affordance
        left, and it goes away as soon as it has been used.
      */}
      <p
        id={hintId}
        className={[
          'micro pointer-events-none absolute bottom-masthead-clear right-3 select-none text-right transition-opacity duration-layout sheet:bottom-3',
          touched ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        {pick(COPY.hint, locale)}
      </p>
    </div>
  )
}

/**
 * A scale bar, bottom-left of the viewport at all times.
 *
 * It reads the camera rather than being drawn to a fixed size, so it stays
 * true after the reader has dragged and zoomed.
 */
function ScaleBar({ metres, pixels }: { metres: number; pixels: number }) {
  return (
    // Lifted clear of the masthead band on a narrow screen, by the height the
    // band reserves rather than by a number guessed here. That band only
    // exists under 860px, so above it the bar sits back on the bottom edge.
    <div className="pointer-events-none absolute bottom-masthead-clear left-3 select-none sheet:bottom-3">
      <div
        className="h-2 border-b border-l border-r border-on-model"
        style={{ width: `${pixels}px` }}
      />
      <div className="micro mt-1 text-on-model">
        {metres} m
      </div>
    </div>
  )
}

function measureScaleBar(scene: HouseScene, height: number): { metres: number; pixels: number } {
  const mpp = scene.metresPerPixel(height)
  // Pick a round number of metres that lands near 110 px.
  const target = mpp * 110
  const steps = [0.5, 1, 2, 5, 10, 20, 50]
  const metres = steps.reduce((best, s) =>
    Math.abs(s - target) < Math.abs(best - target) ? s : best,
  )
  return { metres, pixels: Math.round(metres / mpp) }
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

function interpolate(from: CameraState, to: CameraState, t: number): CameraState {
  // Take the short way round, so a transition never swings the long way.
  let delta = to.azimuth - from.azimuth
  while (delta > Math.PI) delta -= Math.PI * 2
  while (delta < -Math.PI) delta += Math.PI * 2
  return {
    azimuth: from.azimuth + delta * t,
    polar: from.polar + (to.polar - from.polar) * t,
    distance: from.distance + (to.distance - from.distance) * t,
    target: new THREE.Vector3().lerpVectors(from.target, to.target, t),
  }
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}
