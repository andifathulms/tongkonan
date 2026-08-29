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

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
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


/**
 * The clearing.
 *
 * A rumah kaki seribu stands on ground cut out of a wooded slope, and the
 * hundreds of unbraced legs are an answer to that ground. A circle of cleared
 * earth is the least this can say and still say something: the house is not
 * on a plain, it is in an opening.
 *
 * Interpolated against nothing, like every other figure in this pack, and the
 * pack says so at the front. The forest itself is not drawn — a wall of
 * guessed trees would be scenery, and this project does not do scenery.
 */
function site(layout: Layout): readonly SiteMark[] {
  const radius = Math.max(DIMS.clearingRadius.value, layout.eaveHalfX + 4)
  /*
   * Stumps at the edge, and no forest.
   *
   * The house stands on ground that was cut out of woodland, and a stump says
   * that in one object. A wall of guessed trees would be scenery — the thing
   * this whole layer was accepted on the condition of not being.
   */
  const stumpH = DIMS.stumpHeight.value
  const stumpW = DIMS.stumpWidth.value
  const count = Math.round(DIMS.stumpCount.value)
  const volumes: SiteVolume[] = []
  const setback = DIMS.stumpSetback.value
  for (let i = 0; i < count; i++) {
    /*
     * Spread by the golden angle so they do not fall into a ring of evenly
     * spaced posts, which would read as a fence — the same problem the legs of
     * this house solve by leaning, and solved the same way: deterministically,
     * because `Math.random` would give a different clearing on every load.
     */
    const a = (i * Math.PI * (3 - Math.sqrt(5))) % (Math.PI * 2)
    const r = radius - setback * (1 + (i % 3) / 2)
    volumes.push({
      kind: 'cylinder',
      at: [Math.cos(a) * r, 0, Math.sin(a) * r],
      size: [stumpW, stumpH, stumpW],
      material: 'kayu',
    })
  }

  return [
    {
      key: 'bukaan',
      nameId: 'Lahan terbuka',
      nameEn: 'The clearing',
      glossId:
        'Tepi lahan yang dibuka di lereng berhutan. Kaki-kaki yang tak berpengaku itu adalah jawaban atas tanah ini. Hutannya tidak digambar: sederet pohon terkaan adalah pemandangan, dan projek ini tidak menggambar pemandangan.',
      glossEn:
        'The edge of the ground cleared on a wooded slope. The unbraced legs are an answer to this ground. The forest is not drawn: a row of guessed trees is scenery, and this project does not do scenery.',
      lines: [groundRing(0, 0, radius)],
      closed: true,
      volumes,
      provenance: 'interpolated',
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
    site: site(layout),
    approachAt: [layout.eaveHalfX + DIMS.clearingRadius.value * 0.35, 0, layout.doorZ],
    figureAt: [layout.eaveHalfX + 1.4, 0, layout.doorZ],
  }
}
