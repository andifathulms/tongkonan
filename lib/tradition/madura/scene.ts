/**
 * What the renderer needs to know about a tanean lanjang — and the first time
 * `SceneModel` genuinely describes only part of its subject.
 *
 * Every field in it was written for one building. `footprint`, `drip`,
 * `ridgeReach`, `weatherTop` and `underfloorHeight` all assume there is one
 * roof to be under and one floor to be on. Here there are nine of each.
 *
 * The honest answers, and they are not all of the same kind:
 *
 * - `footprint` is the whole cluster, because the cluster is the subject.
 * - `drip` and `ridgeReach` are one house's, because water lands off a roof
 *   and there is no such thing as the cluster's eave.
 * - `underfloorHeight` is the plinth, which is the twelfth meaning that field
 *   has carried and the smallest.
 * - `zones` are the bands of a house, and they are the worst fit in the
 *   project. The division that matters here is in plan — yard against houses
 *   against kitchens, west against east — and a stack of horizontal bands
 *   cannot say any of it. The joglo pack made this point about a building that
 *   divides from the centre outward; this is the same complaint one level up,
 *   and the answer is the same: report the bands honestly and put the real
 *   division in the copy rather than bending the field until it lies.
 */

import { groundBox } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'tanean',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'tanean dan lantai bata',
      nameEn: 'the yard and the brick plinth',
      glossId: `Tanah padat setinggi nol, dan lantai bata ${(layout.floorY * 100).toFixed(0)} cm di atasnya. Pembagian yang sesungguhnya pada susunan ini tidak terletak di sini melainkan pada denahnya: halaman, deret rumah di utara, deret dapur di selatan, dan barat melawan timur. Pita mendatar tidak dapat mengatakan satu pun dari itu, dan pita ini mengatakan apa adanya saja.`,
      glossEn: `Beaten earth at zero, and a brick plinth ${(layout.floorY * 100).toFixed(0)} cm above it. The division that matters in this arrangement is not here but in plan: the yard, the row of houses to the north, the kitchens to the south, and west against east. Horizontal bands cannot say any of that, and this one only says what it is.`,
    },
    {
      key: 'ruang',
      fromY: layout.floorY,
      toY: layout.wallTop,
      nameId: 'ruang tidur',
      nameEn: 'the sleeping rooms',
      glossId: `${layout.houses.length} rumah, dan yang dikerjakan di dalamnya pada dasarnya tidur. Selebihnya di halaman.`,
      glossEn: `${layout.houses.length} houses, and what is done inside them is essentially sleeping. The rest is on the yard.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roofs',
      glossId: 'Genteng di atas tiap bangunan, satu bentuk yang sama diulang di sepanjang deret — dan tritisan mukanya menaungi tepi tanean, yaitu tempat orang duduk.',
      glossEn: 'Tiles over every building, one form repeated down the row — and the front overhang shades the edge of the tanean, which is where people sit.',
    },
  ]
}

/**
 * The lane, and the next tanean along it.
 *
 * These clusters stand in a line: one family group, a lane, the next family
 * group. The site figure is the only one in the collection whose volumes are
 * *another instance of the same subject* — not a barn beside a house, but the
 * neighbours' whole arrangement, stated as its langgar and its first house.
 */
function site(layout: Layout): readonly SiteMark[] {
  const lane = layout.lane
  const east = layout.yard.halfZ + lane / 2
  const volumes: SiteVolume[] = []
  const next = east + lane / 2 + DIMS.langgarSide.value
  volumes.push({
    kind: 'gable',
    at: [0, 0, next],
    size: [DIMS.langgarSide.value, layout.wallTop, DIMS.langgarSide.value],
    ridgeAxis: 2,
    material: 'atap',
  })
  volumes.push({
    kind: 'gable',
    at: [-(layout.yard.halfX + DIMS.houseDepth.value / 2), 0, next + DIMS.housePitch.value],
    size: [DIMS.houseDepth.value, layout.wallTop, DIMS.tonghuhWidth.value],
    ridgeAxis: 2,
    material: 'atap',
  })
  return [
    {
      key: 'lorong',
      nameId: 'Lorong dan tanean sebelah',
      nameEn: 'The lane and the next tanean',
      glossId: 'Kelompok-kelompok ini berdiri berderet: satu keluarga, sebuah lorong, keluarga berikutnya. Ini satu-satunya gambar tapak dalam kumpulan ini yang isinya contoh lain dari pokok bahasannya sendiri — bukan lumbung di samping rumah, melainkan seluruh susunan milik tetangga.',
      glossEn: 'These clusters stand in a line: one family, a lane, the next family. It is the only site figure in the collection whose contents are another instance of its own subject — not a granary beside a house, but the neighbours’ whole arrangement.',
      lines: [groundBox(0, east, layout.yard.halfX * 2.8, lane)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  const first = layout.houses[0]
  return {
    // The ridges run along the yard, which is also the way the row grows.
    ridgeAxis: 2,
    // The whole cluster, because the cluster is the building.
    footprint: {
      x: layout.yard.halfX * 2 + DIMS.houseDepth.value + DIMS.dapurDepth.value,
      z: layout.yard.halfZ * 2,
    },
    // One house's, because water lands off a roof and a cluster has no eave.
    drip: { x: (first?.depth ?? DIMS.houseDepth.value) / 2 + over, z: (first?.width ?? 0) / 2 + over },
    ridgeReach: (first?.width ?? 0) / 2 + over,
    weatherTop: topY,
    // A brick plinth: the twelfth meaning of this field, and the smallest.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the east, at the open end, looking down the yard toward the
    // langgar — which is how anybody who is not family arrives.
    approachAt: [0, 0, layout.yard.halfZ + layout.lane],
    figureAt: [0, 0, layout.yard.halfZ * 0.35],
  }
}
