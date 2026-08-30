import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LocaleSwitch } from '@/components/LocaleSwitch'
import { ElevationGlyph, ElevationMark, ElevationShelf } from '@/components/Elevation'
import { COASTLINE, FRAME } from '@/lib/geo/nusantara'
import { SplitBar, SplitLegend } from '@/components/split'
import { silhouette } from '@/lib/core/silhouette'
import type { Silhouette } from '@/lib/core/silhouette'
import {
  COPY,
  DEFAULT_LOCALE,
  LOCALES,
  homeHref,
  houseHref,
  isLocale,
  landingMetadata,
  pick,
  plateNo,
} from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { TRADITIONS } from '@/lib/tradition/registry'
import type { Tradition } from '@/lib/tradition/registry'

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE
  return landingMetadata(locale, TRADITIONS.map((t) => t.house[locale]).join(' · '))
}

/**
 * The collection's front door.
 *
 * While there was one house the site could open inside it; with several, the
 * first page has to be the shelf and not one of the books. Everything here is
 * read from the registry, so a fifth house appears on the shelf, on the map
 * and in the index without this file changing — the copy is written without
 * counts for the same reason.
 *
 * The houses are built here, at export time, because everything honest on
 * this page — the silhouettes on the shelf, the interpolated share on each
 * card — is a property of a built house, not of a description of one. The
 * shelf is the page's largest thing on purpose: the claim is that the model
 * is computed, and the computed model is the only picture that can back it.
 */
