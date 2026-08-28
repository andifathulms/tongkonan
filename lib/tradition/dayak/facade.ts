/**
 * The betang, as the registry sees it.
 *
 * The seventh file of this shape and still no shared code between them.
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
  tumbuhInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { shingleCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A long house, grown from one end, roofed the whole way. */
const SHOWCASE: Rules = { keluarga: 16, tumbuh: 'hilir', sami: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = tumbuhInfo(rules.tumbuh)
  const ratio = layout.length / (layout.halfX * 2)

  const readout: readonly Readout[] = [
    { label: t('Keluarga', 'Households'), value: String(rules.keluarga) },
    { label: t('Panjang', 'Length'), value: `${layout.length.toFixed(1)} m` },
    { label: t('Lebar', 'Width'), value: `${(layout.halfX * 2).toFixed(2)} m` },
    { label: t('Panjang : lebar', 'Length : width'), value: `${ratio.toFixed(1)} : 1` },
    { label: t('Sekat', 'Partitions'), value: String(rules.keluarga - 1) },
    { label: t('Tinggi lantai', 'Floor height'), value: `${layout.floorY.toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'panjang',
      title: t('Berapa keluarga tinggal di dalamnya', 'How many households live inside'),
      body: t(
        'Hitung sekatnya dan tambahkan satu, atau hitung pintu yang membuka ke galeri. Panjang rumah ini adalah jumlah keluarganya dikali satu bagian, dan tidak ada perbandingan yang mengaturnya — ia bisa empat puluh meter atau dua ratus. Enam rumah lain dalam projek ini punya ukuran khas yang bisa disebut; yang ini tidak punya, dan ketiadaan itu bukan kekurangan model melainkan sifat bangunannya.',
        'Count the partitions and add one, or count the doors opening onto the gallery. This building’s length is its household count times one share, and no proportion governs it — it may be forty metres or two hundred. The other six houses here have a characteristic size you could quote; this one has none, and that absence is a property of the building rather than a gap in the model.',
      ),
      value: t(String(rules.keluarga), String(rules.keluarga)),
      unit: t(`keluarga · ${layout.length.toFixed(0)} m`, `households · ${layout.length.toFixed(0)} m`),
    },
    {
      key: 'sami',
      title: t('Berapa banyak kehidupan dijalani bersama', 'How much of life is lived in common'),
      body: t(
        'Bandingkan lebar galeri dengan dalamnya bilik. Sami membentang di muka setiap bilik sepanjang rumah, menjadi milik semua orang, dan hampir seluas ruang pribadi di belakangnya. Perbandingan itulah pernyataannya: yang tertutup dan yang bersama hampir sama besar. Galeri ini tidak pernah didinding, karena mendindingnya berarti mengklaimnya.',
        'Compare the depth of the gallery with the depth of a bilik. The sami runs in front of every room for the length of the house, belongs to everyone, and is nearly as deep as the private space behind it. That ratio is the statement: what is enclosed and what is shared are almost the same size. The gallery is never walled, because to wall it would be to claim it.',
      ),
      value: t(
        `${(layout.samiDepth / layout.bilikDepth).toFixed(2)}`,
        `${(layout.samiDepth / layout.bilikDepth).toFixed(2)}`,
      ),
      unit: t('galeri : bilik', 'gallery : room'),
    },
    {
      key: 'tumbuh',
      title: t('Dari ujung mana rumah ini tumbuh', 'Which end this house grew from'),
      body: t(
        'Letak sebuah keluarga di sepanjang rumah menyatakan kedudukannya, jadi ujung mana yang ditambahi bukan hal sepele. Menambah di ujung hilir menjaga ujung hulu tetap di tempatnya dan mempertahankan urutan itu; menambah di kedua ujung menjaga bagian tengah dan itulah yang dilakukan rumah yang menerima keluarga lebih cepat daripada ia menyusun kedudukannya. Jalan naiknya ada di ujung yang tidak ditumbuhi — jadi pintu masuk rumah ini tetap di tempat yang sama sepanjang riwayatnya.',
        'A household’s position along the house states its standing, so which end is added to is not a trivial matter. Adding downstream keeps the upstream end where it is and preserves that order; adding at both ends keeps the middle, which is what a house does when it is taking in families faster than it is ranking them. The way up is at the end that was not grown — so this building’s entrance stays where it has always been through its whole history.',
      ),
      value: t(info.name, info.name),
      unit: t(`hejot pada ${layout.hejot.z.toFixed(1)} m`, `hejot at ${layout.hejot.z.toFixed(1)} m`),
    },
    {
      key: 'satu',
      title: t('Apakah ini satu rumah atau sebuah kampung', 'Whether this is one house or a village'),
      body: t(
        'Satu rumah. Lantainya satu bidang menerus dari ujung ke ujung, di bawah bilik maupun galeri, dan atapnya satu pelana sepanjang itu — bukan sederet rumah yang berhimpitan. Perbedaan itu bukan soal istilah: bangunan yang lantainya satu adalah bangunan yang keputusannya diambil bersama.',
        'One house. Its floor is a single continuous plane from end to end, under both the rooms and the gallery, and its roof is one gable the whole way — not a row of houses touching. That difference is not a matter of wording: a building with one floor is a building whose decisions are taken together.',
      ),
      value: t('1', '1'),
      unit: t(`lantai · ${layout.length.toFixed(0)} m`, `floor · ${layout.length.toFixed(0)} m`),
    },
    {
      key: 'ulin',
      title: t('Mengapa bangunan sepanjang ini bisa bertahan', 'Why a building this long lasts'),
      body: t(
        'Ulin — kayu besi. Tiangnya, gelagarnya dan sirapnya dari kayu yang bertahan berpuluh tahun di iklim yang menghabiskan kayu lain. Atapnya sirap belah, bukan daun: lebih tipis, tindihannya lebih besar karena yang bocor pada sirap adalah sambungannya, dan umurnya jauh lebih panjang daripada atap ijuk atau alang-alang di rumah lain dalam projek ini.',
        'Ulin — ironwood. Its posts, bearers and shingles are of a timber that lasts decades in a climate that consumes other wood. The roof is split shingle rather than leaf: thinner, lapped more because what leaks on a shingle is the joint, and lasting far longer than the ijuk or alang-alang on other houses in this project.',
      ),
      value: t(String(layout.shingleCourses), String(layout.shingleCourses)),
      unit: t('lapis sirap', 'shingle courses'),
    },
  ]

  return {
    key: 'dayak',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumah betang', 'Rumah betang'),
    subhead: t(
      `${rules.keluarga} keluarga · ${layout.length.toFixed(0)} m · ${ratio.toFixed(1)} : 1`,
      `${rules.keluarga} households · ${layout.length.toFixed(0)} m · ${ratio.toFixed(1)} : 1`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = shingleCounterexample()
  const rows = (w: { lap: number; courses: number }): readonly Readout[] => [
    { label: t('tindihan', 'lap'), value: `${(w.lap * 100).toFixed(1)}%` },
    { label: t('lapis', 'courses'), value: String(w.courses) },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Dua pemeriksaan terkuat di pak ini tidak dapat dipatahkan dengan mendorong satu dimensi mana pun — panjang yang bukan perbandingan tetap bukan perbandingan berapa pun angkanya, dan dinding bilik berdiri tepat di batas galeri menurut caranya dibangun. Keduanya diuji langsung di berkas uji, terhadap hitungannya sendiri. Yang ditampilkan di sini membandingkan dua angka yang benar-benar berdiri sendiri: atap sirap tidak bocor lewat sirapnya melainkan lewat sambungan antar sirapnya, dan satu-satunya hal yang menahan air di sana adalah seberapa jauh tiap lapis menindih lapis di bawahnya. Kurangi tindihannya dan atapnya tetap terbuat dari ulin sebanyak itu juga, di atas kasau yang sama persis, dan berhenti menutupi dirinya sendiri.',
      'The two strongest checks in this pack cannot be broken by pushing any single dimension — a length that is not a proportion stays not a proportion whatever the numbers are, and the bilik wall stands exactly on the gallery boundary by construction. Both are tested directly in the test file, against their own arithmetic. What is shown here compares two genuinely independent numbers: a shingle roof does not leak through its shingles, it leaks at the joints between them, and the only thing holding water out there is how far each course laps the one below. Take the lap away and the roof is still made of exactly that much ironwood, over exactly the same rafters, and it stops covering itself.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'dayak',
    slug: 'dayak',
    house: t('Rumah betang', 'Rumah betang'),
    people: t('Dayak', 'Dayak'),
    place: t('Kalimantan Tengah', 'Central Kalimantan'),
    about: t(
      'Rumah betang adalah rumah panjang: satu bangunan di atas tiang ulin yang tinggi, dengan sederet bilik keluarga di belakang dan satu galeri bersama membentang di mukanya. Yang membuatnya layak dibangun di sini bukan bentuknya melainkan panjangnya — atau justru ketiadaan panjangnya. Rumah ini bertambah dengan menambahkan bilik demi bilik, satu untuk tiap keluarga, jadi panjangnya adalah sensus dan bukan perbandingan. Ini satu-satunya bangunan dalam projek ini yang tidak punya ukuran khas. Matahari pada model ini dihitung untuk Kalimantan Tengah, 1,68° LS dan 113,38° BT.',
      'A rumah betang is a longhouse: one building on tall ironwood posts, with a row of family rooms behind and a single common gallery running along its front. What makes it worth building here is not its shape but its length — or rather the absence of one. It grows by adding bilik one at a time, one for each household, so its length is a census and not a proportion. It is the only building in this project with no characteristic size. The sun in this model is computed for Central Kalimantan, 1.68° S and 113.38° E.',
    ),
    caution: t(
      'Kekurangan yang paling perlu dinyatakan bukan soal ukuran. “Dayak” adalah nama bagi banyak suku di seluruh Kalimantan yang berbicara banyak bahasa, dan rumah panjang mereka bukan satu bangunan: rumah Iban, Kenyah, Ngaju dan Ot Danum berbeda dalam denah, bahan dan tata caranya. Istilah pada layar ini condong ke Ngaju dan Ot Danum. Satu pak aturan yang diam-diam merata-ratakan selusin tradisi menjadi satu “rumah Dayak” justru melakukan hal yang hendak ditolak projek ini — jadi pak ini menyatakan condongnya, dan tidak berpura-pura mewakili seluruhnya. Selain itu: batas dua puluh keluarga pada kendali adalah batas model, bukan batas bangunan; ukiran tidak ada sama sekali; dan tiada satu pun angka di sini yang berasal dari pengukuran.',
      'The shortfall most worth stating is not about dimensions. “Dayak” is a name for many peoples across Borneo speaking many languages, and their longhouses are not one building: Iban, Kenyah, Ngaju and Ot Danum houses differ in plan, in material and in practice. The terms on this screen lean Ngaju and Ot Danum. A single rule pack quietly averaging a dozen traditions into one “Dayak house” would be doing exactly what this project exists to refuse — so this pack states its lean and does not pretend to stand for the whole. Beyond that: the cap of twenty households on the control is a limit of the model and not of the building; there is no carving at all; and not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah betang berdiri sejajar sungai, dengan galeri menghadap air — sungai adalah jalannya, dan muka rumah menghadap jalan. Sumbu memanjangnya pun dinamai dari sungai: hulu dan hilir, dan kedudukan sebuah keluarga terbaca dari letaknya di antara keduanya. Jadi aturan arah di sini melakukan dua hal sekaligus yang tidak dilakukan enam rumah lain: ia menghadapkan bangunan, dan ia memberi urutan pada isinya. Model ini menaruh galeri pada −X dan hulu pada +Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'A betang stands parallel to the river with its gallery facing the water — the river is the road, and the front of the house faces the road. Its long axis is named from the river too: upstream and downstream, and a household’s standing is read from where it sits between them. So the orientation rule here does two things at once that none of the other six do: it faces the building, and it orders what is inside it. This model puts the gallery on −X and upstream on +Z. There is still no control that turns the building.',
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
          'Gelagar duduk dalam takik di kepala tiang. Sambungan yang sama diulang di sepanjang rumah, sebanyak yang diperlukan keluarganya.',
          'A bearer sits in a notch cut in the head of a post. The same joint repeated the length of the house, as many times as the households require.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t('Kasau bertemu bubungan dan dipasak.', 'A rafter meets the ridge and is pegged.'),
      },
      {
        kind: 'sandar',
        name: t('Sandar', 'Leaned, not fixed'),
        gloss: t(
          'Hejot hanya bersandar pada tepi galeri dan tidak dipasang mati — satu-satunya sambungan dalam projek ini yang dibuat justru supaya bisa dilepas. Malam hari batang itu ditarik ke atas.',
          'The hejot only leans against the gallery edge and is not fixed — the only joint in this project made so that it can be taken away. At night the log is pulled in.',
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
