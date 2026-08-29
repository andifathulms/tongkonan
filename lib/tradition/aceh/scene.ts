/**
 * What the renderer needs to know about a rumoh Aceh.
 *
 * `ridgeAxis` is the interesting field here and it is the same field it always
 * was: 2, meaning the ridge runs on Z. What is new is the reason — on every
 * other house that axis is a fact about the building, and on this one it is a
 * doctrine. The renderer is not told which, and should not be: it cuts the
 * section on the axis the ridge does not run along, exactly as before.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { houseWidth } from './frame'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'yup',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'kolong',
      nameEn: 'the underfloor',
      glossId:
        'Ruang di bawah lantai, tinggi dan terpakai: tempat menenun, menumbuk, menyimpan, dan bekerja di tempat teduh.',
      glossEn:
        'The space under the floor, high and in use: weaving, pounding rice, storage, and work in the shade.',
    },
    {
      key: 'rumoh',
      fromY: layout.floorY,
      toY: layout.plateY,
      nameId: 'tiga bagian',
      nameEn: 'the three parts',
      glossId: `Seuramoë keuë, tungai yang ditinggikan ${layout.raise.toFixed(2)} m, dan seuramoë likôt. Urutan ini bukan tangga kedudukan melainkan urutan seberapa dekat seseorang boleh masuk — dan yang paling tinggi adalah yang paling tertutup.`,
      glossEn: `The seuramoë keuë, the tungai raised ${layout.raise.toFixed(2)} m, and the seuramoë likôt. The sequence is not a staircase of rank but an order of how far in a person may come — and the highest part is the most closed.`,
    },
    {
      key: 'bubong',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Atap rumbia di atas bubungan yang membujur timur–barat.',
      glossEn: 'Sago thatch over a ridge that lies east–west.',
    },
  ]
}

/**
 * The yard, with the line the house is turned by drawn on it.
 *
 * The site figure here is a bearing rather than a thing: a line running east
 * and west through the house, which is what the building is oriented to. There
 * is nothing at either end of it — the direction is the point, and the place it
 * points to is four thousand miles away.
 */
function site(layout: Layout): readonly SiteMark[] {
  const width = houseWidth(layout)
  const reach = layout.length / 2 + DIMS.bayLength.value * 2
  const volumes: SiteVolume[] = []
  return [
    {
      key: 'kiblat',
      nameId: 'Garis timur–barat',
      nameEn: 'The east–west line',
      glossId:
        'Garis yang menjadi arah rumah ini, ditarik menembus panjangnya. Tidak ada apa pun di kedua ujungnya: arahnyalah yang menjadi pokok, dan tempat yang dituju berada ribuan kilometer dari sini. Sembilan belas bangunan lain dalam projek ini diarahkan oleh sesuatu yang dapat dilihat dari halamannya sendiri.',
      glossEn:
        'The line this house is turned by, drawn through its length. There is nothing at either end of it: the direction is the point, and the place it points to is thousands of kilometres away. The other nineteen buildings in this project are turned by something you can see from their own yard.',
      lines: [
        [
          [0, -reach],
          [0, reach],
        ],
        groundRect(-width / 2 - 1, -layout.length / 2 - 1, width / 2 + 1, layout.length / 2 + 1),
      ],
      closed: false,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const width = houseWidth(layout)
  return {
    // The ridge runs east–west, which in these axes is Z.
    ridgeAxis: 2,
    footprint: { x: width, z: layout.length },
    drip: { x: width / 2 + layout.eaveOversail, z: layout.length / 2 + layout.eaveOversail },
    ridgeReach: layout.length / 2 + layout.eaveOversail,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the foot of the ladder, which comes up the front veranda's side.
    approachAt: [-width / 2 - DIMS.treadDepth.value * 12, 0, 0],
    figureAt: [-width / 2 - 1.6, 0, layout.length * 0.25],
  }
}
