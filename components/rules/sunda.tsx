'use client'

/**
 * The imah's rules — and two of the three are unusual.
 *
 * The slope is a rule that nobody chooses: it is here because the prohibition
 * is what turns it into geometry, and the readout under it says what it costs
 * in metres of timber. The village rule is a choice between two undertakings
 * rather than two ranks, so its gloss has to say that the stricter one is not
 * the greater one.
 */

import { COPY, pick } from '@/lib/i18n'
import { LERENG, WILAYAH, slopeOf } from '@/lib/tradition/sunda/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sunda/address'
import { resolveLayout } from '@/lib/tradition/sunda/frame'
import type { Rules } from '@/lib/tradition/sunda/types'
import { Choice, Choices, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function SundaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const longest = layout.posts.reduce((m, p) => Math.max(m, p.length), 0)
  const shortest = layout.posts.reduce((m, p) => Math.min(m, p.length), Infinity)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Wilayah' : 'Village'}>
        <div className="flex flex-col gap-px">
          {WILAYAH.map((w) => (
            <Choice
              key={w.wilayah}
              name="wilayah"
              value={w.wilayah}
              checked={rules.wilayah === w.wilayah}
              onSelect={() => set({ ...rules, wilayah: w.wilayah })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.wilayah === w.wilayah ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{w.name}</span>
                <span className="num shrink-0 text-meta">
                  {w.doors} {locale === 'id' ? 'pintu' : w.doors === 1 ? 'door' : 'doors'}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.wilayah === w.wilayah ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? w.glossId : w.glossEn}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Choices legend={locale === 'id' ? 'Lereng' : 'The slope'}>
        <div className="flex flex-col gap-px">
          {LERENG.map((l) => (
            <Choice
              key={l.lereng}
              name="lereng"
              value={l.lereng}
              checked={rules.lereng === l.lereng}
              onSelect={() => set({ ...rules, lereng: l.lereng })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.lereng === l.lereng ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{l.name}</span>
                <span className="num shrink-0 text-meta">{(slopeOf(l.lereng) * 100).toFixed(0)}%</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.lereng === l.lereng ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? l.glossId : l.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        {/*
          The one rule in this project nobody chooses, so the note under it has
          to say why a control for it exists at all.
        */}
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `Tidak ada yang memilih kemiringan tanahnya. Ia ada di sini karena larangan untuk tidak meratakannya mengubahnya menjadi ukuran: tiang terpendek ${shortest.toFixed(2)} m, terpanjang ${longest.toFixed(2)} m, dan satu batang hanya memberi ${layout.poleLength.toFixed(2)} m.`
            : `Nobody chooses the slope of their ground. It is here because the prohibition against levelling it turns it into a dimension: the shortest post is ${shortest.toFixed(2)} m, the longest ${longest.toFixed(2)} m, and one pole gives only ${layout.poleLength.toFixed(2)} m.`}
        </p>
      </Choices>

      <Toggle
        checked={rules.sosoro}
        onChange={(v) => set({ ...rules, sosoro: v })}
        label={locale === 'id' ? 'Sosoro' : 'Front platform'}
        hint={
          locale === 'id'
            ? 'Bale-bale di muka tempat tamu diterima. Tamu berhenti di sini dan tidak masuk ke ruang dalam — dan bale-bale itu berdiri di sisi bawah lereng, tempat tiangnya paling panjang.'
            : 'The platform at the front where visitors are received. A visitor stops here and does not enter the inner room — and the platform stands at the downhill end, where the posts are longest.'
        }
      />
    </RailSection>
  )
}
