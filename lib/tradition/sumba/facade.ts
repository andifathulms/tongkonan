/**
 * The uma, as the registry sees it.
 *
 * The eighth file of this shape and still no shared code between them, which
 * after eight is about as strong as this kind of evidence gets.
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
  KAMBANIRU,
  MENARA_SCALE,
  SOURCES,
  STAGES,
  partClass,
  partSplit,
  provenanceSplit,
  umaInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { towerCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A tall tower, and a house that receives on every side. */
const SHOWCASE: Rules = { uma: 'mbatangu', menara: 17, bangga: true }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = umaInfo(rules.uma)
  const tower = layout.menara.peakY - layout.menara.footY

  const readout: readonly Readout[] = [
    { label: t('Puncak', 'Peak'), value: `${layout.menara.peakY.toFixed(2)} m` },
    { label: t('Rumah di bawahnya', 'House beneath'), value: `${layout.shoulderY.toFixed(2)} m` },
    {
      label: t('Menara : rumah', 'Tower : house'),
      value: info.tower ? `${(tower / layout.shoulderY).toFixed(2)} × ` : '—',
    },
    { label: t('Uma deta', 'The loft'), value: info.tower ? `${layout.menara.loftY.toFixed(2)} m` : '—' },
    { label: t('Kambaniru', 'Kambaniru'), value: '4' },
    { label: t('Tinggi dinding', 'Wall height'), value: `${layout.wallHeight.toFixed(2)} m` },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'menara',
      title: t('Untuk apa puncak setinggi itu', 'What the peak is for'),
      body: t(
        'Untuk menyimpan. Di dalamnya ada uma deta, tempat marapu — benda-benda leluhur — disimpan, dan menara itu ada karena loteng itu, bukan sebaliknya. Pada tujuh rumah lain dalam projek ini atap menaungi sesuatu; yang ini mewadahi sesuatu. Bangunan ini bukan rumah beratap tinggi — ia sebuah wadah dengan rumah di kakinya, dan urutan pendiriannya menyatakan hal itu: loteng dipasang lebih dahulu, lalu menara dibangun mengelilinginya.',
        'To keep something. Inside it is the uma deta, where the marapu — the ancestral objects — are held, and the tower exists because of that loft rather than the other way about. On the other seven houses here the roof shelters something; this one contains something. This is not a house with a tall roof — it is a container with a house around its foot, and the raising sequence says so: the loft goes in first and the tower is built around it.',
      ),
      value: t(`${layout.menara.loftY.toFixed(1)}`, `${layout.menara.loftY.toFixed(1)}`),
      unit: info.tower ? t('m — tinggi uma deta', 'm — the height of the loft') : t('tanpa loteng', 'no loft'),
    },
    {
      key: 'mbatangu',
      title: t('Mengapa sebagian rumah tidak punya puncak', 'Why some houses have no peak'),
      body: t(
        'Karena mereka tidak menyimpan apa-apa. Uma kamadungu bukan uma mbatangu yang lebih kecil — ia jenis bangunan yang lain, dengan atap limas rendah dan tanpa loteng, karena rumah tangga yang tidak memegang marapu tidak punya alasan membangun puncak. Setiap pilihan dua-arah lain dalam projek ini mengubah perbandingan atau menambah bagian; yang ini mengubah bangunannya menjadi benda dengan jenis yang berbeda.',
        'Because they keep nothing. An uma kamadungu is not a smaller uma mbatangu — it is a different kind of building, with a low hipped roof and no loft, because a household holding no marapu has no reason to build a peak. Every other either/or in this project changes a proportion or adds a part; this one changes the building into a different kind of thing.',
      ),
      value: t(info.name, info.name),
      unit: info.tower ? t('bermenara', 'with a tower') : t('tanpa menara', 'without one'),
    },
    {
      key: 'kambaniru',
      title: t('Mengapa keempat sudutnya berbeda', 'Why the four corners differ'),
      body: t(
        'Karena keempat tiangnya bernama dan masing-masing punya peran: beras disimpan di satu sudut, sesaji dipersembahkan di sudut lain, dan sisi laki-laki serta perempuan bermula di dua sisanya. Ini satu-satunya rumah dalam projek ini yang tiangnya perorangan — di tujuh rumah lain, tiang ke-tujuh adalah benda yang sama dengan tiang ke-delapan.',
        'Because its four posts are named and each has a role: rice is kept at one corner, offerings made at another, and the men’s and women’s sides begin at the remaining two. It is the only house in this project whose posts are individuals — in the other seven, the seventh post is the same thing as the eighth.',
      ),
      value: t('4', '4'),
      unit: t('tiang bernama', 'named posts'),
    },
    {
      key: 'rendah',
      title: t('Mengapa rumahnya begitu rendah', 'Why the house itself is so low'),
      body: t(
        'Karena bukan di situ letak persoalannya. Dindingnya kurang dari dua meter dan panggungnya pendek: orang duduk di dalam rumah ini, tidak berdiri. Bandingkan dengan menara di atasnya, yang dua kali tinggi seluruh bangunan di bawahnya dan tidak dihuni siapa pun. Perbandingan itu adalah isi bangunannya.',
        'Because that is not where the matter lies. Its walls are under two metres and its platform is short: people sit in this house rather than stand in it. Set that against the tower above, which is twice the height of everything beneath it and inhabited by nobody. That ratio is the content of the building.',
      ),
      value: t(`${layout.wallHeight.toFixed(2)}`, `${layout.wallHeight.toFixed(2)}`),
      unit: t('m tinggi dinding', 'm of wall'),
    },
    {
      key: 'bangga',
      title: t('Dari sisi mana rumah ini menerima', 'Which sides this house receives on'),
      body: t(
        'Bangga adalah serambi di luar inti, sedikit lebih rendah daripada lantainya. Melingkar penuh berarti rumah yang menerima dari segala sisi; pada dua sisi saja berarti rumah yang menerima dari sisi tempat tetangganya berada. Model ini tidak punya tetangga, jadi sisi mana yang dipilih adalah penetapan penulis — dan itu dinyatakan, bukan disamarkan.',
        'The bangga is the veranda outside the core, sitting a little below its floor. A full circuit is a house that receives on every side; two sides only is a house that receives on the sides its neighbours are. This model has no neighbours, so which two is the author’s choice — and that is stated rather than disguised.',
      ),
      value: t(layout.bangga.full ? '4' : '2', layout.bangga.full ? '4' : '2'),
      unit: t('sisi', 'sides'),
    },
  ]

  return {
    key: 'sumba',
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
    subhead: info.tower
      ? t(
          `puncak ${layout.menara.peakY.toFixed(1)} m · ${(tower / layout.shoulderY).toFixed(1)} × rumahnya · uma deta di dalamnya`,
          `a peak at ${layout.menara.peakY.toFixed(1)} m · ${(tower / layout.shoulderY).toFixed(1)} × the house · the uma deta inside it`,
        )
      : t(
          `tanpa menara · atap limas ${layout.shoulderY.toFixed(1)} m · tidak ada yang disimpan`,
          `no tower · a hipped roof at ${layout.shoulderY.toFixed(1)} m · nothing kept`,
        ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = towerCounterexample()
  const rows = (w: { house: number; tower: number }): readonly Readout[] => [
    { label: t('rumah', 'house'), value: `${w.house.toFixed(2)} m` },
    { label: t('menara', 'tower'), value: `${w.tower.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Kecilkan perbandingan yang menetapkan tinggi menara dan tidak ada yang roboh, tidak ada yang dinolkan; loteng tetap di dalam menara dan alang-alang tetap menutupinya. Yang berhenti benar adalah bahwa bangunan ini sebuah wadah dengan rumah di kakinya — di bawah ketinggian tertentu ia menjadi rumah beratap tinggi, benda dengan jenis yang berbeda dan alasan keberadaan yang berbeda. Tidak seorang pun bisa memandang modelnya lalu menyebut ia berada di sisi mana dari garis itu tanpa diberi tahu untuk apa garis itu ada. Setelah delapan rumah, pola kegagalannya sama seperti sebelumnya — aturan yang tidak dapat dilaksanakan, bukan aturan yang dilanggar — hanya saja di sini yang gagal bukan geometrinya melainkan pernyataan yang dibuat geometri itu.',
      'Shrink the ratio that sets the tower’s height and nothing collapses, nothing is zeroed; the loft is still inside the tower and the thatch still covers it. What stops being true is that the building is a container with a house at its foot — below a certain height it becomes a house with a tall roof, a different kind of object with a different reason for existing. Nobody could look at the model and say which side of the line it was on without being told what the line was for. After eight houses the shape of failure is the same as ever — a rule that cannot be carried out rather than one disobeyed — except that here what fails is not the geometry but the claim the geometry makes.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sumba',
    slug: 'sumba',
    house: t('Uma', 'Uma'),
    people: t('Sumba', 'Sumbanese'),
    place: t('Sumba Timur, Nusa Tenggara Timur', 'East Sumba, East Nusa Tenggara'),
    about: t(
      'Uma adalah rumah orang Sumba, dan yang paling dikenal adalah uma mbatangu — rumah bermenara. Di atas inti rendah bertiang empat berdiri menara alang-alang beberapa kali tinggi rumahnya, dan menara itu ada karena isinya: uma deta, loteng tempat marapu disimpan. Yang membuatnya layak dibangun di sini adalah pembalikan itu. Pada tujuh rumah lain dalam projek ini atap menaungi sesuatu; yang ini mewadahi sesuatu, dan rumah di bawahnya adalah kakinya. Nama bagian pada layar ini — uma, uma mbatangu, uma kamadungu, kambaniru, uma deta, marapu, bangga — adalah kata Kambera dari Sumba Timur. Matahari pada model ini dihitung untuk Sumba Timur, 9,66° LS dan 120,26° BT.',
      'An uma is the house of the Sumbanese, and the best known is the uma mbatangu — the house with a tower. Above a low four-post core rises a thatched peak several times the height of the house, and it is there because of what is in it: the uma deta, the loft where the marapu are kept. What makes it worth building here is that inversion. On the other seven houses in this project the roof shelters something; this one contains something, and the house beneath is its foot. The parts named on this screen — uma, uma mbatangu, uma kamadungu, kambaniru, uma deta, marapu, bangga — are Kambera words from East Sumba. The sun in this model is computed for East Sumba, 9.66° S and 120.26° E.',
    ),
    caution: t(
      'Tiga hal perlu dinyatakan langsung. Pertama, angka yang paling menentukan di sini juga yang paling lemah dasarnya: tinggi menara dibanding rumahnya adalah interpolasi penulis, dan justru angka itulah yang membentuk siluet yang membuat foto Sumba dikenali. Sumber sepakat bahwa puncaknya menjulang dan bahwa yang lebih tinggi menyatakan lebih banyak; tak satu pun memberi angka. Kedua, nama dan peran keempat kambaniru diberikan sebagai peran, bukan sebagai pernyataan tentang tata upacara — yang bersumber adalah bahwa jumlahnya empat, bahwa keempatnya bernama, dan bahwa tiap sudut berarti sesuatu yang berbeda. Ketiga, Sumba punya banyak wilayah adat dengan perbedaan nyata dalam denah, penamaan dan praktik; istilah di sini dari Sumba Timur, dan pak ini tidak berpura-pura mewakili seluruh pulau. Tidak ada ukiran, dan tidak ada satu pun angka di sini yang berasal dari pengukuran.',
      'Three things to state outright. First, the most consequential number here is also the least supported: the height of the tower relative to the house is the author’s interpolation, and it is precisely that figure which shapes the silhouette a photograph of Sumba is recognisable by. The sources agree the peak is tall and that taller says more; none gives a figure. Second, the names and roles of the four kambaniru are given as roles rather than as a claim about ritual practice — what is sourced is that there are four, that they are named, and that each corner means something different. Third, Sumba has many domains with real differences in plan, in naming and in practice; the terms here are from East Sumba, and this pack does not pretend to stand for the island. There is no carving, and not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah berdiri mengelilingi lapangan kampung dengan kubur batu para leluhur di tengahnya, dan menghadap ke dalam — ke arah kubur itu. Aturannya bersifat hubungan seperti pada mbaru niang dan rumah gadang, tetapi yang dihadapi bukan batu upacara atau halaman melainkan orang-orang yang bendanya disimpan di dalam menara rumah itu sendiri. Jadi arah hadap dan isi menara menyatakan hal yang sama, dari dua arah. Model ini menaruh muka rumah pada −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The houses stand around a village plaza with the stone graves of the ancestors at its centre, and face inward — toward those graves. The rule is relational as in the mbaru niang and the rumah gadang, but what is faced is neither a ceremonial stone nor a yard: it is the people whose objects are kept inside the house’s own tower. So the orientation and the contents of the peak state the same thing from two directions. This model puts the front on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'tumpu',
        name: t('Tumpu', 'Seat on a stone'),
        gloss: t('Kaki kambaniru duduk di batunya, tidak ditanam.', 'A kambaniru foot seats on its stone and is not buried.'),
      },
      {
        kind: 'pasak',
        name: t('Pasak', 'Pegged tenon'),
        gloss: t(
          'Balok masuk ke kepala kambaniru dan dipasak. Keempat sambungan inilah yang memikul menara — bukan dinding, yang terlalu rendah untuk memikul apa pun.',
          'A beam enters the head of a kambaniru and is pegged. These four joints are what carry the tower — not the walls, which are too low to carry anything.',
        ),
      },
      {
        kind: 'takik',
        name: t('Takik', 'Lap'),
        gloss: t('Tiang menara ditakik pada bubungan di puncaknya.', 'A tower post is notched onto the ridge at its top.'),
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
