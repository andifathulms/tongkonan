/**
 * Solar position, NOAA.
 *
 * The light in this app is computed, not art-directed. That matters
 * architecturally: at about 3° south the sun passes within a few degrees of
 * the zenith, the noon shadow nearly vanishes, and the deep overhang is
 * doing real work. Art-directing the light would quietly remove the argument.
 *
 * Pure and Node-runnable, like the generator. Nothing here reads the clock —
 * every function takes the instant it is asked about.
 */

const DEG = Math.PI / 180
const RAD = 180 / Math.PI

export interface Site {
  readonly name: string
  /** degrees, north positive */
  readonly latitude: number
  /** degrees, east positive */
  readonly longitude: number
  /** hours ahead of UTC; WITA is +8 and does not observe daylight saving */
  readonly tzOffsetHours: number
  readonly tzName: string
}

export const RANTEPAO: Site = {
  name: 'Rantepao',
  latitude: -2.97,
  longitude: 119.9,
  tzOffsetHours: 8,
  tzName: 'WITA',
}

/* ── Time ─────────────────────────────────────────────────────────────── */

/** Julian day from a UTC instant in milliseconds. */
export function julianDay(utcMs: number): number {
  return utcMs / 86400000 + 2440587.5
}

/** Julian centuries since J2000.0. */
export function julianCentury(utcMs: number): number {
  return (julianDay(utcMs) - 2451545) / 36525
}

/**
 * A local wall-clock time at a site, as a UTC instant. Given rather than
 * derived, because the whole engine has to stay deterministic.
 */
export function localToUtcMs(
  site: Site,
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes = 0,
): number {
  return Date.UTC(year, month - 1, day, hours, minutes) - site.tzOffsetHours * 3600000
}

/* ── The sun ──────────────────────────────────────────────────────────── */

export interface SolarPosition {
  /** degrees above the horizon, corrected for atmospheric refraction */
  readonly altitude: number
  /** degrees clockwise from true north */
  readonly azimuth: number
  readonly declination: number
  /** minutes; the difference between apparent and mean solar time */
  readonly equationOfTime: number
  /** local wall-clock minutes past midnight at which the sun transits */
  readonly solarNoonMinutes: number
  readonly hourAngle: number
}

export function solarPosition(utcMs: number, site: Site = RANTEPAO): SolarPosition {
  const t = julianCentury(utcMs)

  const meanLong = mod360(280.46646 + t * (36000.76983 + t * 0.0003032))
  const meanAnom = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)

  const centre =
    Math.sin(meanAnom * DEG) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * meanAnom * DEG) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * meanAnom * DEG) * 0.000289

  const trueLong = meanLong + centre
  const omega = 125.04 - 1934.136 * t
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG)

  const meanObliq = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60
  const obliqCorr = meanObliq + 0.00256 * Math.cos(omega * DEG)

  const declination =
    Math.asin(Math.sin(obliqCorr * DEG) * Math.sin(appLong * DEG)) * RAD

  const y = Math.tan((obliqCorr / 2) * DEG) ** 2
  const equationOfTime =
    4 *
    RAD *
    (y * Math.sin(2 * meanLong * DEG) -
      2 * eccentricity * Math.sin(meanAnom * DEG) +
      4 * eccentricity * y * Math.sin(meanAnom * DEG) * Math.cos(2 * meanLong * DEG) -
      0.5 * y * y * Math.sin(4 * meanLong * DEG) -
      1.25 * eccentricity * eccentricity * Math.sin(2 * meanAnom * DEG))

  // Local wall-clock minutes past midnight for this instant at this site.
  const localMs = utcMs + site.tzOffsetHours * 3600000
  const localMinutes = ((localMs % 86400000) + 86400000) % 86400000 / 60000

  const trueSolarTime = mod(
    localMinutes + equationOfTime + 4 * site.longitude - 60 * site.tzOffsetHours,
    1440,
  )
  const hourAngle = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180

  const lat = site.latitude * DEG
  const dec = declination * DEG
  const ha = hourAngle * DEG
  const cosZenith = clamp(
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha),
    -1,
    1,
  )
  const zenith = Math.acos(cosZenith) * RAD
  const elevation = 90 - zenith
  const altitude = elevation + refraction(elevation)

  // NOAA's azimuth, clockwise from true north.
  const denom = Math.cos(lat) * Math.sin(zenith * DEG)
  let azimuth: number
  if (Math.abs(denom) < 1e-9) {
    // Directly overhead or on the horizon at the pole: azimuth is undefined,
    // so report due north rather than dividing by nothing.
    azimuth = 180
  } else {
    const inner = clamp((Math.sin(lat) * Math.cos(zenith * DEG) - Math.sin(dec)) / denom, -1, 1)
    const a = Math.acos(inner) * RAD
    azimuth = hourAngle > 0 ? mod(a + 180, 360) : mod(540 - a, 360)
  }

  const solarNoonMinutes = 720 - 4 * site.longitude - equationOfTime + 60 * site.tzOffsetHours

  return { altitude, azimuth, declination, equationOfTime, solarNoonMinutes, hourAngle }
}

