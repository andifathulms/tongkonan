/**
 * The mbaru niang, from the ground to the apex.
 *
 * There is no front, so the shared convention that X runs front to rear has
 * nothing to name here: the house is set out from its centre post and every
 * bearing round it is the same until the households divide it. The one thing
 * that does fix a direction is the door, and where a mbaru niang's door faces
 * is a fact about the village — it looks toward the compang, the ceremonial
 * platform at the centre of the settlement — rather than about the building.
 * So orientation stays a constraint, as in every other house here, and the
 * content of the constraint is relational again rather than a compass bearing.
 *
 * The order of work is the order it has to be. The centre post goes up first
 * and is the axis everything else is measured from; the rafters lean on it and
 * run to the ground; hoops tie them round; and only then are the five floors
 * built inside the cone, each bearing on the hoop at its own height. A
 * rectangular house can put its floor down before its roof. This one cannot,
 * because until the rafters are up there is nothing for a floor to reach.
 */

import { lerp } from '@/lib/core/geometry'
import { partBuilders } from '@/lib/core/parts'
import { tubeMesh } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import type { ConePoint, Joint, Layout, Level, ManggaraiKinds, Part, Rules, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS, LEVELS, facetsFor, peranInfo } from './rules'
import { coneAt, coneRun } from './cone'

const builders = partBuilders<ManggaraiKinds>()
const box = builders.box
export const meshPart = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

/**
 * The outline of the cone, ground first and apex last.
 *
 * A straight line between the two would be a geometric cone. Real thatch
 * bellies: the courses build up over the frame and the profile bows outward a
 * little between the ground and the point. It is a small number and it is the
 * difference between a roof and a party hat.
 */
function coneProfile(baseRadius: number, apexY: number): readonly ConePoint[] {
  const steps = Math.max(4, Math.round(DIMS.profileSteps.value))
  const out: ConePoint[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    out.push({
      r: baseRadius * (1 - t) + baseRadius * DIMS.coneBelly.value * Math.sin(Math.PI * t),
      y: apexY * t,
    })
  }
  return out
}

/** The radius of the cone at a height, read off the outline. */
export function radiusAtHeight(profile: readonly ConePoint[], y: number): number {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1]
    const b = profile[i]
    if (!a || !b) continue
    if (y <= b.y || i === profile.length - 1) {
      const span = b.y - a.y
      const t = span === 0 ? 0 : Math.max(0, Math.min(1, (y - a.y) / span))
      return lerp(a.r, b.r, t)
    }
  }
  return 0
}

export function resolveLayout(rules: Rules): Layout {
  const role = peranInfo(rules.peran)
  const baseRadius = DIMS.baseRadius.value * role.scale
  const apexY = DIMS.apexRise.value * role.scale
  const profile = coneProfile(baseRadius, apexY)

  /*
   * Five floors, and only the first of their heights is chosen.
   *
   * The rest follow at one storey each, and every radius is read off the cone
   * rather than declared — a floor is as wide as the building is at that
   * height, which is a fact about the cone and not a decision anyone makes.
   * This is the same lesson the joglo's roof tiers taught: derive from the
   * thing that determines it, or two places end up computing one shape.
   */
  const levels: Level[] = LEVELS.map((meta, i) => {
    const y = DIMS.luturRise.value + i * DIMS.storeyRise.value
    return {
      key: meta.key,
      name: meta.name,
      y,
      radius: radiusAtHeight(profile, y),
      glossId: meta.glossId,
      glossEn: meta.glossEn,
    }
  })

  const segmentAngles = Array.from(
    { length: rules.keluarga },
    (_, k) => (k / rules.keluarga) * Math.PI * 2,
  )

  const exposure = DIMS.thatchCourseDepth.value * (1 - DIMS.thatchLap.value)
  const thatchCourses = Math.max(6, Math.ceil(coneRun(profile) / exposure))

  const lutur = levels[0]
  return {
    rules,
    baseRadius,
    apexY,
    profile,
    levels,
    postRadius: baseRadius * DIMS.postRadiusShare.value,
    // One post per household boundary, so a partition always lands on timber
    // rather than on the middle of a floorboard. That the divisions and the
    // posts coincide is the author's reading; that there is one division per
    // household is not.
    postCount: rules.keluarga,
    rafterCount: rules.keluarga * Math.max(1, Math.round(DIMS.raftersPerSegment.value)),
    facets: facetsFor(rules.keluarga, DIMS.facets.value),
    postSection: DIMS.postSection.value,
    centrePostSection: DIMS.centrePostSection.value,
    segmentAngles,
    thatchCourses,
    drum: {
      present: role.drum,
      y: (lutur?.y ?? 0) + DIMS.partitionHeight.value * DIMS.drumHang.value,
      radius: DIMS.drumRadius.value,
    },
    dims: [],
  }
}

