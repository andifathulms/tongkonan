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

import type { SceneModel, Zone } from '@/lib/core/scene'
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
    figureAt: [(eave?.halfX ?? layout.halfX) + 1.3, 0, 0],
  }
}
