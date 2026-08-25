import { describe, expect, it } from 'vitest'
import {
  RANTEPAO,
  localToUtcMs,
  solarNoonUtcMs,
  solarPosition,
  sunDirection,
  zeroShadowDays,
} from '@/lib/solar/position'

/**
 * The engine is validated against known almanac values, never against itself.
 * Each of these is a fact about the sun that was true before this code
 * existed, so a plausible-looking regression cannot quietly satisfy them.
 */
describe('solar position at Rantepao', () => {
  it('puts declination near zero at the March equinox', () => {
    const utc = localToUtcMs(RANTEPAO, 2025, 3, 20, 12)
    expect(Math.abs(solarPosition(utc).declination)).toBeLessThan(0.5)
  })

  it('reaches its June extreme of declination near +23.44°', () => {
    const utc = localToUtcMs(RANTEPAO, 2025, 6, 21, 12)
    expect(solarPosition(utc).declination).toBeGreaterThan(23.3)
    expect(solarPosition(utc).declination).toBeLessThan(23.5)
  })

  it('reaches its December extreme near -23.44°', () => {
    const utc = localToUtcMs(RANTEPAO, 2025, 12, 21, 12)
    expect(solarPosition(utc).declination).toBeLessThan(-23.3)
    expect(solarPosition(utc).declination).toBeGreaterThan(-23.5)
  })

  it('transits within minutes of 12:00 WITA', () => {
    // Rantepao sits at 119.9° E, almost exactly on the 120° WITA meridian, so
    // the only real offset is the equation of time.
    for (const month of [1, 3, 6, 9, 11]) {
      const utc = localToUtcMs(RANTEPAO, 2025, month, 15, 12)
      const noon = solarPosition(utc).solarNoonMinutes
      expect(Math.abs(noon - 720)).toBeLessThan(20)
    }
  })

  it('stands within a few degrees of the zenith at equinox noon', () => {
    // At 2.97° S with declination ~0, the noon zenith angle is ~3°. This is
    // the whole architectural argument: the noon shadow nearly vanishes.
    const utc = localToUtcMs(RANTEPAO, 2025, 3, 20, 12)
    const noon = solarNoonUtcMs(utc)
    const alt = solarPosition(noon).altitude
    expect(alt).toBeGreaterThan(86)
    expect(alt).toBeLessThan(90.1)
  })

  it('puts the sun below the horizon at midnight', () => {
    const utc = localToUtcMs(RANTEPAO, 2025, 3, 20, 0)
    expect(solarPosition(utc).altitude).toBeLessThan(0)
  })

  it('rises in the east and sets in the west', () => {
    const morning = solarPosition(localToUtcMs(RANTEPAO, 2025, 3, 20, 7))
    const evening = solarPosition(localToUtcMs(RANTEPAO, 2025, 3, 20, 17))
    // Azimuth is clockwise from north: ~90° is east, ~270° is west.
    expect(Math.abs(morning.azimuth - 90)).toBeLessThan(15)
    expect(Math.abs(evening.azimuth - 270)).toBeLessThan(15)
  })

  it('keeps the equation of time inside its known ±17 minute range', () => {
    for (let d = 0; d < 365; d += 5) {
      const eot = solarPosition(localToUtcMs(RANTEPAO, 2025, 1, 1 + d, 12)).equationOfTime
      expect(Math.abs(eot)).toBeLessThan(17)
    }
  })

  it('finds two zero-shadow days, straddling the December solstice', () => {
    const days = zeroShadowDays(2025)
    expect(days.length).toBe(2)
    // Declination reaches -2.97° on the way south and again on the way back,
    // so the pair sits either side of the December solstice.
    const months = days.map((d) => d.getUTCMonth() + 1).sort((a, b) => a - b)
    expect(months[0]).toBeGreaterThanOrEqual(2)
    expect(months[0]).toBeLessThanOrEqual(3)
    expect(months[1]).toBeGreaterThanOrEqual(9)
    expect(months[1]).toBeLessThanOrEqual(11)
  })

  it('points the scene vector north at solar noon here', () => {
    // Southern hemisphere, declination 0: the sun transits due north, and
    // north is -X in the scene.
    const noon = solarNoonUtcMs(localToUtcMs(RANTEPAO, 2025, 3, 20, 12))
    const [x, y, z] = sunDirection(solarPosition(noon))
    expect(y).toBeGreaterThan(0.99)
    expect(x).toBeLessThan(0)
    expect(Math.abs(z)).toBeLessThan(0.1)
  })
})
