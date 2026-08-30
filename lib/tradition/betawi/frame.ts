/**
 * The rumah kebaya, from the plinth up — inside a line it did not draw.
 *
 * The road is at −Z and the plot runs back from it. The langkan faces the
 * road, the body of the house is behind it, and the ridge runs along X,
 * parallel to the street — which is why the fold in the roof is what you see
 * from the side.
 *
 * The ridge is turned with `swapXZ`, the quarter turn the Minang roof asked
 * about years ago and the Banjar pack moved into the core. This is the third
 * building to use it and the first on the stepped hip rather than the sweep.
 */

import { shiftMesh, swapXZ } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import type { RoofLevel } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, setbackOf } from './rules'
import type { DimKey } from './rules'
import type { BetawiKinds, Joint, Layout, Part, Rules } from './types'

const builders = partBuilders<BetawiKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const plotHalfX = DIMS.plotWidth.value / 2
  const plotHalfZ = DIMS.plotDepth.value / 2
  const setback = setbackOf(rules.letak)

  const houseHalfX = (rules.kamar * DIMS.roomWidth.value) / 2
  const langkanDepth = DIMS.langkanDepth.value
  const frontZ = -plotHalfZ + setback
  const coreFrom = frontZ + langkanDepth
  const coreTo = coreFrom + DIMS.coreDepth.value
  const houseHalfZ = (coreTo - coreFrom) / 2

  const floorY = DIMS.plinthHeight.value
  const wallTop = floorY + DIMS.wallHeight.value

  /*
   * The roof covers the house and the terrace together, and folds once on its
   * way down: steep over the house, shallower out over the langkan. The two
   * pitches are separate figures, so one can be made steeper than the other —
   * or, if somebody is careless, not.
   */
  const halfDepth = (coreTo - frontZ) / 2 + DIMS.eaveOversail.value
  const at = DIMS.foldAt.value * halfDepth
  const upper = DIMS.upperPitch.value
  const lower = DIMS.lowerPitch.value
  const foldY = wallTop + lower * (halfDepth - at)
  const ridgeY = foldY + upper * at

  return {
    rules,
    plot: { halfX: plotHalfX, halfZ: plotHalfZ, setback },
    house: { halfX: houseHalfX, halfZ: houseHalfZ, front: coreFrom },
    langkan: { depth: langkanDepth, floorY, railY: floorY + DIMS.langkanRail.value },
    floorY,
    wallTop,
    ridgeY,
    fold: { at, y: foldY, upper, lower },
    gigiBalang: rules.gigiBalang,
    // What is left between the house and the line it may not cross.
    margin: plotHalfX - houseHalfX,
    dims: [],
  }
}

/** The centre of the roof, which spans the house and the terrace together. */
export function roofCentre(layout: Layout): number {
  const frontZ = -layout.plot.halfZ + layout.plot.setback
  const backZ = layout.house.front + layout.house.halfZ * 2
  return (frontZ + backZ) / 2
}

/** Three levels: eave, fold, ridge — and the fold is the whole point. */
export function roofLevels(layout: Layout): readonly RoofLevel[] {
  const over = DIMS.eaveOversail.value
  const halfDepth = (layout.house.front + layout.house.halfZ * 2 - (-layout.plot.halfZ + layout.plot.setback)) / 2 + over
  const halfWidth = layout.house.halfX + over
  return [
    { key: 'tritis', halfX: halfDepth, halfZ: halfWidth, y: layout.wallTop },
    { key: 'lipatan', halfX: layout.fold.at, halfZ: halfWidth, y: layout.fold.y },
    { key: 'bubungan', halfX: 0, halfZ: halfWidth, y: layout.ridgeY },
  ]
}

/* ── The build ────────────────────────────────────────────────────────── */

const PLOT_DIMS: readonly DimKey[] = ['plotWidth', 'plotDepth', 'sideMargin', 'theLineIsSomebodyElses']

