'use client'

/**
 * The rumah limas's rules, and they are the first set here whose two controls
 * do genuinely different kinds of work.
 *
 * The kekijing choice changes what the household claims about its guests; the
 * width stepper changes nothing but size. That is the building's argument, so
 * the rail says it: the level control prints the sequence it produces, and the
 * width control prints — flatly — that it adds no distinctions. A reader who
 * moves one and then the other should be able to feel the difference before
 * reading a word of it.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_LEBAR, MIN_LEBAR, levelsFor } from '@/lib/tradition/palembang/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/palembang/address'
import type { Kekijing, Rules } from '@/lib/tradition/palembang/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

const OPTIONS: readonly Kekijing[] = [3, 5]

export function PalembangControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const levels = levelsFor(rules.kekijing)
  const rise = DIMS.stepRise.value * (rules.kekijing - 1)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Kekijing' : 'Kekijing'}>
        <div className="flex gap-px">
          {OPTIONS.map((n) => (
            <Choice
              key={n}
              name="kekijing"
              value={String(n)}
              checked={n === rules.kekijing}
              onSelect={() => set({ ...rules, kekijing: n })}
              face={[
                'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                n === rules.kekijing ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
              ].join(' ')}
            >
              {n}
            </Choice>
          ))}
        </div>
        {/*
          The names, in order, because the sequence is the rule. A reader
          switching from five to three should see which two distinctions the
          household stops making rather than watching a building shrink.
        */}
        <p className="mt-2 text-body text-muted">
          {levels.map((l) => (locale === 'id' ? l.nameId : l.nameEn)).join(' → ')}
        </p>
        <p className="num mt-1 text-meta text-muted">
          {`${rules.kekijing} × ${DIMS.stepRise.value.toFixed(2)} m · ${locale === 'id' ? 'naik' : 'rising'} ${rise.toFixed(2)} m`}
        </p>
        <p className="mt-1 text-body text-muted">
          {locale === 'id'
            ? 'Bukan besar-kecil. Rumah bertingkat tiga adalah rumah tangga dengan daftar tamu yang lebih pendek, bukan rumah bertingkat lima yang mengecil.'
            : 'Not a matter of size. A three-step house is a household with a shorter guest list, not a five-step house made smaller.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Lebar' : 'Width'}
        value={String(rules.lebar)}
        hint={
          locale === 'id'
            ? 'Jumlah ruang melintang. Sumbu inilah yang tidak membawa apa-apa: rumah yang lebih lebar hanyalah rumah yang lebih besar, dan tidak satu pun pembedaan bertambah karenanya. Justru karena itulah sumbu yang lain terbaca sebagai sosial.'
            : 'How many bays across. This is the axis that carries nothing: a wider house is only a larger house, and not one distinction is added by it. That is precisely what makes the other axis legible as social.'
        }
      >
        <Stepper min={MIN_LEBAR} max={MAX_LEBAR} value={rules.lebar} onChange={(n) => set({ ...rules, lebar: n })} />
        <p className="num mt-2 text-meta text-muted">
          {`${(DIMS.bayWidth.value * rules.lebar).toFixed(2)} m · ${locale === 'id' ? '0 pembedaan ditambahkan' : '0 distinctions added'}`}
        </p>
      </Field>

      <Toggle
        checked={rules.tenggalung}
        onChange={(v) => set({ ...rules, tenggalung: v })}
        label={locale === 'id' ? 'Kisi-kisi pagar tenggalung' : 'Lattice on the front gallery'}
        hint={
          locale === 'id'
            ? 'Galeri terdepan tempat rumah bertemu jalan, disekat kisi-kisi atau terbuka. Yang diubahnya adalah ambang, bukan urutan: yang di belakangnya sama saja. Kisi-kisi itu batang dan bukan bidang — sekat yang bisa dilihat tembus bukan dinding.'
            : 'The front gallery where the house meets the street, screened by its lattice or open. What it changes is the threshold, not the hierarchy: what lies behind is the same either way. The lattice is bars rather than a panel — a screen you can see through is not a wall.'
        }
      />
    </RailSection>
  )
}