export default function Landing({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale
  const built = TRADITIONS.map((t) => {
    const b = t.build(t.defaultQuery)
    return { t, b, s: silhouette(b.house, b.scene.ridgeAxis ?? 0) }
  })
  /*
   * The frame every index card draws inside: the extents of the largest
   * house. One frame keeps the cards at one scale, the same claim the shelf
   * makes — the mbaru niang's card is mostly tower and the joglo's is mostly
   * eave, and that difference is content.
   */
  const frame = {
    w: Math.max(...built.map(({ s }) => s.max[0] - s.min[0])),
    h: Math.max(...built.map(({ s }) => s.max[1])),
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 pb-10">
      {/*
        The title bar, kept while the page scrolls: the wordmark, the three
        section anchors, and the way into the other language. It floats on
        the veil token, the same surface every panel over the model uses, so
        "a bar over content" means one thing across the site.
      */}
      <header className="sticky top-0 z-20 -mx-6 flex min-h-control items-center justify-between gap-3 border-b border-hairline bg-veil px-6 py-2 backdrop-blur-veil">
        <p className="micro text-bolu">{pick(COPY.appName, locale)}</p>
        <nav className="micro hidden items-center gap-5 sm:flex">
          <a href="#cerita" className="transition-colors duration-state hover:text-bolu">
            {pick(COPY.landing.storyHeading, locale)}
          </a>
          <a href="#tapak" className="transition-colors duration-state hover:text-bolu">
            {pick(COPY.landing.sitesHeading, locale)}
          </a>
          <a href="#rumah" className="transition-colors duration-state hover:text-bolu">
            {pick(COPY.landing.housesHeading, locale)}
          </a>
        </nav>
        <LocaleSwitch
          locale={locale}
          targets={
            Object.fromEntries(LOCALES.map((l) => [l, `${homeHref(l)}/`])) as Record<
              typeof locale,
              string
            >
          }
        />
      </header>

      {/*
        The claim before the name, as everywhere else: the tagline leads and
        the wordmark is the smallest thing on the page. The h1 is the tagline
        because that is what this page is about; the name is already in the
        title bar. The drawing under it is the claim made good — the same
        parts the invariants run over, projected and traced.
      */}
      <h1 className="mt-12 max-w-3xl text-display text-bolu">{pick(COPY.tagline, locale)}</h1>
      <p className="mt-5 max-w-2xl text-lead text-muted">{pick(COPY.landing.lede, locale)}</p>

      <div className="mt-8">
        <ElevationShelf
          caption={pick(COPY.landing.shelfCaption, locale)}
          items={built.map(({ t, s }) => ({
            key: t.key,
            href: `${houseHref(locale, t.slug)}/`,
            label: t.house[locale],
            s,
          }))}
        />
      </div>

      <hr className="rule my-10" />

      {/*
        The story runs in two columns above the sheet breakpoint: four beats
        read as a spread, not a scroll, and each paragraph keeps its own
        column so no beat is split mid-sentence.
      */}
      <section id="cerita" className="scroll-mt-16">
        <h2 className="micro mb-4">{pick(COPY.landing.storyHeading, locale)}</h2>
        <div className="gap-10 sheet:columns-2">
          {COPY.landing.story.map((p, i) => (
            <p key={i} className="reveal mb-4 break-inside-avoid text-body text-bolu">
              {pick(p, locale)}
            </p>
          ))}
        </div>
      </section>

      <hr className="rule my-10" />

      {/*
        The map takes the width of the window and the reading takes the width
        of a column. The archipelago is four thousand kilometres of ocean with
        islands in it: in a prose measure Sumatra is a smudge and three of the
        sites share a marker. The legend and the note stay where prose belongs.
      */}
      <section id="tapak" className="reveal scroll-mt-16">
        <h2 className="micro mb-4">{pick(COPY.landing.sitesHeading, locale)}</h2>
        <SiteMap locale={locale} items={built.map(({ t, s }) => ({ t, s }))} />
        <p className="mt-3 max-w-3xl text-body text-muted">
          {pick(COPY.landing.sitesNote, locale)}
        </p>
      </section>

      <hr className="rule my-10" />

      <section id="rumah" className="scroll-mt-16">
        <h2 className="micro mb-4">{pick(COPY.landing.housesHeading, locale)}</h2>
        {/*
          The legend for the card bars, drawn once above the index rather than
          once per card: no colour may carry a meaning only the code knows.
        */}
        <div className="mb-4">
          <SplitLegend locale={locale} />
        </div>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sheet:grid-cols-3">
          {built.map(({ t, b, s }, i) => (
            <HouseCard
              key={t.key}
              locale={locale}
              tradition={t}
              plate={i + 1}
              s={s}
              frame={frame}
              parts={b.house.parts.length}
              joints={b.house.joints.length}
            />
          ))}
        </ul>
        <p className="mt-4 max-w-2xl text-body text-muted">{pick(COPY.tradition.note, locale)}</p>
      </section>
    </main>
  )
}

function HouseCard({
  locale,
  tradition,
  plate,
  s,
  frame,
  parts,
  joints,
}: {
  locale: Locale
  tradition: Tradition
  plate: number
  s: Silhouette
  frame: { w: number; h: number }
  parts: number
  joints: number
}) {
  const split = tradition.split
  const share = split.total === 0 ? 0 : Math.round((split.interpolated / split.total) * 100)
  return (
    <li className="reveal h-full">
      <Link
        href={`${houseHref(locale, tradition.slug)}/`}
        className="press flex h-full flex-col rounded border border-hairline bg-sheet transition-colors duration-state hover:border-muted hover:bg-wash"
      >
        {/* The plate header: catalogue number left, whose house right. */}
        <span className="flex items-baseline justify-between gap-2 border-b border-hairline px-4 py-2">
          <span className="micro text-bolu">
            {pick(COPY.landing.plate, locale)} {plateNo(plate)}
          </span>
          <span className="micro truncate">{tradition.people[locale]}</span>
        </span>
        <span className="block px-4 pt-4">
          <ElevationMark s={s} frame={frame} />
        </span>
        <span className="flex flex-col gap-1 px-4 pb-4 pt-2">
          <span className="text-title text-bolu">{tradition.house[locale]}</span>
          <span className="micro">{tradition.place[locale]}</span>
          <span className="mt-1 font-mono text-meta text-muted">
            {parts} {pick(COPY.landing.parts, locale)} · {joints}{' '}
            {pick(COPY.landing.joints, locale)}
          </span>
        </span>
        {/* The plate foot: each house's own bar, never a merged one. */}
        <span className="mt-auto flex flex-col gap-2 border-t border-hairline px-4 py-3">
          <SplitBar split={split} />
          <span className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-meta text-muted">
              {pick(COPY.landing.interpolatedShare, locale).replace('{pct}', String(share))}
            </span>
            <span className="text-body text-bolu underline underline-offset-4">
              {pick(COPY.landing.enter, locale)} <span aria-hidden>→</span>
            </span>
          </span>
        </span>
      </Link>
    </li>
  )
}
/**
 * The sites, plotted on the archipelago.
 *
 * This was a bare graticule for a long time, and the note here said why: an
 * outline of Indonesia drawn by hand would be an interpolated drawing shown as
 * a measured one, which is the move this project refuses everywhere else. That
 * objection was to *inventing* a coastline, and it survives — what has changed
 * is that the coastline is now somebody's measurement rather than nobody's.
 * `lib/geo/nusantara.ts` is Natural Earth's `ne_10m_land`, clipped to this
 * frame and simplified, generated by a script that is in the repository and
 * credited in the file it writes. It is a file and not a fetch because hard
 * rule 4 says there is no runtime network.
 *
 * Each site carries the building itself: its silhouette at glyph size with its
 * name under it, standing on a dot at the true coordinates. Numbers stopped
 * working the moment there were thirty-five sites — a code that has to be
 * looked up below the map is a map read twice — and a graticule with degree
 * labels answered a question nobody standing here asks. The glyphs are laid
 * out by a deterministic solver: each label tries positions in rings around
 * its site until it finds clear ground, and a hairline leader ties a displaced
 * label back to its dot. Deterministic, so the same registry always draws the
 * same map.
 *
 * The svg is aria-hidden; the legend below is the real, linked content.
 */
function SiteMap({
  locale,
  items,
}: {
  locale: Locale
  items: readonly { t: Tradition; s: Silhouette }[]
}) {
  /*
   * Degrees of the frame, and viewBox units per degree. The frame is the
   * coastline's own — `FRAME` in the generated file — so the land cannot be
   * clipped to one rectangle and drawn in another, which would show the
   * archipelago ending in a straight line somewhere inside the map.
   */
  const S = 30
  const w = (FRAME.east - FRAME.west) * S
  const h = (FRAME.north - FRAME.south) * S
  const x = (lon: number) => (lon - FRAME.west) * S
  const y = (lat: number) => (FRAME.north - lat) * S
  /** two decimals: the data is rounded to a kilometre, so the path may be too */
  const g = (n: number) => Math.round(n * 100) / 100

  /*
   * Label geometry, in viewBox units. The glyph box is the same for every
   * building — these are markers, and a marker's job is to be found, not to
   * restate the shelf's same-scale claim. Text width is estimated from the
   * mono face's advance, which is the one thing a monospace face makes
   * estimable.
   */
  const GW = 46 // glyph box
  const GH = 30
  const FS = 15 // label size
  const LH = 21 // glyph foot to text baseline
  const CH = FS * 0.66 // one mono character, tracking included
  const MARGIN = 8 // labels keep off the frame edge
  const GAP = 5 // and off each other

  interface Box {
    bx: number
    by: number
    bw: number
    bh: number
  }
  const clearOf = (a: Box, b: Box) =>
    a.bx + a.bw + GAP <= b.bx ||
    b.bx + b.bw + GAP <= a.bx ||
    a.by + a.bh + GAP <= b.by ||
    b.by + b.bh + GAP <= a.by

  const anchors = items.map(({ t }) => ({
    ax: x(t.site.longitude),
    ay: y(t.site.latitude),
  }))
  /* No label may cover any site's dot — a marker under a neighbour's name is
     a site the map has silently dropped. */
  const dots: Box[] = anchors.map(({ ax, ay }) => ({ bx: ax - 5, by: ay - 5, bw: 10, bh: 10 }))

  const placed: Box[] = []
  const labels = items.map(({ t, s }, i) => {
    const name = t.house[locale]
    const bw = Math.max(GW, name.length * CH)
    const bh = GH + LH
    const { ax, ay } = anchors[i]!

    /* Standing over its own site first, then beside it, then rings outward at
       twelve bearings. The first clear ground wins, so labels stay as close
       to their dots as the crowd allows. */
    const candidates: Box[] = [
      { bx: ax - bw / 2, by: ay - bh - 8, bw, bh },
      { bx: ax - bw / 2, by: ay + 10, bw, bh },
      { bx: ax + 10, by: ay - bh / 2, bw, bh },
      { bx: ax - bw - 10, by: ay - bh / 2, bw, bh },
    ]
    /* The rings run far enough that the tightest cluster on the map — Bali,
       Lombok and Sumbawa within three degrees — still resolves; the far
       rings land labels in open sea, tied back by their leaders. */
    for (const r of [30, 50, 74, 102, 134, 170, 210, 254, 302, 354, 410]) {
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * 2 * Math.PI
        candidates.push({
          bx: ax + r * Math.cos(a) - bw / 2,
          by: ay + r * Math.sin(a) - bh / 2,
          bw,
          bh,
        })
      }
    }
    const box =
      candidates.find(
        (c) =>
          c.bx >= MARGIN &&
          c.by >= MARGIN &&
          c.bx + c.bw <= w - MARGIN &&
          c.by + c.bh <= h - MARGIN &&
          placed.every((p) => clearOf(c, p)) &&
          dots.every((d) => clearOf(c, d)),
      ) ?? candidates[0]!
    placed.push(box)

    /* The leader runs to the label's nearest edge, and only when the label
       has actually moved away from its dot. */
    const px = Math.min(Math.max(ax, box.bx), box.bx + box.bw)
    const py = Math.min(Math.max(ay, box.by), box.by + box.bh)
    const leader = Math.hypot(ax - px, ay - py) > 12 ? { px, py } : null

    return { t, s, name, ax, ay, box, leader }
  })

  return (
    <>
      <div className="bleed px-6">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full rounded border border-hairline bg-sheet"
          aria-hidden="true"
        >
          {/*
            The land first, everything else over it. One path for the whole
            archipelago: the rings are separate loops in one `d`, so the browser
            fills them as one shape and the sea between two islands is the page,
            not a colour.
          */}
          <path
            d={COASTLINE.map(
              (ring) =>
                'M' +
                ring.map(([lon, lat]) => `${g(x(lon))} ${g(y(lat))}`).join('L') +
                'Z',
            ).join('')}
            fill="var(--wash)"
            stroke="var(--hairline)"
            vectorEffect="non-scaling-stroke"
            fillRule="evenodd"
          />
          {labels.map(({ t, ax, ay, leader }) => (
            <g key={`site-${t.key}`}>
              {leader ? (
                <line
                  x1={g(ax)}
                  y1={g(ay)}
                  x2={g(leader.px)}
                  y2={g(leader.py)}
                  stroke="var(--muted)"
                  vectorEffect="non-scaling-stroke"
                />
              ) : null}
              <rect x={g(ax - 3)} y={g(ay - 3)} width={6} height={6} fill="var(--bolu)" />
            </g>
          ))}
          {labels.map(({ t, s, name, box }) => (
            <g key={t.key}>
              <ElevationGlyph s={s} x={box.bx + (box.bw - GW) / 2} y={box.by} w={GW} h={GH} />
              <text
                x={g(box.bx + box.bw / 2)}
                y={g(box.by + GH + LH - 5)}
                textAnchor="middle"
                fontSize={FS}
                letterSpacing="0.05em"
                className="font-mono uppercase"
                fill="var(--bolu)"
              >
                {name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <ol className="mt-3 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
        {items.map(({ t }, i) => (
          <li key={t.key}>
            <Link
              href={`${houseHref(locale, t.slug)}/`}
              className="flex items-baseline gap-3 rounded py-1 transition-colors duration-state hover:bg-wash"
            >
              <span className="micro shrink-0 text-bolu">{plateNo(i + 1)}</span>
              <span className="min-w-0 truncate text-body text-bolu">{t.house[locale]}</span>
              <span className="ml-auto shrink-0 font-mono text-meta text-muted">
                {t.site.name}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  )
}
