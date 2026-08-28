/**
 * The cone's frame, its thatch, and the five floors inside it.
 *
 * Two things here have no counterpart in the other three houses.
 *
 * The rafters run from the apex all the way to the ground, so the roof is the
 * whole exterior and there is no eave line, no wall and no gable. What holds
 * the shape is not a ridge but a set of hoops: in a rectangular house straight
 * beams keep the frame true, and here it is the circle itself that has to be
 * kept.
 *
 * And the floors are built last of the enclosed parts rather than first,
 * because until the rafters are standing there is nothing for a floor to reach
 * out to. Every other house in this project puts its deck down early.
 */

import { clamp01, lerp, mergeMeshes, tubeMesh } from '@/lib/core/geometry'
import type { MeshData } from '@/lib/core/geometry'
import { courseBands } from '@/lib/core/courses'
import type { CourseBand } from '@/lib/core/courses'
import { emptyMesh, computeNormals } from '@/lib/core/geometry'
import type { Joint, Layout, Part, Vec3 } from './types'
import type { DimKey } from './rules'
import { DIMS } from './rules'
import { coneAt, coneRun, coneSurface } from '@/lib/core/cone'
import { doorOpening, radiusAtHeight } from './frame'
import { meshPart } from './frame'

/** Rotate a finished mesh about the vertical axis. */
function rotateY(mesh: MeshData, angle: number): MeshData {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const out: MeshData = {
    positions: mesh.positions.slice(),
    normals: mesh.normals.slice(),
    uvs: mesh.uvs.slice(),
    indices: mesh.indices.slice(),
  }
  for (const a of [out.positions, out.normals]) {
    for (let i = 0; i < a.length; i += 3) {
      const x = a[i] ?? 0
      const z = a[i + 2] ?? 0
      a[i] = x * c + z * s
      a[i + 2] = -x * s + z * c
    }
  }
  return out
}

/** A floor: a disc with thickness, closed top and bottom. */
function discMesh(radius: number, y: number, thickness: number, facets: number): MeshData {
  const mesh = emptyMesh()
  const half = thickness / 2
  for (const [level, dir] of [
    [y + half, 1],
    [y - half, -1],
  ] as const) {
    const centre = mesh.positions.length / 3
    mesh.positions.push(0, level, 0)
    mesh.normals.push(0, dir, 0)
    mesh.uvs.push(0, 0)
    for (let k = 0; k <= facets; k++) {
      const a = (k / facets) * Math.PI * 2
      mesh.positions.push(Math.cos(a) * radius, level, Math.sin(a) * radius)
      mesh.normals.push(0, dir, 0)
      mesh.uvs.push(Math.cos(a) * radius, Math.sin(a) * radius)
    }
    for (let k = 0; k < facets; k++) {
      if (dir > 0) mesh.indices.push(centre, centre + 1 + k, centre + 2 + k)
      else mesh.indices.push(centre, centre + 2 + k, centre + 1 + k)
    }
  }
  // The rim, so the floor reads as a board and not as a sheet of paper.
  const rim = mesh.positions.length / 3
  for (let k = 0; k <= facets; k++) {
    const a = (k / facets) * Math.PI * 2
    const nx = Math.cos(a)
    const nz = Math.sin(a)
    mesh.positions.push(nx * radius, y + half, nz * radius)
    mesh.normals.push(nx, 0, nz)
    mesh.uvs.push((k / facets) * radius * Math.PI * 2, 0)
    mesh.positions.push(nx * radius, y - half, nz * radius)
    mesh.normals.push(nx, 0, nz)
    mesh.uvs.push((k / facets) * radius * Math.PI * 2, thickness)
  }
  for (let k = 0; k < facets; k++) {
    const a = rim + k * 2
    mesh.indices.push(a, a + 1, a + 3, a, a + 3, a + 2)
  }
  return mesh
}

/**
 * A hoop: a torus, built from its own geometry rather than swept.
 *
 * Sweeping a tube round a closed circle leaves a seam. `tubeMesh` takes the
 * frame at each station from the tangent between its neighbours, and the first
 * and last stations have no neighbour on one side, so the ring there lands at
 * a slightly different phase from every other ring. On a rectangular house
 * nothing notices. Here the seam sits at one bearing and the radial check
 * turns the house onto itself and finds a dozen points where the seam used to
 * be and no longer is — which is the check being right about a real defect in
 * the mesh rather than in the building.
 *
 * Built directly there is no seam, because there is no first station.
 */
