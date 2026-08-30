'use client'

/**
 * The ume kbubu's rules.
 *
 * The stepper counts harvests, and its readout says where the top of the seed
 * lands against the band of smoke that has to reach it — because that is the
 * limit this building runs into, and it is a limit on the crop rather than on
 * the carpentry.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, DINDING, MAX_SIMPANAN, MIN_SIMPANAN } from '@/lib/tradition/atoni/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/atoni/address'
import { resolveLayout } from '@/lib/tradition/atoni/frame'
import type { Rules } from '@/lib/tradition/atoni/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function AtoniControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const seedTop = layout.loft.y + layout.loft.depth

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Simpanan' : 'Harvests kept'}
        value={String(rules.simpanan)}
        hint={
          locale === 'id'
            ? 'Berapa panen benih yang disimpan rumah tangga ini terhadap tahun yang buruk. Ini satu-satunya ukuran dalam projek ini yang berasal dari lamanya waktu: yang diukurnya adalah seberapa jauh ke depan sebuah keluarga bersiap.'
            : 'How many harvests of seed this household keeps against a bad year. It is the only size in this project taken from a length of time: what it measures is how far ahead a family is prepared.'
        }
      >
        <Stepper
          min={MIN_SIMPANAN}
          max={MAX_SIMPANAN}
          value={rules.simpanan}
          onChange={(n) => set({ ...rules, simpanan: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `benih setebal ${layout.loft.depth.toFixed(2)} m · puncaknya ${seedTop.toFixed(2)} m · asap sampai ${layout.smoke.to.toFixed(2)} m`
            : `${layout.loft.depth.toFixed(2)} m of seed · its top at ${seedTop.toFixed(2)} m · smoke reaches ${layout.smoke.to.toFixed(2)} m`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Kaki atap' : 'The foot of the roof'}>
        <div className="flex flex-col gap-px">
          {DINDING.map((o) => (
            <Choice
              key={o.dinding}
              name="dinding"
              value={o.dinding}
              checked={rules.dinding === o.dinding}
              onSelect={() => set({ ...rules, dinding: o.dinding })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.dinding === o.dinding ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.key].value.toFixed(2)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.dinding === o.dinding ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `pintu ${(layout.door.height * 100).toFixed(0)} cm · jendela 0`
            : `a ${(layout.door.height * 100).toFixed(0)} cm door · 0 windows`}
        </p>
      </Choices>

      <Toggle
        checked={rules.lopo}
        onChange={(v) => set({ ...rules, lopo: v })}
        label={locale === 'id' ? 'Lopo' : 'The lopo'}
        hint={
          locale === 'id'
            ? 'Bangunan bundar terbuka di halaman yang sama: tanpa dinding, di atas tiang, beratap kerucut. Orang yang sama membangun sesuatu yang tidak boleh berangin dan sesuatu yang seluruhnya angin, berjarak beberapa meter.'
            : 'The round open building in the same yard: no walls, on posts, under a cone. The same people build a thing that must not ventilate and a thing that is nothing but ventilation, a few metres apart.'
        }
      />
    </RailSection>
  )
}
