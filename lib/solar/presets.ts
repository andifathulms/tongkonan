/**
 * The three date presets.
 *
 * Equinox, June solstice, and the local day the sun passes through the
 * zenith. The difference between them is the point: at 2.97° S the noon
 * shadow nearly vanishes on one of these days and the deep overhang is
 * visibly doing real work, which is not something a slider labelled
 * "sun angle" would ever show.
 *
 * The year is fixed rather than read from the clock, so the app is
 * deterministic and two readers comparing screens are comparing the same sun.
 */

import { RANTEPAO, localToUtcMs, solarNoonUtcMs, solarPosition, zeroShadowDays } from './position'
import type { Site } from './position'

export const SOLAR_YEAR = 2025

export interface DatePreset {
  readonly key: 'ekuinoks' | 'solstis-juni' | 'kulminasi'
  readonly month: number
  readonly day: number
  readonly labelId: string
  readonly labelEn: string
  readonly glossId: string
  readonly glossEn: string
  /** solar altitude at transit, degrees */
  readonly noonAltitude: number
}

function noonAltitude(site: Site, month: number, day: number): number {
  const noon = solarNoonUtcMs(localToUtcMs(site, SOLAR_YEAR, month, day, 12), site)
  return solarPosition(noon, site).altitude
}

export function datePresets(site: Site = RANTEPAO): readonly DatePreset[] {
  // The first zenith passage of the year; the second is its mirror.
  const zenith = zeroShadowDays(SOLAR_YEAR, site)[0]
  const zMonth = zenith ? zenith.getUTCMonth() + 1 : 3
  const zDay = zenith ? zenith.getUTCDate() : 20

  return [
    {
      key: 'ekuinoks',
      month: 3,
      day: 20,
      labelId: 'Ekuinoks Maret',
      labelEn: 'March equinox',
      glossId: 'Deklinasi matahari mendekati nol.',
      glossEn: "The sun's declination is near zero.",
      noonAltitude: noonAltitude(site, 3, 20),
    },
    {
      key: 'solstis-juni',
      month: 6,
      day: 21,
      labelId: 'Solstis Juni',
      labelEn: 'June solstice',
      glossId: 'Matahari paling jauh ke utara; bayangan tengah hari paling panjang di sini.',
      glossEn: 'The sun is at its northern extreme; the noon shadow here is at its longest.',
      noonAltitude: noonAltitude(site, 6, 21),
    },
    {
      key: 'kulminasi',
      month: zMonth,
      day: zDay,
      labelId: 'Hari tanpa bayangan',
      labelEn: 'Zero-shadow day',
      glossId: 'Matahari melewati titik zenit; tiang tegak nyaris tidak berbayang saat tengah hari.',
      glossEn: 'The sun passes through the zenith; a vertical post casts almost no shadow at noon.',
      noonAltitude: noonAltitude(site, zMonth, zDay),
    },
  ]
}

/** Wall-clock minutes past local midnight to a UTC instant on a preset day. */
export function presetInstant(preset: DatePreset, minutes: number, site: Site = RANTEPAO): number {
  return localToUtcMs(site, SOLAR_YEAR, preset.month, preset.day, 0, minutes)
}

export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = Math.round(minutes % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
