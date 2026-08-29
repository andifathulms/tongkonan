/**
 * What the renderer needs to know about a tongkonan.
 *
 * The renderer used to read twenty fields off this `Layout` directly, which
 * meant it could only ever draw one building. This is that reading, done once
 * and on this side of the split, so the renderer can be handed a house it
 * cannot name a single stage of.
 *
 * The zone names live here rather than in the app copy because they are the
 * names of parts of the building, like `tulak somba` and `ijuk`. Copy that
 * describes the interface belongs in `lib/i18n.ts`; vocabulary belongs with
 * the house it is the vocabulary of.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

/**
 * The cosmological division, as spatial fact.
 *
 * Three worlds stacked: livestock and shadow below, people in the middle,
 * rice and heirlooms above. The section cut is what makes this an
 * observation about a building rather than a diagram beside one.
 */
function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'sulluk',
      fromY: 0,
      toY: layout.deckY,
      nameId: 'sulluk banua',
      nameEn: 'sulluk banua',
      glossId:
        'Kolong. Dunia bawah: ternak, kayu bakar, dan bayang-bayang dalam yang membuat badan rumah tampak melayang.',
      glossEn:
        'The underfloor. The lower world: livestock, firewood, and the deep shadow that makes the body appear to float.',
    },
    {
      key: 'kale',
      fromY: layout.deckY,
      toY: layout.plateY,
      nameId: 'kale banua',
      nameEn: 'kale banua',
      glossId: 'Lantai hunian. Dunia tengah: tempat manusia tinggal, dibagi menjadi ruang-ruang bernama.',
      glossEn: 'The living floor. The middle world: where people live, divided into named bays.',
    },
    {
      key: 'rattiang',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'rattiang banua',
      nameEn: 'rattiang banua',
      glossId: 'Loteng di bawah atap. Dunia atas: penyimpanan padi dan pusaka.',
      glossEn: 'The attic under the roof. The upper world: rice and heirlooms are kept here.',
    },
  ]
}


/**
 * What the tongkonan faces.
 *
 * The orientation rule says the house faces north, and read as a compass
 * bearing that is only half of it: what is *to* the north is the row of
 * alang, the rice barns, standing across the yard looking back at the house.
 * A model of a tongkonan alone on the ground states the bearing and loses the
 * relationship, which is the part a person standing there would see.
 *
 * Only the footprints are drawn. An alang is a building in its own right —
 * six posts, its own roof, its own rank — and raising one from a guess is
 * exactly what this project refuses. A footprint says "something stands here
 * and the sources say what"; a modelled barn would say a great deal more.
 */
function site(layout: Layout): readonly SiteMark[] {
  const gap = DIMS.halamanDepth.value
  const plan = DIMS.alangPlan.value
  const spacing = DIMS.alangSpacing.value
  // North is −X, and the front prow is the north end, so the yard runs out
  // from there and the barns stand beyond it.
  const front = layout.frontProwX
  const near = front - gap
  const lines = [-1, 0, 1].map((n) =>
    groundRect(near - plan, n * spacing - plan / 2, near, n * spacing + plan / 2),
  )
  return [
    {
      key: 'alang',
      nameId: 'Alang',
      nameEn: 'Alang',
      glossId:
        'Jejak denah tiga lumbung padi, berjajar menghadap tongkonan di seberang halaman. Rumah dan lumbung saling berhadapan, dan itulah isi sebenarnya dari aturan hadap utara. Lumbungnya sendiri tidak dimodelkan.',
      glossEn:
        'The footprints of three rice barns, in a row facing the tongkonan across the yard. House and barns face each other, and that is what the rule about facing north actually contains. The barns themselves are not modelled.',
      lines,
      closed: true,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  // The prows are not symmetric, so the reach is the further of the two.
  const reach = Math.max(-layout.frontProwX, layout.rearProwX)
  return {
    // The ridge runs front to rear and the house mirrors across it.
    ridgeAxis: 0,
    footprint: { x: layout.bodyLength, z: layout.bodyWidth },
    drip: { x: reach, z: layout.eaveHalfWidth },
    ridgeReach: reach,
    weatherTop: layout.frontProwY,
    underfloorHeight: layout.kolongHeight,
    zoneLines: [0, layout.floorFrameY, layout.deckY, layout.plateY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    figureAt: [layout.bodyLength * 0.28, 0, layout.eaveHalfWidth + 1.4],
  }
}
