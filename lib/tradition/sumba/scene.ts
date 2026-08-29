/**
 * What the renderer needs to know about an uma.
 *
 * `weatherTop` finally means something extreme. On seven houses it is the top
 * of a roof that covers a body; here it is the top of a container that the
 * body is a foot for, and on a tall tower it is three times the height of
 * anything a person occupies. A reader comparing ridge heights across the
 * registry is comparing shelters, except here.
 *
 * The zones are the house, the roof over it, and — when there is one — the
 * tower as its own band. That third band is the only zone in this project
 * that is neither a storey people use nor a roof over one: it is a store, and
 * the whole building exists to hold it up.
 */

import { groundRect } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const base: Zone[] = [
    {
      key: 'rumah',
      fromY: 0,
      toY: layout.eaveY,
      nameId: 'rumah — kolong, lantai, dinding',
      nameEn: 'the house — understorey, floor, walls',
      glossId:
        'Rendah, dan sengaja. Panggungnya pendek dan dindingnya lebih pendek lagi: ini rumah tempat orang duduk, bukan berdiri. Yang penting pada bangunan ini bukan bagian ini.',
      glossEn:
        'Low, and deliberately so. The platform is short and the walls shorter: this is a house people sit in rather than stand in. This is not the part of the building that matters.',
    },
    {
      key: 'atap',
      fromY: layout.eaveY,
      toY: layout.shoulderY,
      nameId: 'atap bawah',
      nameEn: 'the lower roof',
      glossId:
        'Atap limas yang menaungi rumah dan serambinya, dan berhenti di bahu. Pada rumah tanpa menara, di sinilah bangunan berakhir.',
      glossEn:
        'The hipped roof that shelters the house and its veranda, stopping at the shoulder. On a house without a tower, this is where the building ends.',
    },
  ]
  if (!layout.menara.present) return base
  return [
    ...base,
    {
      key: 'menara',
      fromY: layout.shoulderY,
      toY: topY,
      nameId: 'menara — uma deta',
      nameEn: 'the tower — the uma deta',
      glossId:
        'Bagian terbesar bangunan, dan tidak ada orang tinggal di dalamnya. Di sini marapu disimpan — dan seluruh bangunan di bawahnya ada untuk menahannya. Ini satu-satunya bidang dalam projek ini yang bukan lantai yang dipakai orang dan bukan atap di atasnya, melainkan sebuah simpanan.',
      glossEn:
        'The largest part of the building, and nobody lives in it. The marapu are kept here — and everything beneath exists to hold it up. It is the only band in this project that is neither a storey people use nor a roof over one: it is a store.',
    },
  ]
}


/**
 * The square, and the graves in it.
 *
 * The tower keeps the marapu, and the reason a household keeps them is
 * standing in front of the house: uma face a village square on a hilltop with
 * the megalithic graves of the ancestors lying in it. The building is a
 * container for the ancestors and it looks at where they are buried, which is
 * a relationship no view of the house alone can show.
 *
 * Footprints, not slabs. A Sumbanese grave is a monument with its own carving
 * and its own tonnage, and inventing one to decorate a yard would be worse
 * than drawing a rectangle and saying what stood there.
 */
function site(layout: Layout): readonly SiteMark[] {
  const depth = DIMS.squareDepth.value
  const plan = DIMS.gravePlan.value
  const front = layout.eaveHalfX
  /*
   * The graves as stone: a slab on legs, which is what they are.
   *
   * A Sumbanese grave is a single great capstone carried clear of the ground
   * on stone legs, and it is carved. This is the slab and the legs at a size
   * the author chose, with no carving on it — the shape of the thing, not a
   * portrait of one.
   */
  const legH = DIMS.graveLegHeight.value
  const legW = DIMS.graveLegWidth.value
  const slab = DIMS.graveSlabDepth.value
  const volumes: SiteVolume[] = []
  const overhang = DIMS.graveSlabOverhang.value
  const gap = DIMS.graveGap.value
  for (const sz of [-1, 1] as const) {
    const cx = -front - depth + plan / 2
    const cz = sz * (plan + gap) / 2
    for (const ex of [-1, 1] as const) {
      for (const ez of [-1, 1] as const) {
        volumes.push({
          kind: 'box',
          at: [cx + (ex * (plan - legW)) / 2, 0, cz + (ez * (plan - legW)) / 2],
          size: [legW, legH, legW],
          material: 'batu',
        })
      }
    }
    volumes.push({
      kind: 'box',
      at: [cx, legH, cz],
      size: [plan + overhang * 2, slab, plan + overhang * 2],
      material: 'batu',
    })
  }

  return [
    {
      key: 'kubur',
      nameId: 'Pelataran dan kubur batu',
      nameEn: 'The square and the stone graves',
      glossId:
        'Jejak dua kubur batu megalitik di pelataran kampung, di muka rumah. Rumah yang menyimpan marapu di menaranya berdiri berhadapan dengan kubur orang-orang yang diwakilinya. Batunya sendiri tidak dimodelkan.',
      glossEn:
        'The footprints of two megalithic graves in the village square in front of the house. The house that keeps the marapu in its tower stands facing the graves of the people it keeps them for. The slabs themselves are not modelled.',
      lines: [-1, 1].map((sz) => {
        const cz = (sz * (plan + DIMS.graveGap.value)) / 2
        return groundRect(-front - depth, cz - plan / 2, -front - depth + plan, cz + plan / 2)
      }),
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  return {
    ridgeAxis: 2,
    footprint: { x: layout.coreHalfX * 2, z: layout.coreHalfZ * 2 },
    drip: { x: layout.eaveHalfX, z: layout.eaveHalfZ },
    ridgeReach: Math.max(layout.eaveHalfX, layout.eaveHalfZ),
    /*
     * The top of a container, not of a shelter.
     *
     * Reported like the other seven and meaning something else: on a tall
     * tower this figure is three times the height of anything a person
     * occupies, because what is up there is kept rather than lived in.
     */
    weatherTop: topY,
    // Low, and the lowest of the raised houses here. What matters on this
    // building is above it rather than beneath it.
    underfloorHeight: layout.floorY,
    zoneLines: layout.menara.present
      ? [0, layout.eaveY, layout.shoulderY, topY]
      : [0, layout.eaveY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    figureAt: [layout.eaveHalfX + 1.6, 0, 0],
  }
}
