/**
 * What the renderer needs to know about an uma.
 *
 * `weatherTop` finally means something extreme. On seven houses it is the top
 * of a roof that covers a body; here it is the top of a container that the
 * body is a foot for, and on a tall tower it is three times the height of
 * anything a person occupies. A reader comparing ridge heights across the
 * registry is comparing shelters, except here.
 *
 * The zones are the house, the roof over it, and — when there is one — the
 * tower as its own band. That third band is the only zone in this project
 * that is neither a storey people use nor a roof over one: it is a store, and
 * the whole building exists to hold it up.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const base: Zone[] = [
    {
      key: 'rumah',
      fromY: 0,
      toY: layout.eaveY,
      nameId: 'rumah — kolong, lantai, dinding',
      nameEn: 'the house — understorey, floor, walls',
      glossId:
        'Rendah, dan sengaja. Panggungnya pendek dan dindingnya lebih pendek lagi: ini rumah tempat orang duduk, bukan berdiri. Yang penting pada bangunan ini bukan bagian ini.',
      glossEn:
        'Low, and deliberately so. The platform is short and the walls shorter: this is a house people sit in rather than stand in. This is not the part of the building that matters.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: layout.shoulderY,
      nameId: 'atap bawah',
      nameEn: 'the lower roof',
      glossId:
        'Atap limas yang menaungi rumah dan serambinya, dan berhenti di bahu. Pada rumah tanpa menara, di sinilah bangunan berakhir.',
      glossEn:
        'The hipped roof that shelters the house and its veranda, stopping at the shoulder. On a house without a tower, this is where the building ends.',
    },
  ]
  if (!layout.menara.present) return base
  return [
    ...base,
    {
      key: 'menara',
      fromY: layout.shoulderY,
      toY: topY,
      nameId: 'menara — uma deta',
      nameEn: 'the tower — the uma deta',
      glossId:
        'Bagian terbesar bangunan, dan tidak ada orang tinggal di dalamnya. Di sini marapu disimpan — dan seluruh bangunan di bawahnya ada untuk menahannya. Ini satu-satunya bidang dalam projek ini yang bukan lantai yang dipakai orang dan bukan atap di atasnya, melainkan sebuah simpanan.',
      glossEn:
        'The largest part of the building, and nobody lives in it. The marapu are kept here — and everything beneath exists to hold it up. It is the only band in this project that is neither a storey people use nor a roof over one: it is a store.',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    ridgeAxis: 2,
    footprint: { x: layout.coreHalfX * 2, z: layout.coreHalfZ * 2 },
    drip: { x: layout.eaveHalfX, z: layout.eaveHalfZ },
    ridgeReach: Math.max(layout.eaveHalfX, layout.eaveHalfZ),
    /*
     * The top of a container, not of a shelter.
     *
     * Reported like the other seven and meaning something else: on a tall
     * tower this figure is three times the height of anything a person
     * occupies, because what is up there is kept rather than lived in.
     */
    weatherTop: topY,
    // Low, and the lowest of the raised houses here. What matters on this
    // building is above it rather than beneath it.
    underfloorHeight: layout.floorY,
    zoneLines: layout.menara.present
      ? [0, layout.eaveY, layout.shoulderY, topY]
      : [0, layout.eaveY, topY],
    zones: zones(layout, topY),
    figureAt: [layout.eaveHalfX + 1.6, 0, 0],
  }
}