/* ── The frame ────────────────────────────────────────────────────────── */

export interface FrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

const STONE_DIMS: readonly DimKey[] = ['stoneHeight', 'stoneWidth', 'postRadiusShare', 'baseRadius', 'seatedOnStone']

export function buildFrame(layout: Layout): FrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const stoneTop = DIMS.stoneHeight.value
  const seat = stoneTop * DIMS.postSeat.value
  const centreSec = layout.centrePostSection
  const sec = layout.postSection

  /* The stones: one at the centre, one under each ring post. */
  /*
   * The stone at the centre is round and the ones on the ring are turned to
   * face outward.
   *
   * Both because of the same thing. Rotating the house by one segment has to
   * land it on itself: a ring part maps onto its neighbour, so it must be
   * turned to its own bearing; and the part on the axis maps onto *itself*, so
   * it must be round, because a square does not survive a sixty-degree turn.
   * They were all axis-aligned squares at radial positions to begin with,
   * which looks radial and is not, and the radial check said so.
   */
  parts.push(
    meshPart(
      'batu-tengah',
      { name: 'batu', nameId: 'Batu tiang tengah', nameEn: 'Centre pad stone' },
      'batu',
      0,
      'batu',
      STONE_DIMS,
      cylinder(DIMS.stoneWidth.value * DIMS.centreStoneShare.value, 0, stoneTop, layout.facets),
    ),
  )
  layout.segmentAngles.forEach((a, i) => {
    parts.push(
      box(
        `batu-${i}`,
        { name: 'batu', nameId: 'Batu tumpuan', nameEn: 'Pad stone' },
        'batu',
        i + 1,
        'batu',
        STONE_DIMS,
        [Math.cos(a) * layout.postRadius, stoneTop / 2, Math.sin(a) * layout.postRadius],
        [DIMS.stoneWidth.value, stoneTop, DIMS.stoneWidth.value],
        [0, -a, 0],
      ),
    )
  })

  /*
   * The centre post, first and tallest.
   *
   * It runs from its stone to the apex and passes through all five floors. In
   * the other three houses no single member touches every storey; here one
   * does, and it is the axis every radius in the building is measured from.
   */
  const centreDims: readonly DimKey[] = ['centrePostSection', 'apexRise', 'stoneHeight', 'postSeat', 'centrePostThrough']
  parts.push(
    meshPart(
      'tiang-tengah',
      { name: 'tiang tengah', nameId: 'Tiang tengah', nameEn: 'Centre post' },
      'tiang',
      0,
      'kayu',
      centreDims,
      cylinder(centreSec / 2, stoneTop - seat, layout.apexY, layout.facets),
    ),
  )
  const centreGrip = Math.min(centreSec, DIMS.stoneWidth.value) * DIMS.jointEngagement.value
  joints.push({
    id: 'tumpu-tengah',
    kind: 'tumpu',
    mortise: 'batu-tengah',
    tenon: 'tiang-tengah',
    at: [0, stoneTop - seat / 2, 0],
    halfExtents: [centreGrip / 2, (seat / 2) * 0.9, centreGrip / 2],
  })

  /* The ring of posts that carries the living floor. */
  const lutur = layout.levels[0]
  const postDims: readonly DimKey[] = ['postSection', 'postRadiusShare', 'baseRadius', 'luturRise', 'stoneHeight', 'postSeat']
  layout.segmentAngles.forEach((a, i) => {
    const x = Math.cos(a) * layout.postRadius
    const z = Math.sin(a) * layout.postRadius
    const top = lutur?.y ?? DIMS.luturRise.value
    parts.push(
      box(
        `tiang-${i}`,
        { name: 'tiang', nameId: 'Tiang cincin', nameEn: 'Ring post' },
        'tiang',
        i + 1,
        'kayu',
        postDims,
        [x, (stoneTop - seat + top) / 2, z],
        [sec, top - (stoneTop - seat), sec],
        [0, -a, 0],
      ),
    )
    const grip = Math.min(sec, DIMS.stoneWidth.value) * DIMS.jointEngagement.value
    joints.push({
      id: `tumpu-${i}`,
      kind: 'tumpu',
      mortise: `batu-${i}`,
      tenon: `tiang-${i}`,
      at: [x, stoneTop - seat / 2, z],
      halfExtents: [grip / 2, (seat / 2) * 0.9, grip / 2],
    })
  })

  return { parts, joints }
}

