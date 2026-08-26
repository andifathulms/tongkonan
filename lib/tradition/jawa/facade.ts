/**
 * The joglo, as the registry sees it.
 *
 * The third of three files with this shape and no shared code between them.
 * What they have in common is an interface; what differs is every sentence,
 * which is the whole reason the interface is worth having.
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
  roofTiers,
  wujudInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { tumpangCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A house that states its standing plainly: nine tiers, and a pavilion. */
const SHOWCASE: Rules = { wujud: 'pangrawit', tumpang: 9, pendhapa: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const w = wujudInfo(rules.wujud)
  const tiers = roofTiers(w)

  const readout: readonly Readout[] = [
    { label: t('Sisi badan', 'Body side'), value: `${layout.bodyDepth.toFixed(2)} m` },
    { label: t('Tinggi lantai', 'Floor height'), value: `${layout.floorY.toFixed(2)} m` },
    { label: t('Tinggi tepi atap', 'Eave height'), value: `${layout.eaveY.toFixed(2)} m` },
    { label: t('Tinggi molo', 'Ridge height'), value: `${layout.ridgeY.toFixed(2)} m` },
    { label: t('Jenjang atap', 'Roof tiers'), value: String(tiers) },
    { label: t('Puncak tumpang sari', 'Top of the tumpang sari'), value: `${layout.tumpangTopY.toFixed(2)} m` },
  ]

  const molo = layout.roof[layout.roof.length - 1]
  const readings: readonly Reading[] = [
    {
      key: 'tumpang',
      title: t('Berapa tinggi kedudukan keluarga ini', 'How high this household stands'),
      body: t(
        'Berdirilah di tengah rumah dan lihat ke atas. Tumpang sari menutup ke dalam dan ke atas tingkat demi tingkat, dan jumlah tingkat itu ganjil dan terbaca sebagai kedudukan. Ini satu-satunya tanda kedudukan dalam projek ini yang harus dibaca dari dalam, dengan kepala mendongak.',
        'Stand in the middle of the house and look up. The tumpang sari closes inward and upward tier by tier, and the number of tiers is odd and reads as standing. It is the only rank signal in this project that has to be read from inside, with your head back.',
      ),
      value: t(String(layout.tumpangCount), String(layout.tumpangCount)),
      unit: t('tingkat', 'tiers'),
    },
    {
      key: 'wujud',
      title: t('Bentuk mana yang didirikan', 'Which form was raised'),
      body: t(
        'Hitung jenjang atapnya dari tepi ke molo. Tiap jenjang adalah satu cincin tiang di bawahnya, jadi menghitung atap dari luar sama dengan menghitung tiang di dalam — dan deret bernama itulah jenjang bentuknya.',
        'Count the tiers of roof from the eave to the molo. Each tier is a ring of pillars beneath it, so counting the roof from outside is counting the pillars inside — and the named series is the grade.',
      ),
      value: t(w.name, w.name),
      unit: t(`${tiers} jenjang, ${w.rings} cincin`, `${tiers} tiers, ${w.rings} rings`),
    },
    {
      key: 'pendhapa',
      title: t('Apakah rumah ini menerima tamu', 'Whether this household receives'),
      body: t(
        'Pendhapa berdiri di muka, terbuka tanpa dinding, dan jarak antara pendhapa dan dalem adalah pringgitan — tempat kelir wayang berdiri. Rumah tanpa pendhapa bukan rumah yang lebih kecil; ia rumah yang tidak menyatakan itu tentang dirinya.',
        'The pendhapa stands in front, open and without walls, and the distance between it and the dalem is the pringgitan, where the wayang screen stands. A house without one is not a smaller house; it is a house that does not say that about itself.',
      ),
      value: layout.pendhapa.present ? t('Ada', 'Yes') : t('Tidak ada', 'No'),
      unit: layout.pendhapa.present
        ? t(`pringgitan ${DIMS.pendhapaGap.value.toFixed(1)} m`, `${DIMS.pendhapaGap.value.toFixed(1)} m pringgitan`)
        : t('tanpa serambi', 'no pavilion'),
    },
    {
      key: 'hipped',
      title: t('Ke mana bubungannya pergi', 'Where the ridge goes'),
      body: t(
        'Ikuti molo dan ia habis jauh sebelum rumahnya habis. Keempat bidang atap turun ke tepi, dan tidak ada gable di mana pun. Dua rumah lain dalam projek ini membawa bubungan sepanjang bangunannya lalu mengakhirinya dengan sesuatu — haluan, gonjong; rumah ini tidak pernah sampai ke ujung.',
        'Follow the molo and it runs out long before the house does. Four planes of roof fall away to the eave and there is no gable anywhere. The other two houses here carry a ridge the length of the building and finish it with something — a prow, a gonjong; this one never reaches the ends.',
      ),
      value: t(`${((molo?.halfZ ?? 0) * 2).toFixed(1)} m`, `${((molo?.halfZ ?? 0) * 2).toFixed(1)} m`),
      unit: t(`dari ${layout.bodyLength.toFixed(1)} m`, `of ${layout.bodyLength.toFixed(1)} m`),
    },
    {
      key: 'senthong',
      title: t('Ruang mana yang dibiarkan kosong', 'Which room is left empty'),
      body: t(
        'Tiga senthong berjajar di belakang dalem, dan yang tengah tidak ditempati siapa pun dan tidak diisi apa pun. Ruang yang paling bermakna di rumah ini adalah ruang yang kosong, dan model ini memeriksanya dengan menengok ke dalam dan menuntut agar tidak ada apa-apa di sana.',
        'Three senthong stand along the back of the dalem, and the middle one holds nobody and nothing. The most meaningful room in this house is the empty one, and this model checks it by looking inside and requiring that there be nothing there.',
      ),
      value: t('Senthong tengah', 'Senthong tengah'),
      unit: t('kosong, dan itulah isinya', 'empty, and that is its content'),
    },
  ]

  return {
    key: 'jawa',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(w.name, w.name),
    subhead: t(
      `${layout.tumpangCount} tingkat tumpang sari · ${tiers} jenjang atap${layout.pendhapa.present ? ' · berpendhapa' : ''}`,
      `${layout.tumpangCount} tumpang sari tiers · ${tiers} roof tiers${layout.pendhapa.present ? ' · with pendhapa' : ''}`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = tumpangCounterexample()
  const rows = (w: { built: number; declared: number }): readonly Readout[] => [
    { label: t('tingkat terbangun', 'tiers built'), value: String(w.built) },
    { label: t('tingkat dinyatakan', 'tiers declared'), value: String(w.declared) },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Jumlah tingkat tumpang sari adalah tanda kedudukan, dan tanda itu dibaca dengan menghitung dari bawah. Yang menarik adalah cara ia rusak: tidak ada yang dinolkan dan tidak ada yang runtuh. Masuknya tiap tingkat diperlebar, tiap tingkat menutup lebih ke dalam, dan pada suatu titik bukaannya habis sebelum hitungannya habis — tumpukan itu menutup sebelum sempat membuat tingkat kelimanya. Aturan yang tidak dapat dilaksanakan adalah kegagalan yang berbeda dari aturan yang dilanggar, dan justru itulah yang mengancam bangunan ini.',
      'The tumpang sari’s tier count is the rank signal, and it is read by counting from underneath. What is interesting is how it breaks: nothing is set to zero and nothing collapses. The inset is widened, each tier closes further in than the last, and at some point the opening runs out before the count does — the stack shuts before it has made its fifth tier. A rule that cannot be carried out is a different failure from a rule being disobeyed, and it is the one this building is actually exposed to.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'jawa',
    slug: 'jawa',
    house: t('Joglo', 'Joglo'),
    people: t('Jawa', 'Javanese'),
    place: t('Jawa Tengah dan Yogyakarta', 'Central Java and Yogyakarta'),
    about: t(
      'Joglo adalah rumah orang Jawa, di Jawa Tengah dan Yogyakarta. Ia tidak berdiri di atas tiang seperti dua rumah lain di sini: lantainya ditinggikan sedikit dari tanah, dan tidak ada ruang di bawahnya. Pusatnya adalah persegi yang dipikul empat soko guru, dengan tumpang sari menutup naik di atasnya — dan pembagian rumah ini dari pusat ke tepi, bukan dari bawah ke atas. Nama bagian pada layar ini — soko guru, tumpang sari, brunjung, penanggap, molo, umpak, senthong, gebyok, pendhapa — adalah kata Jawa. Matahari pada model ini dihitung untuk Yogyakarta, 7,80° LS dan 110,36° BT.',
      'A joglo is the house of the Javanese, in Central Java and Yogyakarta. It does not stand on posts like the other two houses here: its floor is raised a little off the ground and there is no room beneath it. Its centre is the square carried by four soko guru, with the tumpang sari closing upward above it — and this house divides from the centre outward rather than from the ground up. The parts named on this screen — soko guru, tumpang sari, brunjung, penanggap, molo, umpak, senthong, gebyok, pendhapa — are Javanese words. The sun in this model is computed for Yogyakarta, 7.80° S and 110.36° E.',
    ),
    caution: t(
      'Tidak ada satu bentuk joglo yang baku. Ragamnya banyak dan bernama, dan model ini satu rumah yang mungkin — bukan rumah itu. Deret bernama yang dipakai di sini terdokumentasi; berapa jenjang yang dimiliki tiap nama adalah bacaan penulis, dan ditandai demikian.',
      'There is no single canonical joglo. The variants are many and they are named, and this model is one house the rules permit — not the house. The named series used here is documented; how many tiers each name carries is the author’s reading, and is tagged as such.',
    ),
    orientation: t(
      'Molo membujur sejajar muka rumah, dan pendhapa berdiri di depan dalem dengan pringgitan di antaranya. Susunannya aturan, bukan pilihan, jadi tidak ada kendali untuk memutar bangunan. Yang bisa diputar hanyalah kamera.',
      'The molo runs parallel to the front of the house, and the pendhapa stands before the dalem with the pringgitan between them. The arrangement is a rule rather than a choice, so there is no control that turns the building. Only the camera rotates.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'purus',
        name: t('Purus', 'Pegged mortise and tenon'),
        gloss: t(
          'Pen masuk ke lubangnya lalu dikunci pasak. Rangka joglo disusun tanpa paku dan bisa dibongkar kembali — rumah ini memang dirancang untuk bisa pindah.',
          'A tenon enters its mortise and a peg locks it. A joglo frame goes up without nails and comes apart again — this house is built to be able to move.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t(
          'Usuk ditakik pada balok tumpuan tempat ia bertumpu di tepi atap.',
          'A rafter is notched over the plate it bears on at the eave.',
        ),
      },
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat'),
        gloss: t(
          'Kaki soko duduk di cekungan umpak. Tidak ditanam, dan justru itulah yang membuat rangka bisa dibongkar utuh.',
          'A pillar foot seats in the dish of its umpak. It is not buried, and that is what lets the frame come apart whole.',
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
