/**
 * What the renderer needs to know about a betang.
 *
 * `footprint` is the field this house stretches, in the way `underfloorHeight`
 * was stretched by the joglo and the bale. Every other building here has a
 * footprint that says something about the type; this one's says only how many
 * families are in it today. A reader comparing footprints across the six other
 * houses is comparing buildings; comparing this one to itself at a different
 * household count is comparing censuses.
 *
 * The zones are the two storeys and the roof, and the middle one is divided
 * across rather than up — bilik behind, gallery in front. `zones` cannot say
 * that, exactly as it could not say the joglo's centre-and-periphery, and the
 * honest reading is the same: horizontal bands are the closest thing the field
 * can hold, and the division that matters here is stated in the copy instead.
 */

import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'kolong',
      nameEn: 'beneath the floor',
      glossId:
        'Tinggi dan terbuka. Sungai naik, babi dan anjing hidup di bawah sini, dan rumah yang tinggi lebih mudah dijaga — satu-satunya jalan naik adalah hejot, dan malam hari batang itu ditarik ke atas.',
      glossEn:
        'Tall and open. The river rises, pigs and dogs live under here, and a raised house is easier to hold — the only way up is the hejot, and at night the log is pulled in.',
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'bilik dan sami',
      nameEn: 'the bilik and the sami',
      glossId:
        'Pembagian yang penting di sini melintang, bukan menegak: bilik tertutup di belakang, galeri bersama di muka, dan galeri itu hampir seluas biliknya sendiri. Pita mendatar tidak bisa menyatakan hal itu — sama seperti pada joglo, bacaan yang paling jujur ada di keterangannya, bukan di bidangnya.',
      glossEn:
        'The division that matters here is across rather than up: the enclosed bilik behind, the common gallery in front, and the gallery nearly as deep as the room itself. A horizontal band cannot say that — as with the joglo, the honest reading is in the copy rather than in the field.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap sirap',
      nameEn: 'the shingle roof',
      glossId: 'Pelana ulin, membentang sepanjang berapa pun rumah ini menjadi.',
      glossEn: 'An ironwood gable, running however long this house has become.',
    },
  ]
}


/**
 * The river, which is the road.
 *
 * A betang stands along the water with its gallery facing it, and everything
 * about the building follows from that: the length is a census taken along the
 * bank, the gallery is the public side, and the hejot leans down toward the
 * landing. The house has no compass rule, so drawn on empty ground there is
 * nothing to say which of its two long sides is the front — the bank says it.
 *
 * One line, no water. A rendered river would be the first thing in this model
 * that is not a made object.
 */
function site(layout: Layout): readonly SiteMark[] {
  const setback = DIMS.riverSetback.value
  const bank = -(layout.eaveHalfX + setback)
  const reach = layout.length / 2 + setback
  /*
   * The water, as a model makes water: one flat surface, a little below the
   * bank, with nothing moving on it.
   *
   * Not a river — a river is wider than anything that fits here, and it moves.
   * This is the surface a model of this house would have on the table beside
   * it: enough to say the front of the building is a bank, and no more. There
   * is no ripple, no reflection written by hand and no sound.
   */
  const width = DIMS.riverWidth.value
  const drop = DIMS.bankDrop.value
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [bank - width / 2, -drop, 0],
      size: [width, drop, reach * 2],
      material: 'air',
    },
  ]

  return [
    {
      key: 'sungai',
      nameId: 'Tepi sungai',
      nameEn: 'The river bank',
      glossId:
        'Garis air di muka galeri. Rumah betang berdiri sejajar sungai dan menghadapnya, dan di Kalimantan sungai adalah jalannya — jadi garis inilah yang menyatakan sisi mana yang muka. Airnya sendiri tidak digambar.',
      glossEn:
        'The water’s edge in front of the gallery. A betang stands parallel to the river and faces it, and in Borneo the river is the road — so this line is what says which side is the front. The water itself is not drawn.',
      lines: [
        [
          [bank, -reach],
          [bank, reach],
        ],
      ],
      closed: false,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    ridgeAxis: 2,
    /*
     * A footprint that is a census.
     *
     * Reported like any other, and it is worth knowing that it does not mean
     * what the other six mean by it. Their footprints describe a building
     * type; this one describes how many families live here this year.
     */
    footprint: { x: layout.halfX * 2, z: layout.length },
    drip: { x: layout.eaveHalfX, z: layout.halfZ + DIMS.eaveOversail.value },
    ridgeReach: layout.eaveHalfX,
    weatherTop: topY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    figureAt: [-layout.eaveHalfX - 1.6, 0, layout.hejot.z],
  }
}
