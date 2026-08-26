/**
 * All three drawings, the source table and a title block, on one sheet.
 *
 * The single views are for looking at something. This is for taking away: a
 * teacher printing for a studio wall, a reader wanting the thing on paper
 * next to the sources it came from. Everything needed to check the drawing is
 * on the same page as the drawing, which is the whole reason the sheet exists
 * — a measured drawing whose provenance lives on a website is a drawing whose
 * provenance is gone the moment it is printed.
 *
 * The dimension table is generated from the rule pack, never transcribed.
 * That is the condition on this file existing: a second copy of the source
 * table would drift from `rules.ts`, and a stale citation on a printed sheet
 * is worse than no sheet.
 *
 * Scale is 1:50, the same as the single views, and the sheet is sized to fit
 * that rather than the scale being bent to fit a paper size. Printed at 100%
 * a ruler on the page gives the metres in the model.
 */

import type { House, Layout } from '../tradition/toraja/types'
import { ALL_DIMS, DIMS, DIM_KEYS, provenanceSplit, sourceFor } from '../tradition/toraja/rules'
import { dimsForLayout } from '../tradition/toraja/rules'
import {
  MARGIN,
  PIGMENT,
  SCALE,
  escapeXml,
  pathsFor,
  viewLines,
} from './orthographic'
import type { DrawingOptions, Projection } from './orthographic'

const VIEW_NAMES: Record<Projection, [string, string]> = {
  denah: ['Denah', 'Plan'],
  tampak: ['Tampak muka (utara)', 'Front elevation (north)'],
  potongan: ['Potongan memanjang', 'Long section'],
}

/** Type sizes in millimetres on the printed sheet. */
const TYPE = { title: 6.5, heading: 3.6, label: 3.2, row: 2.7, note: 3.2 }
const GAP = 14
const COLUMN = 132
const ROW_HEIGHT = 7.2

/**
 * Millimetres per character, for fitting text to a column.
 *
 * A monospace advance is close to 0.6 em, but this sheet is drawn once and
 * read in whatever renderer opens it, and a substituted face is usually
 * wider. 0.72 is the conservative figure: it wastes a little of the column
 * and never lets a citation run off the edge of the paper.
 */
const ADVANCE = 0.72

function fitChars(width: number, size: number): number {
  return Math.floor(width / (size * ADVANCE))
}

