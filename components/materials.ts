'use client'

/**
 * Every material is generated onto a canvas at runtime.
 *
 * Nothing is downloaded and nothing is a photograph of someone else's house.
 * That is partly the zero-network rule and partly the register: grain has to
 * rescale when the house does, and bamboo node spacing is a property of the
 * pole rather than of an image someone cropped.
 *
 * Colour comes from the four pa'ssura pigments and the interface neutrals.
 * There is no fifth pigment: timber, bamboo and stone are mixes of the set,
 * not new hues introduced because they looked more convincing.
 */

import * as THREE from 'three'
import type { MaterialKey } from '@/lib/tradition/toraja/types'

/** One texture tile covers one square metre of surface. */
export const TEXTURE_METRES = 1

const BOLU = '#17150F'
const RARA = '#8E3B25'
const RIRI = '#C8912B'
const KAPUR = '#E9E3D2'
const GROUND = '#C3BDA9'

/* ── Colour ───────────────────────────────────────────────────────────── */

function parse(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t)
  return `rgb(${c(ar, br)},${c(ag, bg)},${c(ab, bb)})`
}

/**
 * A small deterministic generator.
 *
 * Not `Math.random`: two viewers looking at the same house should see the
 * same grain, and a texture that changes on reload would make the model feel
 * like a screensaver in a different way than a turntable does.
 */
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function canvas(size: number): { ctx: CanvasRenderingContext2D; el: HTMLCanvasElement } {
  const el = document.createElement('canvas')
  el.width = size
  el.height = size
  const ctx = el.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  return { ctx, el }
}

function toTexture(el: HTMLCanvasElement, anisotropy: number): THREE.Texture {
  const tex = new THREE.CanvasTexture(el)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = anisotropy
  return tex
}

/* ── The six surfaces ─────────────────────────────────────────────────── */

/** Wavy grain lines in two tones, with light noise. */
function timberCanvas(seed: number, pale: number, straight: number): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(seed)
  const light = mix(mix(BOLU, RARA, 0.62), KAPUR, 0.34 + pale * 0.22)
  const dark = mix(mix(BOLU, RARA, 0.5), KAPUR, 0.16 + pale * 0.16)
  ctx.fillStyle = light
  ctx.fillRect(0, 0, S, S)

  // Grain runs along U, which is the length of the member.
  const lines = 78
  for (let i = 0; i < lines; i++) {
    const y0 = (i / lines) * S + r() * 4
    const amp = (1 - straight) * (2 + r() * 7)
    const freq = 0.6 + r() * 1.6
    const phase = r() * Math.PI * 2
    ctx.strokeStyle = mix(dark, light, 0.15 + r() * 0.55)
    ctx.lineWidth = 0.5 + r() * 1.7
    ctx.beginPath()
    for (let x = 0; x <= S; x += 6) {
      const y = y0 + Math.sin((x / S) * Math.PI * 2 * freq + phase) * amp
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // Light noise, so the grain does not read as a printed pattern.
  const img = ctx.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (r() - 0.5) * 16
    img.data[i] = clampByte((img.data[i] ?? 0) + n)
    img.data[i + 1] = clampByte((img.data[i + 1] ?? 0) + n)
    img.data[i + 2] = clampByte((img.data[i + 2] ?? 0) + n)
  }
  ctx.putImageData(img, 0, 0)
  return el
}

/** Vertical fibres with node rings at a fixed pitch — a property of the pole. */
function bambooCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(7717)
  const base = mix(RIRI, KAPUR, 0.55)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)

  for (let i = 0; i < 260; i++) {
    const x = r() * S
    ctx.strokeStyle = mix(base, mix(BOLU, RIRI, 0.5), 0.08 + r() * 0.3)
    ctx.lineWidth = 0.5 + r() * 1.2
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x + (r() - 0.5) * 4, S)
    ctx.stroke()
  }

  // Nodes every third of a metre. The pitch does not change when the house
  // does, because a bamboo pole's nodes are not a function of the building.
  const pitch = S / 3
  for (let y = pitch * 0.5; y < S; y += pitch) {
    ctx.strokeStyle = mix(base, BOLU, 0.42)
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(S, y)
    ctx.stroke()
    ctx.strokeStyle = mix(base, KAPUR, 0.6)
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, y - 3.5)
    ctx.lineTo(S, y - 3.5)
    ctx.stroke()
  }
  return el
}

/**
 * Sugar-palm fibre: short near-vertical strokes on near-black.
 *
 * The strokes run along V, which is the direction of fall on the slope, so
 * the fibre direction follows the course rather than the beam.
 */
function ijukCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20313)
  ctx.fillStyle = mix(BOLU, RARA, 0.1)
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 1400; i++) {
    const x = r() * S
    const y = r() * S
    const len = 8 + r() * 26
    const lean = (r() - 0.5) * 7
    ctx.strokeStyle = mix(mix(BOLU, RARA, 0.14), KAPUR, r() * 0.26)
    ctx.lineWidth = 0.6 + r() * 1.3
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + lean, y + len)
    ctx.stroke()
  }
  return el
}

/**
 * A carved panel, constructed rather than traced.
 *
 * Bands in the four pigments, and pa'barre allo drawn as a circle divided
 * into eight rays. The motif is a construction rule, so whatever draws it has
 * to draw it — storing a picture of one throws the rule away.
 *
 * Placeholder status is deliberate and stated in DESIGN.md: the target is
 * extruded geometry from these same rules, so the relief casts real shadow.
 * Only the plainly geometric pa'ssura is drawn here; motifs whose use is
 * restricted are not rendered at all.
 */
function carvedCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  ctx.fillStyle = BOLU
  ctx.fillRect(0, 0, S, S)

  const bands = [KAPUR, RARA, RIRI, BOLU]
  const h = S / 8
  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = bands[i % bands.length] ?? BOLU
    ctx.fillRect(0, i * h, S, h * 0.16)
  }

  // Pa'barre allo: a circle divided into eight rays. Drawn from the rule.
  const cx = S / 2
  const cy = S / 2
  const R = S * 0.3
  ctx.fillStyle = BOLU
  ctx.beginPath()
  ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = KAPUR
  ctx.lineWidth = S * 0.012
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    ctx.strokeStyle = i % 2 === 0 ? KAPUR : RARA
    ctx.lineWidth = S * 0.02
    ctx.beginPath()
    ctx.moveTo(cx + Math.cos(a) * R * 0.24, cy + Math.sin(a) * R * 0.24)
    ctx.lineTo(cx + Math.cos(a) * R * 0.94, cy + Math.sin(a) * R * 0.94)
    ctx.stroke()
  }
  ctx.fillStyle = RIRI // the rosette centre
  ctx.beginPath()
  ctx.arc(cx, cy, R * 0.2, 0, Math.PI * 2)
  ctx.fill()
  return el
}

/** River stone: mottled, cool against the timber. */
function stoneCanvas(): HTMLCanvasElement {
  const S = 256
  const { ctx, el } = canvas(S)
  const r = rng(5501)
  const base = mix(GROUND, BOLU, 0.46)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  // Fine grain, not blotches: a river stone is close to even in tone, and
  // high-contrast mottling reads as an animal hide rather than as rock.
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.04 + r() * 0.09)
    ctx.beginPath()
    ctx.arc(r() * S, r() * S, 0.6 + r() * 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  return el
}

const clampByte = (v: number) => Math.min(255, Math.max(0, v))

/* ── The material set ─────────────────────────────────────────────────── */

export type MaterialSet = Record<MaterialKey, THREE.Material> & {
  dispose(): void
}

export function createMaterials(anisotropy: number): MaterialSet {
  const textures: THREE.Texture[] = []
  const tex = (el: HTMLCanvasElement) => {
    const t = toTexture(el, anisotropy)
    textures.push(t)
    return t
  }

  const kayu = new THREE.MeshStandardMaterial({
    map: tex(timberCanvas(101, 0, 0)),
    roughness: 0.82,
    metalness: 0,
  })
  const papan = new THREE.MeshStandardMaterial({
    map: tex(timberCanvas(202, 1, 0.75)),
    roughness: 0.86,
    metalness: 0,
  })
  const bambu = new THREE.MeshStandardMaterial({
    map: tex(bambooCanvas()),
    roughness: 0.68,
    metalness: 0,
  })
  const ijuk = new THREE.MeshStandardMaterial({
    map: tex(ijukCanvas()),
    roughness: 0.97,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  const ukiran = new THREE.MeshStandardMaterial({
    map: tex(carvedCanvas()),
    roughness: 0.7,
    metalness: 0,
  })
  const batu = new THREE.MeshStandardMaterial({
    map: tex(stoneCanvas()),
    roughness: 0.9,
    metalness: 0,
  })
  // Horn is waxy rather than matte, so it gets a clearcoat. This is the one
  // material where the physical response is the recognisable thing about it.
  const tanduk = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(mix(BOLU, KAPUR, 0.2)),
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.5,
    clearcoatRoughness: 0.35,
  })

  const set = { kayu, papan, bambu, ijuk, ukiran, batu, tanduk }
  return {
    ...set,
    dispose() {
      for (const t of textures) t.dispose()
      for (const m of Object.values(set)) m.dispose()
    },
  }
}
