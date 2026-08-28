/**
 * What the renderer needs to know about a rumah limas.
 *
 * `zones` fails here in a way worth writing down, and it is a different
 * failure from the joglo's. There, the division was centre-and-periphery and
 * horizontal bands were the closest honest reading. Here the division *is*
 * vertical — five heights, one above the next — so the field ought to fit
 * perfectly. It does not, because those heights are not stacked storeys: they
 * are five parts of one room, and a reader shown five bands would take them
 * for five floors like the mbaru niang's.
 *
 * So the bands are the three the building actually has as storeys — under the
 * floor, the room, the roof — and the sequence that matters is stated in the
 * copy and in the readout instead. A field that fits the numbers and misleads
 * about the meaning is worse than one that visibly does not fit.
 */

import type { SceneModel, Zone } from '@/lib/core/scene'
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
        'Terbuka, dan tiangnya tidak sama panjang. Urutan tingkat di dalam rumah sudah terbaca dari sini, sebelum orang naik.',
      glossEn:
        'Open, and its posts are not all one length. The sequence of levels inside is already legible from here, before anyone climbs up.',
    },
    {
      key: 'lantai',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'ruang bertingkat',
      nameEn: 'the stepped room',
      glossId:
        'Satu ruang, bukan lima. Lantainya naik bertingkat dari jalan sampai keluarga, dan tempat seorang tamu didudukkan pada urutan itu adalah kedudukannya — tetapi kelimanya satu ruangan, dan pita mendatar yang menampilkannya sebagai lima lantai akan menyatakan hal yang tidak benar.',
      glossEn:
        'One room, not five. Its floor rises in steps from the street to the family and where a guest is seated on that sequence is their standing — but all five are one room, and horizontal bands showing them as five floors would say something untrue.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap limas',
      nameEn: 'the limas roof',
      glossId: 'Rata di atas lantai yang tidak rata: atap tidak ikut bertingkat, jadi tingkat terendah punya paling banyak udara di atasnya.',
      glossEn: 'Level over a floor that is not: the roof does not step with it, so the lowest level has the most air above it.',
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
    // In front of the gallery, at the street end — which is where a person
    // arrives and where the sequence starts.
    figureAt: [-layout.eaveHalfX - 1.5, 0, 0],
  }
}
