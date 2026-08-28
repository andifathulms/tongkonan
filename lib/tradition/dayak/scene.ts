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

import type { SceneModel, Zone } from '@/lib/core/scene'
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
    figureAt: [-layout.eaveHalfX - 1.6, 0, layout.hejot.z],
  }
}
