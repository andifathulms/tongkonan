/**
 * The imah, as the registry sees it.
 *
 * The nineteenth file of this shape, and the first for a building whose part
 * list starts with a hillside. The registry needed nothing: it asks for parts,
 * and the ground is a part.
 */

import type { Site } from '@/lib/solar/position'
import type { Built, CounterexampleView, Reading, Readout, Text, Tradition } from '../registry'
import { buildHouse, buildTimeline } from './assembly'
import { CODEC, rulesFromQuery, rulesToQuery } from './address'
import { partBounds, runInvariants } from './invariants'
import {
  ALL_DIMS,
  DEFAULT_RULES,
  DIMS,
  DIM_KEYS,
  SOURCES,
  STAGES,
  lerengInfo,
  partClass,
  partSplit,
  provenanceSplit,
  wilayahInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { slopeCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** An outer village on steep ground, with no platform in front. */
const SHOWCASE: Rules = { wilayah: 'luar', lereng: 'curam', sosoro: false }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = wilayahInfo(rules.wilayah)
  const ground = lerengInfo(rules.lereng)
  const lengths = house.parts
    .filter((p) => p.stage === 'tihang')
    .map((p) => {
      const b = partBounds(p)
      return b.max[1] - b.min[1]
    })
  const longest = lengths.length > 0 ? Math.max(...lengths) : 0
  const shortest = lengths.length > 0 ? Math.min(...lengths) : 0

  const readout: readonly Readout[] = [
    { label: t('Lereng', 'Slope'), value: `${(layout.slope * 100).toFixed(0)}%` },
    { label: t('Turun sepanjang rumah', 'Fall along the house'), value: `${(layout.length * layout.slope).toFixed(2)} m` },
    { label: t('Tiang terpanjang', 'Longest post'), value: `${longest.toFixed(2)} m` },
    { label: t('Tiang terpendek', 'Shortest post'), value: `${shortest.toFixed(2)} m` },
    { label: t('Satu batang memberi', 'One pole gives'), value: `${layout.poleLength.toFixed(2)} m` },
    { label: t('Paku pada rangka', 'Iron in the frame'), value: '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'larangan',
      title: t('Aturannya berupa larangan', 'The rules are prohibitions'),
      body: t(
        'Delapan belas pak lain dalam projek ini menuliskan apa sebuah bangunan itu: bagaimana ia berpangkat, siapa duduk di mana, berapa rumah tangga yang ditampungnya, apa yang harus dilaluinya. Pikukuh Kanekes menuliskan apa yang tidak boleh dilakukan. Tanah tidak boleh digali atau diratakan. Kayu tidak boleh digergaji. Besi tidak boleh masuk ke rangka. Tidak boleh ada yang ditambahkan yang tidak ditumbuhkan hutan.',
        'The other eighteen packs in this project write down what a building is: how it is ranked, who sits where, how many households it holds, what it has to survive. The pikukuh of Kanekes write down what may not be done. The ground may not be dug or levelled. Timber may not be sawn. Iron may not enter the frame. Nothing may be added that the forest did not grow.',
      ),
      value: t('0', '0'),
      unit: t('paku pada seluruh rangka', 'nails in the whole frame'),
    },
    {
      key: 'tanah',
      title: t('Tanahnya ada dalam daftar bagian bangunan ini', 'The ground is in this building’s part list'),
      body: t(
        'Delapan belas bangunan lain berdiri di atas tanah datar karena sebuah model memerlukan titik awal — tanahnya latar, bukan bagian. Di sini larangan itu tentang tanahnya, jadi tanahnya harus ada di dalam model: sebuah lempeng lereng yang dimiringkan, dipasang lebih dulu, dan tidak diubah. Satu-satunya hal dalam projek ini yang ada dalam daftar bagian justru karena pembangunnya dilarang menyentuhnya.',
        'The other eighteen buildings stand on level ground because a model needs somewhere to start — the ground is a background rather than a part. Here the prohibition is about the ground, so the ground has to be in the model: a tilted slab of hillside, set first and left alone. The only thing in this project that is in a part list precisely because the builders are forbidden to touch it.',
      ),
      value: t(`${(layout.slope * 100).toFixed(0)}%`, `${(layout.slope * 100).toFixed(0)}%`),
      unit: t(ground.name, ground.name),
    },
    {
      key: 'tiang',
      title: t('Biaya larangan itu, dinyatakan dalam meter', 'The cost of the prohibition, stated in metres'),
      body: t(
        `Batu diletakkan di tempat batu itu berada dan tiang dipotong sepanjang yang disisakan tanah: ${shortest.toFixed(2)} m di sisi atas, ${longest.toFixed(2)} m di sisi bawah, dan tidak ada dua tiang yang sama. Lantainya tetap satu bidang datar. Meratakan tanahnya akan membuat semua tiang sama panjang dan pekerjaannya jauh lebih mudah — dan itulah yang tidak boleh dilakukan.`,
        `The stones are set where they lie and the posts are cut to what the ground leaves: ${shortest.toFixed(2)} m uphill, ${longest.toFixed(2)} m downhill, and no two posts alike. The floor stays one level plane. Levelling the ground would make every post the same and the work far easier — and that is the thing that may not be done.`,
      ),
      value: t((longest - shortest).toFixed(2), (longest - shortest).toFixed(2)),
      unit: t('m selisih antara tiang terpanjang dan terpendek', 'm between the longest post and the shortest'),
    },
    {
      key: 'tamu',
      title: t('Tamu berhenti di muka', 'A visitor stops at the front'),
      body: t(
        'Tamu diterima di sosoro, bale-bale di muka, dan tidak masuk ke ruang dalam. Rumah limas Palembang mendudukkan tamu pada tingkat lantai yang menyatakan kedudukannya — di sana urutan kedudukan itu justru isi bangunannya. Di sini tidak ada urutan untuk didudukkan: ada garis, dan garis itu ada di muka pintu.',
        'A visitor is received on the sosoro, the platform at the front, and does not enter the inner room. The Palembang rumah limas seats a guest on the floor level that states their standing — there the sequence is the building’s content. Here there is no sequence to be seated on: there is a line, and it is at the door.',
      ),
      value: t(String(layout.doors), String(layout.doors)),
      unit: t(layout.doors === 1 ? 'pintu' : 'pintu', layout.doors === 1 ? 'door' : 'doors'),
    },
    {
      key: 'wilayah',
      title: t('Yang paling ketat adalah yang paling sedikit memiliki', 'The strictest have the least'),
      body: t(
        `${info.glossId} Ini bukan pangkat: tidak ada yang lebih tinggi, dan tidak ada bangunan yang lebih besar untuk yang lebih ketat. Bandingkan dengan tongkonan, yang menyatakan kedudukan dengan mengalikan setiap ukuran — di sini kedudukan justru berarti lebih sedikit, bukan lebih besar.`,
        `${info.glossEn} This is not a rank: neither is above the other, and the stricter do not get a larger building. Set it beside the tongkonan, which states standing by multiplying every dimension — here standing means having less rather than more.`,
      ),
      value: t(info.name, info.name),
      unit: t(`${info.doors} pintu`, `${info.doors} door${info.doors === 1 ? '' : 's'}`),
    },
  ]

  return {
    key: 'sunda',
    query: rulesToQuery(rules),
    house,
    scene: sceneModel(house, layout),
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t('Imah Baduy', 'The Baduy imah'),
    subhead: t(
      `${info.name} · lereng ${(layout.slope * 100).toFixed(0)}% · tanah tidak dipotong`,
      `${info.name} · a ${(layout.slope * 100).toFixed(0)}% slope · ground not cut`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = slopeCounterexample()
  const rows = (w: { longest: number; available: number }): readonly Readout[] => [
    { label: t('tiang terpanjang', 'longest post'), value: `${w.longest.toFixed(2)} m` },
    { label: t('satu batang memberi', 'one pole gives'), value: `${w.available.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Curamkan tanahnya dan semua yang dikerjakan pembangunnya tetap benar: batu tetap di tempatnya, lantai tetap satu bidang datar, tidak ada besi yang masuk ke rangka, tidak ada yang digergaji. Yang terjadi adalah tiang di sisi bawah menjadi lebih panjang daripada satu batang, dan tiang tidak disambung. Pada titik itu satu-satunya cara mendirikan rumah di petak lereng itu adalah memotong lerengnya — justru larangan yang menjadi alasan seluruh bangunan ini. Sembilan belas bangunan, sembilan belas aturan yang tidak dapat dilaksanakan, dan ini yang pertama di mana aturannya mengalahkan dirinya sendiri.',
      'Steepen the ground and everything the builders do stays correct: the stones still sit where they lie, the floor is still one level plane, no iron goes into the frame, nothing is sawn. What happens is that the downhill post grows longer than a single pole, and a post is not spliced. At that point the only way to put a house on that piece of hillside is to cut the hillside — the prohibition the whole building exists to keep. Nineteen buildings, nineteen rules that cannot be carried out, and this is the first where the rule defeats itself.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'sunda',
    slug: 'sunda',
    house: t('Imah Baduy', 'The Baduy imah'),
    people: t('Urang Kanekes (Baduy)', 'The Kanekes people (Baduy)'),
    place: t('Kanekes, Lebak, Banten', 'Kanekes, Lebak, Banten'),
    about: t(
      'Imah Kanekes adalah rumah panggung bambu dan kayu di perbukitan Banten selatan, dan yang membuatnya layak dibangun di sini adalah bentuk aturannya. Delapan belas pak lain dalam projek ini menuliskan apa sebuah bangunan itu; pikukuh Kanekes menuliskan apa yang tidak boleh dilakukan — dan satu larangan di antaranya punya akibat yang dapat diperiksa sebuah model: tanah tidak boleh digali atau diratakan. Maka batu diletakkan di tempat batu itu berada, tiap tiang berbeda panjangnya, dan lantainya tetap satu bidang datar di atas lereng yang tidak disentuh. Matahari pada model ini dihitung untuk Kanekes, 6,55° LS dan 106,25° BT.',
      'The Kanekes imah is a raised bamboo and timber house in the hills of southern Banten, and what makes it worth building here is the shape of its rules. The other eighteen packs in this project write down what a building is; the pikukuh of Kanekes write down what may not be done — and one of those prohibitions has a consequence a model can check: the ground may not be dug or levelled. So the stones are set where they lie, every post is a different length, and the floor stays one level plane over a hillside nobody has touched. The sun in this model is computed for Kanekes, 6.55° S and 106.25° E.',
    ),
    caution: t(
      'Sebagian besar dari yang dikatakan tradisi ini tidak dapat diperiksa oleh model mana pun. Balok yang digergaji dan yang dibelah berbentuk sama; rumah yang dipaku dan yang diikat tampak sama begitu rangkanya tertutup. Larangan-larangan itu dinyatakan dalam pak ini dan tidak diuji oleh apa pun, dan mengatakannya adalah bentuk jujur dari batasan itu. Selain itu: tata kampung Kanekes — letak rumah terhadap arah utara-selatan, letak leuit, dan tempat-tempat yang tidak boleh dimasuki — sama sekali tidak dimodelkan, padahal itulah yang paling menentukan bentuk permukimannya. Lereng yang digambar adalah bidang miring rata, sedangkan tanah sesungguhnya tidak rata. Dan tidak satu pun angka di sini berasal dari pengukuran.',
      'Most of what this tradition says cannot be checked by any model. A sawn beam and a split one are the same shape; a nailed house and a lashed one look identical once the frame is closed. Those prohibitions are stated in the pack and tested by nothing, and saying so is the honest form of that limit. Beyond it: the layout of a Kanekes village — where a house sits on the north–south axis, where the leuit stand, which ground may not be entered — is not modelled at all, though it is what most determines the shape of the settlement. The slope drawn here is an even plane, and real ground is not even. And not one figure here comes from a measurement.',
    ),
    orientation: t(
      'Rumah berdiri melintang lereng dengan mukanya menghadap turun, jadi arahnya ditetapkan oleh tanahnya — bukan oleh mata angin seperti tongkonan, bukan oleh lumbung di seberang halaman seperti rumah gadang, dan bukan oleh sungai seperti rumah betang. Tata kampung Kanekes sendiri punya aturan arah utara-selatan yang tidak dimodelkan di sini dan disebutkan dalam catatan. Model ini menaruh sisi bawah lereng di −X. Tetap tidak ada kendali untuk memutar bangunan.',
      'The house stands across the slope with its front looking downhill, so its direction is set by the ground — not by a compass bearing as on the tongkonan, not by a granary across the yard as on the rumah gadang, and not by a river as on the betang. Kanekes village layout has its own north–south rule, which is not modelled here and is named in the caution. This model puts the downhill side on −X. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'takik',
        name: t('Takik', 'Notched head'),
        gloss: t(
          'Kepala tiang ditakik untuk menerima balok lantai. Tiap tiang berbeda panjangnya, jadi takik ini dibuat pada ketinggian yang sama di atas tanah yang berbeda-beda.',
          'The post head is notched to take the floor beam. Every post is a different length, so this notch is cut at one height above ground that is at many.',
        ),
      },
      {
        kind: 'talian',
        name: t('Talian', 'Lashing'),
        gloss: t(
          'Ikatan serat: satu-satunya sambungan yang diizinkan pada rangka atap, karena besi tidak boleh masuk ke sini.',
          'A fibre lashing: the only joint permitted in the roof frame, because iron may not enter it.',
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
