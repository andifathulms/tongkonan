/**
 * The joglo, from the ground to the tumpang sari.
 *
 * Axes as in the other two: X runs front to rear, Y is up, Z runs along the
 * ridge, and the house mirrors about z = 0.
 *
 * Three things here have no counterpart in either of the other houses. The
 * floor is a plinth rather than a deck on stilts, so there is no habitable
 * void beneath it and nothing to look up into. The pillars come in concentric
 * rings, each shorter than the one within it, so the roof steps outward and
 * downward rather than running one pitch to an eave. And above the four soko
 * guru sits the tumpang sari, a stack of beams that closes inward and upward
 * tier by tier — the rank signal, and the reason this pack has a tier count
 * where the others have a scale or a tally.
 */

import { clamp01, lerp } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import type { Joint, JawaKinds, Layout, Part, RoofLevel, Rules, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS, SENTHONG_NAMES, tumpangInset, wujudInfo } from './rules'
import { hipRun } from '@/lib/core/hip'

const builders = partBuilders<JawaKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * The roof, as a stack of rectangles from the eave up to the molo.
 *
 * The levels are not invented and they are not interpolated: each ring of
 * pillars carries one, at the top of the beam that ties its heads. So the
 * pitch of the penanggap is whatever the ring spacing and the ring drop make
 * it, the roof steps where the pillars step, and adding a ring adds a tier —
 * the same relation the tongkonan's post rows have to its bays. The first
 * version of this file interpolated the levels between the eave and the soko
 * guru square, which produced a roof that rested on nothing and left the eave
 * plate floating in mid-air.
 *
 * Only the last band is different in kind. The brunjung springs from the soko
 * guru square, clears the tumpang sari standing inside it, and ends at a molo
 * shorter than what it stands on — which is what makes the ends fall away as
 * planes instead of running out to a gable.
 */
function roofLevels(layout: {
  readonly rings: readonly { readonly halfX: number; readonly halfZ: number; readonly height: number }[]
  readonly emper: boolean
  readonly umpakTop: number
  readonly ridgeY: number
  readonly ridgeHalfZ: number
}): readonly RoofLevel[] {
  const { rings, umpakTop } = layout
  const outer = rings[rings.length - 1]
  if (!outer) throw new Error('a joglo needs at least one ring of pillars')

  const topOf = (r: { height: number }) => umpakTop + r.height + DIMS.sundukDepth.value
  // The eave carries the penanggap pitch out past the last ring rather than
  // declaring a drop of its own: one fewer invented number, and a roof that
  // does not kink at its own edge.
  const pitch = DIMS.ringDrop.value / DIMS.ringStep.value
  const eaveHalf = outer.halfX + DIMS.eaveOversail.value
  const eaveY = topOf(outer) - DIMS.eaveOversail.value * pitch

  const out: RoofLevel[] = []
  if (layout.emper) {
    out.push({
      key: 'emper',
      halfX: eaveHalf + DIMS.emperRun.value,
      halfZ: eaveHalf + DIMS.emperRun.value,
      y: eaveY - DIMS.emperDrop.value,
    })
  }
  out.push({ key: 'tepi', halfX: eaveHalf, halfZ: eaveHalf, y: eaveY })
  for (let r = rings.length - 1; r >= 0; r--) {
    const ring = rings[r]
    if (!ring) continue
    out.push({
      key: r === 0 ? 'brunjung' : `penanggap-${r}`,
      halfX: ring.halfX,
      halfZ: ring.halfZ,
      y: topOf(ring),
    })
  }
  out.push({ key: 'molo', halfX: 0, halfZ: layout.ridgeHalfZ, y: layout.ridgeY })
  return out
}

