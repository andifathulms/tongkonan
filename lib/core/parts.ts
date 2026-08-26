/**
 * The two ways to be a part.
 *
 * Both generators had these, identical but for the type they were bound to.
 * They are here now, bound to a tradition once at the point of use.
 *
 * Boxes stay boxes because the joint invariant needs an exact extent to test
 * against; anything that cannot be a box carries its own triangles.
 */

import type { MeshData } from './geometry'
import type { Kinds } from './kinds'
import type { BoxPart, MeshPart, Vec3 } from './types'

export interface Naming {
  /** the local name of the piece, used in every locale */
  readonly name: string
  readonly nameId: string
  readonly nameEn: string
}

/**
 * `dims` is not optional and not decorative on either builder:
 * `checkPartProvenance` fails the build on an empty list, because a part that
 * claims to come from nowhere is a guess the provenance bar never counted.
 */
export function partBuilders<K extends Kinds>() {
  const box = (
    id: string,
    naming: Naming,
    stage: K['stage'],
    order: number,
    material: K['material'],
    dims: readonly K['dim'][],
    center: Vec3,
    size: Vec3,
    rotation?: Vec3,
  ): BoxPart<K> =>
    rotation
      ? { kind: 'box', id, ...naming, stage, order, material, dims, center, size, rotation }
      : { kind: 'box', id, ...naming, stage, order, material, dims, center, size }

  const mesh = (
    id: string,
    naming: Naming,
    stage: K['stage'],
    order: number,
    material: K['material'],
    dims: readonly K['dim'][],
    data: MeshData,
  ): MeshPart<K> => ({
    kind: 'mesh',
    id,
    ...naming,
    stage,
    order,
    material,
    dims,
    positions: data.positions,
    normals: data.normals,
    uvs: data.uvs,
    indices: data.indices,
  })

  return { box, mesh }
}
