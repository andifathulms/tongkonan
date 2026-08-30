/**
 * The uma, as the registry sees it.
 *
 * The thirtieth file of this shape, and the one where the interesting question
 * is not what the contract can hold but what a model can *say*.
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
  serambiInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { spanCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Seven households, both verandas, and the board hanging in the front one. */
const SHOWCASE: Rules = { keluarga: 7, serambi: 'depan-belakang', jaraik: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = serambiInfo(rules.serambi)

  const readout: readonly Readout[] = [
    { label: t('Rumah tangga', 'Households'), value: String(rules.keluarga) },
    { label: t('Bagian tiap keluarga', 'Each share'), value: `${(layout.households[0]?.share ?? 0).toFixed(2)} m` },
    { label: t('Panjang', 'Length'), value: `${(layout.halfZ * 2).toFixed(1)} m` },
    { label: t('Serambi', 'Verandas'), value: String(info.count) },
    { label: t('Kepala', 'Chiefs'), value: '0' },
    { label: t('Catatan bersama', 'Shared records'), value: rules.jaraik ? '1' : '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'kepala',
      title: t('Tidak ada kepala, dan itu tidak dapat diperiksa', 'There is no chief, and that cannot be checked'),
      body: t(
        'Rimata memimpin upacara dan tidak memerintah; keputusan diambil bersama di serambi depan, kadang berhari-hari. Tidak ada rumah tangga yang mendapat bagian lebih besar, tempat lebih baik, tempat duduk yang ditinggikan, atau ujung sendiri. Dan justru inilah masalahnya: bangunan yang memang tidak berjenjang dan bangunan yang jenjangnya tidak dimodelkan adalah model yang persis sama. Pak ini memeriksa yang dapat diperiksa — bagian yang sama besar, muka yang terbuka, satu catatan milik bersama — dan menyatakan sisanya sebagai pernyataan, bukan putusan. Larangan pada imah Baduy dan lantai berjenjang pada malige Buton sudah menyentuh dinding yang sama; ini yang pertama dengan hal tak terperiksa itu sebagai pokoknya.',
        'The rimata leads ritual and does not command; decisions are taken together on the front veranda, sometimes over days. No household gets a larger share, a better place, a raised seat, or an end of its own. And that is the difficulty: a building that genuinely has no rank and a building whose rank nobody modelled are exactly the same model. This pack checks what can be checked — equal shares, an open front, one record held in common — and states the rest as a claim rather than a verdict. The Baduy prohibitions and the Buton ranked floors met the same wall; this is the first entry with the uncheckable thing at its centre.',
      ),
      value: t('0', '0'),
      unit: t('kepala, dan tidak ada pemeriksaan untuk itu', 'chiefs, and no check for it'),
    },
    {
      key: 'jenjang',
      title: t('Berjenjang menurut kegiatan, bukan menurut orang', 'Graded by activity, not by person'),
      body: t(
        `Ruangnya berjenjang dari depan ke belakang: serambi terbuka menghadap sungai, ruang dalam dengan ${rules.keluarga} perapian, lalu serambi belakang tempat perempuan bekerja. Rumah limas Palembang berjenjang pada arah yang sama, dan di sana tempat duduk seorang tamu pada urutan itu adalah kedudukannya. Potongan yang sama, dua pernyataan yang berlawanan — dan kalau dua bangunan dengan bentuk yang sama dapat mengatakan hal yang berlawanan, maka bentuk saja tidak pernah cukup untuk membacanya.`,
        `The space is graded front to back: an open veranda facing the river, a closed room with ${rules.keluarga} hearths, then a back veranda where the women work. A Palembang rumah limas is graded along the same axis, and there where a guest is seated on that sequence is their standing. The same section, two opposite claims — and if two buildings of the same shape can say opposite things, then a shape on its own is never enough to read one by.`,
      ),
      value: t(String(info.count + 1), String(info.count + 1)),
      unit: t('jenjang, dari sungai ke belakang', 'grades, from the river inward'),
    },
    {
      key: 'jaraik',
      title: t('Satu catatan, milik seluruh rumah', 'One record, belonging to the whole house'),
      body: t(
        rules.jaraik
          ? 'Jaraik tergantung di serambi depan, membawa catatan perburuan uma itu. Behu di halaman rumah Nias mencatat pesta satu rumah tangga; timpa laja pada muka saoraja Bugis mencatat kedudukan satu rumah tangga. Yang ini tidak mencatat siapa-siapa secara khusus, dan tempatnya di ruang yang paling terbuka, bukan di bagian rumah tangga mana pun.'
          : 'Rumah ini tidak memasang jaraik, dan tidak ada penggantinya di bagian rumah tangga mana pun. Yang penting bukan adanya papan itu melainkan bahwa ketika ada, ia milik seluruh rumah — dan ketika tidak ada, ketiadaannya juga milik semua.',
        rules.jaraik
          ? 'The jaraik hangs in the front veranda, carrying the record of what this uma has hunted. A behu in a Nias yard records one household’s feast; a timpa laja on the face of a Bugis saoraja records one household’s rank. This one records nobody in particular, and it hangs in the most open room rather than in anybody’s share.'
          : 'This house carries no jaraik, and nothing stands in for one inside any household’s share. What matters is not that the board is there but that when it is, it belongs to the whole house — and when it is not, the absence belongs to everybody too.',
      ),
      value: t(rules.jaraik ? '1' : '0', rules.jaraik ? '1' : '0'),
      unit: t('catatan, dan tidak ada yang perorangan', 'records, and none of them anybody’s'),
    },
    {
      key: 'lantai',
      title: t('Lantai yang harus melenting', 'A floor that has to spring'),
      body: t(
        `Serambi depan dipakai menari turuk, jadi lantainya papan di atas gelagar tanpa tumpuan di tengah bentang: ${layout.span.clear.toFixed(2)} m antar gelagar terhadap ${layout.span.plank.toFixed(2)} m yang dapat diseberangi sebilah papan. Ini satu-satunya angka dalam pak ini yang datang dari apa yang dilakukan orang di atas lantainya, dan satu-satunya yang dapat gagal.`,
        `The front veranda is danced on for turuk, so its floor is planks over bearers with nothing under the middle of a span: ${layout.span.clear.toFixed(2)} m between bearers against the ${layout.span.plank.toFixed(2)} m a split plank crosses. It is the only figure in this pack that comes from what people do on the floor, and the only one that can fail.`,
      ),
      value: t(layout.span.clear.toFixed(2), layout.span.clear.toFixed(2)),
      unit: t(`m antar gelagar, dari ${layout.span.plank.toFixed(2)} m`, `m between bearers, of ${layout.span.plank.toFixed(2)} m`),
    },
    {
      key: 'sungai',
      title: t('Mukanya menghadap jalan, dan jalannya adalah sungai', 'Its front faces the road, and the road is a river'),
      body: t(
        'Orang datang dengan perahu dan naik langsung ke serambi depan, yang memang tidak berdinding. Rumah betang Dayak juga berdiri di tepi sungai dan maksudnya berbeda: di sana sungai mengalir melewati kampung yang berbaris di tepinya. Di sini sungai itulah jalannya, dan yang menghadapnya adalah ruang tempat siapa pun boleh berada.',
        'People arrive by canoe and step straight up onto the front veranda, which is why it has no walls. A Dayak betang also stands on a river bank and means something different: there a river runs past a village strung along it. Here the river is the street, and what faces it is the room anybody may be in.',
      ),
      value: t(DIMS.riverWidth.value.toFixed(0), DIMS.riverWidth.value.toFixed(0)),
      unit: t('m sungai di depan serambi', 'm of river in front of the veranda'),
    },
  ]

  return {
    key: 'mentawai',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Uma', 'Uma'),
    subhead: t(
      `${rules.keluarga} rumah tangga · bagian yang sama · tanpa kepala`,
      `${rules.keluarga} households · equal shares · no chief`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = spanCounterexample()
  const rows = (w: { clear: number; plank: number }): readonly Readout[] => [
    { label: t('jarak antar gelagar', 'space between bearers'), value: `${w.clear.toFixed(2)} m` },
    { label: t('bentang sebilah papan', 'what a plank crosses'), value: `${w.plank.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Menjarangkan gelagar justru yang diinginkan lantai ini. Serambinya dipakai menari: turuk menghendaki lantai panjang tanpa penghalang dan lentingan yang banyak, dan gelagar yang lebih jarang memberi keduanya. Tidak ada bagian lain yang keberatan — tiangnya tetap memikul, bagian tiap rumah tangga tetap sama, mukanya tetap terbuka, atapnya tetap menutupi seluruh panjangnya. Yang habis adalah papannya: lewat satu titik sebilah papan belah tidak lagi menyeberangi jarak antar gelagar, dan lantai yang melenting sudah menjadi lantai yang patah — peristiwa yang sama bagi semua orang yang berdiri di atasnya, dan sangat berbeda sesudahnya.',
      'Standing the bearers further apart is what this floor wants. Its veranda is danced on: turuk asks for a long clear floor with plenty of spring in it, and fewer bearers give both. No other part objects — the posts still carry, every household’s share is still equal, the front is still open, the roof still covers the whole length. What runs out is the plank: past a point a split board no longer crosses from one bearer to the next, and a floor that springs has become a floor that gives way — the same event for everybody standing on it, and a very different one afterwards.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'mentawai',
    slug: 'mentawai',
    house: t('Uma', 'Uma'),
    people: t('Mentawai', 'The Mentawai'),
    place: t('Siberut, Kepulauan Mentawai', 'Siberut, in the Mentawai Islands'),
    about: t(
      'Uma di Siberut adalah rumah panjang di atas tiang kayu ulin: serambi terbuka di depan menghadap sungai, ruang dalam dengan satu perapian untuk tiap rumah tangga, dan serambi kedua di belakang. Uma juga nama kelompok yang tinggal di dalamnya. Tidak ada kepala: rimata memimpin upacara dan tidak memerintah, dan keputusan diambil bersama di serambi depan. Itulah alasan bangunan ini dibangun di sini — dan sekaligus persoalan yang harus dinyatakan terus terang, sebab bangunan yang memang tidak berjenjang dan bangunan yang jenjangnya tidak dimodelkan adalah model yang sama. Yang dapat diperiksa diperiksa; sisanya dinyatakan. Hal kedua: ruangnya berjenjang dari depan ke belakang seperti rumah limas Palembang, tetapi jenjangnya mengikuti apa yang dikerjakan, bukan siapa yang mengerjakan. Matahari pada model ini dihitung untuk Muara Siberut, 1,6° LS dan 99,15° BT: titik paling barat kedua dalam kumpulan ini.',
      'An uma on Siberut is a long house on ironwood posts: an open veranda at the front facing the river, a closed room with one hearth for each household, and a second veranda behind. Uma is also the name of the group that lives in it. There is no chief: the rimata leads ritual and does not command, and decisions are taken together on the front veranda. That is why this building is here — and it is also a difficulty that has to be said plainly, because a building that genuinely has no rank and a building whose rank nobody modelled are the same model. What can be checked is checked; the rest is stated. The second thing: the space is graded front to back like a Palembang rumah limas, but the grade follows what is being done rather than who is doing it. The sun in this model is computed for Muara Siberut, 1.6° S and 99.15° E: the second-westernmost site in the collection.',
    ),
    caution: t(
      'Ukiran dan patungnya adalah bagian besar dari uma yang sesungguhnya dan tidak ada di sini: jaraik dibangun sebagai papan polos, padahal justru ukiran itulah bendanya. Tidak dimodelkan, dengan alasan yang sama seperti pada pak-pak lain. Selain itu: perapian di sini disusun berjarak sama di sepanjang ruang dalam, dan susunan yang sesungguhnya berbeda-beda antar uma; pembagian serambi depan menjadi bagian-bagian dengan aturan tersendiri tidak dibangun; tengkorak binatang yang tergantung pada jaraik tidak dimodelkan; dan tiap meter dalam pak ini tafsiran penulis atas uraian etnografi, bukan hasil pengukuran. Perlu ditambahkan bahwa keterangan lama tentang orang Mentawai banyak yang keliru atau merendahkan, dan bahwa orang Mentawai adalah orang yang hidup sekarang, bukan bahan perbandingan.',
      'Carving and figures are a large part of a real uma and are not here: the jaraik is built as a plain board when the carving is the thing itself. Not modelled, for the reason the other packs give. Beyond that: the hearths here are ranged at an even spacing down the closed room, and real arrangements differ from uma to uma; the divisions of the front veranda and the rules attached to them are not built; the animal skulls on the jaraik are not modelled; and every metre here is the author’s reading of ethnographic description rather than a measurement. It should be added that much older writing about the Mentawai is wrong or demeaning, and that the Mentawai are living people rather than a comparison.',
    ),
    orientation: t(
      'Mukanya menghadap sungai, sebab sungai adalah jalannya. Tidak ada aturan mata angin: yang menentukan arah adalah tepi air. Model ini menaruh serambi depan di −Z dan membentangkan bubungan pada sumbu itu. Tetap tidak ada kendali untuk memutar bangunan.',
      'Its front faces the river, because the river is the road. There is no compass rule: what sets the direction is the water’s edge. This model puts the front veranda at −Z and runs the ridge along that axis. There is still no control that turns the building.',
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
          'Pasak kayu, dan kaki tiang duduk pada cekungan di batunya sendiri. Tidak ada besi, dan tidak ada yang ditanam: di pulau yang sering bergempa, rangka yang hanya berdiri di atas batu dapat bergeser tanpa patah.',
          'A timber peg, and each post’s foot sits in a hollow in its own stone. There is no iron and nothing is buried: on an island that shakes, a frame that only stands on stones can shift without breaking.',
        ),
      },
      {
        kind: 'tali',
        name: t('Tali', 'Lashing'),
        gloss: t(
          'Ikatan rotan yang menahan daun sagu dan menggantungkan jaraik pada atapnya.',
          'A rattan lashing holding the sago leaf down and hanging the jaraik from the roof.',
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
