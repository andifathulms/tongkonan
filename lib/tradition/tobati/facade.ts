/**
 * The kariwari, as the registry sees it.
 *
 * The sixteenth file of this shape. The registry needed nothing for a building
 * standing in the sea, which is the strongest evidence yet that the neutral
 * contract is neutral: it asks for parts, a scene model, a timeline, verdicts
 * and provenance, and none of those care what is under the posts.
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
import { tideCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** All three grades, and no walkway: reached by canoe. */
const SHOWCASE: Rules = { tingkat: 3, titian: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const first = layout.levels[0]
  const top = layout.levels[layout.levels.length - 1]
  const high = layout.waterDepth + layout.tide
  const clear = (first?.y ?? high) - DIMS.floorThickness.value - DIMS.bearerDepth.value - high

  const readout: readonly Readout[] = [
    { label: t('Tingkat', 'Levels'), value: String(layout.levels.length) },
    { label: t('Air tertinggi', 'Highest water'), value: `${high.toFixed(2)} m` },
    { label: t('Jarak bebas', 'Clearance'), value: `${clear.toFixed(2)} m` },
    { label: t('Puncak', 'The point'), value: `${layout.apexY.toFixed(1)} m` },
    { label: t('Lantai terbawah', 'Lowest floor'), value: `${(first?.area ?? 0).toFixed(1)} m²` },
    { label: t('Lantai teratas', 'Topmost floor'), value: `${(top?.area ?? 0).toFixed(1)} m²` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'air',
      title: t('Rumah ini tidak berdiri di atas tanah', 'This house does not stand on land'),
      body: t(
        'Ia berdiri di dalam air Teluk Youtefa, di atas tiang yang dipancang ke dasar. Lima belas bangunan lain dalam projek ini berdiri di atas sesuatu — bumi, pasangan batu, rawa pasang, lereng yang dibuka — dan yang ini tidak. Akibatnya berbeda jenisnya, bukan derajatnya: tidak ada batu alas di bawah satu tiang pun, karena tidak ada tempat untuk meletakkannya; dan tinggi lantainya bukan soal ternak, bukan soal kedudukan, melainkan soal air pasang.',
        'It stands in the water of Youtefa Bay, on posts driven into the bed. The other fifteen buildings in this project stand on something — earth, masonry, tidal swamp, a cleared slope — and this one does not. The consequences differ in kind rather than degree: there is no pad stone under a single post, because there is nowhere to set one; and the height of the floor is not about livestock or standing but about the tide.',
      ),
      value: t(clear.toFixed(2), clear.toFixed(2)),
      unit: t('m di atas air tertinggi', 'm above the highest water'),
    },
    {
      key: 'usia',
      title: t('Potongannya adalah sebuah riwayat hidup', 'Its section is a biography'),
      body: t(
        'Tingkat-tingkatnya adalah golongan usia: anak laki-laki diajar di bawah, pemuda tinggal di atasnya, orang tua bersidang di puncaknya. Pembagian tegak di rumah lain adalah tempat — tiga dunia pada tongkonan, sebuah ruang dan tempat hangat di atasnya pada honai. Yang ini dilalui: seorang laki-laki tidak memilih tingkatnya dan tidak menetap di situ, ia menaikinya, sekali, sepanjang hidupnya.',
        'The levels are age grades: boys are taught below, young men live above them, the elders meet at the top. The vertical divisions in the other houses are places — three worlds on a tongkonan, a room and the warm place above it in a honai. This one is passed through: a man does not choose his level and does not settle on it, he climbs it, once, over a lifetime.',
      ),
      value: t(String(layout.levels.length), String(layout.levels.length)),
      unit: t('golongan usia', 'age grades'),
    },
    {
      key: 'piramida',
      title: t('Semakin tua semakin sedikit, dan bangunannya menyempit', 'Fewer with age, and the building narrows'),
      body: t(
        `Tiap tingkat lebih kecil daripada tingkat di bawahnya, karena golongan usia yang lebih tua lebih sedikit orangnya: ${(first?.area ?? 0).toFixed(1)} m² di bawah menjadi ${(top?.area ?? 0).toFixed(1)} m² di atas. Ini satu-satunya bangunan dalam projek ini yang menyatakan berapa banyak orang di tiap pitanya, bukan apa yang terjadi di situ — sebuah piramida usia yang dibangun dan bukan digambar.`,
        `Every level is smaller than the one below it, because the older grades hold fewer people: ${(first?.area ?? 0).toFixed(1)} m² below becomes ${(top?.area ?? 0).toFixed(1)} m² above. It is the only building in this project that states how many people belong to each of its bands rather than what happens in them — a pyramid of age that is built rather than drawn.`,
      ),
      value: t(
        `${(((top?.area ?? 0) / (first?.area ?? 1)) * 100).toFixed(0)}%`,
        `${(((top?.area ?? 0) / (first?.area ?? 1)) * 100).toFixed(0)}%`,
      ),
      unit: t('luas teratas terhadap terbawah', 'top floor against the bottom'),
    },
    {
      key: 'tangga',
      title: t('Tidak ada jalan pintas ke atas', 'There is no short cut to the top'),
      body: t(
        'Ada satu galah bertakik antara tiap pasang tingkat yang berurutan, dan tidak ada yang melompati satu tingkat. Golongan usia ditinggalkan dengan menaiki golongan berikutnya, dan bangunan ini tidak menyediakan cara lain — sebuah aturan tentang jalan, bukan tentang anggota, seperti aturan lumbung Sasak bahwa tidak ada jalan naik selain melewati piringan penghalang tikus.',
        'There is one notched pole between each pair of consecutive levels and none that skips one. A grade is left by climbing into the next, and the building offers no other way — a rule about a route rather than about a member, like the Sasak lumbung’s rule that there is no way up except past the rat guards.',
      ),
      value: t(String(Math.max(0, layout.levels.length - 1)), String(Math.max(0, layout.levels.length - 1))),
      unit: t('galah, tidak satu pun melompat', 'poles, none of them skipping'),
    },
    {
      key: 'delapan',
      title: t('Delapan sisi, dan karena itu tidak ada muka', 'Eight sides, and therefore no front'),
      body: t(
        'Lima belas bangunan lain di sini berdenah persegi panjang atau lingkaran. Segi delapan bukan keduanya: ia punya sudut, tetapi tidak punya sisi panjang dan sisi pendek — jadi tidak ada sisi yang menjadi muka hanya karena paling lebar. Yang menetapkan arah bangunan ini adalah titian, dan bila titiannya tidak ada, rumah ini dicapai dengan perahu dari arah mana pun.',
        'The other fifteen buildings here are rectangles or circles. An octagon is neither: it has corners, but it has no long face and no short one — so no side becomes the front by being the widest. What gives this building a direction is the walkway, and without one it is reached by canoe from any side at all.',
      ),
      value: t(rules.titian ? 'titian' : 'perahu', rules.titian ? 'a walkway' : 'by canoe'),
      unit: t('cara sampai ke sini', 'how it is reached'),
    },
  ]

  return {
    key: 'tobati',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumah kariwari', 'Rumah kariwari'),
    subhead: t(
      `${layout.levels.length} tingkat · segi delapan · di atas air`,
      `${layout.levels.length} levels · eight-sided · over water`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = tideCounterexample()
  const rows = (w: { floor: number; highWater: number }): readonly Readout[] => [
    { label: t('lantai terbawah', 'lowest floor'), value: `${w.floor.toFixed(2)} m` },
    { label: t('air tertinggi', 'highest water'), value: `${w.highWater.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Potong tiangnya lebih pendek dan bangunannya tetap dibuat dengan baik: delapan tiang, delapan dinding, tiap tingkat lebih kecil daripada yang di bawahnya, satu galah di antara tiap pasang, dan kerucut di atasnya. Yang terjadi hanyalah laut naik menembus lantainya dua kali sehari. Enam belas bangunan, enam belas aturan yang tidak dapat dilaksanakan — dan ini yang pertama dipatahkan oleh sesuatu yang tidak dikuasai siapa pun. Pangkat dapat ditolak, sekat dapat dibiarkan rendah, bubungan dapat ditinggikan. Pasang datang apa pun yang diputuskan orang.',
      'Cut the posts shorter and the building is still perfectly well made: eight posts, eight walls, every level smaller than the one below, a pole between each pair, and a cone over the top. What happens is that the sea comes up through the floor twice a day. Sixteen buildings, sixteen rules that cannot be carried out — and this is the first defeated by something nobody controls. A rank can be refused, a screen can be left low, a ridge can be built high. The tide comes in whatever anybody decides.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'tobati',
    slug: 'tobati',
    house: t('Rumah kariwari', 'Rumah kariwari'),
    people: t('Tobati-Enggros', 'The Tobati-Enggros'),
    place: t('Teluk Youtefa, Jayapura, Papua', 'Youtefa Bay, Jayapura, Papua'),
    about: t(
      'Kariwari adalah rumah laki-laki Tobati-Enggros di Teluk Youtefa: bangunan bersegi delapan di atas tiang yang dipancang ke dasar teluk, dengan kerucut menjulang di puncaknya. Yang membuatnya layak dibangun di sini ada dua. Pertama, ia tidak berdiri di atas tanah — dan setiap akibatnya berbeda jenisnya: tidak ada batu alas, dan tinggi lantainya adalah pernyataan tentang pasang. Kedua, tingkat-tingkatnya adalah golongan usia yang dinaiki seseorang sepanjang hidupnya, bukan tempat yang ditempatinya — jadi potongan bangunan ini adalah sebuah riwayat hidup. Matahari pada model ini dihitung untuk Jayapura, 2,6° LS dan 140,7° BT.',
      'The kariwari is the men’s house of the Tobati-Enggros on Youtefa Bay: an eight-sided building on posts driven into the bed of the bay, with a tall cone at the top of it. Two things make it worth building here. First, it does not stand on land — and every consequence of that differs in kind: there is no pad stone, and the height of the floor is a statement about the tide. Second, its levels are age grades a person climbs over a lifetime rather than places they occupy — so the section of this building is a biography. The sun in this model is computed for Jayapura, 2.6° S and 140.7° E.',
    ),
    caution: t(
      'Ini bangunan yang paling tipis sumbernya di antara enam belas, dan yang dinyatakan di sini hanyalah bentuk umum yang tercatat: denah segi delapan, tiang pancang di air, tingkat menurut golongan usia, dan puncak kerucut yang tinggi. Semua ukurannya penetapan penulis, termasuk tinggi puncaknya — hal yang paling dikenali dari bangunan ini. Ukirannya tidak ada. Tiang-tiangnya digambar condong lurus dari kaki ke kepala, padahal tiap tingkat sesungguhnya bersambung; ini penyederhanaan yang membuat lantai dan tiangnya satu keterangan. Dan rumah perempuan, yang berdiri di kampung yang sama, sama sekali tidak dimodelkan: sebuah ketiadaan yang dinyatakan, bukan bangunan yang disajikan seolah netral.',
      'This is the thinnest-sourced of the sixteen, and what is stated here is only the common form that is recorded: an eight-sided plan, posts driven in the water, levels by age grade, and a tall conical peak. Every figure is the author’s, including the height of the peak — the thing this building is most recognised by. There is no carving. The posts are drawn as a straight batter from foot to head where the real ones are jointed level by level; that simplification is what makes the floors and the posts one description. And the women’s house, which stands in the same village, is not modelled at all: an absence stated rather than a building presented as neutral.',
    ),
    orientation: t(
      'Bangunan bersegi delapan tidak punya sisi yang paling lebar, jadi tidak ada sisi yang dengan sendirinya menjadi muka. Yang memberinya arah adalah titian dari darat — dan bila titiannya tidak dipasang, rumah ini dicapai dengan perahu dari arah mana pun, yang menjadikannya satu-satunya bangunan dalam projek ini yang bisa tidak punya muka sama sekali. Model ini menaruh titian di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'An eight-sided building has no widest side, so no side becomes the front by itself. What gives it a direction is the walkway from the shore — and with no walkway it is reached by canoe from any side, which makes it the only building in this project that can have no front at all. This model puts the walkway on −X. There is still no control that turns the building.',
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
          'Gelagar duduk dalam takik di tiang, di atas air tertinggi — ketinggian yang ditetapkan pasang dan bukan pembangunnya.',
          'A bearer sits in a notch in the post, above the highest water — a height set by the tide rather than by the builders.',
        ),
      },
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Kasau diikat pada balok kepala di tiap sudut segi delapannya. Delapan sudut, delapan kasau, dan dari kejauhan itulah bentuk yang menandai bangunan ini di atas air.',
          'A rafter is lashed to the head plate at each corner of the octagon. Eight corners, eight rafters, and from a distance that is the shape that marks this building on the water.',
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
