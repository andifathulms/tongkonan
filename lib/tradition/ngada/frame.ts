/**
 * The pairs, from the square outward.
 *
 * The square is levelled first because everything here stands inside it, and
 * within each pair the post goes up before the little house — which is the
 * order the sources give and also the order that makes the point: a ngadhu
 * standing alone is a statement waiting for its other half.
 *
 * Axes as everywhere else: X runs front to rear, Y is up, Z is transverse.
 * The nua runs along Z, the posts stand on one side of its axis and the little
 * houses on the other, so a pair faces across the square.
 */

import { coneSurface } from '@/lib/core/cone'
import type { ConePoint } from '@/lib/core/cone'
import { shiftMesh } from '@/lib/core/geometry'
import { steppedHip } from '@/lib/core/hip'
import { partBuilders } from '@/lib/core/parts'
import { DIMS, heightOf } from './rules'
import type { DimKey } from './rules'
import type { Joint, Layout, NgadaKinds, Part, Pasangan, Rules } from './types'

const builders = partBuilders<NgadaKinds>()
const box = builders.box
const mesh = builders.mesh

/* ── Layout ───────────────────────────────────────────────────────────── */

export function resolveLayout(rules: Rules): Layout {
  const spacing = DIMS.pairSpacing.value
  const halfZ = (spacing * rules.pasangan + DIMS.nuaMargin.value) / 2
  const halfX = DIMS.nuaWidth.value / 2
  const offset = DIMS.pairOffset.value
  const postTop = heightOf(rules.tinggi)
  const bhagaFloor = DIMS.bhagaFloorY.value
  const bhagaRidge = bhagaFloor + DIMS.bhagaWallHeight.value + DIMS.bhagaRise.value

  const pairs: Pasangan[] = []
  for (let i = 0; i < rules.pasangan; i++) {
    const z = -halfZ + DIMS.nuaMargin.value / 2 + spacing * (i + 0.5)
    pairs.push({
      index: i,
      z,
      ngadhu: {
        // The post stands on the −X side, the little house opposite it.
        x: -offset,
        postTop,
        capRadius: DIMS.capRadius.value,
        apexY: postTop + DIMS.capRise.value,
      },
      bhaga: {
        x: offset,
        halfX: DIMS.bhagaDepth.value / 2,
        halfZ: DIMS.bhagaWidth.value / 2,
        floorY: bhagaFloor,
        ridgeY: bhagaRidge,
      },
    })
  }

  return {
    rules,
    nua: { halfX, halfZ },
    pairs,
    spacing,
    opening: { width: DIMS.doorWidth.value, height: DIMS.doorHeight.value },
    body: { crouching: DIMS.crouchingHeight.value, shoulders: DIMS.shoulderWidth.value },
    ture: {
      present: rules.ture,
      halfX: DIMS.tureDepth.value / 2,
      halfZ: DIMS.tureWidth.value / 2,
      height: DIMS.tureHeight.value,
    },
    dims: [],
  }
}

/** The thatch cap: a cone turned about the post, and it covers only the post. */
function capProfile(pair: Pasangan): readonly ConePoint[] {
  return [
    { r: pair.ngadhu.capRadius, y: pair.ngadhu.postTop - DIMS.capRise.value * 0.18 },
    { r: pair.ngadhu.capRadius * 0.55, y: pair.ngadhu.postTop + DIMS.capRise.value * 0.45 },
    { r: 0, y: pair.ngadhu.apexY },
  ]
}

/* ── The build ────────────────────────────────────────────────────────── */

const PAIR_DIMS: readonly DimKey[] = ['pairOffset', 'pairSpacing', 'pairIsTheUnit', 'onePairPerClan']