function hoopMesh(radius: number, y: number, section: number, facets: number): MeshData {
  const mesh = emptyMesh()
  const radial = 6
  for (let j = 0; j <= facets; j++) {
    const phi = (j / facets) * Math.PI * 2
    const cx = Math.cos(phi)
    const cz = Math.sin(phi)
    for (let k = 0; k <= radial; k++) {
      const theta = (k / radial) * Math.PI * 2
      const nx = cx * Math.cos(theta)
      const nz = cz * Math.cos(theta)
      const ny = Math.sin(theta)
      mesh.positions.push((radius + section * Math.cos(theta)) * cx, y + section * ny, (radius + section * Math.cos(theta)) * cz)
      mesh.normals.push(nx, ny, nz)
      mesh.uvs.push((j / facets) * radius * Math.PI * 2, (k / radial) * section * Math.PI * 2)
    }
  }
  const stride = radial + 1
  for (let j = 0; j < facets; j++) {
    for (let k = 0; k < radial; k++) {
      const a = j * stride + k
      mesh.indices.push(a, a + stride, a + stride + 1, a, a + stride + 1, a + 1)
    }
  }
  return mesh
}

/* ── The cone's frame ─────────────────────────────────────────────────── */

export interface RoofFrameResult {
  readonly parts: readonly Part[]
  readonly joints: readonly Joint[]
}

const RAFTER_DIMS: readonly DimKey[] = [
  'raftersPerSegment',
  'rafterRadius',
  'baseRadius',
  'apexRise',
  'coneBelly',
  'thatchToGround',
]

export function buildRoofFrame(layout: Layout): RoofFrameResult {
  const parts: Part[] = []
  const joints: Joint[] = []
  const count = layout.rafterCount

  /*
   * One rafter is swept and the rest are that rafter turned.
   *
   * Not swept twenty-four times. Two tubes along paths that are rotations of
   * one another are rotated *surfaces* and are not rotated *vertex sets* — the
   * section frame takes its phase from the tangent, so the rings land at
   * different angles round the same circle, and the symmetry check sees
   * hundreds of orphans. The rumah gadang taught this once already, with two
   * gonjong instead of twenty-four rafters.
   */
  const base = tubeMesh(
    // The pole rests *on* the ground rather than centred in it: a tube swept
    // along a profile that starts at zero puts half its section below grade,
    // and the build-order check counts that as buried.
    layout.profile.map((p) => [p.r, Math.max(p.y, DIMS.rafterRadius.value), 0] as Vec3),
    () => DIMS.rafterRadius.value,
    // Even, so the ring itself is symmetric about the plane it is drawn in.
    // An odd count would leave the base rafter unmirrorable and take the whole
    // roof with it.
    8,
    0.4,
  )

  for (let k = 0; k < count; k++) {
    const angle = (k / count) * Math.PI * 2
    parts.push(
      meshPart(
        `kasau-${k}`,
        { name: 'kasau', nameId: 'Kasau', nameEn: 'Rafter' },
        'kerangka-atap',
        k,
        'kayu',
        RAFTER_DIMS,
        rotateY(base, angle),
      ),
    )
    // Every rafter meets the head of the centre post. There is no ridge for
    // them to meet on, so they meet on the post itself.
    const grip = Math.min(DIMS.rafterRadius.value * 2, layout.centrePostSection) * DIMS.jointEngagement.value
    joints.push({
      id: `pasak-kasau-${k}`,
      kind: 'pasak',
      mortise: 'tiang-tengah',
      tenon: `kasau-${k}`,
      at: [0, layout.apexY - DIMS.rafterRadius.value, 0],
      halfExtents: [grip / 2, DIMS.rafterRadius.value * DIMS.jointEngagement.value, grip / 2],
    })
  }

  /* The hoops, one at each floor, which is what the floors will bear on. */
  const hoopDims: readonly DimKey[] = ['ringDepth', 'ringWidth', 'luturRise', 'storeyRise', 'baseRadius', 'apexRise', 'facets']
  const facets = layout.facets
  layout.levels.forEach((level, i) => {
    parts.push(
      meshPart(
        `pengikat-${level.key}`,
        { name: 'pengikat', nameId: `Pengikat, ${level.name}`, nameEn: `Tie hoop at the ${level.name}` },
        'pengikat',
        i,
        'bambu',
        hoopDims,
        hoopMesh(level.radius, level.y, DIMS.ringWidth.value, facets),
      ),
    )
  })

  return { parts, joints }
}

