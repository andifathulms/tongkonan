/**
 * What the renderer needs to know about a rumah kaki seribu.
 *
 * `underfloorHeight` reports a metre and a half, which is the second-lowest
 * of the raised houses here — and the number is misleading on its own, which
 * is worth saying. On the omo the understorey is the subject and it is tall;
 * here the understorey is *also* the subject and it is short. The difference
 * is not in how much space there is but in what is in it: a forest of poles
 * doing the opposite job to the omo's diagonals. A field that reports a
 * clearance cannot carry that, and the zone gloss does it instead.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'kaki',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'kolong — kerumunan kaki',
      nameEn: 'the understorey — the crowd of legs',
      glossId:
        'Ratusan batang kecil, masing-masing miring sendiri-sendiri, tidak diikat satu sama lain dan tidak ditanam. Ketika tanah bergoyang, kaki-kaki ini ikut bergoyang. Omo Nias menjawab persoalan yang sama dengan menyegitigakan setiap petaknya; rumah ini menjawabnya dengan tidak menyilangkan apa pun.',
      glossEn:
        'Hundreds of small poles, each leaning its own way, tied to nothing and buried in nothing. When the ground moves, these move with it. The Nias omo answers the same problem by triangulating every bay; this house answers it by bracing nothing at all.',
    },
    {
      key: 'badan',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: layout.divided ? 'badan — dua sisi dan satu lorong' : 'badan',
      nameEn: layout.divided ? 'the body — two sides and a passage' : 'the body',
      glossId: layout.divided
        ? 'Rumah marga: terbagi dua memanjang, sisi laki-laki dan sisi perempuan, dengan lorong di tengah. Dari luar tidak terlihat.'
        : 'Rumah keluarga, tidak dibagi. Dari luar tidak ada bedanya dengan rumah marga.',
      glossEn: layout.divided
        ? 'A clan house: divided lengthwise into a men’s side and a women’s side with a passage between. None of it shows from outside.'
        : 'A family house, undivided. From outside there is nothing to tell it from a clan house.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Pelana beralang-alang. Tidak ada yang khusus di sini — yang membuat rumah ini ada di bawah lantainya.',
      glossEn: 'A thatched gable. Nothing here is remarkable — what makes this house is under its floor.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: layout.eaveHalfX, z: layout.eaveHalfZ },
    ridgeReach: Math.max(layout.eaveHalfX, layout.eaveHalfZ),
    weatherTop: topY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, topY],
    zones: zones(layout, topY),
    figureAt: [layout.eaveHalfX + 1.4, 0, layout.doorZ],
  }
}
