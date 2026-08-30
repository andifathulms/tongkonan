'use client'

/**
 * The sasadu's rules.
 *
 * The doorway control is the one to read carefully: it is not a count of
 * openings so much as a count of the kinds of person the building tells apart
 * on the way in — and its readout is the two heights, because those are what
 * the distinction is made of.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_BENTANG, MIN_BENTANG, PINTU } from '@/lib/tradition/sahu/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sahu/address'
import { resolveLayout, seats } from '@/lib/tradition/sahu/frame'
import type { Rules } from '@/lib/tradition/sahu/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function SahuControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const heads = layout.doors.map((d) => d.head)
  const highest = Math.max(...heads)
  const lowest = Math.min(...heads)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Bentang' : 'Bays'}
        value={String(rules.bentang)}
        hint={
          locale === 'id'
            ? 'Berapa bentang panjang balainya. Panjangnya adalah jumlah orang yang harus dapat duduk makan bersama sekaligus — hitungan orang yang menghasilkan sebuah ruangan.'
            : 'How many bays long the hall is. Its length is the number of people who have to be able to sit down and eat together at once — a headcount that produces a room.'
        }
      >
        <Stepper
          min={MIN_BENTANG}
          max={MAX_BENTANG}
          value={rules.bentang}
          onChange={(n) => set({ ...rules, bentang: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${seats(layout)} orang duduk · panjang ${(layout.halfZ * 2).toFixed(1)} m`
            : `${seats(layout)} people seated · ${(layout.halfZ * 2).toFixed(1)} m long`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Bukaan' : 'Openings'}>
        <div className="flex flex-col gap-px">
          {PINTU.map((o) => (
            <Choice
              key={o.pintu}
              name="pintu"
              value={o.pintu}
              checked={rules.pintu === o.pintu}
              onSelect={() => set({ ...rules, pintu: o.pintu })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.pintu === o.pintu ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.pintu === o.pintu ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${(highest * 100).toFixed(0)} cm sampai ${(lowest * 100).toFixed(0)} cm · orang berdiri ${(layout.body.standing * 100).toFixed(0)} cm`
            : `${(highest * 100).toFixed(0)} cm down to ${(lowest * 100).toFixed(0)} cm · a standing adult is ${(layout.body.standing * 100).toFixed(0)} cm`}
        </p>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Tidak ada yang cukup tinggi untuk dilewati dengan tegak: yang dibedakan oleh tinggi bukaan adalah seberapa dalam membungkuknya, bukan siapa yang harus.'
            : 'None of them is tall enough to walk through upright: what the heights distinguish is how far you bow, not who has to.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.kain}
        onChange={(v) => set({ ...rules, kain: v })}
        label={locale === 'id' ? 'Kain merah putih' : 'The red and white cloths'}
        hint={
          locale === 'id'
            ? 'Dua helai kain diikatkan pada kusen bukaan tamu. Kain yang sesungguhnya jauh lebih banyak daripada dua helai ini.'
            : 'Two cloths tied to the jambs of the guests’ opening. A real sasadu carries far more of them than two.'
        }
      />
    </RailSection>
  )
}
