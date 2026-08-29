/**
 * What the renderer needs to know about a honai.
 *
 * `underfloorHeight` is zero here, and it is the first zero in the collection.
 * Twelve buildings stand on posts or masonry and the field has meant a storey,
 * a plinth, something to sit on the edge of, a shaded working place. This one
 * sits on the earth on purpose — the ground holds heat — so the zero is a
 * decision, and the gloss says so rather than letting an empty field read as a
 * missing one.
 *
 * `ridgeAxis` is null, as on the mbaru niang and for the same reason: a circle
 * has no ridge and no face. That both round buildings need the null is the
 * evidence the field was right to be nullable.
 */

import { groundRect, groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, SiteVolume, Zone } from '@/lib/core/scene'
import { DIMS } from './rules'
import { domeProfile } from './roof'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const bands: Zone[] = [
    {
      key: 'api',
      fromY: 0,
      toY: layout.loft.present ? layout.loft.y : layout.eaveY,
      nameId: 'lantai dan api',
      nameEn: 'the floor and the fire',
      glossId:
        'Tungku di tengah, tanpa cerobong, di atas tanah yang menyimpan panasnya. Seluruh bangunan di atasnya ada untuk menahan panas yang keluar dari sini — dan tidak ada satu jendela pun di mana pun.',
      glossEn:
        'A hearth at the centre with no chimney, on ground that holds its heat. Everything above exists to keep in the warmth that comes off it — and there is no window anywhere at all.',
    },
  ]
  if (layout.loft.present) {
    bands.push({
      key: 'loteng',
      fromY: layout.loft.y,
      toY: layout.eaveY,
      nameId: 'loteng — tempat tidur',
      nameEn: 'the loft — where people sleep',
      glossId:
        'Panas naik, jadi bidang tidurnya diletakkan di tempat panas itu berada. Ini bukan penjelasan tentang mengapa rumah ini hangat; ini lantai yang diletakkan menurut penjelasan itu.',
      glossEn:
        'Heat rises, so the sleeping plane is put where the heat is. This is not an explanation of why the house is warm; it is a floor placed according to one.',
    })
  }
  bands.push({
    key: 'kubah',
    fromY: layout.eaveY,
    toY: topY,
    nameId: 'kubah',
    nameEn: 'the cap',
    glossId:
      'Rendah dan tebal. Bandingkan dengan mbaru niang, yang juga bundar dan juga beratap sampai tanah dan naik lima belas meter: kebundaran tidak mengatakan apa-apa dengan sendirinya.',
    glossEn:
      'Low and thick. Set it beside the mbaru niang, also round and also thatched to the ground and rising fifteen metres: roundness says nothing on its own.',
  })
  return bands
}


/**
 * The silimo: the compound a honai is one building of.
 *
 * A honai is a device for holding a fire's heat until morning, and it is also
 * one building of a group — the men's honai, the women's ebei, the wamai for
 * the pigs, inside one fence. The rule control already builds all three; what
 * it could not show is that they stand together, which is the unit a Dani
 * household actually lives in.
 *
 * The other two are footprints at their own radii, taken from the same rule
 * pack that would build them, so the circles are the size the model says they
 * are rather than a size drawn to look right.
 */
function site(layout: Layout): readonly SiteMark[] {
  const half = DIMS.compoundSide.value / 2
  const offset = DIMS.neighbourOffset.value
  /*
   * The fence as four runs, and the other two buildings as cones.
   *
   * The ebei and the wamai are real entries in this pack's own building rule —
   * a reader can build either one properly by changing it — so their massing
   * here is a stand-in for something the model can show in full, which is the
   * least dishonest kind of massing in the collection.
   */
  const fh = DIMS.fenceHeightSite.value
  const nh = DIMS.neighbourHeightSite.value
  const ft = DIMS.fenceThickness.value
  const ebei = DIMS.ebeiRadius.value
  const wamai = DIMS.wamaiRadius.value
  const volumes: SiteVolume[] = [
    { kind: 'box', at: [-half, 0, 0], size: [ft, fh, half * 2], material: 'kayu' },
    { kind: 'box', at: [half, 0, 0], size: [ft, fh, half * 2], material: 'kayu' },
    { kind: 'box', at: [0, 0, -half], size: [half * 2, fh, ft], material: 'kayu' },
    { kind: 'box', at: [0, 0, half], size: [half * 2, fh, ft], material: 'kayu' },
    {
      kind: 'cone',
      at: [offset, 0, -offset],
      size: [ebei * 2, nh, ebei * 2],
      material: 'atap',
    },
    {
      kind: 'cone',
      at: [-offset, 0, offset],
      size: [wamai * 2, nh - ebei + wamai, wamai * 2],
      material: 'atap',
    },
  ]

  return [
    {
      key: 'silimo',
      nameId: 'Silimo',
      nameEn: 'Silimo',
      glossId:
        'Pagar pekarangan, dan jejak dua bangunan lain di dalamnya — ebei dan wamai. Satu honai adalah satu bangunan dari sebuah kelompok, dan kelompok itulah tempat tinggalnya; ketiganya dapat dilihat satu per satu dengan mengganti aturan bangunannya.',
      glossEn:
        'The compound fence, and the footprints of the two other buildings inside it — the ebei and the wamai. One honai is one building of a group, and the group is the dwelling; all three can be seen in turn by changing the building rule.',
      lines: [
        groundRect(-half, -half, half, half),
        groundRing(offset, -offset, ebei),
        groundRing(-offset, offset, wamai),
      ],
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const profile = domeProfile(layout)
  const reach = (profile[0]?.r ?? layout.radius) + layout.thatchDepth
  return {
    // No ridge, no face, no corner — as on the mbaru niang.
    ridgeAxis: null,
    footprint: { x: layout.radius * 2, z: layout.radius * 2 },
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: topY,
    // Zero, and deliberately: see the note at the head of this file.
    underfloorHeight: 0,
    zoneLines: layout.loft.present ? [0, layout.loft.y, layout.eaveY, topY] : [0, layout.eaveY, topY],
    zones: zones(layout, topY),
    site: site(layout),
    figureAt: [reach + DIMS.eaveOversail.value + 1.2, 0, 0],
  }
}
