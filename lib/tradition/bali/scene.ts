/**
 * What the renderer needs to know about a bale.
 *
 * The house that makes `zones` fit for the second time and for a different
 * reason. The mbaru niang's five floors are a stack because the building is
 * literally stacked; here the three bands are the tri angga — bataran, saka,
 * roof; foot, body, head — which is a division the tradition states about the
 * building rather than one the geometry happens to allow. So the field carries
 * a named cultural claim in one house and a physical arrangement in another,
 * and both are honest uses of it.
 *
 * `underfloorHeight` is the field that has now been stretched in both
 * directions. A tongkonan has a storey under it, a joglo has a step, and this
 * has a step of a different kind again: the bataran is something to sit on the
 * edge of. It reports the clearance and lets the number say which it is,
 * which is what it did for the joglo and remains the right answer.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { stockLength } from './module'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const body = layout.bataranHeight + stockLength(layout.sikut, DIMS.sendiHeightUnits.value, 'nyari')
  return [
    {
      key: 'nista',
      fromY: 0,
      toY: body,
      nameId: 'bataran — kaki',
      nameEn: 'bataran — the foot',
      glossId:
        'Panggung pasangan. Kaki dari pembagian tiga, dan satu-satunya bagian bangunan ini yang bukan kayu. Tidak ada ruang di bawahnya: ia tempat duduk, bukan lantai atas.',
      glossEn:
        'The masonry platform. The foot of the threefold division, and the only part of this building that is not timber. There is no space beneath it: it is something to sit on rather than a storey.',
    },
    {
      key: 'madya',
      fromY: body,
      toY: layout.eaveY,
      nameId: 'saka — badan',
      nameEn: 'saka — the body',
      glossId:
        'Tinggi tiang, dan seluruhnya terbuka. Nol bidang dinding di antara lantai dan tepi atap — yang membuat bale terpakai adalah jangkauan atapnya, bukan penutupnya.',
      glossEn:
        'The height of the posts, and it is open the whole way round. Zero wall planes between the floor and the eave — what makes a bale usable is the reach of its roof rather than any enclosure.',
    },
    {
      key: 'utama',
      fromY: layout.eaveY,
      toY: topY,
      nameId: 'atap — kepala',
      nameEn: 'the roof — the head',
      glossId:
        'Kepala dari pembagian tiga, dan bagian terbesar dari bangunan ini. Empat bidang jatuh ke tepi atap yang menutup keliling.',
      glossEn:
        'The head of the threefold division, and the largest part of this building. Four planes falling to an eave that closes all the way round.',
    },
  ]
}


/**
 * The compound, which is the thing this bale is one piece of.
 *
 * The caution says it outright: a Balinese house is a walled yard with several
 * bale around a natah and a shrine in the kaja-kangin corner, and this model
 * builds one pavilion. Drawing the wall and the corner does not build the
 * missing buildings — it shows the shape of what is missing, which is the
 * difference between an absence a reader can see and a paragraph they have to
 * take on trust.
 *
 * Kaja-kangin is toward the mountain and the sunrise. In this model's axes,
 * with the sun rising on +Z and the mountain inland, that corner is drawn on
 * the (−X, +Z) side and the wall is square to the house, which is what an
 * orthogonal compound does.
 */
function site(layout: Layout): readonly SiteMark[] {
  const half = DIMS.compoundSide.value / 2
  const shrine = DIMS.shrinePlan.value
  /* The wall as four low runs, and the shrine as a block at its corner. */
  const wh = DIMS.wallHeightSite.value
  const wt = DIMS.wallThicknessSite.value
  const sh = DIMS.shrineHeight.value
  const inset = DIMS.shrineInset.value
  const volumes: SiteVolume[] = [
    { kind: 'box', at: [-half, 0, 0], size: [wt, wh, half * 2], material: 'batu' },
    { kind: 'box', at: [half, 0, 0], size: [wt, wh, half * 2], material: 'batu' },
    { kind: 'box', at: [0, 0, -half], size: [half * 2, wh, wt], material: 'batu' },
    { kind: 'box', at: [0, 0, half], size: [half * 2, wh, wt], material: 'batu' },
    {
      kind: 'box',
      at: [-half + inset + shrine / 2, 0, half - inset - shrine / 2],
      size: [shrine, sh, shrine],
      material: 'batu',
    },
  ]

  return [
    {
      key: 'pekarangan',
      nameId: 'Pekarangan dan sanggah',
      nameEn: 'The compound and the shrine',
      glossId:
        'Tembok pekarangan, dan jejak sanggah di sudut kaja-kangin. Rumah Bali adalah pekarangan berisi beberapa bale mengelilingi natah; yang dimodelkan di sini satu bale saja, dan garis ini memperlihatkan bentuk dari apa yang tidak ada.',
      glossEn:
        'The compound wall, and the footprint of the shrine in the kaja-kangin corner. A Balinese house is a walled yard of several bale around the natah; this model builds one of them, and these lines show the shape of what is not here.',
      lines: [
        groundRect(-half, -half, half, half),
        groundRect(-half + inset, half - inset - shrine, -half + inset + shrine, half - inset),
      ],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const eave = layout.roof[0]
  const reachX = eave?.halfX ?? layout.bataranHalfX
  const reachZ = eave?.halfZ ?? layout.bataranHalfZ

  return {
    // The ridge runs along Z, like the tongkonan and unlike the rumah gadang.
    // On a square bale it has no length, and the axis is then a statement
    // about which way the hips close rather than about a member that exists.
    ridgeAxis: 2,
    footprint: { x: layout.bataranHalfX * 2, z: layout.bataranHalfZ * 2 },
    drip: { x: reachX, z: reachZ },
    ridgeReach: Math.max(reachX, reachZ),
    weatherTop: topY,
    /*
     * A step, not a storey — and the smallest of the five.
     *
     * The comparison is the point of reporting it honestly: a tongkonan has a
     * storey under it, a mbaru niang a metre and a quarter closed in by
     * thatch, a joglo a plinth, and this something a person sits on the edge
     * of. One number, four orders of meaning, and no averaging.
     */
    underfloorHeight: layout.bataranHeight,
    zoneLines: [
      0,
      layout.bataranHeight + stockLength(layout.sikut, DIMS.sendiHeightUnits.value, 'nyari'),
      layout.eaveY,
      topY,
    ],
    zones: zones(layout, topY),
    site: site(layout),
    approachAt: [-reachX - DIMS.compoundSide.value * 0.22, 0, 0],
    figureAt: [reachX + 1.6, 0, 0],
  }
}
