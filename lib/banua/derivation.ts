/**
 * The arrow, written out.
 *
 * The app's whole claim is that three social facts determine a building. It
 * showed the facts and it showed the building and it never showed the step
 * between them, so "generated from its rules" was something a reader had to
 * take on faith — the one posture the provenance layer exists to refuse.
 *
 * This is that step, as data: for a given set of rules, the chain from the
 * three inputs to the dimensions a person can see, with every factor named,
 * its provenance attached, and a sentence saying why that arithmetic and not
 * some other.
 *
 * It is derived here rather than in a component for the usual reason — it is
 * geometry, it is testable, and a worked example that disagreed with the
 * model would be worse than no worked example. Every figure below is
 * recomputed from the same rule pack `resolveLayout` reads, and a test
 * asserts the two agree.
 */

import { DIMS, rankInfo } from './rules'
import type { DimKey } from './rules'
import { resolveLayout } from './frame'
import { slopeLength } from './geometry'
import type { Dim, Rules } from './types'

export interface Term {
  readonly label: string
  readonly labelEn: string
  readonly value: number
  /**
   * `ratio` is a multiplier — rank scale reads ×1.15. `share` is a position
   * along a run and reads 56%. Both are dimensionless and they are not the
   * same thing to a reader, which is why they are not the same unit.
   */
  readonly unit: 'm' | 'ratio' | 'share' | 'count'
  /** The declared dimension this came from, when it came from one. */
  readonly dim?: Dim
  /** True when the reader chose it. Nothing to cite: it is their number. */
  readonly input?: boolean
  /** True when it is the result of an earlier step rather than a rule. */
  readonly carried?: boolean
}

export interface Step {
  readonly key: string
  readonly label: string
  readonly labelEn: string
  readonly op: 'product' | 'sum' | 'quotient'
  readonly terms: readonly Term[]
  readonly result: number
  readonly unit: 'm' | 'count' | 'ratio' | 'share'
  /** Why this arithmetic and not some other. */
  readonly why: string
  readonly whyEn: string
}

const m = (key: DimKey, label: string, labelEn: string, scaled: number): Term => ({
  label,
  labelEn,
  value: scaled,
  unit: DIMS[key].unit === 'ratio' ? 'ratio' : DIMS[key].unit === 'count' ? 'count' : 'm',
  dim: DIMS[key],
})

/**
 * The chain, for one house.
 *
 * Six steps, chosen because each one ends in something a reader can point at:
 * how long the house is, how high the floor is carried, where the ridge sits,
 * how far the front prow reaches over, how far the roof oversails, and how
 * many courses of thatch it takes to cover one slope.
 */
