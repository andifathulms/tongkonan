/**
 * The rumah gadang, as the registry sees it.
 *
 * The other house's facade file and this one are the same shape and share no
 * code, which is correct: what they have in common is an interface, and what
 * differs is every sentence. A shared implementation here would be a shared
 * opinion about what a house says about itself.
 */

import type { Site } from '@/lib/solar/position'
import type {
  Built,
  CounterexampleView,
  Reading,
  Readout,
  Text,
  Tradition,
} from '../registry'
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
  larasInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { anjuangCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A specific house with a history: seven ruang, four daughters married. */
const SHOWCASE: Rules = { laras: 'koto-piliang', ruang: 7, bilik: 4 }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const laras = larasInfo(rules.laras)
  const scene = sceneModel(house, layout)

  const readout: readonly Readout[] = [
    { label: t('Panjang badan', 'Body length'), value: `${layout.bodyLength.toFixed(2)} m` },
    { label: t('Dalam badan', 'Body depth'), value: `${layout.bodyDepth.toFixed(2)} m` },
    { label: t('Tinggi kolong', 'Underfloor height'), value: `${layout.kolongHeight.toFixed(2)} m` },
    { label: t('Ujung bubungan', 'Ridge end'), value: `${layout.ridgeEndY.toFixed(2)} m` },
    {
      label: t('Naiknya anjuang', 'Anjuang step'),
      value: layout.anjuangRise > 0 ? `${layout.anjuangRise.toFixed(2)} m` : '—',
    },
    { label: t('Julur atap', 'Eave oversail'), value: `${layout.eaveOversail.toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'gonjong',
      title: t('Berapa gonjong di atasnya', 'How many gonjong it carries'),
      body: t(
        'Hitung puncak yang menjulang dari bubungan. Empat adalah bentuk dasar; yang lebih dari itu menyertai anjuang, jadi jumlahnya menyusul laras dan bukan selera.',
        'Count the points rising off the ridge. Four is the base form; more accompany the anjuang, so the number follows the laras rather than a preference.',
      ),
      value: t(String(laras.gonjong), String(laras.gonjong)),
      unit: t('gonjong', 'gonjong'),
    },
    {
      key: 'laras',
      title: t('Adat mana yang mendirikannya', 'Which adat raised it'),
      body: t(
        'Lihat lantainya dari samping. Pada Koto Piliang kedua ujungnya naik menjadi anjuang, tempat yang berpangkat duduk; pada Bodi Caniago lantainya satu bidang rata dan ketiadaan tingkat itulah pernyataannya. Kedudukan sosial di sini bisa diukur dengan waterpas.',
        'Look at the floor from the side. Under Koto Piliang both ends rise into anjuang, where those holding rank sit; under Bodi Caniago the floor is one level plane, and the absence of a step is the statement. Social standing here can be measured with a spirit level.',
      ),
      value: t(laras.name, laras.name),
      unit: laras.anjuang
        ? t(`naik ${layout.anjuangRise.toFixed(2)} m`, `a step of ${layout.anjuangRise.toFixed(2)} m`)
        : t('tanpa tingkat', 'no step'),
    },
    {
      key: 'bilik',
      title: t('Berapa anak perempuan sudah menikah', 'How many daughters have married'),
      body: t(
        'Hitung bilik di lanjar belakang. Satu bilik untuk tiap anak perempuan yang menikah, ditambahkan berurutan dari satu ujung — jadi rumah ini bukan cermin dirinya sendiri, dan justru ketidaksimetrisan itulah catatannya.',
        'Count the bilik along the rear lanjar. One room for each daughter who has married, added in sequence from one end — so the house is not its own mirror, and that asymmetry is the record.',
      ),
      value: t(String(layout.bilikCount), String(layout.bilikCount)),
      unit: t(`dari ${rules.ruang - 2} ruang dalam`, `of ${rules.ruang - 2} interior ruang`),
    },
    {
      key: 'ruang',
      title: t('Berapa ruang panjangnya', 'How many ruang long it is'),
      body: t(
        'Hitung baris tonggak di kolong. Jumlah ruang selalu ganjil — tiga, lima, tujuh, sembilan — jadi sebuah rumah bergenap ruang bukan rumah gadang yang tidak lazim, melainkan bukan rumah gadang.',
        'Count the post rows in the kolong. The ruang count is always odd — three, five, seven, nine — so a house with an even one is not an unusual rumah gadang, it is not one.',
      ),
      value: t(String(rules.ruang), String(rules.ruang)),
      unit: t(`${layout.postZ.length} baris tonggak`, `${layout.postZ.length} post rows`),
    },
    {
      key: 'lean',
      title: t('Mengapa dindingnya melebar ke atas', 'Why the walls widen as they rise'),
      body: t(
        'Dinding condong ke luar, sehingga badan rumah lebih lebar di balok tumpuan daripada di lantai. Sumber menyatakan bahwa memang begitu; tak satu pun menyebut sudutnya, jadi angka di sini milik penulis dan ditandai demikian.',
        'The walls lean outward, so the body is wider at the wall plate than at the deck. The sources state that it does; none gives the angle, so the figure here is the author’s and is tagged as such.',
      ),
      value: t(`${DIMS.wallLean.value}°`, `${DIMS.wallLean.value}°`),
      unit: t(`melebar ${(layout.wallLeanRun * 2).toFixed(2)} m`, `${(layout.wallLeanRun * 2).toFixed(2)} m wider`),
    },
  ]

  return {
    key: 'minang',
    query: rulesToQuery(rules),
    house,
    scene,
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(`Rumah gadang ${laras.name}`, `Rumah gadang, ${laras.name}`),
    subhead: t(
      `${rules.ruang} ruang · ${layout.lanjarCount} lanjar — ${layout.bilikCount} bilik`,
      `${rules.ruang} ruang · ${layout.lanjarCount} lanjar — ${layout.bilikCount} bilik`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = anjuangCounterexample()
  const rows = (w: { main: number; anjuang: number }): readonly Readout[] => [
    { label: t('lantai tengah', 'main floor'), value: `${w.main.toFixed(2)} m` },
    { label: t('lantai anjuang', 'anjuang floor'), value: `${w.anjuang.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Pemeriksaan ini menegakkan satu-satunya pernyataan dalam pak aturan ini yang bisa dibantah orang yang berdiri di ruangannya dengan waterpas: pada laras Koto Piliang lantai kedua ujung berada di atas lantai tengah. Ratakan tingkat itu dan rumah kehilangan kemampuan menyatakan adat mana yang mendirikannya. Ambangnya dicari, bukan dipilih — dan tingkat itu berhenti menjadi tingkat sebelum mencapai nol, yaitu ketika ia sudah lebih tipis daripada papan yang membentuknya.',
      'This check enforces the one claim in this pack that a reader standing in the room could disprove with a spirit level: under the Koto Piliang laras, the floor at both ends stands above the middle. Flatten the step and the house stops being able to say which adat raised it. The threshold is searched rather than picked — and the step stops being a step before it reaches zero, at the point where it is thinner than the board that forms it.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'minang',
    slug: 'minang',
    house: t('Rumah gadang', 'Rumah gadang'),
    people: t('Minangkabau', 'Minangkabau'),
    place: t('Sumatera Barat', 'West Sumatra'),
    about: t(
      'Rumah gadang adalah rumah keluarga orang Minangkabau, di dataran tinggi Sumatera Barat, Indonesia. Rumah dan tanahnya diwariskan menurut garis ibu, dan bilik di lanjar belakang bertambah seiring anak-anak perempuan menikah. Nama bagian pada layar ini — gonjong, anjuang, bilik, ruang, lanjar, singok, tonggak, rasuak — adalah kata Minangkabau. Di tempat penulis tidak yakin akan sebuah nama, bagian itu dinamai dalam bahasa Indonesia, bukan dalam kata Minang yang diterka. Matahari pada model ini dihitung untuk Bukittinggi, 0,30° LS dan 100,37° BT.',
      'A rumah gadang is the family house of the Minangkabau people, in the highlands of West Sumatra, Indonesia. The house and its land descend through the mother’s line, and the bilik along the rear lanjar increase as daughters marry. The parts named on this screen — gonjong, anjuang, bilik, ruang, lanjar, singok, tonggak, rasuak — are Minangkabau words. Where the author was not confident of a name, the part is named in Indonesian rather than in a guessed-at Minang word. The sun in this model is computed for Bukittinggi, 0.30° S and 100.37° E.',
    ),
    caution: t(
      'Tidak ada satu bentuk rumah gadang yang baku. Ragam antarnagari dan antarkaum itu nyata, dan model ini satu rumah yang mungkin — bukan rumah itu.',
      'There is no single canonical rumah gadang. Variation between nagari and between lineages is real, and this model is one house the rules permit — not the house.',
    ),
    orientation: t(
      'Muka rumah menghadap halaman, dengan rangkiang berjajar di seberangnya. Aturannya bersifat hubungan, bukan arah mata angin — di sinilah rumah gadang berbeda dari tongkonan, yang menghadap utara. Tetap tidak ada kendali untuk memutar bangunan; yang bisa diputar hanyalah kamera.',
      'The front faces the halaman, with the rangkiang ranged across it. The rule is relational rather than a compass bearing — this is where the rumah gadang differs from the tongkonan, which faces north. There is still no control that turns the building; only the camera rotates.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    joints: [
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged mortise and tenon'),
        gloss: t(
          'Pen masuk ke lubang, lalu dikunci pasak kayu yang menembus keduanya. Rangka disusun tanpa paku.',
          'A tenon enters a mortise and a wooden peg driven through both locks it. The frame goes up without nails.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t(
          'Kasau ditakik pada balok tumpuan tempat ia bertumpu, agar tidak menggelincir di lereng.',
          'A rafter is notched over the wall plate it bears on, so it cannot slide down the slope.',
        ),
      },
      {
        kind: 'sandi',
        name: t('Sandi', 'Seat'),
        gloss: t(
          'Kaki tonggak duduk di cekungan batu sandi. Tidak ditanam — rumah berdiri di atas batu, dan itulah yang membuatnya bisa bergoyang tanpa patah.',
          'A post foot seats in the dish of its batu sandi. It is not buried — the house stands on stone, and that is what lets it move without breaking.',
        ),
      },
    ],
    stages: STAGES.map((s) => ({
      stage: s.stage,
      title: s.title,
      gloss: t(s.glossId, s.glossEn),
    })),
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
