/**
 * The rumoh Aceh, as the registry sees it.
 *
 * The twentieth file of this shape. The registry has never asked where a rule
 * comes from — only what it produces — which is why a house turned by a
 * doctrine fits it exactly as well as a house turned by a river.
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
import { houseWidth } from './frame'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { stepsCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The longest house, the longest ladder, and no back veranda. */
const SHOWCASE: Rules = { ruang: 7, anakTangga: 11, seuramoeLikot: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const width = houseWidth(layout)

  const readout: readonly Readout[] = [
    { label: t('Ruang', 'Bays'), value: String(layout.bays) },
    { label: t('Panjang (timur–barat)', 'Length, east–west'), value: `${layout.length.toFixed(1)} m` },
    { label: t('Lebar', 'Width'), value: `${width.toFixed(1)} m` },
    { label: t('Anak tangga', 'Treads'), value: String(layout.ladder.steps) },
    { label: t('Tungai naik', 'The middle room rises'), value: `${layout.raise.toFixed(2)} m` },
    { label: t('Paku pada rangka', 'Nails in the frame'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'kiblat',
      title: t('Diarahkan oleh sesuatu yang bukan dari sini', 'Turned by something that is not from here'),
      body: t(
        'Bubungan rumah ini membujur timur–barat karena salat menghadap ke barat: ruangannya sudah menghadap arah itu sebelum siapa pun berdiri di dalamnya. Sembilan belas bangunan lain dalam projek ini diarahkan oleh sesuatu yang dapat dilihat dari halamannya sendiri — aturan mata angin miliknya, lumbung di seberang, sungai, jalan, batu, pangkal sebatang pohon, arah turunnya lereng. Yang ini diarahkan oleh ajaran yang juga dipegang orang di negeri lain, dan itulah satu-satunya aturan dalam kumpulan ini yang datang dari luar Nusantara.',
        'This house lies east–west because prayer is toward the west: the room is already turned that way before anybody stands in it. The other nineteen buildings in this project are turned by something you can see from their own yard — a compass rule of their own, a granary across the way, a river, a road, a stone, the root of a tree, the fall of a hillside. This one is turned by a doctrine held by people in other countries too, and it is the only rule in the collection that arrived from outside the archipelago.',
      ),
      value: t(`${layout.length.toFixed(1)} : ${width.toFixed(1)}`, `${layout.length.toFixed(1)} : ${width.toFixed(1)}`),
      unit: t('m sepanjang garis itu, terhadap lebarnya', 'm along that line, against the width'),
    },
    {
      key: 'ganjil',
      title: t('Anak tangganya dihitung, dan harus ganjil', 'The treads are counted, and must be odd'),
      body: t(
        `Bukan kira-kira ganjil dan bukan biasanya ganjil: ganjil. Ini satu-satunya aturan keganjilan dalam projek ini, dan ia dapat gagal dengan cara yang khas bagi keganjilan — meleset satu. Jumlahnya tidak dinyatakan melainkan keluar dari tinggi lantai dibagi tinggi injakan, jadi menggeser injakan satu sentimeter dapat membalik ${layout.ladder.steps} menjadi ${layout.ladder.steps - 1} tanpa mengubah apa pun yang lain — dan itulah tandingan terkecil dalam projek ini.`,
        `Not roughly odd and not usually odd: odd. It is the only parity rule in this project, and it can fail in the way parity fails — by one. The count is not declared but falls out of the floor height divided by the rise of a tread, so a centimetre on the rise flips ${layout.ladder.steps} to ${layout.ladder.steps - 1} with nothing else changed — the smallest counterexample in the project.`,
      ),
      value: t(String(layout.ladder.steps), String(layout.ladder.steps)),
      unit: t('anak tangga, ganjil', 'treads, an odd number'),
    },
    {
      key: 'tiga',
      title: t('Tiga bagian, dan yang tengah ditinggikan', 'Three parts, and the middle one is raised'),
      body: t(
        `Seuramoë keuë di muka untuk tamu dan laki-laki; tungai yang ditinggikan ${layout.raise.toFixed(2)} m untuk tidur dan melahirkan; seuramoë likôt di belakang untuk perempuan bekerja. Rumah limas Palembang memakai anggota yang persis sama — lantai yang naik bertingkat — untuk menyatakan kedudukan seorang tamu. Di sini yang dinaikkan justru ruang yang tidak dimasuki tamu, dan yang dinyatakan bukan siapa lebih tinggi melainkan sampai di mana orang luar boleh melangkah.`,
        `The seuramoë keuë at the front for guests and the men; the tungai raised ${layout.raise.toFixed(2)} m for sleeping and for birth; the seuramoë likôt behind for the women’s work. The Palembang rumah limas uses exactly this member — a floor that steps up — to state a guest’s standing. Here what is raised is the room a guest does not enter, and what is stated is not who is higher but how far in an outsider comes.`,
      ),
      value: t(String(layout.rooms.length), String(layout.rooms.length)),
      unit: t('bagian melintang lebarnya', 'parts across the width'),
    },
    {
      key: 'lentur',
      title: t('Rangka yang bergoyang tanpa patah', 'A frame that moves without breaking'),
      body: t(
        'Tiang berdiri bebas di atas alasnya dan tidak ditanam; balok toi menembus lubang yang dipahat tembus pada tiang, lalu dipasak dan diikat. Tidak ada paku sama sekali. Omo Nias menjawab persoalan yang sama — tanah yang bergerak — dengan menyegitigakan tiap petak substrukturnya, dan rumah kaki seribu Arfak menjawabnya dengan tidak memberi pengaku sama sekali. Ini jawaban ketiga: sambungan yang boleh bergerak sedikit, pada rangka yang tidak dipaksa kaku.',
        'The posts stand free on their footings and are not buried; the toi thread through mortises cut clean through them and are pegged and lashed. There is no iron at all. The Nias omo answers the same problem — ground that moves — by triangulating every bay of its substructure, and the Arfak house answers it by bracing nothing whatever. This is a third answer: joints that are allowed to work a little, in a frame nobody has forced to be stiff.',
      ),
      value: t('0', '0'),
      unit: t('paku pada seluruh rangka', 'nails in the whole frame'),
    },
    {
      key: 'nama',
      title: t('Rumah ini dinamai menurut jumlah ruangnya', 'The house is named by its bay count'),
      body: t(
        `Rumoh lhee ruang, rumoh limong ruang: tiga ruang, lima ruang. Jumlahnya ganjil karena ruang tengahnya harus benar-benar di tengah — tungai duduk di situ — dan jumlah genap akan menaruh sambungan tepat di tempat yang seharusnya pusat. Rumah gadang Minangkabau juga menghitung ruang ganjil, dan alasannya berbeda: di sana yang ganjil menjaga bilik tetap berpasangan di kedua sisi.`,
        `Rumoh lhee ruang, rumoh limong ruang: three bays, five bays. The count is odd because the middle bay has to be the middle — the tungai sits on it — and an even count would put a joint exactly where the centre should be. The Minangkabau rumah gadang also counts odd ruang, for a different reason: there the odd number keeps the bilik in pairs on both sides.`,
      ),
      value: t(String(layout.bays), String(layout.bays)),
      unit: t('ruang, ganjil', 'bays, an odd number'),
    },
  ]

  return {
    key: 'aceh',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumoh Aceh', 'Rumoh Aceh'),
    subhead: t(
      `${layout.bays} ruang · ${layout.ladder.steps} anak tangga · membujur timur–barat`,
      `${layout.bays} bays · ${layout.ladder.steps} treads · lying east–west`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = stepsCounterexample()
  const rows = (w: { steps: number; rise: number }): readonly Readout[] => [
    { label: t('anak tangga', 'treads'), value: String(w.steps) },
    { label: t('tinggi injakan', 'rise of a tread'), value: `${w.rise.toFixed(3)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Geser tinggi injakannya satu sentimeter dan rumahnya tidak bergerak sedikit pun: lantainya tetap setinggi itu, tangganya tetap sampai, tiap injakan tetap nyaman, rangkanya tidak tersentuh. Yang berubah hanyalah bahwa jumlah anak tangganya kini genap, dan tradisinya menyebut ganjil. Ini satu-satunya tandingan dalam projek ini yang bertumpu pada sebuah cacah dan bukan pada sebuah panjang — dan satu-satunya yang selisih antara rumah yang benar dan yang salah adalah satu potong kayu.',
      'Move the rise of a tread by a centimetre and the house does not move at all: the floor is at the same height, the ladder still reaches it, every step is still comfortable, the frame is untouched. All that changes is that the number of treads is now even, and the tradition says odd. It is the only counterexample in this project that turns on a count rather than a length — and the only one where the difference between the sound house and the broken one is a single piece of wood.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'aceh',
    slug: 'aceh',
    house: t('Rumoh Aceh', 'Rumoh Aceh'),
    people: t('Aceh', 'The Acehnese'),
    place: t('Aceh', 'Aceh'),
    about: t(
      'Rumoh Aceh adalah rumah panggung kayu yang tinggi, panjang, dan bersambung tanpa paku, dengan tiga bagian melintang lebarnya. Yang membuatnya layak dibangun di sini adalah asal aturannya: bubungannya membujur timur–barat karena salat menghadap ke barat, dan itu satu-satunya aturan dalam kumpulan ini yang datang dari luar Nusantara. Sembilan belas bangunan lain diarahkan oleh sesuatu yang dapat dilihat dari halamannya sendiri. Dan anak tangganya harus ganjil — satu-satunya aturan keganjilan dalam projek ini, yang dapat gagal dengan meleset satu. Matahari pada model ini dihitung untuk Banda Aceh, 5,55° LU dan 95,32° BT: tapak paling utara dan paling barat dalam kumpulan ini.',
      'The rumoh Aceh is a tall raised timber house, long and jointed without nails, with three parts across its width. What makes it worth building here is where its rule comes from: the ridge lies east–west because prayer is toward the west, and that is the only rule in this collection that arrived from outside the archipelago. The other nineteen buildings are turned by something you can see from their own yard. And the ladder must have an odd number of treads — the only parity rule in the project, and one that fails by one. The sun in this model is computed for Banda Aceh, 5.55° N and 95.32° E: the northernmost and westernmost site in the collection.',
    ),
    caution: t(
      'Ukiran adalah bagian rumoh Aceh yang paling diperhatikan pada bangunan sesungguhnya — pada papan tepi, tulak angen di ujung bubungan, dan kisi-kisi jendelanya — dan di sini tidak ada sama sekali, dengan alasan yang sama seperti rumah-rumah lain. Jumlah tiang pada rumah sesungguhnya jauh lebih banyak daripada di sini dan disusun menurut kelipatan tertentu yang tidak dimodelkan. Arah kiblat dari Aceh sesungguhnya sekitar 293°, bukan tepat barat; yang dinyatakan model ini adalah sumbu timur–barat yang disebut sumbernya, bukan hasil hitungan arah kiblat. Dan tidak satu pun angka di sini berasal dari pengukuran.',
      'Carving is the part of a real rumoh Aceh given the most attention — on the bargeboards, the tulak angen at the ends of the ridge, the window lattices — and there is none of it here, for the reason the other houses give. A real house has far more posts than this one and sets them out on counts this model does not carry. The qibla from Aceh is in fact about 293° rather than due west; what this model states is the east–west axis the sources give, not a computed bearing. And not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah membujur timur–barat dan tangganya naik dari sisi panjang. Kendalanya doktrinal: arah salat, bukan mata angin setempat, bukan lumbung di seberang halaman, bukan sungai. Model ini menaruh panjang rumah pada sumbu Z dan muka serambinya di −X. Tetap tidak ada kendali untuk memutar bangunan — dan pada rumah ini itu bukan lagi sekadar keputusan projek melainkan isi aturannya.',
      'The house lies east–west and the ladder comes up its long side. The constraint is doctrinal: the direction of prayer, not a local compass rule, not a granary across the yard, not a river. This model puts the length on Z and the veranda front on −X. There is still no control that turns the building — and on this house that is no longer only a decision of the project but the content of the rule.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'toi',
        name: t('Toi', 'Threaded beam'),
        gloss: t(
          'Balok menembus lubang yang dipahat tembus pada tiang, lalu dipasak. Sambungan ini boleh bergerak sedikit, dan itulah sebabnya rangka ini tidak patah ketika tanahnya bergerak.',
          'A beam passes through a mortise cut clean through the post and is pegged. The joint is allowed to work a little, which is why this frame does not break when the ground moves.',
        ),
      },
      {
        kind: 'talo',
        name: t('Talo', 'Lashing'),
        gloss: t(
          'Ikatan serat pada rangka atap. Tidak ada paku di seluruh bangunan ini.',
          'A fibre lashing in the roof frame. There is no iron anywhere in this building.',
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
