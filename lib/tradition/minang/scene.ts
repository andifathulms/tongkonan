/**
 * What the renderer needs to know about a rumah gadang.
 *
 * The same reading as the other house's and almost none of the same fields,
 * which is why the renderer takes this rather than a `Layout`.
 *
 * On the names: `kolong` is the ordinary word for the space under a raised
 * house and is used as such. Where a Minang term would be a guess the zone is
 * named in Indonesian instead, on the same principle the part names follow —
 * guessing at a name is the same failure as guessing at a metre, and less
 * visible.
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
      toY: layout.deckY,
      nameId: 'kolong',
      nameEn: 'kolong',
      glossId:
        'Ruang di bawah lantai. Rumah diangkat di atas tonggak yang berdiri pada batu sandi, tidak ditanam.',
      glossEn:
        'The space beneath the floor. The house stands on posts seated on stones rather than buried.',
    },
    {
      key: 'lantai',
      fromY: layout.deckY,
      toY: layout.plateY,
      nameId: 'ruang dalam',
      nameEn: 'the living floor',
      glossId:
        'Satu ruang panjang tanpa sekat di depan, dengan bilik berjajar di lanjar belakang. Pada laras Koto Piliang lantainya naik di kedua ujung menjadi anjuang.',
      glossEn:
        'One long unpartitioned space at the front, with the bilik ranged along the rear lanjar. Under the Koto Piliang laras the floor rises at both ends into anjuang.',
    },
    {
      key: 'para',
      fromY: layout.plateY,
      toY: topY,
      nameId: 'para',
      nameEn: 'the loft',
      glossId: 'Ruang di bawah atap, tempat penyimpanan.',
      glossEn: 'The space under the roof, used for storage.',
    },
  ]
}


/**
 * The rangkiang, which are the other half of this house's orientation rule.
 *
 * The tongkonan's constraint is absolute — north — and this one's is
 * relational: the rumah gadang faces the halaman with the rangkiang across
 * it. A relational rule with nothing on the other side of the relation is not
 * a rule, so with the yard empty the caution was the only place this house's
 * orientation existed at all.
 *
 * Footprints only, for the same reason as the tongkonan's alang: the rangkiang
 * are already named as an absence in the caution and a guessed granary would
 * turn that honest absence into an invented building.
 */
function site(layout: Layout): readonly SiteMark[] {
  const gap = DIMS.halamanDepth.value
  const plan = DIMS.rangkiangPlan.value
  const spacing = DIMS.rangkiangSpacing.value
  // The long face is the front, so the yard runs out on X.
  const near = layout.eaveHalfDepth + gap
  const lines = [-1, 0, 1].map((n) =>
    groundRect(near, n * spacing - plan / 2, near + plan, n * spacing + plan / 2),
  )

  /* Each granary as its massing — posts, a body, a roof — and no gonjong. */
  const floorY = DIMS.rangkiangFloorY.value
  const body = DIMS.rangkiangBodyHeight.value
  const rise = DIMS.rangkiangRoofRise.value
  const post = DIMS.rangkiangPostWidth.value
  const eave = DIMS.rangkiangEave.value
  const volumes: SiteVolume[] = []
  for (const n of [-1, 0, 1]) {
    const cx = near + plan / 2
    const cz = n * spacing
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        volumes.push({
          kind: 'box',
          at: [cx + sx * (plan - post) / 2, 0, cz + sz * (plan - post) / 2],
          size: [post, floorY, post],
          material: 'kayu',
        })
      }
    }
    volumes.push({
      kind: 'box',
      at: [cx, floorY, cz],
      size: [plan, body, plan],
      material: 'kayu',
    })
    volumes.push({
      kind: 'gable',
      at: [cx, floorY + body, cz],
      size: [plan + eave * 2, rise, plan + eave * 2],
      ridgeAxis: 2,
      material: 'atap',
    })
  }

  return [
    {
      key: 'rangkiang',
      nameId: 'Rangkiang',
      nameEn: 'Rangkiang',
      glossId:
        'Jejak denah tiga rangkiang di seberang halaman, menghadap muka rumah yang panjang. Kendala hadap rumah gadang bersifat hubungan: ia menghadap halaman dengan rangkiang di seberangnya, jadi tanpa rangkiang aturan itu tidak menyebut apa pun.',
      glossEn:
        'The footprints of three rangkiang across the halaman, facing the house’s long front. The rumah gadang’s orientation is relational: it faces the yard with the rangkiang across it, so without them the rule says nothing.',
      lines,
      closed: true,
      volumes,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  const lines = [0, layout.floorFrameY, layout.deckY]
  // The anjuang floor is a line worth drawing only where there is one, and
  // its absence under Bodi Caniago is the statement rather than an omission.
  if (layout.anjuangRise > 0) lines.push(layout.anjuangY)
  lines.push(layout.plateY, topY)

  return {
    // The ridge runs end to end and the house mirrors along it, so the
    // section is cut on X — a cut across the ridge would show one bay, and
    // the thing worth seeing is the floor stepping up at both ends.
    ridgeAxis: 2,
    footprint: { x: layout.bodyDepth, z: layout.bodyLength },
    drip: { x: layout.eaveHalfDepth, z: layout.ridgeEndZ },
    ridgeReach: layout.ridgeEndZ,
    weatherTop: layout.ridgeEndY,
    underfloorHeight: layout.kolongHeight,
    zoneLines: lines,
    zones: zones(layout, topY),
    site: site(layout),
    approachAt: [layout.eaveHalfDepth + DIMS.halamanDepth.value * 0.45, 0, 0],
    figureAt: [layout.eaveHalfDepth + 1.4, 0, layout.bodyLength * 0.28],
  }
}
