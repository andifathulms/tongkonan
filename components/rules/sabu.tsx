'use client'

/**
 * The ammu hawu's rules.
 *
 * The stepper counts bays, and its readout is a proportion rather than a
 * length — because on this house the number that matters is length against
 * beam, and it is the one the tradition's claim turns on.
 */

import { COPY, pick } from '@/lib/i18n'
import { ATAP, DIMS, MAX_RUANG, MIN_RUANG } from '@/lib/tradition/sabu/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sabu/address'
import { resolveLayout } from '@/lib/tradition/sabu/frame'
import type { Rules } from '@/lib/tradition/sabu/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function SabuControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Bays'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Berapa ruang panjang lambungnya. Yang penting bukan panjangnya melainkan perbandingannya terhadap lebar: rumah ini menyebut dirinya perahu, dan denahnya harus memegang perbandingan lambung.'
            : 'How many bays long the hull is. What matters is not the length but its proportion to the beam: this house calls itself a boat, and its plan has to hold a hull’s proportion.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${layout.ratio.actual.toFixed(2)} : 1 · rentang lambung ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)}`
            : `${layout.ratio.actual.toFixed(2)} : 1 · a hull runs ${layout.ratio.least.toFixed(2)}–${layout.ratio.most.toFixed(2)}`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Daun atap' : 'The leaf on the roof'}>
        <div className="flex flex-col gap-px">
          {ATAP.map((o) => (
            <Choice
              key={o.atap}
              name="atap"
              value={o.atap}
              checked={rules.atap === o.atap}
              onSelect={() => set({ ...rules, atap: o.atap })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.atap === o.atap ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.atap === o.atap ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `atap turun sampai ${(layout.eaveY - layout.floorY).toFixed(2)} m di atas lantai`
            : `the roof comes down to ${(layout.eaveY - layout.floorY).toFixed(2)} m above the floor`}
        </p>
      </Choices>

      <Toggle
        checked={rules.duru}
        onChange={(v) => set({ ...rules, duru: v })}
        label={locale === 'id' ? 'Duru' : 'The duru'}
        hint={
          locale === 'id'
            ? `Loteng di atas ruang dalam, ${DIMS.duruY.value.toFixed(2)} m di atas lantai, tempat gula dan simpanan lontar digantung — atap lontar di atas simpanan lontar.`
            : `The loft over the inner room, ${DIMS.duruY.value.toFixed(2)} m above the floor, where the syrup and the lontar stores hang — a lontar roof over a lontar store.`
        }
      />
    </RailSection>
  )
}
