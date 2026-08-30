/**
 * The rumah kebaya, as the registry sees it.
 *
 * The thirty-second file of this shape, and the first whose building is placed
 * by a road and bounded by a neighbour.
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
  letakInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { plotCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Four rooms on a road plot, with the carved fascia. */
const SHOWCASE: Rules = { kamar: 4, letak: 'pinggir-jalan', gigiBalang: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = letakInfo(rules.letak)

  const readout: readonly Readout[] = [
    { label: t('Kamar', 'Rooms'), value: String(rules.kamar) },
    { label: t('Lebar rumah', 'Width of the house'), value: `${(layout.house.halfX * 2).toFixed(2)} m` },
    { label: t('Lebar kavling', 'Width of the plot'), value: `${(layout.plot.halfX * 2).toFixed(2)} m` },
    { label: t('Sisa ke garis batas', 'Left to the boundary'), value: `${layout.margin.toFixed(2)} m` },
    { label: t('Langkan', 'The terrace'), value: `${layout.langkan.depth.toFixed(2)} m` },
    { label: t('Bahan yang diambil dari tanahnya', 'Materials taken from its own ground'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'tetangga',
      title: t('Tetangganya bukan kerabat', 'Its neighbours are not kin'),
      body: t(
        `Tiap bangunan lain dalam kumpulan ini ditempatkan oleh sebuah hubungan: tongkonan menghadap utara, tanean adalah halaman satu keluarga, ngadhu berdiri di alun-alun klannya, betang memanjang untuk rumah tangganya, khaim ditentukan sebatang pohon, sudung oleh tempat keluarganya berhenti. Yang ini berdiri di atas kavling di tepi jalan, di samping orang yang mungkin tidak pernah dikenalnya, dan garis yang tidak boleh dilewatinya digambar orang yang bukan keluarganya. Sekarang tersisa ${layout.margin.toFixed(2)} m ke garis itu.`,
        `Every other building in this collection is placed by a relationship: a tongkonan faces north, a tanean is one family’s yard, a ngadhu stands in its clan’s square, a betang lengthens for its households, a khaim is sited by a tree, a sudung by wherever the family stopped. This one stands on a plot beside a road, next to people it may never have met, and the line it may not build past was drawn by somebody who is not family. There is ${layout.margin.toFixed(2)} m left to that line.`,
      ),
      value: t(layout.margin.toFixed(2), layout.margin.toFixed(2)),
      unit: t('m ke milik orang lain', 'm to somebody else’s property'),
    },
    {
      key: 'langkan',
      title: t('Ruang untuk orang yang tidak dipersilakan masuk', 'A room for people who are not let in'),
      body: t(
        `Langkan adalah lantai terangkat sedalam ${layout.langkan.depth.toFixed(2)} m di muka rumah, berpagar setinggi ${DIMS.langkanRail.value.toFixed(2)} m, dan tidak ada pintu antara ia dan jalan. Tetangga, pedagang, atau orang asing dapat berdiri di situ, diterima di situ, dan pulang dari situ tanpa pernah masuk. Dua puluh sembilan bangunan sebelum ini membagi ruang di antara orang yang termasuk ke dalamnya — menurut pangkat, kelahiran, umur, marga, atau rumah tangga. Yang ini menyediakan satu ruang justru untuk yang tidak termasuk.`,
        `The langkan is a raised floor ${layout.langkan.depth.toFixed(2)} m deep across the front of the house, with a ${DIMS.langkanRail.value.toFixed(2)} m rail and no door between it and the road. A neighbour, a trader or a stranger can stand on it, be received on it and leave from it without ever going inside. The twenty-nine buildings before this divide space among people who belong to them — by rank, by birth order, by age, by clan, by household. This one keeps a room for the people who do not.`,
      ),
      value: t(layout.langkan.depth.toFixed(2), layout.langkan.depth.toFixed(2)),
      unit: t('m ruang di luar pintu pertama', 'm of room outside the first door'),
    },
    {
      key: 'garis',
      title: t('Batasnya milik orang lain', 'Its limit is somebody else’s'),
      body: t(
        `${info.glossId} Kavlingnya ${(layout.plot.halfX * 2).toFixed(0)} × ${(layout.plot.halfZ * 2).toFixed(0)} m dan sudah ada sebelum rumahnya; lebar rumahnya mengikuti berapa kamar yang dikehendaki. Tidak ada yang menghubungkan kedua angka itu selain aturan sempadan — dan yang lebih dulu melewati garis bukan dindingnya melainkan tritisannya, persis seperti yang terjadi di antara tetangga.`,
        `${info.glossEn} The plot is ${(layout.plot.halfX * 2).toFixed(0)} × ${(layout.plot.halfZ * 2).toFixed(0)} m and was there before the house; the width of the house follows from how many rooms the household wants. Nothing relates those two numbers but the setback rule — and what crosses the line first is not the wall but the eave, which is exactly how it goes between neighbours.`,
      ),
      value: t(DIMS.sideMargin.value.toFixed(2), DIMS.sideMargin.value.toFixed(2)),
      unit: t('m yang harus disisakan ke garis', 'm that has to be left to the line'),
    },
    {
      key: 'lipatan',
      title: t('Atap yang melipat, dan namanya dari situ', 'A roof that folds, and takes its name from it'),
      body: t(
        `Atapnya berganti kemiringan di tengah jalannya turun: ${layout.fold.upper.toFixed(2)} m tiap meter di atas rumah, lalu ${layout.fold.lower.toFixed(2)} m di atas langkan. Lipatan itulah yang terlihat dari samping — seperti lipatan kebaya — dan dari situ nama rumahnya. Rumah bubungan tinggi Banjar juga mengambil namanya dari atap, dan itu pernyataan yang berbeda: di sana empat atap berjajar pada satu bubungan, di sini satu bidang membelok satu kali, dan yang dinaungi bagian landainya justru ruang untuk orang luar.`,
        `The roof changes pitch partway down: ${layout.fold.upper.toFixed(2)} m of fall per metre over the house, then ${layout.fold.lower.toFixed(2)} m over the terrace. That fold seen from the side — like the pleats of a kebaya — is where the house’s name comes from. The Banjar rumah bubungan tinggi also takes its name from a roof, and that is a different claim: there four roofs stand in a row along one ridge, here one slope bends once, and what the shallow part shades is the room kept for outsiders.`,
      ),
      value: t('2', '2'),
      unit: t('kemiringan pada satu bidang', 'pitches on one slope'),
    },
    {
      key: 'dibeli',
      title: t('Dibangun dari pasar, bukan dari hutan di sekelilingnya', 'Built out of a market rather than the forest around it'),
      body: t(
        'Nol bahan diambil dari tanah tempat rumah ini berdiri. Kayunya turun sungai ke galangan dan dijual per batang; gentengnya dibakar di tempat lain; ubinnya dibeli sekeping-sekeping; pakunya — satu-satunya paku dalam kumpulan ini — juga dibeli. Sudung Orang Rimba dibangun dari apa yang berdiri di sekelilingnya sejam sebelumnya; khaim Korowai dari pohon yang masih hidup di bawahnya. Ini bangunan pertama di sini yang daftar bahannya adalah daftar belanja, dan itu bukan catatan tentang bahan melainkan tentang sebuah kota.',
        'Zero materials come from the ground this house stands on. Its timber comes down a river to a yard and is sold by the length; its tiles are fired elsewhere; its floor tiles are bought by the piece; its nails — the only nails in this collection — are bought too. An Orang Rimba sudung is built from what was standing around it an hour earlier; a Korowai khaim from a tree still alive underneath it. This is the first building here whose material list is a shopping list, and that is a note about a city rather than about materials.',
      ),
      value: t('0', '0'),
      unit: t('bahan dari tanahnya sendiri', 'materials from its own ground'),
    },
  ]

  return {
    key: 'betawi',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Rumah kebaya', 'Rumah kebaya'),
    subhead: t(
      `${rules.kamar} kamar · langkan untuk orang luar · ${layout.margin.toFixed(1)} m ke garis batas`,
      `${rules.kamar} rooms · a terrace for outsiders · ${layout.margin.toFixed(1)} m to the boundary`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = plotCounterexample()
  const rows = (w: { reach: number; limit: number }): readonly Readout[] => [
    { label: t('jangkauan tritisan', 'how far the eave reaches'), value: `${w.reach.toFixed(2)} m` },
    { label: t('batas yang boleh dicapai', 'how far anything may reach'), value: `${w.limit.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Kamar yang lebih lapang adalah perbaikan paling sederhana yang dapat diminta siapa pun, dan tidak ada bagian bangunan yang keberatan: lantainya tetap, rangkanya tetap memikul, atapnya tetap melipat, langkannya tetap menghadap jalan. Yang ditemui rumah ini adalah sebuah garis. Lewat satu titik tritisannya masuk ke dalam jarak yang harus disisakan ke batas kavling, dan di seberang batas itu ada tetangga. Ini batas pertama dalam projek ini yang milik orang lain — dan yang lebih dulu melewatinya bukan dindingnya melainkan atapnya, persis seperti yang terjadi dalam perkara antar tetangga.',
      'Wider rooms are the plainest improvement anybody could ask for, and no part of the building objects: the plinth stands, the frame carries, the roof still folds, the terrace still faces the road. What the house meets is a line. Past a point its eave comes inside the distance that has to be left to the boundary, and beyond that boundary is a neighbour. It is the first limit in this project that belongs to somebody else — and what crosses it first is not the wall but the roof, which is exactly how the argument happens between neighbours.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'betawi',
    slug: 'betawi',
    house: t('Rumah kebaya', 'Rumah kebaya'),
    people: t('Betawi', 'The Betawi'),
    place: t('Condet dan Setu Babakan, Jakarta', 'Condet and Setu Babakan, Jakarta'),
    about: t(
      'Rumah kebaya adalah rumah Betawi: lantai bata di atas tanah rendah, rangka kayu yang dibeli per batang, atap genteng yang berganti kemiringan di tengah jalannya turun, dan langkan di muka yang menghadap jalan. Dua hal membuatnya layak dibangun di sini. Tetangganya bukan kerabat: setiap bangunan lain dalam kumpulan ini ditempatkan oleh sebuah hubungan — arah mata angin, halaman keluarga, alun-alun klan, sungai, pohon — sedangkan yang ini berdiri di atas kavling di tepi jalan, dan garis yang tidak boleh dilewatinya digambar orang lain. Dan mukanya adalah ruang untuk orang yang tidak dipersilakan masuk: langkan dapat dinaiki dari jalan tanpa melewati pintu, dan pintu pertama rumah ini ada di belakangnya. Matahari pada model ini dihitung untuk Jakarta, 6,27° LS dan 106,86° BT: satu-satunya tapak kota dalam kumpulan ini.',
      'A rumah kebaya is a Betawi house: a brick plinth on low ground, a timber frame bought by the length, a tiled roof that changes pitch partway down, and a langkan across the front facing the road. Two things make it worth building here. Its neighbours are not kin: every other building in this collection is placed by a relationship — a compass direction, a family yard, a clan square, a river, a tree — while this one stands on a plot beside a road, and the line it may not build past was drawn by somebody else. And its front is a room for people who are not let in: the langkan can be stepped onto from the road without passing a door, and the house’s first door is behind it. The sun in this model is computed for Jakarta, 6.27° S and 106.86° E: the only city site in the collection.',
    ),
    caution: t(
      'Rumah kebaya adalah bangunan yang bercampur asalnya — pertukangan Belanda, ragam hias Tionghoa, denah Melayu — dan percampuran itu tidak dapat dilihat pada model ini, sebab yang dimodelkan hanya susunannya. Ukiran gigi balang, jendela jalusi, pagar langkan yang dibubut, dan lisplang berukir tidak dimodelkan; papan gigi balang di sini papan polos. Selain itu: ukuran kavling dan jarak sempadan adalah tafsiran penulis dan pada kenyataannya berbeda dari satu jalan ke jalan lain; rumah kebaya punya banyak keluarga bentuk lain (bapang, gudang, joglo Betawi) yang tidak dibangun; dan perlu dikatakan bahwa rumah-rumah ini masih berdiri dan masih ditinggali di kota yang paling cepat berubah di negeri ini — jumlahnya berkurang bukan karena orang berhenti membangunnya, melainkan karena harga tanah.',
      'A rumah kebaya is a building of mixed descent — Dutch joinery, Chinese ornament, a Malay plan — and none of that mixing is visible in this model, because what is modelled is only its arrangement. The carving of the gigi balang, the louvred windows, the turned terrace rail and the fretted bargeboards are not modelled; the gigi balang board here is a plain board. Beyond that: the plot size and the setbacks are the author’s reading and in fact differ from street to street; the rumah kebaya has several relatives (bapang, gudang, joglo Betawi) that are not built; and it should be said that these houses are still standing and still lived in, in the fastest-changing city in the country — there are fewer of them not because people stopped building them but because of the price of land.',
    ),
    orientation: t(
      'Mukanya menghadap jalan, dan itulah seluruh aturan arahnya: tidak ada mata angin, tidak ada gunung, tidak ada sungai — hanya jalan yang lewat di depan kavling. Model ini menaruh jalan di −Z dan membentangkan bubungan sejajar dengannya. Tetap tidak ada kendali untuk memutar bangunan.',
      'Its front faces the road, and that is the whole of its orientation rule: no compass point, no mountain, no river — only the street that runs past the plot. This model puts the road at −Z and lays the ridge parallel to it. There is still no control that turns the building.',
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
          'Pasak kayu menembus lubang dan pen, dan kaki tiangnya duduk masuk ke dalam lantai bata.',
          'A timber peg through a mortise and tenon, with each post foot seated down into the brick plinth.',
        ),
      },
      {
        kind: 'paku',
        name: t('Paku', 'Nail'),
        gloss: t(
          'Paku — satu-satunya dalam kumpulan ini. Dua puluh sembilan bangunan lain dipasak, diikat, dibaji, atau dipahat dari satu batu, dan tidak satu pun memakai besi yang dibeli. Di kota, paku adalah barang yang ada di toko di ujung jalan.',
          'A nail — the only one in this collection. The other twenty-nine buildings are pegged, lashed, wedged or cut from one stone, and not one of them uses bought iron. In a city, a nail is a thing in the shop at the end of the street.',
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
