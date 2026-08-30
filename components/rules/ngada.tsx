'use client'

/**
 * The pairs' rules.
 *
 * The stepper counts clans and therefore pairs, and its readout says how long
 * the square gets: the length of a nua is a count of descent groups, the way a
 * betang's length is a count of households.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_PASANGAN, MIN_PASANGAN, TINGGI } from '@/lib/tradition/ngada/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/ngada/address'
import { resolveLayout } from '@/lib/tradition/ngada/frame'
import type { Rules } from '@/lib/tradition/ngada/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function NgadaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Pasangan' : 'Pairs'}
        value={String(rules.pasangan)}
        hint={
          locale === 'id'
            ? 'Satu pasangan untuk tiap klan: satu ngadhu dan satu bhaga, berhadapan di alun-alun. Kendali ini menambah dua benda sekaligus, sebab satu tanpa yang lain adalah pernyataan yang belum utuh.'
            : 'One pair to a clan: one ngadhu and one bhaga, facing each other in the square. This control adds two objects at a time, because one without the other is an unfinished statement.'
        }
      >
        <Stepper
          min={MIN_PASANGAN}
          max={MAX_PASANGAN}
          value={rules.pasangan}
          onChange={(n) => set({ ...rules, pasangan: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${rules.pasangan * 2} benda · nua ${(layout.nua.halfZ * 2).toFixed(1)} m`
            : `${rules.pasangan * 2} objects · a ${(layout.nua.halfZ * 2).toFixed(1)} m square`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Tinggi tiang' : 'Height of the post'}>
        <div className="flex flex-col gap-px">
          {TINGGI.map((o) => (
            <Choice
              key={o.tinggi}
              name="tinggi"
              value={o.tinggi}
              checked={rules.tinggi === o.tinggi}
              onSelect={() => set({ ...rules, tinggi: o.tinggi })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.tinggi === o.tinggi ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.key].value.toFixed(2)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.tinggi === o.tinggi ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `tertanam ${DIMS.ngadhuPlanted.value.toFixed(2)} m, dinyatakan dan tidak digambar`
            : `planted ${DIMS.ngadhuPlanted.value.toFixed(2)} m, declared and not drawn`}
        </p>
      </Choices>

      <Toggle
        checked={rules.ture}
        onChange={(v) => set({ ...rules, ture: v })}
        label={locale === 'id' ? 'Ture' : 'The stone platform'}
        hint={
          locale === 'id'
            ? 'Susunan batu di samping tiap pasangan, di tengah alun-alun.'
            : 'The stone platform beside each pair, in the middle of the square.'
        }
      />
    </RailSection>
  )
}
