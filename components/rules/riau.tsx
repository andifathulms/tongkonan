'use client'

/**
 * The balai's rules.
 *
 * The readouts to watch are the two heights under the bay stepper: the fall of
 * the aisle floor, and how much of a single step is left before it stops being
 * one. That margin is the whole limit of this building.
 */

import { COPY, pick } from '@/lib/i18n'
import { ANJUNG, DIMS, MAX_RUANG, MIN_RUANG } from '@/lib/tradition/riau/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/riau/address'
import { resolveLayout } from '@/lib/tradition/riau/frame'
import type { Rules } from '@/lib/tradition/riau/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function RiauControls({ query, onChange, locale }: RuleControlProps) {
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
            ? 'Berapa ruang panjang balainya — dan sepanjang itu pula kedua selaso di sisinya, sebab jalan lewat harus lapang dari ujung ke ujung.'
            : 'How many bays long the hall is — and the two selaso beside it run the same length, because a way through has to be clear end to end.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `panjang ${(layout.middle.halfZ * 2).toFixed(1)} m · jatuh ${(layout.drop.fall * 100).toFixed(0)} cm dari ${(layout.drop.step * 100).toFixed(0)} cm satu langkah`
            : `${(layout.middle.halfZ * 2).toFixed(1)} m long · a ${(layout.drop.fall * 100).toFixed(0)} cm fall of a ${(layout.drop.step * 100).toFixed(0)} cm step`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Anjung' : 'Anjung'}>
        <div className="flex flex-col gap-px">
          {ANJUNG.map((o) => (
            <Choice
              key={o.anjung}
              name="anjung"
              value={o.anjung}
              checked={rules.anjung === o.anjung}
              onSelect={() => set({ ...rules, anjung: o.anjung })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.anjung === o.anjung ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.anjung === o.anjung ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `Anjung naik ${(DIMS.anjungRise.value * 100).toFixed(0)} cm dan berada di luar ruang tengah: lantai ruangnya sendiri tetap satu bidang.`
            : `An anjung rises ${(DIMS.anjungRise.value * 100).toFixed(0)} cm and sits outside the middle room: the room’s own floor stays one plane.`}
        </p>
      </Choices>

      <Toggle
        checked={rules.pelantar}
        onChange={(v) => set({ ...rules, pelantar: v })}
        label={locale === 'id' ? 'Pelantar' : 'The rear deck'}
        hint={
          locale === 'id'
            ? 'Lantai terbuka di belakang, setinggi selaso — bukan setinggi ruang tengah. Yang di luar ruang tetap di tinggi jalan lewat.'
            : 'An open floor at the back, at the level of the selaso rather than of the middle room. What is outside the room stays at the height of the way through.'
        }
      />
    </RailSection>
  )
}
