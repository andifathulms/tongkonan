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

/**
 * Fired clay tile.
 *
 * The first roof in this project that is not thatch. Where ijuk is fibre —
 * soft-edged, matte, read by the shadow between courses — a tiled roof is a
 * field of hard repeated units with a shadow under every one of them, so the
 * generator draws units rather than strokes. The interlock runs one way only,
 * which is what gives a tiled roof its grain.
 */
function gentengCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(60313)
  const across = 8
  const down = 10
  const w = S / across
  const h = S / down
  ctx.fillStyle = mix(BOLU, RARA, 0.22)
  ctx.fillRect(0, 0, S, S)

  for (let row = 0; row < down; row++) {
    const y = row * h
    // Every other course offset by half a tile, the way they are laid.
    const shift = row % 2 === 0 ? 0 : w / 2
    for (let col = -1; col <= across; col++) {
      const x = col * w + shift
      const tone = 0.42 + r() * 0.3
      ctx.fillStyle = mix(mix(RARA, RIRI, 0.35), BOLU, 1 - tone)
      // The tile: a rounded pan, slightly proud of the one below it.
      ctx.beginPath()
      ctx.moveTo(x + w * 0.04, y + h)
      ctx.lineTo(x + w * 0.04, y + h * 0.34)
      ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.08, x + w * 0.96, y + h * 0.34)
      ctx.lineTo(x + w * 0.96, y + h)
      ctx.closePath()
      ctx.fill()
      // The shadow line under the head of the course above.
      ctx.strokeStyle = mix(BOLU, RARA, 0.1)
      ctx.lineWidth = h * 0.09
      ctx.beginPath()
      ctx.moveTo(x + w * 0.04, y + h * 0.36)
      ctx.quadraticCurveTo(x + w * 0.5, y - h * 0.06, x + w * 0.96, y + h * 0.36)
      ctx.stroke()
    }
  }
  return el
}

/**
 * A carved Javanese panel, constructed rather than traced.
 *
 * Two motifs, both named in every account of gebyok carving, both plainly
 * geometric, neither restricted:
 *
 * - **lung-lungan**, the running vine: a stem that scrolls and throws a curl
 *   at each turn. It is the motif that fills the long fields of a gebyok, so
 *   it is the field here.
 * - **wajikan**, the lozenge: a diamond set where members cross, with a small
 *   rosette at its centre. It punctuates rather than fills, so it sits on the
 *   band between the fields.
 *
 * The same standing as the Minangkabau panel and the same honesty owed: these
 * are constructions from description rather than tracings of a carved board,
 * and the proportions are the author's. Nothing beyond the two is attempted —
 * Javanese carving is a large and finely graded vocabulary, and inventing
 * plausible members of it would be worse than showing two real ones plainly.
 */
function jawaCarvingCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  ctx.fillStyle = mix(BOLU, RARA, 0.14)
  ctx.fillRect(0, 0, S, S)

  /** One turn of the vine: a stem arc with a curl closing on itself. */
  const scroll = (cx: number, cy: number, r: number, flip: number) => {
    ctx.strokeStyle = mix(KAPUR, RIRI, 0.45)
    ctx.lineWidth = S * 0.014
    ctx.beginPath()
    for (let i = 0; i <= 80; i++) {
      const t = i / 80
      const a = flip * (Math.PI * 1.65) * t - Math.PI * 0.4
      const rr = r * (1 - t * 0.72)
      const px = cx + Math.cos(a) * rr
      const py = cy + Math.sin(a) * rr
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()
    // The leaf the curl carries.
    ctx.fillStyle = RIRI
    ctx.beginPath()
    ctx.ellipse(cx + flip * r * 0.62, cy - r * 0.5, r * 0.22, r * 0.11, flip * 0.7, 0, Math.PI * 2)
    ctx.fill()
  }

  /** One lozenge, with its rosette. */
  const wajikan = (cx: number, cy: number, r: number) => {
    ctx.fillStyle = mix(KAPUR, RIRI, 0.6)
    ctx.beginPath()
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx + r * 0.72, cy)
    ctx.lineTo(cx, cy + r)
    ctx.lineTo(cx - r * 0.72, cy)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = mix(BOLU, RARA, 0.3)
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.26, 0, Math.PI * 2)
    ctx.fill()
  }

  const bandH = S / 4
  for (let b = 0; b < 4; b++) {
    const top = b * bandH
    ctx.fillStyle = mix(KAPUR, RIRI, 0.4)
    ctx.fillRect(0, top, S, S * 0.008)
    if (b % 2 === 0) {
      const n = 4
      for (let i = 0; i < n; i++) {
        scroll((S / n) * (i + 0.5), top + bandH * 0.55, bandH * 0.33, i % 2 === 0 ? 1 : -1)
      }
    } else {
      const n = 6
      for (let i = 0; i < n; i++) wajikan((S / n) * (i + 0.5), top + bandH * 0.5, bandH * 0.26)
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

/**
 * Paras: the soft volcanic sandstone a bataran is faced in.
 *
 * Not the river stone the other houses seat their posts on, and the difference
 * is worth drawing rather than tinting. Paras is quarried and cut, so it has
 * bed lines and a sawn face; a river stone is rounded and even. Same substance
 * class, different history, so it gets its own generator rather than
 * `stoneCanvas` with the colour turned down — which is the split-by-name
 * mistake this file already made once.
 */
function parasCanvas(): HTMLCanvasElement {
  const S = 256
  const { ctx, el } = canvas(S)
  const r = rng(31607)
  const base = mix(mix(GROUND, BOLU, 0.30), KAPUR, 0.18)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.03 + r() * 0.07)
    ctx.beginPath()
    ctx.arc(r() * S, r() * S, 0.5 + r() * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }
  // The bed lines of a quarried block, faint and horizontal.
  for (let k = 1; k < 4; k++) {
    ctx.strokeStyle = mix(base, BOLU, 0.10 + r() * 0.05)
    ctx.lineWidth = 0.8
    const y = (k / 4) * S + (r() - 0.5) * 5
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(S, y)
    ctx.stroke()
  }
  return el
}

/** Brick, in the body of the bataran behind its facing. */
function bataCanvas(): HTMLCanvasElement {
  const S = 256
  const { ctx, el } = canvas(S)
  const r = rng(31608)
  const courses = 8
  const h = S / courses
  ctx.fillStyle = mix(GROUND, BOLU, 0.42)
  ctx.fillRect(0, 0, S, S)
  for (let j = 0; j < courses; j++) {
    const offset = j % 2 === 0 ? 0 : h
    for (let i = -1; i < 4; i++) {
      ctx.fillStyle = mix(mix(RARA, BOLU, 0.34), KAPUR, 0.08 + r() * 0.10)
      ctx.fillRect(i * h * 2 + offset + 1.2, j * h + 1.2, h * 2 - 2.4, h - 2.4)
    }
  }
  return el
}

/**
 * Alang-alang: grass thatch, not the black palm fibre two other houses use.
 *
 * The same construction as `ijukCanvas` would have been the easy answer and
 * the wrong one — ijuk is dark, coarse and stands out in tufts; alang-alang is
 * straw-coloured, fine and lies in combed courses. Drawing one from the other
 * with a colour change is exactly the fault that put a Toraja sun disc on a
 * rumah gadang.
 */
function alangCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20314)
  const base = mix(mix(RIRI, KAPUR, 0.42), BOLU, 0.26)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 2600; i++) {
    const x = r() * S
    const y = r() * S
    // Combed: long, near-parallel and only slightly out of line, where ijuk
    // leans every which way.
    const len = 20 + r() * 40
    const lean = (r() - 0.5) * 3
    ctx.strokeStyle = mix(base, r() > 0.45 ? KAPUR : BOLU, 0.05 + r() * 0.20)
    ctx.lineWidth = 0.5 + r() * 0.9
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + lean, y + len)
    ctx.stroke()
  }
  return el
}

/**
 * Rumbia: sago-palm leaf, laid as overlapping fronds.
 *
 * The third thatch in this project and the third generator, because it is the
 * third plant. Ijuk is loose dark fibre and stands out in tufts; alang-alang
 * is fine combed grass; a sago frond is a broad leaf folded over a batten, so
 * what reads is a repeating scallop rather than a texture of strands.
 */
function rumbiaCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20315)
  const base = mix(mix(RIRI, BOLU, 0.52), RARA, 0.18)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  const rows = 7
  const h = S / rows
  for (let j = 0; j < rows; j++) {
    const across = 9
    for (let i = -1; i < across + 1; i++) {
      const w = S / across
      const x = i * w + (j % 2 === 0 ? 0 : w / 2)
      ctx.fillStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.04 + r() * 0.16)
      ctx.beginPath()
      // A frond: flat at the batten, rounded where it hangs.
      ctx.moveTo(x, j * h)
      ctx.lineTo(x + w, j * h)
      ctx.quadraticCurveTo(x + w / 2, j * h + h * 1.5, x, j * h)
      ctx.fill()
    }
    // The batten line the next course is tied to.
    ctx.strokeStyle = mix(base, BOLU, 0.34)
    ctx.lineWidth = 1.1
    ctx.beginPath()
    ctx.moveTo(0, j * h)
    ctx.lineTo(S, j * h)
    ctx.stroke()
  }
  return el
}

