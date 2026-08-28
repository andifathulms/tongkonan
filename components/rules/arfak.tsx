'use client'

/**
 * The rumah kaki seribu's rules.
 *
 * The leg control is the only one in this project whose readout is a *count of
 * something the reader did not ask for*: you set how many legs stand across
 * the width, and the rail tells you how many legs that is altogether. That is
 * the right way round for this house — the total is a consequence of the
 * spacing and the size, and the building is named for the total.
 *
 * It also prints the number of diagonals, which is always zero. A figure that
 * never changes is normally noise; here it is the claim, and it sits beside
 * the leg count so the two can be read together.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, HUNI, MAX_KAKI, MAX_RUANG, MIN_KAKI, MIN_RUANG } from '@/lib/tradition/arfak/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/arfak/address'
import { resolveLayout } from '@/lib/tradition/arfak/frame'
import type { Rules } from '@/lib/tradition/arfak/types'
import { Choice, Choices, Field, Stepper } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function ArfakControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  // The total is a consequence, so it is read off the layout rather than
  // recomputed here — one description, as everywhere else.
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Penghuni' : 'Who lives in it'}>
        <div className="flex flex-col gap-px">
          {HUNI.map((h) => (
            <Choice
              key={h.huni}
              name="huni"
              value={h.huni}
              checked={rules.huni === h.huni}
              onSelect={() => set({ ...rules, huni: h.huni })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.huni === h.huni ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{h.name}</span>
                <span className="num shrink-0 text-meta">{h.divided ? '2' : '—'}</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.huni === h.huni ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? h.glossId : h.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Tidak terbaca dari luar: kedua rumah itu sama saja dari jalan, dan yang berubah ada di dalamnya.'
            : 'Not legible from outside: the two are the same building from the road, and what changes is inside.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Kaki melintang' : 'Legs across'}
        value={String(rules.kaki)}
        hint={
          locale === 'id'
            ? 'Berapa kaki berdiri melintang badan rumah. Jarak antar kaki mengikuti dari angka ini, dan jumlah seluruhnya mengikuti dari jarak itu — jadi yang Anda tetapkan adalah kerapatannya dan yang Anda dapatkan adalah jumlahnya. Rumah ini dinamai dari jumlah itu.'
            : 'How many legs stand across the body. The spacing follows from this figure and the total follows from the spacing — so what you set is the density and what you get is the count. The house is named for that count.'
        }
      >
        <Stepper min={MIN_KAKI} max={MAX_KAKI} value={rules.kaki} onChange={(n) => set({ ...rules, kaki: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${layout.legs.length} kaki · 0 diagonal · tiap kaki ${(DIMS.legSection.value * 1000).toFixed(0)} mm`
            : `${layout.legs.length} legs · 0 diagonals · each ${(DIMS.legSection.value * 1000).toFixed(0)} mm`}
        </p>
        <p className="mt-1 text-body text-muted">
          {locale === 'id'
            ? 'Nolnya bukan kebetulan. Tidak ada satu pun kaki yang diikat pada kaki lain: ketika tanah bergoyang, seluruhnya ikut bergoyang. Omo Nias menjawab persoalan yang sama dengan menyegitigakan setiap petaknya.'
            : 'The zero is not incidental. Not one leg is tied to another: when the ground moves, the whole thing moves with it. The Nias omo answers the same problem by triangulating every bay.'}
        </p>
      </Field>

      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Bays'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Panjang rumah dalam ruang. Lebarnya tetap; hanya panjangnya yang berubah — dan kaki bertambah mengikutinya, karena jumlah kaki adalah akibat luas dan kerapatan.'
            : 'How many bays long. The width is fixed; only the length changes — and the legs multiply with it, because the leg count is a consequence of area and density.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
      </Field>
    </RailSection>
  )
}
