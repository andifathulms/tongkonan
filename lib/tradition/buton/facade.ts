/**
 * The malige, as the registry sees it.
 *
 * The twenty-sixth file of this shape, and the one that found an assumption
 * nobody had written down. The core never required a building to narrow as it
 * rises — but twenty-five packs did it anyway, and an agreement that has never
 * been contradicted is indistinguishable from a constraint.
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
  paleInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { overhangCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The full malige: four storeys, the highest rank, and the projecting room. */
const SHOWCASE: Rules = { tingkat: 4, pale: 'pata', anjungan: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = paleInfo(rules.pale)
  const base = layout.storeys[0]
  const top = layout.storeys[layout.storeys.length - 1]
  const span = (top?.halfX ?? 0) - (base?.halfX ?? 0)

  const readout: readonly Readout[] = [
    { label: t('Tingkat', 'Storeys'), value: String(rules.tingkat) },
    { label: t('Lantai bawah', 'Ground floor'), value: `${((base?.halfX ?? 0) * 2).toFixed(2)} m` },
    { label: t('Lantai teratas', 'Topmost floor'), value: `${((top?.halfX ?? 0) * 2).toFixed(2)} m` },
    { label: t('Lengan pale', 'Bracket arms'), value: String(info.count) },
    { label: t('Jangkauan lengan', 'Reach of an arm'), value: `${layout.reach.toFixed(2)} m` },
    { label: t('Besi', 'Iron'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'melebar',
      title: t('Melebar ke atas', 'It widens as it rises'),
      body: t(
        `Tiap tingkat menjorok melewati tingkat di bawahnya pada keempat sisinya, jadi lantai terbesar bangunan ini adalah lantai tertingginya: ${((base?.halfX ?? 0) * 2).toFixed(2)} m di tanah menjadi ${((top?.halfX ?? 0) * 2).toFixed(2)} m di puncak. Tidak ada bangunan lain di sini yang lantainya bertambah besar ke atas: kariwari Tobati, satu-satunya yang juga bertingkat dengan lantai bernama, justru mengecil ke atas sebab kelompok umur yang lebih tua lebih sedikit orangnya. Dan tidak satu pak pun pernah menyatakan itu sebagai aturan. Kesepakatan yang tidak pernah dibantah tidak dapat dibedakan dari keharusan, dan bangunan inilah bantahannya.`,
        `Every storey projects past the one below on all four sides, so the largest floor in this building is its highest: ${((base?.halfX ?? 0) * 2).toFixed(2)} m on the ground becoming ${((top?.halfX ?? 0) * 2).toFixed(2)} m at the top. No other building here has floors that grow as they rise: the Tobati kariwari, the only other one with named stacked floors, gets smaller upward because the older age grades hold fewer people. And not one pack ever stated that as a rule. An agreement that has never been contradicted is indistinguishable from a constraint, and this building is the contradiction.`,
      ),
      value: t(((top?.halfX ?? 0) * 2).toFixed(2), ((top?.halfX ?? 0) * 2).toFixed(2)),
      unit: t('m lantai teratas, yang terlebar', 'm at the top, the widest floor'),
    },
    {
      key: 'pale',
      title: t('Kedudukan menetapkan seberapa jauh orang boleh membangun keluar', 'Rank decides how far you may build outward'),
      body: t(
        `${info.glossId} Tritisannya dipikul lengan-lengan pale, dan banyaknya lengan adalah kedudukan. Ini satu-satunya pak di sini yang aturan sosialnya menetapkan sebuah kantilever: pada tongkonan pangkat mengalikan ukuran, pada joglo pangkat menumpuk atap, pada saoraja pangkat menumpuk papan yang tidak memikul apa-apa. Di sini kedudukan menetapkan seberapa jauh sebuah bangunan boleh menggantung di luar tapaknya sendiri.`,
        `${info.glossEn} The projection is carried on pale arms, and how many there are is standing. This is the only pack here whose social rule sets a cantilever: on a tongkonan rank multiplies size, on a joglo it stacks roofs, on a saoraja it stacks boards that carry nothing. Here standing decides how far a building may hang outside its own footprint.`,
      ),
      value: t(String(info.count), String(info.count)),
      unit: t('lengan pada tiap sisi tiap tingkat', 'arms to each side of each storey'),
    },
    {
      key: 'jangkauan',
      title: t('Batasnya berada di puncak', 'The limit is at the top'),
      body: t(
        `Semua lengan bertolak dari rangka tiang yang sama, jadi yang harus dijangkau tiap lengan adalah tritisan yang sudah tertumpuk sampai tingkatnya: lantai teratas berdiri ${span.toFixed(2)} m di luar rangka, terhadap lengan sepanjang ${layout.reach.toFixed(2)} m. Lengan teratas selalu yang terpanjang — jadi yang pertama kehabisan adalah tingkat yang paling penting, dan rumah tangga yang menjorok terlalu jauh kehilangan justru lantai yang menjadi alasannya menjorok.`,
        `Every arm springs from the same frame of posts, so what each one has to span is the projection accumulated up to its own level: the topmost floor stands ${span.toFixed(2)} m outside the frame against an arm reaching ${layout.reach.toFixed(2)} m. The topmost arm is always the longest — so the first thing to run out is the storey that matters most, and a household that overreaches loses exactly the floor it was overreaching for.`,
      ),
      value: t(span.toFixed(2), span.toFixed(2)),
      unit: t('m di luar rangka, di lantai teratas', 'm outside the frame, at the top floor'),
    },
    {
      key: 'besi',
      title: t('Tanpa besi sebatang pun', 'Not one piece of iron'),
      body: t(
        'Seluruh rangkanya dipasak dan dibaji. Rumoh Aceh juga tidak memakai besi, dan kedua bangunan itu layak dibaca berpasangan: di Aceh ketiadaan besi menjawab tanah yang bergerak — balok yang diikat dapat sedikit bergeser tanpa patah — sedangkan di sini ia menjawab bangunan yang setiap tingkatnya menggantung di luar tingkat di bawahnya, dan yang karena itu memang harus dapat sedikit bekerja.',
        'The whole frame is pegged and wedged. The rumoh Aceh uses no iron either, and the two are worth reading together: in Aceh the absence answers ground that moves — a lashed beam can shift a little without breaking — while here it answers a building each of whose storeys hangs outside the one below, and which therefore has to be able to work a little.',
      ),
      value: t('0', '0'),
      unit: t('paku, sekrup, atau angkur', 'nails, screws or anchors'),
    },
    {
      key: 'benteng',
      title: t('Berdiri di dalam benteng', 'It stands inside a fortress'),
      body: t(
        `Malige berdiri di dalam benteng Keraton Buton — dinding batu karang yang melingkupi satu kampung utuh, bukan satu pekarangan. Ini satu-satunya bangunan dalam kumpulan ini yang tapaknya sebuah pertahanan. Rumah Korowai juga dibangun untuk berada di luar jangkauan, dan jawabannya berlawanan: yang satu naik ke atas pohon sendirian, yang satu berdiri di tengah tembok bersama seluruh kampungnya.`,
        `The malige stands inside the Keraton wall at Baubau — coral stone enclosing a whole settlement rather than a compound. It is the only building in this collection whose site is a fortification. The Korowai house is also built to be out of reach, and its answer is the opposite: one goes up a tree by itself, the other stands in the middle of a wall with its whole settlement.`,
      ),
      value: t(layout.benteng.toFixed(0), layout.benteng.toFixed(0)),
      unit: t('m ke dinding benteng', 'm to the fortress wall'),
    },
  ]

  return {
    key: 'buton',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Malige', 'Malige'),
    subhead: t(
      `${rules.tingkat} tingkat · ${info.count} pale · melebar ke atas`,
      `${rules.tingkat} storeys · ${info.count} pale · widening as it rises`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = overhangCounterexample()
  const rows = (w: { span: number; reach: number }): readonly Readout[] => [
    { label: t('lantai teratas di luar rangka', 'top floor outside the frame'), value: `${w.span.toFixed(2)} m` },
    { label: t('jangkauan sebuah lengan', 'reach of an arm'), value: `${w.reach.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Menjorok lebih jauh adalah justru maksud bangunan ini, dan menambahnya tidak merusak apa pun yang lain: tiap tingkat tetap lebih lebar daripada tingkat di bawahnya, lengannya tetap sebanyak yang menjadi hak, rangkanya tetap tegak, atapnya tetap menutup. Yang habis adalah lengannya. Semua tritisan bertumpuk dari rangka yang sama, jadi lantai teratas selalu yang terjauh dan lengan teratas selalu yang terpanjang — dan lewat satu titik ia lebih panjang daripada sebatang kayu yang menjulur dari sebuah tiang. Batasnya jatuh di puncak, yaitu tingkat yang paling penting.',
      'Reaching further out is the point of this building, and adding to it breaks nothing else: every storey is still wider than the one below, the arms are still there in the number the rank allows, the frame is still plumb, the roof still covers. What runs out is the arm. Every projection accumulates from the same frame, so the topmost floor is always the furthest out and the topmost arm always the longest — and past a point it is longer than a piece of timber leaning out of a post can be. The limit lands at the top, which is the storey that matters most.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'buton',
    slug: 'buton',
    house: t('Malige', 'Malige'),
    people: t('Buton', 'The Butonese'),
    place: t('Baubau, Pulau Buton', 'Baubau, on Buton island'),
    about: t(
      'Malige adalah rumah kesultanan Wolio di Baubau: empat tingkat kayu, dipasak dan dibaji tanpa sebatang besi pun, berdiri di dalam benteng Keraton Buton. Yang membuatnya layak dibangun di sini adalah bentuknya: tiap tingkat menjorok melewati tingkat di bawahnya pada keempat sisinya, sehingga bangunan ini melebar semakin ke atas dan lantai terbesarnya adalah yang tertinggi. Tidak ada bangunan lain di sini yang lantainya bertambah besar ke atas, dan tidak satu pak pun pernah menyatakan itu sebagai aturan — padahal kesepakatan yang tidak pernah dibantah tidak dapat dibedakan dari keharusan. Yang kedua: tritisan itu dipikul lengan-lengan pale yang jumlahnya adalah kedudukan pemiliknya, jadi di sini kedudukan menetapkan seberapa jauh orang boleh membangun keluar. Matahari pada model ini dihitung untuk Baubau, 5,47° LS dan 122,62° BT.',
      'A malige is the Wolio sultanate’s house at Baubau: four storeys of timber, pegged and wedged without a single piece of iron, standing inside the Keraton fortress wall. What makes it worth building here is its shape: every storey projects past the one below on all four sides, so the building widens as it rises and its largest floor is its highest. No other building here has floors that grow as they rise, and not one pack ever stated that as a rule — though an agreement that has never been contradicted is indistinguishable from a constraint. The second reason: the projection is carried on pale arms whose number is the household’s standing, so here rank decides how far you may build outward. The sun in this model is computed for Baubau, 5.47° S and 122.62° E.',
    ),
    caution: t(
      'Yang dibangun di sini adalah susunan tingkat dan tritisannya, bukan rumahnya secara utuh. Malige yang sesungguhnya penuh ukiran — naga, nanas, dan ragam hias pada tiap tepi lantai — dan tidak satu pun dimodelkan, dengan alasan yang sama seperti pada pak-pak lain. Selain itu: pale di sini dimodelkan sebagai lengan mendatar, sedangkan yang sesungguhnya kerap berupa siku menyerong; jumlah baris tiang dibuat mengikuti jumlah pale, dan itu bacaan penulis, bukan keterangan sumber; pembagian ruang di dalam tiap tingkat tidak dibangun; dan tiap meter dalam pak ini adalah tafsiran atas uraian yang diterbitkan, bukan hasil pengukuran — meskipun bangunannya masih berdiri di Baubau dan sudah diukur orang lain.',
      'What is built here is the stack of storeys and their projections, not the whole house. A real malige is covered in carving — nagas, pineapple finials, ornament along every floor edge — and none of it is modelled, for the reason the other packs give. Beyond that: the pale are modelled as horizontal arms where real ones are often diagonal brackets; the number of post lines is made to follow the number of arms, which is the author’s reading rather than a source’s statement; the division of rooms within each storey is not built; and every metre here is an interpretation of published descriptions rather than a measurement — though the building is still standing at Baubau and has been measured by other people.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin di dalam pak ini: yang menentukan letak malige adalah benteng dan kampung di dalamnya. Model ini menaruh muka di −X dan bubungan searah sumbu itu. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule in this pack: what places a malige is the fortress and the settlement inside it. This model puts the front at −X with the ridge along that axis. There is still no control that turns the building.',
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
          'Pasak kayu menembus lubang dan pen. Tidak ada besi di seluruh bangunan ini, dan kaki tiangnya duduk pada cekungan di batunya sendiri.',
          'A timber peg through a mortise and tenon. There is no iron anywhere in this building, and the foot of each post sits in a hollow in its own stone.',
        ),
      },
      {
        kind: 'baji',
        name: t('Baji', 'Wedge'),
        gloss: t(
          'Baji yang mengikat lantai turun ke lengan pale yang memikulnya. Sambungan yang dapat dikencangkan kembali, pada bangunan yang setiap tingkatnya menggantung di luar tingkat di bawahnya.',
          'The wedge that ties a floor down onto the arm carrying it. A joint that can be tightened again, on a building each of whose storeys hangs outside the one below.',
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
