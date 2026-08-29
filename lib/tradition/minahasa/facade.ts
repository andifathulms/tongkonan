/**
 * The woloan house, as the registry sees it.
 *
 * The seventeenth file of this shape, and the first for a building the
 * registry could in principle be handed twice — the same house, at two
 * addresses, a year apart.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { partBounds, runInvariants } from './invariants'
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
  tanggaInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { haulCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The longest house, one stair, and cut to the building rather than the road. */
const SHOWCASE: Rules = { ruang: 7, tangga: 'satu', pindah: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = tanggaInfo(rules.tangga)
  let longest = 0
  for (const part of house.parts) {
    if (part.stage === 'atap' || part.stage === 'batu') continue
    const b = partBounds(part)
    longest = Math.max(longest, b.max[0] - b.min[0], b.max[1] - b.min[1], b.max[2] - b.min[2])
  }
  const pieces = house.parts.filter((p) => p.stage !== 'batu').length

  const readout: readonly Readout[] = [
    { label: t('Ruang', 'Bays'), value: String(rules.ruang) },
    { label: t('Panjang', 'Length'), value: `${layout.length.toFixed(1)} m` },
    { label: t('Batang terpanjang', 'Longest piece'), value: `${longest.toFixed(2)} m` },
    { label: t('Yang diizinkan jalan', 'What the road allows'), value: `${layout.haulLength.toFixed(2)} m` },
    { label: t('Bagian yang ikut pindah', 'Parts that travel'), value: String(pieces) },
    { label: t('Tangga', 'Stairs'), value: String(info.count) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'pindah',
      title: t('Rumah ini dibuat untuk dibongkar', 'This house is made to be taken apart'),
      body: t(
        'Enam belas bangunan lain dalam projek ini didirikan di tempat ia akan berdiri dan tinggal di situ; membongkarnya berarti merusaknya. Di sekitar Woloan dan Tomohon, rumah kayu dijual utuh: dinomori, dilepas pasaknya, diangkut lewat jalan, dan didirikan kembali di tempat lain. Itu fakta sosial dalam pengertian yang sama seperti pangkat — ia menyatakan sebuah rumah itu *apa* bagi orang yang membangunnya, dan di sini rumah adalah barang yang dapat berpindah tangan dan tempat.',
        'The other sixteen buildings in this project are raised where they will stand and stay there; taking one down means destroying it. Around Woloan and Tomohon, timber houses are sold whole: numbered, unpegged, carried away by road, and put up again somewhere else. That is a social fact in the same sense a rank is — it says what a house *is* to the people who build it, and here a house is property that can change hands and places.',
      ),
      value: t(String(pieces), String(pieces)),
      unit: t('bagian yang ikut pindah', 'parts that travel'),
    },
    {
      key: 'mundur',
      title: t('Urutan yang dapat dijalankan mundur', 'A sequence that runs backwards'),
      body: t(
        'Setiap pak dalam projek ini diperiksa apakah bangunannya dapat berdiri: tiap bagian, ketika dipasang, harus menemukan sesuatu di bawahnya. Yang ini diperiksa dengan pertanyaan yang sama dibalik — tiap bagian, ketika dilepas, tidak boleh sedang menahan apa pun. Rumah yang hanya dapat dirobohkan lulus pemeriksaan pertama dan gagal pada yang kedua, dan sampai bangunan ini ada, tidak satu pun bagian projek ini dapat membedakan keduanya.',
        'Every pack in this project is checked for whether its building can stand: each part, when placed, has to find something beneath it. This one is checked by the same question in reverse — each part, when removed, may not still be carrying anything. A house that can only be demolished passes the first check and fails the second, and until this building existed nothing in the project could tell the two apart.',
      ),
      value: t(String(house.parts.length), String(house.parts.length)),
      unit: t('bagian, dilepas satu per satu', 'parts, taken off one at a time'),
    },
    {
      key: 'jalan',
      title: t('Dibatasi oleh sebuah jalan', 'Limited by a road'),
      body: t(
        `Tidak ada batang yang lebih panjang daripada yang dapat diangkat beberapa orang dan diangkut: ${longest.toFixed(2)} m di sini, terhadap ${layout.haulLength.toFixed(2)} m yang diizinkan. Tongkonan dibatasi pangkat, saoraja dibatasi apa yang boleh diakui rumah tangganya, honai dibatasi satu malam yang dingin. Yang ini dibatasi oleh perjalanan yang akan ditempuhnya — dan itu satu-satunya angka dalam projek ini yang bukan tentang bangunan, penghuni, atau tempatnya.`,
        `No member is longer than what a few people can lift and a road can take: ${longest.toFixed(2)} m here against the ${layout.haulLength.toFixed(2)} m allowed. A tongkonan is bounded by rank, a saoraja by what a household may claim, a honai by one cold night. This one is bounded by the journey it will make — and that is the only figure in this project which is not about the building, the people, or the place.`,
      ),
      value: t(longest.toFixed(2), longest.toFixed(2)),
      unit: t('m, batang terpanjang', 'm, the longest piece'),
    },
    {
      key: 'batu',
      title: t('Yang tertinggal adalah denah dari batu', 'What stays behind is a plan in stone'),
      body: t(
        'Batu alasnya bagian dari tanahnya, bukan bagian dari rumahnya. Ketika rumahnya berangkat, yang tersisa di tapak itu adalah susunan batu pada posisi tiangnya — sebuah denah ukuran penuh dari bangunan yang sudah tidak ada. Ini satu-satunya bangunan di sini yang punya bagian yang sengaja tidak ikut.',
        'The pad stones belong to the site rather than to the building. When the house leaves, what remains is the stones in the pattern of the posts — a full-size plan of a building that is no longer there. This is the only building here with a part that deliberately does not come.',
      ),
      value: t(
        String(house.parts.filter((p) => p.stage === 'batu').length),
        String(house.parts.filter((p) => p.stage === 'batu').length),
      ),
      unit: t('batu yang tinggal', 'stones that stay'),
    },
    {
      key: 'tangga',
      title: t('Dua tangga, dan karena itu tidak ada pintu utama', 'Two stairs, and therefore no main door'),
      body: t(
        `${info.glossId} Aturannya kecil dan akibatnya tidak: sebuah rumah dengan dua cara masuk yang setara tidak punya muka tunggal untuk didatangi, dan tamu tidak diarahkan ke satu titik. Bandingkan rumah limas Palembang, yang seluruh muka depannya adalah satu urutan menuju satu tangga.`,
        `${info.glossEn} The rule is small and its consequence is not: a house with two equal ways in has no single face to be approached at, and a visitor is not funnelled to one point. Set it against the Palembang rumah limas, whose whole front is one sequence leading to one stair.`,
      ),
      value: t(String(info.count), String(info.count)),
      unit: t('cara masuk yang setara', 'equal ways in'),
    },
  ]

  return {
    key: 'minahasa',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumah woloan', 'Rumah woloan'),
    subhead: t(
      `${rules.ruang} ruang · ${layout.length.toFixed(1)} m · ${rules.pindah ? 'dapat dibongkar' : 'dipaku ke tempatnya'}`,
      `${rules.ruang} bays · ${layout.length.toFixed(1)} m · ${rules.pindah ? 'built to be moved' : 'cut to stay'}`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = haulCounterexample()
  const rows = (w: { longest: number; allowed: number }): readonly Readout[] => [
    { label: t('batang terpanjang', 'longest piece'), value: `${w.longest.toFixed(2)} m` },
    { label: t('yang diizinkan jalan', 'what the road allows'), value: `${w.allowed.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Lebarkan rumahnya dan menurut ukuran biasa mana pun ia menjadi lebih baik: lebih lapang, rangka yang sama, sambungan yang sama, atap yang sama. Yang berhenti benar hanyalah bahwa gelagarnya muat di atas truk — dan rumah woloan yang tidak dapat diangkut adalah rumah woloan yang berhenti menjadi rumah woloan. Tujuh belas bangunan, tujuh belas aturan yang tidak dapat dilaksanakan, dan hanya yang ini yang gagal pada kemampuannya untuk pergi.',
      'Widen the house and by every ordinary measure it improves: more room, the same frame, the same joints, the same roof. The only thing that stops being true is that its bearers fit on a lorry — and a woloan house that cannot be carried away is a woloan house that has stopped being one. Seventeen buildings, seventeen rules that cannot be carried out, and only this one fails at its ability to leave.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'minahasa',
    slug: 'minahasa',
    house: t('Rumah woloan', 'Rumah woloan'),
    people: t('Minahasa', 'The Minahasa'),
    place: t('Woloan, Tomohon, Sulawesi Utara', 'Woloan, Tomohon, North Sulawesi'),
    about: t(
      'Rumah kayu Minahasa adalah rumah panggung bersambung pasak, dan di sekitar Woloan ia adalah barang dagangan: dibuat untuk dijual utuh, dibongkar, diangkut lewat jalan, dan didirikan kembali di tempat lain. Yang membuatnya layak dibangun di sini adalah bahwa ia satu-satunya bangunan dalam projek ini yang harus dapat *dibongkar*. Akibatnya dapat diperiksa: tidak ada batang yang lebih panjang daripada yang dapat diangkut, dan urutan yang mendirikannya harus dapat dijalankan mundur. Matahari pada model ini dihitung untuk Tomohon, 1,33° LU dan 124,84° BT — tapak kedua di utara khatulistiwa dalam kumpulan ini.',
      'The Minahasa timber house is a pegged, raised house, and around Woloan it is a commodity: built to be sold whole, dismantled, carried by road, and re-erected somewhere else. What makes it worth building here is that it is the only building in this project which must be able to *come apart*. The consequences are checkable: no member is longer than what can be carried, and the sequence that raises it has to run backwards. The sun in this model is computed for Tomohon, 1.33° N and 124.84° E — the second site north of the equator in this collection.',
    ),
    caution: t(
      'Yang dimodelkan di sini adalah rangka dan susunannya, bukan wajahnya. Rumah Minahasa yang sesungguhnya membawa ukiran pada papan tepi, tiang serambi berprofil, jendela berdaun ganda, dan pagar serambi yang dikerjakan dengan hati-hati; tidak satu pun ada di sini, dengan alasan yang sama seperti rumah-rumah lain. Perdagangan rumah bongkar-pasang itu sendiri sebagian besar berumur seabad terakhir, sedangkan sambungan pasak dan panggungnya jauh lebih tua — model ini menyatakan keduanya sekaligus tanpa memisahkan mana yang lama dan mana yang baru. Dan tidak satu pun angka di sini berasal dari pengukuran, termasuk panjang muatan yang seluruh bangunannya diukur terhadapnya.',
      'What is modelled here is the frame and how it goes together, not its face. A real Minahasa house carries carved bargeboards, turned veranda posts, double-leaf windows and a carefully made veranda rail; none of that is here, for the reason the other houses give. The knock-down trade itself is largely of the last century, while the pegged joinery and the raised floor are far older — this model states both at once without separating the old from the new. And not one figure here comes from a measurement, the haul length the whole building is measured against included.',
    ),
    orientation: t(
      'Muka rumah adalah sisi serambinya, dan serambi menghadap jalan — yang di sini bukan hanya arah pandang: jalan itulah yang akan membawanya pergi. Kendalanya bersifat hubungan seperti pada rumah gadang dan rumah betang, dan yang dihadapi bukan lumbung atau sungai melainkan sebuah rute. Model ini menaruh serambi di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The front is the veranda side, and the veranda faces the road — which here is not only an aspect: the road is what will take it away. The constraint is relational as on the rumah gadang and the betang, and what is faced is neither a granary nor a river but a route. This model puts the veranda on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t(
          'Satu-satunya jenis sambungan di sini, dan itu bukan kekurangan melainkan seluruh alasannya: pasak adalah sambungan yang dapat dikeluarkan lagi. Tidak ada yang dipaku, dilem, atau ditakik sedemikian rupa sehingga membukanya merusaknya.',
          'The only joint kind here, and that is not a shortfall but the entire argument: a peg is a joint that can be taken out again. Nothing is nailed, glued, or notched so that undoing it breaks it.',
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