/**
 * Behu: a dressed standing stone, not a river cobble.
 *
 * Separate from `stoneCanvas` because it is separate in fact — this stone was
 * quarried, worked and stood up on purpose, and it carries tool marks where a
 * cobble carries none. Sharing the generator would have been the same fault as
 * sharing a carving between two peoples: one key, two things.
 */
function behuCanvas(): HTMLCanvasElement {
  const S = 256
  const { ctx, el } = canvas(S)
  const r = rng(5502)
  const base = mix(GROUND, BOLU, 0.58)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.04 + r() * 0.10)
    ctx.beginPath()
    ctx.arc(r() * S, r() * S, 0.6 + r() * 2.0, 0, Math.PI * 2)
    ctx.fill()
  }
  // Tool marks: short, roughly parallel, and only on the worked face.
  for (let i = 0; i < 90; i++) {
    const x = r() * S
    const y = r() * S
    ctx.strokeStyle = mix(base, BOLU, 0.14 + r() * 0.12)
    ctx.lineWidth = 0.7 + r() * 0.9
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + 4 + r() * 9, y + (r() - 0.5) * 3)
    ctx.stroke()
  }
  return el
}

/**
 * Sirap: ironwood shingles, split rather than sawn.
 *
 * The fourth roof covering here and the first that is not a plant. Ijuk is
 * fibre, alang-alang is grass, rumbia is leaf; a shingle is a flat rectangle
 * of hard wood with a split edge, so what reads is a grid of butt joints and
 * the shadow under each course, not a texture of strands. Drawing it from one
 * of the thatch generators with the colour changed would have been the
 * split-by-name mistake for the fourth time.
 */
function sirapCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20316)
  const base = mix(mix(BOLU, RARA, 0.24), KAPUR, 0.30)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  const rows = 10
  const h = S / rows
  const across = 6
  const w = S / across
  for (let j = 0; j < rows; j++) {
    for (let i = -1; i < across + 1; i++) {
      // Broken bond, like every shingled roof: no joint sits over another.
      const x = i * w + (j % 2 === 0 ? 0 : w / 2)
      ctx.fillStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.03 + r() * 0.14)
      ctx.fillRect(x + 0.8, j * h + 0.8, w - 1.6, h - 1.6)
      // The split edge: one ragged line down the face of a shingle.
      if (r() > 0.55) {
        ctx.strokeStyle = mix(base, BOLU, 0.16 + r() * 0.1)
        ctx.lineWidth = 0.6
        const sx = x + w * (0.25 + r() * 0.5)
        ctx.beginPath()
        ctx.moveTo(sx, j * h + 1)
        ctx.lineTo(sx + (r() - 0.5) * 3, j * h + h - 1)
        ctx.stroke()
      }
    }
    // The shadow the course above casts on this one.
    ctx.fillStyle = mix(base, BOLU, 0.30)
    ctx.fillRect(0, j * h, S, 1.6)
  }
  return el
}

/**
 * Nipah: mangrove-palm frond, folded over a lath and stitched.
 *
 * The fourth thatch here and the fourth generator, because it is the fourth
 * plant. A nipah panel is made before it goes up — leaflets folded over a
 * batten and sewn — so what reads is a regular seam every few centimetres and
 * a hard horizontal line where one panel laps the next, which is nothing like
 * loose ijuk or combed alang-alang.
 */
function nipahCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20317)
  const base = mix(mix(RIRI, BOLU, 0.46), KAPUR, 0.14)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  const rows = 9
  const h = S / rows
  for (let j = 0; j < rows; j++) {
    // The leaflets: near-vertical strokes, regular because they were folded
    // over a lath rather than thrown on.
    for (let i = 0; i < 120; i++) {
      const x = (i / 120) * S + (r() - 0.5) * 2
      ctx.strokeStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.04 + r() * 0.16)
      ctx.lineWidth = 0.8 + r() * 0.8
      ctx.beginPath()
      ctx.moveTo(x, j * h + 1)
      ctx.lineTo(x + (r() - 0.5) * 2, j * h + h - 1)
      ctx.stroke()
    }
    // The stitched lath, and the shadow the panel above casts on this one.
    ctx.strokeStyle = mix(base, BOLU, 0.42)
    ctx.lineWidth = 1.8
    ctx.beginPath()
    ctx.moveTo(0, j * h + 0.9)
    ctx.lineTo(S, j * h + 0.9)
    ctx.stroke()
  }
  return el
}

