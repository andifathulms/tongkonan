/**
 * The waruga, from the base slab to the lid.
 *
 * Four solids and one joint, which makes this the shortest builder in the
 * project by a wide margin. That is not a simplification: a waruga is a base,
 * a box, a lid and a face, and there is nothing else to build.
 *
 * The chamber inside the box is not modelled as a void — this project has no
 * subtraction and does not need one here — so the box is built as four walls
 * and a floor cut from the same block, which is what the stone actually
 * becomes. The chamber is the space they leave.
 *
 * Axes as everywhere else: X runs front to rear and the face is on −X, which
 * is north.
 */

import { partBuilders } from '@/lib/core/parts'
import { DIMS } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, Part, Rules, WarugaKinds } from './types'

const builders = partBuilders<WarugaKinds>()
const box = builders.box

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const clear = DIMS.bodyClearance.value
  const halfX = DIMS.seatedDepth.value / 2 + clear
  const halfZ = DIMS.shoulderWidth.value / 2 + clear
  /*
   * The chamber holds one seated body, and rises for every further one.
   *
   * The first occupant sets the height; each of the family who follows adds a
   * layer. That is why a tomb has to be cut deep on the day it is made — for
   * people who are not dead yet — and why the limit it runs into is the size
   * of the stone rather than the size of the family.
   */
  const height = DIMS.seatedHeight.value + clear + DIMS.layerRise.value * (rules.jumlah - 1)

  const wall = DIMS.wallThickness.value
  const floor = DIMS.floorThickness.value
  const baseHeight = rules.alas ? DIMS.baseHeight.value : 0

  return {
    rules,
    chamber: { halfX, halfZ, height, floorY: baseHeight + floor },
    block: { halfX: halfX + wall, halfZ: halfZ + wall, height: floor + height },
    blockLimit: DIMS.blockLimit.value,
    base: { present: rules.alas, height: baseHeight, margin: DIMS.baseMargin.value },
    lid: {
      form: rules.tutup,
      rise: DIMS.lidRise.value,
      overhang: DIMS.lidOverhang.value,
      y: baseHeight + floor + height,
    },
    body: {
      seated: DIMS.seatedHeight.value,
      depth: DIMS.seatedDepth.value,
      width: DIMS.shoulderWidth.value,
    },
    dims: [],
  }
}

/* ── The build ────────────────────────────────────────────────────────── */

const BOX_DIMS: readonly DimKey[] = [
  'seatedHeight',
  'seatedDepth',
  'shoulderWidth',
  'bodyClearance',
  'layerRise',
  'wallThickness',
  'sizedByASeatedBody',
  'cutFromOneBlock',
]

