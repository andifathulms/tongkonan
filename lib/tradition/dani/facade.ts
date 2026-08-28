/**
 * The honai, as the registry sees it.
 *
 * The thirteenth file of this shape and still no shared code between them.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { runInvariants } from './invariants'
import {
  ALL_DIMS,
  BANGUNAN,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  SOURCES,
  STAGES,
  bangunanInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { volumeCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The men's house under a thick blanket. */
const SHOWCASE: Rules = { bangunan: 'honai', lapis: 7, loteng: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = bangunanInfo(rules.bangunan)

  const readout: readonly Readout[] = [
    { label: t('Isi ruang', 'Volume'), value: `${layout.volume.toFixed(1)} m³` },
    { label: t('Garis tengah', 'Across'), value: `${(layout.radius * 2).toFixed(2)} m` },
    { label: t('Tinggi puncak', 'Apex'), value: `${layout.apexY.toFixed(2)} m` },
    { label: t('Jendela', 'Windows'), value: '0' },
    { label: t('Tinggi pintu', 'Door height'), value: `${layout.door.height.toFixed(2)} m` },
    { label: t('Selimut', 'Blanket'), value: `${rules.lapis} × ${(DIMS.layerDepth.value * 100).toFixed(0)} cm` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'dingin',
      title: t('Persoalan apa yang dijawab bangunan ini', 'What problem this building answers'),
      body: t(
        'Dingin. Lembah Baliem berada seribu enam ratus meter di atas laut, tepat di khatulistiwa: siangnya sejuk dan malamnya dingin, dan sebuah honai adalah alat untuk menahan panas api sampai pagi. Semuanya mengikuti dari situ — kecil, karena ruang kecil lebih murah dihangatkan; bundar, karena lingkaran mengurung lantai terbanyak dengan dinding tersedikit; rendah, karena panas naik; tanpa jendela; dan berpintu yang membuat orang membungkuk. Dua belas bangunan lain di sini menjawab hujan, tanah yang bergerak, lapuk, tikus, atau kedudukan. Ini satu-satunya yang menjawab suhu.',
        'Cold. The Baliem valley is sixteen hundred metres above the sea and on the equator: the days are mild and the nights are not, and a honai is a device for holding a fire’s heat until morning. Everything follows from that — small, because a small volume is cheaper to warm; round, because a circle encloses the most floor for the least wall; low, because heat rises; no window at all; and a door that makes a person stoop. The other twelve buildings here answer rain, a moving ground, rot, rats, or standing. This is the only one that answers temperature.',
      ),
      value: t(`${layout.volume.toFixed(0)}`, `${layout.volume.toFixed(0)}`),
      unit: t('m³ yang harus dihangatkan', 'm³ to keep warm'),
    },
    {
      key: 'niang',
      title: t('Bandingkan dengan mbaru niang', 'Set it beside the mbaru niang'),
      body: t(
        'Keduanya bundar, keduanya beratap rumput sampai ke tanah, dan keduanya memakai primitif geometri yang sama persis dalam projek ini. Yang satu setinggi lima belas meter dan menyimpan lima lantai persediaan; yang lain berhenti di bawah tiga meter dan menyimpan sebuah api. Kebundaran ternyata tidak mengatakan apa-apa dengan sendirinya — mbaru niang bundar untuk menumpuk lima simpanan di dalam kerucut, honai bundar karena lingkaran adalah dinding termurah untuk dihangatkan.',
        'Both are round, both are thatched in grass to the ground, and both use exactly the same geometric primitive in this project. One is fifteen metres tall and holds five floors of stores; the other stops short of three and holds a fire. Roundness turns out to say nothing on its own — the mbaru niang is round to stack five stores inside a cone, and the honai because a circle is the cheapest wall to warm.',
      ),
      value: t(`${(layout.radius * 2).toFixed(1)}`, `${(layout.radius * 2).toFixed(1)}`),
      unit: t('m — mbaru niang 11,4 m', 'm — a mbaru niang is 11.4'),
    },
    {
      key: 'tidur',
      title: t('Mengapa orang tidur di atas', 'Why people sleep upstairs'),
      body: t(
        'Karena panas naik. Api menyala di tengah lantai tanpa cerobong, dan bidang tidurnya diletakkan tepat di atasnya. Ini bukan penjelasan tentang mengapa rumah ini hangat; ini sebuah lantai yang diletakkan menurut penjelasan itu — argumen termal bangunan ini yang dijadikan bidang, dan satu-satunya kali dalam projek ini sebuah gagasan fisika muncul sebagai perabot.',
        'Because heat rises. A fire burns at the centre of the floor with no chimney, and the sleeping plane is put directly above it. This is not an explanation of why the house is warm; it is a floor placed according to one — the building’s thermal argument turned into a plane, and the only time in this project a piece of physics appears as furniture.',
      ),
      value: t(`${layout.loft.present ? layout.loft.y.toFixed(2) : '—'}`, `${layout.loft.present ? layout.loft.y.toFixed(2) : '—'}`),
      unit: layout.loft.present ? t('m di atas api', 'm above the fire') : t('tanpa loteng', 'no loft'),
    },
    {
      key: 'lapis',
      title: t('Apa yang diputuskan sebuah rumah tangga di sini', 'What a household decides here'),
      body: t(
        'Setebal apa selimutnya. Setiap lapis tambahan berarti panas bertahan lebih lama, dan berarti lebih banyak rumput yang harus dipotong dan dipikul — jadi angka itu adalah pertukaran antara sebuah malam dan sebuah pekerjaan. Ia tidak mengubah siapa yang tinggal di sini, apa yang boleh diakui rumah tangganya, atau bagaimana bangunannya dipakai. Satu-satunya aturan dalam projek ini yang seluruhnya soal panas.',
        'How thick the blanket is. Every extra layer means the heat lasts longer and means more grass to cut and carry — so the number is a trade between a night and a job of work. It changes nothing about who lives here, what the household may claim, or how the building is used. The only rule in this project that is entirely about heat.',
      ),
      value: t(String(rules.lapis), String(rules.lapis)),
      unit: t(`lapis · ${(layout.thatchDepth * 100).toFixed(0)} cm`, `layers · ${(layout.thatchDepth * 100).toFixed(0)} cm`),
    },
    {
      key: 'tiga',
      title: t('Apa lagi yang ada di dalam pagarnya', 'What else is inside the fence'),
      body: t(
        'Dua bangunan lain yang sama. Satu pekarangan Dani berisi honai untuk laki-laki, ebei untuk perempuan dan anak-anak, dan wamai untuk babi — ketiganya bangunan yang sama dengan ukuran berbeda, dan tak satu pun versi yang lebih rendah dari yang lain. Babinya dihangatkan dengan alasan yang persis sama dengan orangnya, dan itulah satu-satunya kali dalam projek ini sebuah bangunan untuk hewan dibuat menurut aturan yang sama, bukan sebagai sisa.',
        'Two more of the same. A Dani compound holds a honai for the men, an ebei for the women and children, and a wamai for the pigs — the three are the same building at different sizes and none is a lesser version of another. The pigs are kept warm for exactly the same reason the people are, and that is the only time in this project a building for animals is made by the same rules rather than as an afterthought.',
      ),
      value: t('3', '3'),
      unit: t('bangunan, satu pagar', 'buildings, one fence'),
    },
  ]

  return {
    key: 'dani',
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
      `${(layout.radius * 2).toFixed(1)} m · ${layout.volume.toFixed(0)} m³ · 0 jendela`,
      `${(layout.radius * 2).toFixed(1)} m across · ${layout.volume.toFixed(0)} m³ · 0 windows`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = volumeCounterexample()
  const rows = (w: { radius: number; volume: number }): readonly Readout[] => [
    { label: t('jari-jari', 'radius'), value: `${w.radius.toFixed(2)} m` },
    { label: t('isi ruang', 'volume'), value: `${w.volume.toFixed(1)} m³` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Lebarkan dindingnya dan tidak ada yang gagal secara struktur: lingkarannya tetap menutup, kubahnya tetap menudunginya, pintunya tetap membuat orang membungkuk, lotengnya tetap di atas api. Semua pemeriksaan lain di pak ini terus lulus. Yang berhenti benar hanyalah bahwa ruangnya kecil — dan honai yang tidak kecil adalah rumah bundar beratap rumput dengan api di dalamnya, sebuah pemerian yang juga cocok untuk mbaru niang dan karena itu tidak mengatakan apa-apa tentang keduanya. Tiga belas bangunan, tiga belas aturan yang tidak dapat dilaksanakan. Yang ini gagal seperti rumah kaki seribu gagal: tidak ada yang patah, dan bendanya berhenti menjadi untuk apa ia ada.',
      'Widen the wall and nothing fails structurally: the ring still closes, the dome still covers it, the door still makes a person stoop, the loft is still above the fire. Every other check in this pack goes on passing. The only thing that stops being true is that the room is small — and a honai that is not small is a round thatched house with a fire in it, a description that fits a mbaru niang equally and therefore says nothing about either. Thirteen buildings, thirteen rules that cannot be carried out. This one fails the way the rumah kaki seribu does: nothing breaks, and the thing stops being what it was for.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'dani',
    slug: 'dani',
    house: t('Honai', 'Honai'),
    people: t('Dani', 'Dani'),
    place: t('Lembah Baliem, Papua Pegunungan', 'The Baliem Valley, Highland Papua'),
    about: t(
      'Honai adalah rumah orang Dani di Lembah Baliem: satu ruang bundar berdinding kayu rapat, beratap kubah alang-alang yang tebal, dengan api di tengah lantai dan loteng tidur di atasnya. Yang membuatnya layak dibangun di sini adalah persoalan yang dijawabnya. Lembah itu berada seribu enam ratus meter di atas laut tepat di khatulistiwa, dan malamnya dingin — jadi ini satu-satunya bangunan dalam projek ini yang seluruh bentuknya jawaban atas suhu. Kecil, rendah, bundar, tanpa jendela, dan berpintu yang membuat orang membungkuk. Matahari pada model ini dihitung untuk Lembah Baliem, 4,08° LS dan 138,95° BT.',
      'A honai is the house of the Dani in the Baliem valley: one round room walled in close-set timber under a thick grass dome, with a fire at the centre of the floor and a sleeping loft above it. What makes it worth building here is the problem it answers. The valley is sixteen hundred metres above the sea and on the equator, and its nights are cold — so this is the only building in the project whose whole form is an answer to temperature. Small, low, round, windowless, and entered by stooping. The sun in this model is computed for the Baliem valley, 4.08° S and 138.95° E.',
    ),
    caution: t(
      'Bangunan ini tidak pernah bisa membuktikan dirinya. Projek ini tidak punya sifat bahan dan tidak akan punya, jadi pemeriksaan di sini menguji bentuk yang mengikuti sebuah argumen termal dan tidak pernah argumennya — persis batas yang dinyatakan pak Nias tentang segitiganya. Selain itu: seluruh angka metriknya perkiraan penulis; tebal selimut dinyatakan sebagai lapis karena begitulah orang menambahnya, bukan karena ada sumber yang memberi centimeternya; dan Papua Pegunungan berisi banyak suku dengan bangunan yang berbeda — ini rumah Dani di Lembah Baliem dan bukan “rumah Papua”, sebagaimana rumah kaki seribu adalah rumah Arfak dan bukan itu juga.',
      'This building can never prove itself. The project has no material properties and will not acquire any, so the checks here test form that follows from a thermal argument and never the argument itself — precisely the limit the Nias pack states about its triangles. Beyond that: every metric figure is the author’s estimate; the blanket is expressed in layers because that is how it is added rather than because any source gives a thickness; and Highland Papua holds many peoples with different buildings — this is a Dani house in the Baliem valley and not a “Papuan house”, just as the rumah kaki seribu is an Arfak house and not one either.',
    ),
    orientation: t(
      'Pintunya menghadap ke dalam pekarangan, ke arah halaman yang dikelilingi honai, ebei, wamai dan pagarnya. Aturannya bersifat hubungan seperti pada beberapa rumah lain di sini, tetapi yang dituju bukan gunung, sungai, laut, jalan atau kubur melainkan sebuah halaman kecil tempat ketiga bangunan itu saling berhadapan. Dan seperti pada mbaru niang, pintu itulah satu-satunya hal yang memberi arah kepada sebuah bentuk bundar. Model ini menaruh pintu pada +X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The door faces inward, toward the yard that the honai, the ebei, the wamai and their fence enclose. The rule is relational as in several houses here, but what is faced is neither a mountain, a river, the sea, a road nor a grave: it is a small yard where the three buildings face one another. And as on the mbaru niang, that door is the only thing giving a round form any direction at all. This model puts the door on +X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Resting on the ring'),
        gloss: t(
          'Kasau turun ke lingkaran tiang dinding dan bertumpu di atasnya.',
          'A rafter comes down to the ring of wall posts and rests on it.',
        ),
      },
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Ikatan mengikat rangka. Seperti pada rumah kaki seribu, tidak ada pasak dan tidak ada takik — dua bangunan Papua dalam projek ini, dan keduanya mengikat.',
          'Lashings hold the frame. As on the rumah kaki seribu there are no pegs and no notches — two Papuan buildings in this project, and both tie.',
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
