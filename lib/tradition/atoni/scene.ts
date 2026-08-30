/**
 * What the renderer needs to know about an ume kbubu.
 *
 * `zones` fit unusually well and say something the other packs' cannot: the
 * bands here are *the fire*, *the smoke*, and *the seed in it*. It is the only
 * building in the collection whose horizontal divisions are a process rather
 * than a set of rooms — nobody lives on a band, they sit in the lowest one and
 * the maize hangs in the highest.
 *
 * `underfloorHeight` is zero, for the second time after the honai, and for the
 * same reason: the floor is the ground, because the ground holds heat and
 * because there is nothing to keep out from underneath.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const seedTop = layout.loft.y + layout.loft.depth
  return [
    {
      key: 'api',
      fromY: 0,
      toY: layout.smoke.from,
      nameId: 'api dan lantai',
      nameEn: 'the fire and the floor',
      glossId: 'Tanah, dan lingkar batu perapian di tengahnya. Di sinilah orang duduk, dan di sinilah satu-satunya bagian bangunan yang tidak dapat digambar berada: apinya.',
      glossEn: 'Earth, and the ring of hearth stones in the middle of it. This is where people sit, and where the one part of this building that cannot be drawn is: the fire.',
    },
    {
      key: 'asap',
      fromY: layout.smoke.from,
      toY: layout.loft.y,
      nameId: 'asap',
      nameEn: 'the smoke',
      glossId: `Pita antara api dan para. Ini satu-satunya pita mendatar dalam kumpulan ini yang bukan ruang melainkan proses — tidak ada yang tinggal di dalamnya, dan justru itu yang membuat bangunannya berguna.`,
      glossEn: `The band between the fire and the loft. It is the only horizontal band in this collection that is a process rather than a space — nobody is in it, and it is what makes the building useful.`,
    },
    {
      key: 'benih',
      fromY: layout.loft.y,
      toY: seedTop,
      nameId: 'benih',
      nameEn: 'the seed',
      glossId: `Benih ${layout.loft.years} panen, tergantung setebal ${layout.loft.depth.toFixed(2)} m di dalam asap. Dalamnya pita ini adalah lamanya waktu: satu-satunya ukuran dalam projek ini yang berasal dari sana.`,
      glossEn: `${layout.loft.years} harvests of seed, hanging ${layout.loft.depth.toFixed(2)} m deep in the smoke. The depth of this band is a length of time: the only dimension in this project that comes from one.`,
    },
    {
      key: 'kubah',
      fromY: seedTop,
      toY: topY,
      nameId: 'kubah',
      nameEn: 'the dome',
      glossId: 'Alang-alang sampai puncak, tidak terputus di mana pun di atas kepala pintu. Dua puluh tujuh atap lain di sini hanya perlu menahan air di luar; yang ini juga menahan asap di dalam.',
      glossEn: 'Thatch to the apex, unbroken anywhere above the head of the door. The other twenty-seven roofs here only have to keep water out; this one also keeps smoke in.',
    },
  ]
}

/**
 * The swept yard, and the lopo standing in it.
 *
 * The lopo is a part rather than a site mark, because the rule that puts it
 * there is one of this pack's own — so what is left for the site is the ground
 * the two of them share, kept bare and swept, which is where the maize is laid
 * out in the sun before any of it goes indoors.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = DIMS.yardRadius.value
  const volumes: SiteVolume[] = []
  volumes.push({
    kind: 'cylinder',
    at: [r * 0.62, 0, -r * 0.5],
    size: [1.5, 0.35, 1.5],
    material: 'batu',
  })
  return [
    {
      key: 'halaman',
      nameId: 'Halaman',
      nameEn: 'The swept yard',
      glossId: `Tanah yang disapu bersih di sekeliling rumah, jari-jarinya ${r.toFixed(0)} m: di sinilah jagung dijemur di bawah matahari sebelum ada yang masuk ke dalam. Lopo berdiri di halaman yang sama dan ada di dalam daftar bagian, bukan di sini, sebab yang menempatkannya adalah aturan pak ini sendiri.`,
      glossEn: `Ground swept bare around the house, ${r.toFixed(0)} m across: this is where the maize is dried in the sun before any of it goes indoors. The lopo stands in the same yard and is in the part list rather than here, because what puts it there is one of this pack’s own rules.`,
      lines: [groundRing(0, 0, r, 36)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const seedTop = layout.loft.y + layout.loft.depth
  return {
    // Round: there is no ridge, and the axis is the one the door faces along.
    ridgeAxis: 0,
    footprint: { x: layout.radius * 2, z: layout.radius * 2 },
    drip: { x: layout.radius + DIMS.thatchThickness.value, z: layout.radius + DIMS.thatchThickness.value },
    ridgeReach: layout.radius + DIMS.thatchThickness.value,
    weatherTop: layout.apexY,
    // Zero, for the second time after the honai and for the same reason: the
    // floor is the ground, and the ground holds the heat.
    underfloorHeight: 0,
    zoneLines: [0, layout.smoke.from, layout.loft.y, seedTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met from the door side, which is the only side that has anything on it.
    approachAt: [-layout.radius * 4, 0, 0],
    figureAt: [-layout.radius * 1.8, 0, layout.radius * 0.9],
  }
}
