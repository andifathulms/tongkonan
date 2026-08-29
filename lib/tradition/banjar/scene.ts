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

import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
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


/**
 * The river the pelatar meets.
 *
 * The front segment of this house is an open platform, and the reason it is
 * open is that it is where the house meets the water. In Banjarmasin the
 * river is the road, so the bank is what fixes which end is the front — and
 * therefore which way the sequence of four roofs runs. Take the water away
 * and the chain still stands, but nothing says which way to walk it.
 *
 * A bank line and a walkway, no water. A rendered river would be the first
 * thing in this model that is not a made object.
 */
function site(layout: Layout): readonly SiteMark[] {
  const setback = DIMS.riverSetback.value
  const half = DIMS.titianWidth.value / 2
  const front = -layout.depth / 2
  const bank = front - setback
  const reach = layout.halfZ + setback
  /*
   * The water and the walkway over it.
   *
   * A model's water: one flat surface a little below the ground, with nothing
   * moving on it and nothing reflected in it. The titian is planks on posts,
   * which is how a house on a tidal swamp reaches its own front door when the
   * water is up.
   */
  const width = DIMS.riverWidth.value
  const drop = DIMS.bankDrop.value
  const spacing = DIMS.titianPostSpacing.value
  const postW = DIMS.titianPostWidth.value
  const deck = DIMS.titianDeckThickness.value
  const deckY = DIMS.titianDeckY.value
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [bank - width / 2, -drop, 0],
      size: [width, drop, reach * 2],
      material: 'air',
    },
    {
      kind: 'box',
      at: [(bank + front) / 2, deckY, 0],
      size: [front - bank, deck, half * 2],
      material: 'kayu',
    },
  ]
  // The posts stop a post's width short of the platform: the last one would
  // otherwise stand under the house it walks up to.
  for (let x = bank + spacing / 2; x < front - postW; x += spacing) {
    for (const sz of [-1, 1] as const) {
      volumes.push({
        kind: 'cylinder',
        at: [x, -drop, sz * (half - postW / 2)],
        size: [postW, drop + deckY, postW],
        material: 'kayu',
      })
    }
  }

  return [
    {
      key: 'sungai',
      nameId: 'Tepi sungai dan titian',
      nameEn: 'The bank and the walkway',
      glossId:
        'Garis air di muka pelataran, dan titian yang menuju ke sana. Sungai adalah jalannya: tepi inilah yang menetapkan ujung mana yang muka, dan karena itu ke arah mana urutan empat atapnya dibaca. Airnya sendiri tidak digambar.',
      glossEn:
        'The water’s edge in front of the pelatar, and the walkway down to it. The river is the road: this edge is what fixes which end is the front, and therefore which way the sequence of four roofs is read. The water itself is not drawn.',
      lines: [
        [
          [bank, -reach],
          [bank, reach],
        ],
        [
          [bank, -half],
          [front, -half],
        ],
        [
          [bank, half],
          [front, half],
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
    site: site(layout),
    figureAt: [-layout.depth / 2 - 1.6, 0, 0],
  }
}