/**
 * A round post or stone: a closed cylinder between two heights.
 *
 * Built from its own geometry rather than swept, and the reason is a phase.
 * `tubeMesh` takes its section frame from the tangent, and for a path running
 * straight up the axis that tangent is parallel to the reference direction, so
 * it falls back to another one and the ring comes out rotated a quarter turn:
 * the points land on (sin θ, cos θ) instead of (cos θ, sin θ). That set is
 * closed under reflection in z only when the facet count is even — and with
 * seven households it is forty-nine. The symmetry check found a hundred and
 * ninety-six orphans, which was a real defect in the mesh and not in the
 * building.
 *
 * Laid out directly there is no frame to pick and no phase to be wrong about.
 */
export function cylinder(radius: number, fromY: number, toY: number, facets: number): MeshData {
  const mesh: MeshData = { positions: [], normals: [], uvs: [], indices: [] }
  for (const y of [fromY, toY]) {
    for (let k = 0; k <= facets; k++) {
      const a = (k / facets) * Math.PI * 2
      mesh.positions.push(Math.cos(a) * radius, y, Math.sin(a) * radius)
      mesh.normals.push(Math.cos(a), 0, Math.sin(a))
      mesh.uvs.push((k / facets) * radius * Math.PI * 2, y)
    }
  }
  const stride = facets + 1
  for (let k = 0; k < facets; k++) {
    mesh.indices.push(k, stride + k, stride + k + 1, k, stride + k + 1, k + 1)
  }
  for (const [y, dir] of [
    [toY, 1],
    [fromY, -1],
  ] as const) {
    const centre = mesh.positions.length / 3
    mesh.positions.push(0, y, 0)
    mesh.normals.push(0, dir, 0)
    mesh.uvs.push(0, 0)
    for (let k = 0; k <= facets; k++) {
      const a = (k / facets) * Math.PI * 2
      mesh.positions.push(Math.cos(a) * radius, y, Math.sin(a) * radius)
      mesh.normals.push(0, dir, 0)
      mesh.uvs.push(Math.cos(a) * radius, Math.sin(a) * radius)
    }
    for (let k = 0; k < facets; k++) {
      if (dir > 0) mesh.indices.push(centre, centre + 1 + k, centre + 2 + k)
      else mesh.indices.push(centre, centre + 2 + k, centre + 1 + k)
    }
  }
  return mesh
}

/** Points on the cone's surface at a bearing, for anything that follows it. */
export function surfacePoint(layout: Layout, f: number, angle: number): Vec3 {
  const p = coneAt(layout.profile, f)
  return [Math.cos(angle) * p.r, p.y, Math.sin(angle) * p.r]
}

export { tubeMesh }
