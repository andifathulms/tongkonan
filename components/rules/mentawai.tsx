'use client'

/**
 * The uma's rules.
 *
 * The stepper counts households, and its readout says the share each one gets
 * — which is the same number for every one of them, and is the point of the
 * building rather than a detail of it.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_KELUARGA, MIN_KELUARGA, SERAMBI } from '@/lib/tradition/mentawai/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/mentawai/address'
import { resolveLayout } from '@/lib/tradition/mentawai/frame'
import type { Rules } from '@/lib/tradition/mentawai/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function MentawaiControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Rumah tangga' : 'Households'}
        value={String(rules.keluarga)}
        hint={
          locale === 'id'
            ? 'Berapa rumah tangga berbagi rumah ini. Menambah satu menambah satu perapian dan satu bagian lantai yang sama besarnya — tidak ada yang lebih besar, dan tidak ada ujung yang lebih tinggi kedudukannya.'
            : 'How many households share this house. Adding one adds a hearth and a share of floor the same size as everybody else’s — none larger, and no end that ranks higher.'
        }
      >
        <Stepper
          min={MIN_KELUARGA}
          max={MAX_KELUARGA}
          value={rules.keluarga}
          onChange={(n) => set({ ...rules, keluarga: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `bagian ${(layout.households[0]?.share ?? 0).toFixed(2)} m masing-masing · panjang ${(layout.halfZ * 2).toFixed(1)} m`
            : `${(layout.households[0]?.share ?? 0).toFixed(2)} m each · ${(layout.halfZ * 2).toFixed(1)} m long`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Serambi' : 'Verandas'}>
        <div className="flex flex-col gap-px">
          {SERAMBI.map((o) => (
            <Choice
              key={o.serambi}
              name="serambi"
              value={o.serambi}
              checked={rules.serambi === o.serambi}
              onSelect={() => set({ ...rules, serambi: o.serambi })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.serambi === o.serambi ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.serambi === o.serambi ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Ruangnya berjenjang dari sungai ke belakang, dan jenjang itu mengikuti apa yang dikerjakan — bukan siapa yang mengerjakannya.'
            : 'The space is graded from the river inward, and the grade follows what is being done — not who is doing it.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.jaraik}
        onChange={(v) => set({ ...rules, jaraik: v })}
        label={locale === 'id' ? 'Jaraik' : 'The jaraik'}
        hint={
          locale === 'id'
            ? `Papan berukir yang tergantung di serambi depan, membawa catatan perburuan seluruh rumah. Ukirannya sendiri tidak dimodelkan. Bentangnya ${DIMS.jaraikWidth.value.toFixed(2)} m.`
            : `The carved board hanging in the front veranda, carrying the record of the whole house’s hunting. The carving itself is not modelled. It is ${DIMS.jaraikWidth.value.toFixed(2)} m across.`
        }
      />
    </RailSection>
  )
}
