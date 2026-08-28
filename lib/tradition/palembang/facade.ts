/**
 * The rumah limas, as the registry sees it.
 *
 * The ninth file of this shape and still no shared code between them.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { runInvariants } from './invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  SOURCES,
  STAGES,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { headroomCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The full sequence, a broad house, and a screened front. */
const SHOWCASE: Rules = { kekijing: 5, lebar: 6, tenggalung: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const top = layout.levels[layout.levels.length - 1]
  const first = layout.levels[0]

  const readout: readonly Readout[] = [
    { label: t('Kekijing', 'Kekijing'), value: String(layout.levels.length) },
    { label: t('Naik seluruhnya', 'Rise in all'), value: `${(layout.topY - layout.floorY).toFixed(2)} m` },
    { label: t('Tiap tingkat', 'Each step'), value: `${layout.stepRise.toFixed(2)} m` },
    { label: t('Kedalaman', 'Depth'), value: `${(layout.halfX * 2).toFixed(2)} m` },
    { label: t('Lebar', 'Width'), value: `${(layout.halfZ * 2).toFixed(2)} m` },
    { label: t('Kepala di gegajah', 'Headroom at the top'), value: `${(layout.eaveY - (top?.y ?? 0)).toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'kekijing',
      title: t('Di mana Anda akan didudukkan', 'Where you would be seated'),
      body: t(
        'Pada salah satu tingkat lantainya, dan tingkat itulah kedudukan Anda. Lantai rumah ini naik bertingkat dari muka — tempat rumah bertemu jalan — sampai gegajah di belakang, tempat keluarga. Tidak ada yang ditolak masuk; yang berbeda adalah setinggi apa ia duduk. Ini satu-satunya rumah dalam projek ini yang fakta sosialnya benar-benar sebuah ketinggian: bukan pangkat yang menskalakan bangunan atau cacah yang memanjangkannya, melainkan sekian sentimeter, diukur dari lantai yang Anda pijak saat masuk.',
        'On one of the steps of its floor, and that step is your standing. This floor rises from the front — where the house meets the street — to the gegajah at the back, where the family is. Nobody is refused entry; what differs is how high they sit. It is the only house in this project whose social fact is literally a height: not a rank that scales a building or a count that lengthens one, but so many centimetres, measured from the floor you stood on when you came in.',
      ),
      value: t(String(layout.levels.length), String(layout.levels.length)),
      unit: t(`tingkat · naik ${(layout.topY - layout.floorY).toFixed(2)} m`, `levels · rising ${(layout.topY - layout.floorY).toFixed(2)} m`),
    },
    {
      key: 'axes',
      title: t('Mengapa lebar rumah ini tidak berarti apa-apa', 'Why this house’s width means nothing'),
      body: t(
        'Karena kedua sumbunya membawa hal yang berbeda. Kedalaman membawa urutan sosial dan bertambah hanya dengan menambah kekijing; lebar hanya membawa ukuran dan bertambah dengan menambah ruang. Melebarkan rumah tidak menambah satu pun pembedaan yang dibuat rumah tangga ini. Delapan rumah lain dalam projek ini memperlakukan denah sebagai satu hal — ubah satu aturan dan seluruh tapaknya bergerak — dan pemeriksaan di sini menyatakan bahwa yang satu tidak menggerakkan yang lain.',
        'Because its two axes carry different things. The depth carries the social sequence and grows only by adding a kekijing; the width carries only size and grows by adding a bay. Making the house wider adds not one distinction to those this household draws. The other eight houses here treat a plan as one thing — change a rule and the whole footprint moves — and the check on this one states that neither axis moves the other.',
      ),
      value: t(
        `${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)}`,
        `${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)}`,
      ),
      unit: t('m — dalam × lebar', 'm — depth × width'),
    },
    {
      key: 'tiang',
      title: t('Apa yang terbaca dari kolongnya', 'What can be read from underneath'),
      body: t(
        'Seluruh urutannya. Tiap barisan tiang berdiri setinggi tingkat yang dipikulnya, jadi tidak ada dua barisan yang sama panjang, dan susunan sosial rumah ini sudah terbaca dari luar sebelum satu papan pun dipasang. Di delapan rumah lain, sebarisan tiang adalah sebarisan batang yang serupa.',
        'The whole sequence. Every rank of posts stands to the level it carries, so no two ranks are the same length, and this house’s social order is legible from outside before a single board is laid. In the other eight houses, a rank of posts is a rank of identical members.',
      ),
      value: t(String(layout.levels.length), String(layout.levels.length)),
      unit: t('panjang tiang yang berbeda', 'distinct post lengths'),
    },
    {
      key: 'atap',
      title: t('Mengapa tingkat terendah paling lega', 'Why the lowest level has the most air'),
      body: t(
        'Karena atapnya tidak ikut bertingkat. Lantainya naik, atapnya rata, jadi orang yang berdiri di ujung jalan berada di bawah atap yang jauh lebih tinggi daripada orang di gegajah. Ruang paling lapang di rumah ini justru diberikan kepada yang kedudukannya paling rendah — dan itu bukan kemurahan hati melainkan akibat geometri.',
        'Because the roof does not step with it. The floor rises and the roof stays level, so a person standing at the street end is under far more roof than one in the gegajah. The most generous space in this house is given to the lowest standing — and that is not generosity but a consequence of geometry.',
      ),
      value: t(
        `${(layout.eaveY - (first?.y ?? 0)).toFixed(2)}`,
        `${(layout.eaveY - (first?.y ?? 0)).toFixed(2)}`,
      ),
      unit: t(`m di jogan, ${(layout.eaveY - (top?.y ?? 0)).toFixed(2)} m di gegajah`, `m at the jogan, ${(layout.eaveY - (top?.y ?? 0)).toFixed(2)} m at the gegajah`),
    },
    {
      key: 'tenggalung',
      title: t('Apa yang diubah kisi-kisi di muka', 'What the lattice at the front changes'),
      body: t(
        'Ambangnya, bukan urutannya. Pagar tenggalung adalah galeri terdepan tempat rumah bertemu jalan; dengan kisi-kisi, rumah tangga menerima dengan jarak, tanpa kisi-kisi ia menerima menurut aturan jalan. Yang di belakangnya sama saja. Dan kisi-kisi itu batang, bukan bidang — sekat yang bisa dilihat tembus bukan dinding.',
        'Its threshold, not its hierarchy. The pagar tenggalung is the front gallery where the house meets the street; with the lattice the household receives at a remove, without it on the street’s terms. What lies behind is the same either way. And the lattice is bars rather than a panel — a screen you can see through is not a wall.',
      ),
      value: t(layout.tenggalung.screened ? 'ada' : 'tidak ada', layout.tenggalung.screened ? 'screened' : 'open'),
      unit: t(`galeri ${layout.tenggalung.depth.toFixed(1)} m`, `a ${layout.tenggalung.depth.toFixed(1)} m gallery`),
    },
  ]

  return {
    key: 'palembang',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumah limas', 'Rumah limas'),
    subhead: t(
      `${layout.levels.length} kekijing · naik ${(layout.topY - layout.floorY).toFixed(2)} m · ${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m`,
      `${layout.levels.length} kekijing · rising ${(layout.topY - layout.floorY).toFixed(2)} m · ${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = headroomCounterexample()
  const rows = (w: { rise: number; headroom: number }): readonly Readout[] => [
    { label: t('tiap tingkat', 'each step'), value: `${w.rise.toFixed(2)} m` },
    { label: t('kepala di gegajah', 'headroom at the top'), value: `${w.headroom.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tinggikan tiap tingkat dan urutannya tetap sempurna: lima tingkat, masing-masing di atas yang sebelumnya, dalam urutan yang benar, dengan nama yang benar. Pemeriksaan atas urutan itu terus lulus. Yang habis adalah udara di atas ujung urutannya, karena atapnya tidak ikut bertingkat — jadi rumah tangga yang bersikeras membedakan tamunya makin tegas pada akhirnya tidak bisa berdiri tegak di gegajahnya sendiri. Pola kegagalannya sama seperti delapan rumah sebelumnya: aturan yang tidak dapat dilaksanakan, bukan aturan yang dilanggar. Yang berbeda di sini adalah aturan mana yang mengalah — tuntutan sosialnya bisa dipenuhi sampai setinggi apa pun; bangunannya yang lebih dulu kehabisan.',
      'Raise each step and the sequence stays perfect: five levels, each above the last, in the right order, correctly named. The check on the sequence goes on passing. What runs out is the air over the top of it, because the roof does not step with the floor — so a household insisting on ever sharper distinctions between its guests eventually cannot stand up in its own gegajah. The shape of failure is the same as in the eight houses before: a rule that cannot be carried out rather than one disobeyed. What differs here is which rule gives way — the social demand is satisfiable to any degree; it is the building that runs out first.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'palembang',
    slug: 'palembang',
    house: t('Rumah limas', 'Rumah limas'),
    people: t('Palembang', 'Palembang'),
    place: t('Palembang, Sumatera Selatan', 'Palembang, South Sumatra'),
    about: t(
      'Rumah limas adalah rumah orang Palembang: bangunan panggung berbadan lebar dengan atap limas, dan di dalamnya satu ruang yang lantainya naik bertingkat dari muka ke belakang. Tingkat-tingkat itu — kekijing — adalah alasan bangunan ini dibangun di sini. Tempat seorang tamu didudukkan pada urutan itu adalah kedudukannya, jadi fakta sosialnya bukan sesuatu yang darinya ukuran diturunkan; ia sebuah ketinggian, dalam meter. Rumah ini juga satu-satunya di sini yang kedua sumbu denahnya mengatakan hal berbeda: kedalamannya sosial, lebarnya sekadar ukuran. Matahari pada model ini dihitung untuk Palembang, 2,98° LS dan 104,76° BT.',
      'A rumah limas is the house of Palembang: a broad raised building under a limas roof, and inside it one room whose floor rises in steps from front to back. Those steps — the kekijing — are why this building is here. Where a guest is seated on that sequence is their standing, so the social fact is not something a dimension is derived from; it is a height, in metres. It is also the only house here whose two plan axes say different things: its depth is social, its width is merely size. The sun in this model is computed for Palembang, 2.98° S and 104.76° E.',
    ),
    caution: t(
      'Angka yang paling bermuatan di sini juga yang paling lemah dasarnya. Sumber memerikan urutan kekijing, menamai tingkatnya dan menjelaskan siapa yang duduk di mana; tak satu pun memberi tinggi satu tingkat. Jadi seberapa tegas rumah tangga ini membedakan tamunya — satu-satunya hal yang benar-benar dinyatakan bangunan ini — adalah angka karangan penulis. Selain itu: rumah bertingkat tiga di sini mempertahankan tingkat pertama, tengah dan terakhir, dan pilihan mana yang dilepas adalah penetapan penulis; nama serta kegunaan tiap tingkat diberikan sebagaimana sumber memberikannya, tanpa memerinci tata cara; tidak ada ukiran sama sekali, padahal rumah limas berukir; dan tidak ada satu pun angka di sini yang berasal dari pengukuran.',
      'The most loaded number here is also the least supported. The sources describe the kekijing sequence, name the levels and say who sits where; none gives the height of one step. So how sharply this household distinguishes between its guests — the one thing this building actually states — is a figure the author invented. Beyond that: a three-step house here keeps the first, middle and last levels, and which two are dropped is the author’s choice; the names and uses of the levels are given as the sources give them, without detailing ritual; there is no carving at all, though a rumah limas is carved; and not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah menghadap sungai — Musi adalah jalannya, dan muka rumah menghadap jalan. Aturannya bersifat hubungan seperti pada rumah gadang, mbaru niang dan betang, tetapi di sini ia mengerjakan satu hal lagi yang tidak dikerjakan yang lain: karena urutan kekijing berjalan dari muka ke belakang, arah hadap rumah menentukan arah naiknya kedudukan. Menghadapkan bangunan berarti menetapkan dari mana orang datang dan karena itu di mana ia mulai. Model ini menaruh muka rumah pada −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The house faces the river — the Musi is the road, and the front of a house faces the road. The rule is relational as in the rumah gadang, the mbaru niang and the betang, but here it does one thing more than in any of those: because the kekijing sequence runs front to back, which way the house faces sets which way standing rises. To orient the building is to fix where a person arrives from and therefore where they begin. This model puts the front on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat on a stone'),
        gloss: t('Kaki tiang duduk di batunya, tidak ditanam.', 'A post foot seats on its stone and is not buried.'),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Notched seat'),
        gloss: t(
          'Kijing duduk dalam takik di kepala tiang. Sambungan yang sama diulang di tiap barisan — tetapi pada ketinggian yang berbeda-beda, karena tiap barisan memikul tingkatnya sendiri.',
          'A kijing sits in a notch in the post head. The same joint repeated at every rank — but at a different height each time, because every rank carries its own level.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t('Jurai bertemu bubungan dan dipasak.', 'A hip rafter meets the ridge and is pegged.'),
      },
    ],
    sources: SOURCES,
    dims: DIM_KEYS.map((key) => ({ key, dim: DIMS[key] })),
    split: provenanceSplit(ALL_DIMS),
    defaultQuery: rulesToQuery(DEFAULT_RULES),
    showcaseQuery: rulesToQuery(SHOWCASE),
    build,
    sensitivity: () => sensitivities(),
    probeLabel: (key) => {
      const label = probeLabel(key)
      return t(label.id, label.en)
    },
    counterexample,
  }
}
