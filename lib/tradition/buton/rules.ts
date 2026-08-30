/**
 * The rule pack for the Butonese malige.
 *
 * The twenty-sixth pack, and the first whose building widens as it climbs.
 *
 * `widensUpward` is canon and it is why this is here. Every storey projects
 * past the one below it on all four sides, so the largest floor plate in the
 * building is the top one and the smallest is the one standing on the ground.
 * Twenty-five buildings in this collection do the opposite without ever
 * saying so, which is what makes this one worth the eleven files.
 *
 * `paleCarryTheOverhang` is the second, and it is the one that couples the
 * social rule to the structure. The projection is carried on bracket arms; how
 * many a household may put up is its rank; and a house entitled to none does
 * not project at all. So on this building **rank decides how far you may build
 * outward** — the only pack here where a social rule sets a cantilever, and
 * the reason the counterexample is about reach rather than about height.
 *
 * `noIron` is the third. The whole frame is pegged and wedged, which the
 * rumoh Aceh also says of itself — and the two are worth reading together,
 * because there the absence of iron answers ground that moves, and here it
 * answers a building that has to be able to work as it leans.
 *
 * `floorsAreRanked` is the fourth: who may be on which storey is fixed, and
 * the top is the sultan's own. It is stated and not checked, for the reason
 * the Baduy pack gives about its unprovable prohibitions — a floor that is
 * forbidden to somebody looks exactly like a floor that is not.
 */

import type { RulePack } from '@/lib/core/kinds'
import type { Split } from '@/lib/core/provenance'
import {
  dimFactory,
  partClass as corePartClass,
  partSplit as corePartSplit,
  provenanceSplit as coreProvenanceSplit,
  worstClass as coreWorstClass,
} from '@/lib/core/provenance'
import { STAGE_ORDER } from './types'
import type {
  ButonKinds,
  Dim,
  Layout,
  Pale,
  Part,
  ProvenanceClass,
  Rules,
  Source,
  SourceKey,
  Stage,
  StageInfo,
} from './types'

/* ── The source table ─────────────────────────────────────────────────── */

export const SOURCES: readonly Source[] = [
  {
    key: 'zahari-1977',
    citation:
      'Zahari, A. M., Sejarah dan Adat Fiy Darul Butuni (Buton), jilid I–III ' +
      '(Departemen Pendidikan dan Kebudayaan, Jakarta, 1977).',
    kind: 'reference',
  },
  {
    key: 'depdikbud-1985',
    citation:
      'Arsitektur Tradisional Daerah Sulawesi Tenggara (Departemen Pendidikan dan Kebudayaan, ' +
      'Jakarta, 1985).',
    kind: 'reference',
  },
  {
    key: 'schoorl-2003',
    citation:
      'Schoorl, P., Masyarakat, Sejarah dan Budaya Buton (Djambatan, Jakarta, 2003).',
    kind: 'ethnography',
  },
  {
    key: 'none',
    citation: 'Tidak ada sumber. Nilai ini ditetapkan penulis untuk menutup celah.',
    kind: 'none',
  },
]

export function sourceFor(key: SourceKey): Source {
  const found = SOURCES.find((s) => s.key === key)
  if (!found) throw new Error(`unknown source key: ${key}`)
  return found
}

/* ── Dimensions ───────────────────────────────────────────────────────── */

const dim = dimFactory<SourceKey>()

