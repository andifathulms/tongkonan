/**
 * The lumbung, as the registry sees it.
 *
 * The twelfth file of this shape and still no shared code between them.
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
  milikInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { guardCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** The village store, on six posts, with the shade beneath it floored. */
const SHOWCASE: Rules = { milik: 'desa', tiang: 6, kolong: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = milikInfo(rules.milik)
  const post = layout.posts[0]
  const overhang = (post?.guardRadius ?? 0) - layout.postSection / 2
  const eave = layout.roof[0]

  const readout: readonly Readout[] = [
    { label: t('Juraian cakram', 'Guard overhang'), value: `${(overhang * 1000).toFixed(0)} mm` },
    { label: t('Tiang', 'Posts'), value: String(rules.tiang) },
    { label: t('Tinggi ruang simpan', 'Store height'), value: `${layout.storeHeight.toFixed(2)} m` },
    { label: t('Lantai simpan', 'Store floor'), value: `${layout.floorY.toFixed(2)} m` },
    { label: t('Tepi atap', 'Eave'), value: `${layout.eaveY.toFixed(2)} m` },
    { label: t('Pias tudung', 'Hood bands'), value: String(Math.max(0, layout.roof.length - 1)) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'padi',
      title: t('Untuk siapa bangunan ini dibuat', 'Who this building was made for'),
      body: t(
        'Untuk padi. Tidak ada tingkat di dalamnya yang bisa ditegakkan seorang manusia, dan di pekarangan Sasak lumbung kerap justru bangunan yang paling cermat dikerjakan. Sebelas bangunan lain dalam projek ini menakar kecermatannya menurut kedudukan orang yang tinggal di dalamnya; yang ini menakarnya menurut nilai yang disimpannya — dan orangnya duduk di bawah, di bagian yang tidak dibangun untuk mereka.',
        'For rice. There is no storey in it a person could stand up in, and in a Sasak yard a lumbung is often the most carefully made thing standing. The other eleven buildings in this project scale their care to the standing of the people inside; this one scales it to the value of what is stored — and the people sit underneath, in the part that was not built for them.',
      ),
      value: t(`${layout.storeHeight.toFixed(2)}`, `${layout.storeHeight.toFixed(2)}`),
      unit: t('m tinggi ruang simpan', 'm of store height'),
    },
    {
      key: 'tikus',
      title: t('Untuk apa cakram di bawah lantainya', 'What the discs beneath the floor are for'),
      body: t(
        'Untuk menghentikan tikus. Tikus yang memanjat tiang tiba di bawah bidang datar yang lebih lebar daripada jangkauannya dan tidak bisa melewatinya. Ini satu-satunya unsur dalam projek ini yang ditujukan kepada makhluk selain manusia — dan ia hanya bekerja bila tidak ada jalan lain ke atas, jadi separuh pertahanan ini justru tentang segala hal yang bukan cakram: tidak ada penyangga miring, tidak ada tangga yang ditinggalkan, tidak ada lantai duduk yang cukup dekat untuk dilangkahi.',
        'To stop rats. A rat climbing a post arrives beneath a flat plate wider than it can reach around and cannot get past. It is the only element in this project aimed at something other than a person — and it works only if there is no other way up, so half of this defence is about everything that is not the disc: no raking brace, no ladder left leaning, no sitting platform close enough to step across from.',
      ),
      value: t(`${(overhang * 1000).toFixed(0)}`, `${(overhang * 1000).toFixed(0)}`),
      unit: t('mm juraian', 'mm of overhang'),
    },
    {
      key: 'tudung',
      title: t('Mengapa atapnya turun melewati lantainya', 'Why the roof falls past its own floor'),
      body: t(
        'Karena ia tudung, bukan atap. Tepinya berakhir di bawah lantai yang dilindunginya, jadi hujan yang miring pun tidak sampai ke padi, dan bentuk itulah yang membuat sebuah lumbung dikenali dari jauh. Lengkungnya dibangun dari primitif yang sama dengan lima atap lain dalam projek ini, hanya dengan tingkat yang jauh lebih banyak — sebuah lengkung adalah banyak tangga.',
        'Because it is a hood rather than a roof. Its edge ends below the floor it protects, so even driven rain does not reach the rice, and that form is what makes a lumbung recognisable from a distance. The curve is built from the same primitive as five other roofs in this project with nothing but far more levels — a curve is many steps.',
      ),
      value: t(`${(layout.floorY - layout.eaveY).toFixed(2)}`, `${(layout.floorY - layout.eaveY).toFixed(2)}`),
      unit: t('m di bawah lantai simpan', 'm below the store floor'),
    },
    {
      key: 'milik',
      title: t('Milik satu rumah tangga atau satu kampung', 'One household’s or one village’s'),
      body: t(
        'Lumbung desa berdiri berderet di dekat tempat berkumpul dan dibuat untuk dilihat dari sana; lumbung keluarga berdiri di pekarangannya sendiri. Bangunan yang sama, dibuat lebih besar — beda derajat, bukan beda jenis. Dalam projek ini justru itu yang tidak biasa: hampir setiap saklar semacam ini pada rumah lain mengubah jenis bangunannya.',
        'A village lumbung stands in a row beside the meeting ground and is built to be seen from it; a household’s stands in its own yard. The same building made larger — a difference of degree, not of kind. In this project that is the unusual case: almost every switch of this shape on the other buildings changes what kind of thing it is.',
      ),
      value: t(info.name, info.name),
      unit: t(`${rules.tiang} tiang`, `${rules.tiang} posts`),
    },
    {
      key: 'kolong',
      title: t('Apa yang terjadi di bawahnya', 'What happens underneath'),
      body: t(
        'Pekerjaan sekitar panen, dan duduk. Kolongnya teduh dan kering, dan bila dilantai ia menjadi tempat duduk — tetapi lantai itu berhenti sebelum tiap tiang, karena lantai yang menyentuh tiang adalah anak tangga, dan anak tangga di sebelah cakram penghalang meniadakan gunanya.',
        'The work around the harvest, and sitting. The space beneath is shaded and dry, and floored it becomes a place to sit — but that floor stops short of every post, because a floor touching a post is a step, and a step beside a rat guard undoes it.',
      ),
      value: t(layout.seat.present ? 'ada' : 'tidak ada', layout.seat.present ? 'floored' : 'bare'),
      unit: t(`kolong ${layout.floorY.toFixed(1)} m`, `${layout.floorY.toFixed(1)} m of headroom`),
    },
  ]

  return {
    key: 'sasak',
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
      `${rules.tiang} tiang · juraian ${(overhang * 1000).toFixed(0)} mm · tepi atap ${(layout.floorY - layout.eaveY).toFixed(2)} m di bawah lantai`,
      `${rules.tiang} posts · ${(overhang * 1000).toFixed(0)} mm of overhang · an eave ${(layout.floorY - layout.eaveY).toFixed(2)} m below the floor`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = guardCounterexample()
  const rows = (w: { post: number; overhang: number }): readonly Readout[] => [
    { label: t('sisi tiang', 'post section'), value: `${(w.post * 1000).toFixed(0)} mm` },
    { label: t('juraian tersisa', 'overhang left'), value: `${(w.overhang * 1000).toFixed(0)} mm` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Cakramnya tidak berubah. Jari-jarinya sebuah ukuran papan, jadi tiang yang digemukkan memakan juraian itu dari dalam sampai habis — dan cakram penghalang berubah menjadi kerah yang rata dengan kayu yang seharusnya dilampauinya. Tidak ada satu pun bagian lumbung ini yang tampak melemah; tiangnya justru tampak lebih kokoh. Dua belas bangunan, dua belas aturan yang tidak dapat dilaksanakan — dan yang khas di sini adalah arahnya: yang meniadakan pertahanan ini justru perbaikan yang pertama kali terpikir oleh seorang tukang.',
      'The disc does not change. Its radius is the size of a plank, so a stouter post eats that overhang from the inside until there is none — and the rat guard becomes a collar flush with the timber it was meant to project beyond. Not one part of this granary looks weaker; the posts look sturdier. Twelve buildings, twelve rules that cannot be carried out — and what is particular here is the direction: the thing that defeats this defence is the first improvement a builder would reach for.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sasak',
    slug: 'sasak',
    house: t('Lumbung', 'Lumbung'),
    people: t('Sasak', 'Sasak'),
    place: t('Lombok, Nusa Tenggara Barat', 'Lombok, West Nusa Tenggara'),
    about: t(
      'Lumbung adalah lumbung padi orang Sasak: kotak kecil di atas empat atau enam tiang, dengan tudung alang-alang melengkung yang tepinya turun melewati lantai simpannya. Ini bangunan pertama dalam projek ini yang bukan rumah — tidak ada yang tinggal di dalamnya, tidak ada tingkat yang bisa ditegakkan seorang manusia, dan di pekarangan Sasak ia kerap justru yang paling cermat dikerjakan. Cirinya yang paling khas pun bukan untuk manusia: cakram lebar pada tiap tiang, tepat di bawah lantai, yang gunanya cuma satu — menghentikan tikus. Matahari pada model ini dihitung untuk Lombok, 8,58° LS dan 116,32° BT.',
      'A lumbung is the Sasak rice granary: a small box on four or six posts under a curved thatched hood whose edge falls below the floor it shelters. It is the first building in this project that is not a house — nobody lives in it, there is no storey a person could stand up in, and in a Sasak yard it is often the most carefully made thing standing. Its most distinctive detail is not for people either: a broad disc on each post just below the floor, with exactly one job — stopping rats. The sun in this model is computed for Lombok, 8.58° S and 116.32° E.',
    ),
    caution: t(
      'Pak ini memakai lebih banyak istilah Indonesia daripada pak mana pun di sini, dan itu disengaja. Hanya kata “lumbung” yang dipakai sebagai istilah setempat; cakram penghalang tikus dan bagian-bagian tudungnya punya nama Sasak yang penulis tidak cukup yakin untuk mencetaknya, jadi semuanya dinamai dalam bahasa Indonesia — kebijakan yang sama dengan pak joglo, diterapkan lebih luas di sini karena sumbernya lebih tipis. Dan angka yang paling menentukan justru yang paling lemah: jari-jari cakram dan sisi tiang bersama-sama menghasilkan juraian yang menghentikan tikus, dan keduanya ditetapkan penulis. Lengkung tudungnya sebuah bentuk yang dipilih, bukan hasil pengepasan pada ukuran apa pun. Tidak ada ukiran, padahal lumbung Sasak berukir.',
      'This pack uses more Indonesian than any other here, and that is deliberate. Only the word “lumbung” is used as a local term; the rat guard and the parts of the hood have Sasak names the author is not confident enough of to print, so all of them are named in Indonesian — the joglo pack’s policy, applied more widely here because the sourcing is thinner. And the most consequential figures are the weakest: the disc’s radius and the post’s section together produce the overhang that stops a rat, and both are the author’s. The hood’s curve is a chosen shape rather than a fit to any measurement. There is no carving, though a Sasak lumbung is carved.',
    ),
    orientation: t(
      'Lumbung berdiri di pekarangan atau berderet di dekat tempat berkumpul, dan yang menentukan arahnya adalah bukaan tempat padi masuk — ia menghadap ke tempat orang bekerja, bukan ke mata angin, sungai, gunung atau laut. Ini satu-satunya bangunan dalam projek ini yang arah hadapnya ditentukan oleh sebuah pekerjaan. Model ini menaruh bukaan pada −Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'A lumbung stands in a yard or in a row beside the meeting ground, and what fixes its bearing is the opening where rice goes in — it faces where the work is done, rather than a compass point, a river, a mountain or the sea. It is the only building in this project whose orientation is set by a task. This model puts the opening on −Z. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat on a stone'),
        gloss: t(
          'Kaki tiang duduk di batunya, tidak ditanam — yang juga menutup satu jalan bagi rayap, bukan hanya bagi tikus.',
          'A post foot seats on its stone and is not buried — which closes a path to termites as well as to rats.',
        ),
      },
      {
        kind: 'sarung',
        name: t('Sarung', 'Threaded on'),
        gloss: t(
          'Cakram penghalang disarungkan pada tiangnya: yang dilewati justru bagian yang lebih besar, dan itu satu-satunya sambungan semacam itu dalam projek ini. Ia juga harus dipasang sebelum lantai, karena sesudah itu tidak bisa lagi — sebuah pertahanan yang menentukan urutan kerja.',
          'The guard is threaded onto its post: the part being passed through is the larger of the two, and it is the only joint of that kind in this project. It also has to go on before the floor, because afterwards it cannot — a defence that dictates the order of work.',
        ),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t('Kasau bertemu bubungan dan dipasak.', 'A rafter meets the ridge and is pegged.'),
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
