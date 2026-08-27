/**
 * The mbaru niang, as the registry sees it.
 *
 * The fourth file of this shape and still no shared code between them, which
 * is the strongest evidence available that the interface was worth having and
 * that nothing behind it should be merged.
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
  peranInfo,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { levelsCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The drum house of a village, with a full complement of households. */
const SHOWCASE: Rules = { peran: 'gendang', keluarga: 8 }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const role = peranInfo(rules.peran)
  const lutur = layout.levels[0]
  const top = layout.levels[layout.levels.length - 1]

  const readout: readonly Readout[] = [
    { label: t('Garis tengah', 'Diameter'), value: `${(layout.baseRadius * 2).toFixed(2)} m` },
    { label: t('Tinggi puncak', 'Apex height'), value: `${layout.apexY.toFixed(2)} m` },
    { label: t('Lantai hunian', 'Living floor'), value: `${lutur?.y.toFixed(2)} m` },
    { label: t('Lantai teratas', 'Top floor'), value: `${top?.y.toFixed(2)} m` },
    { label: t('Juring keluarga', 'Household segments'), value: String(rules.keluarga) },
    { label: t('Lapis ijuk', 'Thatch courses'), value: String(layout.thatchCourses) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'keluarga',
      title: t('Berapa keluarga tinggal di dalamnya', 'How many households live inside'),
      body: t(
        'Hitung sekat yang memancar dari tiang tengah ke tepi lantai hunian, atau hitung tiang di lingkarannya — jumlahnya sama, karena tiap batas keluarga berdiri pada satu tiang. Satu tungku di tengah, dan semua keluarga duduk mengelilinginya.',
        'Count the partitions running from the centre post out to the edge of the living floor, or count the posts on the ring — the number is the same, because each household boundary stands on a post. One hearth at the centre, and every household sits around it.',
      ),
      value: t(String(rules.keluarga), String(rules.keluarga)),
      unit: t('keluarga', 'households'),
    },
    {
      key: 'peran',
      title: t('Apakah ini rumah gendang kampung', 'Whether this is the village drum house'),
      body: t(
        'Bentuknya tidak memberi tahu apa-apa: setiap mbaru niang adalah bangunan yang sama. Yang membedakan ada di dalamnya — gendang tergantung di lantai hunian rumah yang memegangnya, dan satu kampung punya satu. Ini satu-satunya tanda dalam projek ini yang tidak bisa dibaca dari luar sama sekali.',
        'The form tells you nothing: every mbaru niang is the same building. What differs is inside — the drum hangs on the living floor of the house that holds it, and a village has one. It is the only sign in this project that cannot be read from outside at all.',
      ),
      value: t(role.name, role.name),
      unit: role.drum ? t('gendang ada di dalam', 'the drum is inside') : t('tanpa gendang', 'no drum'),
    },
    {
      key: 'levels',
      title: t('Apa yang disimpan di setiap tingkat', 'What is kept on each floor'),
      body: t(
        'Lima lantai, dari bawah ke atas: lutur tempat orang tinggal, lobo untuk barang sehari-hari, lentar untuk benih musim depan, lempa rae untuk cadangan paceklik, dan hekang kode untuk sesaji leluhur. Urutannya naik dari yang dimakan hari ini sampai yang dipersembahkan — dan urutan itulah isi bangunannya, bukan hiasan yang ditempelkan padanya.',
        'Five floors, bottom to top: the lutur where people live, the lobo for everyday goods, the lentar for next season’s seed, the lempa rae for the reserve against a bad year, and the hekang kode for offerings to the ancestors. The order rises from what is eaten today to what is given — and that order is the content of the building rather than something applied to it.',
      ),
      value: t('5', '5'),
      unit: t(`${lutur?.y.toFixed(1)} m → ${top?.y.toFixed(1)} m`, `${lutur?.y.toFixed(1)} m → ${top?.y.toFixed(1)} m`),
    },
    {
      key: 'round',
      title: t('Ke arah mana rumah ini menghadap', 'Which way this house faces'),
      body: t(
        'Ke segala arah, dan karena itu ke arah mana pun tidak. Denahnya bundar dan atapnya kerucut: tidak ada muka, tidak ada sudut, tidak ada bubungan. Yang menentukan arah bukan bangunannya melainkan kampungnya — pintunya menghadap compang, batu upacara di tengah kampung. Tiga rumah lain di sini menyatakan arah pada bentuknya sendiri; yang ini menyerahkannya kepada tempat ia berdiri.',
        'Every way, and so no way in particular. The plan is round and the roof is a cone: no face, no corner, no ridge. What fixes a direction is not the building but the village — the door looks toward the compang, the ceremonial stone at its centre. The other three houses here state an orientation in their own form; this one leaves it to where it stands.',
      ),
      value: t(`${(layout.baseRadius * 2).toFixed(1)} m`, `${(layout.baseRadius * 2).toFixed(1)} m`),
      unit: t('selebar itu ke segala arah', 'as wide one way as the other'),
    },
    {
      key: 'thatch',
      title: t('Di mana dindingnya', 'Where the walls are'),
      body: t(
        'Tidak ada. Ijuk turun dari puncak sampai menyentuh tanah, jadi seluruh bagian luar bangunan ini adalah atap. Tidak ada tepi atap yang menggantung, tidak ada bidang dinding, dan tidak ada yang berdiri di luarnya — pemeriksaan atas hal itu lulus dengan tidak menemukan apa pun.',
        'There are none. The thatch runs from the apex down to the ground, so the entire exterior of this building is roof. There is no eave hanging over anything, no wall plane, and nothing standing outside it — the check for that passes by finding nothing.',
      ),
      value: t('0', '0'),
      unit: t('dinding', 'walls'),
    },
  ]

  return {
    key: 'manggarai',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(role.name, role.name),
    subhead: t(
      `${rules.keluarga} keluarga · 5 tingkat · garis tengah ${(layout.baseRadius * 2).toFixed(1)} m`,
      `${rules.keluarga} households · 5 floors · ${(layout.baseRadius * 2).toFixed(1)} m across`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = levelsCounterexample()
  const rows = (w: { topRadius: number; apex: number }): readonly Readout[] => [
    { label: t('lebar lantai teratas', 'top floor radius'), value: `${w.topRadius.toFixed(2)} m` },
    { label: t('tinggi puncak', 'apex'), value: `${w.apex.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Lima lantai itu kanon, dan kerucut inilah tempat kelimanya berdiri — jadi keduanya tidak berdiri sendiri. Renggangkan jarak antar lantai dan yang teratas naik ke bagian bangunan yang terlalu sempit untuk menjadi lantai, atau melewati ujung kerucut sama sekali. Tidak ada yang dinolkan dan tidak ada yang roboh: bangunannya habis sebelum lantainya habis. Aturan yang tidak dapat dilaksanakan, bukan aturan yang dilanggar — dan setelah empat rumah, tampaknya justru begitulah cara bangunan-bangunan ini gagal.',
      'Five floors is canon, and the cone is where all five of them stand — so the two are not independent. Space the storeys further apart and the topmost climbs into a part of the building too narrow to be a floor, or past the point of the cone altogether. Nothing is zeroed and nothing collapses: the building runs out before the floors do. A rule that cannot be carried out rather than a rule disobeyed — and after four houses, that appears to be how these buildings actually fail.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'manggarai',
    slug: 'manggarai',
    house: t('Mbaru niang', 'Mbaru niang'),
    people: t('Manggarai', 'Manggarai'),
    place: t('Wae Rebo, Flores, Nusa Tenggara Timur', 'Wae Rebo, Flores, East Nusa Tenggara'),
    about: t(
      'Mbaru niang adalah rumah orang Manggarai di dataran tinggi Flores, dan Wae Rebo adalah kampung tempat bentuk ini masih berdiri dan dibangun kembali. Denahnya bundar, atapnya kerucut, dan ijuknya turun sampai ke tanah — jadi seluruh bagian luarnya adalah atap: tidak ada dinding, tidak ada muka, tidak ada bubungan. Di dalamnya lima lantai bertumpuk, masing-masing bernama dan masing-masing untuk sesuatu, dari lantai hunian sampai loteng persembahan. Nama bagian pada layar ini — mbaru niang, niang gendang, lutur, lobo, lentar, lempa rae, hekang kode — adalah kata Manggarai. Matahari pada model ini dihitung untuk Wae Rebo, 8,72° LS dan 120,29° BT.',
      'A mbaru niang is the house of the Manggarai people in the highlands of Flores, and Wae Rebo is the village where the form still stands and has been rebuilt. The plan is round, the roof is a cone, and the thatch reaches the ground — so the whole exterior is roof: no wall, no face, no ridge. Inside are five stacked floors, each named and each for something, from the living floor to the loft where offerings are kept. The parts named on this screen — mbaru niang, niang gendang, lutur, lobo, lentar, lempa rae, hekang kode — are Manggarai words. The sun in this model is computed for Wae Rebo, 8.72° S and 120.29° E.',
    ),
    caution: t(
      'Model ini satu rumah yang mungkin, bukan rumah itu. Wae Rebo punya tujuh mbaru niang dan tidak ada dua yang persis sama; ukuran di sini hampir seluruhnya perkiraan penulis, dan yang paling pasti justru bukan angkanya melainkan susunannya — bundar, lima tingkat, satu rumah gendang.',
      'This model is one house the rules permit, not the house. Wae Rebo has seven mbaru niang and no two are identical; almost every figure here is the author’s estimate, and what is most certain is not the numbers but the arrangement — round, five levels, one drum house.',
    ),
    orientation: t(
      'Pintunya menghadap compang, batu upacara di tengah kampung. Aturannya bersifat hubungan dan sepenuhnya di luar bangunan: bentuk yang bundar tidak menyimpan arah apa pun pada dirinya sendiri, jadi arah hadap datang dari tempat rumah itu berdiri. Tetap tidak ada kendali untuk memutar bangunan; yang bisa diputar hanyalah kamera.',
      'The door faces the compang, the ceremonial stone at the centre of the village. The rule is relational and lies entirely outside the building: a round form holds no direction in itself, so the orientation comes from where the house stands. There is still no control that turns the building; only the camera rotates.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged mortise and tenon'),
        gloss: t(
          'Kasau bertemu di kepala tiang tengah. Tidak ada bubungan untuk ditumpu — semua bertemu di satu batang, dan pasaklah yang menahannya.',
          'The rafters meet at the head of the centre post. There is no ridge for them to bear on — they all meet on one member, and pegs are what hold them.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t('Dua batang bersilang saling ditakik agar rata dan tidak bergeser.', 'Two crossing members are notched so they sit flush and cannot shift.'),
      },
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat'),
        gloss: t(
          'Kaki tiang duduk di batu. Tidak ditanam — dan itulah sebabnya rumah ini bisa dibongkar dan didirikan kembali, yang memang terjadi di Wae Rebo.',
          'A post foot seats on its stone. It is not buried — which is why this house can be taken down and raised again, and at Wae Rebo it has been.',
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