export function resolveLayout(rules: Rules): Layout {
  const w = wujudInfo(rules.wujud)
  const guruHalf = DIMS.guruSpan.value / 2
  const step = DIMS.ringStep.value
  const umpakTop = DIMS.umpakHeight.value

  const sokoRings = Array.from({ length: w.rings }, (_, i) => ({
    halfX: guruHalf + i * step,
    halfZ: guruHalf + i * step,
    height: DIMS.guruHeight.value - i * DIMS.ringDrop.value,
  }))
  const outer = sokoRings[w.rings - 1]
  const guru = sokoRings[0]
  if (!outer || !guru) throw new Error('a joglo needs at least one ring of pillars')

  const bodyDepth = outer.halfX * 2
  const bodyLength = outer.halfZ * 2
  const floorY = DIMS.floorRise.value + DIMS.floorThickness.value

  const tumpangFootY = umpakTop + guru.height
  const tumpangTopY = tumpangFootY + rules.tumpang * DIMS.tumpangRise.value
  const ridgeY = tumpangTopY + DIMS.brunjungRise.value

  const roof = roofLevels({
    rings: sokoRings,
    emper: w.emper,
    umpakTop,
    ridgeY,
    ridgeHalfZ: guruHalf * DIMS.ridgeShare.value,
  })
  const eave = roof[0]
  if (!eave) throw new Error('a roof needs an eave')

  /*
   * The three rear chambers, and the middle one is the point.
   *
   * They sit against the back wall, evenly across it. The senthong tengah is
   * left empty — no bed, no store, nobody — and it is the most meaningful room
   * in the house. A generator that gave it a use would be describing a
   * different building.
   */
  const senthongSpan = (bodyLength * 0.82) / SENTHONG_NAMES.length
  const senthongZ = SENTHONG_NAMES.map(
    (_, i) => (i - (SENTHONG_NAMES.length - 1) / 2) * senthongSpan,
  )

  const pendhapaHalf = DIMS.pendhapaSpan.value / 2
  const pendhapaGuruHalf = pendhapaHalf * DIMS.pendhapaGuruShare.value
  const pendhapaCentreX = -(bodyDepth / 2 + DIMS.pendhapaGap.value + pendhapaHalf)
  const pendhapaRings = [
    { halfX: pendhapaGuruHalf, halfZ: pendhapaGuruHalf, height: DIMS.pendhapaHeight.value },
    { halfX: pendhapaHalf, halfZ: pendhapaHalf, height: DIMS.pendhapaHeight.value - DIMS.ringDrop.value },
  ]
  // Its own small joglo: two rings, no emper, and a brunjung of its own.
  const pendhapaRoof = roofLevels({
    rings: pendhapaRings,
    emper: false,
    umpakTop,
    ridgeY:
      umpakTop +
      DIMS.pendhapaHeight.value +
      DIMS.sundukDepth.value +
      DIMS.brunjungRise.value * DIMS.pendhapaBrunjung.value,
    ridgeHalfZ: pendhapaGuruHalf * DIMS.ridgeShare.value,
  })
  const pendhapaEave = pendhapaRoof[0]

  const exposure = DIMS.tileCourseDepth.value * (1 - DIMS.tileLap.value)
  const tileCourses = Math.max(4, Math.ceil(hipRun(roof) / exposure))

  return {
    rules,
    bodyDepth,
    bodyLength,
    floorY,
    wallHeight: DIMS.wallHeight.value,
    sokoRings,
    sokoSection: DIMS.sokoSection.value,
    tumpangCount: rules.tumpang,
    tumpangFootY,
    tumpangTopY,
    roof,
    eaveY: eave.y,
    ridgeY,
    senthongZ,
    senthongDepth: DIMS.senthongDepth.value,
    pendhapa: {
      present: rules.pendhapa,
      centreX: pendhapaCentreX,
      halfX: pendhapaHalf,
      halfZ: pendhapaHalf,
      roof: pendhapaRoof,
      eaveY: pendhapaEave?.y ?? 0,
    },
    tileCourses,
    dims: [],
  }
}

