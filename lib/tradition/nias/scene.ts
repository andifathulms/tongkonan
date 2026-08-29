/**
 * What the renderer needs to know about an omo.
 *
 * The house that makes `underfloorHeight` mean what it originally meant, after
 * two houses stretched it. A tongkonan has a storey under it; a joglo has a
 * plinth; a bale has something you sit on the edge of. This one has the tallest
 * and most *important* understorey of the six, because the part of the building
 * doing the structural work is down there in the open.
 *
 * The zones are three and they are not tri angga. They are the understorey
 * where the bracing is, the body where people live, and the roof — which in a
 * si'ulu's house is also a room. The middle band is the smallest of the three,
 * which is the reading a photograph gives and the numbers agree with.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import { thatchTop } from './roof'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'kolong',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'kolong — rangka diagonal',
      nameEn: 'the understorey — the diagonal frame',
      glossId:
        'Tiang tegak dan driwa menyilang di antaranya, terbuka dan tidak ditutupi apa pun. Bagian inilah yang membuat rumah bertahan diguncang, dan ia juga bagian yang paling mudah dilihat — di lima rumah lain dalam projek ini, yang menahan bangunan justru yang tersembunyi.',
      glossEn:
        'Vertical posts with driwa crossing between them, open and screened by nothing. This is the part that lets the house survive shaking, and it is also the part easiest to see — in the other five houses here, what holds the building up is what is hidden.',
    },
    {
      key: 'badan',
      fromY: layout.floorY,
      toY: layout.eaveY,
      nameId: 'badan — tempat tinggal',
      nameEn: 'the body — where people live',
      glossId:
        'Dinding miring ke luar, dan satu pita jendela menerus di muka. Bagian terkecil dari ketiganya, yang mengejutkan bagi bagian yang justru dihuni.',
      glossEn:
        'Walls leaning outward, and one continuous window band across the front. The smallest of the three bands, which is surprising for the one that is lived in.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: layout.loft.present
        ? 'Bagian terbesar bangunan, dan di rumah si’ulu ia berisi loteng. Ruang sebesar itu terlalu berharga untuk dikosongkan.'
        : 'Bagian terbesar bangunan. Di rumah biasa ia dibiarkan kosong; loteng adalah tanda rumah si’ulu.',
      glossEn: layout.loft.present
        ? 'The largest part of the building, and in a si’ulu’s house it holds a loft. A space that size is too valuable to leave empty.'
        : 'The largest part of the building. In an ordinary house it is left empty; the loft is a mark of a si’ulu’s.',
    },
  ]
}


/**
 * The street, and the neighbours it is a terrace of.
 *
 * An omo is not a free-standing object. South Nias villages are two rows of
 * houses standing shoulder to shoulder along a paved street, and the house is
 * one unit of that row — which is why its bracing is on the two long sides and
 * why the behu stand out front rather than around it. Drawn alone on open
 * ground it looks like a building that could be turned; drawn between its
 * neighbours' party lines it is what it is.
 *
 * The neighbours are two lines and no more. A row of guessed houses would put
 * fourteen invented buildings on the screen to explain one.
 */
function site(layout: Layout): readonly SiteMark[] {
  const gap = DIMS.neighbourGap.value
  const street = DIMS.streetWidth.value
  const edge = layout.eaveHalfZ + gap
  const front = layout.eaveHalfX
  return [
    {
      key: 'jalan',
      nameId: 'Jalan kampung',
      nameEn: 'The village street',
      glossId:
        'Tepi jalan berbatu di muka rumah, dan garis rumah tetangga di kiri dan kanan. Omo adalah satu petak dari deretan yang menghadap jalan itu: bukan bangunan yang berdiri sendiri, melainkan satu rumah dalam satu baris.',
      glossEn:
        'The edge of the paved street in front of the house, and the party lines of the neighbours on either side. An omo is one unit of a terrace facing that street: not a free-standing building but one house in a row.',
      lines: [
        [
          [-front - street, -edge],
          [-front, -edge],
        ],
        [
          [-front - street, edge],
          [-front, edge],
        ],
        [
          [-front - street, -edge],
          [-front - street, edge],
        ],
      ],
      closed: false,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = thatchTop(layout)
  return {
    ridgeAxis: 2,
    footprint: { x: layout.bodyHalfX * 2, z: layout.bodyHalfZ * 2 },
    drip: { x: layout.eaveHalfX, z: layout.eaveHalfZ },
    ridgeReach: Math.max(layout.eaveHalfX, layout.eaveHalfZ),
    weatherTop: Math.max(topY, house.bounds.max[1]),
    // The tallest of the six, and the one that matters most: the frame that
    // does the work is in it.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.eaveY, Math.max(topY, house.bounds.max[1])],
    zones: zones(layout, Math.max(topY, house.bounds.max[1])),
    site: site(layout),
    figureAt: [layout.eaveHalfX + DIMS.plazaOffset.value / 2, 0, layout.eaveHalfZ + 1.4],
  }
}
