/**
 * The khaim, as the registry sees it.
 *
 * The twenty-fourth file of this shape. The registry has never asked what a
 * building is made of, and this is the first time that matters: one of this
 * one's parts is alive.
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
import { trunkCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A tall house on a living tree, with four households under one roof. */
const SHOWCASE: Rules = { tinggi: 'tinggi', perapian: 4, pohon: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = tinggiInfo(rules.tinggi)

  const readout: readonly Readout[] = [
    { label: t('Tinggi lantai', 'Height of the floor'), value: `${layout.floorY.toFixed(1)} m` },
    { label: t('Perapian', 'Hearths'), value: String(rules.perapian) },
    { label: t('Batang di ketinggian lantai', 'Trunk at floor height'), value: `${(layout.trunk.atFloor * 1000).toFixed(0)} mm` },
    { label: t('Batas pikul', 'Bearing limit'), value: `${(layout.trunk.bearing * 1000).toFixed(0)} mm` },
    { label: t('Di bawah lantai', 'Under the floor'), value: '0' },
    { label: t('Tinggi bubungan', 'Height at the ridge'), value: `${layout.ridgeY.toFixed(1)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'hidup',
      title: t('Yang menahannya masih hidup', 'What holds it up is alive'),
      body: t(
        rules.pohon
          ? `Sebatang wanbon dipilih sambil berdiri, dipotong pucuknya setinggi lantai, dan rumah dibangun mengelilingi sisanya. Akarnya tetap di tanah dan tunasnya tetap tumbuh, jadi tiang utama bangunan ini akan lebih besar tahun depan daripada hari ini. Dua puluh tiga bangunan lain dalam projek ini berdiri di atas benda mati — batu, tiang pancang, pasangan, lereng, lunas, bahu orang. Ini yang pertama berdiri di atas sesuatu yang punya nama jenis dan dapat mati sementara rumahnya masih ditinggali.`
          : `Rumah ini berdiri di atas ${layout.posts.length} tiang tebang, bukan pohon hidup — pilihan yang juga dibangun orang, dan yang dibayar dengan pelapukan sejak hari tiangnya dipancang. Aturan ini satu-satunya dalam projek yang memutuskan apakah sebagian bangunan hidup atau tidak.`,
        rules.pohon
          ? `A wanbon is chosen standing, topped off at the height the floor will sit, and the house is built around what is left. Its roots stay in the ground and its shoots keep growing, so this building’s principal post will be bigger next year than it is today. The other twenty-three buildings in this project stand on something dead — stone, piles, masonry, a hillside, a keel, people’s shoulders. This is the first that stands on something with a species, which can die while the house is still lived in.`
          : `This house stands on ${layout.posts.length} cut poles rather than a living tree — a choice people also build, and one paid for in rot from the day the poles are set. This is the only rule in the project that decides whether part of a building is alive.`,
      ),
      value: t(rules.pohon ? '1' : '0', rules.pohon ? '1' : '0'),
      unit: t('bagian yang masih tumbuh', 'parts that are still growing'),
    },
    {
      key: 'tinggi',
      title: t('Tingginya adalah maksudnya, bukan akibatnya', 'The height is the point, not a consequence'),
      body: t(
        `${info.glossId} Pada dua puluh tiga bangunan lain di sini, ruang di bawah lantai muncul karena hal lain: satu lantai penuh, satu tapakan, pasang surut sebuah teluk, sebuah alas batu. Di sini kosongnya justru pernyataannya — rumah didirikan di luar jangkauan, dan karena itu tidak boleh ada apa pun di bawahnya. ${layout.floorY.toFixed(1)} m, dan itu angka terbesar yang pernah dibawa medan yang sama.`,
        `${info.glossEn} On the other twenty-three buildings here the space under the floor arises from something else: a whole storey, a step, the tide in a bay, a stone slab. Here the emptiness is the statement — a house put out of reach, and therefore nothing may be under it. ${layout.floorY.toFixed(1)} m, which is the largest figure that field has ever carried.`,
      ),
      value: t(layout.floorY.toFixed(1), layout.floorY.toFixed(1)),
      unit: t('m udara kosong di bawah lantai', 'm of empty air under the floor'),
    },
    {
      key: 'batang',
      title: t('Tingginya dipilih rumah tangga; penirusannya milik pohon', 'The height is the household’s; the taper is the tree’s'),
      body: t(
        `Batang wanbon menipis semakin ke atas. Di tanah garis tengahnya ${(layout.trunk.base * 1000).toFixed(0)} mm; di ketinggian ${layout.floorY.toFixed(1)} m tinggal ${(layout.trunk.atFloor * 1000).toFixed(0)} mm, terhadap ${(layout.trunk.bearing * 1000).toFixed(0)} mm yang masih boleh memikul lantai. Ini pemeriksaan pertama dalam projek ini yang kedua angkanya milik pihak yang berbeda, dan tidak ada kehati-hatian di pihak tukang yang dapat menggeser angka kedua.`,
        `A wanbon narrows as it rises. At the ground its diameter is ${(layout.trunk.base * 1000).toFixed(0)} mm; at ${layout.floorY.toFixed(1)} m it is down to ${(layout.trunk.atFloor * 1000).toFixed(0)} mm, against the ${(layout.trunk.bearing * 1000).toFixed(0)} mm that may still carry a floor. It is the first check in this project whose two numbers belong to different parties, and no amount of care on the builder’s side moves the second one.`,
      ),
      value: t(`${(layout.trunk.atFloor * 1000).toFixed(0)}`, `${(layout.trunk.atFloor * 1000).toFixed(0)}`),
      unit: t('mm batang di ketinggian lantai', 'mm of trunk at floor height'),
    },
    {
      key: 'api',
      title: t('Api yang dapat dijatuhkan', 'A fire that can be dropped'),
      body: t(
        `${layout.hearths.length} perapian, tiap satunya lempeng tanah liat yang digantung pada lubang di lantai. Kalau apinya membesar, ikatannya diputus dan seluruh perapian jatuh ${layout.floorY.toFixed(1)} m ke tanah. Karena itu lantainya justru harus terbuka di bawah tiap api — pada bangunan lain di sini, lubang pada lantai adalah jalan bagi orang; di sini ia jalan keluar bagi api, dan itulah sebabnya lantainya dipasang sebagai empat bilah tiap petak, bukan satu bidang.`,
        `${layout.hearths.length} hearths, each a clay slab hung in an opening in the floor. If the fire flares, the lashings are cut and the whole hearth falls ${layout.floorY.toFixed(1)} m to the ground. So the floor is required to be open under every fire — on the other buildings here an opening in a floor is a way through for a person; here it is a way out for a fire, which is why the deck is laid as four strips to a bay rather than as one sheet.`,
      ),
      value: t(String(layout.hearths.length), String(layout.hearths.length)),
      unit: t('api yang dapat diputus', 'fires that can be cut loose'),
    },
    {
      key: 'sekat',
      title: t('Satu sekat, dan itu seluruh pembagiannya', 'One partition, and it is the whole division'),
      body: t(
        'Lantainya dibagi dua: sisi perempuan dan sisi laki-laki, masing-masing dengan perapiannya sendiri dan tangganya sendiri di ujungnya sendiri. Siwaluh jabu Karo menampung delapan rumah tangga dalam satu ruang dan tidak membagi apa pun; rumah betang memberi tiap rumah tangga satu bilik. Tiga bangunan, satu pertanyaan tentang bagaimana orang berbagi satu ruang, dan tiga jawaban yang tidak berbagi satu bagian pun.',
        'The floor is divided in two: a women’s side and a men’s side, each with its own hearth and its own ladder at its own end. The Karo siwaluh jabu holds eight households in one room and divides nothing; the betang gives every household a room of its own. Three buildings, one question about how people share a single space, and three answers that share no member.',
      ),
      value: t('1', '1'),
      unit: t('sekat', 'partition'),
    },
  ]

  return {
    key: 'korowai',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Khaim', 'Khaim'),
    subhead: t(
      `${layout.floorY.toFixed(1)} m di udara · ${rules.perapian} perapian · ${rules.pohon ? 'di atas pohon hidup' : 'di atas tiang tebang'}`,
      `${layout.floorY.toFixed(1)} m up · ${rules.perapian} hearths · ${rules.pohon ? 'on a living tree' : 'on cut poles'}`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = trunkCounterexample()
  const rows = (w: { atFloor: number; bearing: number; floorY: number }): readonly Readout[] => [
    { label: t('tinggi lantai', 'height of the floor'), value: `${w.floorY.toFixed(1)} m` },
    { label: t('batang di situ', 'trunk at that height'), value: `${(w.atFloor * 1000).toFixed(0)} mm` },
    { label: t('batas pikul', 'bearing limit'), value: `${(w.bearing * 1000).toFixed(0)} mm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Bangun lebih tinggi dan seluruh rumahnya tetap benar: rangkanya, lantainya, kedua sisinya, sekatnya, api-apinya yang masih dapat dijatuhkan. Yang habis adalah pohonnya. Wanbon menipis semakin ke atas, dan lewat satu titik batang di tempat lantai dipasang tidak lagi cukup tebal untuk memikulnya. Ini satu-satunya penyangkalan dalam projek ini yang kedua angkanya milik pihak berbeda: tingginya dipilih rumah tangga, penirusannya milik pohon, dan tidak ada kehati-hatian di pihak tukang yang menggeser angka kedua sedikit pun.',
      'Build it higher and the whole house stays correct: the frame, the floor, the two sides, the partition, the fires that can still be dropped. What runs out is the tree. A wanbon narrows as it rises, and past a point the trunk where the floor is framed in is no longer thick enough to carry it. It is the only refutation in this project whose two numbers belong to different parties: the height is the household’s, the taper is the tree’s, and no amount of care on the builder’s side moves the second one at all.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'korowai',
    slug: 'korowai',
    house: t('Khaim', 'Khaim'),
    people: t('Korowai', 'The Korowai'),
    place: t('Hulu Becking dan Dairam, Papua Selatan', 'The Becking and Dairam headwaters, South Papua'),
    about: t(
      'Khaim adalah rumah Korowai, berdiri jauh di atas lantai hutan di hulu Becking dan Dairam. Yang memikulnya biasanya sebatang pohon hidup: wanbon yang dipotong pucuknya setinggi lantai, akarnya tetap di tanah, tunasnya tetap tumbuh, dan rumah dibangun mengelilingi sisanya. Tiga hal membuatnya layak dibangun di sini. Bagian strukturnya ada yang hidup — satu-satunya dalam kumpulan ini, dan hal pertama yang benar-benar menguji anggapan bahwa sebuah bagian, sekali diletakkan, tetap seperti itu. Tingginya adalah maksud bangunannya dan bukan akibat dari hal lain, jadi udara kosong di bawah lantai adalah bagian dari rumah. Dan perapiannya digantung pada lubang di lantai supaya dapat diputus dan dijatuhkan, yang membuat lantai justru harus terbuka di bawah tiap api. Matahari pada model ini dihitung untuk Yaniruma, 5,28° LS dan 139,66° BT.',
      'A khaim is a Korowai house, standing high above the forest floor in the Becking and Dairam headwaters. What carries it is usually a living tree: a wanbon topped off at floor height, its roots still in the ground, its shoots still growing, and the house built around what is left. Three things make it worth building here. Part of its structure is alive — the only one in the collection, and the first real test of the assumption that a part, once placed, stays as placed. Its height is the point of the building rather than a consequence of something else, so the empty air under the floor is part of the house. And its hearths hang in openings so they can be cut loose and dropped, which requires the floor to be open under every fire. The sun in this model is computed for Yaniruma, 5.28° S and 139.66° E.',
    ),
    caution: t(
      'Angka yang paling banyak beredar tentang rumah ini adalah yang paling perlu dicurigai. Rumah setinggi dua puluh lima sampai lima puluh meter memang disebut-sebut, dan sebagian benar-benar ada, tetapi rumah Korowai sehari-hari jauh lebih rendah — beberapa meter sampai belasan — dan sebagian rumah yang paling tinggi dibangun untuk kamera, bukan untuk ditinggali. Tiga tinggi di sini adalah tafsiran penulis atas rentang itu, dan tidak satu pun berasal dari pengukuran. Selain itu: batangnya dimodelkan berpenampang persegi; penirusan dan garis tengahnya adalah angka penulis dan pada kenyataannya berbeda dari pohon ke pohon di kampung yang sama; ukiran dan perkakas tidak dimodelkan; dan sumber tentang bangunan ini kaya soal bagaimana rumah dipakai dan tipis soal bagaimana ia diukur — jadi tiap meter dalam pak ini adalah tafsiran, tanpa kecuali.',
      'The most widely circulated figure about this building is the one to distrust. Houses of twenty-five to fifty metres are reported, and some genuinely exist, but an everyday Korowai house is far lower — a few metres to a dozen or so — and some of the tallest were built for a camera rather than to be lived in. The three heights here are the author’s reading of that range and not one of them comes from a measurement. Beyond that: the trunk is modelled as a square section; its taper and diameter are the author’s and in fact differ from tree to tree in the same settlement; carving and household equipment are not modelled; and the sources on this building are rich on how a house is used and thin on how it is dimensioned — so every metre in this pack is an interpretation, without exception.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin. Yang menentukan letak rumah adalah sebatang pohon yang cocok dan tanah yang dapat dibuka di sekelilingnya — satu-satunya bangunan dalam kumpulan ini yang tempatnya ditentukan oleh sesuatu yang tumbuh sendiri di situ. Model ini menaruh bubungan pada sumbu Z dan sekatnya pada z = 0. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule. What decides where the house goes is a suitable tree and ground that can be cleared around it — the only building in this collection sited by something that grew there by itself. This model runs the ridge on Z and puts the partition on z = 0. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'rotan',
        name: t('Rotan', 'Rattan lashing'),
        gloss: t(
          'Ikatan rotan. Satu-satunya pengikat pada bangunan ini, dan satu-satunya yang dapat dipakai pada pohon hidup: apa pun yang dipakukan ke batang yang masih tumbuh akan ditinggalkan oleh batang itu.',
          'A rattan lashing. The only fastening on this building, and the only one that can be used on a living tree: anything nailed to a trunk that is still growing is left behind by it.',
        ),
      },
      {
        kind: 'cagak',
        name: t('Cagak', 'Fork'),
        gloss: t(
          'Gelagar dijatuhkan ke cabang yang ditinggalkan waktu pohon dipotong pucuknya, dan ditahan oleh beratnya sendiri sebelum diikat. Sambungan yang bentuknya ditentukan pohon, bukan tukang.',
          'A bearer dropped into the crotch left when the tree was topped, held by its own weight before anything is tied. A joint whose shape was decided by the tree rather than by the builder.',
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
