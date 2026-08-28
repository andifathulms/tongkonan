/**
 * The bale, as the registry sees it.
 *
 * The fifth file of this shape and still no shared code between them.
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
  baleInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { penguripCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The ceremonial bale, at a tall owner's measure. */
const SHOWCASE: Rules = { bale: 'sakaroras', depa: 1820, pengurip: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = baleInfo(rules.bale)
  const s = layout.sikut
  const eave = layout.roof[0]
  const ridge = layout.roof[layout.roof.length - 1]

  const readout: readonly Readout[] = [
    { label: t('Depa pemilik', 'Owner’s depa'), value: `${(s.depa * 1000).toFixed(0)} mm` },
    { label: t('Saka', 'Saka'), value: `${info.saka} (${info.rows} × ${info.cols})` },
    { label: t('Denah bataran', 'Bataran'), value: `${(layout.bataranHalfX * 2).toFixed(2)} × ${(layout.bataranHalfZ * 2).toFixed(2)} m` },
    { label: t('Tinggi bubungan', 'Ridge height'), value: `${layout.ridgeY.toFixed(2)} m` },
    { label: t('Panjang bubungan', 'Ridge length'), value: `${((ridge?.halfZ ?? 0) * 2).toFixed(2)} m` },
    { label: t('Pengurip', 'Pengurip'), value: s.alive ? `${(s.pengurip * 1000).toFixed(1)} mm` : '—' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'depa',
      title: t('Seberapa besar orang yang memesannya', 'How large the person who commissioned it was'),
      body: t(
        'Ukur satu jarak antar saka dan Anda memegang rentang tangan pemiliknya. Setiap panjang pokok di bangunan ini adalah kelipatan bulat ukuran tubuhnya — depa, hasta, musti — jadi bangunannya bukan diskalakan menurut pemiliknya, melainkan diukur dengan pemiliknya. Dua keluarga sederajat mendirikan bangunan yang berbeda karena tubuh mereka berbeda. Empat rumah lain di sini memilih angka; yang ini memilih satuannya.',
        'Measure one bay between saka and you are holding the owner’s arm span. Every principal length in this building is a whole number of a measure of their body — depa, hasta, musti — so the building is not scaled to its owner, it is measured in them. Two households of identical standing raise different buildings because their bodies differ. The other four houses here select a number; this one selects the unit.',
      ),
      value: t(`${(s.depa * 1000).toFixed(0)}`, `${(s.depa * 1000).toFixed(0)}`),
      unit: t('mm, satu depa', 'mm, one depa'),
    },
    {
      key: 'pengurip',
      title: t('Mengapa tidak ada ukuran yang bulat', 'Why no measurement comes out round'),
      body: t(
        'Karena ukuran yang jatuh tepat pada modulnya disebut mati. Pada setiap ukuran pokok ditambahkan pengurip — di sini satu useran, satu putaran ibu jari — supaya tidak ada panjang yang persis kelipatan bulat. Bangunan ini diwajibkan tidak persis sama dengan aturannya sendiri. Itulah satu-satunya aturan berbentuk demikian dalam projek ini, dan pemeriksaannya lulus dengan menemukan ketidaktepatan, bukan kecocokan.',
        'Because a measure that lands exactly on its module is called mati — dead. To every principal length a pengurip is added — here one useran, one rotation of the thumb — so that no length is an exact whole multiple. This building is required not to be exactly its own rule. It is the only rule of that shape in this project, and its check passes by finding an inexactness rather than an agreement.',
      ),
      value: t(s.alive ? `${(s.pengurip * 1000).toFixed(1)}` : '0', s.alive ? `${(s.pengurip * 1000).toFixed(1)}` : '0'),
      unit: s.alive ? t('mm ditambahkan', 'mm added') : t('mm — rumah ini mati', 'mm — this house is dead'),
    },
    {
      key: 'saka',
      title: t('Namanya adalah jumlah tiangnya', 'Its name is the number of its posts'),
      body: t(
        'Hitung saka dan Anda sudah menyebut nama bangunannya: sakepat empat, sakenem enam, sangasari sembilan, sakaroras dua belas. Ini satu-satunya aturan dalam projek ini yang katanya dan angkanya adalah satu hal yang sama, diucapkan sekali — di rumah lain, pangkat, laras, tumpang dan jumlah keluarga semuanya perlu diterjemahkan menjadi ukuran sebelum berarti apa-apa.',
        'Count the saka and you have said the building’s name: sakepat four, sakenem six, sangasari nine, sakaroras twelve. It is the only rule in this project where the word and the number are one fact said once — in the other houses a rank, a laras, a tier count and a household tally all have to be translated into a dimension before they mean anything.',
      ),
      value: t(String(info.saka), String(info.saka)),
      unit: t('saka', 'saka'),
    },
    {
      key: 'atap',
      title: t('Mengapa atapnya berbentuk begitu', 'Why the roof is the shape it is'),
      body: t(
        'Karena keempat bidangnya jatuh pada satu kemiringan, bubungannya lebih pendek daripada bangunannya tepat sedalam setengah tepi atap di tiap ujung. Pada bale bujur sangkar sisa itu menjadi nol dan atapnya menjadi limas sempurna. Bentuk itu tidak ditetapkan di mana pun dalam pak aturan ini — ia jatuh dari jumlah saka, dan tidak ada dimensi “panjang bubungan” untuk diperdebatkan siapa pun.',
        'Because all four planes fall at one pitch, the ridge is shorter than the building by exactly half the eave depth at each end. On a square bale that remainder is zero and the roof becomes a true pyramid. The form is declared nowhere in this rule pack — it falls out of the post count, and there is no “ridge length” dimension for anyone to disagree with.',
      ),
      value: t(`${((ridge?.halfZ ?? 0) * 2).toFixed(2)}`, `${((ridge?.halfZ ?? 0) * 2).toFixed(2)}`),
      unit: (ridge?.halfZ ?? 0) < 1e-4 ? t('m — limas sempurna', 'm — a true pyramid') : t('m bubungan', 'm of ridge'),
    },
    {
      key: 'terbuka',
      title: t('Di mana dindingnya', 'Where the walls are'),
      body: t(
        'Tidak ada, dan ini alasan yang berbeda dari mbaru niang. Di sana seluruh bagian luar adalah atap yang turun ke tanah; di sini bangunannya memang sengaja terbuka, dan yang membuatnya terpakai saat hujan adalah jangkauan atapnya. Jadi ukuran yang menentukan kenyamanan bangunan ini bukan tebal dinding melainkan panjang tritisan, dan itu satu-satunya pertahanan yang dimilikinya.',
        'There are none, and the reason differs from the mbaru niang’s. There the whole exterior is roof running to the ground; here the building is deliberately unenclosed, and what makes it usable in rain is the reach of the roof. So the dimension that decides this building’s comfort is not a wall thickness but the depth of the overhang, and that is the only defence it has.',
      ),
      value: t(
        `${(eave ? eave.halfX - layout.bataranHalfX : 0).toFixed(2)}`,
        `${(eave ? eave.halfX - layout.bataranHalfX : 0).toFixed(2)}`,
      ),
      unit: t('m tritisan', 'm of overhang'),
    },
  ]

  return {
    key: 'bali',
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
      `${info.saka} saka · depa ${(s.depa * 1000).toFixed(0)} mm · ${(layout.bataranHalfX * 2).toFixed(1)} × ${(layout.bataranHalfZ * 2).toFixed(1)} m`,
      `${info.saka} saka · a depa of ${(s.depa * 1000).toFixed(0)} mm · ${(layout.bataranHalfX * 2).toFixed(1)} × ${(layout.bataranHalfZ * 2).toFixed(1)} m`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = penguripCounterexample()
  const rows = (w: { pengurip: number; exact: number }): readonly Readout[] => [
    { label: t('pengurip', 'the pengurip'), value: `${(w.pengurip * 1000).toFixed(1)} mm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Pengurip itu satu useran, dan gunanya menjaga agar tidak ada ukuran pokok yang jatuh tepat pada modulnya. Besarkan useran dan tidak ada yang bengkok, tidak ada yang roboh, tidak ada bagian yang menjadi nol — tambahannya hanya naik sampai ia sendiri menjadi satu satuan penuh, dan ukuran yang tadinya dijaga tidak tepat kembali jatuh tepat pada modulnya: mati lagi, hanya satu satuan lebih besar. Setiap contoh-tandingan lain dalam projek ini berakhir pada bangunan yang tidak mungkin didirikan. Yang ini berakhir pada bangunan yang berdiri sempurna dan salah karena alasan yang tidak akan terlihat sekeras apa pun Anda memandangnya — dan itulah alasan terkuat mengapa aturannya ada di dalam model, bukan di keterangan gambar.',
      'The pengurip is one useran, and its job is to keep every principal measure off its own module. Grow the useran and nothing bends, nothing collapses and nothing goes to zero — the addition simply climbs until it is a whole unit in itself, and the measure it was keeping inexact lands squarely back on its module: dead again, just one unit larger. Every other counterexample in this project ends with a building that cannot be constructed. This one ends with a building that stands perfectly well and is wrong for a reason no amount of looking would reveal — which is the strongest argument the project has for why the rules live in the model rather than in the caption.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'bali',
    slug: 'bali',
    house: t('Bale', 'Bale'),
    people: t('Bali', 'Balinese'),
    place: t('Ubud, Gianyar, Bali', 'Ubud, Gianyar, Bali'),
    about: t(
      'Bale adalah bangunan tunggal dalam pekarangan rumah Bali: panggung pasangan yang rendah, sejumlah saka, dan atap limas beralang-alang, terbuka pada sisi-sisinya. Yang membuatnya layak dibangun di sini bukan bentuknya — ini benda paling sederhana dalam projek ini — melainkan cara mengukurnya. Menurut Asta Kosala Kosali, setiap panjang pokok adalah kelipatan bulat ukuran tubuh pemiliknya, ditambah pengurip supaya tidak pernah tepat. Nama bagian pada layar ini — bale, bataran, saka, sendi, sunduk, jurai, alang-alang, murda — adalah kata Bali dan Indonesia; di tempat penulis tidak cukup yakin akan istilah Balinya, bagian itu dinamai dalam bahasa Indonesia. Matahari pada model ini dihitung untuk Ubud, 8,51° LS dan 115,26° BT.',
      'A bale is one building in a Balinese house compound: a low masonry platform, a number of posts, and a hipped thatched roof, open on its sides. What makes it worth building here is not its form — it is the simplest object in this project — but the way it is measured. Under Asta Kosala Kosali every principal length is a whole number of a measure of its owner’s body, plus a pengurip so that it is never exact. The parts named on this screen — bale, bataran, saka, sendi, sunduk, jurai, alang-alang, murda — are Balinese and Indonesian words; where the author is not confident of the Balinese term, the part is named in Indonesian. The sun in this model is computed for Ubud, 8.51° S and 115.26° E.',
    ),
    caution: t(
      'Dua kekurangan yang perlu dinyatakan langsung. Pertama: rumah Bali adalah pekarangan bertembok berisi beberapa bale mengelilingi natah, dengan sanggah di sudut kaja-kangin dan angkul-angkul yang harus dilewati dengan berbelok. Model ini membangun satu bale, bukan pekarangannya — jadi yang paling khas dari perumahan Bali justru tidak ada di sini. Kedua: tidak ada ukiran sama sekali. Ukiran bukan tempelan pada bangunan Bali, jadi ketiadaannya adalah kekurangan yang nyata; tetapi mengarang motif yang masuk akal dari perbendaharaan milik pengukir tertentu lebih buruk daripada tidak menampilkannya. Selain itu, perbandingan antar ukuran tubuh — berapa hasta dalam sedepa — adalah antropometri penulis, bukan angka dari kepustakaan Bali.',
      'Two shortfalls worth stating outright. First: a Balinese house is a walled compound of several bale around a natah, with a shrine in the kaja-kangin corner and a gate you have to turn to get past. This models one bale, not the compound — so the most distinctive thing about Balinese domestic building is precisely what is absent here. Second: there is no carving at all. Carving is not applied decoration on a Balinese building, so its absence is a real omission; but inventing plausible motifs from a vocabulary belonging to particular carvers would be worse than showing none. Beyond that, the ratios between one body measure and the next — how many hasta in a depa — are the author’s anthropometry, not figures from the Balinese literature.',
    ),
    orientation: t(
      'Arahnya ditentukan sumbu kaja–kelod: kaja ke arah gunung, kelod ke arah laut. Ini bukan mata angin, dan itulah yang membuatnya berbeda dari keempat rumah lain di sini. Di Bali selatan kaja adalah utara; di Bali utara kaja adalah selatan — aturan yang sama menghasilkan bujur yang berlawanan tergantung di sebelah mana gunung itu berdiri. Model ini disetel untuk Bali selatan, jadi kaja jatuh ke arah −X. Tongkonan menyebut satu mata angin mutlak, rumah gadang dan mbaru niang menunjuk sesuatu di luar dirinya; yang ini menunjuk sesuatu di luar dirinya yang bujurnya berubah menurut tempat. Tetap tidak ada kendali untuk memutar bangunan.',
      'Orientation is set by the kaja–kelod axis: kaja toward the mountain, kelod toward the sea. It is not a compass direction, and that is what separates it from the other four houses here. In south Bali kaja is north; in north Bali kaja is south — the same rule gives opposite bearings depending on which side of the mountain you stand. This model is set for south Bali, so kaja falls toward −X. The tongkonan names an absolute bearing; the rumah gadang and the mbaru niang point at something outside themselves; this one points at something outside itself whose bearing changes with where you are. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pemuput',
        name: t('Pemuput', 'Pegged tenon'),
        gloss: t(
          'Sunduk masuk ke lubang di kepala saka dan dipasak. Sampai balok terpasang, saka hanya berdiri di atas batu.',
          'A sunduk enters a mortise in the post head and is pegged. Until the ties are in, the posts are only standing on stones.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t(
          'Jurai ditakik pada ujung bubungan. Pada bale bujur sangkar tidak ada bubungan untuk ditakik dan keempat jurai bertemu satu sama lain.',
          'A hip rafter is notched onto the end of the ridge. On a square bale there is no ridge to notch onto and the four hips meet each other instead.',
        ),
      },
      {
        kind: 'sendi',
        name: t('Sendi', 'Seat on a pad stone'),
        gloss: t(
          'Kaki saka duduk di cekungan sendi, tidak ditanam — jadi rangkanya bisa dibongkar dan didirikan kembali.',
          'A post foot seats in the dish of its sendi and is not buried — so the frame can be taken apart and raised again.',
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
