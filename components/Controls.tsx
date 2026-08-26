'use client'

import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import { RANKS, bayCountIsUnusual, rankInfo } from '@/lib/banua/rules'
import type { Rules } from '@/lib/banua/types'
import { formatClock } from '@/lib/solar/presets'
import type { DatePreset } from '@/lib/solar/presets'
import type { ViewKey } from './viewport/scene'
import { RailSection } from './Sheet'

/**
 * The rule controls.
 *
 * Every control here names a thing a household would say about itself. There
 * is no roof-curvature slider and there will not be one: the roof is
 * downstream of the rules, and if the shape needs adjusting, the rule pack is
 * what changes.
 *
 * A control says what happens when it is used.
 */
export function RuleControls({
  rules,
  onChange,
  locale,
}: {
  rules: Rules
  onChange: (next: Rules) => void
  locale: Locale
}) {
  const unusual = bayCountIsUnusual(rules)
  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={pick(COPY.controls.rank, locale)}>
        <div className="flex flex-col gap-px">
          {RANKS.map((r) => (
            <Choice
              key={r.rank}
              name="pangkat"
              value={r.rank}
              checked={rules.rank === r.rank}
              onSelect={() => onChange({ ...rules, rank: r.rank })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.rank === r.rank ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{r.name}</span>
                {/*
                  The multiplier, on the control that applies it. Rank was the
                  one rule whose arithmetic was invisible at the point of use,
                  so a reader watching the house grow could not tell whether it
                  had gained bays, height or simply scale.
                */}
                <span className="num shrink-0 text-meta">×{r.scale.value.toFixed(2)}</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.rank === r.rank ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? r.glossId : r.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.rank === r.rank ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{
                    background: r.scale.class === 'canon' ? 'var(--riri)' : 'var(--rara)',
                    borderColor: r.scale.class === 'canon' ? 'var(--riri-ink)' : 'var(--rara)',
                  }}
                />
                {r.scale.source === 'none' ? pick(COPY.sources.none, locale) : r.scale.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">{pick(COPY.controls.rankHint, locale)}</p>
      </Choices>

      <Field
        group
        label={pick(COPY.controls.bays, locale)}
        value={String(rules.bays)}
        hint={
          locale === 'id'
            ? 'Membagi badan rumah dari muka ke belakang, dan menentukan jumlah baris tiang.'
            : 'Divides the body front to rear, and sets the number of post rows.'
        }
      >
        <Stepper
          min={2}
          max={5}
          value={rules.bays}
          onChange={(bays) => onChange({ ...rules, bays })}
        />
        {unusual ? (
          <p className="mt-2 text-body text-rara">
            {pick(COPY.controls.unusual, locale)}{' '}
            <span className="text-muted">
              {rankInfo(rules.rank).name}: ≤ {rankInfo(rules.rank).maxBays}
            </span>
          </p>
        ) : null}
      </Field>

      <Field
        htmlFor="tanduk"
        label={pick(COPY.controls.horns, locale)}
        value={`${rules.horns} ${pick(COPY.controls.hornsUnit, locale)}`}
        hint={
          locale === 'id'
            ? 'Menambah satu tanduk pada tulak somba untuk tiap upacara rambu solo yang pernah digelar rumah ini.'
            : 'Adds one horn to the tulak somba for each funeral this house has held.'
        }
      >
        <input
          id="tanduk"
          type="range"
          min={0}
          max={32}
          step={1}
          value={rules.horns}
          onChange={(e) => onChange({ ...rules, horns: Number(e.target.value) })}
          aria-valuetext={fill(pick(COPY.controls.hornsValue, locale), {
            n: String(rules.horns),
          })}
          className="h-control w-full accent-bolu"
        />
      </Field>
    </RailSection>
  )
}

/**
 * Orientation, stated on screen.
 *
 * Its absence from the controls has to read as a fact about the building
 * rather than as a missing feature, and the only way to achieve that is to
 * say so where the controls are.
 */
export function OrientationNote({ locale }: { locale: Locale }) {
  return (
    <RailSection title={pick(COPY.orientation.heading, locale)}>
      <p className="text-body text-muted">{pick(COPY.orientation.body, locale)}</p>
    </RailSection>
  )
}

export function SunControls({
  presets,
  presetKey,
  minutes,
  onPreset,
  onMinutes,
  altitude,
  locale,
}: {
  presets: readonly DatePreset[]
  presetKey: DatePreset['key']
  minutes: number
  onPreset: (key: DatePreset['key']) => void
  onMinutes: (minutes: number) => void
  altitude: number
  locale: Locale
}) {
  const active = presets.find((p) => p.key === presetKey) ?? presets[0]
  return (
    <RailSection title={pick(COPY.controls.sun, locale)}>
      <Choices legend={pick(COPY.controls.date, locale)}>
        <div className="flex flex-col gap-px">
          {presets.map((p) => (
            <Choice
              key={p.key}
              name="tanggal"
              value={p.key}
              checked={p.key === presetKey}
              onSelect={() => onPreset(p.key)}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                p.key === presetKey ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
            <span className="flex items-baseline justify-between gap-2 text-body leading-tight">
              {locale === 'id' ? p.labelId : p.labelEn}
              <span className="num text-meta">{p.noonAltitude.toFixed(1)}°</span>
            </span>
            <span
              className={[
                'mt-0.5 block text-meta',
                p.key === presetKey ? 'text-muted-on-ink' : 'text-muted',
              ].join(' ')}
            >
              {locale === 'id' ? p.glossId : p.glossEn}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between">
          {/*
            A real label rather than an aria-label repeating it: the words are
            already on screen, and pointing at the control is what associates
            them.
          */}
          <label className="micro" htmlFor="waktu">
            {pick(COPY.controls.time, locale)} WITA
          </label>
          <span className="num text-meta">{formatClock(minutes)}</span>
        </div>
        <input
          id="waktu"
          type="range"
          min={0}
          max={1439}
          step={5}
          value={minutes}
          onChange={(e) => onMinutes(Number(e.target.value))}
          /*
            The clock and the altitude together: the altitude is what the
            control is actually for, and carrying it here is one announcement
            instead of a live region firing after every step.
          */
          aria-valuetext={fill(pick(COPY.controls.timeValue, locale), {
            clock: formatClock(minutes),
            alt: altitude.toFixed(1),
          })}
          className="h-control w-full accent-bolu"
        />
        <div className="mt-1 flex items-baseline justify-between">
          <span className="micro">
            {locale === 'id' ? 'Tinggi matahari' : 'Solar altitude'}
          </span>
          <span className="num text-meta">{altitude.toFixed(1)}°</span>
        </div>
        <p className="mt-2 text-body text-muted">
          {active
            ? locale === 'id'
              ? `Tengah hari pada tanggal ini: ${active.noonAltitude.toFixed(1)}° di atas ufuk. Rantepao 2,97° LS, 119,90° BT.`
              : `Transit on this date: ${active.noonAltitude.toFixed(1)}° above the horizon. Rantepao 2.97° S, 119.90° E.`
            : null}
        </p>
      </div>
    </RailSection>
  )
}

export function SceneToggles({
  figure,
  rain,
  onFigure,
  onRain,
  locale,
}: {
  figure: boolean
  rain: boolean
  onFigure: (v: boolean) => void
  onRain: (v: boolean) => void
  locale: Locale
}) {
  return (
    <RailSection>
      <Toggle
        checked={figure}
        onChange={onFigure}
        label={pick(COPY.controls.figure, locale)}
        hint={
          locale === 'id'
            ? 'Sosok ini bukan hiasan; ia adalah tongkat ukur.'
            : 'The figure is not set dressing; it is the scale bar.'
        }
      />
      <Toggle
        checked={rain}
        onChange={onRain}
        label={pick(COPY.controls.rain, locale)}
        hint={
          locale === 'id'
            ? 'Menunjukkan air jatuh dari atap dan garis tetesnya di tanah, di luar kaki tiang.'
            : 'Shows water shedding off the roof, and the drip line on the ground clear of the post feet.'
        }
      />
    </RailSection>
  )
}

export function ViewSwitch({
  view,
  onChange,
  locale,
}: {
  view: ViewKey
  onChange: (v: ViewKey) => void
  locale: Locale
}) {
  const views: { key: ViewKey; label: string }[] = [
    { key: 'perspektif', label: pick(COPY.views.perspektif, locale) },
    { key: 'tampak', label: pick(COPY.views.tampak, locale) },
    { key: 'kolong', label: pick(COPY.views.kolong, locale) },
  ]
  return (
    <fieldset className="absolute right-3 top-3 z-10 flex gap-px rounded border border-hairline bg-film p-px">
      <legend className="sr-only">{pick(COPY.views.legend, locale)}</legend>
      {views.map((v) => (
        <Choice
          key={v.key}
          name="tampilan"
          value={v.key}
          checked={v.key === view}
          onSelect={() => onChange(v.key)}
          face={[
            'micro inline-flex min-h-control items-center rounded px-2 transition-colors duration-state',
            v.key === view ? 'bg-bolu text-kapur' : 'text-bolu hover:bg-wash',
          ].join(' ')}
        >
          {v.label}
        </Choice>
      ))}
    </fieldset>
  )
}

/** Fill {name} placeholders in a copy string. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole)
}

/**
 * One option in a single-choice group.
 *
 * These were `<button aria-pressed>` — valid, but it made each option its own
 * tab stop and announced five unrelated toggles where the reader is choosing
 * one of a set. Fourteen tab stops to cross the rail. A radio group is one
 * stop, arrow keys inside it, and a screen reader says "3 of 4".
 *
 * The input is the control and the span is its face, so the styling is
 * unchanged from the buttons it replaces.
 */
export function Choice({
  name,
  value,
  checked,
  onSelect,
  face,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onSelect: () => void
  /** classes for the visible face, including its selected state */
  face: string
  children: React.ReactNode
}) {
  return (
    <label className="choice cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <span className={`choice-face ${face}`}>{children}</span>
    </label>
  )
}

/* ── Primitives ───────────────────────────────────────────────────────── */

/**
 * A labelled group of choices.
 *
 * The same look as `Field`, but a real fieldset and legend, because the label
 * of a radio group has to belong to the group rather than sit above it.
 */
function Choices({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-5 last:mb-0">
      <legend className="micro mb-2">{legend}</legend>
      {children}
    </fieldset>
  )
}

/**
 * A labelled control.
 *
 * `group` makes it a fieldset whose legend is the label you can already see.
 * The alternative — a visible label beside the group and a hidden legend
 * inside it — says the same word twice to anyone listening, which is how a
 * group ends up worse off for having been made accessible.
 */
function Field({
  label,
  value,
  hint,
  group = false,
  htmlFor,
  children,
}: {
  label: string
  value?: string
  hint?: string
  group?: boolean
  /** id of the single control this labels, when it labels one */
  htmlFor?: string
  children: React.ReactNode
}) {
  const head = (
    <>
      {htmlFor ? (
        <label className="micro" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="micro">{label}</span>
      )}
      {value ? <span className="num text-meta">{value}</span> : null}
    </>
  )
  const body = (
    <>
      {children}
      {hint ? <p className="mt-2 text-body text-muted">{hint}</p> : null}
    </>
  )

  if (group) {
    return (
      <fieldset className="mb-5 last:mb-0">
        <legend className="mb-2 flex w-full items-baseline justify-between gap-2">
          {head}
        </legend>
        {body}
      </fieldset>
    )
  }
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">{head}</div>
      {body}
    </div>
  )
}

function Stepper({
  min,
  max,
  value,
  onChange,
}: {
  min: number
  max: number
  value: number
  onChange: (v: number) => void
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    // No fieldset here: the Field around this one is the group, and its
    // visible label is the legend.
    <div className="flex gap-px">
      {options.map((n) => (
        <Choice
          key={n}
          name="ruang"
          value={String(n)}
          checked={n === value}
          onSelect={() => onChange(n)}
          face={[
            'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
            n === value ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
          ].join(' ')}
        >
          {n}
        </Choice>
      ))}
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint: string
}) {
  return (
    <label className="mb-4 flex cursor-pointer items-start gap-2 last:mb-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-bolu"
      />
      <span>
        <span className="block text-body leading-tight">{label}</span>
        <span className="mt-1 block text-body text-muted">{hint}</span>
      </span>
    </label>
  )
}
