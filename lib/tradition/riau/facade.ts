/**
 * The balai, as the registry sees it.
 *
 * The thirty-fourth file of this shape, and the first whose floor steps down.
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
  anjungInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { stepCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A long hall with an anjung at each end and the rear deck built. */
const SHOWCASE: Rules = { ruang: 7, anjung: 'dua', pelantar: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = anjungInfo(rules.anjung)
  const aisleY = layout.aisles[0]?.floorY ?? layout.middle.floorY

  const readout: readonly Readout[] = [
    { label: t('Ruang', 'Bays'), value: String(rules.ruang) },
    { label: t('Jatuh selaso', 'The fall of the aisle'), value: `${(layout.drop.fall * 100).toFixed(0)} cm` },
    { label: t('Batas satu langkah', 'A single step'), value: `${(layout.drop.step * 100).toFixed(0)} cm` },
    { label: t('Lebar selaso', 'Width of an aisle'), value: `${((layout.aisles[0]?.halfX ?? 0) * 2).toFixed(2)} m` },
    { label: t('Anjung', 'Anjung'), value: String(info.count) },
    { label: t('Lantai', 'Floor levels'), value: String(info.count > 0 ? 3 : 2) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'jatuh',
      title: t('Satu-satunya lantai di sini yang berjenjang ke bawah', 'The only floor here that steps down'),
      body: t(
        `Selaso di kedua sisi jatuh ${(layout.drop.fall * 100).toFixed(0)} cm di bawah lantai tengah. Tiap lantai berjenjang lain dalam kumpulan ini dinaikkan, dan yang dinyatakannya selalu tentang orang: rumah limas mendudukkan tamu pada jenjang yang sesuai kedudukannya, rumah gadang menaikkan anjuang menurut laras yang dianut rumah tangganya, malige Buton menaikkan tingkat untuk sultannya. Yang ini menurunkan lantai untuk menyatakan sesuatu tentang kegiatan — lewat bukan hadir — dan karena itu jalan lewatnya tidak sedatar ruangnya.`,
        `The selaso on both sides fall ${(layout.drop.fall * 100).toFixed(0)} cm below the middle floor. Every other stepped floor in this collection is raised, and what it states is always about a person: a rumah limas seats a guest on the step that matches their standing, a rumah gadang raises an anjuang according to its household’s laras, a Buton malige lifts a storey for its sultan. This one lowers a floor to say something about an activity — passing through is not being present — and so the way through is not on the level of the room.`,
      ),
      value: t(`${(layout.drop.fall * 100).toFixed(0)}`, `${(layout.drop.fall * 100).toFixed(0)}`),
      unit: t('cm ke bawah, bukan ke atas', 'cm down, rather than up'),
    },
    {
      key: 'kembar',
      title: t('Kembar berarti keduanya sama', 'Kembar means the two are alike'),
      body: t(
        `Dua selaso, sama lebar dan sama dalam jatuhnya, di kedua sisi ruang tengah. Itulah arti kata kembar pada namanya, dan balai dengan satu selaso — atau dengan dua yang berbeda tinggi — adalah bangunan lain dengan nama lain. Di sini simetri bukan kerapian melainkan bagian dari namanya.`,
        `Two selaso, the same width and the same fall, on both sides of the middle room. That is what kembar in its name means, and a hall with one selaso — or with two at different levels — is a different building with a different name. Here symmetry is not tidiness but part of what the thing is called.`,
      ),
      value: t('2', '2'),
      unit: t('selaso, dan keduanya sama', 'aisles, and they match'),
    },
    {
      key: 'langkah',
      title: t('Satu tapak, dan batasnya ada pada tubuh', 'One step, and its limit is in a body'),
      body: t(
        `Jatuhnya ${(layout.drop.fall * 100).toFixed(0)} cm terhadap ${(layout.drop.step * 100).toFixed(0)} cm yang masih dapat dilangkahi orang tanpa berpikir. Orang menyeberangi tepi itu berkali-kali dalam satu pertemuan — membawa hidangan masuk, duduk, berdiri hendak pulang, keluar berbicara — jadi jatuh yang terlalu dalam bukan pernyataan yang lebih tegas melainkan balai yang selasonya berhenti menjadi jalan lewat. Yang satu angka adat dan yang satu angka tubuh, dan tidak ada yang menghubungkan keduanya.`,
        `A ${(layout.drop.fall * 100).toFixed(0)} cm fall against the ${(layout.drop.step * 100).toFixed(0)} cm a person crosses without thinking about it. People cross that edge many times in a single meeting — carrying food in, sitting down, getting up to leave, stepping out to talk — so too deep a fall is not a firmer statement but a hall whose aisles have stopped being the way through. One figure belongs to the custom and the other to the body, and nothing relates them.`,
      ),
      value: t(`${((layout.drop.step - layout.drop.fall) * 100).toFixed(0)}`, `${((layout.drop.step - layout.drop.fall) * 100).toFixed(0)}`),
      unit: t('cm tersisa sebelum menjadi tangga', 'cm left before it becomes a stair'),
    },
    {
      key: 'lewat',
      title: t('Dapat dilalui tanpa dimasuki', 'It can be walked without being entered'),
      body: t(
        `Kedua selaso lapang sepanjang ${(layout.middle.halfZ * 2).toFixed(1)} m dengan hanya pagar rendah di tepi luarnya, jadi orang dapat menyusuri seluruh panjang balai tanpa sekali pun menginjak ruang tengahnya. Inilah sisi yang dapat diukur dari lantai yang jatuh itu: bukan bahwa orang dilarang masuk, melainkan bahwa ada cara untuk lewat tanpa harus masuk.`,
        `Both selaso run clear for ${(layout.middle.halfZ * 2).toFixed(1)} m with only a low rail on their outer edge, so somebody can walk the whole length of the hall without once setting foot in the middle room. This is the measurable half of the fallen floor: not that anybody is kept out, but that there is a way past that is not a way in.`,
      ),
      value: t((layout.middle.halfZ * 2).toFixed(1), (layout.middle.halfZ * 2).toFixed(1)),
      unit: t('m jalan lewat, di kedua sisi', 'm of way through, on each side'),
    },
    {
      key: 'anjung',
      title: t('Dan yang dinaikkan hanya di ujung', 'And what is raised is raised only at the ends'),
      body: t(
        `${info.glossId} Lantai ruang tengahnya sendiri tetap satu bidang: menaikkan lantai di dalam ruang akan menjadi pernyataan rumah limas — bahwa tempat duduk seseorang adalah kedudukannya — dan bangunan ini tidak membuat pernyataan itu. Yang dinaikkan berada di luar ruangnya, dan yang dinyatakannya tempat orang pada satu peristiwa, bukan kedudukan yang berlaku terus.`,
        `${info.glossEn} The middle floor itself stays one plane: raising a floor inside the room would be the rumah limas’s claim — that where somebody sits is their standing — and this building does not make it. What is raised sits outside the room, and what it states is where people are on one occasion rather than a standing that holds.`,
      ),
      value: t(String(info.count), String(info.count)),
      unit: t('anjung, di luar ruang tengah', 'anjung, outside the middle room'),
    },
  ]

  return {
    key: 'riau',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Balai selaso jatuh kembar', 'Balai selaso jatuh kembar'),
    subhead: t(
      `dua selaso jatuh ${(layout.drop.fall * 100).toFixed(0)} cm · ${rules.ruang} ruang · lewat tanpa masuk`,
      `two aisles fallen ${(layout.drop.fall * 100).toFixed(0)} cm · ${rules.ruang} bays · a way past that is not a way in`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = stepCounterexample()
  const rows = (w: { fall: number; step: number }): readonly Readout[] => [
    { label: t('jatuhnya lantai', 'the fall of the floor'), value: `${(w.fall * 100).toFixed(0)} cm` },
    { label: t('satu langkah', 'a single step'), value: `${(w.step * 100).toFixed(0)} cm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Menurunkan selaso lebih dalam adalah cara yang paling langsung untuk membuat bangunan ini mengatakan maksudnya lebih jelas: perbedaan antara lewat dan hadir adalah seluruh isi denahnya, dan jatuh yang lebih dalam menyatakannya dari jauh. Tidak ada bagian bangunan yang keberatan — kedua selaso tetap kembar, tetap lapang dari ujung ke ujung, atapnya tetap menutupi ketiga lantai. Yang habis adalah langkahnya. Orang menyeberangi tepi itu berkali-kali dalam satu pertemuan, dan lewat satu titik ia bukan lagi sesuatu yang dilangkahi tanpa berpikir — sehingga balai yang pernyataannya paling tegas justru menjadi balai yang selasonya berhenti dipakai orang untuk lewat.',
      'Dropping the selaso further is the most direct way to make this building say what it means more clearly: the difference between passing through and being present is the whole content of the plan, and a deeper fall states it from further away. No part of the building objects — the two aisles are still twins, still clear end to end, the roof still covers all three floors. What runs out is the step. People cross that edge many times in one meeting, and past a point it is no longer something crossed without thinking — so the hall that states its point most firmly is the hall whose aisles people stop using as the way through.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'riau',
    slug: 'riau',
    house: t('Balai selaso jatuh kembar', 'Balai selaso jatuh kembar'),
    people: t('Melayu Riau', 'The Riau Malay'),
    place: t('Siak Sri Indrapura, Riau', 'Siak Sri Indrapura, Riau'),
    about: t(
      'Balai selaso jatuh kembar adalah balai musyawarah Melayu Riau: lantai tengah tempat orang duduk, dan di kedua sisinya selaso — serambi memanjang yang lantainya jatuh satu tapak di bawahnya. Kembar, sebab keduanya ada dan keduanya sama. Yang membuatnya layak dibangun di sini adalah arah jenjangnya. Tiap lantai berjenjang lain dalam kumpulan ini dinaikkan, dan yang dinyatakannya tentang orang: tempat duduk tamu pada rumah limas, laras pada rumah gadang, tingkat sultan pada malige. Yang ini justru diturunkan, dan yang dinyatakannya tentang kegiatan — orang dapat menyusuri seluruh panjang balai tanpa sekali pun menginjak ruangnya, sebab lewat bukan hadir. Matahari pada model ini dihitung untuk Siak Sri Indrapura, 0,79° LU dan 102,05° BT.',
      'A balai selaso jatuh kembar is a Riau Malay council hall: a middle floor where people sit, and along each side a selaso — a long aisle whose floor has fallen a step below it. Kembar, because there are two of them and they match. What makes it worth building here is the direction of its step. Every other stepped floor in this collection is raised, and what it states is about a person: where a guest sits in a rumah limas, which laras a rumah gadang follows, which storey a sultan takes in a malige. This one is lowered, and what it states is about an activity — somebody can walk the whole length of the hall without once setting foot in its room, because passing through is not being present. The sun in this model is computed for Siak Sri Indrapura, 0.79° N and 102.05° E.',
    ),
    caution: t(
      'Ukiran adalah bagian besar dari balai Melayu dan hampir seluruhnya tidak ada di sini: selembayung di ujung bubungan dibangun sebagai batang polos, sedangkan justru ukirannya yang menjadikannya selembayung; lebah bergantung, singap, dan ragam hias pada dinding dan pagar tidak dimodelkan sama sekali. Selain itu: dalamnya jatuh selaso adalah angka penulis, dan seluruh pernyataan pak ini bersandar padanya — satu pengukuran pada satu balai akan menyelesaikannya; pembagian ruang tengah dan aturan tempat duduk pada musyawarah tidak dibangun; bentuk atap Melayu bermacam-macam (lipat kajang, lontik, limas) dan yang dibangun di sini satu bentuk saja; dan balai semacam ini kini banyak berdiri sebagai bangunan resmi provinsi, yang bukan hal yang sama dengan balai negeri yang dipakai bermusyawarah.',
      'Carving is a large part of a Malay balai and almost none of it is here: the selembayung at the ends of the ridge are built as plain members, when it is the carving that makes them selembayung; the lebah bergantung, the singap and the ornament on walls and rails are not modelled at all. Beyond that: the depth of the fall is the author’s figure and everything this pack claims rests on it — one measurement of one hall would settle it; the divisions of the middle room and the rules about where people sit at a musyawarah are not built; Malay roof forms vary (lipat kajang, lontik, limas) and only one is built here; and halls of this kind now often stand as official provincial buildings, which is not the same thing as a negeri’s hall used for meeting in.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin dalam pak ini. Yang menempatkan balai adalah negeri dan sungainya: ia berdiri di tempat yang dapat dicapai semua orang, menghadap air. Model ini membentangkan bubungan pada sumbu Z dan menaruh sisi sungai di −Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule in this pack. What places a balai is the negeri and its river: it stands where everybody can reach it, facing the water. This model runs the ridge along Z and puts the river side at −Z. There is still no control that turns the building.',
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
        kind: 'baji',
        name: t('Baji', 'Wedge'),
        gloss: t(
          'Baji yang mengikat gelagar selaso pada tiang yang memikulnya. Karena lantainya jatuh lebih dalam daripada tinggi gelagar, kedua lantai itu tidak pernah bersentuhan — jadi yang menahan selaso adalah tiangnya, bukan lantai tengahnya.',
          'The wedge tying an aisle bearer to the post carrying it. Because the floor falls further than a bearer is deep, the two floors never touch — so what holds a selaso up is its post rather than the middle floor.',
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
