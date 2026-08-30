'use client'

/**
 * The sudung's rules.
 *
 * The stepper counts the people who will sleep under it, and its readout says
 * how close that brings the longest pole to what anybody can carry — because
 * on this building those two numbers are the whole constraint, and they meet
 * sooner than anyone would expect.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, LAMA, MAX_ORANG, MIN_ORANG } from '@/lib/tradition/rimba/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/rimba/address'
import { resolveLayout } from '@/lib/tradition/rimba/frame'
import type { Rules } from '@/lib/tradition/rimba/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function RimbaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Orang' : 'People'}
        value={String(rules.orang)}
        hint={
          locale === 'id'
            ? 'Berapa orang yang tidur di bawahnya. Lantainya adalah barisan orang yang berbaring bersebelahan — satu-satunya ukuran tubuh dalam projek ini yang menetapkan denah, bukan tinggi.'
            : 'How many people sleep under it. The floor is a row of people lying side by side — the only body figure in this project that sets a plan rather than a height.'
        }
      >
        <Stepper min={MIN_ORANG} max={MAX_ORANG} value={rules.orang} onChange={(n) => set({ ...rules, orang: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `lantai ${(layout.floor.halfZ * 2).toFixed(2)} m · balok terpanjang ${layout.longest.toFixed(2)} m dari ${layout.carry.toFixed(2)} m`
            : `a ${(layout.floor.halfZ * 2).toFixed(2)} m floor · the longest pole ${layout.longest.toFixed(2)} m of a ${layout.carry.toFixed(2)} m limit`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Untuk berapa lama' : 'How long for'}>
        <div className="flex flex-col gap-px">
          {LAMA.map((o) => (
            <Choice
              key={o.lama}
              name="lama"
              value={o.lama}
              checked={rules.lama === o.lama}
              onSelect={() => set({ ...rules, lama: o.lama })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.lama === o.lama ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.key].value.toFixed(2)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.lama === o.lama ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Keduanya sementara. Yang berakhir bukan karena keputusan: ketika seseorang meninggal, keluarganya pergi dan sudungnya ditinggalkan berdiri.'
            : 'Both are temporary. What ends one is not a decision: when somebody dies the family leaves, and the shelter is left standing.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.panggung}
        onChange={(v) => set({ ...rules, panggung: v })}
        label={locale === 'id' ? 'Lantai panggung' : 'A raised platform'}
        hint={
          locale === 'id'
            ? 'Lantai batang belah setinggi sejengkal di atas tanah hutan. Matikan dan orang tidur langsung di atas tanah, yang juga dilakukan orang.'
            : 'A floor of split poles a hand’s breadth above the forest floor. Turn it off and people sleep on the ground, which is also done.'
        }
      />
    </RailSection>
  )
}