export function buildTomb(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const wall = DIMS.wallThickness.value
  const floor = DIMS.floorThickness.value

  /* The base slab, where the family used one. */
  if (layout.base.present) {
    parts.push(
      box(
        'alas',
        { name: 'alas', nameId: 'Alas', nameEn: 'Base slab' },
        'alas',
        0,
        'batu',
        ['baseHeight', 'baseMargin', 'cutFromOneBlock'],
        [0, layout.base.height / 2, 0],
        [
          (layout.block.halfX + layout.base.margin) * 2,
          layout.base.height,
          (layout.block.halfZ + layout.base.margin) * 2,
        ],
      ),
    )
  }

  /* The floor of the chamber, cut from the same block as its walls. */
  parts.push(
    box(
      'dasar',
      { name: 'dasar', nameId: 'Dasar peti', nameEn: 'Floor of the box' },
      'peti',
      0,
      'batu',
      ['floorThickness', 'cutFromOneBlock'],
      [0, layout.base.height + floor / 2, 0],
      [layout.block.halfX * 2, floor, layout.block.halfZ * 2],
    ),
  )

  /*
   * Four walls, and the chamber is what they leave.
   *
   * The north wall is the face: on a real waruga it carries the carving that
   * records what the person did, and that carving is not modelled — an absence
   * stated in the caution rather than a guessed relief.
   */
  const sides: readonly { id: string; nameId: string; nameEn: string; centre: [number, number]; size: [number, number] }[] = [
    {
      id: 'muka',
      nameId: 'Muka (utara)',
      nameEn: 'The face, to the north',
      centre: [-(layout.chamber.halfX + wall / 2), 0],
      size: [wall, layout.block.halfZ * 2],
    },
    {
      id: 'belakang',
      nameId: 'Dinding belakang',
      nameEn: 'Rear wall',
      centre: [layout.chamber.halfX + wall / 2, 0],
      size: [wall, layout.block.halfZ * 2],
    },
    {
      id: 'sisi-a',
      nameId: 'Dinding samping',
      nameEn: 'Side wall',
      centre: [0, layout.chamber.halfZ + wall / 2],
      size: [layout.chamber.halfX * 2, wall],
    },
    {
      id: 'sisi-b',
      nameId: 'Dinding samping',
      nameEn: 'Side wall',
      centre: [0, -(layout.chamber.halfZ + wall / 2)],
      size: [layout.chamber.halfX * 2, wall],
    },
  ]
  sides.forEach((side, i) => {
    parts.push(
      box(
        side.id,
        { name: 'dinding', nameId: side.nameId, nameEn: side.nameEn },
        side.id === 'muka' ? 'muka' : 'peti',
        side.id === 'muka' ? 0 : i + 1,
        'batu',
        side.id === 'muka' ? [...BOX_DIMS, 'facesNorth'] : BOX_DIMS,
        [side.centre[0], layout.chamber.floorY + layout.chamber.height / 2, side.centre[1]],
        [side.size[0], layout.chamber.height, side.size[1]],
      ),
    )
  })

  /*
   * The lid: a roof over a room nobody enters.
   *
   * Two forms, and both are the shape of a house. It sits in a rebate cut for
   * it and is lifted out again at every death — the only joint in this
   * building, and the only opening it has.
   */
  const lidHalfX = layout.block.halfX + layout.lid.overhang
  const lidHalfZ = layout.block.halfZ + layout.lid.overhang
  const seat = DIMS.lidSeat.value
  parts.push(
    box(
      'tutup-dasar',
      { name: 'tutup', nameId: 'Bibir tutup', nameEn: 'Lid seating' },
      'tutup',
      0,
      'batu',
      ['lidSeat', 'lidOverhang', 'cutFromOneBlock'],
      [0, layout.lid.y - seat / 2, 0],
      [lidHalfX * 2, seat, lidHalfZ * 2],
    ),
  )
  if (layout.lid.form === 'pelana') {
    /* A gable: courses narrowing to a ridge that runs front to back. */
    const steps = 4
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps
      const h = layout.lid.rise / steps
      parts.push(
        box(
          `tutup-${k}`,
          { name: 'tutup', nameId: 'Tutup pelana', nameEn: 'Gabled lid' },
          'tutup',
          1 + k,
          'batu',
          ['lidRise', 'lidOverhang'],
          [0, layout.lid.y - seat + h * (k + 0.5), 0],
          [lidHalfX * 2, h, lidHalfZ * 2 * (1 - t * 0.92)],
        ),
      )
    }
  } else {
    /* A hip: courses narrowing on both axes to a point. */
    const steps = 4
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps
      const h = layout.lid.rise / steps
      parts.push(
        box(
          `tutup-${k}`,
          { name: 'tutup', nameId: 'Tutup limas', nameEn: 'Hipped lid' },
          'tutup',
          1 + k,
          'batu',
          ['lidRise', 'lidOverhang'],
          [0, layout.lid.y - seat + h * (k + 0.5), 0],
          [lidHalfX * 2 * (1 - t * 0.85), h, lidHalfZ * 2 * (1 - t * 0.85)],
        ),
      )
    }
  }

  joints.push({
    id: 'tumpang-tutup',
    kind: 'tumpang',
    mortise: 'belakang',
    tenon: 'tutup-dasar',
    at: [layout.chamber.halfX + wall / 2, layout.lid.y - seat / 2, 0],
    halfExtents: [wall / 3, seat / 3, layout.block.halfZ / 2],
  })

  return { parts, joints }
}