/**
 * Kulit kayu: bark, taken off in a sheet and flattened.
 *
 * Not a board and not a plait. Bark keeps the tree's own fibre — long, roughly
 * parallel, and interrupted by the knots and lenticels the trunk had — so what
 * reads is a continuous grain with irregular dark marks in it rather than the
 * repeating unit of a manufactured material. It is the only wall in this
 * project that was never cut to a size.
 */
function kulitCanvas(): HTMLCanvasElement {
  const S = 512
  const { ctx, el } = canvas(S)
  const r = rng(20318)
  const base = mix(mix(BOLU, RARA, 0.34), KAPUR, 0.22)
  ctx.fillStyle = base
  ctx.fillRect(0, 0, S, S)
  // The fibre: long, near-parallel, and never quite straight.
  for (let i = 0; i < 900; i++) {
    const x = r() * S
    ctx.strokeStyle = mix(base, r() > 0.5 ? KAPUR : BOLU, 0.03 + r() * 0.14)
    ctx.lineWidth = 0.5 + r() * 1.4
    ctx.beginPath()
    ctx.moveTo(x, 0)
    let y = 0
    let cx = x
    while (y < S) {
      const step = 24 + r() * 40
      cx += (r() - 0.5) * 6
      ctx.lineTo(cx, y + step)
      y += step
    }
    ctx.stroke()
  }
  // Lenticels and knots: what the trunk had, still there.
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = mix(base, BOLU, 0.22 + r() * 0.2)
    const w = 2 + r() * 9
    ctx.beginPath()
    ctx.ellipse(r() * S, r() * S, w, w * (0.2 + r() * 0.3), r() * 0.4 - 0.2, 0, Math.PI * 2)
    ctx.fill()
  }
  return el
}

const clampByte = (v: number) => Math.min(255, Math.max(0, v))

/* ── The material sets ────────────────────────────────────────────────── */

/*
 * The key lists moved to `materials.keys.ts`, which imports no three.js, so a
 * test can read them. See the note there: they were unreachable to any check
 * while they sat beside the generators, and the fault that cost was a route
 * that threw on load.
 */