export function derivation(rules: Rules): readonly Step[] {
  const rank = rankInfo(rules.rank)
  const s = rank.scale.value
  const layout = resolveLayout(rules)

  const scale: Term = {
    label: 'skala pangkat',
    labelEn: 'rank scale',
    value: s,
    unit: 'ratio',
    dim: rank.scale,
  }
  const bays: Term = {
    label: 'ruang',
    labelEn: 'bays',
    value: rules.bays,
    unit: 'count',
    input: true,
  }

  const plate: Term = {
    label: 'balok tumpuan',
    labelEn: 'wall plate',
    value: layout.plateY,
    unit: 'm',
    carried: true,
  }

  const exposure = DIMS.ijukCourseDepth.value * s * (1 - DIMS.ijukLap.value)
  const slope = slopeLength(layout.eaveHalfWidth, layout.ridgeY - layout.eaveY, {
    at: layout.breakFraction,
    drop: layout.kneeDrop,
  })

  return [
    {
      key: 'bodyLength',
      label: 'Panjang badan',
      labelEn: 'Body length',
      op: 'product',
      terms: [m('bayLength', 'panjang ruang', 'bay length', DIMS.bayLength.value), bays, scale],
      result: layout.bodyLength,
      unit: 'm',
      why: 'Satu ruang untuk tiap bilik, disusun berderet pada sumbu utara–selatan. Pangkat mengalikan setiap panjang; itulah satu-satunya yang dilakukannya.',
      whyEn:
        'One bay per room, laid end to end along the north–south axis. Rank multiplies every length, and that is the only thing it does.',
    },
    {
      key: 'plateY',
      label: 'Tinggi balok tumpuan',
      labelEn: 'Height of the wall plate',
      op: 'sum',
      terms: [
        m('padHeight', 'batu umpak', 'pad stone', DIMS.padHeight.value * s),
        m('kolongHeight', 'kolong', 'underfloor', DIMS.kolongHeight.value * s),
        m('floorFrameDepth', 'rangka lantai', 'floor frame', DIMS.floorFrameDepth.value * s),
        m('deckThickness', 'papan lantai', 'floor board', DIMS.deckThickness.value * s),
        m('wallHeight', 'dinding', 'wall', DIMS.wallHeight.value * s),
      ],
      result: layout.plateY,
      unit: 'm',
      why: 'Rumah bertumpuk dari tanah ke atas: batu, kolong, rangka, papan, lalu dinding. Balok tumpuan adalah puncak tumpukan itu, dan dari sanalah atap mulai dihitung.',
      whyEn:
        'The house stacks from the ground up: stone, underfloor, frame, boards, then wall. The wall plate is the top of that stack, and the roof is measured from it.',
    },
    {
      key: 'ridgeY',
      label: 'Tinggi punggung di tengah',
      labelEn: 'Ridge height at mid-span',
      op: 'sum',
      terms: [
        plate,
        m('ridgeRise', 'naik punggung', 'ridge rise', DIMS.ridgeRise.value * s),
        {
          ...m('ridgeSag', 'turun di tengah', 'sag at mid-span', DIMS.ridgeSag.value * s),
          value: -DIMS.ridgeSag.value * s,
        },
      ],
      result: layout.ridgeY,
      unit: 'm',
      why: 'Punggung naik dari balok tumpuan, lalu turun di tengah bentang. Keduanya aturan terpisah: yang naik menentukan tinggi atap, yang turun membuat garis punggungnya melengkung.',
      whyEn:
        'The ridge rises from the plate, then sags at mid-span. Those are two separate rules: the rise sets how tall the roof is, the sag is what makes the ridge line a curve.',
    },
    {
      key: 'frontProwY',
      label: 'Puncak haluan depan',
      labelEn: 'Front prow tip',
      op: 'sum',
      terms: [
        plate,
        m('ridgeRise', 'naik punggung', 'ridge rise', DIMS.ridgeRise.value * s),
        m('frontProwRise', 'naik haluan depan', 'front prow rise', DIMS.frontProwRise.value * s),
      ],
      result: layout.frontProwY,
      unit: 'm',
      why: 'Haluan depan naik dari balok tumpuan yang sama, melewati punggung. Ia selalu lebih tinggi daripada haluan belakang, dan itulah yang menyatakan mana muka rumah.',
      whyEn:
        'The front prow rises from the same plate, past the ridge. It always stands higher than the rear, and that is what tells anyone walking up which end is the front.',
    },
    {
      key: 'eaveHalfWidth',
      label: 'Jangkauan atap dari sumbu',
      labelEn: 'Roof reach from the axis',
      op: 'sum',
      terms: [
        {
          ...m('bodyWidth', 'setengah lebar badan', 'half the body width', layout.bodyWidth / 2),
          value: layout.bodyWidth / 2,
        },
        m('eaveOversail', 'julur atap', 'eave oversail', DIMS.eaveOversail.value * s),
      ],
      result: layout.eaveHalfWidth,
      unit: 'm',
      why: 'Atap harus melewati kaki tiang, bukan berhenti di dinding. Air yang jatuh dari atap securam ini harus mendarat di luar kaki tiang, dan julur inilah yang menaruhnya di sana.',
      whyEn:
        'The roof has to reach past the post feet, not stop at the wall. Water shed off a pitch this steep has to land clear of them, and the oversail is what puts it there.',
    },
    {
      key: 'breakFraction',
      label: 'Letak patahan atap',
      labelEn: 'Where the roof breaks',
      op: 'quotient',
      terms: [
        {
          label: 'muka tiang terluar',
          labelEn: 'outer post face',
          value: layout.bodyWidth / 2 - layout.postSection / 2,
          unit: 'm',
          carried: true,
        },
        {
          label: 'jangkauan atap',
          labelEn: 'roof reach',
          value: layout.eaveHalfWidth,
          unit: 'm',
          carried: true,
        },
      ],
      result: layout.breakFraction,
      unit: 'share',
      why: 'Atap berpatah tepat di garis tiang, karena di situlah dua jajar kasau bertemu dan bertumpu pada balok tumpuan. Di atas patahan atap curam; di bawahnya ia melandai keluar ke tepi. Patahan itulah kembang atapnya — dan letaknya bukan pilihan bentuk, melainkan akibat dari di mana tiang berdiri.',
      whyEn:
        'The roof breaks exactly on the post line, because that is where the two ranks of rafters meet and bear on the wall plate. Above the break it is steep; below it, it flares out to the eave. That break is the flare — and where it falls is not a shape decision but a consequence of where the posts stand.',
    },
    {
      key: 'ijukCourses',
      label: 'Lapis ijuk pada satu lereng',
      labelEn: 'Ijuk courses on one slope',
      op: 'quotient',
      terms: [
        {
          label: 'panjang lereng',
          labelEn: 'slope length',
          value: slope,
          unit: 'm',
          carried: true,
        },
        {
          label: 'tampak satu lapis',
          labelEn: 'exposed per course',
          value: exposure,
          unit: 'm',
          dim: DIMS.ijukCourseDepth,
        },
      ],
      result: layout.ijukCourses,
      unit: 'count',
      why: `Tiap lapis menutup tingginya sendiri dikurangi tindihan — ${DIMS.ijukCourseDepth.value.toFixed(2)} m dikurangi ${(DIMS.ijukLap.value * 100).toFixed(0)}% — jadi yang tampak hanya ${exposure.toFixed(2)} m. Hasil baginya dibulatkan ke atas: lapis terakhir yang pendek tidak apa-apa, sejalur rangka yang telanjang tidak boleh.`,
      whyEn: `Each course covers its own depth less the lap — ${DIMS.ijukCourseDepth.value.toFixed(2)} m less ${(DIMS.ijukLap.value * 100).toFixed(0)}% — so only ${exposure.toFixed(2)} m of it shows. The division is rounded up: a short last course is fine, a bare strip of frame is not.`,
    },
  ]
}
