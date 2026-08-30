/**
 * What the Minahasa waruga calls things.
 *
 * The twenty-second building, and the first that is not for the living.
 *
 * A waruga is a tomb cut from stone: a box with a chamber in it and a lid
 * shaped like a roof. The dead were placed inside seated, facing north, and
 * more of the same family were added to the same box over generations. Nobody
 * goes in. There is no door, no window and no way to enter it at all — the lid
 * is lifted and put back, and that is the only opening this building has ever
 * had.
 *
 * Two things follow that nothing else in this collection can show.
 *
 * The first is that its inside is sized by a body that is not standing. The
 * Balinese bale takes its dimensions from its owner's body — an arm span, a
 * forearm, a fist — measured on a living person who is standing up. This one
 * takes them from a body folded and seated, and the two together are the same
 * principle on two occasions: a house measured by the person who will live in
 * it, and a tomb measured by the person who will not leave it.
 *
 * The second is that it is one material. Twenty-one buildings here are timber
 * and thatch and board and bamboo, with stone under the posts if anywhere.
 * This one is stone and nothing else, and it is cut from a single block — so
 * how large a family it can hold is limited by how large a stone the quarry
 * gives.
 *
 * And it is the second building here from the people who make the woloan
 * house. That house is built to be numbered, unpegged and carried away; this
 * one is made never to move at all. One people, two buildings, opposite ends
 * of the same question.
 *
 * On the words: waruga is the tomb. The parts are named in Indonesian, on the
 * joglo pack's policy.
 */

import type { Kinds } from '@/lib/core/kinds'
import type {
  BoxPart as CoreBoxPart,
  Dim as CoreDim,
  House as CoreHouse,
  Joint as CoreJoint,
  MeshPart as CoreMeshPart,
  Part as CorePart,
  Source as CoreSource,
} from '@/lib/core/types'
import type { DimKey } from './rules'

export type { Bounds, ProvenanceClass, Vec3 } from '@/lib/core/types'
export type { DimKey } from './rules'

export type SourceKey =
  | 'none'
  | 'depdikbud-sulut'
  | 'schouten-1998'
  | 'tim-waruga'
  | 'anthropometry'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** The form of the lid, which is a roof over a room nobody enters. */
export type Tutup = 'pelana' | 'limas'

export interface Rules {
  /**
   * How many of one family are inside.
   *
   * A waruga is opened again when the next of the family dies, and the next is
   * put in with the others. So this count is not a size chosen by a builder;
   * it is a number that goes up over generations, and the chamber has to have
   * been cut deep enough at the start for the ones who are not dead yet.
   */
  readonly jumlah: number
  readonly tutup: Tutup
  /** whether the box stands on a base slab clear of the ground */
  readonly alas: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'alas'   // the base slab, where there is one
  | 'peti'   // the box: the chamber cut into a block
  | 'tutup'  // the lid, which is a roof
  | 'muka'   // the carved face, which is not modelled and is named anyway

export const STAGE_ORDER: readonly Stage[] = ['alas', 'peti', 'tutup', 'muka']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

/**
 * One material, and that is the whole list.
 *
 * Every other pack here has four or five: a timber, a board, a thatch, a
 * stone. This building is cut from one block of one rock, so its material
 * union has one member — which is the shortest thing in this project and says
 * as much as any of the long ones.
 */
export type MaterialKey = 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** the lid sitting in the rebate cut for it, and lifted out again */
  | 'tumpang'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface WarugaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<WarugaKinds>
export type MeshPart = CoreMeshPart<WarugaKinds>
export type Part = CorePart<WarugaKinds>
export type Joint = CoreJoint<WarugaKinds>
export type House = CoreHouse<WarugaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

export interface Layout {
  readonly rules: Rules

  /** the chamber: what a seated body needs, and one more each generation */
  readonly chamber: {
    readonly halfX: number
    readonly halfZ: number
    readonly height: number
    readonly floorY: number
  }
  /** the block the chamber is cut out of */
  readonly block: { readonly halfX: number; readonly halfZ: number; readonly height: number }
  /** the largest stone the quarry gives, which is what limits the family */
  readonly blockLimit: number

  readonly base: { readonly present: boolean; readonly height: number; readonly margin: number }
  readonly lid: { readonly form: Tutup; readonly rise: number; readonly overhang: number; readonly y: number }

  /** the seated body the inside is measured by */
  readonly body: { readonly seated: number; readonly depth: number; readonly width: number }

  readonly dims: readonly Dim[]
}
