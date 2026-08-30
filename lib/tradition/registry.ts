/**
 * The twelve buildings, as one list the app can walk.
 *
 * Eleven of them are houses and the twelfth is a granary, which is why this
 * comment no longer says "houses".
 *
 * Every entry seals its own rule type inside itself. `build` takes a query
 * string and hands back parts, a scene model, a timeline, verdicts and
 * provenance — none of which mentions a rank or a laras — so a route, a rail
 * or a renderer can hold a house without knowing which one it has. That is
 * the whole job: `House<Kinds>` was already neutral, and this is what was
 * still stopping the app from using it.
 *
 * What is deliberately *not* here is a schema for controls. A data-driven
 * "field list" would render both rule sets from one component, and it would
 * cost the rank multiplier printed on the rank it applies to, the warning when
 * a bay count is unusual for its rank, and the gloss explaining what refusing
 * a step means. Those are the parts of the interface that carry the argument.
 * So each tradition keeps its own controls component and they share primitives
 * instead — the abstraction goes under the widgets, not over them.
 *
 * Pure, like the rest of `lib/`. No React in here, no three.js, no DOM.
 */

import type { Timeline } from '@/lib/core/assembly'
import type { CheckResult } from '@/lib/core/invariants'
import type { Kinds } from '@/lib/core/kinds'
import type { SceneModel } from '@/lib/core/scene'
import type { Split } from '@/lib/core/provenance'
import type { AnyHouse, AnyPart, Dim, ProvenanceClass, Source } from '@/lib/core/types'
import type { Sensitivity } from '@/lib/core/sensitivity'
import type { Site } from '@/lib/solar/position'
import { AIRMADIDI, AMBON, BAUBAU, BENA, GIANYAR, ANGGI, BANDA_ACEH, WAKATOBI, JAYAPURA, KABANJAHE, KANEKES, TOMOHON, BANJARMASIN, BAWOMATALUO, MATARAM, WAMENA, BUKITTINGGI, PALANGKA_RAYA, PALEMBANG, PARE_PARE, RANTEPAO, SOE, SUMENEP, UBUD, WAE_REBO, WAINGAPU, YANIRUMA, YOGYAKARTA } from '@/lib/solar/position'

import * as toraja from './toraja/facade'
import * as minang from './minang/facade'
import * as jawa from './jawa/facade'
import * as manggarai from './manggarai/facade'
import * as bali from './bali/facade'
import * as nias from './nias/facade'
import * as dayak from './dayak/facade'
import * as sumba from './sumba/facade'
import * as palembang from './palembang/facade'
import * as bugis from './bugis/facade'
import * as arfak from './arfak/facade'
import * as sasak from './sasak/facade'
import * as dani from './dani/facade'
import * as banjar from './banjar/facade'
import * as maluku from './maluku/facade'
import * as tobati from './tobati/facade'
import * as minahasa from './minahasa/facade'
import * as karo from './karo/facade'
import * as sunda from './sunda/facade'
import * as aceh from './aceh/facade'
import * as bajau from './bajau/facade'
import * as waruga from './waruga/facade'
import * as bade from './bade/facade'
import * as korowai from './korowai/facade'
import * as madura from './madura/facade'
import * as buton from './buton/facade'
import * as ngada from './ngada/facade'
import * as atoni from './atoni/facade'

export const TRADITION_KEYS = ['toraja', 'minang', 'jawa', 'manggarai', 'bali', 'nias', 'dayak', 'sumba', 'palembang', 'bugis', 'arfak', 'sasak', 'dani', 'banjar', 'maluku', 'tobati', 'minahasa', 'karo', 'sunda', 'aceh', 'bajau', 'waruga', 'bade', 'korowai', 'madura', 'buton', 'ngada', 'atoni'] as const
export type TraditionKey = (typeof TRADITION_KEYS)[number]

export function isTraditionKey(value: string): value is TraditionKey {
  return (TRADITION_KEYS as readonly string[]).includes(value)
}

/** A phrase in both locales. Vocabulary and copy alike. */
export interface Text {
  readonly id: string
  readonly en: string
}

/** One computed figure, over the viewport. Outputs, never inputs. */
export interface Readout {
  readonly label: Text
  readonly value: string
}

/** One thing a stranger walking up to the house could work out unaided. */
export interface Reading {
  readonly key: string
  readonly title: Text
  readonly body: Text
  readonly value: Text
  readonly unit: Text
}

