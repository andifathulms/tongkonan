'use client'

/**
 * The joglo's three rules.
 *
 * The grade prints what it does — tiers of roof and rings of pillars — because
 * counting the roof from outside is counting the pillars inside, and the
 * reader should be told that once rather than left to notice it.
 *
 * The tumpang sari is a stepper over odd numbers only, and the control says
 * why: the count is a rank signal read by standing in the middle of the house
 * and looking up. It is the only control in this project whose effect is
 * mostly invisible from outside — the roof grows taller, but the thing being
 * counted is a ceiling — so the hint has to carry more than usual.
 *
 * The pendhapa is a checkbox and it is the third house's version of the switch
 * both other packs have. Absence is the statement, so the label says what not
 * having one means rather than only what having one adds.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_TUMPANG, MIN_TUMPANG, WUJUD, roofTiers, wujudInfo } from '@/lib/tradition/jawa/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/jawa/address'
import type { Rules } from '@/lib/tradition/jawa/types'
import { Choice, Choices, Field, Toggle, fill } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

/** Odd only, because odd is the rule. */
const TUMPANG = Array.from(
  { length: Math.floor((MAX_TUMPANG - MIN_TUMPANG) / 2) + 1 },
  (_, i) => MIN_TUMPANG + i * 2,
)

export function JawaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const w = wujudInfo(rules.wujud)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Wujud' : 'Grade'}>
        <div className="flex flex-col gap-px">
          {WUJUD.map((info) => (
            <Choice
              key={info.wujud}
              name="wujud"
              value={info.wujud}
              checked={rules.wujud === info.wujud}
              onSelect={() => set({ ...rules, wujud: info.wujud })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.wujud === info.wujud ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{info.name}</span>
                <span className="num shrink-0 text-meta">
                  {roofTiers(info)} · {info.rings}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.wujud === info.wujud ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.wujud === info.wujud ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.gradedSeries.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Jenjang atap · cincin tiang. Tiap jenjang atap adalah satu cincin tiang di bawahnya, jadi menghitung atap dari luar sama dengan menghitung tiang di dalam.'
            : 'Roof tiers · rings of pillars. Each tier of roof is a ring of pillars beneath it, so counting the roof from outside is counting the pillars inside.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Tumpang sari' : 'Tumpang sari'}
        value={`${rules.tumpang} ${locale === 'id' ? 'tingkat' : 'tiers'}`}
        hint={
          locale === 'id'
            ? 'Balok bertumpuk di atas soko guru, tiap tingkat menutup ke dalam dan naik. Jumlahnya ganjil, dan jumlah itu terbaca sebagai kedudukan — dibaca dari dalam rumah, dengan kepala mendongak, bukan dari halaman.'
            : 'Beams stacked over the soko guru, each tier closing inward and rising. The count is odd, and it reads as standing — read from inside the house with your head back, not from the yard.'
        }
      >
        <div className="flex gap-px">
          {TUMPANG.map((n) => (
            <Choice
              key={n}
              name="tumpang"
              value={String(n)}
              checked={n === rules.tumpang}
              onSelect={() => set({ ...rules, tumpang: n })}
              face={[
                'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                n === rules.tumpang ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
              ].join(' ')}
            >
              {n}
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {fill(
            locale === 'id'
              ? 'Bentuk ini: {name}, {tiers} jenjang atap.'
              : 'This form: {name}, {tiers} tiers of roof.',
            { name: w.name, tiers: String(roofTiers(w)) },
          )}
        </p>
      </Field>

      <Toggle
        checked={rules.pendhapa}
        onChange={(v) => set({ ...rules, pendhapa: v })}
        label={locale === 'id' ? 'Pendhapa' : 'Pendhapa'}
        hint={
          locale === 'id'
            ? 'Pendopo terbuka di muka, tempat rumah tangga menerima orang di luar rumah tangga. Rumah tanpa pendhapa bukan rumah yang lebih kecil; ia rumah yang tidak menyatakan itu tentang dirinya.'
            : 'The open pavilion in front, where the household meets people who are not the household. A house without one is not a smaller house; it is a house that does not say that about itself.'
        }
      />
    </RailSection>
  )
}