/**
 * A shape in the vertical plane, extruded a short way across it.
 *
 * The partitions and the door frame are both flat things standing on a bearing,
 * so both are built at bearing zero and turned into place — which also keeps
 * them exactly rotatable, the way the rafters are.
 */
function extruded(points: readonly (readonly [number, number])[], thickness: number): MeshData {
  const mesh = emptyMesh()
  const n = points.length
  const half = thickness / 2
  for (const side of [1, -1] as const) {
    const base = mesh.positions.length / 3
    for (const p of points) {
      mesh.positions.push(p[0], p[1], side * half)
      mesh.normals.push(0, 0, side)
      mesh.uvs.push(p[0], p[1])
    }
    for (let i = 1; i < n - 1; i++) {
      if (side > 0) mesh.indices.push(base, base + i, base + i + 1)
      else mesh.indices.push(base, base + i + 1, base + i)
    }
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    mesh.indices.push(i, n + i, j, j, n + i, n + j)
  }
  computeNormals(mesh)
  return mesh
}

/* ── Inside the cone ──────────────────────────────────────────────────── */

export function buildInterior(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const facets = layout.facets
  const floorDims: readonly DimKey[] = [
    'luturRise',
    'storeyRise',
    'floorThickness',
    'floorBoardWidth',
    'baseRadius',
    'apexRise',
    'fiveLevels',
  ]

  layout.levels.forEach((level, i) => {
    parts.push(
      meshPart(
        `lantai-${level.key}`,
        {
          name: level.name,
          nameId: `Lantai ${level.name}`,
          nameEn: `The ${level.name} floor`,
        },
        'lantai',
        i,
        'papan',
        floorDims,
        discMesh(level.radius, level.y, DIMS.floorThickness.value, facets),
      ),
    )
  })

  /*
   * The partitions: one boundary per household, run from the centre outward.
   *
   * The first parts in this project to be turned about the vertical axis. All
   * three earlier houses are boxes on an orthogonal grid and only ever needed
   * to tip a member about X or Z; a radial plan needs Y, and the invariant
   * suite's exact rotated bounds handle it without being told.
   */
  const lutur = layout.levels[0]
  const partitionDims: readonly DimKey[] = [
    'partitionThickness',
    'partitionHeight',
    'postRadiusShare',
    'baseRadius',
    'segmentPerHousehold',
  ]
  if (lutur) {
    const inner = layout.centrePostSection / 2
    const top = lutur.y + DIMS.partitionHeight.value

    /*
     * The outer edge follows the cone, because the cone is what it meets.
     *
     * These were rectangles: the same length at every height, run out to the
     * radius of the floor they stand on. The floor is the widest the building
     * gets at that level and the roof closes in above it, so by the top of a
     * partition the wall was half a metre outside the roof and standing
     * through the thatch. A render showed it as slits round the base.
     *
     * A box cannot do this. Anything whose outer edge has to follow a curve
     * has to be a shape rather than a size.
     */
    const outline: (readonly [number, number])[] = [[inner, lutur.y]]
    const steps = 8
    for (let i = 0; i <= steps; i++) {
      const y = lutur.y + ((top - lutur.y) * i) / steps
      outline.push([radiusAtHeight(layout.profile, y), y])
    }
    outline.push([inner, top])
    const wall = extruded(outline, DIMS.partitionThickness.value)

    layout.segmentAngles.forEach((a, k) => {
      parts.push(
        meshPart(
          `sekat-${k}`,
          {
            name: 'sekat',
            nameId: `Sekat keluarga ${k + 1}`,
            nameEn: `Household partition ${k + 1}`,
          },
          'sekat',
          k,
          'papan',
          partitionDims,
          rotateY(wall, a),
        ),
      )
    })

    /* The hearth at the centre, which every household sits around. */
    parts.push(
      meshPart(
        'tungku',
        { name: 'tungku', nameId: 'Tungku', nameEn: 'Hearth' },
        'sekat',
        layout.segmentAngles.length,
        'batu',
        ['hearthRadius', 'hearthDepth', 'luturRise', 'floorThickness'],
        discMesh(
          DIMS.hearthRadius.value,
          lutur.y + DIMS.floorThickness.value,
          DIMS.floorThickness.value * DIMS.hearthDepth.value,
          facets,
        ),
      ),
    )

    /*
     * The drum, and only in the house that holds it.
     *
     * The switch this pack has instead of a scale or a grade: every mbaru
     * niang in a village is the same building, and one of them has this in it.
     * Absence is the statement, as it is for the Bodi Caniago floor and for a
     * joglo with no pendhapa.
     */
    if (layout.drum.present) {
      const path: Vec3[] = [
        [-DIMS.drumLength.value / 2, layout.drum.y, 0],
        [DIMS.drumLength.value / 2, layout.drum.y, 0],
      ]
      parts.push(
        meshPart(
          'gendang',
          { name: 'gendang', nameId: 'Gendang', nameEn: 'The drum' },
          'sekat',
          layout.segmentAngles.length + 1,
          'kayu',
          ['drumRadius', 'drumLength', 'drumHang', 'oneGendang', 'partitionHeight', 'luturRise'],
          tubeMesh(path, () => layout.drum.radius, 12, 0.4),
        ),
      )
    }
  }

  return parts
}