export function buildHouseParts(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const engage = DIMS.jointEngagement.value
  const post = DIMS.postSection.value
  const seat = DIMS.postSeat.value
  const wallT = DIMS.wallThickness.value
  const floorY = layout.floorY
  const frontZ = -layout.plot.halfZ + layout.plot.setback
  const coreFrom = layout.house.front
  const coreTo = coreFrom + layout.house.halfZ * 2
  const coreMid = (coreFrom + coreTo) / 2

  /* The plinth, and the terrace's own step of it, inside the plot line. */
  parts.push(
    box(
      'pondasi',
      { name: 'pondasi', nameId: 'Lantai bata', nameEn: 'Brick plinth' },
      'pondasi',
      0,
      'bata',
      ['plinthHeight', 'roomWidth', 'coreDepth', ...PLOT_DIMS],
      [0, floorY / 2, coreMid],
      [layout.house.halfX * 2, floorY, layout.house.halfZ * 2],
    ),
  )
  parts.push(
    box(
      'ubin',
      { name: 'ubin', nameId: 'Ubin', nameEn: 'Floor tiles' },
      'pondasi',
      1,
      'ubin',
      ['tileThickness', 'coreDepth', 'everythingIsBought'],
      [0, floorY + DIMS.tileThickness.value / 2, coreMid],
      [layout.house.halfX * 2, DIMS.tileThickness.value, layout.house.halfZ * 2],
    ),
  )

  /* The frame. */
  const columns: readonly (readonly [number, number])[] = [
    [-(layout.house.halfX - post), coreFrom + post],
    [layout.house.halfX - post, coreFrom + post],
    [-(layout.house.halfX - post), coreTo - post],
    [layout.house.halfX - post, coreTo - post],
    [-(layout.house.halfX - post), coreMid],
    [layout.house.halfX - post, coreMid],
  ]
  columns.forEach(([x, z], i) => {
    const id = `tiang-${i}`
    parts.push(
      box(
        id,
        { name: 'tiang', nameId: `Tiang ${i + 1}`, nameEn: `Post ${i + 1}` },
        'rangka',
        i,
        'kayu',
        ['postSection', 'postSeat', 'wallHeight', 'plinthHeight'],
        // Seated into the plinth rather than standing on its face, so the peg
        // through the two has something to pass through.
        [x, (floorY - seat + layout.wallTop) / 2, z],
        [post, layout.wallTop - floorY + seat, post],
      ),
    )
    if (i === 0) {
      joints.push({
        id: 'pasak-tiang',
        kind: 'pasak',
        mortise: 'pondasi',
        tenon: id,
        at: [x, floorY - seat / 2, z],
        halfExtents: [(post * engage) / 2, (seat * engage) / 2, (post * engage) / 2],
      })
    }
  })

  /* Walls: closed on three sides, and the front left open onto the terrace. */
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `dinding-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding samping', nameEn: 'Side wall' },
        'dinding',
        sx > 0 ? 0 : 1,
        'papan',
        ['wallHeight', 'wallThickness', 'coreDepth'],
        [sx * (layout.house.halfX - wallT / 2), (floorY + layout.wallTop) / 2, coreMid],
        [wallT, layout.wallTop - floorY, layout.house.halfZ * 2],
      ),
    )
  }
  parts.push(
    box(
      'dinding-belakang',
      { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Back wall' },
      'dinding',
      2,
      'papan',
      ['wallHeight', 'wallThickness', 'roomWidth'],
      [0, (floorY + layout.wallTop) / 2, coreTo - wallT / 2],
      [layout.house.halfX * 2, layout.wallTop - floorY, wallT],
    ),
  )
  /*
   * The front wall, and the first door of the house is in it — which puts the
   * door *behind* the terrace. That is the whole of `theFrontIsForStrangers`
   * in the geometry: to get onto the langkan nobody has to pass a door, and to
   * get past it everybody does.
   */
  const doorHalf = 0.5
  for (const sx of [-1, 1] as const) {
    const from = sx > 0 ? doorHalf : -layout.house.halfX
    const to = sx > 0 ? layout.house.halfX : -doorHalf
    parts.push(
      box(
        `dinding-muka-${sx > 0 ? 'a' : 'b'}`,
        { name: 'dinding', nameId: 'Dinding muka', nameEn: 'Front wall' },
        'dinding',
        3 + (sx > 0 ? 0 : 1),
        'papan',
        ['wallHeight', 'wallThickness', 'theFrontIsForStrangers'],
        [(from + to) / 2, (floorY + layout.wallTop) / 2, coreFrom + wallT / 2],
        [to - from, layout.wallTop - floorY, wallT],
      ),
    )
  }

  /*
   * The roof: one plane that folds. The stepped hip builds its ridge along Z,
   * so the whole thing is turned a quarter with `swapXZ` to lay the ridge
   * parallel to the road — which is why the fold is what you see from the side.
   */
  parts.push(
    mesh(
      'atap',
      { name: 'atap', nameId: 'Atap genteng', nameEn: 'Tiled roof' },
      'atap',
      0,
      'genteng',
      ['foldAt', 'upperPitch', 'lowerPitch', 'eaveOversail', 'roofThickness', 'theRoofFolds'],
      shiftMesh(swapXZ(steppedHip(roofLevels(layout), { uvScale: 0.5 })), 0, 0, roofCentre(layout)),
    ),
  )

  /*
   * The langkan: a raised floor at the front with a low rail and no door
   * between it and the road.
   */
  parts.push(
    box(
      'langkan',
      { name: 'langkan', nameId: 'Langkan', nameEn: 'The front terrace' },
      'langkan',
      0,
      'bata',
      ['langkanDepth', 'plinthHeight', 'theFrontIsForStrangers'],
      [0, floorY / 2, (frontZ + coreFrom) / 2],
      [layout.house.halfX * 2, floorY, layout.langkan.depth],
    ),
  )
  parts.push(
    box(
      'ubin-langkan',
      { name: 'ubin', nameId: 'Ubin langkan', nameEn: 'Terrace tiles' },
      'langkan',
      1,
      'ubin',
      ['tileThickness', 'langkanDepth', 'everythingIsBought'],
      [0, floorY + DIMS.tileThickness.value / 2, (frontZ + coreFrom) / 2],
      [layout.house.halfX * 2, DIMS.tileThickness.value, layout.langkan.depth],
    ),
  )
  const rail = DIMS.langkanRail.value
  const railT = DIMS.wallThickness.value
  parts.push(
    box(
      'pagar-langkan',
      { name: 'pagar', nameId: 'Pagar langkan', nameEn: 'Terrace rail' },
      'langkan',
      2,
      'kayu',
      ['langkanRail', 'wallThickness', 'theFrontIsForStrangers'],
      [0, floorY + rail / 2, frontZ + railT / 2],
      [layout.house.halfX * 2, rail, railT],
    ),
  )
  for (const sx of [-1, 1] as const) {
    parts.push(
      box(
        `pagar-samping-${sx > 0 ? 'a' : 'b'}`,
        { name: 'pagar', nameId: 'Pagar samping', nameEn: 'Side rail' },
        'langkan',
        3 + (sx > 0 ? 0 : 1),
        'kayu',
        ['langkanRail', 'wallThickness', 'langkanDepth'],
        [sx * (layout.house.halfX - railT / 2), floorY + rail / 2, (frontZ + coreFrom) / 2],
        [railT, rail, layout.langkan.depth],
      ),
    )
  }
  parts.push(
    box(
      'tangga',
      { name: 'tangga', nameId: 'Anak tangga', nameEn: 'Step' },
      'langkan',
      5,
      'bata',
      ['langkanStep', 'plinthHeight'],
      [0, DIMS.langkanStep.value / 2, frontZ - DIMS.langkanStep.value * 2],
      [layout.house.halfX, DIMS.langkanStep.value, DIMS.langkanStep.value * 4],
    ),
  )

  /* The gigi balang, nailed along the eave. Its carving is not modelled. */
  if (layout.gigiBalang) {
    const gigi = DIMS.gigiHeight.value
    const halfDepth = (coreTo - frontZ) / 2 + DIMS.eaveOversail.value
    for (const sz of [-1, 1] as const) {
      const id = `gigi-${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          id,
          { name: 'gigi-balang', nameId: 'Gigi balang', nameEn: 'Gigi balang' },
          'hias',
          sz > 0 ? 0 : 1,
          'papan',
          ['gigiHeight', 'gigiThickness', 'gigiOverlap', 'eaveOversail'],
          // Hung from the tiling it is nailed to: its head reaches up into the
          // roof rather than stopping under it.
          [
            0,
            layout.wallTop + DIMS.gigiOverlap.value - gigi / 2,
            roofCentre(layout) + sz * (halfDepth - DIMS.gigiThickness.value),
          ],
          [(layout.house.halfX + DIMS.eaveOversail.value) * 2, gigi, DIMS.gigiThickness.value],
        ),
      )
      if (sz < 0) {
        joints.push({
          id: 'paku-gigi',
          kind: 'paku',
          mortise: 'atap',
          tenon: id,
          at: [
            0,
            layout.wallTop + DIMS.gigiOverlap.value / 2,
            roofCentre(layout) - halfDepth + DIMS.gigiThickness.value,
          ],
          halfExtents: [
            (DIMS.gigiHeight.value * engage) / 2,
            (DIMS.gigiThickness.value * engage) / 2,
            (DIMS.gigiThickness.value * engage) / 2,
          ],
        })
      }
    }
  }

  return { parts, joints }
}
