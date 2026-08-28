/**
 * The saoraja, as the registry sees it.
 *
 * The tenth file of this shape and still no shared code between them.
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
  rumahInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { rankCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A noble's house making a full claim. */
const SHOWCASE: Rules = { rumah: 'saoraja', timpa: 9, lontang: 7 }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = rumahInfo(rules.rumah)
  const top = layout.timpa[layout.timpa.length - 1]

  const readout: readonly Readout[] = [
    { label: t('Timpa laja', 'Timpa laja'), value: String(rules.timpa) },
    { label: t('Beban yang dipikulnya', 'Load it carries'), value: '0' },
    { label: t('Terbaca sampai', 'Reads up to'), value: `${(top?.y ?? 0).toFixed(2)} m` },
    { label: t('Lontang', 'Bays'), value: String(rules.lontang) },
    { label: t('Kolong', 'Awa bola'), value: `${layout.awaBola.toFixed(2)} m` },
    { label: t('Badan', 'Ale bola'), value: `${layout.aleBola.toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'timpa',
      title: t('Berapa papan di pelananya', 'How many boards are on its gable'),
      body: t(
        'Hitung dari jalan. Jumlah papan timpa laja adalah pangkat rumah tangga — tiga untuk rumah biasa, lima ke atas untuk bangsawan — dan papan itu tidak memikul apa pun. Cabut semuanya dan rumahnya berdiri persis sama. Ini satu-satunya rumah dalam projek ini yang penanda pangkatnya dapat dilepas, dan karena itu satu-satunya yang penandanya dapat berdusta: sebuah rumah tangga bisa memasang lebih banyak daripada haknya, dan tetangganya bisa menghitungnya.',
        'Count them from the road. The number of timpa laja boards is the household’s rank — three for a commoner’s house, five and upward for nobility — and those boards carry nothing. Take them all off and the house stands exactly as it did. It is the only house in this project whose rank marker is detachable, and therefore the only one whose marker can lie: a household could put up more than it was entitled to, and its neighbours could count them.',
      ),
      value: t(String(rules.timpa), String(rules.timpa)),
      unit: t('papan · 0 beban', 'boards · 0 load'),
    },
    {
      key: 'entitled',
      title: t('Mengapa rumah biasa tidak boleh memasang tujuh', 'Why a commoner’s house may not put up seven'),
      body: t(
        'Bukan karena tidak sanggup. Sebuah bola akan memikul tujuh papan tanpa terasa — papan itu tipis dan tidak menahan apa-apa. Yang menahannya adalah bahwa tujuh bukan haknya. Batas dalam model ini pun demikian: ia menolak angka yang sebenarnya bisa dibangun, dan itu satu-satunya batas semacam itu dalam seluruh projek ini.',
        'Not because it could not. A bola would carry seven boards without noticing — they are thin and they hold nothing. What stops it is that seven is not its to claim. The bound in this model works the same way: it refuses a number the building could perfectly well take, and it is the only bound of that kind in the whole project.',
      ),
      value: t(`${info.minTimpa}–${info.maxTimpa}`, `${info.minTimpa}–${info.maxTimpa}`),
      unit: t(`papan, untuk ${info.name}`, `boards, for a ${info.name}`),
    },
    {
      key: 'worlds',
      title: t('Apa yang disimpan paling tinggi', 'What is kept highest'),
      body: t(
        'Padi. Rumah ini terbagi tiga dari bawah ke atas — awa bola untuk ternak dan kerja, ale bola untuk orang, rakkeang untuk padi — jadi yang paling tinggi bukan orangnya melainkan yang menghidupinya. Tongkonan juga membagi tiga, dan perbandingan keduanya justru pada apa yang ditaruh di atas.',
        'Rice. This house divides into three from the bottom up — awa bola for livestock and work, ale bola for people, rakkeang for rice — so the highest thing is not the people but what feeds them. The tongkonan divides into three as well, and the comparison between them is precisely about what is put at the top.',
      ),
      value: t('3', '3'),
      unit: t('dunia bertumpuk', 'stacked worlds'),
    },
    {
      key: 'pattolo',
      title: t('Mengapa rumah ini bisa dipindahkan', 'Why this house can be moved'),
      body: t(
        'Karena balok-baloknya menembus tiang lewat lubang yang dipahat tembus, lalu dipasak — dirakit, bukan dipaku. Rangka semacam itu bisa dibongkar dan disusun kembali, dan sebuah rumah Bugis memang diangkat dari batunya lalu dipikul ramai-ramai ke tempat baru. Bangunan yang bisa dipindahkan bukan bangunan yang terikat pada sebidang tanah.',
        'Because its beams pass through mortises cut clean through the posts and are then pegged — assembled, not nailed. A frame like that comes apart and goes together again, and a Bugis house is lifted off its stones and carried to a new site by a crowd. A building you can move is not a building tied to a plot.',
      ),
      value: t(String(house.joints.filter((j) => j.kind === 'pattolo').length), String(house.joints.filter((j) => j.kind === 'pattolo').length)),
      unit: t('sambungan tembus', 'threaded joints'),
    },
    {
      key: 'reach',
      title: t('Dari sejauh mana pangkat itu terbaca', 'From how far the rank can be read'),
      body: t(
        'Sejauh papan teratasnya. Seluruh guna susunan itu adalah terbaca, jadi tinggi tiap papan menentukan jangkauan pernyataannya — dan angka itu tidak menggerakkan apa pun yang lain di bangunan ini. Ubah dan tidak ada satu pun ketinggian, bentang atau jarak bebas yang bergeser; yang berubah hanyalah seberapa jauh orang bisa berdiri dan tetap menghitungnya.',
        'As far as its topmost board. Being read is the stack’s entire function, so the height of each board sets the reach of the statement — and that figure moves nothing else in the building. Change it and not one height, span or clearance shifts; all that changes is how far away a person can stand and still count them.',
      ),
      value: t(`${(top?.y ?? 0).toFixed(1)}`, `${(top?.y ?? 0).toFixed(1)}`),
      unit: t('m di atas tanah', 'm above the ground'),
    },
  ]

  return {
    key: 'bugis',
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
      `${rules.timpa} timpa laja · ${rules.lontang} lontang · tiga dunia`,
      `${rules.timpa} timpa laja · ${rules.lontang} bays · three worlds`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = rankCounterexample()
  const rows = (w: { topBoard: number; ridge: number }): readonly Readout[] => [
    { label: t('papan teratas', 'topmost board'), value: `${w.topBoard.toFixed(2)} m` },
    { label: t('bubungan', 'ridge'), value: `${w.ridge.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tinggikan tiap papan dan tidak ada apa pun pada rumahnya yang berubah: rangkanya, atapnya, ketiga dunianya dan setiap jarak bebasnya persis sama, karena papan itu tidak memikul apa-apa dan tidak ada yang memikulnya. Yang mengalah adalah susunan itu sendiri — ia menaiki pelana yang ditumpanginya sampai habis. Pernyataan rumah tangga itu, dibuat lebih tinggi supaya terbaca dari lebih jauh, akhirnya kehabisan segitiga untuk didudukinya. Sepuluh rumah, sepuluh aturan yang tidak dapat dilaksanakan. Yang khas di sini: kegagalannya sepenuhnya perkara pernyataan. Bangunannya utuh dan akan berdiri seabad; yang patah hanyalah keterangan tentang siapa yang tinggal di dalamnya.',
      'Raise each board and nothing about the house changes: its frame, its roof, its three worlds and every clearance are exactly as they were, because the boards carry nothing and nothing carries them. What gives way is the stack itself — it climbs the gable it is riding until there is none left. The household’s claim, made taller so it can be read from further off, ends with no triangle to sit on. Ten houses, ten rules that cannot be carried out. What is particular here: the failure is purely rhetorical. The building is untouched and would stand for a century, and the only thing that has broken is a statement about who lives in it.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'bugis',
    slug: 'bugis',
    house: t('Saoraja', 'Saoraja'),
    people: t('Bugis', 'Bugis'),
    place: t('Sulawesi Selatan', 'South Sulawesi'),
    about: t(
      'Saoraja adalah rumah bangsawan Bugis dan bola rumah orang kebanyakan: bangunan panggung berangka kayu yang baloknya menembus tiang, terbagi tiga dari bawah ke atas, beratap pelana. Yang membuatnya layak dibangun di sini ada pada muka pelananya. Timpa laja adalah susunan papan di sana, jumlahnya adalah pangkat rumah tangga, dan papan itu tidak memikul apa pun — jadi ini satu-satunya rumah dalam projek ini yang penanda pangkatnya dapat dilepas, dan karena itu satu-satunya yang penandanya dapat berdusta. Matahari pada model ini dihitung untuk Sulawesi Selatan, 4,00° LS dan 119,63° BT.',
      'A saoraja is a Bugis noble’s house and a bola is everyone else’s: a raised timber-framed building whose beams pass through its posts, divided into three from the bottom up, under a gable roof. What makes it worth building here is on the face of that gable. The timpa laja is a stack of boards there, their number is the household’s rank, and they carry no load at all — so this is the only house in the project whose rank marker is detachable, and therefore the only one whose marker can lie. The sun in this model is computed for South Sulawesi, 4.00° S and 119.63° E.',
    ),
    caution: t(
      'Batas jumlah papan di sini — tiga untuk bola, lima sampai sembilan untuk saoraja — mengikuti pemerian sumber tentang bahwa jumlahnya ganjil dan bertingkat menurut kedudukan; batas persisnya berbeda antar tempat dan antar masa, dan yang dipakai model ini adalah bacaan penulis, bukan aturan satu kerajaan tertentu. Ukuran papannya, tinggi tiap tingkat dan jarak antar tiang seluruhnya perkiraan penulis. Bugis dan Makassar bukan satu tradisi meski rumahnya berkerabat dekat; istilah di sini Bugis. Tidak ada ukiran, padahal rumah Bugis berukir. Dan tidak ada satu pun angka di sini yang berasal dari pengukuran.',
      'The board limits used here — three for a bola, five to nine for a saoraja — follow the sources on the count being odd and graded by standing; the exact limits differed between places and periods, and what this model uses is the author’s reading rather than the rule of one particular kingdom. The board sizes, the storey heights and the post spacing are all the author’s estimates. Bugis and Makassar are not one tradition though their houses are close kin; the terms here are Bugis. There is no carving, though a Bugis house is carved. And not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah menghadap arah yang dianggap baik menurut adat setempat, dan yang penting bagi model ini adalah bahwa mukanya adalah pelana — bukan sisi panjangnya. Pangkatnya dipasang di muka itu, jadi menghadapkan bangunan berarti menentukan dari mana pernyataannya terbaca. Ini satu-satunya rumah dalam projek ini yang arah hadapnya menentukan siapa yang bisa membaca klaimnya, dan bukan sekadar ke mana pintunya membuka. Model ini menaruh pelana pada sumbu Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'The house faces whichever direction local custom holds to be good, and what matters for this model is that its front is a gable end — not its long side. The rank is fixed to that face, so orienting the building decides where its statement can be read from. It is the only house in this project whose bearing settles who can read its claim rather than merely which way its door opens. This model puts the gables on the Z axis. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'pattolo',
        name: t('Pattolo', 'Threaded beam'),
        gloss: t(
          'Balok menembus lubang yang dipahat tembus pada tiang, lalu dipasak. Bukan ditakik pada sisinya — dan perbedaan itulah yang membuat rumah ini bisa dibongkar dan dipindahkan utuh.',
          'A beam passes through a mortise cut clean through the post and is pegged. Not notched onto its face — and that difference is what lets this house come apart and be carried away whole.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t('Kasau ditakik pada bubungan.', 'A rafter is notched onto the ridge.'),
      },
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat on a stone'),
        gloss: t(
          'Kaki tiang duduk di batu, tidak ditanam — yang juga sebabnya rumah ini bisa diangkat begitu saja.',
          'A post foot seats on its stone and is not buried — which is also why this house can simply be lifted.',
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
