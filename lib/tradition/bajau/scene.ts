/**
 * What the renderer needs to know about a lepa.
 *
 * Three fields say something new here and all three say the same thing.
 * `underfloorHeight` is the draught — what is *under* this house is water, and
 * the number is how much of the house is in it. `site` is open water with no
 * ground drawn at all, because the pack has none. And `approachAt` is a place
 * on the water, which means the vantage this project calls "from the yard" is
 * a vantage from another boat.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'air',
      fromY: 0,
      toY: layout.draught,
      nameId: 'yang di bawah air',
      nameEn: 'what is under the water',
      glossId: `Bagian lambung yang terbenam, ${layout.draught.toFixed(2)} m. Pada dua puluh bangunan lain pita terbawah adalah kolong, panggung, atau tanah; di sini ia bagian rumah yang ada di dalam laut.`,
      glossEn: `The submerged part of the hull, ${layout.draught.toFixed(2)} m of it. On the other twenty buildings the lowest band is an underfloor, a platform or the ground; here it is the part of the house that is in the sea.`,
    },
    {
      key: 'geladak',
      fromY: layout.draught,
      toY: layout.deckY + DIMS.deckThickness.value,
      nameId: 'sisa lambung',
      nameEn: 'the freeboard',
      glossId: `Dari garis air ke geladak, ${layout.freeboard.toFixed(2)} m. Angka ini tetap sama saat pasang dan saat surut, karena rumahnya ikut naik — bedanya dengan kariwari, yang lantainya harus melewati pasang yang datang dan pergi.`,
      glossEn: `From the waterline to the deck, ${layout.freeboard.toFixed(2)} m. This figure is the same at high water and at low, because the house rises with it — the difference from the kariwari, whose floor has to clear a tide that comes and goes.`,
    },
    {
      key: 'kajang',
      fromY: layout.deckY + DIMS.deckThickness.value,
      toY: topY,
      nameId: 'di bawah kajang',
      nameEn: 'under the awning',
      glossId: 'Tempat orang tidur, makan, dan menyimpan miliknya. Rendah: orang duduk dan berbaring, tidak berdiri — dan itu aturan keseimbangan, bukan aturan ruang.',
      glossEn: 'Where people sleep, eat and keep what they own. Low: they sit and lie, they do not stand — and that is a rule about balance rather than about room.',
    },
  ]
}

/**
 * Open water, and nothing else.
 *
 * The only site figure in the collection with no line drawn on any ground,
 * because there is no ground: a sheet of water reaching past the frame, and
 * the house floating on it. Every other setting here says where a building is;
 * this one says that where it is, is not a property of the building.
 */
function site(layout: Layout): readonly SiteMark[] {
  const width = layout.length * 6
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [0, 0, 0],
      size: [width, layout.draught, width],
      material: 'air',
    },
  ]
  return [
    {
      key: 'laut',
      nameId: 'Laut',
      nameEn: 'Open water',
      glossId:
        'Air, dan tidak ada yang lain. Ini satu-satunya tapak dalam kumpulan ini yang tidak menggambar satu garis pun di atas tanah, karena tidak ada tanah: setiap tapak lain menyatakan di mana sebuah bangunan berada, dan yang ini menyatakan bahwa letaknya bukan sifat bangunannya.',
      glossEn:
        'Water, and nothing else. It is the only site in this collection that draws no line on any ground, because there is none: every other setting here says where a building is, and this one says that where it is, is not a property of the building.',
      lines: [groundRing(0, 0, layout.length * 1.2)],
      closed: false,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const reach = layout.length / 2
  return {
    // A hull has a keel line and it runs on X: the section this project cuts
    // across it is the one a boatbuilder would draw.
    ridgeAxis: 0,
    footprint: { x: layout.length, z: layout.halfBeam * 2 },
    drip: { x: reach, z: layout.halfBeam + (layout.cadik.present ? layout.cadik.reach : 0) },
    ridgeReach: reach,
    weatherTop: topY,
    // Not a clearance but a draught: what is under this house is water, and
    // this is how much of the house is in it. The eighth meaning of the field.
    underfloorHeight: layout.draught,
    zoneLines: [0, layout.draught, layout.deckY + DIMS.deckThickness.value, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the water, because there is nowhere else to stand.
    approachAt: [-layout.length, 0, layout.length * 0.4],
    figureAt: [-layout.length * 0.75, 0, layout.halfBeam + 1.2],
  }
}
