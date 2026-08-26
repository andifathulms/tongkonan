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
 * not new hues introduced because they looked more convincing. The palette
 * stays put across traditions for the same reason it stays put across
 * screens: it is the register of the whole project, not a costume for one
 * house.
 *
 * The generators are shared and the *sets* are not. Both houses are timbered,
 * thatched in ijuk and carved; only one of them has buffalo horn on the front
 * post, and only one has woven bamboo in its walls. A tradition composes the
 * materials it actually builds from, and asking for one it does not have is a
 * bug rather than something to paper over.
 */

import * as THREE from 'three'
import type { TraditionKey } from '@/lib/tradition/registry'

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
 * Woven bamboo — sasak, the plaited infill in a rumah gadang's end walls.
 *
 * Drawn as an over-and-under plait rather than a hatch, because the thing
 * that makes woven panel read as woven is the shadow where one lath passes
 * under another. The weave is constructed from its rule, like everything
 * else here: a pitch, a lath width, and a parity test.
 */
function anyamanCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(77401)
  const pitch = S / 16
  const lath = pitch * 0.82
  ctx.fillStyle = mix(BOLU, KAPUR, 0.28)
  ctx.fillRect(0, 0, S, S)

  const strip = (x: number, y: number, w: number, h: number, over: boolean) => {
    ctx.fillStyle = mix(mix(KAPUR, RIRI, 0.34), BOLU, over ? 0.12 + r() * 0.06 : 0.34 + r() * 0.08)
    ctx.fillRect(x, y, w, h)
  }

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      const over = (i + j) % 2 === 0
      // The under-lath is laid first so the over-lath covers its end, which
      // is what produces the join rather than a drawn line.
      if (over) {
        strip(i * pitch, j * pitch, lath, pitch, false)
        strip(i * pitch, j * pitch, pitch, lath, true)
      } else {
        strip(i * pitch, j * pitch, pitch, lath, false)
        strip(i * pitch, j * pitch, lath, pitch, true)
      }
    }
  }
  return el
}

/**
 * A carved Toraja panel, constructed rather than traced.
 *
 * Bands in the four pigments, and pa'barre allo drawn as a circle divided
 * into eight rays. The motif is a construction rule, so whatever draws it has
 * to draw it — storing a picture of one throws the rule away.
 *
 * Placeholder status is deliberate and stated in DESIGN.md: the target is
 * extruded geometry from these same rules, so the relief casts real shadow.
 * Only the plainly geometric pa'ssura is drawn here; motifs whose use is
 * restricted are not rendered at all.
 *
 * This ran on both houses until a render was looked at, and the rumah gadang
 * was wearing the Toraja sun disc across its whole front. That was not a
 * shortcut in the geometry, it was one people's motif on another people's
 * house — the exact thing the PRD's ethics section says not to do — and it
 * survived because the material set was split by name and the *construction*
 * behind the name was shared.
 */
