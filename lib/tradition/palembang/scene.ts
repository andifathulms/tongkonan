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

import { groundRect } from '@/lib/core/scene'
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


/**
 * The yard the sequence starts in.
 *
 * The kekijing begins outside the house. A guest stops in the yard, climbs
 * the stair, and is seated on the step that states their standing — so the
 * ground in front is the first term of the sequence, and a limas drawn
 * without it starts its argument on the second step.
 *
 * A fence line and nothing on it. Where the sources are thin the drawing gets
 * thinner too: this arrangement is ordinary rather than documented, which is
 * why the mark is interpolated while the tongkonan's alang are canon.
 */
function site(layout: Layout): readonly SiteMark[] {
  const depth = DIMS.yardDepth.value
  const half = DIMS.yardWidth.value / 2
  const front = layout.eaveHalfX
  /* A post-and-rail fence, low enough to see the steps over. */
  const fh = DIMS.fenceHeight.value
  const spacing = DIMS.fencePostSpacing.value
  const post = DIMS.fencePostWidth.value
  const rail = DIMS.fenceRailDepth.value
  const volumes: SiteVolume[] = []
  const nearX = -front - depth
  for (let z = -half; z <= half + 1e-6; z += spacing) {
    volumes.push({ kind: 'box', at: [nearX, 0, z], size: [post, fh, post], material: 'kayu' })
  }
  for (const sz of [-1, 1] as const) {
    volumes.push({
      kind: 'box',
      at: [nearX + depth / 2, 0, sz * half],
      size: [depth, fh - rail, rail],
      material: 'kayu',
    })
  }
  // One rail along the front, at the head of the posts.
  volumes.push({
    kind: 'box',
    at: [nearX, fh - rail, 0],
    size: [rail, rail, half * 2],
    material: 'kayu',
  })

  return [
    {
      key: 'halaman',
      nameId: 'Halaman muka',
      nameEn: 'The front yard',
      glossId:
        'Pagar halaman di muka tangga. Urutan kekijing dimulai di sini: tamu berhenti di tanah, naik, lalu didudukkan pada tingkat yang menyatakan kedudukannya. Susunan ini lazim, bukan tercatat — karena itu ia ditandai sebagai penetapan penulis.',
      glossEn:
        'The fence of the yard in front of the stair. The kekijing sequence starts here: a guest stops on the ground, climbs, and is seated on the step that states their standing. The arrangement is ordinary rather than documented, which is why it is marked as the author’s.',
      lines: [groundRect(-front - depth, -half, -front, half)],
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
    // In front of the gallery, at the street end — which is where a person
    // arrives and where the sequence starts.
    site: site(layout),
    figureAt: [-layout.eaveHalfX - 1.5, 0, 0],
  }
}