export const DIMS = {
  /* the smallest floor in the building, which is the one on the ground */
  baseWidth: dim(9.6, 'm', 'interpolated', 'none', 'Lebar lantai terbawah, melintang. Ini lantai terkecil di seluruh bangunan — satu-satunya bangunan dalam projek ini yang begitu.', 'Width of the lowest floor, across. It is the smallest floor in the whole building — the only building in this project of which that is true.'),
  baseLength: dim(12.4, 'm', 'interpolated', 'none', 'Panjang lantai terbawah, searah bubungan.', 'Length of the lowest floor, along the ridge.'),
  storeyHeight: dim(2.7, 'm', 'interpolated', 'none', 'Tinggi satu tingkat, dari lantai ke lantai.', 'Height of one storey, floor to floor.'),

  /* the projection, and what carries it */
  oversail: dim(0.55, 'm', 'interpolated', 'none', 'Sejauh mana tiap lantai menjorok melewati tingkat di bawahnya, pada keempat sisinya. Angka inilah yang membalik siluet bangunan ini terhadap dua puluh lima bangunan lain di sini.', 'How far each floor projects past the storey below it, on all four sides. This is the figure that inverts this building’s silhouette against the other twenty-five here.'),
  padSocket: dim(0.05, 'm', 'interpolated', 'none', 'Dalamnya cekungan pada batu tempat kaki tiang duduk. Tanpanya tiang hanya menyentuh batunya pada satu bidang, dan sambungan yang kedua bagiannya tidak saling memasuki tidak memegang apa-apa.', 'Depth of the hollow in the stone the foot of a post sits in. Without it a post only touches its stone on one plane, and a joint whose members do not enter each other holds nothing.'),
  paleReach: dim(1.95, 'm', 'interpolated', 'none', 'Sejauh mana sebuah pale dapat menjangkau keluar dari rangka tiang. Tiap tingkat menjorok lebih jauh daripada tingkat di bawahnya, jadi lengan yang paling panjang selalu lengan yang paling atas: batas bangunan ini ditetapkan di puncaknya. Ini angka pertukangan, bukan angka kedudukan — dan justru karena keduanya berdiri sendiri-sendiri, tritisan yang dituntut kedudukan dapat melewati apa yang dapat dipikul sebuah lengan.', 'How far a pale can reach out from the frame of posts. Each storey projects further than the one below it, so the longest arm is always the topmost one: this building’s limit is set at its top. It is a carpenter’s figure rather than a rank figure — and because the two are independent, a projection demanded by standing can pass what an arm can carry.'),
  paleSection: dim(0.14, 'm', 'interpolated', 'none', 'Sisi penampang lengan pale.', 'Section of a bracket arm.'),
  paleSpacing: dim(1.9, 'm', 'interpolated', 'none', 'Jarak antar pale di sepanjang satu sisi.', 'Spacing of the brackets along one side.'),

  /* the frame */
  postSection: dim(0.2, 'm', 'interpolated', 'none', 'Sisi penampang tiang utama.', 'Section of a principal post.'),
  padHeight: dim(0.3, 'm', 'interpolated', 'none', 'Tinggi batu di bawah tiang. Tidak ada yang ditanam: seluruh rangka berdiri di atas batu dan ditahan beratnya sendiri.', 'Height of the stone under a post. Nothing is buried: the whole frame stands on stones and is held by its own weight.'),
  padSpread: dim(1.35, 'ratio', 'interpolated', 'none', 'Batu terluar diletakkan sedikit lebih lebar daripada tiangnya, untuk menyebarkan beban bangunan yang condong keluar.', 'The outer stones are set a little wider than their posts, to spread the load of a building that leans outward.'),
  floorDepth: dim(0.18, 'm', 'interpolated', 'none', 'Tinggi penampang balok lantai.', 'Depth of a floor beam.'),
  deckThickness: dim(0.05, 'm', 'interpolated', 'none', 'Tebal papan lantai.', 'Thickness of a floor board.'),
  wallThickness: dim(0.06, 'm', 'interpolated', 'none', 'Tebal papan dinding.', 'Thickness of a wall board.'),
  wallInset: dim(0.12, 'm', 'interpolated', 'none', 'Jarak dinding ke dalam dari tepi lantai, sehingga tepi tiap tingkat terlihat sebagai garis.', 'How far the wall stands inside the edge of the floor, so the edge of each storey reads as a line.'),

  /* the top */
  anjunganShare: dim(0.45, 'ratio', 'interpolated', 'none', 'Lebar ruang menjorok di puncak dibanding lantai teratas.', 'Width of the projecting room at the top against the topmost floor.'),
  anjunganHeight: dim(1.9, 'm', 'interpolated', 'none', 'Tinggi ruang menjorok di puncak.', 'Height of the projecting room at the top.'),
  roofRise: dim(2.9, 'm', 'interpolated', 'none', 'Tinggi bubungan di atas dinding teratas.', 'Rise of the ridge above the topmost wall.'),
  ridgeShare: dim(0.4, 'ratio', 'interpolated', 'none', 'Panjang bubungan dibanding panjang lantai teratas.', 'Length of the ridge against the length of the topmost floor.'),
  eaveOversail: dim(0.85, 'm', 'interpolated', 'none', 'Tritisan atap sirap di atas lantai teratas — yang paling lebar dalam bangunan yang setiap tingkatnya sudah menjorok.', 'Overhang of the shingle roof past the topmost floor — the widest projection in a building every storey of which already projects.'),
  roofThickness: dim(0.09, 'm', 'interpolated', 'none', 'Tebal lapisan sirap.', 'Thickness of the shingle covering.'),

  /* the ground beyond */
  bentengRadius: dim(26, 'm', 'interpolated', 'none', 'Jarak dinding benteng dari rumah. Ini satu-satunya bangunan dalam kumpulan ini yang berdiri di dalam benteng, dan dindingnya bagian dari tapak, bukan latar.', 'Distance of the fortress wall from the house. This is the only building in the collection standing inside a fortification, and the wall is part of the site rather than scenery.'),
  bentengHeight: dim(2.6, 'm', 'interpolated', 'none', 'Tinggi dinding benteng batu karang.', 'Height of the coral-stone fortress wall.'),

  /* engagements */
  jointEngagement: dim(0.3, 'ratio', 'interpolated', 'none', 'Dalamnya pertautan sambungan yang diuji, sebagai bagian dari ukuran bagian terkecil.', 'Depth of the tested joint engagement, as a share of the smaller member.'),

  /* rules that are structure, not measurement */
  widensUpward: dim(1, 'count', 'canon', 'depdikbud-1985', 'Tiap tingkat menjorok melewati tingkat di bawahnya pada keempat sisinya, jadi lantai terbesar bangunan ini adalah lantai tertingginya dan yang terkecil adalah yang berdiri di tanah. Tidak ada bangunan lain di sini yang lantainya lebih besar daripada lantai di bawahnya — beberapa punya atap yang menjorok, dan itu hal yang lain — dan tidak satu pak pun pernah menyatakan itu sebagai aturan. Yang ini menyatakan kebalikannya.', 'Every storey projects past the one below it on all four sides, so the largest floor in this building is its highest and the smallest is the one standing on the ground. No other building here has a floor larger than the one under it — several have roofs that oversail, which is a different thing — and not one pack ever stated that as a rule. This one states the opposite.'),
  paleCarryTheOverhang: dim(4, 'count', 'canon', 'zahari-1977', 'Tritisan tiap tingkat dipikul lengan-lengan pale, dan banyaknya pale adalah kedudukan pemiliknya: empat yang tertinggi, tiga di bawahnya, dan rumah yang tidak berhak atas satu pun tidak menjorok sama sekali. Jadi pada bangunan ini kedudukan menentukan seberapa jauh orang boleh membangun keluar — satu-satunya pak di sini yang aturan sosialnya menetapkan sebuah kantilever.', 'The projection of each storey is carried on pale arms, and how many there are is the household’s standing: four is the highest, three the next, and a house entitled to none does not project at all. So on this building rank decides how far you may build outward — the only pack here whose social rule sets a cantilever.'),
  noIron: dim(0, 'count', 'canon', 'schoorl-2003', 'Nol besi. Seluruh rangka dipasak dan dibaji. Rumoh Aceh juga tidak memakai besi, dan kedua bangunan itu layak dibaca berpasangan: di sana ketiadaan besi menjawab tanah yang bergerak, di sini menjawab bangunan yang harus dapat sedikit bekerja sambil condong keluar.', 'Zero iron. The whole frame is pegged and wedged. The rumoh Aceh uses no iron either, and the two are worth reading together: there the absence answers ground that moves, here it answers a building that has to be able to work a little while leaning out.'),
  floorsAreRanked: dim(1, 'count', 'canon', 'zahari-1977', 'Siapa yang boleh berada di tingkat mana sudah ditetapkan, dan tingkat teratas milik sultan sendiri. Aturan ini dinyatakan dan tidak diperiksa: lantai yang terlarang bagi seseorang bentuknya persis sama dengan lantai yang tidak — alasan yang sama seperti larangan-larangan pada pak Baduy.', 'Who may be on which storey is fixed, and the top is the sultan’s own. The rule is declared and not checked: a floor forbidden to somebody looks exactly like a floor that is not — the same reason the Baduy pack gives for its unprovable prohibitions.'),
} as const

