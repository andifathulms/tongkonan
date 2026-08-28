/**
 * What the renderer needs to know about a Banjar house.
 *
 * `weatherTop` and `ridgeReach` are the core's, not the building's mean — and
 * that is a decision worth writing down. This house has four ridges at four
 * heights, and a single figure for "the top" is a summary of something that is
 * not one thing. The core's is the honest one to report, because it is the one
 * the house is named for.
 *
 * `zones` divides vertically, as everywhere else, and here that is the *wrong*
 * axis for the second time in this project. The joglo's division is centre and
 * periphery; this one's is a sequence front to back, and horizontal bands can
 * carry neither. The bands are the two real storeys — under the floor and in
 * it — and the sequence is stated in the copy and the readout instead.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const front = layout.segments[0]
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: front?.floorY ?? 0,
      nameId: 'kolong',
      nameEn: 'beneath the floor',
      glossId:
        'Banjarmasin dibangun di atas rawa dan pasang, jadi rumah panggung di sini bukan pilihan melainkan syarat. Tongkatnya ulin, dan tidak sama panjang: tiap ruas duduk sedikit lebih rendah daripada yang di belakangnya.',
      glossEn:
        'Banjarmasin is built on swamp and tide, so a raised house here is a requirement rather than a preference. Its posts are ironwood and they are not all one length: each segment sits a little lower than the one behind it.',
    },
    {
      key: 'ruas',
      fromY: front?.floorY ?? 0,
      toY: core?.eaveY ?? topY,
      nameId: 'ruas — pelatar, surambi, palidangan, padu',
      nameEn: 'the segments — pelatar, surambi, palidangan, padu',
      glossId:
        'Pembagian yang penting di sini berurutan dari muka ke belakang, bukan menegak: pelataran terbuka, serambi beratap, inti tertutup, lalu dapur. Pita mendatar tidak bisa menyatakan hal itu — sama seperti pada joglo, bacaan yang paling jujur ada di keterangannya.',
      glossEn:
        'The division that matters here runs front to back rather than up: an open platform, a roofed veranda, the enclosed core, then the kitchen. A horizontal band cannot say that — as with the joglo, the honest reading is in the copy.',
    },
    {
      key: 'atap',
      fromY: core?.eaveY ?? topY,
      toY: topY,
      nameId: 'atap — empat bentuk, satu bubungan',
      nameEn: 'the roofs — four forms, one ridge',
      glossId:
        'Empat atap berurutan sepanjang satu bubungan, dan yang di tengah — yang memberi rumah ini namanya — menjulang di atas keduanya.',
      glossEn:
        'Four roofs in a row along one ridge, and the middle one — the one that gives this house its name — rises above both its neighbours.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const across = layout.halfZ + layout.eaveOversail
  return {
    // The ridge runs along X, the entry axis — the one the sequence is on.
    ridgeAxis: 0,
    footprint: { x: layout.depth, z: layout.halfZ * 2 },
    drip: { x: layout.depth / 2 + layout.eaveOversail, z: across },
    // The core's, not an average: four ridges at four heights do not have a
    // mean worth reporting, and the core's is the one the house is named for.
    ridgeReach: across,
    weatherTop: core?.ridgeY ?? topY,
    underfloorHeight: layout.segments[0]?.floorY ?? 0,
    zoneLines: [0, layout.segments[0]?.floorY ?? 0, core?.eaveY ?? topY, topY],
    zones: zones(layout, topY),
    figureAt: [-layout.depth / 2 - 1.6, 0, 0],
  }
}