export function drawSheet(house: House, layout: Layout, options: DrawingOptions): string {
  const id = options.locale === 'id'
  const denah = viewLines(house, layout, 'denah')
  const tampak = viewLines(house, layout, 'tampak')
  const potongan = viewLines(house, layout, 'potongan')
  if ([denah, tampak, potongan].some((d) => d.lines.length === 0)) return ''

  /*
   * Drafting convention decides the arrangement, not packing efficiency: the
   * front elevation sits directly above the plan and shares its transverse
   * alignment, so a feature in one is found in the other by dropping straight
   * down the page. The long section runs along the other axis and goes beside
   * them. The dimension table is the far right column.
   */
  const CAPTION = 6
  const colA = Math.max(denah.width, tampak.width)
  const colB = Math.max(potongan.width, COLUMN * 2 + GAP)

  const headHeight = 22
  const footHeight = 26
  const top = MARGIN + headHeight

  const colAHeight = tampak.height + CAPTION + GAP + denah.height + CAPTION
  const tableTop = top + potongan.height + CAPTION + GAP + 4
  const tableHeight = tableExtent(colB)
  const colBHeight = tableTop - top + tableHeight

  const width = MARGIN * 2 + colA + GAP + colB
  const height = MARGIN * 2 + headHeight + Math.max(colAHeight, colBHeight) + footHeight

  const parts: string[] = []

  const place = (drawn: typeof denah, view: Projection, x: number, y: number) => {
    parts.push(text(x, y, TYPE.heading, PIGMENT.muted, VIEW_NAMES[view][id ? 0 : 1].toUpperCase()))
    parts.push(pathsFor(drawn.lines, x - drawn.minX, y + CAPTION - drawn.minY))
  }

  const planTop = top + tampak.height + CAPTION + GAP
  place(tampak, 'tampak', MARGIN, top)
  place(denah, 'denah', MARGIN, planTop)
  place(potongan, 'potongan', MARGIN + colA + GAP, top)

  // North on the plan only: it is the view where north is a direction on the
  // page rather than a fact stated in the title. Set at the plan's top-right,
  // inside the drawing it belongs to.
  parts.push(northPoint(MARGIN + colA - 10, planTop + 22, id))

  parts.push(table(options, MARGIN + colA + GAP, tableTop, colB))
  parts.push(head(house, options, width))
  parts.push(foot(house, layout, options, width, height))

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(1)}mm" height="${height.toFixed(1)}mm" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}">`,
    `<rect width="100%" height="100%" fill="${PIGMENT.film}"/>`,
    ...parts,
    '</svg>',
  ].join('\n')
}

/** File name. No timestamp: the sheet is a function of the rules. */
export function sheetFileName(house: House): string {
  const r = house.rules
  return `tongkonan-lembar-${r.rank}-${r.bays}ruang-${r.horns}tanduk.svg`
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

function head(house: House, options: DrawingOptions, width: number): string {
  const id = options.locale === 'id'
  const r = house.rules
  const rules = `${r.rank} · ${r.bays} ${id ? 'ruang' : 'bays'} · ${r.horns} ${id ? 'tanduk' : 'horns'}`
  return [
    text(MARGIN, MARGIN + 4, TYPE.title, PIGMENT.ink, 'TONGKONAN'),
    text(
      MARGIN,
      MARGIN + 11,
      TYPE.label,
      PIGMENT.muted,
      id
        ? 'Rumah yang dihitung dari aturannya, bukan digambar.'
        : 'A house generated from its rules, not drawn.',
    ),
    text(width - MARGIN, MARGIN + 4, TYPE.heading, PIGMENT.ink, rules, 'end'),
    text(width - MARGIN, MARGIN + 11, TYPE.label, PIGMENT.muted, '1:50', 'end'),
    rule(MARGIN, MARGIN + 15, width - MARGIN, 0.5),
  ].join('\n')
}

/**
 * The dimension table, generated from the rule pack.
 *
 * Never transcribed. Every row is `DIMS[key]` read at draw time, so a value
 * or a class changing in `rules.ts` changes the printed sheet and cannot be
 * left behind.
 *
 * Two columns, set under the long section, because that is the part of the
 * sheet the drawings leave empty — and because a table is easier to read in
 * a column narrow enough to scan than in one that runs the width of a wall.
 */
function tableRows(): number {
  return Math.ceil(DIM_KEYS.length / 2)
}

/** How tall the table will be, needed before it is drawn. */
function tableExtent(width: number): number {
  const bib = citedSources().length
  return 8 + tableRows() * ROW_HEIGHT + 14 + bib * ROW_HEIGHT
}

function table(options: DrawingOptions, x: number, y0: number, width: number): string {
  const id = options.locale === 'id'
  const out: string[] = []
  const colWidth = (width - GAP) / 2
  const noteChars = fitChars(colWidth, TYPE.row)
  const rows = tableRows()

  out.push(
    text(x, y0, TYPE.heading, PIGMENT.muted, (id ? 'Daftar ukuran' : 'The dimensions').toUpperCase()),
  )

  DIM_KEYS.forEach((key, i) => {
    const dim = DIMS[key]
    const column = i < rows ? 0 : 1
    const cx = x + column * (colWidth + GAP)
    const y = y0 + 8 + (i - column * rows) * ROW_HEIGHT

    out.push(rule(cx, y - 4, cx + colWidth, 0.2))
    out.push(text(cx, y, TYPE.row, PIGMENT.ink, key))
    out.push(swatch(cx + colWidth - 3, y - 2.2, dim.class))
    out.push(
      text(cx + colWidth - 5, y, TYPE.row, PIGMENT.ink, formatValue(dim), 'end'),
    )
    out.push(
      text(cx, y + 3.4, TYPE.row, PIGMENT.muted, truncate(id ? dim.note : dim.noteEn, noteChars)),
    )
  })

  // The bibliography, so a citation on the sheet resolves on the sheet.
  let y = y0 + 8 + rows * ROW_HEIGHT + 14
  out.push(text(x, y - 6, TYPE.heading, PIGMENT.muted, (id ? 'Pustaka' : 'Sources').toUpperCase()))
  // The key column is set by the longest key rather than by eye:
  // depdikbud-sulsel is sixteen characters and ran into its own citation.
  const keyColumn =
    Math.max(...citedSources().map((src) => src.key.length)) * TYPE.row * ADVANCE + 4
  const bibChars = fitChars(width - keyColumn, TYPE.row)
  for (const source of citedSources()) {
    out.push(rule(x, y - 4, x + width, 0.2))
    out.push(text(x, y, TYPE.row, PIGMENT.ink, source.key))
    out.push(text(x + keyColumn, y, TYPE.row, PIGMENT.muted, truncate(source.citation, bibChars)))
    y += ROW_HEIGHT
  }

  return out.join('\n')
}

function foot(
  house: House,
  layout: Layout,
  options: DrawingOptions,
  width: number,
  height: number,
): string {
  const id = options.locale === 'id'
  const split = provenanceSplit(dimsForLayout(layout))
  const pct = Math.round((split.interpolated / Math.max(1, split.total)) * 100)
  const top = height - MARGIN - 12

  const note = id
    ? `${pct}% dari ukuran pada lembar ini adalah perkiraan penulis, bukan hasil ukur. Setiap ukuran dan kutipannya tercantum pada daftar di atas.`
    : `${pct}% of the dimensions on this sheet are the author's own, not measured. Every dimension and its citation is in the table above.`

  const barLength = 5 * SCALE
  const barX = width - MARGIN - barLength

  return [
    rule(MARGIN, top, width - MARGIN, 0.5),
    text(MARGIN, top + 6, TYPE.note, PIGMENT.rara, note),
    `<path d="M${barX.toFixed(2)} ${(top + 3).toFixed(2)} v3 M${barX.toFixed(2)} ${(top + 4.5).toFixed(2)} h${barLength.toFixed(2)} M${(barX + barLength).toFixed(2)} ${(top + 3).toFixed(2)} v3" stroke="${PIGMENT.ink}" stroke-width="0.4" fill="none"/>`,
    text(width - MARGIN, top + 11, TYPE.row, PIGMENT.muted, '5 m', 'end'),
    text(
      MARGIN,
      top + 11,
      TYPE.row,
      PIGMENT.muted,
      id
        ? `Lembar ${Math.round(width)} × ${Math.round(height)} mm. Cetak 100% untuk skala 1:50.`
        : `Sheet ${Math.round(width)} × ${Math.round(height)} mm. Print at 100% for a true 1:50.`,
    ),
  ].join('\n')
}

