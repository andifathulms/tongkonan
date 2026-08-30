/**
 * The pairs, as the registry sees it.
 *
 * The twenty-seventh file of this shape, and the one that asked the registry
 * the last question it had left: not how many buildings a `Built` contains —
 * the tanean answered that — but whether the thing it contains has to be one
 * *kind* of thing. It does not.
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
  tinggiInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { openingCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Five clans, tall posts, and the stone platforms raised. */
const SHOWCASE: Rules = { pasangan: 5, tinggi: 'tinggi', ture: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = tinggiInfo(rules.tinggi)
  const pair = layout.pairs[0]

  const readout: readonly Readout[] = [
    { label: t('Pasangan', 'Pairs'), value: String(rules.pasangan) },
    { label: t('Tinggi tiang', 'Height of the post'), value: `${(pair?.ngadhu.postTop ?? 0).toFixed(2)} m` },
    { label: t('Tertanam', 'Planted'), value: `${DIMS.ngadhuPlanted.value.toFixed(2)} m` },
    { label: t('Lebar bhaga', 'Width of the bhaga'), value: `${((pair?.bhaga.halfZ ?? 0) * 2).toFixed(2)} m` },
    { label: t('Bukaan', 'The opening'), value: `${(layout.opening.width * 100).toFixed(0)} × ${(layout.opening.height * 100).toFixed(0)} cm` },
    { label: t('Orang yang berteduh', 'People sheltered'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'pasangan',
      title: t('Dua benda, satu pernyataan', 'Two objects, one statement'),
      body: t(
        `Ngadhu adalah leluhur laki-laki sebuah klan dan bhaga leluhur perempuannya, dan satu klan memiliki keduanya. Dua puluh enam entri sebelum ini adalah satu benda — satu rumah, satu makam, satu perahu, satu menara, dan satu kali satu kelompok rumah mengelilingi satu halaman. Yang ini dua benda yang berlainan jenis dan tidak berarti sendiri-sendiri: tiang tanpa rumah kecilnya bukan pernyataan yang lebih kecil melainkan pernyataan yang belum utuh. Sekarang: ${rules.pasangan} pasangan, satu untuk tiap klan.`,
        `A ngadhu is a clan’s male ancestor and a bhaga its female one, and a clan has both. The twenty-six entries before this are one object each — a house, a tomb, a boat, a tower, and once a cluster of houses around a yard. This is two objects of different kinds that mean nothing separately: a post without its little house is not a smaller statement but an unfinished one. Currently: ${rules.pasangan} pairs, one to a clan.`,
      ),
      value: t(String(rules.pasangan * 2), String(rules.pasangan * 2)),
      unit: t('benda, dalam pasangan', 'objects, in pairs'),
    },
    {
      key: 'model',
      title: t('Sebuah rumah pada ukuran yang tidak dapat dimasuki', 'A house at a size nobody can enter'),
      body: t(
        `Bhaga adalah rumah yang dibuat kecil, dan ukurannya berasal dari apa yang digambarkannya, bukan dari apa yang ditampungnya — satu-satunya ukuran semacam itu dalam projek ini. Semua yang lain berasal dari tubuh, ruang, pangkat, rumah tangga, atau kerumunan. Karena itu pak ini menyatakan ukuran tubuh manusia dan mengharuskan bangunannya kalah: bukaannya ${(layout.opening.width * 100).toFixed(0)} × ${(layout.opening.height * 100).toFixed(0)} cm terhadap bahu ${(layout.body.shoulders * 100).toFixed(0)} cm dan tubuh membungkuk ${(layout.body.crouching * 100).toFixed(0)} cm. Bale Bali diukur menurut tubuh pemiliknya supaya muat; ruang waruga supaya satu tubuh muat di dalamnya; yang ini supaya tidak seorang pun muat.`,
        `A bhaga is a house made small, and its size comes from what it depicts rather than from what it holds — the only size of that kind in this project. Every other one comes from a body, a room, a rank, a household or a crowd. So the pack declares a human body and requires the building to lose: an opening of ${(layout.opening.width * 100).toFixed(0)} × ${(layout.opening.height * 100).toFixed(0)} cm against ${(layout.body.shoulders * 100).toFixed(0)} cm shoulders and a ${(layout.body.crouching * 100).toFixed(0)} cm stooping body. A Balinese bale is measured by its owner’s body so that they fit; a waruga’s chamber so that one body fits inside; this one so that nobody does.`,
      ),
      value: t(`${(layout.opening.height * 100).toFixed(0)}`, `${(layout.opening.height * 100).toFixed(0)}`),
      unit: t('cm bukaan, terhadap 128 cm tubuh', 'cm of opening, against a 128 cm body'),
    },
    {
      key: 'naung',
      title: t('Tidak satu pun dari keduanya menaungi siapa pun', 'Neither of them shelters anybody'),
      body: t(
        'Topi ijuk di atas tiang hanya menaungi tiangnya sendiri — tidak ada lantai di bawahnya — dan bhaga tertutup pada semua sisi kecuali satu bukaan yang tidak muat dilewati orang. Bade juga punya tumpang yang tidak menaungi apa pun, tetapi bade masih membawa satu tubuh; waruga masih menyimpan orang di dalamnya. Ini dua benda pertama di sini yang tidak menampung siapa pun sama sekali, hidup maupun mati.',
        'The thatch cap on the post shelters its own post — there is no floor under it — and the bhaga is closed on every side but one opening nobody fits through. The bade has tiers that shelter nothing, but a bade still carries a body; a waruga still holds people inside it. These are the first two objects here that hold nobody at all, living or dead.',
      ),
      value: t('0', '0'),
      unit: t('orang di dalam atau di bawahnya', 'people inside or underneath'),
    },
    {
      key: 'tiang',
      title: t('Bagian yang tertanam dinyatakan, tidak digambar', 'What is planted is declared, not drawn'),
      body: t(
        `${info.glossId} Tiang ini tertanam ${DIMS.ngadhuPlanted.value.toFixed(2)} m — hampir sepertiga panjangnya — dan itu ukuran nyata dari benda nyatanya. Inti projek ini menolak bagian mana pun yang berada di bawah y = 0, dan penolakan itu benar untuk dua puluh enam bangunan lainnya, jadi angkanya dinyatakan di dalam tabel dan tidak digambar. Yang menarik bukan kekurangannya melainkan bahwa aturan inti itu sendiri baru sekarang berbenturan dengan sebuah bangunan.`,
        `${info.glossEn} This post is planted ${DIMS.ngadhuPlanted.value.toFixed(2)} m deep — nearly a third of its length — and that is a real dimension of the real object. The core refuses any part below y = 0, and that refusal is right for the other twenty-six buildings here, so the figure is stated in the table and not drawn. What is interesting is not the shortfall but that the core rule has only now met a building it disagrees with.`,
      ),
      value: t(DIMS.ngadhuPlanted.value.toFixed(2), DIMS.ngadhuPlanted.value.toFixed(2)),
      unit: t('m di bawah tanah, tidak digambar', 'm below ground, not drawn'),
    },
    {
      key: 'terbalik',
      title: t('Di sini rumah adalah latar', 'Here the houses are the setting'),
      body: t(
        'Di seluruh kumpulan ini rumahlah pokoknya dan yang berdiri di sekelilingnya adalah tapak: lumbung di halaman, kubur di kampung, dinding benteng, jalan, sungai. Hanya di sini urutannya terbalik. Yang dimodelkan adalah yang berdiri di antara rumah-rumah, dan deret sa’o di kedua sisi alun-alun menjadi gambar tapaknya — satu-satunya tapak dalam projek ini yang ditandai canon, sebab sumber menyatakan susunannya, bukan penulis yang menaruhnya.',
        'Everywhere else in this collection the house is the subject and what stands around it is the site: a granary in a yard, graves in a village, a fortress wall, a road, a river. Here alone it is the other way round. What is modelled is what stands between the houses, and the rows of sa’o along the square become the site figure — the only site in this project tagged canon, because the sources state the arrangement rather than the author placing it.',
      ),
      value: t('1', '1'),
      unit: t('tapak yang bukan latar buatan penulis', 'site figure that is not the author’s arrangement'),
    },
  ]

  return {
    key: 'ngada',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Ngadhu dan bhaga', 'Ngadhu and bhaga'),
    subhead: t(
      `${rules.pasangan} pasangan · tiang ${info.name.toLowerCase()} · tidak seorang pun masuk`,
      `${rules.pasangan} pairs · ${info.name.toLowerCase()} posts · nobody goes in`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = openingCounterexample()
  const rows = (w: { opening: number; body: number }): readonly Readout[] => [
    { label: t('tinggi bukaan', 'height of the opening'), value: `${(w.opening * 100).toFixed(0)} cm` },
    { label: t('tubuh membungkuk', 'a stooping body'), value: `${(w.body * 100).toFixed(0)} cm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Memperbesar bukaan adalah hal paling masuk akal yang dapat dilakukan orang terhadap benda ini: apa pun yang disimpan di dalam bhaga harus dimasukkan dan dikeluarkan lagi. Dan tidak ada satu pun bagiannya yang menjadi salah — pasangannya tetap utuh, tiangnya tetap memikul topinya, jarak antar pasangan tetap sama, semuanya tetap terbuat baik. Yang berhenti benar adalah apa benda itu sebenarnya: lewat tinggi tubuh yang membungkuk, model rumah yang tidak dapat dimasuki siapa pun telah menjadi rumah yang sangat kecil yang dapat dimasuki seseorang — dan perbedaan antara keduanya adalah seluruh alasan bhaga dibuat.',
      'Making the opening bigger is the most reasonable thing anybody could do to this object: whatever is kept in a bhaga has to go in and come out again. And not one part of it becomes wrong — the pair still stands complete, the post still carries its cap, the spacing still holds, everything is still as well made. What stops being true is what the thing is: past the height of a stooping body, a model of a house nobody can enter has become a very small house somebody can — and the difference between those two is the entire reason a bhaga is built.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'ngada',
    slug: 'ngada',
    house: t('Ngadhu dan bhaga', 'Ngadhu and bhaga'),
    people: t('Ngada', 'The Ngada'),
    place: t('Bena dan Wogo, Ngada, Flores', 'Bena and Wogo, Ngada, Flores'),
    about: t(
      'Di alun-alun kampung Ngada, di depan deret rumah, berdiri pasangan-pasangan: ngadhu, tiang berukir di bawah topi ijuk berbentuk kerucut, dan bhaga, rumah kecil di atas tiang-tiang pendek. Yang satu leluhur laki-laki sebuah klan, yang lain leluhur perempuannya, dan tiap klan memiliki keduanya. Tiga hal membuatnya layak dibangun di sini. Pokoknya adalah sebuah pasangan — dua benda berlainan jenis yang harus ada bersama, dan satu tanpa yang lain bukan pernyataan yang lebih kecil melainkan yang belum utuh. Bhaga adalah rumah pada ukuran yang tidak dapat dimasuki: satu-satunya ukuran dalam projek ini yang berasal dari apa yang digambarkan sebuah bangunan, bukan dari apa yang ditampungnya. Dan tidak satu pun dari keduanya menaungi siapa pun. Matahari pada model ini dihitung untuk Bena, 8,87° LS dan 120,98° BT.',
      'In a Ngada village square, in front of the rows of houses, stand pairs: a ngadhu, a carved post under a conical thatch cap, and a bhaga, a little house on short posts. One is a clan’s male ancestor and the other its female one, and every clan has both. Three things make them worth building here. The subject is a pair — two objects of different kinds that have to exist together, and one without the other is not a smaller statement but an unfinished one. The bhaga is a house at a size nobody can enter: the only size in this project taken from what a building depicts rather than from what it holds. And neither of them shelters anybody. The sun in this model is computed for Bena, 8.87° S and 120.98° E.',
    ),
    caution: t(
      'Ukiran adalah yang paling penting dari ngadhu dan tidak ada di sini: tiangnya diukir sepanjang batangnya, dan lengan bercabang di puncaknya membawa tanda-tanda yang menyatakan klan dan pestanya. Tidak dimodelkan, dengan alasan yang sama seperti pada pak-pak lain. Selain itu: bagian tiang yang tertanam dinyatakan dan tidak digambar, sebab inti projek ini menolak bagian di bawah tanah; bentuk dan ukuran bhaga sangat beragam antar kampung dan yang dibangun di sini bentuk umumnya; kubur batu dan patung yang juga berdiri di alun-alun Bena tidak dibangun; dan tidak satu pun angka di sini berasal dari pengukuran — sumbernya etnografi, bukan gambar ukur, meskipun benda-benda ini berdiri di tempat terbuka dan dapat diukur dalam satu sore.',
      'The carving is the most important thing about a ngadhu and it is not here: the post is carved along its length, and the forked arms at its head carry marks stating the clan and its feasts. Not modelled, for the reason the other packs give. Beyond that: the planted part of the post is declared and not drawn, because the core refuses parts below ground; bhaga vary a great deal from village to village and what is built here is the common form; the stone graves and figures that also stand in the square at Bena are not built; and not one figure here comes from a measurement — the sources are ethnography rather than measured drawings, though these objects stand in the open and could be measured in an afternoon.',
    ),
    orientation: t(
      'Pasangan-pasangannya berjajar di sepanjang alun-alun dan berdiri berhadapan di kedua sisi sumbunya, menghadap deret rumah. Yang menentukan arah di sini adalah alun-alunnya sendiri, bukan mata angin. Model ini membentangkan nua pada sumbu Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'The pairs are ranged along the square and stand facing each other across its axis, toward the rows of houses. What sets the direction here is the square itself rather than the compass. This model runs the nua along Z. There is still no control that turns the building.',
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
          'Pasak kayu yang menahan lengan bercabang pada kepala tiang.',
          'A timber peg holding the forked arms to the head of the post.',
        ),
      },
      {
        kind: 'tali',
        name: t('Tali', 'Lashing'),
        gloss: t(
          'Ikatan rotan yang menambatkan topi ijuk ke tiangnya. Satu-satunya hal yang ditahannya adalah sesuatu yang tidak menaungi apa pun.',
          'A rattan lashing tying the thatch cap to its post. The only thing it holds down is something that shelters nothing.',
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
