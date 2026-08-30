'use client'

/**
 * The rumah kebaya's rules.
 *
 * The stepper counts rooms, and its readout is how much room is left to the
 * boundary — because on this house that is the number that runs out, and it is
 * the only control in the project whose limit belongs to a neighbour.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, LETAK, MAX_KAMAR, MIN_KAMAR } from '@/lib/tradition/betawi/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/betawi/address'
import { resolveLayout } from '@/lib/tradition/betawi/frame'
import type { Rules } from '@/lib/tradition/betawi/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function BetawiControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const reach = layout.house.halfX + DIMS.eaveOversail.value
  const limit = layout.plot.halfX - DIMS.sideMargin.value

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Kamar' : 'Rooms'}
        value={String(rules.kamar)}
        hint={
          locale === 'id'
            ? 'Berapa kamar di belakang ruang muka. Tiap kamar melebarkan rumah, dan rumah yang melebar berjalan ke arah garis batas kavling — batas yang digambar orang lain.'
            : 'How many rooms sit behind the front room. Each one makes the house wider, and a wider house walks toward the boundary of the plot — a line drawn by somebody else.'
        }
      >
        <Stepper min={MIN_KAMAR} max={MAX_KAMAR} value={rules.kamar} onChange={(n) => set({ ...rules, kamar: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `tritisan sampai ${reach.toFixed(2)} m · boleh sampai ${limit.toFixed(2)} m · sisa ${layout.margin.toFixed(2)} m`
            : `the eave reaches ${reach.toFixed(2)} m · anything may reach ${limit.toFixed(2)} m · ${layout.margin.toFixed(2)} m left`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Letak kavling' : 'Where the plot is'}>
        <div className="flex flex-col gap-px">
          {LETAK.map((o) => (
            <Choice
              key={o.letak}
              name="letak"
              value={o.letak}
              checked={rules.letak === o.letak}
              onSelect={() => set({ ...rules, letak: o.letak })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.letak === o.letak ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.key].value.toFixed(1)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.letak === o.letak ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Keduanya diukur terhadap jalan, sebab yang menempatkan rumah ini adalah jalan dan bukan kerabat.'
            : 'Both are measured against the road, because what places this house is a road rather than kin.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.gigiBalang}
        onChange={(v) => set({ ...rules, gigiBalang: v })}
        label={locale === 'id' ? 'Gigi balang' : 'Gigi balang'}
        hint={
          locale === 'id'
            ? 'Papan berukir di sepanjang tepi atap, dipaku terakhir. Ukirannya sendiri tidak dimodelkan — di sini ia papan polos, seperti semua ukiran dalam projek ini.'
            : 'The carved board along the eave, nailed on last. Its carving is not modelled — here it is a plain board, as all carving in this project is.'
        }
      />
    </RailSection>
  )
}
