'use client'

/**
 * The renderer.
 *
 * It draws what the generator produced and generates nothing itself. If a
 * shape is being computed in here, it is in the wrong file — that split is
 * what makes the geometry testable, and it is not a style preference.
 *
 * The register is a physical model under real light: full material response
 * and real shadow, visibly a made object. No bloom, no vignette, no depth of
 * field, no haze. Effects layered on top of interpolated numbers would be a
 * lie told fluently.
 */

import * as THREE from 'three'
import type { House, Layout, Part, ProvenanceClass } from '@/lib/banua/types'
import { partClass } from '@/lib/banua/rules'
import type { SolarPosition } from '@/lib/solar/position'
import { sunDirection } from '@/lib/solar/position'
import { createMaterials, TEXTURE_METRES } from '../materials'
import type { MaterialSet } from '../materials'
import type { Timeline } from '@/lib/banua/assembly'
import { progressAt } from '@/lib/banua/assembly'

export type ViewKey = 'perspektif' | 'tampak' | 'kolong' | 'potongan'

export interface CameraState {
  azimuth: number
  polar: number
  distance: number
  target: THREE.Vector3
}

export interface SceneOptions {
  figure: boolean
  rain: boolean
  /** null when the house is simply standing there */
  reveal: { timeline: Timeline; t: number } | null
  /** 0 assembled, 1 fully exploded along the build order */
  explode: number
  /** cut the house on the ridge plane to show the three occupancy zones */
  section: boolean
  /**
   * Mark every part by the provenance of the dimensions that produced it,
   * instead of by what it is made of. The bar in the rail says how much of
   * the house is the author's own; this says which of it.
   */
  provenance: boolean
  reducedMotion: boolean
}

const BOLU = 0x17150f
const RARA = 0x8e3b25
const RIRI = 0xc8912b
const KAPUR = 0xe9e3d2
const GROUND = 0xc3bda9

/** The scale figure is 1.68 m and is a scale bar, not set dressing. */
const FIGURE_HEIGHT = 1.68

export class HouseScene {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera: THREE.PerspectiveCamera
  readonly cam: CameraState

