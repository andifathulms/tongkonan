'use client'

/**
 * The rumah gadang's three rules.
 *
 * The laras control is the reason this house was worth building. It is not a
 * style: it is which adat raised the house, and it is legible in the floor —
 * so the option prints what it does to the building rather than only naming
 * itself, and the Bodi Caniago option says that the *absence* of a step is
 * the statement. An option whose effect is a thing not happening is exactly
 * what a generated field list would have rendered as a blank.
 *
 * The ruang stepper offers odd numbers only. That is a rule and not a
 * validation: a four-ruang rumah gadang is not an unusual house, it is a
 * different thing — which is why this control differs in kind from the
 * tongkonan's bay stepper, where an unusual count is allowed and merely
 * reported.
 *
 * Like the other house's, it speaks in query strings, so the client around it
 * never learns what a laras is.
 */

import { COPY, pick } from '@/lib/i18n'
import { LARAS, MAX_BILIK, DIMS } from '@/lib/tradition/minang/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/minang/address'
import type { Rules } from '@/lib/tradition/minang/types'
import { Choice, Choices, Field, fill } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

/** Odd only, because odd is the rule. */
const RUANG = [3, 5, 7, 9]

export function MinangControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const interior = rules.ruang - 2

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Laras' : 'Laras'}>
        <div className="flex flex-col gap-px">
          {LARAS.map((l) => (
            <Choice
              key={l.laras}
              name="laras"
              value={l.laras}
              checked={rules.laras === l.laras}
              onSelect={() => set({ ...rules, laras: l.laras })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.laras === l.laras ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{l.name}</span>
                {/*
                  What it does to the building, on the control that does it.
                  Naming the laras alone would leave the reader to discover
                  that one of these two options is the absence of a feature.
                */}
                <span className="num shrink-0 text-meta">
                  {l.gonjong} gonjong · {l.anjuang ? `+${DIMS.anjuangRise.value.toFixed(2)} m` : '—'}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.laras === l.laras ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? l.glossId : l.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.laras === l.laras ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.anjuangKotoPiliang.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Bukan gaya, melainkan adat mana yang mendirikan rumah ini. Perbedaannya terbaca pada ketinggian lantai.'
            : 'Not a style but which adat raised this house. The difference is legible in the height of the floor.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Ruang'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Membagi rumah di sepanjang bubungan, dan menentukan jumlah baris tonggak. Selalu ganjil — angka genap bukan rumah gadang yang tidak lazim, melainkan bukan rumah gadang.'
            : 'Divides the house along the ridge, and sets the number of post rows. Always odd — an even count is not an unusual rumah gadang, it is not one.'
        }
      >
        <div className="flex gap-px">
          {RUANG.map((n) => (
            <Choice
              key={n}
              name="ruang"
              value={String(n)}
              checked={n === rules.ruang}
              onSelect={() => set({ ...rules, ruang: n })}
              face={[
                'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                n === rules.ruang ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
              ].join(' ')}
            >
              {n}
            </Choice>
          ))}
        </div>
      </Field>

      <Field
        htmlFor="bilik"
        label={locale === 'id' ? 'Bilik' : 'Bilik'}
        value={`${rules.bilik} / ${interior}`}
        hint={
          locale === 'id'
            ? 'Satu bilik di lanjar belakang untuk tiap anak perempuan yang menikah. Terisi berurutan dari satu ujung, jadi rumah ini tidak simetris pada sekat-sekatnya — dan ketidaksimetrisan itulah catatannya.'
            : 'One room along the rear lanjar for each daughter who has married. They fill in sequence from one end, so the house is not symmetric in its partitions — and that asymmetry is the record.'
        }
      >
        <input
          id="bilik"
          type="range"
          min={0}
          max={MAX_BILIK}
          step={1}
          value={rules.bilik}
          onChange={(e) => set({ ...rules, bilik: Number(e.target.value) })}
          aria-valuetext={fill(
            locale === 'id' ? '{n} bilik dari {max} ruang dalam' : '{n} bilik of {max} interior ruang',
            { n: String(rules.bilik), max: String(interior) },
          )}
          className="h-control w-full accent-bolu"
        />
        {rules.bilik >= interior ? (
          <p className="mt-2 text-body text-rara">
            {locale === 'id'
              ? 'Lanjar belakang sudah penuh.'
              : 'The rear lanjar is full.'}{' '}
            <span className="text-muted">
              {locale === 'id' ? 'Tambah ruang untuk menambah bilik.' : 'Add ruang to add bilik.'}
            </span>
          </p>
        ) : null}
      </Field>
    </RailSection>
  )
}
