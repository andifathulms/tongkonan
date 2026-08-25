'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { HouseScene } from './scene'
import type { CameraState, ViewKey } from './scene'
import type { House, Layout } from '@/lib/banua/types'
import type { SolarPosition } from '@/lib/solar/position'
import type { Timeline } from '@/lib/banua/assembly'

export interface ViewportProps {
  house: House
  layout: Layout
  sun: SolarPosition
  view: ViewKey
  figure: boolean
  rain: boolean
  reveal: { timeline: Timeline; t: number } | null
  explode?: number
  /** cut the house on the ridge plane to show the three occupancy zones */
  section?: boolean
  /** Overlaid on the viewport while a stage is active. */
  caption?: React.ReactNode
  children?: React.ReactNode
}

/** View transitions are punctuation, not ambience. 1100ms, then done. */
const TRANSITION_MS = 1100

export function Viewport({
  house,
  layout,
  sun,
  view,
  figure,
  rain,
  reveal,
  explode = 0,
  section = false,
  caption,
  children,
}: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<HouseScene | null>(null)
  const [scaleBar, setScaleBar] = useState<{ metres: number; pixels: number } | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  // Everything the render loop reads lives in a ref, so a prop change does not
  // tear down the scene and a re-render does not enter the loop.
  const state = useRef({
    figure,
    rain,
    reveal,
    explode,
    section,
    reducedMotion,
    transition: null as null | { from: CameraState; to: CameraState; startedAt: number },
  })
  state.current = { ...state.current, figure, rain, reveal, explode, section, reducedMotion }

  /* ── Set up once ──────────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current
    const host = hostRef.current
    if (!canvas || !host) return

    const scene = new HouseScene(canvas)
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
    sceneRef.current?.setHouse(house, layout)
  }, [house, layout])

  useEffect(() => {
    sceneRef.current?.setSun(sun, house)
  }, [sun, house])

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
  }, [view, house])

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
        aria-label="Model tongkonan"
      />
      {caption}
      {children}
      {scaleBar ? <ScaleBar {...scaleBar} /> : null}
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
    <div className="pointer-events-none absolute bottom-3 left-3 select-none">
      <div
        className="h-2 border-b border-l border-r border-bolu"
        style={{ width: `${pixels}px` }}
      />
      <div className="micro mt-1 text-bolu">
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
