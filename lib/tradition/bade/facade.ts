/**
 * The bade, as the registry sees it.
 *
 * The twenty-third file of this shape, and the one that finds the contract's
 * furthest edge. The registry asks for a house, a scene model, a timeline,
 * verdicts and provenance. It has never asked whether a building stands still,
 * whether anybody lives in it, or whether it will exist tomorrow — and this one
 * answers no to all three without a word of special pleading.
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
  pemikulInfo,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { bearersCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The highest claim the rules allow, on the largest crowd: eleven tiers, eighty shoulders. */
const SHOWCASE: Rules = { tumpang: 11, pemikul: 'delapan-puluh', payung: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = pemikulInfo(rules.pemikul)

  const readout: readonly Readout[] = [
    { label: t('Tingkat', 'Tiers'), value: String(rules.tumpang) },
    { label: t('Pemikul', 'Bearers'), value: String(info.count) },
    { label: t('Sisi usungan', 'Side of the lattice'), value: `${(layout.frame.halfX * 2).toFixed(2)} m` },
    { label: t('Tinggi puncak', 'Height at the apex'), value: `${layout.apexY.toFixed(2)} m` },
    { label: t('Tiang tertanam', 'Buried posts'), value: '0' },
    { label: t('Umur bangunan', 'Life of the building'), value: t('satu sore', 'one afternoon').en },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'dibakar',
      title: t('Dibangun untuk dibakar', 'Built in order to be burned'),
      body: t(
        'Dua puluh dua bangunan lain dalam projek ini dibuat untuk berdiri. Rumah woloan dibuat untuk dibongkar dan dipasang lagi di tempat lain; waruga dibuat untuk tidak pernah berpindah sama sekali. Yang ini dibuat untuk dipikul sekali lalu berhenti ada — bambu, kayu, kain, kertas, dan tidak satu pun dari empat bahan itu ada keesokan paginya. Ketiganya bersama-sama adalah seluruh rentang jawaban atas pertanyaan berapa lama sebuah bangunan dimaksudkan bertahan.',
        'The other twenty-two buildings in this project are made to stand. The woloan house is made to be taken apart and put up somewhere else; the waruga is made never to move at all. This one is made to be carried once and then to stop existing — bamboo, timber, cloth, paper, and not one of the four is there the next morning. The three of them together are the whole range of answers to how long a building is meant to last.',
      ),
      value: t('4', '4'),
      unit: t('bahan, semuanya terbakar', 'materials, every one of them burns'),
    },
    {
      key: 'pondasi',
      title: t('Pondasinya berjalan', 'Its foundation walks'),
      body: t(
        `Setiap bangunan lain di sini bertumpu pada sesuatu yang diam: batu, tiang pancang, pasangan, lereng bukit, lunas di air. Bangunan ini bertumpu pada ${info.count} bahu di bawah kisi bambu, dan pondasi itu berjalan di jalan, lalu diputar berkeliling di tiap perempatan supaya rohnya kehilangan arah. Akibatnya satu syarat yang tidak dimiliki bangunan lain mana pun: beratnya harus berada di atas orang-orang yang memikulnya, dan tidak ada yang menghubungkan tinggi menara dengan besar kisi kecuali aturan itu.`,
        `Every other building here bears on something that stays: stone, piles, masonry, a hillside, a keel in water. This one bears on ${info.count} shoulders under a bamboo lattice, and that foundation walks down the road and is spun about at every crossing so the spirit loses its bearings. What follows is one requirement no other building here has: the weight must sit over the people carrying it, and nothing ties the height of the tower to the size of the lattice except that rule.`,
      ),
      value: t(String(info.count), String(info.count)),
      unit: t('bahu di bawahnya', 'shoulders under it'),
    },
    {
      key: 'denah',
      title: t('Denahnya adalah hitungan orang, bukan hitungan ruang', 'Its plan is a headcount, not a room count'),
      body: t(
        `${info.glossId} Denah tiap bangunan lain di sini datang dari sebuah ruang, sebuah pangkat, sebuah tubuh, atau sebuah rumah tangga. Yang ini datang dari pertanyaan berapa banyak orang yang dapat berdiri di bawahnya sekaligus — satu-satunya denah dalam kumpulan ini yang diukur menurut kerumunan yang hidup, dan bukan menurut yang tinggal di dalamnya.`,
        `${info.glossEn} Every other plan here comes from a room, a rank, a body, or a household. This one comes from the question of how many people can stand under it at once — the only plan in the collection measured by a living crowd rather than by whoever lives inside.`,
      ),
      value: t(`${(layout.frame.halfX * 2).toFixed(2)}`, `${(layout.frame.halfX * 2).toFixed(2)}`),
      unit: t('m sisi usungan', 'm across the lattice'),
    },
    {
      key: 'tumpang',
      title: t('Tingkat yang tidak menaungi apa pun', 'Tiers that shelter nothing'),
      body: t(
        `${rules.tumpang} tingkat, dan jumlahnya adalah kedudukan orang yang dibawa: satu, tiga, lima, tujuh, sembilan, sebelas. Pada joglo tumpang adalah atap di atas sebuah ruang dan pangkatnya terbawa oleh apa yang dinaunginya; di sini tidak ada apa-apa di bawahnya kecuali udara, jadi tingkat-tingkat itu murni pernyataan. Rumah gadang punya gonjong, saoraja punya timpa laja — tetapi keduanya tetap ada besok pagi. Yang ini menyatakan kedudukan dengan sesuatu yang sengaja tidak akan bertahan.`,
        `${rules.tumpang} tiers, and the count is the standing of the person being carried: one, three, five, seven, nine, eleven. On a joglo the tumpang are a roof over a room and the rank is carried by what it shelters; here there is nothing under them but air, so the tiers are pure statement. A rumah gadang has its gonjong and a saoraja its timpa laja — but both are still there tomorrow. This one states standing in something built not to last.`,
      ),
      value: t(String(rules.tumpang), String(rules.tumpang)),
      unit: t('tingkat', 'tiers'),
    },
    {
      key: 'bale',
      title: t('Bangunan Bali kedua di sini, dan kebalikan yang pertama', 'The second Balinese building here, and the first one’s opposite'),
      body: t(
        'Bale diukur dalam satuan tubuh pemiliknya yang hidup dan berdiri — depa, hasta, musti — dan dimaksudkan bertahan lebih lama daripada orang itu. Bade diukur menurut berapa banyak orang yang dapat masuk ke bawahnya, dan dimaksudkan tidak bertahan lebih lama daripada siapa pun. Dua bangunan dari kebudayaan yang sama, dua cara tubuh manusia menjadi ukuran, dan dua jawaban yang berlawanan tentang untuk berapa lama.',
        'A bale is measured in units of its owner’s living, standing body — depa, hasta, musti — and is meant to outlast them. A bade is measured by how many people can get under it, and is meant to outlast nobody. Two buildings from the same culture, two ways a human body becomes a measure, and two opposite answers about how long for.',
      ),
      value: t('2', '2'),
      unit: t('bangunan Bali, dua arah', 'Balinese buildings, two directions'),
    },
  ]

  return {
    key: 'bade',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Bade', 'Bade'),
    subhead: t(
      `${rules.tumpang} tingkat · ${info.count} pemikul · tanpa pondasi`,
      `${rules.tumpang} tiers · ${info.count} bearers · no foundation`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = bearersCounterexample()
  const rows = (w: { slenderness: number; limit: number }): readonly Readout[] => [
    { label: t('tinggi per setengah lebar usungan', 'height per half-width of lattice'), value: w.slenderness.toFixed(2) },
    { label: t('batas', 'the limit'), value: w.limit.toFixed(2) },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tinggikan tiap tingkat dan tidak ada satu pun bagian yang gagal: jumlahnya tetap, menaranya tetap simetris, tetap menyempit ke atas, tidak ada yang menjorok keluar dari kisi. Yang habis adalah alasnya — besar usungan datang dari berapa banyak bahu yang dapat masuk ke bawahnya, dan tidak ada apa pun yang menghubungkannya dengan tinggi. Lewat satu titik, beratnya terlalu jauh di atas orang-orang yang memegangnya, dan menara yang paling banyak berkata adalah menara yang tidak dapat dibawa menyusuri jalan yang justru menjadi alasannya dibuat. Dua puluh tiga bangunan, dua puluh tiga aturan yang tidak dapat dijalankan sampai habis; yang ini satu-satunya yang gagal pada kerumunannya, bukan pada bahannya.',
      'Raise each tier and no member fails: the count is unchanged, the tower is still symmetric, still narrows upward, nothing reaches outboard of the lattice. What runs out is the base — the size of the lattice comes from how many shoulders can get under it, and nothing ties that to height. Past a point the weight is too far above the people holding it, and the tower that says the most is the one that cannot be carried down the road it was built for. Twenty-three buildings, twenty-three rules that cannot be carried out; this is the only one that fails at its crowd rather than at its material.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'bade',
    slug: 'bade',
    house: t('Bade', 'Bade'),
    people: t('Bali', 'The Balinese'),
    place: t('Gianyar dan sekitarnya, Bali', 'Gianyar and around, Bali'),
    about: t(
      'Bade adalah menara yang dipakai membawa jenazah ke setra untuk dibakar. Ia dibangun dalam beberapa minggu dari bambu, kayu, kain dan kertas; ia diangkat ke bahu puluhan orang; ia dibawa menyusuri jalan, diputar berkeliling di tiap perempatan supaya rohnya tidak menemukan jalan pulang, lalu dibakar bersama yang dibawanya. Tiga hal membuatnya layak dibangun di sini. Ia satu-satunya bangunan dalam kumpulan ini yang dibuat justru untuk dimusnahkan. Ia tidak punya pondasi sama sekali — yang menahannya adalah kisi bambu di atas bahu orang banyak, jadi satu-satunya syarat strukturnya adalah keseimbangan di atas mereka. Dan denahnya datang dari sebuah hitungan orang: berapa banyak yang dapat masuk ke bawahnya sekaligus. Matahari pada model ini dihitung untuk Gianyar, 8,54° LS dan 115,33° BT.',
      'A bade is the tower a body is carried to the cremation ground on. It is built in a few weeks out of bamboo, timber, cloth and paper; it is lifted onto the shoulders of dozens of people; it is carried down the road, turned about at every crossroads so the spirit cannot find its way home, and burned with what it carries. Three things make it worth building here. It is the only building in the collection made in order to be destroyed. It has no foundation at all — what holds it up is a bamboo lattice on a crowd’s shoulders, so its one structural requirement is balance over them. And its plan comes from a headcount: how many people can get underneath it at once. The sun in this model is computed for Gianyar, 8.54° S and 115.33° E.',
    ),
    caution: t(
      'Yang paling penting pada bade sesungguhnya tidak ada di sini. Sebuah bade adalah benda yang dihias habis-habisan: kepala boma, sayap, naga, kain prada, kertas emas, cermin kecil, dan wadah berbentuk lembu atau makhluk lain menurut kasta dan keluarga — dan justru semua itu yang membuat orang mengenalinya. Yang dibangun di sini hanya susunannya: kisi pemikul, badan, tumpukan tumpang yang menyempit, kain, payung. Alasannya sama seperti pada rumah-rumah lain, dan di sini bobotnya besar sekali. Selain itu: tingkat di sini kotak yang menyempit, sedangkan yang sesungguhnya bertingkat dengan tepi melengkung dan bertumpuk lebih rumit; hubungan tinggi dengan jumlah pemikul adalah penetapan penulis; tidak satu pun angka di sini berasal dari pengukuran, dan tidak akan pernah dengan cara yang biasa — bade yang dapat diukur hanyalah bade yang belum dipakai.',
      'The most important thing about a real bade is not here. A bade is an object decorated to the limit: a boma head, wings, nagas, prada cloth, gold paper, small mirrors, and a container in the form of a bull or another creature according to caste and family — and it is all of that which makes one recognisable. What is built here is only its structure: the carrying lattice, the body, the narrowing stack of tiers, cloth, an umbrella. The reason is the one the other packs give about ornament, and here it weighs very heavily. Beyond it: the tiers here are narrowing boxes where real ones have curved edges and a far more elaborate stack; the relation between height and the number of bearers is the author’s; and not one figure here comes from a measurement, and none ever will in the usual way — the only bade a surveyor could measure is one that has not been used yet.',
    ),
    orientation: t(
      'Bade tidak menghadap ke mana pun: ia dibawa. Model ini menaruh mukanya di −X, arah jalan yang dilaluinya, dan pertanyaan arah yang sesungguhnya bukan menghadap ke mana melainkan berjalan ke mana — menuju setra, yang di sebuah desa Bali terletak di kelod, arah yang menjauhi gunung. Tetap tidak ada kendali untuk memutar bangunan, meskipun bangunan inilah satu-satunya di sini yang memang diputar.',
      'A bade does not face anywhere: it is carried. This model puts its front on −X, the way it is going, and the real question of orientation is not what it faces but where it walks — to the cremation ground, which in a Balinese village lies kelod, away from the mountain. There is still no control that turns the building, though this is the one building here that genuinely is turned.',
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
          'Semuanya diikat. Tidak ada pasak dan tidak ada paku, sebab tidak ada yang perlu bertahan lebih lama daripada satu sore — dan sebab bangunan yang diikat dapat sedikit bergerak sewaktu dipikul di jalan yang tidak rata.',
          'Everything is lashed. There are no pegs and no nails, because nothing has to last longer than one afternoon — and because a lashed building can work a little while it is carried over uneven ground.',
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
