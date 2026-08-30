/**
 * The tanean lanjang, as the registry sees it.
 *
 * The twenty-fifth file of this shape, and the one that tests the neutral
 * contract hardest: what it hands back is not a building. The registry asked
 * for parts, a scene model, a timeline, verdicts and provenance, and a cluster
 * of nine buildings around a yard answers all five — because the registry
 * never asked how many buildings a `Built` contains.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { neighbourLayout } from './frame'
import { runInvariants } from './invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  SOURCES,
  STAGES,
  bentukInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { seniorityCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** Five households under bangsal roofs, with the kitchen row built. */
const SHOWCASE: Rules = { rumah: 5, bentuk: 'bangsal', dapur: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = bentukInfo(rules.bentuk)
  const area = layout.yard.halfX * 2 * layout.yard.halfZ * 2

  const readout: readonly Readout[] = [
    { label: t('Rumah', 'Houses'), value: String(rules.rumah) },
    { label: t('Panjang tanean', 'Length of the yard'), value: `${(layout.yard.halfZ * 2).toFixed(1)} m` },
    { label: t('Luas tanean', 'Area of the yard'), value: `${area.toFixed(0)} m²` },
    { label: t('Rumah induk', 'The tonghuh'), value: `${(layout.houses[0]?.width ?? 0).toFixed(2)} m` },
    { label: t('Rumah anak', 'A daughter’s house'), value: `${(layout.houses[1]?.width ?? 0).toFixed(2)} m` },
    { label: t('Bangunan', 'Buildings'), value: String(1 + layout.houses.length + layout.kitchens.length) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'halaman',
      title: t('Halamannya adalah ruangnya', 'The yard is the room'),
      body: t(
        `Tanean bukan sisa ruang di antara bangunan; bangunan-bangunannya disusun mengelilinginya. Menjemur tembakau dan padi, hajatan, kematian, dan menerima siapa pun yang bukan keluarga — semuanya di atas ${area.toFixed(0)} m² tanah padat ini, dan rumah-rumahnya pada dasarnya untuk tidur. Karena itu halaman ini ada di dalam daftar bagian dan dibuat lebih dulu daripada apa pun yang berdiri di sekelilingnya. Hanya satu pak lain yang punya tanah sebagai bagian: imah Baduy, dan di sana tanah itu adalah yang tidak boleh dipotong.`,
        `A tanean is not space left between buildings; the buildings are arranged around it. Drying tobacco and rice, weddings, funerals, and receiving anybody who is not family — all of it happens on these ${area.toFixed(0)} m² of beaten earth, and the houses are essentially for sleeping. So the yard is in the part list and is made before anything that stands around it. Only one other pack has ground as a part: the Baduy imah, and there the ground is what may not be cut.`,
      ),
      value: t(area.toFixed(0), area.toFixed(0)),
      unit: t('m² ruang bersama', 'm² of shared room'),
    },
    {
      key: 'silsilah',
      title: t('Panjangnya adalah silsilah', 'Its length is a genealogy'),
      body: t(
        `${rules.rumah} rumah: rumah induk di ujung barat, dan satu rumah untuk tiap anak perempuan yang menikah, ditambahkan ke arah timur menurut urutan lahir. Menambah satu rumah tangga tidak menggeser satu pun rumah yang sudah berdiri — yang bertambah adalah halamannya. Rumah betang memanjang dengan cara yang sama dan yang bertambah adalah biliknya; di sini yang bertambah adalah bangunan utuh, dan yang mengikatnya menjadi satu bukan atap melainkan sebidang tanah.`,
        `${rules.rumah} houses: the parent household at the west end, and one house for each married daughter added eastward in order of birth. Adding a household moves none of the houses already standing — what grows is the yard. A betang lengthens the same way and what it adds is a room; here what is added is a whole building, and what holds them together is not a roof but a piece of ground.`,
      ),
      value: t(String(rules.rumah), String(rules.rumah)),
      unit: t('rumah tangga, dari barat ke timur', 'households, west to east'),
    },
    {
      key: 'kedudukan',
      title: t('Kedudukan dinyatakan dua kali, dan yang kedua dapat keliru', 'Standing is stated twice, and the second one can go wrong'),
      body: t(
        `Yang paling tua berdiri paling barat, paling dekat langgar, dan rumahnya paling lebar: ${(layout.houses[0]?.width ?? 0).toFixed(2)} m terhadap ${(layout.houses[1]?.width ?? 0).toFixed(2)} m. Letak tidak dapat keliru dengan sendirinya — deret adalah deret. Ukuran dapat, sebab kedua lebar itu angka yang berdiri sendiri-sendiri, dan tidak ada apa pun yang menghubungkannya selain aturan itu sendiri.`,
        `The eldest stands westmost, nearest the langgar, and has the widest house: ${(layout.houses[0]?.width ?? 0).toFixed(2)} m against ${(layout.houses[1]?.width ?? 0).toFixed(2)} m. The position cannot go wrong by itself — a row is a row. The size can, because those two frontages are independent numbers with nothing between them but the rule.`,
      ),
      value: t(
        `${((layout.houses[0]?.width ?? 0) - (layout.houses[1]?.width ?? 0)).toFixed(2)}`,
        `${((layout.houses[0]?.width ?? 0) - (layout.houses[1]?.width ?? 0)).toFixed(2)}`,
      ),
      unit: t('m kelebihan rumah induk', 'm of extra frontage for the tonghuh'),
    },
    {
      key: 'barat',
      title: t('Aturan kedua dari luar Nusantara, dan sebuah pembetulan', 'The second rule from outside the archipelago, and a correction'),
      body: t(
        'Langgar berdiri di ujung barat tanean karena salat menghadap ke barat. Projek ini pernah menulis bahwa rumoh Aceh satu-satunya bangunan di sini yang diputar oleh aturan dari luar kepulauan; dengan adanya susunan ini, catatan itu keliru. Yang masih benar adalah bentuk yang lebih sempit: di Aceh yang diputar adalah seluruh denah rumahnya, sedangkan di sini yang ditempatkan adalah satu bangunan kecil di kepala sebuah susunan — dan justru bangunan kecil itu yang didirikan lebih dulu daripada rumah mana pun.',
        'The langgar stands at the west end of the tanean because prayer is toward the west. This project once wrote that the rumoh Aceh was the only building here turned by a rule from outside the archipelago; with this arrangement in the collection, that note is wrong. What survives is the narrower claim: in Aceh a whole house plan is turned by it, while here what is placed is one small building at the head of an arrangement — and that small building goes up before any of the houses.',
      ),
      value: t('2', '2'),
      unit: t('bangunan yang diarahkan dari luar Nusantara', 'buildings oriented from outside the archipelago'),
    },
    {
      key: 'bentuk',
      title: t('Satu bentuk atap untuk seluruh deret', 'One roof form for the whole row'),
      body: t(
        `${info.glossId} Rumah bubungan tinggi Banjar juga punya aturan yang memilih atap dan sekaligus memberi nama rumahnya, dan itu bukan pernyataan yang sama: di sana empat atap berbeda berdiri di atas satu bangunan pada satu bubungan. Di sini satu bentuk diulang di sepanjang deret, sebab rumah-rumah satu tanean adalah rumah yang sama diulang — jadi aturan ini berlaku untuk sekumpulan bangunan sekaligus, satu-satunya dalam projek ini.`,
        `${info.glossEn} The Banjar rumah bubungan tinggi also has a rule that selects a roof and with it the house’s name, and it is not the same claim: there four different roofs stand over one building on one ridge. Here one form is repeated down the row, because the houses of one tanean are the same house repeated — so this rule applies to a set of buildings at once, the only one in the project that does.`,
      ),
      value: t(info.name, info.name),
      unit: t('bentuk atap, diulang', 'roof form, repeated'),
    },
  ]

  return {
    key: 'madura',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout, neighbourLayout(rules)),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Tanean lanjang', 'Tanean lanjang'),
    subhead: t(
      `${rules.rumah} rumah · ${(layout.yard.halfZ * 2).toFixed(0)} m halaman · atap ${info.name.toLowerCase()}`,
      `${rules.rumah} houses · a ${(layout.yard.halfZ * 2).toFixed(0)} m yard · ${info.name.toLowerCase()} roofs`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = seniorityCounterexample()
  const rows = (w: { tonghuh: number; daughter: number }): readonly Readout[] => [
    { label: t('rumah induk', 'the tonghuh'), value: `${w.tonghuh.toFixed(2)} m` },
    { label: t('rumah anak', 'a daughter’s house'), value: `${w.daughter.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tiap anak perempuan membangun rumah yang sama, jadi melebarkan rumah itu melebarkan semuanya sekaligus — dan tidak ada satu pun bagian susunan ini yang menjadi salah: langgar tetap menutup ujung barat, halamannya tetap kosong, deretnya tetap menurut urutan lahir, jaraknya tetap. Yang terjadi adalah rumah-rumah anak tumbuh melewati rumah induk, dan deret itu lalu mengatakan hal yang tidak boleh dikatakannya. Ini penyangkalan kedua dalam projek ini yang berakhir dengan bangunan yang sempurna sehat, setelah bale Bali: tidak ada yang akan roboh, susunannya saja yang menjadi salah tentang keluarganya sendiri.',
      'Every daughter builds the same house, so widening it widens all of them at once — and not one part of the arrangement becomes wrong: the langgar still closes the west end, the yard is still clear, the row still runs in birth order, the pitch still holds. What happens is that the daughters’ houses grow past the tonghuh, and the row then says something it must not. It is the second refutation in this project that ends with a perfectly sound building, after the Balinese bale: nothing would fall down, the arrangement would simply be wrong about the family living in it.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'madura',
    slug: 'madura',
    house: t('Tanean lanjang', 'Tanean lanjang'),
    people: t('Madura', 'The Madurese'),
    place: t('Sumenep dan Madura timur', 'Sumenep and eastern Madura'),
    about: t(
      'Tanean lanjang adalah halaman panjang: sebuah langgar menutup ujung baratnya, sederet rumah berdiri di sisi utara menghadap ke selatan, dan sederet dapur di seberangnya. Rumah induk berdiri di ujung barat, paling dekat langgar, dan rumah tiap anak perempuan yang menikah ditambahkan ke arah timur menurut urutan lahirnya. Yang membuatnya layak dibangun di sini adalah bahwa ia bukan sebuah bangunan. Ini celah yang dinamai sendiri oleh pak Bali — “rumah Bali adalah sebuah pekarangan dan yang dimodelkan di sini hanya satu bangunan” — dan di sini pekarangan itulah pokoknya: halamannya ada di dalam daftar bagian, urutan pendiriannya adalah urutan sebuah keluarga selama puluhan tahun, dan kedudukan dinyatakan oleh letak dan ukuran sekaligus. Matahari pada model ini dihitung untuk Sumenep, 7,0° LS dan 113,87° BT.',
      'A tanean lanjang is a long yard: a langgar closes its west end, a row of houses stands along the north side facing south, and a row of kitchens faces them across it. The parent household stands at the west end nearest the langgar, and each married daughter’s house is added eastward in the order she was born. What makes it worth building here is that it is not a building. This is the gap the Bali pack named for itself — “a Balinese house is a compound and this models one building” — and here the compound is the subject: the yard is in the part list, the raising order is a family’s over decades, and standing is stated by position and by size at once. The sun in this model is computed for Sumenep, 7.0° S and 113.87° E.',
    ),
    caution: t(
      'Yang dibangun di sini adalah susunannya, bukan rumahnya. Rumah Madura punya pembagian dalam, ukiran pada pintu dan dinding, ragam bentuk atap yang jauh lebih banyak daripada tiga, dan perbedaan besar antara Madura barat dan timur — tidak satu pun dari itu dimodelkan. Selain itu: jumlah rumah di sini paling banyak tujuh, sedangkan tanean yang sesungguhnya dapat lebih panjang dan dapat pula bercabang; kandang sapi, sumur dan lumbung yang biasa ada di sekeliling tidak dibangun; letak dapur di sini disederhanakan menjadi satu deret; dan tiap meter dalam pak ini adalah tafsiran penulis atas denah-denah yang diterbitkan, bukan hasil pengukuran.',
      'What is built here is the arrangement, not the house. A Madurese house has internal divisions, carving on its door and walls, far more roof forms than three, and large differences between western and eastern Madura — none of which is modelled. Beyond that: the row here stops at seven, where a real tanean can be longer and can branch; the cattle byre, well and granary usually found around one are not built; the kitchens are simplified to a single row; and every metre in this pack is the author’s reading of published plans rather than a measurement.',
    ),
    orientation: t(
      'Halamannya membujur timur–barat. Langgar menutup ujung barat karena salat menghadap barat, rumah-rumah berdiri di sisi utara dan menghadap selatan ke halaman, dapur di seberangnya menghadap utara. Model ini menaruh utara di −X dan timur di +Z, dan deretnya bertambah ke timur. Tetap tidak ada kendali untuk memutar bangunan.',
      'The yard runs east–west. The langgar closes the west end because prayer is toward the west, the houses stand on the north side facing south into the yard, and the kitchens face them from the south. This model puts north at −X and east at +Z, and the row grows eastward. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'umpak',
        name: t('Umpak', 'Pad stone'),
        gloss: t(
          'Kaki tiang duduk pada lubang dangkal di batu umpaknya, ditahan oleh beratnya sendiri. Tanpa lubang itu keduanya hanya bersentuhan pada satu bidang, dan sambungan yang kedua bagiannya tidak saling memasuki tidak memegang apa-apa.',
          'The foot of a post sits in a shallow socket in its pad stone, held by its own weight. Without the socket the two only touch on one plane, and a joint whose members do not enter each other holds nothing.',
        ),
      },
      {
        kind: 'pathok',
        name: t('Pathok', 'Pegged tenon'),
        gloss: t(
          'Pasak kayu menembus lubang dan pen, seperti pada tradisi kayu Jawa di seberang selat. Rumah Madura adalah rumah kayu berdinding papan di atas lantai bata, dan sambungannya sambungan kayu.',
          'A timber peg through a mortise and tenon, as in the Javanese timber tradition across the strait. A Madurese house is a boarded timber house on a brick plinth, and its joints are timber joints.',
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
