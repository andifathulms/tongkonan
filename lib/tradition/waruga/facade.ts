/**
 * The waruga, as the registry sees it.
 *
 * The twenty-second file of this shape, and the one that shows how far the
 * neutral contract stretches: the registry asks for a house, a scene model, a
 * timeline, verdicts and provenance, and a stone box for the dead answers all
 * five without a word of special pleading. What the registry never asked is
 * whether anybody lives in it.
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
  tutupInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { blockCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A whole family, under a hipped lid, straight on the ground. */
const SHOWCASE: Rules = { jumlah: 6, tutup: 'limas', alas: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = tutupInfo(rules.tutup)

  const readout: readonly Readout[] = [
    { label: t('Di dalamnya', 'Inside it'), value: String(rules.jumlah) },
    { label: t('Tinggi ruang', 'Chamber height'), value: `${layout.chamber.height.toFixed(2)} m` },
    { label: t('Dipahat dari blok', 'Cut from a block'), value: `${layout.block.height.toFixed(2)} m` },
    { label: t('Blok terbesar', 'The largest block'), value: `${layout.blockLimit.toFixed(2)} m` },
    { label: t('Bahan', 'Materials'), value: '1' },
    { label: t('Pintu dan jendela', 'Doors and windows'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'mati',
      title: t('Bangunan ini bukan untuk yang hidup', 'This building is not for the living'),
      body: t(
        'Dua puluh satu bangunan lain dalam projek ini untuk orang yang tinggal di dalamnya, untuk padi yang disimpan di dalamnya, atau untuk musyawarah yang diadakan di dalamnya. Yang ini tidak dimasuki siapa pun dan tidak dipakai untuk apa pun. Tutupnya diangkat ketika ada yang meninggal, orang itu diletakkan di dalam dalam keadaan duduk, dan tutupnya diletakkan kembali. Registri projek ini tidak pernah menanyakan apakah ada yang tinggal di dalam sebuah bangunan, dan karena itu ia menerima yang ini tanpa satu pun pengecualian.',
        'The other twenty-one buildings in this project are for the people who live in them, the rice kept in them, or the council held in them. Nobody enters this one and it is used for nothing. The lid is lifted when somebody dies, they are put inside seated, and the lid is put back. This project’s registry never asked whether anybody lives in a building, which is why it took this one without a single exception.',
      ),
      value: t('0', '0'),
      unit: t('orang yang masuk ke dalamnya', 'people who go inside it'),
    },
    {
      key: 'tubuh',
      title: t('Diukur menurut tubuh yang tidak akan berdiri lagi', 'Measured by a body that will not stand again'),
      body: t(
        `Bale Bali diukur dalam satuan tubuh pemiliknya: depa, hasta, musti — diambil dari orang yang hidup dan berdiri. Ruang ini diukur menurut tubuh yang duduk berlipat: ${layout.body.depth.toFixed(2)} m dari punggung ke lutut, ${layout.body.width.toFixed(2)} m di bahu, ${layout.body.seated.toFixed(2)} m sampai ubun-ubun, ditambah ruang sisa karena peti yang pas persis adalah peti yang tidak dapat diisi. Asas yang sama, peristiwa yang lain sama sekali — dan kunci sumber yang sama, supaya “bukan dari buku tentang tempat ini” terlihat pada keduanya.`,
        `A Balinese bale is measured in units of its owner’s body: depa, hasta, musti — taken from a living person standing up. This chamber is measured against a body seated and folded: ${layout.body.depth.toFixed(2)} m back to knee, ${layout.body.width.toFixed(2)} m across the shoulders, ${layout.body.seated.toFixed(2)} m to the crown, plus clearance, because a box that fits exactly is a box nothing can be put into. The same principle on an entirely different occasion — and the same source key, so that “not from a book about this place” shows on both.`,
      ),
      value: t(layout.chamber.height.toFixed(2), layout.chamber.height.toFixed(2)),
      unit: t('m tinggi ruang', 'm of chamber'),
    },
    {
      key: 'keluarga',
      title: t('Dipahat untuk orang yang belum meninggal', 'Cut for people who have not died yet'),
      body: t(
        `Satu peti menampung beberapa orang dari satu keluarga, ditambahkan selama beberapa keturunan — jadi batunya harus dipilih pada hari pertama untuk orang-orang yang saat itu masih hidup. Rumah betang memanjang satu bilik tiap kali sebuah rumah tangga bertambah, dan pertambahannya terlihat dari luar; yang ini bertambah ke atas di dalam batu yang sudah dipahat, dan tidak ada yang dapat dilihat dari luar sama sekali. Sekarang: ${rules.jumlah} orang, peti setinggi ${layout.block.height.toFixed(2)} m.`,
        `One box holds several of a family, added over generations — so the stone has to be chosen on the first day for people who are alive at the time. A rumah betang lengthens by a room each time a household is added and the growth is plain from outside; this one grows upward inside stone that was already cut, and nothing can be seen from outside at all. Currently: ${rules.jumlah} people, a ${layout.block.height.toFixed(2)} m box.`,
      ),
      value: t(String(rules.jumlah), String(rules.jumlah)),
      unit: t('orang di dalam satu peti', 'people in one box'),
    },
    {
      key: 'batu',
      title: t('Satu bahan, dan itu daftar terpendek dalam projek ini', 'One material, and it is the shortest list in the project'),
      body: t(
        'Setiap pak lain di sini punya empat atau lima bahan: kayu, papan, atap, batu di bawah tiangnya. Pak ini punya satu. Peti dan tutupnya dipahat dari satu blok — tanpa kayu, tanpa ikat, tanpa paku, dan tanpa sambungan antara dua benda kecuali tutup yang duduk pada takiknya. Itu juga sebabnya bangunan ini tidak akan berpindah, dan itulah kebalikan sempurna dari rumah woloan, yang dibuat oleh orang yang sama untuk dibongkar dan diangkut.',
        'Every other pack here has four or five materials: a timber, a board, a thatch, stone under the posts. This one has one. The box and its lid are cut from a single block — no timber, no lashing, no iron, and no joint between two things except the lid sitting in its rebate. It is also why this building will never move, which is the exact opposite of the woloan house that the same people build to be taken apart and carried away.',
      ),
      value: t('1', '1'),
      unit: t('bahan', 'material'),
    },
    {
      key: 'utara',
      title: t('Menghadap utara, dan bukan karena alasan tongkonan', 'Facing north, and not for the tongkonan’s reason'),
      body: t(
        `${info.glossId} Muka itu menghadap utara, arah tempat leluhur dikatakan datang. Tongkonan juga menghadap utara dan alasannya lain sama sekali — dua bangunan dengan aturan mata angin yang sama dan dua alasan yang tidak berhubungan, yang mengingatkan bahwa yang menarik dari sebuah aturan bukan angkanya melainkan dari mana ia datang.`,
        `${info.glossEn} That face looks north, the direction the ancestors are said to have come from. The tongkonan also faces north for an entirely different reason — two buildings with the same compass rule and two unrelated reasons, which is a reminder that what is interesting about a rule is not its number but where it came from.`,
      ),
      value: t(info.name, info.name),
      unit: t('bentuk tutup', 'form of the lid'),
    },
  ]

  return {
    key: 'waruga',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Waruga', 'Waruga'),
    subhead: t(
      `${rules.jumlah} orang · satu batu · tanpa jalan masuk`,
      `${rules.jumlah} people · one stone · no way in`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = blockCounterexample()
  const rows = (w: { cut: number; block: number }): readonly Readout[] => [
    { label: t('tinggi peti', 'height of the box'), value: `${w.cut.toFixed(2)} m` },
    { label: t('blok terbesar', 'the largest block'), value: `${w.block.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Beri tiap orang berikutnya sedikit lebih banyak ruang dan tidak ada yang salah pada bangunannya: ruangnya tetap menerima tubuh yang duduk, tutupnya tetap pas, mukanya tetap menghadap utara, dindingnya tetap menutup. Yang terjadi adalah seluruhnya tidak lagi keluar dari satu batu — dan waruga dipahat dari satu batu, tidak pernah disambung. Imah Baduy berbenturan dengan panjang sebatang kayu dan rumah woloan dengan panjang bak truk; yang ini berbenturan dengan besar sebuah blok, dan yang membawanya ke sana adalah satu-satunya hal yang tidak dapat direncanakan siapa pun: berapa banyak orang dalam sebuah keluarga yang ternyata ada.',
      'Give each further person a little more room and nothing about the building goes wrong: the chamber still takes a seated body, the lid still fits, the face still looks north, the walls still close. What happens is that the whole thing no longer comes out of one stone — and a waruga is cut from one stone, never jointed. The Baduy house runs into the length of a pole and the woloan house into the length of a lorry; this one runs into the size of a block, and what takes it there is the one thing nobody can plan for: how many of a family there turn out to be.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'waruga',
    slug: 'waruga',
    house: t('Waruga', 'Waruga'),
    people: t('Minahasa', 'The Minahasa'),
    place: t('Airmadidi dan Sawangan, Minahasa Utara', 'Airmadidi and Sawangan, North Minahasa'),
    about: t(
      'Waruga adalah makam batu Minahasa: sebuah peti dengan ruang di dalamnya dan tutup berbentuk atap. Orang yang meninggal diletakkan di dalam dalam keadaan duduk, menghadap utara, dan anggota keluarga berikutnya ditambahkan ke peti yang sama selama beberapa keturunan. Yang membuatnya layak dibangun di sini ada tiga. Ia bukan untuk yang hidup — satu-satunya dalam kumpulan ini. Ruangnya diukur menurut tubuh yang duduk berlipat, seperti bale Bali diukur menurut tubuh pemiliknya yang berdiri. Dan ia dipahat dari satu batu, tanpa bahan kedua dan tanpa sambungan, yang menjadikannya kebalikan sempurna dari rumah woloan yang dibuat orang yang sama untuk dibongkar dan diangkut pergi. Matahari pada model ini dihitung untuk Airmadidi, 1,4° LU dan 124,98° BT.',
      'A waruga is a Minahasa stone tomb: a box with a chamber in it and a roof-shaped lid. The dead were placed inside seated, facing north, and the next of the family were added to the same box over generations. Three things make it worth building here. It is not for the living — the only one in the collection. Its chamber is measured against a body seated and folded, as a Balinese bale is measured against its owner’s standing body. And it is cut from a single stone with no second material and no joint, which makes it the exact opposite of the woloan house the same people build to be taken apart and carried away. The sun in this model is computed for Airmadidi, 1.4° N and 124.98° E.',
    ),
    caution: t(
      'Yang paling penting pada waruga sesungguhnya tidak ada di sini: ukirannya. Muka batu itu diukir dengan apa yang dikerjakan orang itu semasa hidup — nelayan, bidan, tentara, guru — dan justru catatan itulah yang membuat batu-batu ini masih dapat dibaca sampai sekarang. Ia tidak dimodelkan, karena alasan yang sama seperti pada rumah-rumah lain, dan ketiadaannya jauh lebih besar di sini daripada di mana pun dalam kumpulan ini. Selain itu: bentuk waruga sangat beragam dan yang dibangun di sini bentuk umumnya; ruangnya di sini disusun sebagai empat dinding dan sebuah dasar, sedangkan yang sesungguhnya dipahat sebagai lubang di dalam satu blok; barisan waruga di kompleks Sawangan dan Airmadidi adalah pemindahan abad terakhir dan bukan aturan adat; dan tidak satu pun angka di sini berasal dari pengukuran, meskipun bangunan inilah satu-satunya dalam projek ini yang ratusan contohnya masih berdiri dan dapat diukur besok pagi.',
      'The most important thing about a real waruga is not here: the carving. The face of the stone is cut with what the person did in life — fisherman, midwife, soldier, teacher — and it is that record which makes these stones still readable today. It is not modelled, for the reason the other packs give about carving, and the absence weighs far more here than anywhere else in the collection. Beyond it: waruga vary widely and what is built here is the common form; the chamber is assembled as four walls and a floor where a real one is cut as a hollow in a single block; the ranks of waruga at Sawangan and Airmadidi are a removal of the last century rather than a rule of the tradition; and not one figure here comes from a measurement, though this is the one building in the project of which hundreds of examples still stand and could be measured tomorrow.',
    ),
    orientation: t(
      'Muka menghadap utara, arah tempat leluhur dikatakan datang, dan orang yang di dalamnya menghadap ke arah yang sama. Tongkonan juga menghadap utara, karena alasan Toraja sendiri; dua bangunan dengan aturan yang sama bunyinya dan dua alasan yang tidak berhubungan. Model ini menaruh muka di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The face looks north, the direction the ancestors are said to have come from, and the person inside faces the same way. The tongkonan also faces north, for Toraja’s own reason; two buildings with the same rule by sound and two unrelated reasons for it. This model puts the face on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tumpang',
        name: t('Tumpang', 'Seated lid'),
        gloss: t(
          'Tutup duduk pada takik yang dipahat untuknya, dan diangkat lagi setiap kali ada yang meninggal. Ini satu-satunya sambungan pada bangunan ini dan satu-satunya bukaannya sekaligus.',
          'The lid sits in a rebate cut for it, and is lifted again at each death. It is this building’s only joint and its only opening at once.',
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
