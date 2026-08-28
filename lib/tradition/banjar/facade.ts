/**
 * The Banjar house, as the registry sees it.
 *
 * The fourteenth file of this shape and still no shared code between them,
 * which after fourteen is as strong as this sort of evidence gets.
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
  JENIS,
  SOURCES,
  STAGES,
  jenisInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { ridgeCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The tall type, deep, with both wings. */
const SHOWCASE: Rules = { jenis: 'bubungan-tinggi', ruang: 5, anjung: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = jenisInfo(rules.jenis)
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const others = layout.segments.filter((s) => s.key !== 'palidangan')
  const margin = (core?.ridgeY ?? 0) - Math.max(...others.map((s) => s.ridgeY))

  const readout: readonly Readout[] = [
    { label: t('Ruas beratap', 'Roofed segments'), value: String(layout.segments.length) },
    { label: t('Bentuk di atas inti', 'Form over the core'), value: core?.bentuk ?? '—' },
    { label: t('Bubungan inti', 'Core ridge'), value: `${(core?.ridgeY ?? 0).toFixed(2)} m` },
    { label: t('Menjulang', 'Clears its neighbours by'), value: `${margin.toFixed(2)} m` },
    { label: t('Panjang', 'Length'), value: `${layout.depth.toFixed(1)} m` },
    { label: t('Anjung', 'Anjung'), value: layout.anjung.present ? '2' : '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'rantai',
      title: t('Berjalanlah menyusuri bubungannya', 'Walk along its ridge'),
      body: t(
        'Dan sebutkan apa yang berganti di atas kepala. Pelataran terbuka di muka, lalu surambi di bawah sengkuap yang rendah, lalu inti di bawah bentuknya sendiri yang menjulang, lalu padu di bawah sengkuap lagi. Tiga belas bangunan lain dalam projek ini punya satu atap — dilengkungkan, dilimaskan, dikerucutkan, dikubahkan, ditudungkan — yang menutupi seluruh denahnya. Yang ini punya empat, berurutan, di sepanjang satu bubungan, dan itulah cara membacanya.',
        'And name what changes overhead. An open platform at the front, then the surambi under a low shed, then the core under its own rising form, then the padu under a shed again. The other thirteen buildings in this project have one roof — swept, hipped, coned, domed, hooded — over the whole plan. This one has four in a row along a single ridge, and that is how it is read.',
      ),
      value: t(String(layout.segments.length), String(layout.segments.length)),
      unit: t('atap, satu bubungan', 'roofs, one ridge'),
    },
    {
      key: 'nama',
      title: t('Mengapa rumah ini dinamai atapnya', 'Why this house is named for its roof'),
      body: t(
        'Karena atapnyalah yang membedakannya. Bubungan tinggi, palimasan, gajah baliku: bangunan yang sama, urutan yang sama, dan satu ruas dari empat berganti bentuk. Aturan yang memilih jenisnya tidak menskalakan apa pun, tidak menghitung apa pun, dan tidak menyalakan bagian apa pun — ia memilih sebuah primitif geometri, dan itu satu-satunya aturan semacam itu dalam projek ini.',
        'Because the roof is what distinguishes it. Bubungan tinggi, palimasan, gajah baliku: the same building, the same sequence, and one segment of four changes form. The rule that picks the type scales nothing, counts nothing and switches no part on — it selects a geometric primitive, and it is the only rule of that kind in this project.',
      ),
      value: t(info.name, info.name),
      unit: t(`inti: ${info.core}`, `core: ${info.core}`),
    },
    {
      key: 'tinggi',
      title: t('Apa yang terjadi kalau bubungannya diturunkan', 'What happens if the ridge comes down'),
      body: t(
        'Rumahnya tetap berdiri dan berhenti menjadi apa yang disebut namanya. Tidak ada yang patah: rantainya tetap bertemu ujung ke ujung, tiap ruas tetap beratap, sirapnya tetap menindih, lantainya tetap turun bertingkat. Yang berhenti benar hanyalah bahwa yang di tengah menjulang — dan sebuah bangunan bernama “bubungan tinggi” yang bubungannya tidak tinggi adalah bangunan yang namanya memerikan sesuatu yang tidak ada padanya.',
        'The house stands and stops being what its name says. Nothing breaks: the chain still meets end to end, every segment still has a roof, the shingles still lap, the floors still step. The only thing that stops being true is that the middle rises — and a building called “bubungan tinggi” whose ridge is not high is one whose name describes something not there.',
      ),
      value: t(`${margin.toFixed(2)}`, `${margin.toFixed(2)}`),
      unit: t('m menjulang di atas tetangganya', 'm above its neighbours'),
    },
    {
      key: 'lantai',
      title: t('Mengapa lantainya turun ke arah muka', 'Why the floor steps down toward the front'),
      body: t(
        'Karena atapnya turun, dan karena airnya harus mengalir menjauh. Rumah limas Palembang juga bertingkat lantainya dan artinya berlawanan: di sana tempat seorang tamu didudukkan adalah kedudukannya, dan tingkat itulah pernyataan bangunannya. Di sini tingkat itu akibat — dari urutan atapnya, dan dari rawa pasang tempat Banjarmasin berdiri. Dua bangunan, potongan yang mirip, dua arti yang tidak berhubungan.',
        'Because the roofs come down, and because the water has to run away. The Palembang rumah limas also steps its floor and means the opposite by it: there where a guest is seated is their standing, and the steps are the building’s statement. Here they are a consequence — of the sequence of roofs, and of the tidal swamp Banjarmasin stands on. Two buildings, a similar section, two unrelated meanings.',
      ),
      value: t(
        `${((core?.floorY ?? 0) - (layout.segments[0]?.floorY ?? 0)).toFixed(2)}`,
        `${((core?.floorY ?? 0) - (layout.segments[0]?.floorY ?? 0)).toFixed(2)}`,
      ),
      unit: t('m turun sampai pelataran', 'm down to the platform'),
    },
    {
      key: 'ulin',
      title: t('Mengapa bahannya sama dengan rumah betang', 'Why its material is the betang’s'),
      body: t(
        'Ulin — kayu besi, dari hutan yang sama di pulau yang sama, untuk air yang sama. Tongkatnya berdiri di rawa pasang dan sirapnya menahan hujan Kalimantan; keduanya pekerjaan yang menghabiskan kayu lain. Dua bangunan Kalimantan dalam projek ini, jauh berbeda bentuknya, memakai bahan yang sama karena keduanya menjawab tempat yang sama.',
        'Ulin — ironwood, from the same forest on the same island, for the same water. Its posts stand in a tidal swamp and its shingles hold off Bornean rain; both are work that consumes other timber. Two Bornean buildings in this project, far apart in form, using one material because both answer the same place.',
      ),
      value: t(String(layout.shingleCourses), String(layout.shingleCourses)),
      unit: t('lapis sirap tiap ruas', 'shingle courses per segment'),
    },
  ]

  return {
    key: 'banjar',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(info.name, info.name),
    subhead: t(
      `${layout.segments.length} atap · inti ${info.core} · ${layout.depth.toFixed(1)} m`,
      `${layout.segments.length} roofs · a ${info.core} core · ${layout.depth.toFixed(1)} m`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = ridgeCounterexample()
  const rows = (w: { core: number; neighbour: number }): readonly Readout[] => [
    { label: t('bubungan inti', 'core ridge'), value: `${w.core.toFixed(2)} m` },
    { label: t('tetangga tertinggi', 'tallest neighbour'), value: `${w.neighbour.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Turunkan bubungan intinya dan tidak ada yang gagal: rantainya tetap bertemu ujung ke ujung, tiap ruas tetap punya atapnya sendiri, sirapnya tetap menindih, lantainya tetap turun bertingkat. Yang berhenti benar hanyalah bahwa yang di tengah menjulang di atas tetangganya — dan bangunan bernama “bubungan tinggi” yang bubungannya tidak tinggi adalah bangunan yang namanya memerikan sesuatu yang tidak ada. Empat belas bangunan, empat belas aturan yang tidak dapat dilaksanakan, dan hanya yang ini yang gagal pada namanya: yang lain berakhir pada bangunan yang tidak mungkin didirikan, atau yang mati, atau yang berhenti menjadi untuk apa ia ada. Yang ini berakhir pada bangunan yang baik-baik saja dan bernama lain.',
      'Bring the core ridge down and nothing fails: the chain still meets end to end, every segment still has its own roof, the shingles still lap, the floors still step. The only thing that stops being true is that the middle rises above its neighbours — and a building called “bubungan tinggi” whose ridge is not high is one whose name describes something that is not there. Fourteen buildings, fourteen rules that cannot be carried out, and only this one fails at its name: the others end with a building that cannot be constructed, or one that is dead, or one that has stopped being what it was for. This one ends with a building that is perfectly fine and is called something else.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'banjar',
    slug: 'banjar',
    house: t('Rumah bubungan tinggi', 'Rumah bubungan tinggi'),
    people: t('Banjar', 'Banjar'),
    place: t('Banjarmasin, Kalimantan Selatan', 'Banjarmasin, South Kalimantan'),
    about: t(
      'Rumah Banjar adalah keluarga jenis rumah panggung ulin di tepi sungai Kalimantan Selatan, dan tiap jenis dinamai menurut atap intinya — bubungan tinggi, palimasan, gajah baliku. Yang membuatnya layak dibangun di sini adalah bahwa ia bukan satu atap melainkan empat, berurutan sepanjang satu bubungan: pelataran, surambi, palidangan, padu. Tiga belas bangunan lain dalam projek ini punya satu atap yang menutupi seluruh denahnya; yang ini dibaca dengan menyusuri bubungannya dan menyebut apa yang berganti di atas kepala. Matahari pada model ini dihitung untuk Banjarmasin, 3,32° LS dan 114,59° BT.',
      'The Banjar house is a family of raised ironwood house types on the rivers of South Kalimantan, and each type is named for the roof over its core — bubungan tinggi, palimasan, gajah baliku. What makes it worth building here is that it is not one roof but four, in a row along a single ridge: the pelatar, the surambi, the palidangan, the padu. The other thirteen buildings in this project have one roof over the whole plan; this one is read by walking the ridge and naming what changes overhead. The sun in this model is computed for Banjarmasin, 3.32° S and 114.59° E.',
    ),
    caution: t(
      'Satu penyederhanaan yang perlu dinyatakan langsung: ruas depan dan belakang dimodelkan sebagai pelana yang sangat rendah, bukan sengkuap sejati yang bersisi satu, karena primitif atap dalam projek ini simetris terhadap bubungannya dan sebuah sengkuap tidak. Urutan ketinggiannya benar dan satu dari empat bentuknya adalah hampiran. Selain itu: kemiringan bubungan intinya — angka yang membuat rumah ini dikenali — adalah penetapan penulis, karena sumber sepakat bahwa ia curam tanpa memberi sudutnya; rumah Banjar sesungguhnya punya lebih banyak jenis daripada tiga yang ada di sini; ukirannya, yang pada rumah Banjar tidak sedikit, tidak ada sama sekali; dan tidak ada satu pun angka di sini yang berasal dari pengukuran.',
      'One simplification to state outright: the front and back segments are modelled as very low gables rather than true single-slope sheds, because the roof primitive in this project is symmetric about its ridge and a shed is not. The sequence of heights is right and one of the four forms is an approximation. Beyond that: the pitch of the core ridge — the figure this house is recognised by — is the author’s, because the sources agree it is steep without giving an angle; the Banjar house has more types than the three here; the carving, of which a Banjar house has a great deal, is entirely absent; and not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah menghadap sungai, dan pelataran adalah tempat rumah bertemu air. Aturannya bersifat hubungan seperti pada beberapa rumah lain di sini, tetapi di Banjarmasin sungai adalah jalannya — jadi menghadapkan bangunan berarti menetapkan ujung mana yang menjadi depan, dan karena itu ke arah mana urutan empat atapnya berjalan. Menyusuri rumah ini adalah berjalan dari air ke dapur. Model ini menaruh pelataran pada −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The house faces the river, and the pelatar is where the house meets the water. The rule is relational as in several houses here, but in Banjarmasin the river is the road — so orienting the building fixes which end is the front, and therefore which way its sequence of four roofs runs. To walk this house is to walk from the water to the kitchen. This model puts the pelatar on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'takik',
        name: t('Takik', 'Notched seat'),
        gloss: t(
          'Gelagar duduk dalam takik di kepala tongkat — pada ketinggian yang berbeda tiap barisnya, karena tiap ruas duduk lebih rendah daripada yang di belakangnya.',
          'A bearer sits in a notch in the post head — at a different height at every rank, because each segment sits lower than the one behind it.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t(
          'Kasau bertemu bubungan ruasnya dan dipasak. Ada empat bubungan di rumah ini, jadi ada empat kali sambungan yang sama pada empat ketinggian.',
          'A rafter meets its segment’s ridge and is pegged. There are four ridges in this house, so the same joint is made four times at four heights.',
        ),
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
