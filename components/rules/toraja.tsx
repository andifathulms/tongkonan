'use client'

/**
 * The tongkonan's three rules.
 *
 * Not generated from a schema, and the reason is on the screen. The rank
 * multiplier is printed on the rank that applies it, because rank was the one
 * rule whose arithmetic was invisible at the point of use; the bay stepper
 * warns when a count is unusual for the rank, which is a fact about Toraja
 * custom and not a validation error; and the horn slider says what a horn is
 * a record of. A field list that rendered both houses would have to drop all
 * three, and they are the parts carrying the argument.
 *
 * What is shared is underneath: the radio group, the stepper, the field
 * furniture. The abstraction goes under the widgets, not over them.
 *
 * The component speaks in query strings rather than in `Rules`, so the client
 * around it never learns what a rank is.
 */

import { COPY, pick } from '@/lib/i18n'
import { RANKS, bayCountIsUnusual, rankInfo } from '@/lib/tradition/toraja/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/toraja/address'
import type { Rules } from '@/lib/tradition/toraja/types'
import { Choice, Choices, Field, Stepper, fill } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

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
export function TorajaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
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
              onSelect={() => set({ ...rules, rank: r.rank })}
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
          onChange={(bays) => set({ ...rules, bays })}
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
          onChange={(e) => set({ ...rules, horns: Number(e.target.value) })}
          aria-valuetext={fill(pick(COPY.controls.hornsValue, locale), {
            n: String(rules.horns),
          })}
          className="h-control w-full accent-bolu"
        />
      </Field>
    </RailSection>
  )
}