  private materials: MaterialSet
  private houseGroup = new THREE.Group()
  private byPart = new Map<string, THREE.Object3D>()
  /** the pigment material each part is normally drawn in, to go back to */
  private restMaterial = new Map<string, THREE.Material>()
  private provenanceMaterials: Record<ProvenanceClass, THREE.MeshStandardMaterial>
  private provenanceOn = false
  private restPosition = new Map<string, THREE.Vector3>()
  /** Which parts are boxes: only those may be scaled during placement. */
  private boxParts = new Set<string>()
  private orderIndex = new Map<string, number>()
  private sunLight: THREE.DirectionalLight
  private skyLight: THREE.HemisphereLight
  private contact: THREE.Mesh
  private figure: THREE.Group
  private rain: RainRig
  private zones: ZoneRig
  private clip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)
  private layout: Layout | null = null
  private house: House | null = null
  private needsRender = true
  private lastApplied = ''

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1

    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
    this.cam = {
      azimuth: -2.25,
      polar: 1.16,
      distance: 26,
      target: new THREE.Vector3(0, 4, 0),
    }

    this.materials = createMaterials(this.renderer.capabilities.getMaxAnisotropy())
    /*
      Flat, untextured and matte, so the overlay reads as a mark made on the
      model rather than as another material the house could be built from.
      The three colours are the ones the rail already uses for the classes.
    */
    const marked = (color: number) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 })
    this.provenanceMaterials = {
      measured: marked(BOLU),
      canon: marked(RIRI),
      interpolated: marked(RARA),
    }

    // One directional light, shadow-casting, driven by the computed sun.
    this.sunLight = new THREE.DirectionalLight(0xffffff, 3)
    this.sunLight.castShadow = true
    this.sunLight.shadow.mapSize.set(2048, 2048)
    this.sunLight.shadow.bias = -0.0006
    this.sunLight.shadow.normalBias = 0.02
    this.scene.add(this.sunLight)
    this.scene.add(this.sunLight.target)

    // One hemisphere light, colour from the sky, intensity tracking altitude.
    this.skyLight = new THREE.HemisphereLight(KAPUR, GROUND, 0.6)
    this.scene.add(this.skyLight)

    // A clean ground plane. No vegetation, no terrain, no scattered props.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: GROUND, roughness: 1, metalness: 0 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.scene.add(ground)

    /*
     * Contact darkening under the raised body.
     *
     * A radial-gradient plane, and explicitly a placeholder: real ambient
     * occlusion in the joints and under the floor is the largest remaining
     * quality gain and this is not it. The deep shadow under a pile house —
     * the sulluk banua as a dark void with the whole body floating above it —
     * is the most dramatic thing about the form, so it gets something rather
     * than nothing while the real answer is pending.
     */
    this.contact = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: contactTexture(),
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      }),
    )
    this.contact.rotation.x = -Math.PI / 2
    this.contact.position.y = 0.012
    this.scene.add(this.contact)

    this.figure = buildFigure()
    this.scene.add(this.figure)

    this.rain = new RainRig()
    this.scene.add(this.rain.group)

    this.zones = new ZoneRig()
    this.scene.add(this.zones.group)

    this.scene.add(this.houseGroup)
  }

  /* ── The house ──────────────────────────────────────────────────────── */

  setHouse(house: House, layout: Layout): void {
    this.house = house
    this.layout = layout
    this.clearHouse()

    for (const part of house.parts) {
      const object = this.buildPart(part)
      object.castShadow = true
      object.receiveShadow = true
      object.name = part.id
      this.houseGroup.add(object)
      this.byPart.set(part.id, object)
      this.restMaterial.set(part.id, this.materials[part.material])
      this.restPosition.set(part.id, object.position.clone())
      if (part.kind === 'box') this.boxParts.add(part.id)
    }
    house.parts.forEach((part, i) => this.orderIndex.set(part.id, i))

    // Contact plane sized to the body, not the whole scene.
    const span = Math.max(layout.bodyLength, layout.bodyWidth) * 1.5
    this.contact.scale.set(span, span, 1)

    // The figure stands beside the house, clear of the eave, so it reads as a
    // measure of the building rather than as a person doing something.
    this.figure.position.set(
      layout.bodyLength * 0.28,
      0,
      layout.eaveHalfWidth + 1.4,
    )

    // A rebuild replaces every mesh, so a mode that was on has to be put
    // back on the new ones.
    if (this.provenanceOn) this.setProvenanceMarking(true)

    this.frameShadowCamera(house)
    this.rain.configure(layout)
    this.zones.configure(layout, house)
    this.fitCamera()
    this.needsRender = true
  }

  private buildPart(part: Part): THREE.Mesh {
    const material = this.materials[part.material]
    if (part.kind === 'box') {
      const geometry = new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2])
      scaleBoxUVs(geometry, part.size)
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(part.center[0], part.center[1], part.center[2])
      if (part.rotation) {
        mesh.rotation.set(part.rotation[0], part.rotation[1], part.rotation[2], 'XYZ')
      }
      return mesh
    }
    // Mesh parts arrive in world coordinates, so the object sits at the origin
    // and its geometry carries the position.
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(part.positions.slice(), 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(part.normals.slice(), 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(part.uvs.slice(), 2))
    geometry.setIndex(part.indices.slice())
    return new THREE.Mesh(geometry, material)
  }

  /**
   * Swap every part between what it is made of and where its numbers came
   * from.
   *
   * The honest result at present is a house that is almost entirely rara,
   * because almost every metre in the rule pack is the author's own. That is
   * the point of the mode and it is not softened here — the legend in the
   * rail is what stops it reading as an error.
   */
  private setProvenanceMarking(on: boolean): void {
    if (!this.house) return
    for (const part of this.house.parts) {
      const object = this.byPart.get(part.id)
      if (!(object instanceof THREE.Mesh)) continue
      const rest = this.restMaterial.get(part.id)
      object.material = on ? this.provenanceMaterials[partClass(part)] : rest ?? object.material
    }
    this.needsRender = true
  }

  private clearHouse(): void {
    for (const child of [...this.houseGroup.children]) {
      this.houseGroup.remove(child)
      if (child instanceof THREE.Mesh) child.geometry.dispose()
    }
    this.byPart.clear()
    this.restMaterial.clear()
    this.restPosition.clear()
    this.boxParts.clear()
    this.orderIndex.clear()
  }

  /**
   * Fit the shadow camera to the house bounds rather than to the scene.
   * A shadow map stretched over 240 m of ground plane would spend all its
   * resolution on nothing.
   */
  private frameShadowCamera(house: House): void {
    const [minX, minY, minZ] = house.bounds.min
    const [maxX, maxY, maxZ] = house.bounds.max
    const radius = Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) / 2
    const cam = this.sunLight.shadow.camera
    cam.left = -radius * 1.25
    cam.right = radius * 1.25
    cam.top = radius * 1.25
    cam.bottom = -radius * 1.25
    cam.near = 0.5
    cam.far = radius * 8
    cam.updateProjectionMatrix()
    this.sunLight.target.position.set(0, (minY + maxY) / 2, 0)
  }

  /* ── Light ──────────────────────────────────────────────────────────── */

  /**
   * The light is computed, not art-directed. Intensity and colour come from
   * the sun's altitude, so the difference between the equinox, the June
   * solstice and the local zenith passage is visible rather than described.
   */
  setSun(sun: SolarPosition, house: House): void {
    const [dx, dy, dz] = sunDirection(sun)
    const radius = Math.hypot(...house.bounds.max) + 30
    this.sunLight.position.set(dx * radius, Math.max(dy, -0.2) * radius, dz * radius)

    const alt = sun.altitude
    const day = clamp01(alt / 12) // fades out through twilight
    const high = clamp01(alt / 65)

    this.sunLight.intensity = 3.4 * day
    // Low sun is turmeric, high sun is lime — both from the pigment set.
    this.sunLight.color.set(0xc8912b).lerp(new THREE.Color(0xfff4e0), high)
    this.sunLight.castShadow = alt > 0.5

    this.skyLight.intensity = 0.25 + 0.75 * day
    const sky = skyColour(alt)
    this.skyLight.color.copy(sky)
    this.skyLight.groundColor.set(GROUND)

    // A flat colour tracking the computed altitude. A light source, not a
    // photograph: there is no gradient, no sun disc and no cloud.
    this.scene.background = sky
    this.contact.visible = alt > 0
    ;(this.contact.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.4 * day
    this.needsRender = true
  }

  /* ── Per-frame state ────────────────────────────────────────────────── */

  apply(options: SceneOptions, elapsedSeconds: number): void {
    this.figure.visible = options.figure
    this.setSection(options.section)
    this.rain.setActive(options.rain, this.layout)
    const raining = options.rain && !options.reducedMotion
    if (raining) {
      this.rain.advance(elapsedSeconds)
      this.needsRender = true
    }

    const layout = this.layout
    if (!layout) return

    // Nothing here is animated by default, so the scene redraws only when
    // something has actually changed. There is no idle motion to keep alive.
    const signature = [
      options.figure,
      options.rain,
      options.explode,
      options.section,
      options.provenance,
      options.reducedMotion,
      options.reveal ? options.reveal.t.toFixed(4) : 'none',
    ].join('|')
    if (signature === this.lastApplied) return
    this.lastApplied = signature

    if (options.provenance !== this.provenanceOn) {
      this.provenanceOn = options.provenance
      this.setProvenanceMarking(options.provenance)
    }

    for (const [id, object] of this.byPart) {
      const rest = this.restPosition.get(id)
      if (!rest) continue

      let y = rest.y
      let scale = 1

      if (options.reveal) {
        const p = options.reducedMotion
          ? // Reduced motion gets the complete alternative: the sequence still
            // runs, as an immediate ordered reveal rather than a drop.
            progressAt(options.reveal.timeline, id, options.reveal.t) > 0
            ? 1
            : 0
          : easeOutCubic(progressAt(options.reveal.timeline, id, options.reveal.t))
        object.visible = p > 0
        if (p < 1) {
          // The drop. No fades — opacity needs transparent materials, and a
          // house is not translucent while it is being built.
          y = rest.y + (1 - p) * 2.6
          // Boxes scale about their own centre, because their object origin
          // is that centre. World-space meshes get the drop only: scaling one
          // would scale it about the scene origin and swing a 14 m roof in
          // from below, which reads as an effect rather than an act of
          // building.
          if (this.boxParts.has(id)) scale = 0.55 + 0.45 * p
        }
      } else {
        object.visible = true
      }

      if (options.explode > 0) {
        const order = this.explodeOffset(id)
        y += order * options.explode
      }

      object.position.set(rest.x, y, rest.z)
      object.scale.setScalar(scale)
    }
    this.needsRender = true
  }

  /**
   * The section cut.
   *
   * A real clipping plane on the ridge plane, not a drawn diagram: the three
   * vertical zones are a spatial fact about the building, and showing them as
   * a flat illustration would be arguing for them rather than showing them.
   */
  private setSection(on: boolean): void {
    if (this.renderer.localClippingEnabled === on) return
    this.renderer.localClippingEnabled = on
    const planes = on ? [this.clip] : []
    this.houseGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material
        if (Array.isArray(material)) material.forEach((m) => (m.clippingPlanes = planes))
        else material.clippingPlanes = planes
      }
    })
    this.zones.group.visible = on
    this.needsRender = true
  }

  /** How far a part lifts in the exploded view: later in the build, higher up. */
  private explodeOffset(id: string): number {
    const house = this.house
    const index = this.orderIndex.get(id)
    if (!house || index === undefined) return 0
    return (index / Math.max(1, house.parts.length - 1)) * 9
  }

  /* ── Camera ─────────────────────────────────────────────────────────── */

  viewPreset(view: ViewKey): CameraState {
    const layout = this.layout
    const house = this.house
    const target = new THREE.Vector3(0, 4, 0)
    let distance = 26
    if (house && layout) {
      target.copy(boundsCentre(house))
      distance = this.fitDistance(house)
    }
    switch (view) {
      case 'tampak':
        // Looking at the north face, from the north. Near-horizontal, so it
        // reads as an elevation rather than a three-quarter view.
        return { azimuth: Math.PI, polar: Math.PI / 2 - 0.03, distance: distance * 0.66, target }
      case 'potongan':
        // Square on to the cut face, which the clipping plane leaves pointing
        // toward +Z. Near-horizontal, so the three zones stack the way they
        // stack in the building rather than being read off a perspective.
        return {
          azimuth: Math.PI / 2,
          polar: Math.PI / 2 - 0.05,
          distance: distance * 0.86,
          target,
        }
      case 'kolong':
        // Drops under the floor into the sulluk banua and looks up.
        return {
          azimuth: -2.5,
          polar: 1.62,
          distance: layout ? layout.bodyLength * 0.62 : 8,
          target: new THREE.Vector3(0, layout ? layout.kolongHeight * 0.55 : 1.2, 0),
        }
      default:
        return { azimuth: -2.25, polar: 1.13, distance, target }
    }
  }

  /**
   * The distance that frames the whole house, from its bounding sphere and
   * the narrower of the two field-of-view angles. A fixed multiple of the
   * height crops the prow on a tall narrow viewport, and the prow is the
   * thing the reader came to look at.
   */
  private fitDistance(house: House): number {
    const centre = boundsCentre(house)
    const [minX, minY, minZ] = house.bounds.min
    const [maxX, maxY, maxZ] = house.bounds.max
    // All eight corners: on a house this asymmetric the far corner is not
    // always one of the two the bounds happen to name.
    let radius = 0
    for (const x of [minX, maxX]) {
      for (const y of [minY, maxY]) {
        for (const z of [minZ, maxZ]) {
          radius = Math.max(radius, Math.hypot(x - centre.x, y - centre.y, z - centre.z))
        }
      }
    }
    const vfov = (this.camera.fov * Math.PI) / 180
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect)
    // A little air around the model: this is a drawing on a sheet, not a
    // photograph cropped to its subject.
    return (radius / Math.sin(Math.min(vfov, hfov) / 2)) * 1.18
  }

  private fitCamera(): void {
    const preset = this.viewPreset('perspektif')
    this.cam.distance = preset.distance
    this.cam.target.copy(preset.target)
  }

  setCamera(state: CameraState): void {
    this.cam.azimuth = state.azimuth
    this.cam.polar = clamp(state.polar, 0.08, Math.PI - 0.08)
    this.cam.distance = clamp(state.distance, 3, 200)
    this.cam.target.copy(state.target)
    this.needsRender = true
  }

  /** Drag-only rotation. There is no idle turntable and there never will be. */
  orbit(deltaX: number, deltaY: number): void {
    this.cam.azimuth -= deltaX * 0.0055
    this.cam.polar = clamp(this.cam.polar - deltaY * 0.0055, 0.08, Math.PI - 0.08)
    this.needsRender = true
  }

  dolly(factor: number): void {
    this.cam.distance = clamp(this.cam.distance * factor, 3, 200)
    this.needsRender = true
  }

  /* ── Frame ──────────────────────────────────────────────────────────── */

  resize(width: number, height: number): void {
    const unframed = this.camera.aspect === 1
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / Math.max(1, height)
    this.camera.updateProjectionMatrix()
    // The first real measurement is the first one that can frame the house.
    // Before it the aspect is a placeholder and any fit would be wrong.
    if (unframed && this.house) this.fitCamera()
    this.needsRender = true
  }

  render(): void {
    const { azimuth, polar, distance, target } = this.cam
    this.camera.position.set(
      target.x + distance * Math.sin(polar) * Math.cos(azimuth),
      target.y + distance * Math.cos(polar),
      target.z + distance * Math.sin(polar) * Math.sin(azimuth),
    )
    this.camera.lookAt(target)
    this.renderer.render(this.scene, this.camera)
    this.needsRender = false
  }

  get dirty(): boolean {
    return this.needsRender
  }

  markDirty(): void {
    this.needsRender = true
  }

  /** Metres per pixel at the target, for the scale bar. */
  metresPerPixel(height: number): number {
    const fov = (this.camera.fov * Math.PI) / 180
    return (2 * Math.tan(fov / 2) * this.cam.distance) / Math.max(1, height)
  }

  dispose(): void {
    this.clearHouse()
    this.materials.dispose()
    this.rain.dispose()
    this.zones.dispose()
    this.renderer.dispose()
  }
}

