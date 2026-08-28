/**
 * The omo, as the registry sees it.
 *
 * The sixth file of this shape and still no shared code between them.
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
  omoInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { roofCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A noble's house at full length, with the stones out front. */
const SHOWCASE: Rules = { omo: 'sebua', ruang: 8, behu: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = omoInfo(rules.omo)
  const cell = layout.cells[0]
  const angle = cell ? (Math.atan2(cell.maxA - cell.minA, cell.maxY - cell.minY) * 180) / Math.PI : 0

  const readout: readonly Readout[] = [
    { label: t('Petak bersegitiga', 'Bays triangulated'), value: `${layout.cells.length} / ${layout.cells.length}` },
    { label: t('Sudut driwa', 'Angle of the driwa'), value: `${angle.toFixed(0)}° dari tegak` },
    { label: t('Tinggi kolong', 'Understorey'), value: `${layout.floorY.toFixed(2)} m` },
    { label: t('Badan', 'Body'), value: `${(layout.eaveY - layout.floorY).toFixed(2)} m` },
    { label: t('Atap', 'Roof'), value: `${(layout.ridgeY - layout.eaveY).toFixed(2)} m` },
    { label: t('Behu', 'Behu'), value: layout.behu.length ? String(layout.behu.length) : '—' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'driwa',
      title: t('Mengapa kolongnya penuh batang miring', 'Why the understorey is full of leaning timbers'),
      body: t(
        'Karena Nias selatan berdiri di tepi lempeng yang aktif. Persegi empat tiang bisa bergoyang menjadi jajaran genjang; segitiga tidak bisa berubah bentuk tanpa ada yang patah. Jadi setiap petak di bawah lantai disilang driwa, dan tidak ada satu pun persegi yang dibiarkan persegi. Ini satu-satunya aturan kanon dalam projek ini yang bukan pernyataan tentang manusia melainkan tentang tanah — dan lima rumah lain di sini tidak bisa menunjukkannya, karena tak satu pun punya aturan sejenis.',
        'Because South Nias sits on an active plate margin. A rectangle of four posts can rack into a parallelogram; a triangle cannot change shape without something breaking. So every bay beneath the floor is crossed by driwa, and not one rectangle is left a rectangle. It is the only canon rule in this project that is not a statement about people but about the ground — and the other five houses here cannot show it, because none of them has a rule of that kind.',
      ),
      value: t(String(layout.cells.length), String(layout.cells.length)),
      unit: t('petak, semuanya bersegitiga', 'bays, every one triangulated'),
    },
    {
      key: 'visible',
      title: t('Di mana bagian yang menahan rumah ini', 'Where the part holding this house up is'),
      body: t(
        'Di tempat yang paling mudah dilihat. Kolongnya terbuka dan tidak ditutupi apa pun, jadi seluruh gagasan strukturnya terbaca dari halaman. Pada lima rumah lain dalam projek ini yang menahan bangunan justru yang tersembunyi — di balik dinding, di atas langit-langit, di bawah lapis ijuk. Di sini, yang bekerja adalah yang dipamerkan.',
        'In the place easiest to see. The understorey is open and screened by nothing, so the whole structural idea reads from the yard. In the other five houses here, what holds the building up is what is hidden — behind a wall, above a ceiling, under a course of thatch. Here, what works is what is shown.',
      ),
      value: t(`${layout.floorY.toFixed(1)}`, `${layout.floorY.toFixed(1)}`),
      unit: t('m kolong terbuka', 'm of open understorey'),
    },
    {
      key: 'roof',
      title: t('Mengapa atapnya lebih besar daripada rumahnya', 'Why the roof is larger than the house'),
      body: t(
        'Badan rumah ini adalah bagian terkecil dari ketiganya: kolong lebih tinggi, atap jauh lebih besar. Ruang di dalam atap sebesar itu terlalu berharga untuk dikosongkan, dan di rumah si’ulu memang tidak — ada loteng di dalamnya. Perbandingan itu, bukan ukurannya, yang membuat sebuah foto omo langsung dikenali.',
        'The body of this house is the smallest of its three parts: the understorey is taller and the roof is far larger. The space inside a roof that size is too valuable to leave empty, and in a si’ulu’s house it is not — there is a loft in it. That proportion, rather than any dimension, is what makes a photograph of an omo recognisable at once.',
      ),
      value: t(
        `${((layout.ridgeY - layout.eaveY) / (layout.eaveY - layout.floorY)).toFixed(1)}`,
        `${((layout.ridgeY - layout.eaveY) / (layout.eaveY - layout.floorY)).toFixed(1)}`,
      ),
      unit: t('kali tinggi badannya', 'times the height of the body'),
    },
    {
      key: 'behu',
      title: t('Apa arti batu-batu di halaman', 'What the stones on the plaza mean'),
      body: t(
        'Tiap behu adalah catatan pesta yang pernah diadakan, dan hanya si’ulu yang mendirikannya. Batu-batu itu berada di luar bangunan dan menyatakan sesuatu tentang rumah tangganya yang tidak dinyatakan oleh bagian rumah mana pun — satu-satunya aturan dalam projek ini yang menambahkan sesuatu di luar bangunan. Jumlah yang dipasang model ini adalah pengganti yang jujur, bukan bacaan atas suatu tempat: jumlah sebenarnya adalah riwayat, dan riwayat tidak bisa ditetapkan penulis.',
        'Each behu records a feast that was held, and only a si’ulu raises them. They stand outside the building and state something about the household that no part of the house states — the only rule in this project that adds something outside the building. The number this model raises is an honest placeholder rather than a reading of any one place: the real number is a history, and a history is not something the author can set.',
      ),
      value: t(String(layout.behu.length), String(layout.behu.length)),
      unit: layout.behu.length ? t('behu berdiri', 'behu standing') : t('behu — tidak ada yang didirikan', 'behu — none raised'),
    },
    {
      key: 'window',
      title: t('Mengapa mukanya satu pita panjang', 'Why the front is one long band'),
      body: t(
        'Bukaannya menerus di bawah tepi atap, bukan sederet lubang terpisah. Rumah yang dindingnya miring ke luar tidak dapat dibuka dengan jendela sendiri-sendiri tanpa memotong hal yang membuat dinding itu satu bidang; satu pita memotongnya sekali. Pemeriksaannya menghitung: satu bagian, atau bukan pita.',
        'The opening runs continuously under the eave rather than as a row of separate holes. A house whose walls lean outward cannot be opened with individual windows without cutting the thing that makes the wall one plane; a single band cuts it once. The check counts: one part, or it is not a band.',
      ),
      value: t(`${(layout.bukaan.toZ - layout.bukaan.fromZ).toFixed(1)}`, `${(layout.bukaan.toZ - layout.bukaan.fromZ).toFixed(1)}`),
      unit: t('m menerus', 'm continuous'),
    },
  ]

  return {
    key: 'nias',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(info.name, info.name),
    subhead: t(
      `${rules.ruang} ruang · ${layout.cells.length} petak bersegitiga · kolong ${layout.floorY.toFixed(1)} m`,
      `${rules.ruang} bays · ${layout.cells.length} bays triangulated · a ${layout.floorY.toFixed(1)} m understorey`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = roofCounterexample()
  const rows = (w: { body: number; roof: number }): readonly Readout[] => [
    { label: t('badan', 'body'), value: `${w.body.toFixed(2)} m` },
    { label: t('atap', 'roof'), value: `${w.roof.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Pemeriksaan terkuat di pak ini — bahwa setiap petak rangka bawah bersegitiga — justru tidak bisa dipatahkan dengan mendorong satu dimensi mana pun, karena driwa dibangun dari daftar petak yang sama dengan yang diperiksa: lebarkan petaknya dan diagonalnya ikut memanjang, selamanya. Itu disengaja, dan itu pula sebabnya klaim itu diuji dengan cara lain — dengan membangun rumah lalu mencabut silangan melintangnya, di dalam berkas uji. Yang ditampilkan di sini adalah perbandingan dua angka yang benar-benar berdiri sendiri: atap rumah ini lebih besar daripada badannya, dan kecilkan cukup jauh maka yang tersisa adalah rumah bertopi, bukan omo.',
      'The strongest check in this pack — that every bay of the substructure is triangulated — cannot be broken by pushing any single dimension, because the driwa are built from the same list of bays the check walks: widen a bay and its diagonal lengthens with it, for ever. That is deliberate, and it is why the claim is tested another way instead — by building a house and taking its cross-braces away, in the test file. What is shown here is a comparison of two genuinely independent numbers: this building’s roof is larger than its body, and shrink it far enough and what is left is a house with a hat rather than an omo.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'nias',
    slug: 'nias',
    house: t('Omo', 'Omo'),
    people: t('Nias', 'Nias'),
    place: t('Nias Selatan, Sumatera Utara', 'South Nias, North Sumatra'),
    about: t(
      'Omo adalah rumah orang Nias, dan yang dimodelkan di sini bentuk Nias selatan: berdiri tinggi di atas tiang, dengan kolong terbuka yang penuh batang miring, badan berdinding miring ke luar, dan atap yang jauh lebih besar daripada rumah di bawahnya. Yang membuatnya layak dibangun di sini bukan bentuknya melainkan alasan bentuk itu — Nias selatan berdiri di tepi lempeng aktif, dan rangka diagonal di kolongnyalah yang membuat rumah bertahan diguncang. Ini satu-satunya rumah dalam projek ini yang aturan pokoknya berasal dari tanah dan bukan dari manusia. Nama bagian pada layar ini — omo, omo sebua, ehomo, driwa, behu, si’ulu — adalah kata Nias; di tempat penulis tidak cukup yakin, bagian itu dinamai dalam bahasa Indonesia. Matahari pada model ini dihitung untuk Nias selatan, 0,58° LU dan 97,79° BT.',
      'An omo is the house of the Nias people, and what is modelled here is the South Nias form: standing high on posts, with an open understorey full of leaning timbers, a body whose walls lean outward, and a roof far larger than the house beneath it. What makes it worth building here is not its shape but the reason for that shape — South Nias sits on an active plate margin, and the diagonal frame in its understorey is what lets the house survive shaking. It is the only house in this project whose governing rule comes from the ground rather than from people. The parts named on this screen — omo, omo sebua, ehomo, driwa, behu, si’ulu — are Nias words; where the author is not confident, the part is named in Indonesian. The sun in this model is computed for South Nias, 0.58° N and 97.79° E.',
    ),
    caution: t(
      'Model ini satu rumah yang mungkin, bukan rumah tertentu. Bawömataluo dan kampung-kampung Nias selatan lain berisi rumah yang tidak ada dua yang persis sama, dan omo sebua kepala kampung adalah bangunan tersendiri yang jauh lebih rumit daripada yang dimodelkan di sini. Dua hal perlu dinyatakan langsung. Ukuran batangnya perkiraan penulis: pemeriksaan bersegitiga menguji geometrinya, tidak pernah kekuatannya, dan tidak akan — projek ini tidak punya sifat bahan. Dan ukiran tidak ada sama sekali, sama seperti pada bale; rumah Nias berukir, jadi ketiadaannya kekurangan yang nyata, tetapi mengarang motif milik pengukir tertentu lebih buruk daripada tidak menampilkannya.',
      'This model is one house the rules permit, not a particular house. Bawömataluo and the other South Nias villages hold houses of which no two are identical, and a chief’s omo sebua is a building of its own, far more elaborate than what is modelled here. Two things to state outright. The member sizes are the author’s estimate: the triangulation check tests the geometry, never the strength, and never will — this project has no material properties. And there is no carving at all, as with the bale; Nias houses are carved, so its absence is a real omission, but inventing motifs belonging to particular carvers would be worse than showing none.',
    ),
    orientation: t(
      'Rumah berdiri berderet di sepanjang satu jalan batu kampung, saling berhadapan, dengan muka menghadap jalan itu. Aturannya bersifat hubungan seperti pada rumah gadang dan mbaru niang, tetapi yang dituju bukan halaman atau batu upacara melainkan sebuah jalan lurus yang dipakai bersama — jadi arah tiap rumah ditentukan oleh susunan kampungnya, dan kampung itu sendiri yang punya sumbu. Model ini menaruh muka rumah pada −X, tempat behu berdiri. Tetap tidak ada kendali untuk memutar bangunan.',
      'The houses stand in rows along a single paved village street, facing each other across it, with their fronts to the street. The rule is relational as in the rumah gadang and the mbaru niang, but what is faced is neither a yard nor a ceremonial stone: it is a straight shared street — so each house’s bearing is set by the village’s arrangement, and it is the village that has the axis. This model puts the front on −X, where the behu stand. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'takik',
        name: t('Takik', 'Notched lap'),
        gloss: t(
          'Driwa ditakik melintang pada ehomo yang disilangnya. Sambungan inilah yang menyalurkan gaya diagonal ke tiang, dan karena itu ia sambungan terpenting di rumah ini.',
          'A driwa is notched across the ehomo it braces. This joint is what delivers the diagonal force into the post, and it is therefore the most important joint in the house.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t('Jurai bertemu bubungan dan dipasak.', 'A hip rafter meets the ridge and is pegged.'),
      },
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat on a stone'),
        gloss: t(
          'Kaki ehomo duduk di batu, tidak ditanam. Alasannya sama dengan driwa, dinyatakan di ujung yang lain: kaki yang boleh sedikit bergeser lebih baik daripada kaki yang harus patah.',
          'An ehomo foot seats on its stone and is not buried. The reasoning is the same as the driwa’s, stated at the other end: a footing allowed to shift a little is better than one that has to break.',
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
