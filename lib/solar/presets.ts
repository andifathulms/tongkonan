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
  /*
   * The first zenith passage of the year; the second is its mirror.
   *
   * There may not be one. The first two houses sit within three degrees of the
   * equator and the sun goes overhead twice a year at both; the third is at
   * 7.8° south, where it never does. The third preset used to fall back to
   * March the twentieth and keep the label "zero-shadow day", which would have
   * printed a date on which nothing happens and called it the thing the whole
   * preset exists to show. So the fallback is the December solstice — the day
   * the sun does get highest here — and it says plainly that the zenith is
   * never reached. A tool that computes the light owes the reader the case
   * where the answer is that there isn't one.
   */
  const zenith = zeroShadowDays(SOLAR_YEAR, site)[0]

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
    zenith
      ? {
          key: 'kulminasi' as const,
          month: zenith.getUTCMonth() + 1,
          day: zenith.getUTCDate(),
          labelId: 'Hari tanpa bayangan',
          labelEn: 'Zero-shadow day',
          glossId: 'Matahari melewati titik zenit; tiang tegak nyaris tidak berbayang saat tengah hari.',
          glossEn: 'The sun passes through the zenith; a vertical post casts almost no shadow at noon.',
          noonAltitude: noonAltitude(site, zenith.getUTCMonth() + 1, zenith.getUTCDate()),
        }
      : {
          key: 'kulminasi' as const,
          month: 12,
          day: 21,
          labelId: 'Solstis Desember',
          labelEn: 'December solstice',
          glossId: `Matahari paling tinggi dalam setahun di sini — dan tetap tidak sampai ke zenit. Pada ${site.latitude.toFixed(1)}° LS matahari tidak pernah tepat di atas kepala, jadi tidak ada hari tanpa bayangan untuk ditawarkan.`,
          glossEn: `The sun at its highest here for the year — and still short of the zenith. At ${Math.abs(site.latitude).toFixed(1)}° south it never passes directly overhead, so there is no zero-shadow day to offer.`,
          noonAltitude: noonAltitude(site, 12, 21),
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
