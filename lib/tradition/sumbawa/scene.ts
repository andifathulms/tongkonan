/**
 * What the renderer needs to know about Dalam Loka.
 *
 * `footprint` is the plainest reading of the field in the whole collection and
 * it is worth saying why: this building's plan *is* its grid, and its grid is a
 * number out of a text. Eight metres by ten is not a proportion anybody chose;
 * it is ninety-nine posts at the spacing a beam allows.
 */

import { groundBox } from '@/lib/core/scene'
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
      nameEn: 'the underfloor',
      glossId: `${layout.floorY.toFixed(2)} m di atas tanah, di atas sembilan puluh sembilan tiang yang berdiri pada batu. Tidak ada yang ditanam, dan tidak ada satu pun yang berdiri tanpa memikul.`,
      glossEn: `${layout.floorY.toFixed(2)} m up, on ninety-nine posts standing on stones. Nothing is buried, and not one of them stands under nothing.`,
    },
    {
      key: 'balai',
      fromY: layout.floorY,
      toY: layout.wallTop,
      nameId: 'bala rea dan bagian dalam',
      nameEn: 'the great hall and the inner part',
      glossId: `Dua balai di atas satu lantai: bala rea di depan dan ${layout.rules.bilik} bilik di belakangnya, dipisahkan sebuah sekat. Grid yang sama berjalan di bawah keduanya.`,
      glossEn: `Two halls on one floor: the bala rea at the front and ${layout.rules.bilik} rooms behind it, divided by a partition. The same grid runs under both.`,
    },
    {
      key: 'atap',
      fromY: layout.wallTop,
      toY: topY,
      nameId: 'atap',
      nameEn: 'the roof',
      glossId: 'Satu atap sirap di atas kedua balai sekaligus.',
      glossEn: 'One shingle roof over both halls at once.',
    },
  ]
}

/**
 * The walled court.
 *
 * A palace is the one kind of building in this collection whose site is a
 * jurisdiction: the wall around Dalam Loka is not a defence like the Keraton
 * wall at Baubau but a line marking where the sultanate's own ground begins.
 */
function site(layout: Layout): readonly SiteMark[] {
  const r = DIMS.courtRadius.value
  const volumes: SiteVolume[] = [
    {
      kind: 'box',
      at: [-r * 0.75, 0, 0],
      size: [0.5, 1.8, r * 1.2],
      material: 'batu',
    },
  ]
  return [
    {
      key: 'halaman-istana',
      nameId: 'Halaman istana',
      nameEn: 'The palace court',
      glossId: `Halaman berjari-jari ${r.toFixed(0)} m di dalam pagar keliling. Istana adalah satu-satunya jenis bangunan dalam kumpulan ini yang tapaknya sebuah kewenangan: pagar ini bukan pertahanan seperti dinding benteng di Baubau, melainkan garis yang menandai di mana tanah kesultanan mulai.`,
      glossEn: `A court ${r.toFixed(0)} m across inside its wall. A palace is the one kind of building in this collection whose site is a jurisdiction: this wall is not a defence like the fortress wall at Baubau but a line marking where the sultanate’s own ground begins.`,
      lines: [groundBox(0, 0, r * 2, r * 1.6)],
      closed: true,
      volumes,
      provenance: 'interpolated',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const over = DIMS.eaveOversail.value
  return {
    // The ridge runs along Z, down the length of both halls.
    ridgeAxis: 2,
    // The plan is the grid, and the grid is a number out of a text.
    footprint: { x: layout.halfX * 2, z: layout.halfZ * 2 },
    drip: { x: layout.halfX + over, z: layout.halfZ + over },
    ridgeReach: layout.halfZ + over,
    weatherTop: layout.ridgeY,
    underfloorHeight: layout.floorY,
    zoneLines: [0, layout.floorY, layout.wallTop, topY],
    zones: zones(layout, topY),
    site: site(layout),
    // Met at the front of the great hall, from inside the court.
    approachAt: [0, 0, -(layout.halfZ + DIMS.courtRadius.value * 0.45)],
    figureAt: [layout.halfX * 1.3, 0, -layout.halfZ * 0.8],
  }
}