import { FALLBACK_MATERIAL } from './materials.keys'
export { FALLBACK_MATERIAL, OWN_MATERIALS, SHARED_MATERIALS, materialKeysFor } from './materials.keys'


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
  fallbackKey: string,
): MaterialSet {
  const fallback = entries[fallbackKey]
  if (!fallback) throw new Error(`the fallback material ${fallbackKey} is not in this set`)
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

  const timber = (seed: number, pale: number, straight: number, roughness: number) =>
    new THREE.MeshStandardMaterial({ map: tex(timberCanvas(seed, pale, straight)), roughness, metalness: 0 })

  /* Generators shared because the substance is: board, bamboo, river stone. */
  const set: Record<string, THREE.Material> = {
    papan: timber(202, 1, 0.75, 0.86),
    bambu: new THREE.MeshStandardMaterial({ map: tex(bambooCanvas()), roughness: 0.68, metalness: 0 }),
    batu: new THREE.MeshStandardMaterial({ map: tex(stoneCanvas()), roughness: 0.9, metalness: 0 }),
  }

  /*
   * Carving is emphatically not shared. The pigments are the project's
   * register and stay put; the motifs are a specific people's and do not, and
   * a set split by key while the construction behind the key stayed shared is
   * how the rumah gadang wore the Toraja sun disc for a whole phase.
   */
  if (tradition === 'toraja') {
    set.kayu = timber(101, 0, 0, 0.82)
    set.ijuk = new THREE.MeshStandardMaterial({
      map: tex(ijukCanvas()),
      roughness: 0.97,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    set.ukiran = new THREE.MeshStandardMaterial({ map: tex(torajaCarvingCanvas()), roughness: 0.7, metalness: 0 })
    // Horn is waxy rather than matte, so it gets a clearcoat. The one material
    // whose physical response is the recognisable thing about it.
    set.tanduk = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(mix(BOLU, KAPUR, 0.2)),
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.5,
      clearcoatRoughness: 0.35,
    })
  } else if (tradition === 'minang') {
    set.kayu = timber(101, 0, 0, 0.82)
    set.ijuk = new THREE.MeshStandardMaterial({
      map: tex(ijukCanvas()),
      roughness: 0.97,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    set.ukiran = new THREE.MeshStandardMaterial({ map: tex(minangCarvingCanvas()), roughness: 0.7, metalness: 0 })
    set.anyaman = new THREE.MeshStandardMaterial({ map: tex(anyamanCanvas()), roughness: 0.88, metalness: 0 })
  } else if (tradition === 'jawa') {
    // Teak: darker and denser in the grain than the timber the other two are
    // named for, and named rather than called timber because on a joglo it is.
    set.jati = timber(303, 0, 0.35, 0.74)
    set.genteng = new THREE.MeshStandardMaterial({ map: tex(gentengCanvas()), roughness: 0.82, metalness: 0 })
    set.ukiran = new THREE.MeshStandardMaterial({ map: tex(jawaCarvingCanvas()), roughness: 0.66, metalness: 0 })
  } else if (tradition === 'arfak') {
    set.kayu = timber(1010, 0.3, 0.45, 0.86)
    set.kulit = new THREE.MeshStandardMaterial({
      map: tex(kulitCanvas()),
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    set.alang = new THREE.MeshStandardMaterial({
      map: tex(alangCanvas()),
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  } else if (tradition === 'bugis') {
    set.kayu = timber(909, 0.25, 0.6, 0.8)
    set.nipah = new THREE.MeshStandardMaterial({
      map: tex(nipahCanvas()),
      roughness: 0.94,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  } else if (tradition === 'palembang') {
    // Two timbers that differ on purpose: unglen dark and dense in the posts,
    // tembesu warmer and straighter in the frame and boards.
    set.unglen = timber(808, 0, 0.3, 0.8)
    set.tembesu = timber(809, 0.5, 0.7, 0.78)
    set.genteng = new THREE.MeshStandardMaterial({ map: tex(gentengCanvas()), roughness: 0.82, metalness: 0 })
    set.kisi = timber(810, 0.7, 0.9, 0.6)
  } else if (tradition === 'sumba') {
    set.kayu = timber(707, 0.2, 0.35, 0.82)
    set.alang = new THREE.MeshStandardMaterial({
      map: tex(alangCanvas()),
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  } else if (tradition === 'dayak') {
    // Ironwood: darker and greyer than the other timbers here, because it
    // weathers to it and because that is how a betang reads from a distance.
    set.ulin = timber(606, 0, 0.5, 0.84)
    set.sirap = new THREE.MeshStandardMaterial({ map: tex(sirapCanvas()), roughness: 0.88, metalness: 0 })
  } else if (tradition === 'nias') {
    set.kayu = timber(505, 0.15, 0.4, 0.8)
    set.rumbia = new THREE.MeshStandardMaterial({
      map: tex(rumbiaCanvas()),
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    })
    set.behu = new THREE.MeshStandardMaterial({ map: tex(behuCanvas()), roughness: 0.86, metalness: 0 })
  } else if (tradition === 'bali') {
    set.kayu = timber(404, 0.35, 0.55, 0.78)
    set.paras = new THREE.MeshStandardMaterial({ map: tex(parasCanvas()), roughness: 0.93, metalness: 0 })
    set.bata = new THREE.MeshStandardMaterial({ map: tex(bataCanvas()), roughness: 0.95, metalness: 0 })
    set.alang = new THREE.MeshStandardMaterial({
      map: tex(alangCanvas()),
      roughness: 0.95,
      metalness: 0,
      // Open on every side, so the underside of the roof is in plain view from
      // outside — the one house here where the inner face of the thatch is
      // part of what a reader sees rather than something behind a wall.
      side: THREE.DoubleSide,
    })
  } else {
    // Nothing of its own: see OWN_MATERIALS. A house with no carving needs no
    // carving generator, and inventing one to fill the slot would be the same
    // fault as putting another people's motif on it.
    set.kayu = timber(101, 0, 0, 0.82)
    set.ijuk = new THREE.MeshStandardMaterial({
      map: tex(ijukCanvas()),
      roughness: 0.97,
      metalness: 0,
      side: THREE.DoubleSide,
    })
  }

  return assemble(set, textures, FALLBACK_MATERIAL[tradition])
}
