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
      <Field label={pick(COPY.controls.rank, locale)}>
        <div className="flex flex-col gap-px">
          {RANKS.map((r) => (
            <button
              key={r.rank}
              type="button"
              onClick={() => onChange({ ...rules, rank: r.rank })}
              aria-pressed={rules.rank === r.rank}
              className={[
                'rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.rank === r.rank
                  ? 'bg-bolu text-kapur'
                  : 'hover:bg-[rgba(23,21,15,0.06)]',
              ].join(' ')}
            >
              <span className="block text-[14px] leading-tight">{r.name}</span>
              <span
                className={[
                  'mt-0.5 block text-[11px] leading-snug',
                  rules.rank === r.rank
                    ? 'text-[rgba(233,227,210,0.72)]'
                    : 'text-[color:var(--muted)]',
                ].join(' ')}
              >
                {locale === 'id' ? r.glossId : r.glossEn}
              </span>
            </button>
          ))}
        </div>
      </Field>

      <Field
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
          label={pick(COPY.controls.bays, locale)}
        />
        {unusual ? (
          <p className="mt-2 text-[12px] leading-snug" style={{ color: 'var(--rara)' }}>
            {pick(COPY.controls.unusual, locale)}{' '}
            <span className="text-[color:var(--muted)]">
              {rankInfo(rules.rank).name}: ≤ {rankInfo(rules.rank).maxBays}
            </span>
          </p>
        ) : null}
      </Field>

      <Field
        label={pick(COPY.controls.horns, locale)}
        value={`${rules.horns} ${pick(COPY.controls.hornsUnit, locale)}`}
        hint={
          locale === 'id'
            ? 'Menambah satu tanduk pada tulak somba untuk tiap upacara rambu solo yang pernah digelar rumah ini.'
            : 'Adds one horn to the tulak somba for each funeral this house has held.'
        }
      >
        <input
          type="range"
          min={0}
          max={32}
          step={1}
          value={rules.horns}
          onChange={(e) => onChange({ ...rules, horns: Number(e.target.value) })}
          aria-label={pick(COPY.controls.horns, locale)}
          className="w-full accent-[color:var(--bolu)]"
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
      <p className="text-[13px] leading-snug text-[color:var(--muted)]">
        {pick(COPY.orientation.body, locale)}
      </p>
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
      <div className="flex flex-col gap-px">
        {presets.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onPreset(p.key)}
            aria-pressed={p.key === presetKey}
            className={[
              'rounded px-2 py-1.5 text-left transition-colors duration-state',
              p.key === presetKey ? 'bg-bolu text-kapur' : 'hover:bg-[rgba(23,21,15,0.06)]',
            ].join(' ')}
          >
            <span className="flex items-baseline justify-between gap-2 text-[14px] leading-tight">
              {locale === 'id' ? p.labelId : p.labelEn}
              <span className="num text-[12px] opacity-70">
                {p.noonAltitude.toFixed(1)}°
              </span>
            </span>
            <span
              className={[
                'mt-0.5 block text-[11px] leading-snug',
                p.key === presetKey
                  ? 'text-[rgba(233,227,210,0.72)]'
                  : 'text-[color:var(--muted)]',
              ].join(' ')}
            >
              {locale === 'id' ? p.glossId : p.glossEn}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="micro">{pick(COPY.controls.time, locale)} WITA</span>
          <span className="num text-[13px]">{formatClock(minutes)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1439}
          step={5}
          value={minutes}
          onChange={(e) => onMinutes(Number(e.target.value))}
          aria-label={pick(COPY.controls.time, locale)}
          className="w-full accent-[color:var(--bolu)]"
        />
        <div className="mt-1 flex items-baseline justify-between">
          <span className="micro">
            {locale === 'id' ? 'Tinggi matahari' : 'Solar altitude'}
          </span>
          <span className="num text-[13px]">{altitude.toFixed(1)}°</span>
        </div>
        <p className="mt-2 text-[11px] leading-snug text-[color:var(--muted)]">
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
    <div className="absolute right-3 top-3 z-10 flex gap-px rounded border border-[color:var(--hairline)] bg-[color:var(--film)] p-px">
      {views.map((v) => (
        <button
          key={v.key}
          type="button"
          onClick={() => onChange(v.key)}
          aria-pressed={v.key === view}
          className={[
            'micro rounded px-2 py-1.5 transition-colors duration-state',
            v.key === view ? 'bg-bolu text-kapur' : 'text-bolu hover:bg-[rgba(23,21,15,0.06)]',
          ].join(' ')}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

/* ── Primitives ───────────────────────────────────────────────────────── */

function Field({
  label,
  value,
  hint,
  children,
}: {
  label: string
  value?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="micro">{label}</span>
        {value ? <span className="num text-[13px]">{value}</span> : null}
      </div>
      {children}
      {hint ? (
        <p className="mt-2 text-[11px] leading-snug text-[color:var(--muted)]">{hint}</p>
      ) : null}
    </div>
  )
}

function Stepper({
  min,
  max,
  value,
  onChange,
  label,
}: {
  min: number
  max: number
  value: number
  onChange: (v: number) => void
  label: string
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  return (
    <div role="group" aria-label={label} className="flex gap-px">
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={n === value}
          className={[
            'num flex-1 rounded py-1.5 text-[14px] transition-colors duration-state',
            n === value
              ? 'bg-bolu text-kapur'
              : 'border border-[color:var(--hairline)] hover:bg-[rgba(23,21,15,0.06)]',
          ].join(' ')}
        >
          {n}
        </button>
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
        className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--bolu)]"
      />
      <span>
        <span className="block text-[14px] leading-tight">{label}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-[color:var(--muted)]">
          {hint}
        </span>
      </span>
    </label>
  )
}
