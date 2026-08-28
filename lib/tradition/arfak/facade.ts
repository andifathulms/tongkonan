/**
 * The rumah kaki seribu, as the registry sees it.
 *
 * The eleventh file of this shape and still no shared code between them.
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
  huniInfo,
  partClass,
  partSplit,
  provenanceSplit,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { legCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A long clan house on a dense forest of legs. */
const SHOWCASE: Rules = { huni: 'marga', ruang: 11, kaki: 10 }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const info = huniInfo(rules.huni)
  const braces = house.joints.filter(
    (j) => j.mortise.startsWith('kaki-') && j.tenon.startsWith('kaki-'),
  ).length

  const readout: readonly Readout[] = [
    { label: t('Kaki', 'Legs'), value: String(layout.legs.length) },
    { label: t('Diagonal', 'Diagonals'), value: String(braces) },
    { label: t('Sisi kaki', 'Leg section'), value: `${(layout.legSection * 1000).toFixed(0)} mm` },
    { label: t('Tinggi lantai', 'Floor height'), value: `${layout.floorY.toFixed(2)} m` },
    { label: t('Panjang', 'Length'), value: `${(layout.halfZ * 2).toFixed(2)} m` },
    { label: t('Sekat', 'Partitions'), value: layout.divided ? '2' : '0' },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'kaki',
      title: t('Mengapa kakinya begitu banyak dan begitu kecil', 'Why the legs are so many and so small'),
      body: t(
        'Karena tidak ada satu pun yang diminta kuat. Bebannya disebar ke ratusan batang, masing-masing cukup ringan untuk dipikul satu orang, dan tak satu pun diikat pada tetangganya atau ditanam ke tanah. Ketika tanah bergoyang, kaki-kaki itu ikut bergoyang dan bangunannya tetap berdiri. Rumah ini dinamai dari jumlah kakinya, bukan dari kekuatannya.',
        'Because not one of them is asked to be strong. The load is spread across hundreds of poles, each light enough for one person to carry, and none of them is tied to a neighbour or set into the earth. When the ground moves, the legs move with it and the building stays up. The house is named for how many legs it has, not for how strong they are.',
      ),
      value: t(String(layout.legs.length), String(layout.legs.length)),
      unit: t(`kaki, tiap satu ${(layout.legSection * 1000).toFixed(0)} mm`, `legs, each ${(layout.legSection * 1000).toFixed(0)} mm`),
    },
    {
      key: 'nias',
      title: t('Bandingkan dengan omo Nias', 'Set it beside the Nias omo'),
      body: t(
        'Keduanya menjawab persoalan yang sama: tanah yang bergerak. Omo menjawabnya dengan menyilang driwa pada setiap petak rangka bawahnya — persegi bergoyang, segitiga tidak. Rumah ini menjawabnya dengan tidak menyilangkan apa pun sama sekali dan membiarkan seluruhnya bergoyang. Tidak satu pun dari keduanya versi yang kurang dari yang lain, dan keduanya berdiri. Itulah sebabnya kedua rumah ini ada dalam projek yang sama: sebuah aturan tentang bumi tidak menentukan bentuk lebih ketat daripada aturan tentang manusia.',
        'Both answer the same problem: a ground that moves. The omo answers it by crossing driwa through every bay of its substructure — a rectangle racks, a triangle does not. This house answers it by bracing nothing at all and letting the whole thing sway. Neither is a lesser version of the other, and both stand. That is why both houses are in the same project: a rule about the earth constrains a form no more tightly than a rule about people does.',
      ),
      value: t('0', '0'),
      unit: t('diagonal, dari nol', 'diagonals, out of none'),
    },
    {
      key: 'ikat',
      title: t('Mengapa semuanya diikat', 'Why everything is lashed'),
      body: t(
        'Karena ikatan boleh bekerja sedikit tanpa patah. Tidak ada pasak dan tidak ada takik di rumah ini — satu-satunya rumah dalam projek ini yang hanya punya satu jenis sambungan — dan pilihan itu adalah gagasan bangunannya, dinyatakan pada skala satu sambungan. Sambungan yang kaku akan memaksa batang yang lentur berkelakuan seperti batang yang tegar.',
        'Because a lashing can work a little without breaking. There are no pegs and no notches in this house — the only house in this project with a single joint kind — and that choice is the building’s idea stated at the scale of one connection. A rigid joint would force a flexible pole to behave like a stiff one.',
      ),
      value: t(String(house.joints.length), String(house.joints.length)),
      unit: t('ikatan, dan hanya itu', 'lashings, and nothing else'),
    },
    {
      key: 'huni',
      title: t('Siapa yang tinggal di dalamnya', 'Who lives inside'),
      body: t(
        'Tidak terbaca dari luar. Rumah marga terbagi dua memanjang — sisi laki-laki, sisi perempuan, lorong di tengah — dan rumah keluarga tidak dibagi, tetapi keduanya bangunan yang sama dari luar. Seperti mbaru niang yang gendangnya tersembunyi, yang membedakan ada di dalam; dan tidak seperti saoraja, yang memasang kedudukannya di pelana supaya bisa dihitung dari jalan.',
        'Not from outside. A clan house divides lengthwise — men’s side, women’s side, a passage between — and a family house does not, but the two are the same building from the road. Like the mbaru niang and its hidden drum, the difference is inside; and unlike the saoraja, which puts its standing on the gable so it can be counted from the street.',
      ),
      value: t(info.name, info.name),
      unit: layout.divided ? t('terbagi dua', 'divided in two') : t('tidak dibagi', 'undivided'),
    },
    {
      key: 'lantai',
      title: t('Mengapa lantainya memantul', 'Why the floor springs'),
      body: t(
        'Karena semuanya lentur, dari kaki sampai kulit kayu di atasnya. Lantai kulit kayu setebal beberapa sentimeter di atas balok yang diikat di atas batang-batang yang miring dan tidak ditanam: tidak ada satu bagian pun dalam susunan itu yang bertugas menjadi kaku. Rumah lain dalam projek ini menghitung kekakuan; rumah ini menghindarinya.',
        'Because everything is flexible, from the legs up to the bark on top. A bark floor a few centimetres thick, over lashed bearers, over leaning poles that are not fixed into anything: not one part of that assembly has the job of being stiff. The other houses in this project count on stiffness; this one avoids it.',
      ),
      value: t(`${(DIMS.floorThickness.value * 1000).toFixed(0)}`, `${(DIMS.floorThickness.value * 1000).toFixed(0)}`),
      unit: t('mm kulit kayu', 'mm of bark'),
    },
  ]

  return {
    key: 'arfak',
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
      `${layout.legs.length} kaki · 0 diagonal · ${(layout.halfZ * 2).toFixed(1)} m`,
      `${layout.legs.length} legs · 0 diagonals · ${(layout.halfZ * 2).toFixed(1)} m`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = legCounterexample()
  const rows = (w: { section: number; legs: number }): readonly Readout[] => [
    { label: t('sisi kaki', 'leg section'), value: `${(w.section * 1000).toFixed(0)} mm` },
    { label: t('jumlah kaki', 'legs'), value: String(w.legs) },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Tebalkan kakinya dan rumahnya tetap berdiri, tetap tanpa diagonal, tetap di atas batang yang tidak ditanam, dan tetap ikut bergoyang saat tanah bergoyang. Semua pemeriksaan lain di pak ini terus lulus. Yang berhenti benar hanyalah bahwa kakinya kecil — dan begitu sebuah kaki menjadi tiang, alasan untuk memasang ratusan hilang, dan yang tersisa adalah rumah panggung biasa dengan kolong yang aneh ramainya. Sebelas rumah, sebelas aturan yang tidak dapat dilaksanakan. Yang ini gagal seperti sebuah batasan gagal: tidak ada yang patah, dan bendanya berhenti menjadi apa yang disebutkan namanya.',
      'Thicken the legs and the house still stands, still unbraced, still on poles that are not buried, still swaying when the ground does. Every other check in the pack goes on passing. The only thing that stops being true is that the legs are small — and once a leg is a post, the reason for having hundreds of them is gone, and what is left is an ordinary raised house with an oddly crowded understorey. Eleven houses, eleven rules that cannot be carried out. This one fails the way a definition fails: nothing breaks, and the thing has stopped being what its name says it is.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'arfak',
    slug: 'arfak',
    house: t('Rumah kaki seribu', 'Rumah kaki seribu'),
    people: t('Arfak', 'Arfak'),
    place: t('Pegunungan Arfak, Papua Barat', 'The Arfak Mountains, West Papua'),
    about: t(
      'Rumah kaki seribu adalah rumah orang Arfak di pegunungan Papua Barat: bangunan panggung berdinding kulit kayu yang berdiri di atas ratusan batang kecil. Batang-batang itu tidak diikat satu sama lain, tidak ditanam, dan masing-masing miring sendiri-sendiri — jadi ketika tanah bergoyang, seluruh rangka bawahnya ikut bergoyang. Yang membuatnya layak dibangun di sini adalah bahwa ia menjawab persoalan yang sama dengan omo Nias dengan cara yang berlawanan: yang satu menyegitigakan setiap petak supaya tidak bergoyang, yang lain tidak menyilangkan apa pun supaya boleh bergoyang. Matahari pada model ini dihitung untuk Pegunungan Arfak, 1,10° LS dan 133,90° BT.',
      'A rumah kaki seribu is the house of the Arfak people in the mountains of West Papua: a raised, bark-walled building standing on hundreds of small poles. Those poles are tied to nothing, buried in nothing, and each leans its own way — so when the ground moves, the whole substructure moves with it. What makes it worth building here is that it answers the same problem as the Nias omo in the opposite way: one triangulates every bay so it cannot sway, the other braces nothing so that it may. The sun in this model is computed for the Arfak Mountains, 1.10° S and 133.90° E.',
    ),
    caution: t(
      'Ini pak dengan sumber paling tipis dalam projek ini, dan itu perlu dinyatakan di depan. Omo Nias, uma Sumba dan saoraja Bugis masing-masing punya kepustakaan etnografi untuk disandari; rumah ini praktis hanya punya jilid survei Depdikbud yang bisa dijangkau penulis. Karena itu daftar kanonnya pendek dan hanya menyatakan yang dinyatakan sumber itu dengan jelas: bahwa kakinya sangat banyak dan kecil, bahwa kaki itu tidak ditanam, bahwa rumah marga terbagi dua. Seluruh angkanya — tanpa kecuali — adalah perkiraan penulis, termasuk jumlah kaki, yang justru merupakan hal paling dikenal tentang bangunan ini. Miringnya tiap kaki dihitung dari letaknya sendiri agar model tetap deterministik; di bangunan sebenarnya miring itu akibat pekerjaan tangan, bukan rumus. Papua Barat berisi banyak suku dengan bangunan yang berbeda-beda; ini rumah Arfak dan bukan “rumah Papua”.',
      'This is the thinnest-sourced pack in the project, and that belongs at the front. The Nias omo, the Sumbanese uma and the Bugis saoraja each have an ethnographic literature to lean on; this house has, in practice, only the Depdikbud survey volume the author could reach. So its canon list is short and states only what that source states plainly: that the legs are very many and small, that they are not buried, that a clan house divides in two. Every figure — without exception — is the author’s estimate, including the number of legs, which is the single best-known thing about this building. Each leg’s lean is computed from its own position so the model stays deterministic; on a real house that lean is the residue of handwork rather than a formula. West Papua holds many peoples with different buildings; this is an Arfak house and not a “Papuan house”.',
    ),
    orientation: t(
      'Rumah berdiri di lereng, dan yang menentukan arahnya adalah lerengnya: pintu di ujung yang menghadap turun, tempat tangga bisa disandarkan pada tanah yang lebih rendah. Ini satu-satunya rumah dalam projek ini yang arah hadapnya ditentukan oleh bentuk tanah dan bukan oleh gunung, sungai, laut, jalan, batu upacara atau mata angin. Sepuluh rumah sebelumnya menghadap sesuatu; yang ini menghadap ke bawah. Model ini menaruh pintu pada −Z. Tetap tidak ada kendali untuk memutar bangunan.',
      'The house stands on a slope, and it is the slope that fixes its bearing: the door is at the downhill end, where a log can be leaned against lower ground. It is the only house in this project whose orientation is set by the shape of the land rather than by a mountain, a river, the sea, a road, a ceremonial stone or a compass point. The ten before it face something; this one faces downhill. This model puts the door on −Z. There is still no control that turns the building.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
    stages: STAGES.map((s) => ({ stage: s.stage, title: s.title, gloss: t(s.glossId, s.glossEn) })),
    joints: [
      {
        kind: 'ikat',
        name: t('Ikat', 'Lashing'),
        gloss: t(
          'Satu-satunya jenis sambungan di rumah ini, dan itu bukan kekurangan melainkan pendirian: ikatan boleh bekerja sedikit tanpa patah, sementara pasak dan takik memaksa dua batang berkelakuan sebagai satu. Sepuluh rumah lain dalam projek ini punya dua atau tiga jenis; yang ini punya satu, dan satu itu yang benar untuknya.',
          'The only kind of joint in this house, and that is a position rather than a shortfall: a lashing can work a little without breaking, where a peg or a notch forces two members to behave as one. The other ten houses here have two or three kinds; this one has a single kind, and it is the right one for it.',
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