function torajaCarvingCanvas(): HTMLCanvasElement {
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

/**
 * A carved Minangkabau panel, constructed rather than traced.
 *
 * Two motifs, both chosen because they are named in every published account
 * of rumah gadang carving, both plainly geometric, and neither restricted in
 * use:
 *
 * - **pucuak rabuang**, the bamboo shoot: a band of upward tapering forms,
 *   each a shoot with its tip curling over. The saying it carries — useful as
 *   a shoot, useful as a stem — is why it is the motif that runs across the
 *   widest boards, so it is the band here.
 * - **kaluak paku**, the fern frond: a coiled spiral, drawn as an involute
 *   because that is what a frond is, and repeated along a narrower band.
 *
 * What is claimed and what is not. These are constructions of two motifs from
 * their description, not tracings of a carved board, and the proportions are
 * the author's — the same standing as an interpolated dimension, and the same
 * honesty owed. Nothing beyond these two is attempted: Minangkabau carving is
 * a large vocabulary and inventing plausible members of it would be worse than
 * showing two real ones plainly.
 */
function minangCarvingCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  ctx.fillStyle = mix(BOLU, RARA, 0.18)
  ctx.fillRect(0, 0, S, S)

  /* Fillets between the bands: the boards are framed, not papered. */
  const rule = (y: number, h: number, colour: string) => {
    ctx.fillStyle = colour
    ctx.fillRect(0, y, S, h)
  }

  /**
   * One bamboo shoot: a tapering blade whose tip curls back on itself.
   *
   * Drawn from the base up, so the taper and the curl are the same curve
   * rather than a triangle with a hook added to it.
   */
  const shoot = (x: number, base: number, height: number, width: number, flip: number) => {
    ctx.beginPath()
    ctx.moveTo(x - width / 2, base)
    ctx.quadraticCurveTo(x - width * 0.18, base - height * 0.6, x + flip * width * 0.1, base - height)
    // The curl: the tip turns over toward the direction the shoot leans.
    ctx.quadraticCurveTo(
      x + flip * width * 0.62,
      base - height * 1.02,
      x + flip * width * 0.34,
      base - height * 0.7,
    )
    ctx.quadraticCurveTo(x + width * 0.34, base - height * 0.3, x + width / 2, base)
    ctx.closePath()
    ctx.fill()
  }

  /** One fern frond: an involute spiral, tightening as it coils inward. */
  const frond = (cx: number, cy: number, r: number, turns: number, flip: number) => {
    ctx.beginPath()
    const steps = 96
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const a = flip * t * turns * Math.PI * 2
      const rr = r * (1 - t * 0.86)
      const px = cx + Math.cos(a) * rr
      const py = cy + Math.sin(a) * rr * 0.9
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  const bandH = S / 4

  for (let b = 0; b < 4; b++) {
    const top = b * bandH
    rule(top, S * 0.012, mix(KAPUR, RIRI, 0.5))
    rule(top + bandH - S * 0.012, S * 0.012, mix(KAPUR, RIRI, 0.5))

    if (b % 2 === 0) {
      // pucuak rabuang: shoots alternating in the direction they lean, which
      // is how the band reads as growth rather than as a row of spikes.
      const count = 6
      const w = S / count
      for (let i = 0; i < count; i++) {
        const flip = i % 2 === 0 ? 1 : -1
        ctx.fillStyle = i % 2 === 0 ? RIRI : mix(KAPUR, RIRI, 0.35)
        shoot(w * (i + 0.5), top + bandH * 0.88, bandH * 0.66, w * 0.78, flip)
      }
    } else {
      // kaluak paku: fronds in facing pairs along the narrower band.
      const count = 8
      const w = S / count
      ctx.lineWidth = S * 0.012
      for (let i = 0; i < count; i++) {
        ctx.strokeStyle = i % 2 === 0 ? mix(KAPUR, RARA, 0.25) : RIRI
        frond(w * (i + 0.5), top + bandH * 0.5, bandH * 0.34, 1.6, i % 2 === 0 ? 1 : -1)
      }
    }
  }
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

/* ── The material sets ────────────────────────────────────────────────── */

/**
 * Which materials are the same substance in both houses, and which only share
 * a name.
 *
 * Timber is timber and thatch is thatch: the generators are shared because the
 * material is. Carving is not. `ukiran` names a carved board in both packs and
 * the *motif* is a specific people's, so it is listed as each tradition's own
 * even though both houses have one — which is the distinction the first split
 * missed, because it split the set by key and left the construction behind the
 * key shared.
 *
 * Declared as data so it can be checked from a test that has no DOM to build
 * a texture in.
 */
export const SHARED_MATERIALS: readonly string[] = ['kayu', 'papan', 'bambu', 'ijuk', 'batu']

export const OWN_MATERIALS: Record<TraditionKey, readonly string[]> = {
  /** pa'ssura, and buffalo horn on the tulak somba */
  toraja: ['ukiran', 'tanduk'],
  /** pucuak rabuang and kaluak paku, and woven bamboo in the end walls */
  minang: ['ukiran', 'anyaman'],
}

/**
 * The materials one tradition builds from.
 *
 * `get` rather than an index, because the renderer holds a house whose
 * material names are plain strings — it has no rule pack to narrow them
 * against. An unknown name is a real bug, so it is loud in development and
 * falls back to timber in the browser rather than dropping the part.
 */
export interface MaterialSet {
  get(key: string): THREE.Material
  dispose(): void
}

function assemble(
  entries: Record<string, THREE.Material>,
  textures: readonly THREE.Texture[],
): MaterialSet {
  const fallback = entries.kayu
  if (!fallback) throw new Error('every material set needs kayu as its fallback')
  return {
    get(key: string): THREE.Material {
      const found = entries[key]
      if (found) return found
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`no material named ${key} in this tradition's set`)
      }
      return fallback
    },
    dispose() {
      for (const t of textures) t.dispose()
      for (const m of Object.values(entries)) m.dispose()
    },
  }
}

export function createMaterials(tradition: TraditionKey, anisotropy: number): MaterialSet {
  const textures: THREE.Texture[] = []
  const tex = (el: HTMLCanvasElement) => {
    const t = toTexture(el, anisotropy)
    textures.push(t)
    return t
  }

  /* Shared between the two houses, because both are built of these. */
  const common: Record<string, THREE.Material> = {
    kayu: new THREE.MeshStandardMaterial({
      map: tex(timberCanvas(101, 0, 0)),
      roughness: 0.82,
      metalness: 0,
    }),
    papan: new THREE.MeshStandardMaterial({
      map: tex(timberCanvas(202, 1, 0.75)),
      roughness: 0.86,
      metalness: 0,
    }),
    bambu: new THREE.MeshStandardMaterial({
      map: tex(bambooCanvas()),
      roughness: 0.68,
      metalness: 0,
    }),
    ijuk: new THREE.MeshStandardMaterial({
      map: tex(ijukCanvas()),
      roughness: 0.97,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
    batu: new THREE.MeshStandardMaterial({
      map: tex(stoneCanvas()),
      roughness: 0.9,
      metalness: 0,
    }),
  }

  /*
   * Carving is the one material that is emphatically not shared. The pigments
   * are the project's register and stay put; the motifs are a specific
   * people's and do not.
   */
  const own: Record<string, THREE.Material> = {}
  own.ukiran = new THREE.MeshStandardMaterial({
    map: tex(tradition === 'toraja' ? torajaCarvingCanvas() : minangCarvingCanvas()),
    roughness: 0.7,
    metalness: 0,
  })

  if (tradition === 'toraja') {
    // Horn is waxy rather than matte, so it gets a clearcoat. This is the one
    // material where the physical response is the recognisable thing about it.
    own.tanduk = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(mix(BOLU, KAPUR, 0.2)),
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.35,
    })
  } else {
    own.anyaman = new THREE.MeshStandardMaterial({
      map: tex(anyamanCanvas()),
      roughness: 0.88,
      metalness: 0,
    })
  }

  return assemble({ ...common, ...own }, textures)
}
