/**
 * The siwaluh jabu, as the registry sees it.
 *
 * The eighteenth file of this shape, and the third whose subject is several
 * households under one roof — which the registry has never had to notice,
 * because it does not know what a household is.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { hearthGaps, runInvariants } from './invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  SOURCES,
  STAGES,
  partClass,
  partSplit,
  pintuInfo,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { hearthCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Four households, one door, and no upper tier. */
const SHOWCASE: Rules = { jabu: 4, tersek: false, pintu: 'satu' }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = pintuInfo(rules.pintu)
  const tightest = hearthGaps(house, layout).reduce((min, g) => Math.min(min, g.gap), Infinity)
  const area = layout.length * layout.halfZ * 2

  const readout: readonly Readout[] = [
    { label: t('Rumah tangga', 'Households'), value: String(layout.jabu.length) },
    { label: t('Sekat', 'Partitions'), value: '0' },
    { label: t('Tungku', 'Hearths'), value: String(layout.hearths.length) },
    { label: t('Ruang', 'The room'), value: `${area.toFixed(1)} m²` },
    { label: t('Jarak api terkecil', 'Tightest gap to a fire'), value: `${tightest.toFixed(2)} m` },
    { label: t('Pintu', 'Doors'), value: String(info.count) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'satu-ruang',
      title: t('Delapan rumah tangga, dan tidak ada satu sekat pun', 'Eight households, and not one partition'),
      body: t(
        'Tiga bangunan dalam projek ini menjawab pertanyaan yang sama — apa yang dilakukan sebuah bangunan ketika beberapa rumah tangga tinggal di dalamnya — dan tidak satu pun jawabannya berbagi satu anggota. Rumah betang memberi tiap rumah tangga bilik sendiri dan memanjang satu bilik tiap kali. Baileo membuat tempat duduk tiap klan sama besar menurut aturan. Rumah ini tidak membagi apa pun: satu ruang, satu lantai, dan yang memisahkan orang hanyalah letaknya.',
        'Three buildings in this project answer the same question — what a building does when several households live in it — and no two answers share a member. A rumah betang gives each household a room of its own and lengthens by one each time. A baileo makes every clan’s seat equal by rule. This house divides nothing at all: one room, one floor, and what separates people is where they are.',
      ),
      value: t('0', '0'),
      unit: t('sekat di dalam ruangnya', 'partitions inside the room'),
    },
    {
      key: 'kedudukan',
      title: t('Kedudukan yang tidak dapat dilepas', 'A standing that cannot be taken down'),
      body: t(
        'Rumah limas menyatakan kedudukan dengan tinggi lantai, saoraja dengan tumpukan papan yang tidak menahan apa-apa, tongkonan dengan pengali yang membesarkan seluruh bangunan. Rumah ini menyatakannya dengan tempat. Papan dapat dilepas dan lantai dapat diratakan, tetapi letak tidak dapat dicopot dari sebuah ruangan tanpa membongkar ruangannya — jadi ini satu-satunya penanda kedudukan dalam projek ini yang tidak dapat berbohong dan tidak dapat dihilangkan.',
        'The rumah limas states standing in the height of a floor, the saoraja in a stack of boards that carries nothing, the tongkonan in a multiplier that enlarges the whole building. This house states it in a position. Boards can be taken off and a floor can be levelled, but a position cannot be removed from a room without removing the room — so this is the only marker of standing in the project that can neither lie nor be dismantled.',
      ),
      value: t(String(layout.jabu.length), String(layout.jabu.length)),
      unit: t('tempat, berurutan dari ujung pangkal', 'places, ordered from the root end'),
    },
    {
      key: 'pohon',
      title: t('Urutannya ditetapkan oleh arah tumbuh sebuah pohon', 'The order is set by the way a tree grew'),
      body: t(
        'Balok besar dipasang dengan pangkal pohon di satu ujung, dan rumah tangga di ujung itu — jabu bena kayu — adalah yang tertua; jabu ujung kayu ada di ujung yang lain. Tidak ada apa pun dalam bentuk bangunannya yang menunjukkan ujung mana itu: yang menyimpannya adalah kayunya sendiri. Ini satu-satunya aturan dalam projek ini yang datumnya sifat bahan, bukan orang, tempat, arah mata angin, atau langit.',
        'The great beams are laid with the root of the tree at one end, and the household at that end — jabu bena kayu — is the senior one; jabu ujung kayu is at the other. Nothing in the shape of the building shows which end that is: what keeps it is the timber. This is the only rule in this project whose datum is a property of the material rather than of people, of a place, of a compass bearing, or of the sky.',
      ),
      value: t('bena kayu', 'bena kayu'),
      unit: t('ujung pangkal, tempat yang tertua', 'the root end, and the senior place'),
    },
    {
      key: 'api',
      title: t('Tanpa sekat, yang menjaga api hanyalah jarak', 'With no partitions, distance is what keeps the fire'),
      body: t(
        `Empat tungku menyala di ruang yang sama dengan semua orang dan semua tiang. Di rumah betang tiap api berada di dalam biliknya sendiri dan biliknya yang menjaganya dari rangka; di sini tidak ada bilik, jadi yang menjaganya adalah sebuah angka: ${layout.hearthClearance.toFixed(2)} m dari tepi tungku ke tiang atau dinding terdekat. Bangunan ini berbahaya justru karena alasan yang membuatnya menarik.`,
        `Four fires burn in the same room as everybody and every post. In a rumah betang each fire is inside its own bilik and the bilik keeps it off the frame; here there is no bilik, so what keeps it is a figure: ${layout.hearthClearance.toFixed(2)} m from the edge of a hearth to the nearest post or wall. This building is dangerous for exactly the reason it is interesting.`,
      ),
      value: t(tightest.toFixed(2), tightest.toFixed(2)),
      unit: t('m, jarak terkecil ke sebuah tiang', 'm, the tightest gap to a post'),
    },
    {
      key: 'pintu',
      title: t('Siapa yang dilewati untuk masuk', 'Whose place you cross to get in'),
      body: t(
        `${info.glossId} Dengan satu pintu, kedudukan yang biasanya hanya terasa pada upacara menjadi urusan sehari-hari — dan itu perbedaan yang dibuat oleh satu bukaan, di sebuah bangunan yang tidak punya sekat untuk menyatakan apa pun yang lain.`,
        `${info.glossEn} With one door, a standing that would otherwise be felt at a ceremony becomes an everyday matter — and that is the difference one opening makes, in a building with no partitions to state anything else with.`,
      ),
      value: t(String(info.count), String(info.count)),
      unit: t('pintu', info.count === 1 ? 'door' : 'doors'),
    },
  ]

  return {
    key: 'karo',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Siwaluh jabu', 'Siwaluh jabu'),
    subhead: t(
      `${layout.jabu.length} rumah tangga · ${layout.hearths.length} tungku · tanpa sekat`,
      `${layout.jabu.length} households · ${layout.hearths.length} hearths · no partitions`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = hearthCounterexample()
  const rows = (w: { gap: number; needed: number }): readonly Readout[] => [
    { label: t('jarak terkecil', 'tightest gap'), value: `${w.gap.toFixed(2)} m` },
    { label: t('yang disyaratkan', 'what is required'), value: `${w.needed.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Besarkan tungkunya dan tidak ada satu pun bagian bangunan yang berubah: ruangnya tetap satu ruang, kedelapan tempatnya tetap di tempatnya, urutannya tetap berjalan dari ujung pangkal, atapnya tetap menindih. Yang terjadi adalah api terbuka mencapai tiang kayu di dalam bangunan yang tidak punya satu sekat pun untuk menahannya. Delapan belas bangunan, delapan belas aturan yang tidak dapat dilaksanakan — dan yang ini gagal justru karena alasan yang membuatnya layak dibangun: tanpa sekat, satu-satunya pengaman yang tersisa adalah jarak.',
      'Grow the hearth and nothing about the building changes: the room is still one room, the eight places are still in their places, the order still runs from the root end, the roof still laps. What happens is that an open fire reaches a timber post inside a building with no partition anywhere to stop it. Eighteen buildings, eighteen rules that cannot be carried out — and this one fails for exactly the reason it was worth building: with no partitions, the only safety left is distance.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'karo',
    slug: 'karo',
    house: t('Siwaluh jabu', 'Siwaluh jabu'),
    people: t('Karo', 'The Karo'),
    place: t('Tanah Karo, Sumatera Utara', 'The Karo highlands, North Sumatra'),
    about: t(
      'Siwaluh jabu berarti delapan rumah tangga, dan itulah bangunannya: satu ruang di atas panggung, tanpa satu sekat pun, dengan empat tungku yang masing-masing dipakai bersama oleh dua rumah tangga. Yang membuatnya layak dibangun di sini adalah bahwa ia jawaban ketiga atas pertanyaan yang sudah dijawab dua bangunan lain: apa yang dilakukan sebuah bangunan ketika beberapa rumah tangga tinggal di dalamnya. Rumah betang memberi tiap rumah tangga bilik sendiri; baileo menyamakan tempat duduk tiap klan; rumah ini tidak membagi apa pun, dan kedudukan dinyatakan lewat letak. Urutan letak itu ditetapkan oleh kayunya: balok besar dipasang dengan pangkal pohon di satu ujung, dan rumah tangga di ujung itu yang tertua. Matahari pada model ini dihitung untuk Tanah Karo, 3,19° LU dan 98,52° BT — tapak paling utara dalam kumpulan ini.',
      'Siwaluh jabu means eight households, and that is the building: one raised room with no partition anywhere, and four hearths each shared by two households. What makes it worth building here is that it is the third answer to a question two other buildings have already answered: what a building does when several households live in it. A rumah betang gives each household a room of its own; a baileo makes every clan’s seat equal; this one divides nothing, and standing is stated by position. The order of those positions is set by the timber: the great beams are laid with the root of the tree at one end, and the household at that end is the senior one. The sun in this model is computed for the Karo highlands, 3.19° N and 98.52° E — the northernmost site in this collection.',
    ),
    caution: t(
      'Delapan tempat itu punya nama masing-masing dalam kepustakaan, dan hanya dua yang dicetak di sini — jabu bena kayu dan jabu ujung kayu — karena penulis tidak cukup yakin akan enam sisanya; sisanya disebut menurut ujung dan sisinya saja. Ukiran rumah Karo, yang justru bagian yang paling diperhatikan pada bangunan sesungguhnya, sama sekali tidak ada. Kepala ayo-ayo pada ujung atap tidak dimodelkan. Tersek di sini digambar sebagai atap kedua di atas atap pertama, yang menyatakan tingginya dengan benar dan bentuknya secara hampiran. Dan tidak satu pun angka di sini berasal dari pengukuran.',
      'The eight places each have a name in the literature, and only two are printed here — jabu bena kayu and jabu ujung kayu — because the author is not confident enough of the other six; the rest are called by their end and their side. The carving on a Karo house, which on a real one is the part given the most attention, is entirely absent. The ayo-ayo head at the end of the roof is not modelled. The tersek is drawn as a second roof standing on the first, which states its height correctly and its shape approximately. And not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah berdiri berderet di sepanjang jalan kampung dengan lumbung menghadapnya, jadi kendalanya bersifat hubungan seperti pada rumah gadang. Yang berbeda adalah bahwa ujung mana yang tertua tidak ditetapkan oleh mata angin ataupun oleh apa yang dihadapi, melainkan oleh kayunya: pangkal pohon ada di satu ujung dan tempat yang tertua ada di situ. Model ini menaruh ujung pangkal di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The houses stand in a row along the village street with granaries facing them, so the constraint is relational as on the rumah gadang. What differs is that which end is senior is settled neither by a compass bearing nor by what is faced, but by the timber: the root of the tree is at one end and the senior place is there. This model puts the root end on −X. There is still no control that turns the building.',
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
          'Balok besar duduk dalam takik di kepala tiang. Balok inilah yang menyimpan arah tumbuh pohonnya, jadi sambungan ini juga yang menetapkan ujung mana yang tertua.',
          'The great beam sits in a notch in the post head. That beam is what keeps the direction the tree grew, so this joint is also what fixes which end is senior.',
        ),
      },
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Kasau diikat pada balok tepi atap dengan ijuk. Atapnya besar dan curam, dan seluruhnya bertumpu pada dinding yang condong ke luar.',
          'A rafter is lashed to the eave plate with palm fibre. The roof is large and steep, and all of it bears on walls that lean outward.',
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
