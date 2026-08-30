/**
 * The ammu hawu, as the registry sees it.
 *
 * The thirty-first file of this shape, and the first whose central check is
 * settled by comparing it with another tradition's building — which the packs
 * cannot do to each other and a test can.
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
  atapInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { hullCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A long hull, thatched in lontar, with the loft built. */
const SHOWCASE: Rules = { ruang: 7, atap: 'lontar', duru: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = atapInfo(rules.atap)
  const clear = layout.eaveY - layout.floorY

  const readout: readonly Readout[] = [
    { label: t('Ruang', 'Bays'), value: String(rules.ruang) },
    { label: t('Panjang', 'Length'), value: `${(layout.halfZ * 2).toFixed(2)} m` },
    { label: t('Lebar lambung', 'Beam'), value: `${(layout.halfX * 2).toFixed(2)} m` },
    { label: t('Panjang : lebar', 'Length : beam'), value: `${layout.ratio.actual.toFixed(2)} : 1` },
    { label: t('Celah masuk', 'The way in'), value: `${clear.toFixed(2)} m` },
    { label: t('Dinding', 'Wall'), value: `${clear.toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'perahu',
      title: t('Rumah yang disebut perahu, dan diuji sebagai perahu', 'A house called a boat, and tested as one'),
      body: t(
        `Di Rai Hawu rumah dibangun dan disebut sebagai perahu: bubungannya lunas, ujungnya haluan dan buritan, keluarganya awaknya. Tradisi yang menyebut rumahnya perahu sedang membuat pernyataan, dan pernyataan itu dapat tentang kata atau tentang bentuk. Sebelas bangunan yang lalu projek ini memodelkan lambung sungguhan — lepa Bajau — jadi pertanyaannya punya jawaban: denah ini ${layout.ratio.actual.toFixed(2)} : 1, di dalam rentang ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)} yang dipegang lambung perahu. Uji itu dijalankan di dalam pengujian pak ini terhadap angka lepa yang sebenarnya, sebab satu pak tidak boleh mengimpor pak lain dan satu pengujian boleh.`,
        `On Rai Hawu a house is built and spoken of as a boat: its ridge a keel, its ends a bow and a stern, its family a crew. A tradition that calls its house a boat is making a claim, and the claim can be about words or about shape. Eleven buildings ago this project modelled an actual hull — the Bajau lepa — so the question has an answer: this plan is ${layout.ratio.actual.toFixed(2)} : 1, inside the ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)} range a hull holds. That comparison runs in this pack’s tests against the lepa’s own numbers, because one pack may not import another and a test may.`,
      ),
      value: t(layout.ratio.actual.toFixed(2), layout.ratio.actual.toFixed(2)),
      unit: t('panjang untuk tiap satu lebar', 'long for every one across'),
    },
    {
      key: 'ujung',
      title: t('Kedua ujungnya tidak dapat ditukar', 'The two ends cannot be swapped'),
      body: t(
        `Tiang haluan lebih besar daripada tiang lain dan tempatnya tetap; buritannya berdiri ${DIMS.sternRise.value.toFixed(2)} m di atas lunas. Karena itu bangunan ini sengaja tidak simetris pada arah panjangnya — dan melintangnya simetris, persis seperti lambung perahu. Ini satu-satunya pemeriksaan dalam projek ini yang berhasil justru ketika sebuah simetri gagal.`,
        `The bow post is larger than the others and its place is fixed; the stern stands ${DIMS.sternRise.value.toFixed(2)} m above the keel. So this building is deliberately asymmetric along its length — and symmetric across it, exactly as a hull is. It is the only check in the project that succeeds precisely when a symmetry fails.`,
      ),
      value: t('2', '2'),
      unit: t('ujung, dan keduanya berbeda', 'ends, and they differ'),
    },
    {
      key: 'dinding',
      title: t('Atapnya adalah dindingnya', 'The roof is the wall'),
      body: t(
        `Atapnya turun sampai ${clear.toFixed(2)} m di atas lantai, jadi yang pada dua puluh delapan bangunan lain menjadi dinding di sini adalah bagian bawah atap, dan jalan masuknya celah yang ditinggalkan di bawah tritisan di ujung haluan. Dari situ pula batasnya datang: tepi atap turun mengikuti lebar lambung, jadi yang menentukan tinggi celah masuk bukan pintunya melainkan seberapa lebar rumahnya dibuat.`,
        `The roof comes down to ${clear.toFixed(2)} m above the floor, so what is a wall on the other twenty-eight buildings here is the lower part of this roof, and the way in is a gap left under the eave at the bow. That is also where its limit comes from: the eave falls with the beam, so what sets the height of the way in is not the door but how wide the house was made.`,
      ),
      value: t(clear.toFixed(2), clear.toFixed(2)),
      unit: t('m dinding, dan sisanya atap', 'm of wall, and the rest is roof'),
    },
    {
      key: 'lontar',
      title: t('Atap dari pohon yang menghidupi pulaunya', 'A roof from the tree the island lives on'),
      body: t(
        `${info.glossId} ${rules.duru ? 'Duru di atas ruang dalam adalah tempat gula dan simpanan itu digantung — atap lontar di atas simpanan gula lontar.' : 'Rumah ini tidak memasang duru, jadi simpanannya ada di tempat lain; pohonnya tetap yang sama.'} Pohon-pohon lontar yang disadap berdiri mengelilingi halaman dan tidak digambar, sebab projek ini tidak menggambar tumbuhan mana pun. Di pulau ini ketiadaan itu lebih terasa daripada di tempat lain.`,
        `${info.glossEn} ${rules.duru ? 'The duru over the inner room is where the syrup and the stores hang — a lontar roof over a store of lontar syrup.' : 'This house carries no duru, so the stores are elsewhere; the tree is the same one.'} The tapped lontar palms stand around the yard and are not drawn, because this project draws no plant anywhere. On this island that absence weighs more than it does elsewhere.`,
      ),
      value: t(info.name, info.name),
      unit: t('atap, dari palem pulau ini', 'roof, from this island’s palm'),
    },
    {
      key: 'lepa',
      title: t('Sebelas bangunan setelah perahu yang sungguhan', 'Eleven buildings after the real boat'),
      body: t(
        'Lepa Bajau adalah lambung tempat sebuah keluarga tinggal: ia mengapung, ia berpindah, dan alamatnya adalah tempat ia ditambatkan. Yang ini rumah yang menyatakan dirinya lambung: ia tidak pernah mengapung, tidak pernah berpindah, dan berdiri di atas batu. Yang membuat pasangan itu berguna adalah bahwa yang satu memungkinkan yang lain diuji — tanpa lepa, perbandingan lambung di sini hanya angka yang ditetapkan penulis; dengan lepa, ia dapat dibandingkan dengan sesuatu yang memang berlayar.',
        'The Bajau lepa is a hull a family lives in: it floats, it moves, and its address is wherever it is moored. This is a house that says it is a hull: it never floats, never moves, and stands on stones. What makes the pair useful is that the first lets the second be tested — without the lepa, the hull proportion here is a number the author chose; with it, there is something that actually sails to compare against.',
      ),
      value: t('11', '11'),
      unit: t('bangunan di antara keduanya', 'buildings between the two'),
    },
  ]

  return {
    key: 'sabu',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Ammu hawu', 'Ammu hawu'),
    subhead: t(
      `${layout.ratio.actual.toFixed(2)} : 1 · haluan dan buritan · atap sampai lantai`,
      `${layout.ratio.actual.toFixed(2)} : 1 · a bow and a stern · thatch to the floor`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = hullCounterexample()
  const rows = (w: { ratio: number; least: number }): readonly Readout[] => [
    { label: t('panjang : lebar', 'length : beam'), value: `${w.ratio.toFixed(2)} : 1` },
    { label: t('paling kecil yang masih lambung', 'least that is still a hull'), value: `${w.least.toFixed(2)} : 1` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Rumah yang lebih lebar adalah rumah yang lebih baik menurut ukuran mana pun yang biasa: lebih banyak lantai untuk panjang yang sama, lebih lapang di sekeliling perapian. Dan tidak ada bagiannya yang menjadi salah — tiangnya tetap memikul, lunasnya tetap melengkung, buritannya tetap lebih tinggi daripada haluan, atapnya tetap turun sampai lantai. Yang berhenti benar adalah bahwa denahnya denah lambung. Lewat satu titik perbandingannya perbandingan ruang, dan rumah yang menyebut dirinya perahu sudah berhenti menyerupainya — yang di pulau ini bukan kiasan. Terus dilebarkan, satu hal lagi ikut hilang: tepi atapnya turun bersama lebarnya, dan celah di bawahnya yang menjadi satu-satunya jalan masuk menutup. Kemiripannya hilang lebih dulu, pintunya menyusul.',
      'A wider house is a better house by every ordinary measure: more floor for the same length, more room around the hearth. And no part of it becomes wrong — the posts still carry, the keel still cambers, the stern still stands above the bow, the roof still comes down to the floor. What stops being true is that the plan is a hull’s. Past a point the proportion is a room’s, and a house that calls itself a boat has stopped resembling one — which on this island is not a figure of speech. Keep widening and a second thing goes: the eave falls with the beam, and the gap under it that is the only way in closes. The likeness fails first, the door afterwards.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sabu',
    slug: 'sabu',
    house: t('Ammu hawu', 'Ammu hawu'),
    people: t('Sabu', 'The people of Sabu'),
    place: t('Seba, Rai Hawu (Pulau Sabu)', 'Seba, Rai Hawu (Savu island)'),
    about: t(
      'Ammu hawu adalah rumah di Rai Hawu, dan ia dibangun serta disebut sebagai perahu: bubungannya lunas, kedua ujungnya haluan dan buritan, keluarganya awaknya. Ia tidak pernah mengapung. Dua hal membuatnya layak dibangun di sini. Pertama, sebelas bangunan yang lalu projek ini memodelkan lambung sungguhan — lepa Bajau — jadi kemiripan ini dapat diuji dan bukan sekadar dinyatakan: denahnya harus memegang perbandingan lambung, dan pengujian pak ini membandingkannya dengan angka lepa yang sebenarnya. Kedua, atapnya turun hampir sampai lantai, jadi yang pada bangunan lain menjadi dinding di sini bagian bawah atap, dan jalan masuknya celah di bawah tritisan — sehingga melebarkan rumahnya berarti menurunkan tepi atapnya dan menutup pintunya sendiri. Matahari pada model ini dihitung untuk Seba, 10,49° LS dan 121,83° BT: titik paling selatan dalam kumpulan ini.',
      'An ammu hawu is a house on Rai Hawu, and it is built and spoken of as a boat: its ridge a keel, its two ends a bow and a stern, its family a crew. It never floats. Two things make it worth building here. First, eleven buildings ago this project modelled an actual hull — the Bajau lepa — so the likeness can be tested rather than asserted: the plan has to hold a hull’s proportion, and this pack’s tests compare it against the lepa’s own numbers. Second, the roof comes down nearly to the floor, so what is a wall elsewhere is the lower part of this roof and the way in is a gap under the eave — which means widening the house lowers the eave and closes its own door. The sun in this model is computed for Seba, 10.49° S and 121.83° E: the southernmost site in the collection.',
    ),
    caution: t(
      'Istilah Sabu untuk bagian-bagian rumah tidak dipakai di sini: kedua ujungnya disebut haluan dan buritan dalam bahasa Indonesia, sebab penulis tidak cukup yakin akan istilah aslinya — dan pada bangunan ini kekurangan itu sekaligus bagian dari pokoknya, karena kata-kata yang dipinjam pun kata perahu. Selain itu: rentang perbandingan lambung adalah tafsiran penulis atas gambar dan foto, bukan hasil pengukuran; pembagian ruang di dalam dan aturan tentang siapa duduk di mana tidak dibangun; ukiran dan hiasan ujung bubungan tidak dimodelkan; pilihan daun lontar atau gewang di sini disederhanakan menjadi dua kemungkinan, sedangkan kenyataannya soal siapa punya berapa banyak pohon; dan pohon lontar yang menghidupi pulau ini berdiri di sekeliling halaman tanpa digambar sama sekali.',
      'The Sabu terms for the parts of the house are not used here: the two ends are called bow and stern in Indonesian, because the author is not confident enough of the originals — and on this building that shortfall is also part of the point, since even the borrowed words are a boat’s. Beyond that: the hull-proportion range is the author’s reading of drawings and photographs rather than a measurement; the divisions inside and the rules about who sits where are not built; carving and the ornament at the ends of the ridge are not modelled; the choice between lontar and gewang leaf is simplified to two options where in fact it is a question of who has how many palms; and the lontar palms this island lives on stand around the yard without being drawn at all.',
    ),
    orientation: t(
      'Yang menentukan arah rumah ini adalah ujung-ujungnya, bukan mata angin: haluan di satu sisi dan buritan di sisi lain, dan keduanya tidak dapat ditukar. Model ini menaruh haluan di −Z dan membentangkan lunas pada sumbu itu. Tetap tidak ada kendali untuk memutar bangunan.',
      'What sets this house’s direction is its own ends rather than the compass: a bow at one and a stern at the other, and they cannot be swapped. This model puts the bow at −Z and runs the keel along that axis. There is still no control that turns the building.',
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
          'Pasak kayu, dan kaki tiang duduk pada cekungan di batunya. Tidak ada yang ditanam.',
          'A timber peg, and each post’s foot sits in a hollow in its stone. Nothing is buried.',
        ),
      },
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Ikatan, yang di kapal menahan gadingnya dan di rumah ini menahan duru pada rangka atapnya.',
          'A lashing, which on a boat holds its ribs and in this house holds the duru to the roof frame.',
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
