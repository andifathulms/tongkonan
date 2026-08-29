/**
 * What the Maluku baileo calls things.
 *
 * The fifteenth building, and the first that belongs to nobody.
 *
 * Every other building in this collection is a household's: a family lives in
 * it, or keeps its rice in it, or is ranked by it. A baileo is the negeri's —
 * the village's own house, where the saniri meets, where the clans sit to
 * decide, and where the ancestors are addressed. Nobody sleeps in it and no
 * household owns it, so the questions the other fourteen answer with a rank or
 * a tally are answered here by a *count of clans*.
 *
 * Three things follow and all three are canon. It has no walls, because what
 * is decided inside must be visible and audible from outside — an open
 * building is a political arrangement rather than a climatic one. It has one
 * floor and no loft, because the soa sit as equals and a storey would put
 * somebody above somebody. And it stands beside the batu pamali, the stone the
 * offerings are laid on, which the building is oriented to and never built
 * over.
 *
 * That makes it the exact inverse of the rumah limas, where the floor steps
 * and where a guest is seated *is* their standing. Here the floor is one plane
 * and the seats are equal by rule, and the equality is the statement.
 *
 * On the words: baileo, negeri, soa, saniri and batu pamali are the terms the
 * sources use for these things and are used here. The parts of the frame are
 * named in Indonesian, on the policy the joglo pack set: where the author is
 * not confident of the local term, the part is called what it is.
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
  | 'cooley-1962'
  | 'depdikbud-maluku'
  | 'lokollo-1997'
  | 'waterson-1990'

/* ── Rules — the socially meaningful input set ────────────────────────── */

/**
 * Where the batu pamali stands.
 *
 * The ancestral stone is the reason the building is oriented the way it is,
 * and the sources record both arrangements: in most negeri it stands in front
 * of the baileo, on the ground, where offerings are laid before anyone climbs
 * the stair; in others it stands *inside*, and the floor is left open around
 * it so that the stone still touches the earth.
 *
 * That is the whole point of making it a rule rather than a fixed fact. The
 * inside arrangement is not a decoration moved indoors — it is a hole in the
 * floor of a building that is otherwise one continuous plane, and it says that
 * the stone is not a possession of the building but something the building was
 * put around.
 */
export type Pamali = 'depan' | 'dalam'

export interface Rules {
  /**
   * How many soa — clans — make up the negeri.
   *
   * The only count in this project that is a census of a *community* rather
   * than of a household or its ceremonies. The rumah betang's length counts
   * the families living in it; this counts the clans entitled to sit, and each
   * one is a bay of the floor, a pair of principal posts and a seat.
   */
  readonly soa: number
  readonly pamali: Pamali
  /**
   * Whether a low screen is fitted between the posts.
   *
   * Some baileo have one, at about knee height, and it changes nothing about
   * what can be seen: the building has to stay open at the height of a person
   * standing outside it. Turning it on is the honest way to show that the
   * openness is a rule about sight lines rather than about the absence of
   * carpentry — `checkOpenOnAllSides` passes with the screen and refuses it
   * the moment it rises past a standing eye.
   */
  readonly sekat: boolean
}

/* ── Build order ──────────────────────────────────────────────────────── */

export type Stage =
  | 'batu'    // the pamali stone and the pad stones, which come first
  | 'tiang'   // the posts, one pair per soa
  | 'gelagar' // the floor frame
  | 'lantai'  // the floor: one plane, no steps
  | 'tempat'  // the seats, one per soa and all alike
  | 'sekat'   // the low screen, when there is one
  | 'kuda'    // the roof frame
  | 'atap'    // sago thatch
  | 'tangga'  // the stair, last, because it is how the finished thing is entered

/**
 * The stone goes down before anything else.
 *
 * Not a construction fact but a stated one: the pamali is what the building is
 * put beside, so it is on the ground before the first post. Everything else is
 * ordinary — posts, floor frame, floor, seats, roof — with the stair last,
 * which is where a stair belongs when the thing it climbs is finished.
 */
export const STAGE_ORDER: readonly Stage[] = [
  'batu',
  'tiang',
  'gelagar',
  'lantai',
  'tempat',
  'sekat',
  'kuda',
  'atap',
  'tangga',
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
  | 'papan'
  | 'bambu'
  | 'rumbia' // sago-palm leaf, the roof of Maluku
  | 'batu'

/* ── Joints ───────────────────────────────────────────────────────────── */

export type JointKind =
  /** a pegged tenon */
  | 'pasak'
  /** a bearer seated in a notch cut in a post head */
  | 'takik'

/* ── The binding ──────────────────────────────────────────────────────── */

export interface MalukuKinds extends Kinds {
  readonly stage: Stage
  readonly material: MaterialKey
  readonly source: SourceKey
  readonly dim: DimKey
  readonly joint: JointKind
  readonly rules: Rules
}

export type Dim = CoreDim<SourceKey>
export type Source = CoreSource<SourceKey>
export type BoxPart = CoreBoxPart<MalukuKinds>
export type MeshPart = CoreMeshPart<MalukuKinds>
export type Part = CorePart<MalukuKinds>
export type Joint = CoreJoint<MalukuKinds>
export type House = CoreHouse<MalukuKinds>

/* ── Layout ───────────────────────────────────────────────────────────── */

/** One clan's place: a bay of the floor, a pair of posts, and a seat. */
export interface Soa {
  readonly index: number
  /** centre of this clan's bay along the length */
  readonly x: number
  readonly halfX: number
}

export interface Layout {
  readonly rules: Rules

  readonly soa: readonly Soa[]
  readonly length: number
  readonly halfZ: number

  readonly floorY: number
  readonly floorThickness: number
  readonly postSection: number
  readonly stoneHeight: number

  /** the head of the posts, which is where the roof begins */
  readonly plateY: number
  readonly ridgeY: number
  readonly eaveOversail: number

  /**
   * The band a person outside looks through: from the floor to the head of the
   * posts. `checkOpenOnAllSides` is the claim that nothing crosses it.
   */
  readonly sightBand: { readonly fromY: number; readonly toY: number }
  readonly screen: { readonly present: boolean; readonly height: number }

  readonly seat: { readonly width: number; readonly depth: number; readonly height: number }

  readonly pamali: {
    readonly where: Pamali
    readonly x: number
    readonly radius: number
    readonly height: number
  }

  readonly stair: { readonly x: number; readonly width: number }
  readonly thatchCourses: number

  readonly dims: readonly Dim[]
}
