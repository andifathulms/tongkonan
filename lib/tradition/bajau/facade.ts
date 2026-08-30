/**
 * The lepa, as the registry sees it.
 *
 * The twenty-first file of this shape, and the one that tested the neutral
 * contract hardest: a building with no site, no orientation and no ground.
 * The registry asked for parts, a scene model, a timeline, verdicts and
 * provenance, and none of those turned out to require land.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { centreOf, runInvariants } from './invariants'
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
  ukuranInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { balanceCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The smallest boat, with the awning down: a hull, and not a house. */
const SHOWCASE: Rules = { ukuran: 'kecil', kajang: false, cadik: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = ukuranInfo(rules.ukuran)
  const centre = centreOf(house.parts)
  const above = centre.y - layout.draught

  const readout: readonly Readout[] = [
    { label: t('Panjang', 'Length'), value: `${layout.length.toFixed(1)} m` },
    { label: t('Lebar', 'Beam'), value: `${(layout.halfBeam * 2).toFixed(2)} m` },
    { label: t('Terbenam', 'Draught'), value: `${layout.draught.toFixed(2)} m` },
    { label: t('Sisa lambung', 'Freeboard'), value: `${layout.freeboard.toFixed(2)} m` },
    { label: t('Titik tengah di atas air', 'Centre above the water'), value: `${above.toFixed(2)} m` },
    { label: t('Aturan arah', 'Orientation rules'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'tanpa-tanah',
      title: t('Rumah yang tidak berdiri', 'A house that does not stand'),
      body: t(
        'Dua puluh bangunan lain dalam projek ini berdiri di atas sesuatu: bumi, pasangan batu, rawa pasang, lereng, dasar teluk. Kariwari adalah yang pertama tidak berdiri di atas darat — tetapi ia tetap berdiri, tiangnya dipancang ke dasar. Lepa mengapung. Ia tidak punya tapak, tidak punya denah di atas tanah, tidak punya jarak ke tetangga, dan tempatnya malam ini bukan sifat bangunannya.',
        'The other twenty buildings in this project stand on something: earth, masonry, tidal swamp, a hillside, the bed of a bay. The kariwari was the first that did not stand on land — but it still stands, its posts driven into the bottom. A lepa floats. It has no site, no plan on any land, no distance to a neighbour, and where it is tonight is not a property of the building.',
      ),
      value: t('0', '0'),
      unit: t('titik sentuh dengan tanah', 'points of contact with the ground'),
    },
    {
      key: 'tanpa-arah',
      title: t('Satu-satunya pak tanpa aturan arah', 'The only pack with no orientation rule'),
      body: t(
        'Dua puluh pak lain punya satu, dan ragamnya adalah salah satu temuan projek ini: mata angin, lumbung di seberang halaman, sungai, jalan, batu, pangkal sebatang pohon, arah turun lereng, arah salat. Pak ini tidak punya. Haluan bukan sebuah arah, dan tidak ada apa pun yang tetap untuk dihadapi — jadi ketiadaan itu kanon, bukan kelalaian, dan tabel sumbernya menyebutkannya sebagai nol.',
        'The other twenty packs each have one, and the variety of them is one of this project’s better findings: a compass bearing, a granary across a yard, a river, a road, a stone, the root of a tree, the fall of a hillside, the direction of prayer. This pack has none. A bow is not a direction and there is nothing fixed to face — so the absence is canon rather than an oversight, and the source table records it as a zero.',
      ),
      value: t('0', '0'),
      unit: t('aturan arah', 'orientation rules'),
    },
    {
      key: 'kajang',
      title: t('Kajanglah yang membuatnya rumah', 'The awning is what makes it a house'),
      body: t(
        'Di bawahnya orang tidur, makan, dan menyimpan miliknya. Menurunkannya tidak mengubah satu papan pun pada perahunya — lambungnya sama, geladaknya sama, gadingnya sama — dan bendanya berhenti menjadi tempat tinggal. Itu pernyataan paling terang dalam kumpulan ini tentang apa yang membedakan sebuah bangunan dari sebuah benda: bukan bahannya, bukan ukurannya, melainkan apakah ada orang yang tidur di bawahnya.',
        'Under it people sleep, eat and keep what they own. Taking it down changes not one plank of the boat — the same hull, the same deck, the same frames — and the thing stops being a dwelling. It is the clearest statement in this collection of what separates a building from an object: not its material, not its size, but whether anybody sleeps under it.',
      ),
      value: t(rules.kajang ? '1' : '0', rules.kajang ? '1' : '0'),
      unit: t(rules.kajang ? 'kajang: ini rumah' : 'kajang: ini lambung', rules.kajang ? 'awning: a house' : 'awning: a hull'),
    },
    {
      key: 'seimbang',
      title: t('Yang harus dilakukan bangunan ini dan tidak dilakukan yang lain', 'What this building must do and no other must'),
      body: t(
        `Tetap tegak. Rumah yang miring adalah rumah yang kemasukan air, jadi keseimbangan di sini syarat bangunan dan bukan urusan pelayaran — dan berat dijaga rendah: titik tengah seluruh bagiannya ${above.toFixed(2)} m di atas garis air, terhadap batas ${layout.centreLimit.toFixed(2)} m. Pemeriksaannya tidak dapat mengatakan perahunya stabil; projek ini tidak punya sifat bahan dan tidak akan punya. Yang dapat dikatakan adalah bahwa bagian-bagiannya berada di tempat rumah yang mengapung harus meletakkannya.`,
        `Stay upright. A house that lists is a house taking water, so balance here is a building requirement rather than a sailing one — and the weight is kept low: the centre of all its parts sits ${above.toFixed(2)} m above the waterline against a ${layout.centreLimit.toFixed(2)} m limit. The check cannot say the boat is stable; this project has no material properties and will not acquire any. What it can say is that the parts are where a floating house has to keep them.`,
      ),
      value: t(above.toFixed(2), above.toFixed(2)),
      unit: t('m, titik tengah di atas air', 'm, the centre above the water'),
    },
    {
      key: 'lambung',
      title: t('Lambungnya adalah primitif atap, dibalik', 'The hull is the roof primitive, turned over'),
      body: t(
        '`sweepSurface` ditulis untuk atap pelana melengkung tongkonan: sebuah penampang disapu sepanjang bubungan, turun ke tepi atap, dengan “lutut” di tempat kemiringannya patah. Balikkan, dan bubungan itu menjadi lunas, tepi atap menjadi tepi geladak, dan lutut itu menjadi lengkung bilga. Tidak ada satu baris pun di dalamnya yang harus berubah — jadi sapuan penampang sepanjang lengkung ternyata sebuah bentuk, bukan sebuah atap.',
        '`sweepSurface` was written for a tongkonan’s saddle roof: a section swept along a ridge, dropping to an eave, with a “knee” where the slope breaks. Turn it over and the ridge is a keel, the eave is a sheer, and the knee is the turn of the bilge. Not one line of it had to change — so a section swept along a curve turns out to be a shape rather than a roof.',
      ),
      value: t(String(layout.strakes * 2), String(layout.strakes * 2)),
      unit: t('papan lambung, dari satu permukaan', 'strakes, out of one surface'),
    },
  ]

  return {
    key: 'bajau',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Lepa', 'Lepa'),
    subhead: t(
      `${info.name} · ${layout.length.toFixed(1)} m · ${rules.kajang ? 'berkajang' : 'tanpa kajang'}`,
      `${info.name} · ${layout.length.toFixed(1)} m · ${rules.kajang ? 'awning up' : 'awning down'}`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = balanceCounterexample()
  const rows = (w: { centre: number; limit: number }): readonly Readout[] => [
    { label: t('titik tengah di atas air', 'centre above the water'), value: `${w.centre.toFixed(2)} m` },
    { label: t('batasnya', 'the limit'), value: `${w.limit.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tinggikan kajangnya dan rumah ini menjadi lebih baik menurut hampir setiap ukuran yang biasa dipakai untuk menilai rumah: ada ruang untuk duduk tegak, ada ruang untuk berdiri. Tidak satu papan pun pada lambungnya berubah. Yang terjadi adalah beban tempat tinggalnya naik, dan lambung yang sempit dengan berat di atas adalah lambung yang berguling. Dua puluh satu bangunan, dua puluh satu aturan yang tidak dapat dilaksanakan — dan hanya yang ini yang justru dijatuhkan oleh perbaikan yang paling ingin dilakukan siapa pun.',
      'Raise the awning and this house improves by nearly every measure a house is normally judged by: room to sit up, room to stand. Not one plank of the hull changes. What happens is that the weight of the dwelling goes up, and a narrow hull with weight high in it is a hull that rolls. Twenty-one buildings, twenty-one rules that cannot be carried out — and this is the only one brought down by exactly the improvement anybody would most want to make.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'bajau',
    slug: 'bajau',
    house: t('Lepa', 'Lepa'),
    people: t('Sama-Bajau', 'The Sama-Bajau'),
    place: t('Perairan Wakatobi, Sulawesi Tenggara', 'The waters of Wakatobi, South-East Sulawesi'),
    about: t(
      'Lepa adalah rumah-perahu Sama-Bajau: sebuah lambung papan dengan kajang daun nipah di atas bagian tengahnya, tempat satu rumah tangga tinggal. Yang membuatnya layak dibangun di sini adalah apa yang tidak dimilikinya. Tidak ada tanah di bawahnya, tidak ada tapak, tidak ada denah di atas darat, dan — satu-satunya dalam kumpulan ini — tidak ada aturan arah sama sekali. Yang menggantikannya adalah keseimbangan: rumah yang miring adalah rumah yang kemasukan air, jadi ini satu-satunya bangunan di sini yang harus tetap tegak. Matahari pada model ini dihitung untuk perairan Wakatobi, 5,3° LS dan 123,6° BT — meskipun bagi bangunan ini letak itu hanyalah tempatnya malam ini.',
      'A lepa is the Sama-Bajau boat-house: a planked hull with a nipa awning over its middle, and a household living aboard. What makes it worth building here is what it does not have. No ground under it, no site, no plan on any land, and — alone in this collection — no orientation rule at all. What replaces that is balance: a house that lists is a house taking water, so this is the only building here that must stay upright. The sun in this model is computed for the waters of Wakatobi, 5.3° S and 123.6° E — though for this building that position is only where it is tonight.',
    ),
    caution: t(
      'Yang dimodelkan di sini adalah lambung, geladak, kajang, tungku, dan cadiknya — bukan kehidupannya. Sebuah lepa yang sesungguhnya penuh oleh alat: dayung, tombak, jaring, tempat air, layar pada sebagian perahu, dan barang milik satu rumah tangga; tidak satu pun ada di sini, dan justru barang-barang itulah yang membuat perahunya menjadi rumah bagi orang yang tinggal di dalamnya. Ukiran pada haluan dan buritan tidak ada. Banyak keluarga Sama-Bajau kini tinggal di rumah panggung di atas air dan bukan di perahu, dan model ini tidak menyatakan bahwa yang ini lebih asli daripada yang itu. Dan tidak satu pun angka di sini berasal dari pengukuran, termasuk batas keseimbangan yang seluruh pemeriksaannya bertumpu padanya.',
      'What is modelled here is the hull, the deck, the awning, the hearth and the outriggers — not the life. A real lepa is full of gear: paddles, spears, nets, water containers, a sail on some boats, and the belongings of a household; none of that is here, and it is exactly those things that make the boat a home to the people in it. There is no carving at the bow or the stern. Many Sama-Bajau families now live in houses on stilts over the water rather than aboard, and this model does not claim that this one is the more authentic. And not one figure here comes from a measurement, the balance limit the whole check rests on included.',
    ),
    orientation: t(
      'Tidak ada. Ini satu-satunya bangunan dalam kumpulan ini yang paknya tidak menyatakan satu pun aturan arah, dan ketiadaan itu kanon: haluan bukan sebuah arah, dan tidak ada apa pun yang tetap untuk dihadapi. Model ini menaruh haluan di −X karena sebuah model memerlukan sumbu, bukan karena bangunannya memerlukan arah. Tetap tidak ada kendali untuk memutar bangunan — dan di sini itu bukan lagi soal kendali melainkan soal bahwa tidak ada yang dapat diputar terhadap apa pun.',
      'There is none. This is the only building in the collection whose pack declares no orientation rule at all, and the absence is canon: a bow is not a direction, and there is nothing fixed to face. This model puts the bow on −X because a model needs axes, not because the building needs a direction. There is still no control that turns the building — and here that is no longer about a control but about there being nothing to turn it with respect to.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pasak',
        name: t('Pasak', 'Dowel'),
        gloss: t(
          'Pasak kayu menembus tepi dua papan, dan gading dipasak pada kelson di dalam lambung yang sudah berbentuk. Kulit lebih dulu, rangka kemudian: kebalikan dari setiap bangunan lain dalam projek ini.',
          'A wooden dowel through the edges of two planks, and the frames pegged to the keelson inside a shell that already has its shape. Skin first, frame second: the reverse of every other building in this project.',
        ),
      },
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Rangka kajang diikat pada geladak. Ikatan, karena kajang naik dan turun: rumahnya dapat dibongkar dari perahunya dalam satu sore.',
          'The awning hoops are lashed to the deck. Lashed, because the awning goes up and comes down: the house can be taken off the boat in an afternoon.',
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
