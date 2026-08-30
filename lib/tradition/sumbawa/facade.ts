/**
 * Dalam Loka, as the registry sees it.
 *
 * The thirty-fifth file of this shape, and the first whose plan is a number
 * somebody else fixed.
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
  susunanInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { spanCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The wide arrangement, six rooms behind the great hall, walkway built. */
const SHOWCASE: Rules = { bilik: 6, susunan: 'sebelas-lintang', serambi: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = susunanInfo(rules.susunan)

  const readout: readonly Readout[] = [
    { label: t('Tiang', 'Posts'), value: String(layout.grid.posts) },
    { label: t('Susunan', 'The grid'), value: `${info.across} × ${info.along}` },
    { label: t('Jarak tiang', 'Spacing'), value: `${layout.spacing.bay.toFixed(2)} m` },
    { label: t('Bentang balok', 'What a beam crosses'), value: `${layout.spacing.limit.toFixed(2)} m` },
    { label: t('Denah', 'Plan'), value: `${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m` },
    { label: t('Bilik', 'Rooms'), value: String(rules.bilik) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'cacah',
      title: t('Cacah yang datang dari sebuah teks', 'A count that comes from a text'),
      body: t(
        'Sembilan puluh sembilan tiang, sebanyak nama Tuhan. Tiap cacah lain dalam projek ini menghitung sesuatu yang ada di depan mata: rumah tangga pada rumah betang, marga pada baileo, perapian pada khaim Korowai, tempat duduk pada sasadu, bahu pemikul pada bade, tubuh yang berbaring pada sudung. Semuanya dapat berbeda tahun depan. Yang ini tidak dapat: ia diberikan, tepat, dan rangkanyalah yang harus disusun mengelilinginya.',
        'Ninety-nine posts, as many as the names of God. Every other tally in this project counts something in front of the builders: households in a betang, clans in a baileo, hearths in a Korowai khaim, seats in a sasadu, shoulders under a bade, sleeping bodies in a sudung. Every one of those could come out differently next year. This one cannot: it is given, it is exact, and the frame has to be arranged around it.',
      ),
      value: t('99', '99'),
      unit: t('tiang, dan angkanya bukan milik tukangnya', 'posts, and the number is not the builders’'),
    },
    {
      key: 'susunan',
      title: t('Cacah yang ternyata menetapkan bentuk', 'A count that turns out to fix a shape'),
      body: t(
        `Sembilan puluh sembilan adalah sembilan kali sebelas, jadi rangkanya ${info.across} baris tiang melintang dan ${info.along} memanjang, dan yang tersisa untuk dipilih hanyalah yang mana ke mana. Tidak ada aturan lain dalam kumpulan ini yang berbuat begitu: aturan lain menetapkan ukuran, jumlah ruang, tinggi lantai, atau bentuk atap, dan denahnya tetap bebas. Di sini sebuah bilangan menetapkan denahnya sampai ke arah hadapnya.`,
        `Ninety-nine is nine elevens, so the frame is ${info.across} post lines across and ${info.along} along, and all that is left to choose is which way round. No other rule in this collection does that: the others fix a size, a number of rooms, a floor height or a roof form, and the plan stays free. Here a number fixes the plan down to which way it faces.`,
      ),
      value: t(`${info.across} × ${info.along}`, `${info.across} × ${info.along}`),
      unit: t('dan hanya dua susunan yang mungkin', 'and only two arrangements are possible'),
    },
    {
      key: 'bentang',
      title: t('Yang tumbuh hanya jaraknya', 'The only thing that can grow is the spacing'),
      body: t(
        `Yang menghendaki istana lebih besar tidak dapat menambah tiang: seratus delapan akan menjadi bangunan lain dengan pernyataan lain. Yang tersisa hanyalah merenggangkan jaraknya — sekarang ${layout.spacing.bay.toFixed(2)} m terhadap ${layout.spacing.limit.toFixed(2)} m yang masih diseberangi satu balok. Cacahnya milik sebuah teks, bentangnya milik kayunya, dan tidak ada yang menghubungkan keduanya; di situlah bangunan ini dapat gagal.`,
        `Anybody wanting a larger palace cannot add posts: a hundred and eight would be a different building making a different claim. All that is left is to stretch the spacing — ${layout.spacing.bay.toFixed(2)} m at present against the ${layout.spacing.limit.toFixed(2)} m a single beam crosses. The count belongs to a text, the span to the timber, and nothing relates them; that is where this building can fail.`,
      ),
      value: t(`${((layout.spacing.limit - layout.spacing.bay) * 100).toFixed(0)}`, `${((layout.spacing.limit - layout.spacing.bay) * 100).toFixed(0)}`),
      unit: t('cm tersisa sebelum baloknya kepanjangan', 'cm left before a beam is too long'),
    },
    {
      key: 'memikul',
      title: t('Dan tiap tiang memikul sesuatu', 'And every post carries something'),
      body: t(
        'Bangunan mana pun dapat dibuat bertiang sembilan puluh sembilan dengan menegakkan sebelas tiang hiasan di sudut-sudutnya. Yang membuat cacah ini fakta tentang rangka dan bukan tentang hitungan adalah bahwa tidak ada satu pun yang berdiri tanpa memikul: ada balok di atas tiap barisnya, dan pemeriksaannya menelusuri tiap tiang untuk memastikannya. Cacah yang tidak diperiksa dengan cara itu hanyalah angka yang ditempelkan.',
        'Any building can be given ninety-nine posts by standing eleven ornamental ones in its corners. What makes this count a fact about the frame rather than about arithmetic is that not one of them stands under nothing: there is a beam over every line, and the check walks every post to make sure. A count not tested that way is a number stuck on afterwards.',
      ),
      value: t(String(layout.grid.posts), String(layout.grid.posts)),
      unit: t('tiang, semuanya di bawah balok', 'posts, all of them under a beam'),
    },
    {
      key: 'batas',
      title: t('Batas yang ditetapkan pihak lain', 'A limit set by somebody else'),
      body: t(
        'Imah Baduy dibatasi panjang sebatang kayu yang tidak boleh disambung; rumah woloan oleh panjang bak truk; khaim Korowai oleh pohon yang memikulnya; sudung oleh apa yang dapat dipikul orang; rumah kebaya Betawi oleh garis batas tetangganya. Yang ini dibatasi oleh sebuah bilangan di dalam teks — dan bilangan itu tidak dapat ditawar, tidak dapat diukur ulang, dan tidak akan berubah karena kayunya kebetulan pendek.',
        'The Baduy imah is bounded by a pole that may not be spliced; the woloan house by the length of a lorry; the Korowai khaim by the tree carrying it; the sudung by what a person can carry; the Betawi rumah kebaya by a neighbour’s boundary. This one is bounded by a number in a text — and that number cannot be negotiated, cannot be re-measured, and will not move because the timber happened to be short.',
      ),
      value: t('99', '99'),
      unit: t('dan tidak dapat menjadi seratus', 'and it cannot become a hundred'),
    },
  ]

  return {
    key: 'sumbawa',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Dalam Loka', 'Dalam Loka'),
    subhead: t(
      `99 tiang · susunan ${info.across} × ${info.along} · ${rules.bilik} bilik`,
      `99 posts · a ${info.across} × ${info.along} grid · ${rules.bilik} rooms`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = spanCounterexample()
  const rows = (w: { bay: number; limit: number }): readonly Readout[] => [
    { label: t('jarak antar tiang', 'spacing of the posts'), value: `${w.bay.toFixed(2)} m` },
    { label: t('bentang satu balok', 'what one beam crosses'), value: `${w.limit.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Sultan yang menghendaki istana lebih besar hanya punya satu langkah. Jumlah tiangnya bukan miliknya: sembilan puluh sembilan adalah cacah nama Tuhan, dan seratus delapan akan menjadi bangunan lain yang menyatakan hal lain. Maka gridnyalah yang direnggangkan, dan merenggangkan grid itulah seluruh arti kata “lebih besar” di sini. Tidak ada bagian bangunan yang keberatan — tetap sembilan puluh sembilan tiang, tetap tiap satunya di bawah balok, kedua balainya tetap di bawah satu atap. Yang habis adalah baloknya: lewat satu titik sebatang kayu tidak lagi menyeberangi jarak antar tiang, dan satu-satunya jalan keluar adalah menambah tiang di tengah bentang — yaitu justru hal yang dilarang aturannya.',
      'A sultan wanting a larger palace has exactly one move. The number of posts is not his: ninety-nine is the count of the names of God, and a hundred and eight would be a different building making a different claim. So the grid gets stretched, and stretching it is the whole of what “larger” can mean here. No part of the building objects — still ninety-nine posts, every one still under a beam, both halls still under one roof. What runs out is the beam: past a point a single piece of timber will not cross from one post line to the next, and the only way out is a post in the middle of the span, which is precisely what the rule forbids.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sumbawa',
    slug: 'sumbawa',
    house: t('Dalam Loka', 'Dalam Loka'),
    people: t('Sumbawa', 'The Sumbawa'),
    place: t('Sumbawa Besar, Nusa Tenggara Barat', 'Sumbawa Besar, West Nusa Tenggara'),
    about: t(
      'Dalam Loka adalah istana kesultanan Sumbawa di Sumbawa Besar, berdiri di atas sembilan puluh sembilan tiang — sebanyak nama Tuhan. Itulah alasan bangunan ini dibangun di sini. Tiap cacah lain dalam kumpulan ini menghitung sesuatu yang ada di depan mata dan tahun depan dapat berbeda: rumah tangga, marga, perapian, tempat duduk, bahu pemikul, tubuh yang berbaring. Yang ini diberikan oleh sebuah teks, tepat, dan tidak dapat ditawar. Dua hal mengikutinya. Sembilan puluh sembilan adalah sembilan kali sebelas, jadi bilangan itu menetapkan bukan hanya cacah melainkan bentuk gridnya. Dan karena jumlah tiang tidak dapat ditambah, satu-satunya jalan membesarkan istana ini adalah merenggangkan jaraknya — yang berbenturan dengan bentang yang dapat diseberangi sebatang balok. Matahari pada model ini dihitung untuk Sumbawa Besar, 8,49° LS dan 117,42° BT.',
      'Dalam Loka is the Sumbawa sultanate’s palace at Sumbawa Besar, standing on ninety-nine posts — as many as the names of God. That is why it is here. Every other tally in this collection counts something in front of the builders and could come out differently next year: households, clans, hearths, seats, shoulders, sleeping bodies. This one is given by a text, exact, and not open to negotiation. Two things follow. Ninety-nine is nine elevens, so the number fixes not only a count but the shape of the grid. And because posts cannot be added, the only way to a larger palace is a wider spacing — which runs into the span a single beam will cross. The sun in this model is computed for Sumbawa Besar, 8.49° S and 117.42° E.',
    ),
    caution: t(
      'Yang dibangun di sini adalah rangka dan susunannya, bukan istananya. Dalam Loka yang sesungguhnya penuh ukiran, jendela berjalusi, tangga upacara, dan pembagian ruang yang tidak dimodelkan sama sekali; bagian dalamnya di sini disederhanakan menjadi bilik-bilik berjarak sama. Selain itu: bahwa tiangnya sembilan puluh sembilan disebut sumber, tetapi susunan sembilan kali sebelas adalah bacaan penulis — bilangan itu dapat pula tersusun dengan cara lain pada bangunan yang sesungguhnya; tiap meter di sini tafsiran, meskipun bangunannya berdiri, dipugar, dan dapat diukur; dan istana ini sudah pernah dibongkar sebagian dan dipugar kembali pada abad lalu, sehingga apa yang dapat diukur hari ini belum tentu apa yang berdiri pada 1885.',
      'What is built here is the frame and its arrangement rather than the palace. The real Dalam Loka is full of carving, louvred windows, ceremonial stairs and divisions of space that are not modelled at all; the inner part here is simplified to evenly spaced rooms. Beyond that: that there are ninety-nine posts is what the sources say, but the nine-by-eleven grid is the author’s reading — the number can be arranged other ways in a real building; every metre here is an interpretation, though the building stands, has been restored, and can be measured; and the palace was partly dismantled and rebuilt in the last century, so what can be measured today is not necessarily what stood in 1885.',
    ),
    orientation: t(
      'Tidak ada aturan mata angin dalam pak ini: yang menempatkan istana adalah halaman dan pagar kesultanannya sendiri. Model ini membentangkan bubungan pada sumbu Z dengan bala rea di ujung −Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'There is no compass rule in this pack: what places the palace is its own court and wall. This model runs the ridge along Z with the bala rea at the −Z end. There is still no control that turns the building.',
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
          'Pasak kayu, dan kaki tiap tiang duduk pada cekungan di batunya sendiri — sembilan puluh sembilan kali.',
          'A timber peg, and each post’s foot sits in a hollow in its own stone — ninety-nine times over.',
        ),
      },
      {
        kind: 'baji',
        name: t('Baji', 'Wedge'),
        gloss: t(
          'Baji yang mengikat balok lantai turun ke tiang yang memikulnya.',
          'The wedge tying a floor beam down onto the post carrying it.',
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
