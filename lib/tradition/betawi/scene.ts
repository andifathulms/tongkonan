/**
 * What the renderer needs to know about a rumah kebaya.
 *
 * The site figure is the one that matters here, and it is unlike every other
 * one in the collection: not a yard, a square, a river, a clearing or a
 * fortress, but a *boundary* — two lines drawn on the ground by somebody who
 * is not family, with a road at one end and neighbours on both sides.
 *
 * `underfloorHeight` is a brick plinth, half a metre of it, and its reason is
 * water rather than air: this is a city on low ground that floods.
 */

import { groundBox } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  return [
    {
      key: 'lantai',
      fromY: 0,
      toY: layout.floorY,
      nameId: 'lantai bata',
      nameEn: 'the brick plinth',
      glossId: `${(layout.floorY * 100).toFixed(0)} cm pasangan bata di atas tanah. Alasannya air, bukan udara: ini kota di tanah rendah yang banjir, dan yang diangkat adalah lantainya, bukan rumahnya.`,
      glossEn: `${(layout.floorY * 100).toFixed(0)} cm of brickwork above the ground. The reason is water rather than air: this is a city on low ground that floods, and what is lifted is the floor rather than the house.`,
    },
    {
      key: 'ruang',
      fromY: layout.floorY,
      toY: layout.wallTop,
      nameId: 'langkan dan ruang',
      nameEn: 'the terrace and the rooms',
      glossId: `Langkan di muka, terbuka ke jalan, dan ${layout.rules.kamar} kamar di belakangnya. Pita ini memuat dua hal yang berbeda jenisnya: satu ruang untuk orang yang tidak dipersilakan masuk, dan beberapa untuk yang tinggal di dalamnya.`,
      glossEn: `The terrace at the front, open to the road, and ${layout.rules.kamar} rooms behind it. This band holds two different kinds of thing: one room for people who are not let in, and several for the people who live here.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap yang melipat',
      nameEn: 'the folded roof',
      glossId: 'Dua bidang dengan kemiringan berbeda: curam di atas rumah, landai di atas langkan, dan lipatan di antaranya yang memberi rumah ini namanya.',
      glossEn: 'Two planes of different pitch: steep over the house, shallow over the terrace, and the fold between them is what gives this house its name.',
    },
  ]
}

/**
 * The plot with its neighbours, and the road it is measured from.
 *
 * Every other site figure in this project is something the household made or
 * chose. This one is a line it was given, and the two blocks beyond it are the
 * point of drawing it at all: what is on the far side of a boundary is not the
 * household's business, and that is exactly what makes the boundary bind.
 *
 * Two marks rather than one, and the reason is that a caption stands
 * somewhere. The boundary, the road and the neighbours were a single figure
 * named "Kavling, jalan, dan tetangga" — three things in three places under
 * one label, which could only ever be written over one of them, and was
 * written over the house. The boundary keeps the neighbours, because they are
 * its argument; the road is its own fact at its own end and gets its own
 * name.
 */
function site(layout: Layout): readonly SiteMark[] {
  const roadZ = -layout.plot.halfZ
  const volumes: SiteVolume[] = []
  for (const sx of [-1, 1] as const) {
    volumes.push({
      kind: 'gable',
      at: [sx * (layout.plot.halfX + DIMS.plotWidth.value * 0.42), 0, 0],
      size: [DIMS.plotWidth.value * 0.55, layout.wallTop, layout.house.halfZ * 1.6],
      ridgeAxis: 0,
      material: 'atap',
    })
  }
  return [
    {
      key: 'kavling',
      nameId: 'Kavling dan tetangga',
      nameEn: 'The plot and the neighbours',
      glossId: `Garis batas ${(layout.plot.halfX * 2).toFixed(0)} × ${(layout.plot.halfZ * 2).toFixed(0)} m, dengan rumah orang lain di kedua sisinya. Semua gambar tapak lain dalam kumpulan ini adalah sesuatu yang dibuat atau dipilih penghuninya; yang ini garis yang diberikan kepadanya — dan justru rumah tetangga di seberang garis itulah alasan garisnya mengikat.`,
      glossEn: `A boundary ${(layout.plot.halfX * 2).toFixed(0)} × ${(layout.plot.halfZ * 2).toFixed(0)} m, with other people’s houses on both sides. Every other site figure in this collection is something the household made or chose; this is a line it was given — and the neighbours’ houses across it are the reason the line binds at all.`,
      lines: [
        groundBox(0, 0, layout.plot.halfX * 2, layout.plot.halfZ * 2),
      ],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
    {
      key: 'jalan',
      nameId: 'Jalan',
      nameEn: 'The road',
      glossId: `Jalan di ujung muka kavling. Letak rumah ini diukur terhadapnya dan bukan terhadap kerabat: langkannya menghadap orang lewat, dan sempadan ${layout.plot.setback.toFixed(1)} m yang disisakan di depan adalah jarak ke jalan itu.`,
      glossEn: `The road at the front end of the plot. This house is positioned against it rather than against kin: the terrace faces the people passing, and the ${layout.plot.setback.toFixed(1)} m left open at the front is the distance to that road.`,
      lines: [groundBox(0, roadZ - 3, layout.plot.halfX * 3.6, 6)],
      closed: true,
      volumes: [],
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  return {
    // The ridge runs along X, parallel to the road — which is why the fold in
    // the roof is what shows from the side.
    ridgeAxis: 0,
    footprint: { x: layout.house.halfX * 2, z: layout.house.halfZ * 2 + layout.langkan.depth },
    drip: { x: layout.house.halfX + over, z: layout.house.halfZ + layout.langkan.depth / 2 + over },
    ridgeReach: layout.house.halfX + over,
    weatherTop: layout.ridgeY,
    // A brick plinth against flood water: the sixteenth meaning of this field.
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the road, which is the only building here of which that is true.
    approachAt: [0, 0, -layout.plot.halfZ - 3],
    figureAt: [layout.house.halfX * 0.6, 0, -layout.plot.halfZ + layout.plot.setback * 0.45],
  }
}