export function buildPairs(layout: Layout): { parts: readonly Part[]; joints: readonly Joint[] } {
  const parts: Part[] = []
  const joints: Joint[] = []
  const engage = DIMS.jointEngagement.value
  const section = DIMS.ngadhuSection.value
  const armSection = DIMS.ngadhuArmSection.value
  const board = DIMS.bhagaBoard.value
  const bhagaPost = DIMS.bhagaPost.value
  const heightKey: DimKey =
    layout.rules.tinggi === 'pendek' ? 'ngadhuShort' : layout.rules.tinggi === 'sedang' ? 'ngadhuMid' : 'ngadhuTall'

  /* The square: paving, and everything else stands in it. */
  parts.push(
    box(
      'nua',
      { name: 'nua', nameId: 'Nua', nameEn: 'The village square' },
      'nua',
      0,
      'tanah',
      ['nuaWidth', 'pairSpacing', 'nuaMargin', 'nuaThickness'],
      [0, DIMS.nuaThickness.value / 2, 0],
      [layout.nua.halfX * 2, DIMS.nuaThickness.value, layout.nua.halfZ * 2],
    ),
  )

  layout.pairs.forEach((pair) => {
    const i = pair.index

    /*
     * The post. What is planted is declared and not drawn: the core refuses a
     * part below y = 0, and that refusal is right for the other twenty-six
     * buildings here, so this one states the depth in its table instead.
     */
    const postId = `ngadhu-${i}`
    parts.push(
      box(
        postId,
        { name: 'ngadhu', nameId: `Ngadhu ${i + 1}`, nameEn: `Ngadhu ${i + 1}` },
        'ngadhu',
        i * 10,
        'kayu',
        [heightKey, 'ngadhuSection', 'ngadhuPlanted', ...PAIR_DIMS],
        [pair.ngadhu.x, pair.ngadhu.postTop / 2, pair.z],
        [section, pair.ngadhu.postTop, section],
      ),
    )
    for (const sz of [-1, 1] as const) {
      const armId = `lengan-${i}${sz > 0 ? 'a' : 'b'}`
      parts.push(
        box(
          armId,
          { name: 'lengan', nameId: 'Lengan ngadhu', nameEn: 'Forked arm' },
          'ngadhu',
          i * 10 + 1 + (sz > 0 ? 0 : 1),
          'kayu',
          ['ngadhuArm', 'ngadhuArmSection', heightKey],
          [
            pair.ngadhu.x,
            pair.ngadhu.postTop - DIMS.ngadhuArm.value * 0.3,
            pair.z + (sz * DIMS.ngadhuArm.value) / 2,
          ],
          [armSection, armSection, DIMS.ngadhuArm.value],
          // Lifted at the outer end: a fork, not a crossbar.
          [sz * 0.5, 0, 0],
        ),
      )
      joints.push({
        id: `pasak-${i}${sz > 0 ? 'a' : 'b'}`,
        kind: 'pasak',
        mortise: postId,
        tenon: armId,
        // Inside the arm rather than at the end of it: an arm whose inner face
        // is exactly the joint plane engages nothing, which is the fault this
        // project has now made eight times.
        at: [
          pair.ngadhu.x,
          pair.ngadhu.postTop - DIMS.ngadhuArm.value * 0.3,
          pair.z + sz * armSection,
        ],
        halfExtents: [(armSection * engage) / 2, (armSection * engage) / 2, (armSection * engage) / 2],
      })
    }
    const capId = `topi-${i}`
    parts.push(
      mesh(
        capId,
        { name: 'topi', nameId: `Topi ijuk ${i + 1}`, nameEn: `Thatch cap ${i + 1}` },
        'ngadhu',
        i * 10 + 3,
        'ijuk',
        ['capRadius', 'capRise', 'capFacets', 'neitherIsShelter'],
        shiftMesh(
          coneSurface(capProfile(pair), { facets: DIMS.capFacets.value, uvScale: 0.5 }),
          pair.ngadhu.x,
          0,
          pair.z,
        ),
      ),
    )
    joints.push({
      id: `tali-${i}`,
      kind: 'tali',
      mortise: postId,
      tenon: capId,
      at: [pair.ngadhu.x, pair.ngadhu.postTop - DIMS.capRise.value * 0.1, pair.z],
      halfExtents: [(section * engage) / 2, (DIMS.capRise.value * engage) / 4, (section * engage) / 2],
    })

    /* The little house, opposite: a model of a house at a size nobody enters. */
    const b = pair.bhaga
    const modelDims: readonly DimKey[] = ['bhagaWidth', 'bhagaDepth', 'bhagaIsAModel', ...PAIR_DIMS]
    for (const sx of [-1, 1] as const) {
      for (const sz of [-1, 1] as const) {
        parts.push(
          box(
            `bhaga-tiang-${i}${sx > 0 ? 'a' : 'b'}${sz > 0 ? 'a' : 'b'}`,
            { name: 'tiang', nameId: 'Tiang bhaga', nameEn: 'Bhaga post' },
            'bhaga',
            i * 10,
            'kayu',
            ['bhagaPost', 'bhagaFloorY'],
            [
              b.x + sx * (b.halfX - bhagaPost),
              b.floorY / 2,
              pair.z + sz * (b.halfZ - bhagaPost),
            ],
            [bhagaPost, b.floorY, bhagaPost],
          ),
        )
      }
    }
    parts.push(
      box(
        `bhaga-lantai-${i}`,
        { name: 'lantai', nameId: `Lantai bhaga ${i + 1}`, nameEn: `Bhaga floor ${i + 1}` },
        'bhaga',
        i * 10 + 1,
        'papan',
        [...modelDims, 'bhagaBoard', 'bhagaFloorY'],
        [b.x, b.floorY + board / 2, pair.z],
        [b.halfX * 2, board, b.halfZ * 2],
      ),
    )
    const wallY = b.floorY + board + DIMS.bhagaWallHeight.value / 2
    const wallH = DIMS.bhagaWallHeight.value
    /* Three closed walls and a front with an opening too small to get through. */
    parts.push(
      box(
        `bhaga-belakang-${i}`,
        { name: 'dinding', nameId: 'Dinding belakang', nameEn: 'Back wall' },
        'bhaga',
        i * 10 + 2,
        'papan',
        ['bhagaWallHeight', 'bhagaBoard'],
        [b.x + b.halfX - board / 2, wallY, pair.z],
        [board, wallH, b.halfZ * 2],
      ),
    )
    for (const sz of [-1, 1] as const) {
      parts.push(
        box(
          `bhaga-samping-${i}${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding samping', nameEn: 'Side wall' },
          'bhaga',
          i * 10 + 3,
          'papan',
          ['bhagaWallHeight', 'bhagaBoard'],
          [b.x, wallY, pair.z + sz * (b.halfZ - board / 2)],
          [b.halfX * 2, wallH, board],
        ),
      )
    }
    const half = layout.opening.width / 2
    for (const sz of [-1, 1] as const) {
      const from = sz > 0 ? half : -b.halfZ
      const to = sz > 0 ? b.halfZ : -half
      parts.push(
        box(
          `bhaga-muka-${i}${sz > 0 ? 'a' : 'b'}`,
          { name: 'dinding', nameId: 'Dinding muka', nameEn: 'Front wall' },
          'bhaga',
          i * 10 + 4,
          'papan',
          ['bhagaWallHeight', 'bhagaBoard', 'doorWidth', 'doorHeight'],
          [b.x - b.halfX + board / 2, wallY, pair.z + (from + to) / 2],
          [board, wallH, to - from],
        ),
      )
    }
    parts.push(
      box(
        `bhaga-ambang-${i}`,
        { name: 'ambang', nameId: 'Ambang atas', nameEn: 'Lintel' },
        'bhaga',
        i * 10 + 5,
        'papan',
        ['doorHeight', 'bhagaBoard', 'bhagaIsAModel'],
        [
          b.x - b.halfX + board / 2,
          b.floorY + board + layout.opening.height + (wallH - layout.opening.height) / 2,
          pair.z,
        ],
        [board, wallH - layout.opening.height, layout.opening.width],
      ),
    )
    const eave = DIMS.bhagaEave.value
    parts.push(
      mesh(
        `bhaga-atap-${i}`,
        { name: 'atap', nameId: `Atap bhaga ${i + 1}`, nameEn: `Bhaga roof ${i + 1}` },
        'bhaga',
        i * 10 + 6,
        'ijuk',
        ['bhagaRise', 'bhagaEave', 'bhagaIsAModel'],
        shiftMesh(
          steppedHip(
            [
              { key: 'tritis', halfX: b.halfX + eave, halfZ: b.halfZ + eave, y: b.floorY + board + wallH },
              { key: 'bubungan', halfX: 0, halfZ: b.halfZ + eave, y: b.ridgeY },
            ],
            { uvScale: 0.6 },
          ),
          b.x,
          0,
          pair.z,
        ),
      ),
    )

    if (layout.ture.present) {
      parts.push(
        box(
          `ture-${i}`,
          { name: 'ture', nameId: `Ture ${i + 1}`, nameEn: `Stone platform ${i + 1}` },
          'ture',
          i,
          'batu',
          ['tureWidth', 'tureDepth', 'tureHeight'],
          [0, DIMS.nuaThickness.value + layout.ture.height / 2, pair.z],
          [layout.ture.halfX * 2, layout.ture.height, layout.ture.halfZ * 2],
        ),
      )
    }
  })

  return { parts, joints }
}