/* ── Rain ─────────────────────────────────────────────────────────────── */

/**
 * Rain, and the argument it makes.
 *
 * The streaks shed off the eave and the drip line is drawn on the ground in
 * rara — one of exactly two things that colour is spent on, because where the
 * water lands is an argument about why the overhang is as deep as it is.
 */
class RainRig {
  readonly group = new THREE.Group()
  // Seeded, like the materials: a viewer who reloads should get the same
  // rain, not a different shower that reads as the scene being alive.
  private random = seeded(48271)
  private streaks: THREE.LineSegments | null = null
  private dripLine: THREE.LineSegments | null = null
  private velocities: number[] = []
  private layout: Layout | null = null

  configure(layout: Layout): void {
    this.layout = layout
    this.dispose()

    const count = 420
    const positions = new Float32Array(count * 6)
    this.velocities = []
    for (let i = 0; i < count; i++) {
      this.seed(positions, i, layout, this.random())
      this.velocities.push(6 + this.random() * 4)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.streaks = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: KAPUR, transparent: true, opacity: 0.5 }),
    )
    this.group.add(this.streaks)

    // Where the water lands. Two lines on the ground, just outside the eave.
    const dripZ = layout.eaveHalfWidth + 0.18
    const x0 = layout.frontProwX
    const x1 = layout.rearProwX
    const drip = new Float32Array([
      x0, 0.02, dripZ, x1, 0.02, dripZ,
      x0, 0.02, -dripZ, x1, 0.02, -dripZ,
    ])
    const dripGeom = new THREE.BufferGeometry()
    dripGeom.setAttribute('position', new THREE.BufferAttribute(drip, 3))
    this.dripLine = new THREE.LineSegments(
      dripGeom,
      new THREE.LineBasicMaterial({ color: RARA, linewidth: 2 }),
    )
    this.group.add(this.dripLine)
  }

  private seed(positions: Float32Array, i: number, layout: Layout, phase: number): void {
    const x = layout.frontProwX + this.random() * (layout.rearProwX - layout.frontProwX)
    const z = (this.random() * 2 - 1) * (layout.eaveHalfWidth + 2.2)
    const top = layout.frontProwY + 2
    const y = phase * top
    const len = 0.5
    const o = i * 6
    positions[o] = x
    positions[o + 1] = y
    positions[o + 2] = z
    positions[o + 3] = x
    positions[o + 4] = y - len
    positions[o + 5] = z
  }

  setActive(active: boolean, layout: Layout | null): void {
    this.group.visible = active
    if (active && layout && !this.streaks) this.configure(layout)
  }

  advance(seconds: number): void {
    const layout = this.layout
    const streaks = this.streaks
    if (!layout || !streaks) return
    const attribute = streaks.geometry.getAttribute('position')
    const array = attribute.array as Float32Array
    const top = layout.frontProwY + 2
    for (let i = 0; i < this.velocities.length; i++) {
      const v = (this.velocities[i] ?? 8) * seconds
      const o = i * 6
      const y = (array[o + 1] ?? 0) - v
      // Water that reaches the eave line is shed outward: it does not pass
      // through the roof, it runs off it.
      if (y < 0) {
        this.seed(array, i, layout, 1)
      } else {
        array[o + 1] = y
        array[o + 4] = y - 0.5
      }
    }
    attribute.needsUpdate = true
  }

  dispose(): void {
    for (const child of [...this.group.children]) {
      this.group.remove(child)
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    }
    this.streaks = null
    this.dripLine = null
  }
}

