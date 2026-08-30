'use client'

/**
 * The bade's rules.
 *
 * The stepper counts tiers and its rungs are odd, so it steps by two — the
 * first control in this project that cannot land on every number between its
 * ends. Its readout says what the count costs in height against the lattice
 * under it, because that is the limit it runs into: the tower is not stopped
 * by a member or a material but by the number of people who can carry it.
 */

import { COPY, pick } from '@/lib/i18n'
import { MAX_TUMPANG, MIN_TUMPANG, PEMIKUL } from '@/lib/tradition/bade/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/bade/address'
import { resolveLayout } from '@/lib/tradition/bade/frame'
import type { Rules } from '@/lib/tradition/bade/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function BadeControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Tingkat' : 'Tiers'}
        value={String(rules.tumpang)}
        hint={
          locale === 'id'
            ? 'Berapa tingkat tumpang yang berdiri di atas badannya, dan jumlah itu adalah kedudukan orang yang dibawa. Anak tangganya ganjil — satu, tiga, lima, tujuh, sembilan, sebelas — jadi angka genap naik satu. Tidak ada apa pun di bawah tingkat-tingkat ini kecuali udara.'
            : 'How many tiers stand over the body, and that number is the standing of the person being carried. The rungs are odd — one, three, five, seven, nine, eleven — so an even number moves up one. There is nothing under these tiers but air.'
        }
      >
        <Stepper
          min={MIN_TUMPANG}
          max={MAX_TUMPANG}
          step={2}
          value={rules.tumpang}
          onChange={(n) => set({ ...rules, tumpang: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `puncak ${layout.apexY.toFixed(2)} m · usungan ${(layout.frame.halfX * 2).toFixed(2)} m · ${(layout.apexY / layout.frame.halfX).toFixed(2)} kali setengah lebarnya`
            : `${layout.apexY.toFixed(2)} m to the apex · a ${(layout.frame.halfX * 2).toFixed(2)} m lattice · ${(layout.apexY / layout.frame.halfX).toFixed(2)} times its half-width`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Pemikul' : 'Bearers'}>
        <div className="flex flex-col gap-px">
          {PEMIKUL.map((o) => (
            <Choice
              key={o.pemikul}
              name="pemikul"
              value={o.pemikul}
              checked={rules.pemikul === o.pemikul}
              onSelect={() => set({ ...rules, pemikul: o.pemikul })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.pemikul === o.pemikul ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.pemikul === o.pemikul ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Kendali ini mengubah denah dengan menghitung orang, bukan ruang: sisi usungan adalah berapa banyak bahu yang dapat masuk ke bawahnya sekaligus.'
            : 'This control changes the plan by counting people rather than rooms: the side of the lattice is how many shoulders can get underneath at once.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.payung}
        onChange={(v) => set({ ...rules, payung: v })}
        label={locale === 'id' ? 'Payung' : 'The umbrella'}
        hint={
          locale === 'id'
            ? 'Payung di puncak, dipasang terakhir dan paling tinggi. Ia tidak menaungi apa pun dan tidak menahan apa pun — seperti tingkat-tingkat di bawahnya.'
            : 'An umbrella at the apex, fitted last and highest. It shelters nothing and carries nothing — like the tiers under it.'
        }
      />
    </RailSection>
  )
}
