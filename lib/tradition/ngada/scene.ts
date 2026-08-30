/**
 * What the renderer needs to know about a square full of pairs.
 *
 * Two fields read strangely and both say something true.
 *
 * `underfloorHeight` is the height of a bhaga's floor above the ground — the
 * fourteenth meaning of the field, and the first that is a *model's* clearance
 * rather than a building's: nothing is under it because nothing could be.
 *
 * `zones` are the ground, the bodies of the pair, and the caps and ridges over
 * them. They are bands through two objects at once, which no other pack's are,
 * and the honest reading is that the division that matters here is not
 * vertical at all — it is between the two sides of the square.
 *
 * The site figure inverts the usual arrangement of this project: the *houses*
 * are the setting, and the ancestors are the subject.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const pair = layout.pairs[0]
  const bhagaTop = (pair?.bhaga.floorY ?? 0) + DIMS.bhagaBoard.value + DIMS.bhagaWallHeight.value
  return [
    {
      key: 'nua',
      fromY: 0,
      toY: pair?.bhaga.floorY ?? 0.5,
      nameId: 'alun-alun',
      nameEn: 'the square',
      glossId: 'Tanah yang diratakan dan dikeraskan, dan yang menentukan letak segalanya. Rumah-rumah berjajar mengelilinginya; yang berdiri di dalamnya adalah leluhur.',
      glossEn: 'Levelled and paved ground, which decides where everything stands. The houses are ranged around it; what stands in it are the ancestors.',
    },
    {
      key: 'badan',
      fromY: pair?.bhaga.floorY ?? 0.5,
      toY: bhagaTop,
      nameId: 'badan pasangan',
      nameEn: 'the bodies of the pair',
      glossId: `Tiang ngadhu dan rumah kecil bhaga. Pita ini memotong dua benda sekaligus, dan itu memang kejanggalan: pembagian yang berarti di sini bukan tinggi rendah melainkan sisi mana dari alun-alun.`,
      glossEn: `The ngadhu post and the little bhaga house. This band cuts through two objects at once, and the oddness is the point: the division that matters here is not high and low but which side of the square.`,
    },
    {
      key: 'atap',
      fromY: bhagaTop,
      toY: topY,
      nameId: 'topi dan bubungan',
      nameEn: 'the cap and the ridge',
      glossId: 'Topi ijuk di atas tiang, dan bubungan rumah kecil di seberangnya. Tidak ada seorang pun di bawah keduanya.',
      glossEn: 'The thatch cap over the post, and the little ridge across from it. There is nobody under either.',
    },
  ]
}

/**
 * The rows of sa'o, and they are the setting rather than the subject.
 *
 * Everywhere else in this collection the house is the subject and what stands
 * around it is the site. Here the houses of the village are the site figure
 * and what is being modelled is what stands between them. It is the only
 * entry in the project where that is the right way round.
 */
function site(layout: Layout): readonly SiteMark[] {
  const volumes: SiteVolume[] = []
  const depth = 6.4
  const width = 5.2
  const wall = 3.1
  const rows = Math.max(2, layout.pairs.length)
  for (const sx of [-1, 1] as const) {
    for (let i = 0; i < rows; i++) {
      const z = -layout.nua.halfZ + (layout.nua.halfZ * 2 * (i + 0.5)) / rows
      volumes.push({
        kind: 'gable',
        at: [sx * (layout.nua.halfX + depth / 2), 0, z],
        size: [depth, wall, width],
        ridgeAxis: 2,
        material: 'atap',
      })
    }
  }
  return [
    {
      key: 'sao',
      nameId: 'Deret sa’o',
      nameEn: 'The rows of sa’o',
      glossId: 'Rumah-rumah kampung berjajar di kedua sisi alun-alun dan menghadap ke dalam. Di seluruh kumpulan ini rumah adalah pokoknya dan yang di sekelilingnya adalah tapak; hanya di sini urutannya terbalik — yang dimodelkan adalah yang berdiri di antara rumah-rumah itu.',
      glossEn: 'The village houses stand in two rows along the square and face into it. Everywhere else in this collection the house is the subject and what surrounds it is the site; here alone it is the other way round — what is modelled is what stands between the houses.',
      lines: [
        groundRect(-layout.nua.halfX - depth, -layout.nua.halfZ, depth, layout.nua.halfZ * 2),
        groundRect(layout.nua.halfX, -layout.nua.halfZ, depth, layout.nua.halfZ * 2),
      ],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const pair = layout.pairs[0]
  const reach = Math.max(pair?.ngadhu.capRadius ?? 0, (pair?.bhaga.halfZ ?? 0) + DIMS.bhagaEave.value)
  return {
    // The square runs along Z, and so does the ridge of every little house.
    ridgeAxis: 2,
    footprint: { x: layout.nua.halfX * 2, z: layout.nua.halfZ * 2 },
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: topY,
    // A model's clearance: the fourteenth meaning of this field, and the first
    // where nothing is under the floor because nothing could be.
    underfloorHeight: pair?.bhaga.floorY ?? 0,
    zoneLines: [
      0,
      pair?.bhaga.floorY ?? 0.5,
      (pair?.bhaga.floorY ?? 0) + DIMS.bhagaBoard.value + DIMS.bhagaWallHeight.value,
      topY,
    ],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from one end of the square, looking down the row of pairs.
    approachAt: [0, 0, -layout.nua.halfZ - layout.spacing],
    figureAt: [layout.nua.halfX * 0.45, 0, -layout.nua.halfZ * 0.55],
  }
}
