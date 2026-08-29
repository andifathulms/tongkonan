/**
 * What the renderer needs to know about a lumbung.
 *
 * `underfloorHeight` here is not a fact about a storey — it is the working
 * height of the shaded place people actually use, under a building they do not
 * enter. Eleven times this field has meant "how much of the house is above the
 * ground"; here it means "how much room is there beside the point of the
 * thing".
 *
 * And `weatherTop` and `drip` say something the other packs cannot. The drip
 * line is *inside* the footprint of the roof and *below* the floor it shelters,
 * because the hood falls past the store — so a reader comparing drip lines
 * across the registry is comparing where water lands relative to a wall
 * everywhere except here, where there is no wall out that far.
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
      nameId: 'kolong — tempat orangnya',
      nameEn: 'beneath — where the people are',
      glossId:
        'Teduh, kering, dan tempat pekerjaan sekitar panen berlangsung. Di bangunan ini bagian yang dipakai manusia adalah bagian yang tidak dibangun untuknya, dan itu kebalikan dari sebelas bangunan lain di sini.',
      glossEn:
        'Shaded, dry, and where the work around the harvest happens. In this building the part people use is the part that was not built for them, which is the reverse of the other eleven here.',
    },
    {
      key: 'simpan',
      fromY: layout.floorY,
      toY: layout.floorY + layout.storeHeight,
      nameId: 'ruang simpan — padi',
      nameEn: 'the store — rice',
      glossId:
        'Kotak kecil yang tidak bisa ditegakkan seorang manusia, dan seluruh bangunan ini ada untuknya. Cakram di bawah lantainya menghalau tikus; itu satu-satunya unsur dalam projek ini yang ditujukan kepada makhluk selain manusia.',
      glossEn:
        'A small box nobody can stand up in, and the whole building exists for it. The discs beneath its floor stop rats; they are the only element in this project aimed at something other than a person.',
    },
    {
      key: 'tudung',
      fromY: layout.floorY + layout.storeHeight,
      toY: topY,
      nameId: 'tudung',
      nameEn: 'the hood',
      glossId:
        'Melengkung ke luar lalu turun curam, dan tepinya berakhir di bawah lantai yang dilindunginya — jadi ia tudung yang ditarikkan ke atas kotak, bukan atap yang diletakkan di atasnya.',
      glossEn:
        'Bellying outward and then falling steeply, its edge ending below the floor it protects — so it is a hood pulled over the box rather than a roof set on top of it.',
    },
  ]
}


/**
 * The row, because a lumbung is never the only building in the yard.
 *
 * This is the one building here that is not a house, and the claim it makes —
 * that the care in a building tracks the value of what is stored rather than
 * the standing of who lives there — is a comparison. It needs the other
 * buildings in the yard to be a comparison at all: a granary alone reads as
 * the house.
 *
 * Two footprints for the neighbouring lumbung. The dwellings are not drawn,
 * because a Sasak bale is a building this project has not built and would be
 * guessing at.
 */
function site(layout: Layout): readonly SiteMark[] {
  const spacing = DIMS.neighbourSpacing.value
  const plan = DIMS.neighbourPlan.value
  const half = plan / 2
  void layout
  /* The neighbours as massing: a raised block under a hood. */
  const floorY = DIMS.neighbourFloorY.value
  const bodyH = DIMS.neighbourBodyHeight.value
  const hood = DIMS.neighbourHoodHeight.value
  const post = DIMS.neighbourPostWidth.value
  const eave = DIMS.neighbourHoodEave.value
  const volumes: SiteVolume[] = []
  for (const sz of [-1, 1] as const) {
    const cz = sz * spacing
    for (const ex of [-1, 1] as const) {
      for (const ez of [-1, 1] as const) {
        volumes.push({
          kind: 'cylinder',
          at: [(ex * (plan - post)) / 2, 0, cz + (ez * (plan - post)) / 2],
          size: [post, floorY, post],
          material: 'kayu',
        })
      }
    }
    volumes.push({
      kind: 'box',
      at: [0, floorY, cz],
      size: [plan, bodyH, plan],
      material: 'kayu',
    })
    volumes.push({
      kind: 'cone',
      at: [0, floorY + bodyH, cz],
      size: [plan + eave * 2, hood, plan + eave * 2],
      material: 'atap',
    })
  }

  return [
    {
      key: 'jajaran',
      nameId: 'Jajaran lumbung',
      nameEn: 'The row of granaries',
      glossId:
        'Jejak dua lumbung lain di pekarangan yang sama. Bahwa bangunan paling dirawat di pekarangan bukan tempat orang tidur hanyalah terbaca bila yang lain ikut terlihat; rumah tinggalnya sendiri tidak dimodelkan.',
      glossEn:
        'The footprints of two more lumbung in the same yard. That the most carefully made building in the compound is not the one people sleep in only reads when the others are in view; the dwellings themselves are not modelled.',
      lines: [
        groundRect(-half, -spacing - half, half, -spacing + half),
        groundRect(-half, spacing - half, half, spacing + half),
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
  return {
    ridgeAxis: 2,
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: eave?.halfX ?? layout.halfX, z: eave?.halfZ ?? layout.halfZ },
    ridgeReach: Math.max(eave?.halfX ?? 0, eave?.halfZ ?? 0),
    weatherTop: topY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.floorY + layout.storeHeight, topY],
    zones: zones(layout, topY),
    site: site(layout),
    approachAt: [(eave?.halfX ?? layout.halfX) + DIMS.neighbourSpacing.value * 0.7, 0, 0],
    figureAt: [(eave?.halfX ?? layout.halfX) + 1.3, 0, 0],
  }
}