/**
 * North, on the plan.
 *
 * Orientation is a rule rather than a choice, so the arrow is not a drafting
 * courtesy here — it is the statement that the front faces north, made where
 * the front is visible.
 */
function northPoint(x: number, y: number, id: boolean): string {
  const r = 5
  return [
    `<path d="M${x.toFixed(2)} ${(y + r).toFixed(2)} L${x.toFixed(2)} ${(y - r).toFixed(2)} M${(x - 2).toFixed(2)} ${(y - r + 3).toFixed(2)} L${x.toFixed(2)} ${(y - r).toFixed(2)} L${(x + 2).toFixed(2)} ${(y - r + 3).toFixed(2)}" stroke="${PIGMENT.ink}" stroke-width="0.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    text(x, y - r - 2, TYPE.row, PIGMENT.ink, id ? 'U' : 'N', 'middle'),
  ].join('\n')
}

/* ── Small helpers ────────────────────────────────────────────────────── */

function text(
  x: number,
  y: number,
  size: number,
  colour: string,
  content: string,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace" font-size="${size}" fill="${colour}" text-anchor="${anchor}">${escapeXml(content)}</text>`
}

function rule(x1: number, y: number, x2: number, w: number): string {
  return `<line x1="${x1.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${PIGMENT.ink}" stroke-width="${w}" opacity="0.35"/>`
}

function swatch(x: number, y: number, cls: string): string {
  const colour =
    cls === 'measured' ? PIGMENT.ink : cls === 'canon' ? PIGMENT.riri : PIGMENT.rara
  const stroke = cls === 'canon' ? '#7A5510' : colour
  return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="2.4" height="2.4" fill="${colour}" stroke="${stroke}" stroke-width="0.3"/>`
}

function classNameId(cls: string): string {
  return cls === 'measured' ? 'terukur' : cls === 'canon' ? 'kanon' : 'perkiraan'
}

function formatValue(dim: (typeof DIMS)[keyof typeof DIMS]): string {
  if (dim.unit === 'm') return `${dim.value.toFixed(2)} m`
  if (dim.unit === 'deg') return `${dim.value.toFixed(0)}°`
  if (dim.unit === 'ratio') return dim.value.toFixed(2)
  return String(dim.value)
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`
}

/**
 * Only the sources a dimension on this sheet actually cites, so the
 * bibliography is the sheet's and not the project's.
 */
function citedSources() {
  const keys = new Set(ALL_DIMS.map((d) => d.source))
  keys.delete('none')
  return [...keys].map(sourceFor)
}
