'use client'

/**
 * The baileo's rules.
 *
 * The stepper counts clans, not rooms and not people, so its readout says what
 * a clan gets — a bay, a pair of posts, a seat — rather than a floor area. The
 * screen toggle is the one control in this project whose gloss has to explain
 * that turning something *on* is allowed to change nothing: a knee-high board
 * blocks no sight line, and the check that guards the openness is measured
 * against the eye of somebody sitting inside rather than against the board.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_SOA, MIN_SOA, PAMALI } from '@/lib/tradition/maluku/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/maluku/address'
import { resolveLayout } from '@/lib/tradition/maluku/frame'
import type { Rules } from '@/lib/tradition/maluku/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function MalukuControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Soa' : 'Soa'}
        value={String(rules.soa)}
        hint={
          locale === 'id'
            ? 'Berapa klan yang membentuk negeri ini. Satu-satunya cacah dalam projek ini yang menghitung sebuah masyarakat dan bukan sebuah rumah tangga: tiap soa mendapat satu petak lantai, sepasang tiang dan satu tempat duduk, dan tak satu pun dari ketiganya lebih besar daripada milik soa lain.'
            : 'How many clans make up this negeri. The only tally in this project that counts a community rather than a household: each soa gets one bay of floor, one pair of posts and one seat, and not one of the three is larger than another soa’s.'
        }
      >
        <Stepper min={MIN_SOA} max={MAX_SOA} value={rules.soa} onChange={(n) => set({ ...rules, soa: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `panjang ${layout.length.toFixed(1)} m · ${rules.soa * 2} tiang · ${rules.soa * 2} tempat duduk`
            : `${layout.length.toFixed(1)} m long · ${rules.soa * 2} posts · ${rules.soa * 2} seats`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Batu pamali' : 'The pamali stone'}>
        <div className="flex flex-col gap-px">
          {PAMALI.map((p) => (
            <Choice
              key={p.pamali}
              name="pamali"
              value={p.pamali}
              checked={rules.pamali === p.pamali}
              onSelect={() => set({ ...rules, pamali: p.pamali })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.pamali === p.pamali ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{p.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.pamali === p.pamali ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? p.glossId : p.glossEn}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Toggle
        checked={rules.sekat}
        onChange={(v) => set({ ...rules, sekat: v })}
        label={locale === 'id' ? 'Sekat rendah' : 'Low screen'}
        hint={
          locale === 'id'
            ? `Papan setinggi lutut di antara tiang, ${DIMS.screenHeight.value.toFixed(2)} m. Menyalakannya tidak menutup apa pun: keterbukaan bangunan ini diuji terhadap tinggi mata orang yang duduk di dalamnya, ${DIMS.seatedEye.value.toFixed(2)} m di atas lantai, dan bukan terhadap ada atau tidaknya papan.`
            : `A knee-high board between the posts, ${DIMS.screenHeight.value.toFixed(2)} m. Turning it on closes nothing: this building’s openness is tested against the eye height of somebody seated inside, ${DIMS.seatedEye.value.toFixed(2)} m above the floor, and not against the presence of boards.`
        }
      />
    </RailSection>
  )
}