/** The ring the walls stand on: the dalem is enclosed inside the outer ring. */
export function wallRing(layout: Layout): { halfX: number; halfZ: number; height: number } {
  const index = Math.min(1, layout.sokoRings.length - 1)
  const ring = layout.sokoRings[index]
  if (!ring) throw new Error('no ring to hang the walls on')
  return ring
}

/* ── The frame ────────────────────────────────────────────────────────── */

export interface FrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

/** The pillar positions of one ring: the four corners, and the mid-side pillars outside the guru. */
function ringPositions(
  ring: { halfX: number; halfZ: number },
  index: number,
): readonly (readonly [number, number])[] {
  const corners: (readonly [number, number])[] = [
    [-ring.halfX, -ring.halfZ],
    [ring.halfX, -ring.halfZ],
    [-ring.halfX, ring.halfZ],
    [ring.halfX, ring.halfZ],
  ]
  // The soko guru are four and only four; the rings outside them carry
  // mid-side pillars as well, because they have longer runs to hold up.
  if (index === 0) return corners
  return [
    ...corners,
    [0, -ring.halfZ],
    [0, ring.halfZ],
    [-ring.halfX, 0],
    [ring.halfX, 0],
  ]
}

export function buildFrame(layout: Layout): FrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const sec = layout.sokoSection
  const umpakTop = DIMS.umpakHeight.value
  const seat = DIMS.umpakHeight.value * DIMS.sokoSeat.value
  const wall = wallRing(layout)

  const stoneDims: readonly DimKey[] = ['umpakHeight', 'umpakWidth', 'guruSpan', 'ringStep', 'seatedOnStone']
  const sokoDims: readonly DimKey[] = ['sokoSection', 'guruHeight', 'ringDrop', 'ringStep', 'guruSpan', 'umpakHeight', 'sokoSeat', 'sokoGuruFour']

  let stoneOrder = 0
  let sokoOrder = 0

  /*
   * The emper's own posts.
   *
   * A verandah is carried by something. The first version left the emper band
   * of rafters reaching down to a level with nothing under it, and the
   * build-order check refused them — correctly, because an emper with no posts
   * is a roof resting on air. Only the grade that has an emper has these.
   */
  const emper = layout.roof[0]?.key === 'emper' ? layout.roof[0] : null
  if (emper) {
    // The post heads stop a beam's depth short, so the beam that ties them
    // finishes exactly at the roof level. Rafters land anywhere along that
    // beam; landing them on the posts alone left every rafter but the one
    // directly over a post reaching down to nothing, which the build-order
    // check refused.
    const height = emper.y - DIMS.sundukDepth.value - umpakTop
    ringPositions({ halfX: emper.halfX, halfZ: emper.halfZ }, 1).forEach(([x, z], i) => {
      parts.push(
        box(
          `umpak-emper-${i}`,
          { name: 'umpak emper', nameId: 'Umpak emper', nameEn: 'Emper pad stone' },
          'umpak',
          900 + i,
          'batu',
          ['umpakHeight', 'umpakWidth', 'emperRun', 'eaveOversail'],
          [x, umpakTop / 2, z],
          [DIMS.umpakWidth.value, umpakTop, DIMS.umpakWidth.value],
        ),
      )
      parts.push(
        box(
          `soko-emper-${i}`,
          { name: 'soko emper', nameId: 'Soko emper', nameEn: 'Emper pillar' },
          'soko',
          900 + i,
          'jati',
          ['sokoSection', 'emperRun', 'emperDrop', 'umpakHeight', 'eaveOversail', 'ringDrop'],
          [x, umpakTop + height / 2, z],
          [sec, height, sec],
        ),
      )
    })

    const plateY = emper.y - DIMS.sundukDepth.value / 2
    const plateDims: readonly DimKey[] = ['sundukDepth', 'sundukWidth', 'emperRun', 'emperDrop', 'eaveOversail']
    const spans: readonly (readonly [Vec3, Vec3])[] = [
      [[0, plateY, emper.halfZ], [emper.halfX * 2 + DIMS.sundukWidth.value, DIMS.sundukDepth.value, DIMS.sundukWidth.value]],
      [[0, plateY, -emper.halfZ], [emper.halfX * 2 + DIMS.sundukWidth.value, DIMS.sundukDepth.value, DIMS.sundukWidth.value]],
      [[emper.halfX, plateY, 0], [DIMS.sundukWidth.value, DIMS.sundukDepth.value, emper.halfZ * 2 + DIMS.sundukWidth.value]],
      [[-emper.halfX, plateY, 0], [DIMS.sundukWidth.value, DIMS.sundukDepth.value, emper.halfZ * 2 + DIMS.sundukWidth.value]],
    ]
    spans.forEach((span, i) => {
      parts.push(
        box(
          `sunduk-emper-${i}`,
          { name: 'sunduk emper', nameId: 'Sunduk emper', nameEn: 'Emper plate' },
          'sunduk',
          900 + i,
          'jati',
          plateDims,
          span[0],
          span[1],
        ),
      )
    })
  }

  layout.sokoRings.forEach((ring, r) => {
    ringPositions(ring, r).forEach(([x, z], i) => {
      const id = `${r}-${i}`
      const isGuru = r === 0
      parts.push(
        box(
          `umpak-${id}`,
          { name: 'umpak', nameId: 'Umpak', nameEn: 'Pad stone' },
          'umpak',
          stoneOrder++,
          'batu',
          stoneDims,
          [x, umpakTop / 2, z],
          [DIMS.umpakWidth.value, umpakTop, DIMS.umpakWidth.value],
        ),
      )

      const footY = umpakTop - seat
      const headY = umpakTop + ring.height + DIMS.sundukDepth.value * DIMS.purusRun.value
      parts.push(
        box(
          `soko-${id}`,
          {
            name: isGuru ? 'soko guru' : 'soko',
            nameId: isGuru ? 'Soko guru' : 'Soko',
            nameEn: isGuru ? 'Soko guru — a principal pillar' : 'Pillar',
          },
          'soko',
          sokoOrder++,
          'jati',
          sokoDims,
          [x, (footY + headY) / 2, z],
          [sec, headY - footY, sec],
        ),
      )

      const grip = Math.min(sec, DIMS.umpakWidth.value) * DIMS.jointEngagement.value
      joints.push({
        id: `tumpu-${id}`,
        kind: 'tumpu',
        mortise: `umpak-${id}`,
        tenon: `soko-${id}`,
        at: [x, umpakTop - seat / 2, z],
        halfExtents: [grip / 2, (seat / 2) * 0.9, grip / 2],
      })
    })
  })

  /* Sunduk: a rectangle of tie beams round each ring's heads. */
  const sundukDims: readonly DimKey[] = ['sundukDepth', 'sundukWidth', 'guruSpan', 'ringStep', 'guruHeight', 'ringDrop', 'noNails']
  let sundukOrder = 0
  layout.sokoRings.forEach((ring, r) => {
    const y = umpakTop + ring.height + DIMS.sundukDepth.value / 2
    const spans: readonly (readonly [Vec3, Vec3])[] = [
      [[0, y, ring.halfZ], [ring.halfX * 2 + DIMS.sundukWidth.value, DIMS.sundukDepth.value, DIMS.sundukWidth.value]],
      [[0, y, -ring.halfZ], [ring.halfX * 2 + DIMS.sundukWidth.value, DIMS.sundukDepth.value, DIMS.sundukWidth.value]],
      // Run past the corner by the beam's own width, both ways, so a corner
      // pillar has timber over it on both axes rather than pegging into the
      // last millimetre of a beam that stops exactly where it stands.
      [[ring.halfX, y, 0], [DIMS.sundukWidth.value, DIMS.sundukDepth.value, ring.halfZ * 2 + DIMS.sundukWidth.value]],
      [[-ring.halfX, y, 0], [DIMS.sundukWidth.value, DIMS.sundukDepth.value, ring.halfZ * 2 + DIMS.sundukWidth.value]],
    ]
    spans.forEach((span, i) => {
      parts.push(
        box(
          `sunduk-${r}-${i}`,
          { name: 'sunduk', nameId: 'Sunduk', nameEn: 'Tie beam' },
          'sunduk',
          sundukOrder++,
          'jati',
          sundukDims,
          span[0],
          span[1],
        ),
      )
    })

    // The pillar heads peg into the beam that ties them.
    ringPositions(ring, r).forEach(([x, z], i) => {
      const run = DIMS.sundukDepth.value * DIMS.purusRun.value
      const grip = Math.min(sec, DIMS.sundukWidth.value) * DIMS.jointEngagement.value
      const alongZ = Math.abs(Math.abs(x) - ring.halfX) < 1e-9
      joints.push({
        id: `purus-${r}-${i}`,
        kind: 'purus',
        mortise: alongZ ? `sunduk-${r}-${x > 0 ? 2 : 3}` : `sunduk-${r}-${z > 0 ? 0 : 1}`,
        tenon: `soko-${r}-${i}`,
        at: [x, umpakTop + ring.height + run / 2, z],
        halfExtents: [grip / 2, (run / 2) * 0.9, grip / 2],
      })
    })
  })

  /* The floor: a plinth, and there is nothing under it. */
  const floorDims: readonly DimKey[] = ['floorRise', 'floorThickness', 'floorBoardWidth', 'guruSpan', 'ringStep']
  const boards = Math.max(1, Math.round(layout.bodyDepth / DIMS.floorBoardWidth.value))
  for (let i = 0; i < boards; i++) {
    const x = -layout.bodyDepth / 2 + (layout.bodyDepth * (i + 0.5)) / boards
    parts.push(
      box(
        `lantai-${i}`,
        { name: 'lantai', nameId: 'Papan lantai', nameEn: 'Floor board' },
        'lantai',
        i,
        'papan',
        floorDims,
        [x, layout.floorY - DIMS.floorThickness.value / 2, 0],
        [layout.bodyDepth / boards, DIMS.floorThickness.value, layout.bodyLength],
      ),
    )
  }

  /* Gebyok: the carved walls, on the ring inside the outer one. */
  const gebyokDims: readonly DimKey[] = ['wallHeight', 'wallThickness', 'guruSpan', 'ringStep', 'floorRise', 'floorThickness']
  const wallY = layout.floorY + layout.wallHeight / 2
  let gebyokOrder = 0
  const faces: readonly (readonly [string, Vec3, Vec3, string])[] = [
    ['muka', [-wall.halfX, wallY, 0], [DIMS.wallThickness.value, layout.wallHeight, wall.halfZ * 2], 'ukiran'],
    ['belakang', [wall.halfX, wallY, 0], [DIMS.wallThickness.value, layout.wallHeight, wall.halfZ * 2], 'papan'],
    ['kiwa', [0, wallY, -wall.halfZ], [wall.halfX * 2, layout.wallHeight, DIMS.wallThickness.value], 'papan'],
    ['tengen', [0, wallY, wall.halfZ], [wall.halfX * 2, layout.wallHeight, DIMS.wallThickness.value], 'papan'],
  ]
  for (const [name, centre, size, material] of faces) {
    parts.push(
      box(
        `gebyok-${name}`,
        {
          name: 'gebyok',
          nameId: name === 'muka' ? 'Gebyok muka' : 'Dinding',
          nameEn: name === 'muka' ? 'Carved front wall' : 'Wall',
        },
        'gebyok',
        gebyokOrder++,
        material === 'ukiran' ? 'ukiran' : 'papan',
        gebyokDims,
        centre,
        size,
      ),
    )
  }

  /*
   * The senthong. Three chambers along the back, and the middle one is left
   * empty — so what is built is the partitions between them and nothing
   * inside. The emptiness is the content.
   */
  const senthongDims: readonly DimKey[] = ['senthongDepth', 'wallThickness', 'wallHeight', 'guruSpan', 'ringStep', 'senthongTengahEmpty']
  const frontX = wall.halfX - layout.senthongDepth
  layout.senthongZ.forEach((z, i) => {
    const span = layout.senthongZ.length > 1 ? Math.abs((layout.senthongZ[1] ?? 0) - (layout.senthongZ[0] ?? 0)) : wall.halfZ
    parts.push(
      box(
        `senthong-muka-${i}`,
        {
          name: SENTHONG_NAMES[i] ?? 'senthong',
          nameId: SENTHONG_NAMES[i] ?? 'senthong',
          nameEn: SENTHONG_NAMES[i] ?? 'senthong',
        },
        'senthong',
        i * 2,
        i === 1 ? 'ukiran' : 'papan',
        senthongDims,
        [frontX, wallY, z],
        [DIMS.wallThickness.value, layout.wallHeight, span],
      ),
    )
    if (i > 0) {
      parts.push(
        box(
          `senthong-sekat-${i}`,
          { name: 'sekat senthong', nameId: 'Sekat senthong', nameEn: 'Senthong partition' },
          'senthong',
          i * 2 + 1,
          'papan',
          senthongDims,
          [(frontX + wall.halfX) / 2, wallY, z - span / 2],
          [wall.halfX - frontX, layout.wallHeight, DIMS.wallThickness.value],
        ),
      )
    }
  })

  /*
   * The tumpang sari: the stack over the soko guru.
   *
   * Each tier is a rectangle of four beams, stepping inward and rising, so the
   * ceiling closes to a small opening directly above the centre of the house.
   * Nothing else in this project is generative in quite this way — the count
   * is the rule, the geometry is what the count makes, and the reader can
   * stand under it and count the tiers.
   */
  const tumpangDims: readonly DimKey[] = ['tumpangRise', 'tumpangClose', 'tumpangDepth', 'tumpangWidth', 'guruSpan', 'guruHeight', 'tumpangIsOdd']
  let tumpangOrder = 0
  const guruHalfX = layout.sokoRings[0]?.halfX ?? 0
  const inset = tumpangInset(guruHalfX, layout.tumpangCount)
  for (let t = 0; t < layout.tumpangCount; t++) {
    const half = guruHalfX - t * inset
    /*
     * Each tier's beams run out to the tier below rather than stopping at
     * their own line, because that is where their ends land — a tumpang sari
     * is beams crossing on beams, and a tier whose beams stopped short would
     * be resting on nothing. The build-order check said exactly that.
     */
    const below = t === 0 ? half : guruHalfX - (t - 1) * inset
    if (half <= DIMS.tumpangWidth.value) break
    const y = layout.tumpangFootY + (t + 0.5) * DIMS.tumpangRise.value
    const naming = {
      name: 'tumpang sari',
      nameId: `Tumpang sari, tingkat ${t + 1}`,
      nameEn: `Tumpang sari, tier ${t + 1}`,
    }
    const reach = below * 2 + DIMS.tumpangWidth.value
    const spans: readonly (readonly [Vec3, Vec3])[] = [
      [[0, y, half], [reach, DIMS.tumpangDepth.value, DIMS.tumpangWidth.value]],
      [[0, y, -half], [reach, DIMS.tumpangDepth.value, DIMS.tumpangWidth.value]],
      [[half, y, 0], [DIMS.tumpangWidth.value, DIMS.tumpangDepth.value, reach]],
      [[-half, y, 0], [DIMS.tumpangWidth.value, DIMS.tumpangDepth.value, reach]],
    ]
    spans.forEach((span, i) => {
      parts.push(
        box(`tumpang-${t}-${i}`, naming, 'tumpang-sari', tumpangOrder++, 'jati', tumpangDims, span[0], span[1]),
      )
    })
  }

  return { parts, joints }
}

/** How far up the roof a fraction sits, for anything that needs the slope. */
export function roofFraction(layout: Layout, f: number): number {
  return clamp01(f) * hipRun(layout.roof)
}
