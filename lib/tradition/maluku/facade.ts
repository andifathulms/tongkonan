/**
 * The baileo, as the registry sees it.
 *
 * The fifteenth file of this shape, and the first whose `people` is a village
 * rather than a household — which the registry did not have to learn, because
 * it never knew what a household was.
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
  pamaliInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { screenCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Nine clans, the stone inside, and the screen fitted. */
const SHOWCASE: Rules = { soa: 9, pamali: 'dalam', sekat: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = pamaliInfo(rules.pamali)
  const band = layout.sightBand.toY - layout.sightBand.fromY

  const readout: readonly Readout[] = [
    { label: t('Soa', 'Soa'), value: String(rules.soa) },
    { label: t('Tempat duduk', 'Seats'), value: String(rules.soa * 2) },
    { label: t('Panjang', 'Length'), value: `${layout.length.toFixed(1)} m` },
    { label: t('Pita terbuka', 'The open band'), value: `${band.toFixed(2)} m` },
    { label: t('Tingkat', 'Storeys'), value: '1' },
    { label: t('Batu pamali', 'The pamali stone'), value: info.name },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'milik',
      title: t('Rumah ini milik siapa', 'Whose house this is'),
      body: t(
        'Bukan milik siapa pun. Empat belas bangunan lain dalam projek ini adalah milik sebuah rumah tangga — ditinggali, diisi padi, atau dipakai menyatakan kedudukan satu keluarga. Baileo adalah rumah negeri: tidak ada yang tidur di dalamnya dan tidak ada yang memilikinya. Karena itu pertanyaan yang di rumah lain dijawab dengan pangkat atau cacah keluarga, di sini dijawab dengan cacah klan.',
        'Nobody’s. The other fourteen buildings in this project belong to a household — lived in, filled with rice, or used to state one family’s standing. A baileo is the negeri’s house: nobody sleeps in it and nobody owns it. So the question that the other houses answer with a rank or a tally of families is answered here with a tally of clans.',
      ),
      value: t(String(rules.soa), String(rules.soa)),
      unit: t('soa berhak duduk', 'clans entitled to sit'),
    },
    {
      key: 'setara',
      title: t('Mengapa lantainya menolak bertingkat', 'Why the floor refuses to step'),
      body: t(
        'Karena soa duduk sebagai sesama. Rumah limas Palembang menyatakan kedudukan justru pada anggota yang sama — lantainya naik bertingkat, dan tempat seorang tamu didudukkan adalah kedudukannya. Bangunan ini memakai anggota yang sama untuk mengatakan hal sebaliknya: satu bidang, satu ketinggian, dan tempat duduk yang semuanya sama besar. Menolak melakukan sesuatu di sini adalah pernyataan, persis seperti menolak menaikkan lantai pada rumah gadang Bodi Caniago.',
        'Because the soa sit as peers. The Palembang rumah limas states standing in exactly this member — its floor rises in steps, and where a guest is seated is their standing. This building uses the same member to say the opposite: one plane, one height, and seats that are all the same size. Refusing to do something is the statement here, exactly as refusing to raise the floor is on a Bodi Caniago rumah gadang.',
      ),
      value: t('1', '1'),
      unit: t('bidang lantai, tanpa tingkat', 'floor plane, with no step'),
    },
    {
      key: 'terbuka',
      title: t('Mengapa tidak ada dinding', 'Why there are no walls'),
      body: t(
        'Supaya yang diputuskan di dalam terlihat dan terdengar dari luar. Keterbukaan itu aturan politik dan bukan aturan iklim — bangunan-bangunan lain di projek ini berdinding untuk menahan hujan, hawa dingin, atau pandangan orang, dan yang ini tidak melakukan ketiganya. Ujinya pun bukan ada tidaknya papan melainkan tinggi mata orang yang sedang duduk di dalamnya: sekat setinggi lutut boleh, sekat setinggi dada tidak.',
        'So that what is decided inside is visible and audible from outside. The openness is a political rule rather than a climatic one — the other buildings here have walls to keep out rain, cold or eyes, and this one does none of the three. And the test is not the presence of boards but the eye height of somebody seated inside: a knee-high screen is allowed, a chest-high one is not.',
      ),
      value: t(band.toFixed(2), band.toFixed(2)),
      unit: t('m terbuka pada keempat sisi', 'm open on all four sides'),
    },
    {
      key: 'batu',
      title: t('Bangunan ini berdiri terhadap sebuah batu', 'This building stands in relation to a stone'),
      body: t(
        `Batu pamali adalah tempat sesajen diletakkan, dan baileo didirikan terhadapnya. ${info.glossId} Yang berlaku pada kedua susunan itu satu hal: tidak ada yang dibangun di atas batu itu. Di dalam, lantainya dibuka mengelilinginya sehingga batu tetap menyentuh tanah — sebuah lubang pada lantai yang selebihnya satu bidang utuh.`,
        `The batu pamali is where offerings are laid, and the baileo is raised in relation to it. ${info.glossEn} One thing holds in both arrangements: nothing is built over the stone. Inside, the floor is opened around it so it still touches the earth — a hole in a floor that is otherwise one unbroken plane.`,
      ),
      value: t(info.name, info.name),
      unit: t('letak batu', 'where the stone stands'),
    },
    {
      key: 'atap',
      title: t('Atap besar di atas bangunan tanpa dinding', 'A large roof over a building with no walls'),
      body: t(
        'Tidak ada dinding yang menahan hujan, jadi yang menjaga lantai tetap kering hanyalah atap yang menjorok jauh melewatinya. Perbandingan itu — atap berat di atas ruang terbuka — juga yang membuat bangunan ini terbaca sebagai rumah negeri dan bukan sebagai pendopo: besarnya menyatakan bahwa yang terjadi di bawahnya penting, dan keterbukaannya menyatakan bahwa itu bukan urusan satu rumah tangga.',
        'There is no wall to stop the rain, so what keeps the floor dry is a roof reaching well past it. That proportion — a heavy roof over open space — is also what makes the building read as the village’s house rather than as a shelter: its size says that what happens beneath it matters, and its openness says that it is not one household’s business.',
      ),
      value: t(layout.eaveOversail.toFixed(2), layout.eaveOversail.toFixed(2)),
      unit: t('m tritisan, tanpa dinding di bawahnya', 'm of overhang, with no wall beneath it'),
    },
  ]

  return {
    key: 'maluku',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Baileo', 'Baileo'),
    subhead: t(
      `${rules.soa} soa · ${layout.length.toFixed(1)} m · tanpa dinding`,
      `${rules.soa} soa · ${layout.length.toFixed(1)} m · no walls`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = screenCounterexample()
  const rows = (w: { screen: number; eye: number }): readonly Readout[] => [
    { label: t('tinggi sekat', 'height of the screen'), value: `${w.screen.toFixed(2)} m` },
    { label: t('mata orang duduk', 'eye of a seated person'), value: `${w.eye.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Naikkan sekatnya dan tidak ada satu pun yang runtuh. Tiangnya tetap berdiri, lantainya tetap satu bidang, tempat duduknya tetap sama besar, atapnya tetap menindih dan tetap menahan hujan. Yang berhenti benar hanyalah bahwa orang yang duduk di tempatnya dapat dilihat dari luar — jadi sebuah bangunan yang seluruh bentuknya adalah alasan tentang keputusan yang terlihat, tetap menyatakan alasan itu kepada orang yang tidak dapat melihatnya. Dan yang mengalahkannya adalah sebuah pegangan: hal pertama yang akan dipasang siapa pun pada lantai setinggi dua meter yang di atasnya ada anak-anak.',
      'Raise the screen and nothing falls down. The posts still stand, the floor is still one plane, the seats are still equal, the roof still laps and still sheds. The only thing that stops being true is that a person seated in their place can be seen from outside — so a building whose entire form is an argument about visible decisions goes on making that argument to somebody who cannot see it. And what defeats it is a handrail: the first thing anybody would fit to a floor two metres in the air with children on it.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'maluku',
    slug: 'maluku',
    house: t('Baileo', 'Baileo'),
    people: t('Negeri-negeri Maluku Tengah', 'The negeri of Central Maluku'),
    place: t('Maluku Tengah', 'Central Maluku'),
    about: t(
      'Baileo adalah rumah negeri: bangunan panggung tanpa dinding tempat saniri bersidang, tempat adat dinyatakan, dan tempat leluhur disapa. Yang membuatnya layak dibangun di sini adalah pemiliknya — tidak ada. Empat belas bangunan lain dalam projek ini milik sebuah rumah tangga, dan pertanyaan yang di sana dijawab dengan pangkat atau jumlah keluarga di sini dijawab dengan jumlah klan yang berhak duduk. Dari situ semuanya menyusul: satu petak lantai, sepasang tiang dan satu tempat duduk untuk tiap soa; satu bidang lantai tanpa tingkat, karena soa duduk sebagai sesama; dan tidak ada dinding, karena yang diputuskan di dalam harus terlihat dari luar. Matahari pada model ini dihitung untuk Maluku Tengah, 3,3° LS dan 128,8° BT.',
      'A baileo is the negeri’s house: a raised, wall-less building where the saniri meets, where adat is stated, and where the ancestors are addressed. What makes it worth building here is its owner — there is none. The other fourteen buildings in this project belong to a household, and the question that a rank or a tally of families answers there is answered here by a count of the clans entitled to sit. Everything follows from that: one bay of floor, one pair of posts and one seat for each soa; one floor plane with no step, because the soa sit as peers; and no walls, because what is decided inside must be visible from outside. The sun in this model is computed for Central Maluku, 3.3° S and 128.8° E.',
    ),
    caution: t(
      'Baileo berbeda dari negeri ke negeri, dan yang dibangun di sini adalah bentuk umumnya: panggung persegi panjang, tanpa dinding, beratap rumbia, dengan tempat duduk mengelilingi lantainya. Ukiran — yang pada banyak baileo justru bagian yang paling diperhatikan, terutama pada tiang dan papan tumpu — sama sekali tidak ada di sini, dengan alasan yang sama seperti pada rumah-rumah lain: mengarang anggota dari perbendaharaan ukir milik pengukir tertentu lebih buruk daripada tidak menggambarnya. Nama-nama tiang menurut soa juga tidak dimodelkan, padahal di banyak negeri justru itulah yang menjadikan sebuah tiang milik sebuah klan. Dan tidak satu pun angka di sini berasal dari pengukuran.',
      'Baileo differ from negeri to negeri, and what is built here is the common form: a rectangular platform, no walls, a sago-leaf roof, and seats around the floor. The carving — which on many baileo is the part given the most attention, especially on the posts and the seat boards — is entirely absent, for the reason the other houses give: inventing members of a carving vocabulary belonging to particular carvers is worse than showing none. The naming of individual posts after individual soa is not modelled either, though in many negeri that naming is exactly what makes a post a clan’s. And not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Bangunan ini menghadap batu pamali, dan tangganya ada di sisi itu. Kendalanya bersifat hubungan seperti pada rumah gadang dan rumah betang, tetapi yang dihadapi bukan lumbung atau sungai melainkan sebuah batu — sesuatu yang tidak berguna, tidak ditinggali, dan tidak dapat dipindahkan. Model ini menaruh muka dan batu itu di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The building faces the batu pamali, and its stair is on that side. The constraint is relational as it is on the rumah gadang and the betang, but what is faced is neither a granary nor a river: it is a stone — something with no use, nobody living in it, and no possibility of moving it. This model puts the front and the stone on −X. There is still no control that turns the building.',
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
          'Gelagar duduk dalam takik di tiang, pada satu ketinggian di seluruh bangunan — karena lantainya satu bidang.',
          'A bearer sits in a notch in the post, at one height throughout the building — because the floor is one plane.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t(
          'Balok kepala dipasak pada kepala tiang. Di sinilah atap yang besar itu bertemu bangunan yang tidak berdinding.',
          'The plate is pegged to the post heads. This is where that large roof meets a building with no walls.',
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
