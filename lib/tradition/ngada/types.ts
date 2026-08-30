/**
 * What the Ngada ngadhu and bhaga call things.
 *
 * The twenty-seventh entry, and the first whose subject is a *pair*.
 *
 * In a village square at Bena, in front of the rows of houses, stand pairs of
 * small structures: a ngadhu, a carved post under a conical thatch cap, and a
 * bhaga, a miniature house on short posts. One is the male ancestor of a clan
 * and the other the female, and there is one pair for every clan. Neither of
 * them is a dwelling; neither of them shelters anybody; and neither means
 * anything on its own — a ngadhu without its bhaga is not a smaller statement,
 * it is an incomplete one.
 *
 * Three things make this worth building here:
 *
 * **A pair, and both halves are the subject.** Twenty-six entries so far have
 * been one thing — one house, one tomb, one boat, one tower, and once a whole
 * cluster of houses around one yard. This is two objects of different kinds
 * that have to exist together, which the registry took without complaint.
 *
 * **A building at reduced size.** A bhaga is a house in miniature: too small to
 * go into, and deliberately so. Every other size in this project comes from a
 * body, a room, a rank, a household or a crowd. This one comes from being a
 * *representation* of a house — the first dimension here derived from what a
 * building depicts rather than from what it holds.
 *
 * **Neither is a shelter.** The ngadhu's roof covers its own post and nothing
 * else; the bhaga's floor is a metre or so across. The bade has tiers that
 * shelter nothing, and it at least carries a body; these carry nobody at all.
 *
 * On the words: ngadhu, bhaga, nua for the square, sa'o for the houses around
 * it, and ture for the stone platforms. Those five are used; everything else is
 * named in Indonesian, on the joglo pack's policy.
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
  | 'anthropometry'
  | 'arndt-1954'
  | 'schroter-1998'
  | 'depdikbud-1986'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * How tall the ngadhu's post stands.
 *
 * The sources agree that a ngadhu is a tall carved post and that the taller
 * ones belong to clans that have held the larger feasts; none of them gives a
 * figure, so the three heights here are the author's reading and every one of
 * them is tagged as such.
 */
export type Tinggi = 'pendek' | 'sedang' | 'tinggi'

export interface Rules {
  /**
   * How many pairs stand in the square, which is how many clans the village
   * holds. A count of descent groups, like the baileo's soa and the karo's
   * households — and the first that counts *pairs of objects* rather than
   * rooms, seats or hearths.
   */
  readonly pasangan: number
  readonly tinggi: Tinggi
  /** whether each pair has its stone platform beside it */
  readonly ture: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'nua'    // the paved square, levelled before anything stands in it
  | 'ngadhu' // the posts and their caps
  | 'bhaga'  // the miniature houses
  | 'ture'   // the stone platforms, last and lowest

export const STAGE_ORDER: readonly Stage[] = ['nua', 'ngadhu', 'bhaga', 'ture']

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey = 'kayu' | 'papan' | 'ijuk' | 'batu' | 'tanah'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a peg through a mortise and tenon */
  | 'pasak'
  /** a lashing of split rattan, which is what ties thatch to a frame */
  | 'tali'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface NgadaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<NgadaKinds>
export type MeshPart = CoreMeshPart<NgadaKinds>
export type Part = CorePart<NgadaKinds>
export type Joint = CoreJoint<NgadaKinds>
export type House = CoreHouse<NgadaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One clan's pair: the male post and the female house, standing together. */
export interface Pasangan {
  readonly index: number
  /** where along the square this clan's pair stands */
  readonly z: number
  readonly ngadhu: { readonly x: number; readonly postTop: number; readonly capRadius: number; readonly apexY: number }
  readonly bhaga: { readonly x: number; readonly halfX: number; readonly halfZ: number; readonly floorY: number; readonly ridgeY: number }
}

export interface Layout {
  readonly rules: Rules

  /** the square everything stands in, and which is levelled first */
  readonly nua: { readonly halfX: number; readonly halfZ: number }
  readonly pairs: readonly Pasangan[]
  readonly spacing: number
  /** the door of a bhaga, and the body it is deliberately smaller than */
  readonly opening: { readonly width: number; readonly height: number }
  readonly body: { readonly crouching: number; readonly shoulders: number }
  readonly ture: { readonly present: boolean; readonly halfX: number; readonly halfZ: number; readonly height: number }

  readonly dims: readonly Dim[]
}
