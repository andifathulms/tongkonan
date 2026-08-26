/**
 * The tongkonan, as the registry sees it.
 *
 * One place where this tradition's own types meet the neutral ones, so that
 * nothing outside `lib/tradition/toraja/` has to know what a rank is. It is
 * the only file here allowed to import the registry's vocabulary, and the
 * registry is not allowed to import back.
 *
 * The prose in here is about *this building* — whose house it is, what the
 * façade says, why this check and not another. Copy that describes the
 * interface stays in `lib/i18n.ts`; copy that describes the house belongs
 * beside the house, or it drifts the moment there are two of them.
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
import { rulesFromQuery, rulesToQuery, CODEC } from './address'
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
  rankInfo,
} from './rules'
import { sceneModel } from './scene'
import { probeLabel, sensitivities } from './sensitivity'
import { ridgeCounterexample } from './counterexample'
import { STAGE_ORDER } from './types'
import type { Rules } from './types'

const t = (id: string, en: string): Text => ({ id, en })

/** A specific house with a history, rather than a neutral default. */
const SHOWCASE: Rules = { rank: 'layuk', bays: 4, horns: 14 }

function build(search: string): Built {
  const rules = rulesFromQuery(search)
  const { house, layout } = buildHouse(rules)
  const rank = rankInfo(rules.rank)
  const scene = sceneModel(house, layout)

  const readout: readonly Readout[] = [
    { label: t('Panjang badan', 'Body length'), value: `${layout.bodyLength.toFixed(2)} m` },
    { label: t('Lebar badan', 'Body width'), value: `${layout.bodyWidth.toFixed(2)} m` },
    { label: t('Tinggi kolong', 'Underfloor height'), value: `${layout.kolongHeight.toFixed(2)} m` },
    { label: t('Puncak haluan depan', 'Front prow tip'), value: `${layout.frontProwY.toFixed(2)} m` },
    { label: t('Julur atap', 'Eave oversail'), value: `${layout.eaveOversail.toFixed(2)} m` },
    { label: t('Lapis ijuk', 'Ijuk courses'), value: String(layout.ijukCourses) },
  ]

  const readings: readonly Reading[] = [
    {
      key: 'horns',
      title: t('Berapa kali rumah ini berduka', 'How many times this house has mourned'),
      body: t(
        'Hitung tanduk pada tulak somba. Tiap satu adalah satu upacara rambu solo yang pernah digelar keluarga ini — catatan, bukan hiasan.',
        'Count the horns on the tulak somba. Each one is a funeral this family has held — a record, not an ornament.',
      ),
      value: t(String(layout.hornCount), String(layout.hornCount)),
      unit: t('upacara', 'funerals'),
    },
    {
      key: 'rank',
      title: t('Kedudukan keluarga', 'Where the family stands'),
      body: t(
        'Skala badan rumah dan seberapa jauh ukiran diizinkan menutup bidangnya. Pangkat tidak diumumkan; ia terlihat dari ukuran dan hak menghias.',
        'The scale of the body, and how far carving is permitted to cover it. Rank is not announced; it is visible in size and in the right to decorate.',
      ),
      value: t(rank.name, rank.name),
      unit: t(
        `${(rank.elaboration.value * 100).toFixed(0)}% berukir`,
        `${(rank.elaboration.value * 100).toFixed(0)}% carved`,
      ),
    },
    {
      key: 'bays',
      title: t('Berapa ruang di dalamnya', 'How many rooms are inside'),
      body: t(
        'Hitung baris tiang di kolong. Tiap ruang menambah satu baris, jadi pembagian di dalam bisa dibaca dari luar tanpa masuk.',
        'Count the post rows in the underfloor. Each bay adds one, so the division inside can be read from outside without entering.',
      ),
      value: t(String(rules.bays), String(rules.bays)),
      unit: t(`${layout.postX.length} baris tiang`, `${layout.postX.length} post rows`),
    },
    {
      key: 'facing',
      title: t('Mana muka rumah', 'Which way the house faces'),
      body: t(
        'Haluan yang lebih tinggi adalah muka, dan muka selalu menghadap utara. Sekali diketahui, satu rumah cukup untuk menentukan arah seluruh halaman.',
        'The higher prow is the front, and the front always faces north. Once that is known, one house is enough to orient the whole courtyard.',
      ),
      value: t('Utara', 'North'),
      unit: t(
        `${layout.frontProwY.toFixed(1)} m ▲ ${layout.rearProwY.toFixed(1)} m`,
        `${layout.frontProwY.toFixed(1)} m ▲ ${layout.rearProwY.toFixed(1)} m`,
      ),
    },
    {
      key: 'carving',
      title: t('Di mana ukiran diletakkan', 'Where the carving goes'),
      body: t(
        'Pa’ssura menutup papan muka, bukan seluruh rumah. Yang digambar di sini hanya motif yang jelas-jelas geometris; motif yang penggunaannya terbatas tidak dirender.',
        'Pa’ssura covers the front board, not the whole house. Only the plainly geometric motifs are drawn here; motifs whose use is restricted are not rendered.',
      ),
      value: t("Indo' para", 'Front board'),
      unit: t('muka utara', 'north face'),
    },
  ]

  return {
    key: 'toraja',
    query: rulesToQuery(rules),
    house,
    scene,
    timeline: buildTimeline(house),
    checks: runInvariants(house, layout),
    dims: layout.dims,
    split: provenanceSplit(layout.dims),
    parts: partSplit(house.parts),
    classOf: (part) => partClass(part as Parameters<typeof partClass>[0]),
    headline: t(rank.name, rank.name),
    subhead: t(
      `${layout.bayNames.join(' · ')} — ${rules.horns} tanduk`,
      `${layout.bayNames.join(' · ')} — ${rules.horns} horns`,
    ),
    readout,
    readings,
  }
}

