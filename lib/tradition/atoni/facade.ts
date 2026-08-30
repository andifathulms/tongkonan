/**
 * The ume kbubu, as the registry sees it.
 *
 * The twenty-eighth file of this shape. What is new here is not in the
 * contract at all — it is that a roof can have a second job.
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
  dindingInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { smokeCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Four harvests of seed, thatch to the ground, and the lopo beside it. */
const SHOWCASE: Rules = { simpanan: 4, dinding: 'penuh', lopo: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = dindingInfo(rules.dinding)
  const seedTop = layout.loft.y + layout.loft.depth

  const readout: readonly Readout[] = [
    { label: t('Simpanan', 'Harvests kept'), value: String(rules.simpanan) },
    { label: t('Tinggi para', 'Height of the loft'), value: `${layout.loft.y.toFixed(2)} m` },
    { label: t('Puncak benih', 'Top of the seed'), value: `${seedTop.toFixed(2)} m` },
    { label: t('Pita asap', 'The smoke band'), value: `${layout.smoke.from.toFixed(2)}–${layout.smoke.to.toFixed(2)} m` },
    { label: t('Pintu', 'The door'), value: `${(layout.door.height * 100).toFixed(0)} cm` },
    { label: t('Jendela', 'Windows'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'asap',
      title: t('Atap yang harus menahan sesuatu di dalam', 'A roof that has to keep something in'),
      body: t(
        'Dua puluh tujuh atap lain dalam projek ini punya satu tugas: menahan air di luar. Yang ini punya dua. Asap dari api di lantai mengeringkan benih jagung yang tergantung di atasnya, mengusir hama dari dalamnya, dan menjaganya tetap dapat ditanam sampai hujan berikutnya — jadi bangunan ini harus rapat justru terhadap sesuatu yang ada di dalamnya. Tidak ada jendela sama sekali, alang-alangnya turun sampai bawah, dan pintunya dibuat rendah supaya panas dan asap tidak ikut keluar bersama orangnya.',
        'The other twenty-seven roofs in this project have one job: keep the water out. This one has two. The smoke of the floor fire dries the seed maize hanging above it, drives the weevils out of it, and keeps it fit to plant until the next rains — so this building has to be tight against something that is inside it. There is no window at all, the thatch comes down to the bottom, and the door is low so the heat and the smoke do not follow anybody out.',
      ),
      value: t('2', '2'),
      unit: t('tugas untuk satu atap', 'jobs for one roof'),
    },
    {
      key: 'tahun',
      title: t('Ukuran yang berasal dari lamanya waktu', 'A size taken from a length of time'),
      body: t(
        `Dalamnya para ditentukan berapa panen yang disimpan sebuah rumah tangga terhadap tahun yang buruk: ${rules.simpanan} panen setebal ${layout.loft.depth.toFixed(2)} m di sini. Setiap ukuran lain dalam projek ini berasal dari tubuh, ruang, pangkat, rumah tangga, kerumunan, atau apa yang digambarkan sebuah bangunan. Ini satu-satunya yang berasal dari waktu — dan yang diukurnya adalah seberapa jauh ke depan sebuah keluarga bersiap.`,
        `How deep the loft goes is set by how many harvests a household keeps against a bad year: ${rules.simpanan} of them, ${layout.loft.depth.toFixed(2)} m deep here. Every other size in this project comes from a body, a room, a rank, a household, a crowd, or what a building depicts. This is the only one taken from time — and what it measures is how far ahead a family is prepared.`,
      ),
      value: t(String(rules.simpanan), String(rules.simpanan)),
      unit: t('panen di dalam para', 'harvests in the loft'),
    },
    {
      key: 'pintu',
      title: t('Satu pintu, dan berbatas dua arah', 'One door, bounded on both sides'),
      body: t(
        `Bukaannya ${(layout.door.height * 100).toFixed(0)} cm: harus lebih tinggi daripada ${(layout.body.stooping * 100).toFixed(0)} cm supaya orang yang membungkuk dapat lewat, dan lebih rendah daripada ${(layout.body.standing * 100).toFixed(0)} cm supaya ia memang harus membungkuk. Semua pemeriksaan lain dalam projek ini berbatas satu arah — cukup panjang, cukup tebal, jangan terlalu jauh. Yang ini punya batas di kedua sisi dan keduanya sama pentingnya.`,
        `The opening is ${(layout.door.height * 100).toFixed(0)} cm: it has to be taller than ${(layout.body.stooping * 100).toFixed(0)} cm so a stooping adult gets through, and lower than ${(layout.body.standing * 100).toFixed(0)} cm so they have to stoop. Every other check in this project is bounded on one side — long enough, thick enough, not too far. This one has a bound on each side and both of them matter.`,
      ),
      value: t(`${(layout.door.height * 100).toFixed(0)}`, `${(layout.door.height * 100).toFixed(0)}`),
      unit: t('cm, di antara dua tubuh', 'cm, between two bodies'),
    },
    {
      key: 'lopo',
      title: t('Dan di halaman yang sama, kebalikannya', 'And in the same yard, its opposite'),
      body: t(
        'Lopo berdiri beberapa meter dari pintunya: bundar, di atas tiang, tanpa dinding sama sekali, beratap kerucut, dengan lumbungnya sendiri di bawahnya. Orang yang sama, jagung yang sama, tahap yang berbeda — yang satu untuk mengeringkan di udara terbuka, yang satu untuk menyimpan di dalam asap. Keduanya bundar dan beratap kerucut, dan itulah bantahan paling ringkas terhadap anggapan bahwa bentuk menentukan maksud. Honai Dani dan mbaru niang Manggarai sudah menunjukkan hal yang sama dengan jarak seribu kilometer; ini menunjukkannya dalam satu halaman.',
        'The lopo stands a few metres from the door: round, on posts, with no walls at all, under a cone, with its own store beneath it. The same people, the same maize, a different stage — one for drying in open air, one for keeping in smoke. Both are round and both are under a cone, and that is the shortest possible refutation of the idea that a form settles a purpose. The Dani honai and the Manggarai mbaru niang made the same point a thousand kilometres apart; this makes it in one yard.',
      ),
      value: t('2', '2'),
      unit: t('bangunan bundar, maksud berlawanan', 'round buildings, opposite purposes'),
    },
    {
      key: 'honai',
      title: t('Bukan honai, dan bedanya bukan bentuknya', 'Not a honai, and the difference is not the shape'),
      body: t(
        `${info.glossId} Honai Dani juga bundar, juga beratap sampai tanah, juga gelap, juga berapi. Yang memisahkan keduanya adalah maksud asapnya: api honai menjawab malam yang dingin di ketinggian enam belas ratus meter, dan loteng di atasnya tempat orang tidur. Di sini api menjawab busuk dan hama, dan yang di atasnya adalah benih. Honai adalah ruang dengan api di dalamnya; ume kbubu adalah lumbung dengan api di bawahnya dan orang di sela-selanya.`,
        `${info.glossEn} The Dani honai is also round, also thatched to the ground, also dark, also has a fire. What separates them is what the smoke is for: a honai’s fire answers cold nights at sixteen hundred metres and the loft above it is where people sleep. Here the fire answers rot and insects, and what is above it is seed. A honai is a room with a fire in it; an ume kbubu is a store with a fire under it and people in the gap.`,
      ),
      value: t('0', '0'),
      unit: t('meter kolong: lantainya tanah, seperti honai', 'm of clearance: the floor is the ground, as in a honai'),
    },
  ]

  return {
    key: 'atoni',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Ume kbubu', 'Ume kbubu'),
    subhead: t(
      `${rules.simpanan} panen di dalam asap · satu pintu · tanpa jendela`,
      `${rules.simpanan} harvests in the smoke · one door · no window`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = smokeCounterexample()
  const rows = (w: { seedTop: number; smokeTop: number }): readonly Readout[] => [
    { label: t('puncak benih', 'top of the seed'), value: `${w.seedTop.toFixed(2)} m` },
    { label: t('batas atas asap', 'top of the smoke'), value: `${w.smokeTop.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Menaikkan para adalah hal pertama yang akan dilakukan siapa pun. Api di lantai tanah di bawah anyaman bambu yang digantungi jagung kering memang sebahaya kedengarannya, dan menjauhkan benih dari nyala memberi ruang kepala, ruang kerja, dan satu kekhawatiran lebih sedikit. Tidak ada bagian bangunan yang keberatan: kubahnya tetap, pintunya tetap membuat orang membungkuk, tetap tidak ada jendela, paranya tetap dipikul rangka yang sama. Yang gagal adalah benihnya — lewat satu titik, asap yang sampai ke bagian atas simpanan sudah terlalu dingin dan terlalu encer untuk mengawetkan apa pun, dan lumbung yang di luar jangkauan asap adalah lumbung berisi jagung yang membusuk sebelum musim hujan.',
      'Raising the loft is the first thing anybody would do. A fire on an earth floor under a bamboo platform hung with dry maize is exactly as dangerous as it sounds, and lifting the seed away from the flame gives headroom, room to work, and one less thing to worry about. No part of the building objects: the dome is unchanged, the door still makes you stoop, there is still no window, the loft is still carried by the frame that carried it before. What fails is the seed — past a point the smoke reaching the top of the store is too cool and too thin to cure anything, and a store out of its reach is a store of maize that rots before the rains.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'atoni',
    slug: 'atoni',
    house: t('Ume kbubu', 'Ume kbubu'),
    people: t('Atoni', 'The Atoni'),
    place: t('Soe dan Kapan, Timor Tengah Selatan', 'Soe and Kapan, South Central Timor'),
    about: t(
      'Ume kbubu adalah rumah bundar di perbukitan Timor Tengah Selatan: kubah alang-alang yang turun sampai tanah, satu pintu yang harus dilewati sambil membungkuk, tanpa jendela sama sekali, api di lantai, dan para di atasnya tempat benih jagung digantung. Asapnyalah maksudnya — ia mengeringkan benih, mengusir hama, dan menjaganya tetap dapat ditanam sampai hujan berikutnya. Jadi ini satu-satunya bangunan dalam kumpulan ini yang atapnya punya tugas kedua: dua puluh tujuh yang lain hanya perlu menahan air di luar, yang ini juga harus menahan asap di dalam. Dua hal lain membuatnya layak dibangun di sini: dalamnya para ditentukan berapa panen yang disimpan sebuah rumah tangga — satu-satunya ukuran dalam projek ini yang berasal dari lamanya waktu — dan di halaman yang sama berdiri lopo, bangunan bundar terbuka tanpa dinding, kebalikannya persis. Matahari pada model ini dihitung untuk Soe, 9,86° LS dan 124,28° BT: titik paling selatan dalam kumpulan ini.',
      'An ume kbubu is a round house in the hills of South Central Timor: a dome of thatch down to the ground, one door a person has to stoop through, no window at all, a fire on the floor, and a loft above it where the seed maize hangs. The smoke is the point — it dries the seed, drives out the weevils, and keeps it fit to plant until the next rains. So this is the only building in the collection whose roof has a second job: the other twenty-seven only have to keep water out, and this one also has to keep smoke in. Two more things make it worth building here: the depth of the loft is set by how many harvests a household keeps — the only dimension in this project taken from a length of time — and in the same yard stands the lopo, a round open building with no walls at all, its exact opposite. The sun in this model is computed for Soe, 9.86° S and 124.28° E: the southernmost site in the collection.',
    ),
    caution: t(
      'Yang paling penting dari bangunan ini adalah apinya, dan api tidak dapat dimodelkan di sini: yang digambar hanya lingkar batunya. Pita asap yang menjadi dasar seluruh pemeriksaan pak ini adalah penetapan penulis dan bukan hasil pengukuran — tidak ada gambar ukur yang dapat menyelesaikannya, sebab yang menentukan bukan ukuran bangunan melainkan apa yang terjadi pada benih setelah satu musim. Selain itu: lopo dibangun sebagai bentuk pokoknya saja, tanpa lumbung bertingkat dan penghalang tikus yang biasa ada padanya; ume kbubu sesungguhnya berbeda-beda antar wilayah dan yang dibangun di sini bentuk umumnya; jagungnya sendiri dinyatakan sebagai satu ketebalan, bukan tongkol demi tongkol; dan tidak satu pun angka di sini berasal dari pengukuran, meskipun ribuan bangunan ini masih berdiri dan masih dibangun orang.',
      'The most important thing about this building is its fire, and a fire cannot be modelled here: what is drawn is the ring of stones. The smoke band the whole pack’s checks rest on is the author’s and not a measurement — no measured drawing could settle it, because what decides it is not a dimension of the building but what happens to the seed after a season. Beyond that: the lopo is built as its bare form, without the stepped store and the rat guard it usually carries; real ume kbubu differ from district to district and what is built here is the common form; the maize itself is stated as one depth rather than cob by cob; and not one figure here comes from a measurement, though thousands of these stand and are still being built.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin dalam pak ini. Yang menentukan letak pintu adalah halaman dan lopo di seberangnya, bukan arah. Model ini menaruh pintunya di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule in this pack. What places the door is the yard and the lopo across it rather than a direction. This model puts the door on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tali',
        name: t('Tali', 'Lashing'),
        gloss: t(
          'Ikatan bambu belah atau serat. Hampir semua sambungan di sini ikatan, termasuk yang menahan para tempat benih tergantung.',
          'A lashing of split bamboo or fibre. Nearly every joint here is one, including the one holding the loft the seed hangs in.',
        ),
      },
      {
        kind: 'cabang',
        name: t('Cabang', 'Fork'),
        gloss: t(
          'Usuk dijatuhkan ke cabang di kepala tiang tengah. Bentuk sambungannya ditentukan pohonnya, bukan tukangnya — seperti pada rumah Korowai, dan di sini pohonnya sudah ditebang.',
          'A rafter dropped into the fork at the head of the centre post. The shape of the joint was decided by the tree rather than by the builder — as in the Korowai house, except that here the tree has been felled.',
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
