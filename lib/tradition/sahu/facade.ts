/**
 * The sasadu, as the registry sees it.
 *
 * The thirty-third file of this shape, and the first whose social rule is
 * written in centimetres of headroom.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { seats } from './frame'
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
  pintuInfo,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { bowCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A long hall with four openings and the cloths tied on. */
const SHOWCASE: Rules = { bentang: 7, pintu: 'empat', kain: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = pintuInfo(rules.pintu)
  const seated = seats(layout)
  const highest = Math.max(...layout.doors.map((d) => d.head))
  const lowest = Math.min(...layout.doors.map((d) => d.head))

  const readout: readonly Readout[] = [
    { label: t('Bukaan', 'Openings'), value: String(info.count) },
    { label: t('Tertinggi', 'The highest'), value: `${(highest * 100).toFixed(0)} cm` },
    { label: t('Terendah', 'The lowest'), value: `${(lowest * 100).toFixed(0)} cm` },
    { label: t('Orang berdiri', 'A standing adult'), value: `${(layout.body.standing * 100).toFixed(0)} cm` },
    { label: t('Duduk makan', 'Sitting down to eat'), value: String(seated) },
    { label: t('Dinding', 'Walls'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'tinggi',
      title: t('Perbedaan yang dinyatakan dalam ruang di atas kepala', 'A difference stated in the space over your head'),
      body: t(
        `${info.glossId} Bukaan tertinggi ${(highest * 100).toFixed(0)} cm dan yang terendah ${(lowest * 100).toFixed(0)} cm, berselisih ${(DIMS.headStep.value * 100).toFixed(0)} cm tiap kali. Tiga puluh dua bangunan sebelum ini menyatakan kedudukan lewat ukuran, letak, tinggi lantai, jumlah rumah tangga, tingkat atap, lengan penyangga, atau tumpukan papan. Ini satu-satunya yang menyatakannya dalam sekian sentimeter di atas kepala orang yang masuk.`,
        `${info.glossEn} The highest opening is ${(highest * 100).toFixed(0)} cm and the lowest ${(lowest * 100).toFixed(0)} cm, ${(DIMS.headStep.value * 100).toFixed(0)} cm apart at each step. The thirty-two buildings before this state standing through size, position, floor height, a count of households, roof tiers, bracket arms or a stack of boards. This is the only one that states it in centimetres over the head of the person coming in.`,
      ),
      value: t(`${(DIMS.headStep.value * 100).toFixed(0)}`, `${(DIMS.headStep.value * 100).toFixed(0)}`),
      unit: t('cm antara satu orang dan yang berikutnya', 'cm between one person and the next'),
    },
    {
      key: 'membungkuk',
      title: t('Dan semua orang tetap membungkuk', 'And everybody still bows'),
      body: t(
        `Bukaan yang tertinggi pun ${(highest * 100).toFixed(0)} cm, di bawah ${(layout.body.standing * 100).toFixed(0)} cm orang dewasa berdiri. Jadi membungkuk bukan hal yang dituntut dari yang berkedudukan rendah: ia yang diminta bangunan ini dari semua orang yang masuk, termasuk dari orang yang bukaan tertinggi itu dibuat untuknya. Yang dibedakan oleh perbedaan tinggi itu adalah seberapa dalam, bukan siapa yang harus.`,
        `Even the highest opening is ${(highest * 100).toFixed(0)} cm, under the ${(layout.body.standing * 100).toFixed(0)} cm of a standing adult. So the bow is not something demanded of the low-ranking: it is what the building asks of everybody who comes in, including of the person the highest opening was made for. What the difference in height distinguishes is how far, not who has to.`,
      ),
      value: t(`${((layout.body.standing - highest) * 100).toFixed(0)}`, `${((layout.body.standing - highest) * 100).toFixed(0)}`),
      unit: t('cm harus ditundukkan bahkan oleh tamu', 'cm even a guest has to duck'),
    },
    {
      key: 'baileo',
      title: t('Kebalikan baileo, dan keduanya balai kampung', 'The baileo’s opposite, and both are village halls'),
      body: t(
        'Delapan belas bangunan yang lalu projek ini membangun baileo Maluku, dan pemeriksaannya berbunyi bahwa tempat tiap soa harus sama — lantainya menolak berjenjang, dan penolakan itulah pernyataannya. Yang ini justru membedakan bukaannya dengan sengaja. Dua balai kampung, satu pertanyaan tentang bagaimana orang masuk ke ruang bersama, dan dua jawaban yang berlawanan; tidak satu pun versi yang lain, dan keduanya benar tentang kampungnya masing-masing.',
        'Eighteen buildings ago this project built the Maluku baileo, and its check says every soa’s place must be equal — the floor refuses to step, and the refusal is the statement. This one differs its openings on purpose. Two village halls, one question about how people come into a shared room, and two opposite answers; neither is a version of the other, and both are true about their own village.',
      ),
      value: t('2', '2'),
      unit: t('balai, dua pernyataan berlawanan', 'halls, two opposite claims'),
    },
    {
      key: 'terbuka',
      title: t('Tidak ada dinding dan tidak ada daun pintu', 'No walls and no door leaves'),
      body: t(
        'Yang dimiliki bangunan ini adalah bukaan dengan tinggi berbeda, bukan pintu yang dapat ditutup — dan tidak ada dinding di antara keduanya. Balai yang membedakan orang dengan ruang di atas kepala adalah hal yang sama sekali lain daripada balai yang membedakannya dengan kunci: yang pertama menuntut sebuah gerakan, yang kedua menyingkirkan seseorang.',
        'What this building has is openings of different heights, not doors that can be shut — and no wall between any of them. A hall that distinguishes people by headroom is an entirely different thing from one that distinguishes them with a lock: the first asks for a gesture, the second removes somebody.',
      ),
      value: t('0', '0'),
      unit: t('daun pintu dan dinding', 'door leaves and walls'),
    },
    {
      key: 'makan',
      title: t('Panjangnya adalah jumlah orang yang makan di dalamnya', 'Its length is the number of people who eat in it'),
      body: t(
        `${rules.bentang} bentang, ${seated} orang duduk sekaligus di bangku keliling, sepanjang ${(layout.halfZ * 2).toFixed(1)} m. Usungan bade juga berasal dari hitungan orang — dan yang dihitungnya orang yang memikul sebuah benda. Yang ini menghitung orang yang duduk makan bersama, dan itu satu-satunya hitungan orang dalam projek ini yang menghasilkan sebuah ruangan.`,
        `${rules.bentang} bays, ${seated} people sitting down at once on the bench around it, along ${(layout.halfZ * 2).toFixed(1)} m. A bade’s lattice also comes from a headcount — and that one counts the people carrying an object. This counts the people sitting down to eat, and it is the only headcount in this project that produces a room.`,
      ),
      value: t(String(seated), String(seated)),
      unit: t('orang duduk sekaligus', 'people sitting down at once'),
    },
  ]

  return {
    key: 'sahu',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout, seated),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Sasadu', 'Sasadu'),
    subhead: t(
      `${info.count} bukaan, tidak satu pun sama tingginya · ${seated} orang · tanpa dinding`,
      `${info.count} openings, no two the same height · ${seated} people · no walls`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = bowCounterexample()
  const rows = (w: { highest: number; standing: number }): readonly Readout[] => [
    { label: t('bukaan tertinggi', 'the highest opening'), value: `${(w.highest * 100).toFixed(0)} cm` },
    { label: t('orang dewasa berdiri', 'a standing adult'), value: `${(w.standing * 100).toFixed(0)} cm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Meninggikan bukaan tamu adalah kesopanan biasa yang akan terpikir oleh siapa pun: orang datang membawa hidangan untuk pesta yang dimakan sekampung, dan bukaan yang lebih tinggi lebih mudah dilewati. Tidak ada bagian bangunan yang keberatan — balainya tetap memuat semua orang, bukaannya tetap berbeda-beda berurutan, tetap tidak ada dinding dan tidak ada daun pintu. Yang berhenti benar adalah bahwa semua orang membungkuk. Lewat tinggi orang dewasa berdiri, bukaan tertinggi menjadi bukaan yang dilewati orang dengan tegak — dan gerakan yang tadinya diminta dari semua orang menjadi gerakan yang diminta hanya dari mereka yang bukaannya lebih rendah. Bangunannya tidak menjadi lebih buruk; ia mulai mengatakan hal yang lain.',
      'Raising the guests’ opening is the ordinary courtesy anybody would think of: people arrive carrying dishes for a feast the whole village eats, and a taller opening is easier to get through. No part of the building objects — the hall still holds everybody, the openings still differ in order, there is still no wall and no door leaf. What stops being true is that everybody bows. Past the height of a standing adult the highest opening is one somebody walks through upright, and the gesture that was asked of everyone becomes a gesture asked only of the people whose openings are lower. The building has not got worse; it has started saying something else.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sahu',
    slug: 'sahu',
    house: t('Sasadu', 'Sasadu'),
    people: t('Sahu', 'The Sahu'),
    place: t('Jailolo, Halmahera Barat', 'Jailolo, West Halmahera'),
    about: t(
      'Sasadu adalah balai kampung orang Sahu di Halmahera Barat: terbuka di keempat sisinya, beratap daun sagu yang turun rendah, dengan bangku keliling tempat sekampung duduk makan bersama. Ia punya beberapa bukaan dan tinggi bukaan itu tidak sama; lewat mana seseorang masuk mengikuti siapa dia. Itulah alasan bangunan ini dibangun di sini: tiga puluh dua bangunan sebelumnya menyatakan kedudukan lewat ukuran, letak, jumlah, atau tumpukan sesuatu, dan yang ini menyatakannya dalam sentimeter di atas kepala orang. Hal kedua sama pentingnya: bukaan yang tertinggi pun masih lebih rendah daripada orang berdiri, jadi membungkuk bukan hal yang dituntut dari yang berkedudukan rendah melainkan yang diminta bangunan ini dari semua orang. Matahari pada model ini dihitung untuk Jailolo, 1,08° LU dan 127,48° BT.',
      'A sasadu is the village hall of the Sahu in West Halmahera: open on all four sides, roofed in sago leaf that comes down low, with a bench around it where the village sits down to eat together. It has several openings and they are not the same height; which one a person comes in by follows from who they are. That is why it is here: the thirty-two buildings before it state standing through size, position, count, or a stack of something, and this one states it in centimetres over somebody’s head. The second thing matters as much: even the highest opening is lower than a standing adult, so the bow is not demanded of the low-ranking but asked by the building of everybody. The sun in this model is computed for Jailolo, 1.08° N and 127.48° E.',
    ),
    caution: t(
      'Yang paling perlu diwaspadai pada pak ini adalah angka-angka bukaannya. Bahwa bukaan sasadu berbeda-beda tingginya dan bahwa orang membungkuk masuk disebut sumber; berapa sentimeter selisihnya tidak. Selisih sebelas sentimeter di sini tafsiran penulis, dan seluruh pernyataan pak ini bersandar padanya — pengukuran tiga sasadu akan menyelesaikannya dalam satu pagi. Selain itu: hiasan ukir dan kain yang sesungguhnya jauh lebih banyak daripada dua helai yang dimodelkan; susunan bangku dan siapa duduk di mana disederhanakan; upacara makan adat yang menjadi seluruh maksud bangunan ini tentu tidak dapat dimodelkan; dan pembagian laki-laki, perempuan, dan tamu di sini disusun sebagai urutan sederhana, sedangkan pembagian yang sesungguhnya menyangkut kerabat dan asal yang tidak dapat diwakili oleh tiga atau empat pilihan.',
      'What to distrust most in this pack is the numbers on the openings. That a sasadu’s openings differ in height and that people stoop to come in is what the sources say; how many centimetres apart they are is not. The eleven-centimetre step here is the author’s, and everything this pack claims rests on it — measuring three sasadu would settle it in a morning. Beyond that: the real carving and cloths are far more than the two pieces modelled; the arrangement of the benches and who sits where is simplified; the communal meal that is the whole purpose of the building obviously cannot be modelled; and the division into men, women and guests is laid out here as a simple order, where the real one involves kin and origin that three or four options cannot represent.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin. Yang menentukan letaknya adalah tanah lapang kampung: sasadu berdiri di tengah supaya semua orang mencapainya dari rumah masing-masing. Model ini membentangkan bubungan pada sumbu Z dan menaruh bukaan tamu di ujung −Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule. What places it is the open ground of the village: a sasadu stands in the middle so that everybody reaches it from their own house. This model runs the ridge along Z and puts the guests’ opening at the −Z end. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pasak',
        name: t('Pasak', 'Peg'),
        gloss: t(
          'Pasak kayu, dan kaki tiang duduk pada cekungan di batunya. Tidak ada yang ditanam.',
          'A timber peg, and each post’s foot sits in a hollow in its stone. Nothing is buried.',
        ),
      },
      {
        kind: 'tali',
        name: t('Tali', 'Lashing'),
        gloss: t(
          'Ikatan rotan yang menahan daun sagu dan mengikat kain pada kusen bukaan tamu.',
          'A rattan lashing holding the sago leaf down and tying the cloths to the jambs of the guests’ opening.',
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
