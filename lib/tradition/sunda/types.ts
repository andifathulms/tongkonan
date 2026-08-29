/**
 * What the Baduy imah calls things.
 *
 * The nineteenth building, and the first whose rules are prohibitions.
 *
 * Every other pack in this collection states what a building *is*: how it is
 * ranked, who sits where, how many households it holds, what it has to
 * survive. The Kanekes rules — pikukuh — state what may not be done. The
 * ground may not be cut or levelled. Timber may not be sawn. Iron may not be
 * driven into the frame. Nothing may be added that the forest did not grow.
 *
 * One of those has a consequence a model can carry, and it is the one this
 * pack is built around: **the ground may not be levelled, so the posts stand
 * on stones exactly where the stones lie, and every post is a different
 * length.** The floor is one level plane above a slope that has not been
 * touched — which is a harder thing to build than a platform on cut ground,
 * and is the point.
 *
 * That makes this the only building here whose model contains the *ground* as
 * a part. Sixteen buildings stand on a datum; this one stands on a hillside
 * that is in the part list, because the one thing the builders are forbidden
 * to change has to be something the model can be checked against.
 *
 * On the words: imah is the house, sosoro the front platform, tepas the middle
 * room and imah again the inner one; Kanekes is the village territory and
 * Baduy the name outsiders use. Where the author is not confident of a
 * Sundanese term the part is named in Indonesian, on the joglo pack's policy.
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
  | 'garna-1993'
  | 'permana-2006'
  | 'depdikbud-jabar'
  | 'iskandar-2016'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Which part of Kanekes the house stands in.
 *
 * Baduy Dalam keeps the prohibitions in full: no iron in the frame, one door,
 * nothing the forest did not grow. Baduy Luar keeps most of them and is
 * allowed some things the inner villages are not. The distinction is the
 * central social fact of Kanekes and it is not a rank — neither is a lesser
 * version of the other, and the strictness runs the opposite way from what a
 * hierarchy would predict.
 */
export type Wilayah = 'dalam' | 'luar'

/** How steep the ground is. Nobody chooses this; the prohibition is what makes it matter. */
export type Lereng = 'landai' | 'sedang' | 'curam'

export interface Rules {
  readonly wilayah: Wilayah
  /**
   * The slope of the ground the house stands on.
   *
   * The one rule in this project that nobody decides. It is here because of
   * what the prohibition does with it: on level ground "do not cut the earth"
   * costs nothing, and every degree of slope turns it into a different set of
   * post lengths. A rule that is not a choice is still a rule when something
   * else forbids you to change what it describes.
   */
  readonly lereng: Lereng
  /** whether the front platform is built out in front of the house */
  readonly sosoro: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'tanah'   // the ground, which is not built and may not be changed
  | 'batu'    // the stones, set where they lie
  | 'tihang'  // the posts, every one a different length
  | 'palupuh' // the floor frame and its split-bamboo deck
  | 'bilik'   // the woven walls
  | 'sosoro'  // the front platform
  | 'suhunan' // the roof frame
  | 'hateup'  // the palm thatch

export const STAGE_ORDER: readonly Stage[] = [
  'tanah',
  'batu',
  'tihang',
  'palupuh',
  'bilik',
  'sosoro',
  'suhunan',
  'hateup',
]

export interface StageInfo {
  readonly stage: Stage
  readonly title: string
  readonly glossId: string
  readonly glossEn: string
}

/* ── Materials ────────────────────────────────────────────────────────── */

export type MaterialKey =
  | 'kayu'
  | 'bambu'
  | 'ijuk'
  | 'batu'
  /** the hillside itself, which is in the model because it may not be touched */
  | 'tanah'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a lashing of fibre — the only joint the inner villages permit */
  | 'talian'
  /** a post head notched to take a bearer */
  | 'takik'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface SundaKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<SundaKinds>
export type MeshPart = CoreMeshPart<SundaKinds>
export type Part = CorePart<SundaKinds>
export type Joint = CoreJoint<SundaKinds>
export type House = CoreHouse<SundaKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One post: where its stone lies, and how long it therefore has to be. */
export interface Tihang {
  readonly key: string
  readonly x: number
  readonly z: number
  /** the height of the untouched ground at this point */
  readonly groundY: number
  /** the length of the pole, which is what the ground leaves it */
  readonly length: number
}

export interface Layout {
  readonly rules: Rules

  readonly length: number
  readonly halfZ: number
  /** rise of the ground over the length of the house, uphill on +X */
  readonly slope: number
  /**
   * Where the ground starts.
   *
   * The datum in this project is y = 0 and here the ground is a tilted slab,
   * so the slab's own lowest corner is what sits on the datum and everything
   * else is measured up from there. Carried on the layout because the check
   * that reads the ground and the builder that draws it have to agree about
   * where it is — two descriptions of one surface is two things to get wrong.
   */
  readonly groundBase: number
  readonly posts: readonly Tihang[]

  /** one level plane over ground that is not level */
  readonly floorY: number
  readonly floorThickness: number
  readonly postSection: number
  readonly stoneHeight: number
  readonly plateY: number
  readonly ridgeY: number
  readonly eaveOversail: number

  /** the longest pole one piece of timber gives, which the slope can exceed */
  readonly poleLength: number
  readonly sosoro: { readonly present: boolean; readonly depth: number; readonly floorY: number }
  readonly doors: number
  readonly hateupCourses: number

  readonly dims: readonly Dim[]
}
