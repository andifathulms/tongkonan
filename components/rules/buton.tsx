'use client'

/**
 * The malige's rules.
 *
 * The bracket control is the one to read carefully: it is a rank, and turning
 * it down does not make a smaller malige — it makes a building that does not
 * project at all. Its readout says how far the topmost floor stands outside
 * the frame against what an arm can reach, because that is the limit the whole
 * house runs into.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_TINGKAT, MIN_TINGKAT, PALE } from '@/lib/tradition/buton/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/buton/address'
import { resolveLayout } from '@/lib/tradition/buton/frame'
import type { Rules } from '@/lib/tradition/buton/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function ButonControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const base = layout.storeys[0]
  const top = layout.storeys[layout.storeys.length - 1]
  const span = (top?.halfX ?? 0) - (base?.halfX ?? 0)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Tingkat' : 'Storeys'}
        value={String(rules.tingkat)}
        hint={
          locale === 'id'
            ? 'Berapa tingkat yang berdiri, dan tiap tingkat lebih lebar daripada tingkat di bawahnya. Menambah satu tingkat menambah satu langkah keluar, jadi kendali ini bukan hanya menambah tinggi.'
            : 'How many storeys stand, each wider than the one below. Adding a storey adds a step outward, so this control does more than make the building taller.'
        }
      >
        <Stepper
          min={MIN_TINGKAT}
          max={MAX_TINGKAT}
          value={rules.tingkat}
          onChange={(n) => set({ ...rules, tingkat: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `bawah ${((base?.halfX ?? 0) * 2).toFixed(2)} m · atas ${((top?.halfX ?? 0) * 2).toFixed(2)} m · ${span.toFixed(2)} m di luar rangka`
            : `${((base?.halfX ?? 0) * 2).toFixed(2)} m at the bottom · ${((top?.halfX ?? 0) * 2).toFixed(2)} m at the top · ${span.toFixed(2)} m outside the frame`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Pale' : 'Bracket arms'}>
        <div className="flex flex-col gap-px">
          {PALE.map((o) => (
            <Choice
              key={o.pale}
              name="pale"
              value={o.pale}
              checked={rules.pale === o.pale}
              onSelect={() => set({ ...rules, pale: o.pale })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.pale === o.pale ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.pale === o.pale ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `jangkauan sebuah lengan ${layout.reach.toFixed(2)} m`
            : `an arm reaches ${layout.reach.toFixed(2)} m`}
        </p>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Banyaknya lengan adalah kedudukan, dan lengan itulah yang memikul tritisan — jadi kedudukan menetapkan seberapa jauh orang boleh membangun keluar.'
            : 'The number of arms is standing, and the arms carry the projection — so rank decides how far you may build outward.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.anjungan}
        onChange={(v) => set({ ...rules, anjungan: v })}
        label={locale === 'id' ? 'Anjungan' : 'The projecting room'}
        hint={
          locale === 'id'
            ? 'Ruang yang menjorok di muka tingkat teratas — satu-satunya bagian yang menjulur lebih jauh lagi pada bangunan yang setiap tingkatnya sudah menjulur. Rumah tanpa pale tidak memilikinya.'
            : 'A room projecting from the front of the topmost storey — the one part that reaches out further still on a building already reaching out at every level. A house with no pale does not carry one.'
        }
      />
    </RailSection>
  )
}
