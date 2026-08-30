/**
 * The sudung, as the registry sees it.
 *
 * The twenty-ninth file of this shape, and the smallest thing the contract has
 * been handed. Fifteen parts, three joints, one slope of leaf — and the same
 * five answers as a four-storey palace, because the registry never asked how
 * much building there had to be.
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
  lamaInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { carryCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A family of six, standing a season, on a raised platform. */
const SHOWCASE: Rules = { orang: 6, lama: 'musim', panggung: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = lamaInfo(rules.lama)
  const needed = rules.orang * layout.body.shoulders + (rules.orang - 1) * layout.body.gap

  const readout: readonly Readout[] = [
    { label: t('Orang', 'People'), value: String(rules.orang) },
    { label: t('Lebar lantai', 'Width of the floor'), value: `${(layout.floor.halfZ * 2).toFixed(2)} m` },
    { label: t('Bagian terpanjang', 'Longest member'), value: `${layout.longest.toFixed(2)} m` },
    { label: t('Batas angkut', 'What can be carried'), value: `${layout.carry.toFixed(2)} m` },
    { label: t('Pasak dan paku', 'Pegs and nails'), value: '0' },
    { label: t('Bagian', 'Parts'), value: String(house.parts.length) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'melangun',
      title: t('Berakhir pada hari yang tidak dipilih siapa pun', 'It ends on a day nobody chooses'),
      body: t(
        'Ketika seseorang meninggal, keluarganya pergi dari tempat itu dan tidak kembali kepadanya: itulah melangun. Sudungnya tidak dibongkar, tidak dibakar, dan tidak diwariskan — ia ditinggalkan berdiri dan hutan yang menghabiskannya. Tiga bangunan lain dalam projek ini juga berakhir dan ketiganya berakhir karena keputusan: bade dibakar pada sore yang sudah ditentukan, rumah woloan dilepas pasaknya untuk dijual dan dipasang lagi, waruga dipahat justru supaya tidak pernah berpindah. Yang ini berakhir karena sebuah peristiwa, dan tidak ada yang tahu kapan.',
        'When somebody dies, their family leaves the place and does not return to it: that is melangun. The shelter is not dismantled, not burned and not inherited — it is left standing and the forest finishes it. Three other buildings in this project also end, and all three end by decision: a bade is burned on an appointed afternoon, a woloan house is unpegged to be sold and put up again, a waruga is cut precisely so that it never moves. This one ends because of an event, and nobody knows when.',
      ),
      value: t('0', '0'),
      unit: t('hari yang dapat direncanakan', 'days anybody can plan for'),
    },
    {
      key: 'tidur',
      title: t('Denahnya adalah barisan orang yang berbaring', 'Its plan is a row of sleeping bodies'),
      body: t(
        `${rules.orang} orang berbaring bersebelahan memerlukan ${needed.toFixed(2)} m, dan lantainya ${(layout.floor.halfZ * 2).toFixed(2)} m. Empat pak lain dalam projek ini mengukur tubuh manusia: pemilik bale yang berdiri, jenazah yang duduk berlipat di dalam waruga, tubuh yang tidak boleh muat lewat pintu bhaga, tubuh yang membungkuk masuk ume kbubu. Keempatnya mengukur tinggi. Yang ini satu-satunya yang mengukur lebar — dan satu-satunya ukuran tubuh di sini yang menetapkan denah.`,
        `${rules.orang} people lying side by side need ${needed.toFixed(2)} m, and the floor is ${(layout.floor.halfZ * 2).toFixed(2)} m. Four other packs in this project measure a human body: a bale’s standing owner, a waruga’s folded dead, a body that must not fit through a bhaga’s door, a body stooping into an ume kbubu. All four measure a height. This is the only one that measures a width — and the only body figure here that sets a plan.`,
      ),
      value: t(String(rules.orang), String(rules.orang)),
      unit: t('orang, berbaring bersebelahan', 'people, lying side by side'),
    },
    {
      key: 'angkut',
      title: t('Dibatasi oleh sebuah lengan dan satu sore', 'Bounded by an arm and an afternoon'),
      body: t(
        `Tidak ada yang digergaji, ditarik, atau dibeli: tiap batang ditebang di dekat tempat itu dan dibawa dengan tangan. Bagian terpanjang bangunan ini ${layout.longest.toFixed(2)} m terhadap ${layout.carry.toFixed(2)} m yang dapat diangkat orang. Rumah woloan dibatasi panjang bak truk, imah Baduy oleh sebatang kayu yang tidak boleh disambung; yang ini oleh apa yang dapat dipikul sendiri — batas terkecil dari ketiganya, dan yang paling cepat tercapai.`,
        `Nothing is sawn, hauled or bought: every pole is cut near the spot and carried by hand. The longest member here is ${layout.longest.toFixed(2)} m against the ${layout.carry.toFixed(2)} m a person can pick up. The woloan house is bounded by the length of a lorry, the Baduy imah by a pole that may not be spliced; this one by what somebody can carry themselves — the smallest of the three limits, and the soonest reached.`,
      ),
      value: t(layout.longest.toFixed(2), layout.longest.toFixed(2)),
      unit: t(`m, terhadap batas ${layout.carry.toFixed(2)} m`, `m, against a ${layout.carry.toFixed(2)} m limit`),
    },
    {
      key: 'lekat',
      title: t('Tidak ada yang dipasak, dipaku, atau ditanam', 'Nothing is pegged, nailed or buried'),
      body: t(
        `${info.glossId} Semua sambungannya ikatan rotan, tiangnya berdiri di atas tanah, dan tidak ada satu bahan pun yang tidak berdiri di hutan itu sejam sebelumnya. Alasannya bukan kesederhanaan: bangunan yang harus dapat ditinggalkan pada hari seseorang meninggal tidak boleh menyimpan apa pun yang membuat orang harus kembali mengambilnya.`,
        `${info.glossEn} Every joint is a rattan lashing, the poles stand on the ground, and not one material in it was anything but standing in that forest an hour before. The reason is not simplicity: a building that has to be walked away from on the day somebody dies cannot hold anything that would bring anybody back for it.`,
      ),
      value: t('0', '0'),
      unit: t('pasak, paku, atau tiang tertanam', 'pegs, nails or buried posts'),
    },
    {
      key: 'sumber',
      title: t('Tabel provenans terburuk dalam projek ini', 'The worst provenance table in this project'),
      body: t(
        'Tidak ada gambar ukur sudung dan agaknya tidak akan pernah ada. Sumber tentang Orang Rimba berbicara tentang bagaimana orang hidup dan berpindah, bukan tentang bagaimana mereka membangun — dan pergi mengukur tempat tidur sebuah keluarga bukan tindakan netral. Malige Buton masih berdiri di Baubau dan sudah diukur orang lain, jadi nol-nya paling mudah diperbaiki; nol yang ini paling sulit, dan bukan karena ada yang lalai.',
        'There is no measured drawing of a sudung and there is unlikely ever to be one. The sources on the Orang Rimba are about how people live and move rather than how they build — and going to measure a family’s sleeping place is not a neutral act. The Buton malige is still standing at Baubau and has already been measured by somebody, so its zero is the easiest here to fix; this one’s is the hardest, and not because anybody has been careless.',
      ),
      value: t('0', '0'),
      unit: t('gambar ukur yang ada di mana pun', 'measured drawings anywhere'),
    },
  ]

  return {
    key: 'rimba',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Sudung', 'Sudung'),
    subhead: t(
      `${rules.orang} orang · ${info.name.toLowerCase()} · ditinggalkan, bukan dibongkar`,
      `${rules.orang} people · ${info.name.toLowerCase()} · left, not taken down`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = carryCounterexample()
  const rows = (w: { longest: number; carry: number }): readonly Readout[] => [
    { label: t('bagian terpanjang', 'the longest member'), value: `${w.longest.toFixed(2)} m` },
    { label: t('yang dapat dibawa', 'what can be carried'), value: `${w.carry.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Memberi tiap orang sedikit lebih banyak ruang untuk tidur bukan kemewahan; itu hal pertama yang akan diubah sebuah keluarga berenam. Dan tidak ada bagian bangunan yang menjadi salah: ia tetap berdiri, atapnya tetap jatuh ke satu arah, lantainya tetap memuat semua orang, tidak ada yang dipasak atau ditanam, dan ia tetap selesai dalam satu sore. Yang patah adalah balok tepi di sisi depan: ia menjadi lebih panjang daripada yang dapat ditebang di dekat situ dan dibawa dengan tangan — jadi sudung yang lebih enak untuk tidur adalah sudung yang tidak dapat dibangun di tempat ia dibutuhkan.',
      'Giving everybody a little more room to sleep is not an indulgence; it is the first thing a family of six would change. And no part of the building becomes wrong: it still stands, the roof still falls one way, the floor still holds everybody, nothing is pegged or buried, and it still goes up in an afternoon. What breaks is the edge pole across the front — it is now longer than anything that can be cut nearby and carried by hand, so the shelter that would be better to sleep in is a shelter that cannot be built where it is needed.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'rimba',
    slug: 'rimba',
    house: t('Sudung', 'Sudung'),
    people: t('Orang Rimba', 'The Orang Rimba'),
    place: t('Bukit Duabelas, Jambi', 'Bukit Duabelas, Jambi'),
    about: t(
      'Sudung adalah tempat bernaung Orang Rimba di hutan Bukit Duabelas: satu bidang daun di atas rangka ringan, di atas lantai yang sedikit terangkat dari tanah, didirikan dalam satu sore dari apa yang ada dalam jangkauan tempat itu. Ia bukan rumah yang lebih kecil — ia adalah rumah bagi orang yang berpindah. Tiga hal membuatnya layak dibangun di sini. Ia berakhir karena sebuah peristiwa dan bukan karena keputusan: ketika seseorang meninggal, keluarganya pergi dan tidak kembali, dan sudungnya ditinggalkan berdiri. Denahnya adalah barisan orang yang berbaring bersebelahan — satu-satunya ukuran tubuh dalam projek ini yang menetapkan denah, bukan tinggi. Dan seluruh bangunannya dibatasi oleh apa yang dapat ditebang di dekat situ dan dipikul dengan tangan. Matahari pada model ini dihitung untuk Bukit Duabelas, 2,0° LS dan 102,6° BT.',
      'A sudung is an Orang Rimba shelter in the forest of Bukit Duabelas: a single sheet of leaf on a light frame, over a floor just off the ground, put up in an afternoon out of whatever is within reach of the spot. It is not a smaller house — it is what a house is for people who move. Three things make it worth building here. It ends because of an event rather than a decision: when somebody dies, the family leaves and does not return, and the shelter is left standing. Its plan is a row of people lying side by side — the only body figure in this project that sets a plan rather than a height. And the whole building is bounded by what can be cut nearby and carried by hand. The sun in this model is computed for Bukit Duabelas, 2.0° S and 102.6° E.',
    ),
    caution: t(
      'Pak ini yang paling tipis sumbernya dalam seluruh kumpulan, dan itu perlu dibaca lebih dulu. Tidak ada gambar ukur sudung yang diterbitkan; sumber tentang Orang Rimba berbicara tentang cara hidup dan perpindahan, bukan tentang ukuran bangunan. Tiap meter di sini tafsiran penulis. Selain itu: bentuk sudung sangat beragam menurut keperluan dan lamanya, dan yang dibangun di sini bentuk pokoknya; barang-barang yang dibawa keluarga tidak dimodelkan; larangan dan aturan seloko yang mengatur banyak hal tentang tempat dan arah tidak dapat diperiksa oleh model mana pun; dan penting dikatakan bahwa Orang Rimba adalah orang yang hidup sekarang, di hutan yang menyusut cepat — bangunan ini bukan peninggalan, dan halaman ini bukan catatan tentang masa lalu.',
      'This is the thinnest-sourced pack in the whole collection, and that should be read first. There is no published measured drawing of a sudung; the sources on the Orang Rimba are about ways of living and moving rather than about the dimensions of buildings. Every metre here is the author’s reading. Beyond that: sudung vary a great deal with purpose and length of stay, and what is built here is the basic form; what a family carries with them is not modelled; the prohibitions and seloko that govern much about place and direction cannot be checked by any model; and it matters to say that the Orang Rimba are living people, in a forest that is shrinking fast — this building is not a survival, and this page is not a record of the past.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin dalam pak ini. Yang menentukan arahnya adalah tempat itu sendiri: ke mana atapnya harus menghadap agar hujan tidak masuk, dan di mana ada tanah datar. Model ini menaruh sisi tinggi atap di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule in this pack. What sets its direction is the spot itself: which way the roof has to face so the rain stays out, and where the ground is level. This model puts the high side of the roof at −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Ikatan rotan, dan itu satu-satunya sambungan di sini. Tidak ada pasak dan tidak ada paku — bukan karena sederhana, melainkan karena bangunan ini harus dapat ditinggalkan tanpa ada yang tertinggal berharga di dalamnya.',
          'A rattan lashing, and it is the only joint here. There is no peg and no nail — not out of simplicity, but because this building has to be able to be left with nothing valuable held inside it.',
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
