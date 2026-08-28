'use client'

/**
 * The saoraja's rules.
 *
 * The board stepper is the only control in this project that can be *refused
 * on grounds of standing*. A bola will not take five however wide it is made,
 * and the rail says why in those words — not "out of range" but "not this
 * household's to claim". That distinction is the house, so the control has to
 * carry it rather than silently clamping.
 *
 * The readout prints the load those boards carry, which is zero, beside the
 * height they reach. Both numbers are the point: what the claim costs the
 * building is nothing, and what it buys is being read from further away.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_LONTANG, MIN_LONTANG, RUMAH, rumahInfo } from '@/lib/tradition/bugis/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/bugis/address'
import type { Rules } from '@/lib/tradition/bugis/types'
import { Choice, Choices, Field, Stepper } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

/** Odd only, because odd is the rule. */
const BOARDS = [3, 5, 7, 9]

export function BugisControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const info = rumahInfo(rules.rumah)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Rumah' : 'House'}>
        <div className="flex flex-col gap-px">
          {RUMAH.map((r) => (
            <Choice
              key={r.rumah}
              name="rumah"
              value={r.rumah}
              checked={rules.rumah === r.rumah}
              onSelect={() => set({ ...rules, rumah: r.rumah })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.rumah === r.rumah ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{r.name}</span>
                <span className="num shrink-0 text-meta">
                  {r.minTimpa === r.maxTimpa ? r.minTimpa : `${r.minTimpa}–${r.maxTimpa}`}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.rumah === r.rumah ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? r.glossId : r.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.rumah === r.rumah ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.rankCarriesNothing.source}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Timpa laja' : 'Timpa laja'}
        value={String(rules.timpa)}
        hint={
          locale === 'id'
            ? 'Susunan papan pada muka pelana, dan jumlahnya adalah pangkat rumah tangga. Papan itu tidak memikul apa pun: cabut semuanya dan rumahnya berdiri persis sama. Karena itu ia satu-satunya penanda pangkat dalam projek ini yang dapat dilepas — dan satu-satunya yang dapat berdusta.'
            : 'A stack of boards on the gable face, and their number is the household’s rank. They carry nothing: take them all off and the house stands exactly as it did. That makes it the only rank marker in this project that can be removed — and the only one that can lie.'
        }
      >
        <div className="flex gap-px">
          {BOARDS.map((n) => {
            const allowed = n >= info.minTimpa && n <= info.maxTimpa
            return (
              <Choice
                key={n}
                name="timpa"
                value={String(n)}
                checked={n === rules.timpa}
                onSelect={() => allowed && set({ ...rules, timpa: n })}
                face={[
                  'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                  n === rules.timpa
                    ? 'bg-bolu text-kapur'
                    : allowed
                      ? 'border border-hairline hover:bg-wash'
                      : 'border border-hairline text-muted',
                ].join(' ')}
              >
                {n}
              </Choice>
            )
          })}
        </div>
        {/*
          Refused on grounds of standing, not of structure, and the copy has to
          say which. A bola would carry nine boards without noticing; that is
          precisely why the limit is worth stating in these words.
        */}
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `${info.name} berhak atas ${info.minTimpa === info.maxTimpa ? info.minTimpa : `${info.minTimpa}–${info.maxTimpa}`} papan. Yang lain bukan tidak sanggup dipikul — bangunannya akan memikulnya dengan mudah — melainkan bukan haknya.`
            : `A ${info.name} is entitled to ${info.minTimpa === info.maxTimpa ? info.minTimpa : `${info.minTimpa}–${info.maxTimpa}`} boards. The others are not beyond the building — it would carry them easily — they are simply not this household’s to claim.`}
        </p>
        <p className="num mt-1 text-meta text-muted">
          {locale === 'id'
            ? `${rules.timpa} papan · 0 beban · terbaca sampai ${(DIMS.timpaRise.value * (rules.timpa - 0.4)).toFixed(2)} m di atas tepi atap`
            : `${rules.timpa} boards · 0 load · reading to ${(DIMS.timpaRise.value * (rules.timpa - 0.4)).toFixed(2)} m above the eave`}
        </p>
      </Field>

      <Field
        group
        label={locale === 'id' ? 'Lontang' : 'Bays'}
        value={String(rules.lontang)}
        hint={
          locale === 'id'
            ? 'Panjang rumah dalam ruang. Ukuran, dan hanya ukuran — rumah yang lebih panjang adalah rumah yang lebih besar dengan kedudukan yang sama persis.'
            : 'How many bays long. Size, and only size — a longer house is a larger house of exactly the same standing.'
        }
      >
        <Stepper min={MIN_LONTANG} max={MAX_LONTANG} value={rules.lontang} onChange={(n) => set({ ...rules, lontang: n })} />
      </Field>
    </RailSection>
  )
}
