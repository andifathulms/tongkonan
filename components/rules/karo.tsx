'use client'

/**
 * The siwaluh jabu's rules.
 *
 * The stepper counts households and adds no rooms, which is the opposite of
 * what the betang's does with the same kind of number — so the readout under
 * it says what the count actually changes: places and hearths, not walls.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_JABU, MIN_JABU, PINTU } from '@/lib/tradition/karo/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/karo/address'
import { resolveLayout } from '@/lib/tradition/karo/frame'
import type { Rules } from '@/lib/tradition/karo/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function KaroControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Jabu' : 'Households'}
        value={String(rules.jabu)}
        hint={
          locale === 'id'
            ? 'Berapa rumah tangga berbagi ruang ini. Delapan adalah nama bangunannya. Tidak seperti cacah pada rumah betang, angka ini tidak menambah bilik: ruangnya tetap satu ruang, dan yang bertambah adalah tempat yang ditandai di dalamnya serta tungku yang dipakai berdua. Rumah tangga datang berpasangan karena satu tungku dipakai berdua.'
            : 'How many households share this room. Eight is the name of the building. Unlike the tally on a rumah betang, this number adds no rooms: the room stays one room, and what grows is the number of places marked out in it and the hearths shared between pairs. Households come in twos because a hearth is shared by two.'
        }
      >
        <Stepper min={MIN_JABU} max={MAX_JABU} step={2} value={rules.jabu} onChange={(n) => set({ ...rules, jabu: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${layout.hearths.length} tungku · ruang ${layout.length.toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m · 0 sekat`
            : `${layout.hearths.length} hearths · a ${layout.length.toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m room · 0 partitions`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Pintu' : 'Doors'}>
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
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{o.name}</span>
                <span className="num shrink-0 text-meta">{o.count}</span>
              </span>
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
      </Choices>

      <Toggle
        checked={rules.tersek}
        onChange={(v) => set({ ...rules, tersek: v })}
        label={locale === 'id' ? 'Tersek' : 'Upper gable tier'}
        hint={
          locale === 'id'
            ? `Atap kedua setinggi ${DIMS.tersekRise.value.toFixed(1)} m di atas ujung pangkal. Ia tidak menaungi apa pun yang belum ternaungi: yang dikerjakannya hanya membuat ujung yang tertua lebih tinggi — satu-satunya hal di luar bangunan ini yang menyebut apa pun tentang orang di dalamnya.`
            : `A second roof ${DIMS.tersekRise.value.toFixed(1)} m above the root end. It shelters nothing that is not already sheltered: what it does is make the senior end taller — the only thing on the outside of this building that says anything about the people inside it.`
        }
      />
    </RailSection>
  )
}
