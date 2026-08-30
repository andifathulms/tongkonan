/**
 * What the renderer needs to know about a khaim.
 *
 * `underfloorHeight` finally reports what the field was named for and has
 * never quite meant: habitable-looking empty air under a raised floor. Ten
 * meanings in, and the eleventh is the plain one — except that here the space
 * is emphatically *not* habitable, because the whole point is that nobody and
 * nothing is under it. It is also, by a long way, the largest number the field
 * has ever carried.
 *
 * The zones are a void, a room and a roof. The first band contains nothing at
 * all, which no other building's does — on every other house here the lowest
 * band is a storey, a store, a byre or a plinth.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'bawah',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'udara di bawah lantai',
      nameEn: 'the air under the floor',
      glossId: `${layout.floorY.toFixed(1)} m yang sengaja dibiarkan kosong. Pada dua puluh tiga bangunan lain di sini, pita paling bawah berisi sesuatu — kolong, kandang, lumbung, tapakan. Yang ini berisi tidak ada apa-apa, dan justru itulah maksud bangunannya: rumah didirikan di luar jangkauan.`,
      glossEn: `${layout.floorY.toFixed(1)} m deliberately left empty. On the other twenty-three buildings here the lowest band holds something — an understorey, a byre, a store, a plinth. This one holds nothing, and that is the point of the building: a house put out of reach.`,
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.wallTop,
      nameId: 'ruang',
      nameEn: 'the room',
      glossId: `Satu ruang dengan satu sekat: sisi perempuan dan sisi laki-laki, masing-masing dengan perapian sendiri dan tangga sendiri. ${layout.hearths.length} api tergantung pada lubangnya masing-masing, dan tiap satunya dapat diputus dan dijatuhkan.`,
      glossEn: `One room with one partition: a women’s side and a men’s side, each with its own hearth and its own ladder. ${layout.hearths.length} fires hang in their openings, and every one of them can be cut loose and dropped.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Daun sagu di atas rangka ringan — dan pada rumah yang memakai pohon hidup, batang wanbon menembusnya dan terus tumbuh di atasnya.',
      glossEn: 'Sago leaf on a light frame — and on a house standing on a living tree, the wanbon comes through it and goes on growing above.',
    },
  ]
}

/**
 * The clearing, and it is a distance rather than an arrangement.
 *
 * Every other site figure in this collection places something: a barn, a
 * fence, a street, a grave, a road. This one places nothing — it is the radius
 * within which the forest was taken down, so that no tree can fall on the
 * house and no tree can be climbed to reach it. The stumps are what is left of
 * that work and are the only things standing in it.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = layout.clearing
  const volumes: SiteVolume[] = []
  const stump = DIMS.stumpRadius.value
  const at: readonly (readonly [number, number])[] = [
    [-r * 0.62, -r * 0.44],
    [r * 0.55, -r * 0.66],
    [-r * 0.7, r * 0.5],
    [r * 0.68, r * 0.38],
    [r * 0.2, -r * 0.8],
  ]
  for (const [x, z] of at) {
    volumes.push({
      kind: 'cylinder',
      at: [x, 0, z],
      size: [stump * 2, stump * 1.6, stump * 2],
      material: 'kayu',
    })
  }
  return [
    {
      key: 'tanah-lapang',
      nameId: 'Tanah yang dibuka',
      nameEn: 'The cleared ground',
      glossId: `Hutan ditebang sejauh ${r.toFixed(0)} m di sekeliling rumah, supaya tidak ada pohon yang dapat tumbang menimpanya dan tidak ada yang dapat dipanjat orang untuk mencapainya. Ini satu-satunya gambar tapak dalam kumpulan ini yang tidak menaruh apa pun: ia sebuah jarak, dan tunggul-tunggul itu sisa pekerjaannya.`,
      glossEn: `The forest is taken down for ${r.toFixed(0)} m around the house, so that no tree can fall on it and none can be climbed to reach it. This is the only site figure in the collection that places nothing: it is a distance, and the stumps are what is left of the work.`,
      lines: [groundRing(0, 0, r, 48)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.roofOverhang.value
  return {
    // The ridge runs along Z, across the two sides the partition divides.
    ridgeAxis: 2,
    footprint: { x: layout.floor.halfX * 2, z: layout.floor.halfZ * 2 },
    drip: { x: layout.floor.halfX + over, z: layout.floor.halfZ + over },
    ridgeReach: layout.floor.halfZ + over,
    weatherTop: layout.ridgeY,
    // The largest clearance in the project, and the first that is the point of
    // the building rather than a consequence of it.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the front, at the edge of the cleared ground, where the whole
    // height of the thing is the first fact about it.
    approachAt: [-layout.clearing * 0.8, 0, 0],
    figureAt: [-layout.floor.halfX * 2.2, 0, layout.floor.halfZ * 0.9],
  }
}