function seeded(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * The three vertical zones, drawn on the cut plane.
 *
 * sulluk banua below the floor, kale banua on the living floor, rattiang
 * banua in the attic. The lines mark where one ends and the next begins; the
 * rail names them, because nothing on screen may carry meaning that only the
 * code knows.
 */
class ZoneRig {
  readonly group = new THREE.Group()

  constructor() {
    this.group.visible = false
  }

  configure(layout: Layout, house: House): void {
    this.dispose()
    // Run past the building at both ends, the way extension lines do on a
    // drawing: the boundary is being pointed at, not enclosed.
    const over = 1.6
    const x0 = layout.frontProwX - over
    const x1 = layout.rearProwX + over
    const z = 0.02
    const boundaries = [0, layout.floorFrameY, layout.deckY, layout.plateY, house.bounds.max[1]]
    const points: number[] = []
    for (const y of boundaries) points.push(x0, y, z, x1, y, z)

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
    this.group.add(
      new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({ color: BOLU, transparent: true, opacity: 0.8 }),
      ),
    )
  }

  dispose(): void {
    for (const child of [...this.group.children]) {
      this.group.remove(child)
      if (child instanceof THREE.LineSegments) {
        child.geometry.dispose()
        ;(child.material as THREE.Material).dispose()
      }
    }
  }
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

/**
 * The scale figure: 1.68 m, on by default.
 *
 * A plain dark silhouette. It is the scale bar, so it must be unmistakably a
 * person and must not read as a character in a scene.
 */
function buildFigure(): THREE.Group {
  const group = new THREE.Group()
  const material = new THREE.MeshStandardMaterial({ color: BOLU, roughness: 0.95 })
  const headR = 0.105
  const bodyH = FIGURE_HEIGHT - headR * 2
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, bodyH - 0.3, 4, 12), material)
  body.position.y = bodyH / 2
  body.castShadow = true
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 16, 12), material)
  head.position.y = bodyH + headR
  head.castShadow = true
  group.add(body, head)
  return group
}

