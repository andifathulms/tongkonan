'use client'

/**
 * The tanean lanjang's rules.
 *
 * The stepper counts households, and its readout says what each one costs in
 * yard: this is the only control in the project where adding one increases the
 * amount of *empty* ground, because the empty ground is the room.
 */

import { COPY, pick } from '@/lib/i18n'
import { BENTUK, DIMS, MAX_RUMAH, MIN_RUMAH } from '@/lib/tradition/madura/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/madura/address'
import { resolveLayout } from '@/lib/tradition/madura/frame'
import type { Rules } from '@/lib/tradition/madura/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function MaduraControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const area = layout.yard.halfX * 2 * layout.yard.halfZ * 2

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Rumah' : 'Houses'}
        value={String(rules.rumah)}
        hint={
          locale === 'id'
            ? 'Rumah induk di ujung barat, lalu satu rumah untuk tiap anak perempuan yang menikah, ke arah timur menurut urutan lahir. Menambah satu tidak menggeser yang sudah berdiri: yang bertambah adalah halamannya.'
            : 'The parent household at the west end, then one house for each married daughter, eastward in order of birth. Adding one moves none of those already standing: what grows is the yard.'
        }
      >
        <Stepper min={MIN_RUMAH} max={MAX_RUMAH} value={rules.rumah} onChange={(n) => set({ ...rules, rumah: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `tanean ${(layout.yard.halfZ * 2).toFixed(1)} m · ${area.toFixed(0)} m² ruang bersama`
            : `a ${(layout.yard.halfZ * 2).toFixed(1)} m tanean · ${area.toFixed(0)} m² of shared room`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Bentuk atap' : 'Roof form'}>
        <div className="flex flex-col gap-px">
          {BENTUK.map((o) => (
            <Choice
              key={o.bentuk}
              name="bentuk"
              value={o.bentuk}
              checked={rules.bentuk === o.bentuk}
              onSelect={() => set({ ...rules, bentuk: o.bentuk })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.bentuk === o.bentuk ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.riseKey].value.toFixed(2)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.bentuk === o.bentuk ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Pilihan ini berlaku untuk seluruh deret sekaligus, sebab rumah-rumah satu tanean adalah rumah yang sama diulang.'
            : 'This choice applies to the whole row at once, because the houses of one tanean are the same house repeated.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.dapur}
        onChange={(v) => set({ ...rules, dapur: v })}
        label={locale === 'id' ? 'Deret dapur' : 'The kitchen row'}
        hint={
          locale === 'id'
            ? 'Dapur di seberang tanean, menghadap kembali ke halaman. Biasanya dibangun jauh belakangan, dan matikan saja untuk melihat susunan pada tahun-tahun awalnya.'
            : 'Kitchens across the tanean, facing back into the yard. Usually built much later — turn it off to see the arrangement in its early years.'
        }
      />
    </RailSection>
  )
}
