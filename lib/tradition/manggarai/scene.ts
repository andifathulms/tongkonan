/**
 * What the renderer needs to know about a mbaru niang.
 *
 * The house that finally makes `zones` carry what it was always supposed to.
 *
 * Both earlier stacks were readings: the tongkonan's three worlds fit the
 * field well, and the joglo's centre-and-periphery had to be flattened into
 * horizontal bands to fit at all. Here the vertical stack *is* the building's
 * argument — five named floors rising from what is eaten today to what is
 * offered to the ancestors — so the zones are not an interpretation of the
 * form, they are the form. The section cut is the route.
 *
 * And the field that does not fit is `ridgeAxis`, which is null: a cone has no
 * ridge, no face and no corner, so there is no direction to name. Everything
 * directional the renderer does — the drip lines, the zone lines, where rain
 * falls — is stated against an axis this house does not have, and it works out
 * only because on a round house one bearing is as good as another.
 */

import { groundRing } from '@/lib/core/scene'
import type { SceneModel, SiteMark, Zone } from '@/lib/core/scene'
import { coneAt } from '@/lib/core/cone'
import { DIMS } from './rules'
import type { House, Layout } from './types'

function zones(layout: Layout, topY: number): readonly Zone[] {
  const lutur = layout.levels[0]
  const beneath: Zone = {
    key: 'kolong',
    fromY: 0,
    toY: lutur?.y ?? 0,
    nameId: 'kolong',
    nameEn: 'beneath the floor',
    glossId:
      'Ruang di bawah lantai hunian. Rumah ini berpanggung, tetapi ijuk turun sampai ke tanah dan menutupnya, jadi dari luar tidak ada tanda bahwa ada ruang di sana sama sekali.',
    glossEn:
      'The space under the living floor. The house is raised, but the thatch comes down to the ground and closes it, so from outside there is no sign that any space is there at all.',
  }
  return [
    beneath,
    ...layout.levels.map((level, i) => {
      const above = layout.levels[i + 1]
      return {
        key: level.key,
        fromY: level.y,
        toY: above ? above.y : topY,
        nameId: level.name,
        nameEn: level.name,
        glossId: level.glossId,
        glossEn: level.glossEn,
      }
    }),
  ]
}


/**
 * The village, which is a circle with a stone at the middle of it.
 *
 * This is the one house in the collection with no face, no corner and no
 * ridge, and the reason it needs none is that the village gives it one:
 * mbaru niang stand around a circular plaza with the compang at the centre,
 * and every house looks in. A cone standing by itself on the ground is a
 * building whose orientation has nowhere to come from.
 *
 * The plaza circle passes through the house rather than around it, because
 * the house is *on* the circle — it is one of the ring, not the middle of it.
 * The centre is where the compang is, which is where the model is not.
 */
function site(layout: Layout): readonly SiteMark[] {
  const plaza = DIMS.plazaRadius.value
  const stone = DIMS.compangRadius.value
  // The house sits on the ring, so the centre of the village is one plaza
  // radius away — out on +X, which puts the compang behind the viewer's
  // default vantage rather than under the house.
  const cx = plaza
  return [
    {
      key: 'compang',
      nameId: 'Compang dan pelataran',
      nameEn: 'The compang and the plaza',
      glossId:
        'Susunan batu upacara di pusat kampung, dan lingkaran pelataran yang dilalui rumah-rumahnya. Mbaru niang berdiri melingkar menghadap ke dalam: rumah ini tidak punya muka sampai ada lingkaran yang memberinya muka. Batunya sendiri tidak dimodelkan.',
      glossEn:
        'The ceremonial stone platform at the centre of the village, and the circle of the plaza the houses stand on. Mbaru niang stand in a ring facing inward: this house has no front until the circle gives it one. The stones themselves are not modelled.',
      lines: [groundRing(cx, 0, stone), groundRing(cx, 0, plaza)],
      closed: true,
      provenance: 'canon',
    },
  ]
}

export function sceneModel(house: House, layout: Layout): SceneModel {
  const topY = house.bounds.max[1]
  // Where the thatch actually meets the ground, which is a little outside the
  // frame it beds on.
  const foot = coneAt(layout.profile, 0)
  const reach = foot.r + DIMS.rafterRadius.value + DIMS.thatchBed.value + DIMS.thatchThickness.value

  return {
    // No ridge. See the note at the head of this file, and `SceneModel`.
    ridgeAxis: null,
    footprint: { x: layout.baseRadius * 2, z: layout.baseRadius * 2 },
    /*
     * The drip line is the base circle itself.
     *
     * Every other house in this project sheds its water clear of its post
     * feet, and the depth of the overhang that achieves it is one of the
     * arguments the model makes. Here the roof runs to the ground, so the
     * water arrives at the wall line because the wall line and the roof line
     * are the same thing — the demonstration is that there is nothing to keep
     * dry outside it.
     */
    drip: { x: reach, z: reach },
    ridgeReach: reach,
    weatherTop: topY,
    // Enclosed, but a metre and a quarter: a raised floor rather than a storey.
    underfloorHeight: layout.levels[0]?.y ?? 0,
    zoneLines: [0, ...layout.levels.map((l) => l.y), topY],
    zones: zones(layout, topY),
    site: site(layout),
    figureAt: [reach + 1.8, 0, 0],
  }
}