function counterexample(): CounterexampleView {
  const c = ridgeCounterexample()
  const rows = (w: { front: number; rear: number }): readonly Readout[] => [
    { label: t('haluan depan', 'front prow'), value: `${w.front.toFixed(2)} m` },
    { label: t('haluan belakang', 'rear prow'), value: `${w.rear.toFixed(2)} m` },
  ]
  return {
    dim: c.dim,
    actual: c.actual,
    value: c.value,
    sound: c.sound,
    broken: c.broken,
    witness: { sound: rows(c.witness.sound), broken: rows(c.witness.broken) },
    why: t(
      'Pemeriksaan ini menegakkan sesuatu yang dinyatakan sumber, bukan yang sudah dijamin oleh hitungannya sendiri: haluan depan lebih tinggi daripada haluan belakang. Naikkan haluan belakang melewati haluan depan dan rumah kehilangan kemampuan menyatakan mana mukanya.',
      'This check enforces something a source states rather than something the arithmetic already guarantees: the front prow stands higher than the rear. Raise the rear past the front and the house stops being able to say which end is its face.',
    ),
  }
}

export function tradition(site: Site): Tradition {
  return {
    key: 'toraja',
    slug: 'toraja',
    house: t('Tongkonan', 'Tongkonan'),
    people: t('Toraja', 'Toraja'),
    place: t('Tana Toraja, Sulawesi Selatan', 'Tana Toraja, South Sulawesi'),
    about: t(
      'Tongkonan adalah rumah keluarga orang Toraja, di dataran tinggi Sulawesi Selatan, Indonesia. Nama setiap bagian pada layar ini — tulak somba, a’riri, kale banua, ijuk, pa’ssura — adalah kata Toraja, dan dipakai sebagaimana adanya karena itulah nama benda-benda itu, bukan hiasan. Matahari pada model ini dihitung untuk Rantepao, 2,97° LS dan 119,90° BT.',
      'A tongkonan is the family house of the Toraja people, in the highlands of South Sulawesi, Indonesia. Every part named on this screen — tulak somba, a’riri, kale banua, ijuk, pa’ssura — is named in Toraja, and the words are used as they are because they are the names of the things rather than decoration. The sun in this model is computed for Rantepao, 2.97° S and 119.90° E.',
    ),
    caution: t(
      'Tidak ada satu bentuk tongkonan yang baku. Ragam antardaerah dan antargaris keturunan itu nyata, dan model ini satu rumah yang mungkin — bukan rumah itu.',
      'There is no single canonical tongkonan. Regional and lineage variation is real, and this model is one house the rules permit — not the house.',
    ),
    orientation: t(
      'Rumah membujur utara–selatan, muka (ulunna banua) menghadap utara. Arah ini aturan, bukan pilihan, jadi tidak ada kendali untuk memutar bangunan. Yang bisa diputar hanyalah kamera.',
      'The house lies north–south with the front, ulunna banua, facing north. That is a rule, not a choice, so there is no control that turns the building. Only the camera rotates.',
    ),
    site,
    params: CODEC.params,
    stageOrder: STAGE_ORDER,
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
