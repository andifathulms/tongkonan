/**
 * What the Mentawai uma calls things.
 *
 * The thirtieth entry, and the first whose central fact no invariant can see.
 *
 * An uma on Siberut is a long house on ironwood posts: an open veranda at the
 * front where anybody may come, a closed room behind it with a hearth for each
 * household, and a second veranda at the back. It is also the name of the group
 * that lives in it. There is no chief. The rimata coordinates ritual and does
 * not command; decisions are taken by everyone, at length, on the front
 * veranda; and there is no seat, no dais, no larger share and no senior end.
 *
 * That absence is the reason to build it, and it is also a problem this
 * project has to be honest about. **A building with no rank in it looks
 * exactly like a building whose rank nobody modelled.** Two packs have said
 * something like this before — the Baduy prohibitions that a model cannot
 * check, the Buton floors whose occupants are fixed by rule — and this is the
 * first where the unprovable thing is the whole point. What can be checked is
 * checked: equal shares, an open front, one record belonging to everybody. The
 * rest is stated and left stated.
 *
 * There is a second thing worth having, and it is a pairing. A rumah limas
 * steps its floor front to back and where a guest is seated on that sequence
 * *is* their standing. An uma is also graded front to back — veranda, room,
 * back veranda, public to private — and the grade is by what is being done
 * rather than by who is doing it. Same section, opposite claim.
 *
 * On the words: uma is both the house and the group; jaraik is the carved
 * board in the front veranda. Those two are used, and everything else is named
 * in Indonesian, on the joglo pack's policy.
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
  | 'schefold-1988'
  | 'reeves-2001'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/** How many verandas the house carries: the front one always, the back one often. */
export type Serambi = 'depan' | 'depan-belakang'

export interface Rules {
  /**
   * How many households share the house.
   *
   * A tally, like the betang's and the siwaluh jabu's — and unlike either of
   * them, the count changes nothing about who is senior, because nobody is.
   */
  readonly keluarga: number
  readonly serambi: Serambi
  /** whether the carved board hangs in the front veranda */
  readonly jaraik: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // river stones, and nothing is dug
  | 'tiang'   // ironwood posts standing on them
  | 'lantai'  // bearers and the sprung floor danced on
  | 'dinding' // the walls of the closed room, and no walls on the veranda
  | 'atap'    // sago leaf over the whole length
  | 'perapian' // a hearth for each household, and one record for all of them

export const STAGE_ORDER: readonly Stage[] = ['batu', 'tiang', 'lantai', 'dinding', 'atap', 'perapian']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'ulin' | 'papan' | 'rumbia' | 'batu' | 'ukiran'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon: no iron anywhere in it */
  | 'pasak'
  /** a rattan lashing, which is what holds the leaf down */
  | 'tali'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface MentawaiKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<MentawaiKinds>
export type MeshPart = CoreMeshPart<MentawaiKinds>
export type Part = CorePart<MentawaiKinds>
export type Joint = CoreJoint<MentawaiKinds>
export type House = CoreHouse<MentawaiKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One household: a hearth and a share of floor, and no more than anyone else. */
export interface Keluarga {
  readonly index: number
  readonly z: number
  readonly share: number
}

export interface Layout {
  readonly rules: Rules

  readonly halfX: number
  /** the three bands along the length: veranda, room, back veranda */
  readonly front: { readonly from: number; readonly to: number }
  readonly room: { readonly from: number; readonly to: number }
  readonly back: { readonly present: boolean; readonly from: number; readonly to: number }
  readonly halfZ: number

  readonly floorY: number
  readonly wallTop: number
  readonly ridgeY: number

  readonly households: readonly Keluarga[]
  /** the clear span of floor between bearers, and what a plank will cross */
  readonly span: { readonly clear: number; readonly plank: number }
  readonly jaraik: { readonly present: boolean; readonly z: number; readonly height: number }

  readonly dims: readonly Dim[]
}