export type DimKey = keyof typeof DIMS

export const DIM_KEYS = Object.keys(DIMS) as readonly DimKey[]

export const ALL_DIMS: readonly Dim[] = DIM_KEYS.map((k) => DIMS[k])

/* ── The pack ─────────────────────────────────────────────────────────── */

const STAGE_WEIGHT: Record<Stage, number> = {
  batu: 0.8,
  tiang: 2.2,
  pale: 1.2,
  lantai: 2.0,
  dinding: 1.4,
  atap: 1.6,
}

export const PACK: RulePack<ButonKinds> = {
  key: 'buton',
  dimKeys: DIM_KEYS,
  dim: (key) => DIMS[key],
  sources: SOURCES,
  sourceFor,
  stageOrder: STAGE_ORDER,
  stageWeight: (stage) => STAGE_WEIGHT[stage],
}

/* ── Provenance, bound to this pack ───────────────────────────────────── */

export function worstClass(keys: readonly DimKey[]): ProvenanceClass {
  return coreWorstClass(PACK, keys)
}

export function partClass(part: Pick<Part, 'dims'>): ProvenanceClass {
  return corePartClass(PACK, part)
}

export function partSplit(parts: readonly Pick<Part, 'dims'>[]): Split {
  return corePartSplit(PACK, parts)
}

export function provenanceSplit(dims: readonly Dim[] = ALL_DIMS): Split {
  return coreProvenanceSplit(dims)
}

/* ── The brackets, which are the rank ─────────────────────────────────── */

