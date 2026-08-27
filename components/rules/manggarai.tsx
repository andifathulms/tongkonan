'use client'

/**
 * The mbaru niang's rules, and there are two of them.
 *
 * Every other set in this project has three, and the rail was built around
 * that without anyone deciding it. Two fits: the section simply has two
 * controls in it, and the fact that the five levels are canon rather than a
 * choice is stated in the note under them instead of being smuggled in as a
 * disabled control.
 *
 * The household stepper says what the number does to the building rather than
 * only naming it, because the number does four things at once — partitions,
 * ring posts, rafters and the mesh itself all divide by it. That is not
 * incidental; it is what makes the house repeat every one segment.
 *
 * The role is a pair of radio options whose difference is invisible from
 * outside. The gloss has to carry that, since the model cannot.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_KELUARGA, MIN_KELUARGA, PERAN } from '@/lib/tradition/manggarai/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/manggarai/address'
import type { Rules } from '@/lib/tradition/manggarai/types'
import { Choice, Choices, Field } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

const HOUSEHOLDS = Array.from(
  { length: MAX_KELUARGA - MIN_KELUARGA + 1 },
  (_, i) => MIN_KELUARGA + i,
)

export function ManggaraiControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const rafters = rules.keluarga * Math.round(DIMS.raftersPerSegment.value)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Peran' : 'Role'}>
        <div className="flex flex-col gap-px">
          {PERAN.map((info) => (
            <Choice
              key={info.peran}
              name="peran"
              value={info.peran}
              checked={rules.peran === info.peran}
              onSelect={() => set({ ...rules, peran: info.peran })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.peran === info.peran ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{info.name}</span>
                <span className="num shrink-0 text-meta">
                  {info.drum ? (locale === 'id' ? 'bergendang' : 'with drum') : '—'}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.peran === info.peran ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.peran === info.peran ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.oneGendang.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Bedanya ada di dalam, bukan pada bentuknya. Setiap mbaru niang adalah bangunan yang sama; satu di antaranya memegang gendang.'
            : 'The difference is inside rather than in the form. Every mbaru niang is the same building; one of them holds the drum.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Keluarga' : 'Households'}
        value={String(rules.keluarga)}
        hint={
          locale === 'id'
            ? 'Lantai hunian dibagi menjadi juring, satu untuk tiap keluarga, mengelilingi satu tungku di tengah. Jumlahnya menentukan sekat, tiang cincin, dan kasau sekaligus — dan karena itulah rumah ini berulang persis setiap satu juring.'
            : 'The living floor is divided into segments, one per household, around a single hearth at the centre. The number sets the partitions, the ring posts and the rafters together — which is why this house repeats exactly every one segment.'
        }
      >
        <div className="flex gap-px">
          {HOUSEHOLDS.map((n) => (
            <Choice
              key={n}
              name="keluarga"
              value={String(n)}
              checked={n === rules.keluarga}
              onSelect={() => set({ ...rules, keluarga: n })}
              face={[
                'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                n === rules.keluarga ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
              ].join(' ')}
            >
              {n}
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `${rules.keluarga} sekat · ${rules.keluarga} tiang cincin · ${rafters} kasau · berulang setiap ${(360 / rules.keluarga).toFixed(0)}°`
            : `${rules.keluarga} partitions · ${rules.keluarga} ring posts · ${rafters} rafters · repeats every ${(360 / rules.keluarga).toFixed(0)}°`}
        </p>
      </Field>

      {/*
        Said here rather than offered as a control, because it is not one. The
        other three packs each have a third rule; this house has two, and the
        thing that would have been the third is canon.
      */}
      <p className="text-body text-muted">
        {locale === 'id'
          ? 'Kelima tingkat tidak bisa diubah. Jumlahnya kanon — lutur, lobo, lentar, lempa rae, hekang kode — dan itulah sebabnya rumah ini hanya punya dua aturan sementara tiga rumah lainnya punya tiga.'
          : 'The five levels are not adjustable. Their number is canon — lutur, lobo, lentar, lempa rae, hekang kode — which is why this house has two rules where the other three have three.'}
      </p>
    </RailSection>
  )
}