/**
 * One kind of joint this house is put together with.
 *
 * Not shared: one house seats a post foot in the dish of a pad stone and
 * calls that a tumpu, the other calls it a sandi. A fixed list would have
 * shown a reader a name their house does not use.
 */
export interface JointView {
  readonly kind: string
  readonly name: Text
  readonly gloss: Text
}

/** A build stage, named in the tradition's own words. */
export interface StageView {
  readonly stage: string
  readonly title: string
  readonly gloss: Text
}

/** One declared dimension, with the key the source table lists it under. */
export interface DimView {
  readonly key: string
  readonly dim: Dim
}

/** A check refusing a house built to break it, with the numbers it compared. */
export interface CounterexampleView {
  readonly dim: string
  readonly actual: number
  readonly value: number
  readonly sound: CheckResult
  readonly broken: CheckResult
  readonly witness: { readonly sound: readonly Readout[]; readonly broken: readonly Readout[] }
  /** why this check and not another */
  readonly why: Text
}

/** One house, built. Nothing here names a rank or a laras. */
export interface Built {
  readonly key: TraditionKey
  /** the canonical query for these rules, without a leading `?` */
  readonly query: string
  readonly house: AnyHouse
  readonly scene: SceneModel
  readonly timeline: Timeline<Kinds>
  readonly checks: readonly CheckResult[]
  readonly dims: readonly Dim[]
  readonly split: Split
  readonly parts: Split
  readonly classOf: (part: AnyPart) => ProvenanceClass
  /** what this house is, over the viewport */
  readonly headline: Text
  readonly subhead: Text
  readonly readout: readonly Readout[]
  /** what the façade says, for the reading route */
  readonly readings: readonly Reading[]
}

export interface Tradition {
  readonly key: TraditionKey
  /** the path segment, and the same word in both locales */
  readonly slug: string
  readonly house: Text
  readonly people: Text
  readonly place: Text
  /** the two paragraphs that say whose house this is and where */
  readonly about: Text
  readonly caution: Text
  /** orientation, stated on screen because its absence from the controls must read as a fact */
  readonly orientation: Text
  readonly site: Site
  readonly params: readonly { readonly key: string; readonly param: string }[]
  readonly stageOrder: readonly string[]
  readonly stages: readonly StageView[]
  readonly joints: readonly JointView[]
  readonly sources: readonly Source[]
  readonly dims: readonly DimView[]
  readonly split: Split
  /** the query for the default house, and for the one the reading route shows */
  readonly defaultQuery: string
  readonly showcaseQuery: string
  build(search: string): Built
  /** expensive; both are build-time only, on statically rendered routes */
  sensitivity(): readonly Sensitivity<Kinds>[]
  probeLabel(key: string): Text
  counterexample(): CounterexampleView
}

export const TRADITIONS: readonly Tradition[] = [
  toraja.tradition(RANTEPAO),
  minang.tradition(BUKITTINGGI),
  jawa.tradition(YOGYAKARTA),
  manggarai.tradition(WAE_REBO),
  bali.tradition(UBUD),
  nias.tradition(BAWOMATALUO),
  dayak.tradition(PALANGKA_RAYA),
  sumba.tradition(WAINGAPU),
  palembang.tradition(PALEMBANG),
  bugis.tradition(PARE_PARE),
  arfak.tradition(ANGGI),
  sasak.tradition(MATARAM),
  dani.tradition(WAMENA),
  banjar.tradition(BANJARMASIN),
  maluku.tradition(AMBON),
  tobati.tradition(JAYAPURA),
  minahasa.tradition(TOMOHON),
  karo.tradition(KABANJAHE),
  sunda.tradition(KANEKES),
  aceh.tradition(BANDA_ACEH),
  bajau.tradition(WAKATOBI),
  waruga.tradition(AIRMADIDI),
  bade.tradition(GIANYAR),
  korowai.tradition(YANIRUMA),
  madura.tradition(SUMENEP),
  buton.tradition(BAUBAU),
  ngada.tradition(BENA),
  atoni.tradition(SOE),
]

export function tradition(key: TraditionKey): Tradition {
  const found = TRADITIONS.find((t) => t.key === key)
  if (!found) throw new Error(`unknown tradition: ${key}`)
  return found
}

/** The one the site opens on. First is not an accident; it is the first house. */
export const DEFAULT_TRADITION: TraditionKey = 'toraja'