function contactTexture(): THREE.Texture {
  const size = 256
  const el = document.createElement('canvas')
  el.width = size
  el.height = size
  const ctx = el.getContext('2d')
  if (!ctx) throw new Error('no 2d context')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(23,21,15,0.85)')
  g.addColorStop(0.45, 'rgba(23,21,15,0.4)')
  g.addColorStop(1, 'rgba(23,21,15,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(el)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * UVs scaled by the part's physical size, so grain stays at a constant
 * physical size instead of stretching along a beam.
 */
function scaleBoxUVs(geometry: THREE.BoxGeometry, size: readonly [number, number, number]): void {
  const uv = geometry.getAttribute('uv')
  const [sx, sy, sz] = size
  // BoxGeometry lays faces out +X, -X, +Y, -Y, +Z, -Z, four vertices each.
  const spans: [number, number][] = [
    [sz, sy],
    [sz, sy],
    [sx, sz],
    [sx, sz],
    [sx, sy],
    [sx, sy],
  ]
  for (let face = 0; face < 6; face++) {
    const span = spans[face] ?? [1, 1]
    for (let v = 0; v < 4; v++) {
      const i = face * 4 + v
      uv.setXY(i, uv.getX(i) * (span[0] / TEXTURE_METRES), uv.getY(i) * (span[1] / TEXTURE_METRES))
    }
  }
  uv.needsUpdate = true
}

/** A flat sky colour tracking the computed altitude. */
function skyColour(altitude: number): THREE.Color {
  const night = new THREE.Color(0x121319)
  const dusk = new THREE.Color(0x6b675c)
  const day = new THREE.Color(0xbdc9d4)
  if (altitude <= -6) return night
  if (altitude < 6) return night.clone().lerp(dusk, (altitude + 6) / 12)
  return dusk.clone().lerp(day, clamp01((altitude - 6) / 40))
}

function boundsCentre(house: House): THREE.Vector3 {
  const [minX, minY, minZ] = house.bounds.min
  const [maxX, maxY, maxZ] = house.bounds.max
  return new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const clamp01 = (v: number) => clamp(v, 0, 1)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp01(t), 3)