/**
 * Direction to the sun in scene coordinates.
 *
 * X runs front (north) to rear (south), so north is −X. Y is up. That makes
 * east −Z. The orientation is baked in because it is a rule about the
 * building, not a parameter, and this is where the rule meets the light.
 */
export function sunDirection(pos: SolarPosition): [number, number, number] {
  const alt = pos.altitude * DEG
  const az = pos.azimuth * DEG
  const horizontal = Math.cos(alt)
  return [-Math.cos(az) * horizontal, Math.sin(alt), -Math.sin(az) * horizontal]
}

/* ── Zero-shadow days ─────────────────────────────────────────────────── */

/**
 * The dates when the sun passes through the local zenith.
 *
 * At 2.97° S this happens twice a year, and on those days a vertical post
 * casts no shadow at noon. Searched rather than tabulated so the same engine
 * answers for any latitude within the tropics.
 */
export function zeroShadowDays(year: number, site: Site = RANTEPAO): readonly Date[] {
  if (Math.abs(site.latitude) > 23.5) return []
  const found: Date[] = []
  let previous: number | null = null

  for (let day = 0; day < 366; day++) {
    const utcMs = localToUtcMs(site, year, 1, 1 + day, 12) // near enough to transit
    const noon = solarNoonUtcMs(utcMs, site)
    const diff = solarPosition(noon, site).declination - site.latitude
    if (previous !== null && previous * diff <= 0) {
      // The declination crossed the latitude between yesterday and today.
      const pick = Math.abs(previous) <= Math.abs(diff) ? day - 1 : day
      found.push(new Date(localToUtcMs(site, year, 1, 1 + pick, 12)))
    }
    previous = diff
  }
  return found
}

/** The UTC instant of solar transit on the local day containing `utcMs`. */
export function solarNoonUtcMs(utcMs: number, site: Site = RANTEPAO): number {
  const localMs = utcMs + site.tzOffsetHours * 3600000
  const localMidnight = Math.floor(localMs / 86400000) * 86400000
  const minutes = solarPosition(utcMs, site).solarNoonMinutes
  return localMidnight + minutes * 60000 - site.tzOffsetHours * 3600000
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Atmospheric refraction, in degrees. Near the horizon the sun appears higher
 * than it is; the correction matters for where the shadow falls at the ends
 * of the day, which is most of what the courtyard sweep shows.
 */
function refraction(elevationDeg: number): number {
  if (elevationDeg > 85) return 0
  const te = Math.tan(elevationDeg * DEG)
  let seconds: number
  if (elevationDeg > 5) {
    seconds = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5
  } else if (elevationDeg > -0.575) {
    seconds =
      1735 +
      elevationDeg * (-518.2 + elevationDeg * (103.4 + elevationDeg * (-12.79 + elevationDeg * 0.711)))
  } else {
    seconds = -20.772 / te
  }
  return seconds / 3600
}

const mod = (v: number, m: number) => ((v % m) + m) % m
const mod360 = (v: number) => mod(v, 360)
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