export interface PaleInfo {
  readonly pale: Pale
  readonly count: number
  readonly name: string
  readonly glossId: string
  readonly glossEn: string
}

export const PALE: readonly PaleInfo[] = [
  {
    pale: 'pata',
    count: 4,
    name: 'Pata pale',
    glossId: 'Empat lengan pada tiap sisi tiap tingkat: kedudukan tertinggi, dan tritisan terjauh yang boleh dibangun.',
    glossEn: 'Four arms to each side of each storey: the highest standing, and the furthest projection anybody may build.',
  },
  {
    pale: 'talu',
    count: 3,
    name: 'Talu pale',
    glossId: 'Tiga lengan pada tiap sisi. Bangunannya tetap menjorok, hanya lebih sedikit yang memikulnya.',
    glossEn: 'Three arms to each side. The building still projects; there is simply less carrying it.',
  },
  {
    pale: 'tanpa',
    count: 0,
    name: 'Tanpa pale',
    glossId: 'Tidak berhak atas satu pun, jadi tidak ada yang menjorok: rumahnya berdiri tegak lurus dari batu sampai atap. Ini bukan bangunan yang sama dalam ukuran lebih kecil — ini bangunan yang tidak mengatakan apa pun ke arah luar.',
    glossEn: 'Entitled to none, so nothing projects: the house stands plumb from stone to roof. It is not the same building smaller — it is a building that says nothing outward at all.',
  },
]

export function paleInfo(pale: Pale): PaleInfo {
  const found = PALE.find((p) => p.pale === pale)
  if (!found) throw new Error(`unknown pale: ${pale}`)
  return found
}

/* ── Stages ───────────────────────────────────────────────────────────── */

export const STAGES: readonly StageInfo[] = [
  {
    stage: 'batu',
    title: 'Batu',
    glossId: 'Batu-batu diletakkan lebih dulu. Tidak ada yang ditanam: seluruh rangka hanya berdiri di atasnya.',
    glossEn: 'The stones are set first. Nothing is buried: the whole frame simply stands on them.',
  },
  {
    stage: 'tiang',
    title: 'Tiang',
    glossId: 'Tiang tingkat terbawah didirikan — tingkat yang paling sempit dari seluruh bangunan.',
    glossEn: 'The posts of the lowest storey go up — the narrowest storey in the whole building.',
  },
  {
    stage: 'pale',
    title: 'Pale',
    glossId: 'Lengan-lengan pale dipasang sebelum lantai yang dipikulnya, sebab tidak ada tritisan sebelum ada yang memegangnya. Banyaknya lengan adalah kedudukan pemiliknya.',
    glossEn: 'The pale arms go on before the floor they carry, because there is no projection before there is something holding it. How many arms there are is the household’s standing.',
  },
  {
    stage: 'lantai',
    title: 'Lantai',
    glossId: 'Tiap lantai dipasang lebih lebar daripada tingkat di bawahnya, di atas lengan-lengan itu.',
    glossEn: 'Each floor is framed wider than the storey below it, over those arms.',
  },
  {
    stage: 'dinding',
    title: 'Dinding',
    glossId: 'Papan dipasang di antara tiang, sedikit masuk ke dalam dari tepi lantai, sehingga tepi tiap tingkat terbaca sebagai satu garis.',
    glossEn: 'Boards go in between the posts, a little inside the edge of each floor, so the edge of every storey reads as a line.',
  },
  {
    stage: 'atap',
    title: 'Atap',
    glossId: 'Sirap menutup tingkat teratas, dan tritisannya adalah tonjolan terlebar pada bangunan yang setiap tingkatnya sudah menonjol.',
    glossEn: 'Shingles cover the topmost storey, and their overhang is the widest projection on a building every storey of which already projects.',
  },
]

export function stageInfo(stage: Stage): StageInfo {
  const found = STAGES.find((s) => s.stage === stage)
  if (!found) throw new Error(`unknown stage: ${stage}`)
  return found
}

/* ── Input hygiene ────────────────────────────────────────────────────── */

export const DEFAULT_RULES: Rules = { tingkat: 4, pale: 'pata', anjungan: true }

export const MIN_TINGKAT = 2
export const MAX_TINGKAT = 4

export function normaliseRules(rules: Rules): Rules {
  return {
    tingkat: Math.min(MAX_TINGKAT, Math.max(MIN_TINGKAT, Math.round(rules.tingkat))),
    pale: rules.pale,
    // The projecting room belongs to the top storey of a full malige. A house
    // that does not project at all does not carry one.
    anjungan: rules.pale === 'tanpa' ? false : rules.anjungan,
  }
}

/** Every Dim that fed a given layout. */
export function dimsForLayout(_layout: Pick<Layout, 'rules'>): readonly Dim[] {
  return ALL_DIMS
}