/* ── Thatch ───────────────────────────────────────────────────────────── */

/**
 * The course layout, from the core.
 *
 * `f` there runs 0 at the ridge and 1 at the eave; the cone runs 0 at the
 * ground and 1 at the apex, so a course arrives flipped. Same flip the joglo
 * makes, and the fourth house to use the same arithmetic — which is now good
 * evidence that `courseBands` was extracted for lapping rather than for any
 * one roof shape.
 */
export function thatchBands(layout: Layout): readonly CourseBand[] {
  return courseBands(layout.thatchCourses, DIMS.thatchLap.value)
}

export function buildThatch(layout: Layout): readonly Part[] {
  const parts: Part[] = []
  const bed = DIMS.rafterRadius.value + DIMS.thatchBed.value
  const thickness = DIMS.thatchThickness.value
  const facets = layout.facets
  const dims: readonly DimKey[] = [
    'thatchCourseDepth',
    'thatchThickness',
    'thatchLap',
    'thatchBed',
    'rafterRadius',
    'thatchToGround',
  ]
  let order = 0
  const door = doorOpening(layout)

  for (const band of thatchBands(layout)) {
    const from = 1 - band.foot
    const to = 1 - band.head
    const span = Math.max(1e-6, to - from)
    /*
     * The courses the door reaches into stop short of bearing zero and pick up
     * again on the far side. Without this the ijuk closes over the doorway and
     * the frame stands behind an unbroken roof — which is what it did, and
     * `checkOneDoor` passed the whole time because it counted three pieces of
     * timber and never asked whether anything was open behind them.
     */
    const opens = from < door.fTop
    parts.push(
      meshPart(
        opens ? `ijuk-pintu-${band.course}` : `ijuk-${band.course}`,
        {
          name: 'ijuk',
          nameId: `Lapis ijuk ${band.course + 1}`,
          nameEn: `Thatch course ${band.course + 1}`,
        },
        'ijuk',
        order++,
        'ijuk',
        dims,
        coneSurface(layout.profile, {
          facets,
          uvScale: 0.5,
          fFrom: from,
          fTo: to,
          ...(opens ? { gap: door.gap } : {}),
          // Flush at the head, standing proud at the foot: the step between
          // courses is the shadow line, and on a cone it rings the building.
          offsetAt: (f) => bed + thickness * (1 - clamp01((f - from) / span)),
        }),
      ),
    )
  }

  return parts
}

/** The ornament at the apex, where every rafter meets. */
export function buildFinial(layout: Layout): readonly Part[] {
  const top = layout.apexY
  const profile = [
    { r: DIMS.finialRadius.value, y: top },
    { r: DIMS.finialRadius.value * DIMS.finialWaist.value, y: top + DIMS.finialRise.value * DIMS.finialWaistRise.value },
    { r: 0, y: top + DIMS.finialRise.value },
  ]
  return [
    meshPart(
      'puncak',
      { name: 'puncak', nameId: 'Hiasan puncak', nameEn: 'Apex ornament' },
      'puncak',
      0,
      'kayu',
      ['finialRise', 'finialRadius', 'finialWaist', 'finialWaistRise', 'finialCollar', 'apexRise', 'ringWidth'],
      mergeMeshes([
        coneSurface(profile, { facets: layout.facets, uvScale: 0.4 }),
        hoopMesh(
          DIMS.finialRadius.value,
          top + DIMS.finialRise.value * DIMS.finialCollar.value,
          DIMS.ringWidth.value,
          layout.facets,
        ),
      ]),
    ),
  ]
}

export { coneRun, coneAt, lerp, computeNormals }
