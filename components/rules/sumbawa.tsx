'use client'

/**
 * Dalam Loka's rules.
 *
 * There is no control for the post count, and that absence is the point: the
 * number is not the household's. What the controls offer is everything the
 * number leaves free — which way round the grid runs, how the inner part is
 * divided, and whether the walkway is built.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_BILIK, MIN_BILIK, SUSUNAN } from '@/lib/tradition/sumbawa/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sumbawa/address'
import { resolveLayout } from '@/lib/tradition/sumbawa/frame'
import type { Rules } from '@/lib/tradition/sumbawa/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function SumbawaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Susunan tiang' : 'The grid'}>
        <div className="flex flex-col gap-px">
          {SUSUNAN.map((o) => (
            <Choice
              key={o.susunan}
              name="susunan"
              value={o.susunan}
              checked={rules.susunan === o.susunan}
              onSelect={() => set({ ...rules, susunan: o.susunan })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.susunan === o.susunan ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {o.across} × {o.along}
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.susunan === o.susunan ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `99 tiang · denah ${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m`
            : `99 posts · a ${(layout.halfX * 2).toFixed(1)} × ${(layout.halfZ * 2).toFixed(1)} m plan`}
        </p>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Tidak ada kendali untuk jumlah tiangnya, dan ketiadaan itulah maksudnya: sembilan puluh sembilan bukan angka milik yang membangun. Yang tersisa untuk dipilih hanya arah gridnya.'
            : 'There is no control for the number of posts, and that absence is the point: ninety-nine is not the builders’ number. All that is left to choose is which way the grid runs.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Bilik' : 'Rooms'}
        value={String(rules.bilik)}
        hint={
          locale === 'id'
            ? 'Berapa bilik di bagian dalam, di belakang bala rea. Membaginya tidak mengubah rangkanya: sembilan puluh sembilan tiang tetap berdiri di tempat yang sama.'
            : 'How many rooms the inner part is divided into behind the bala rea. Dividing it changes nothing in the frame: the ninety-nine posts stand exactly where they stood.'
        }
      >
        <Stepper min={MIN_BILIK} max={MAX_BILIK} value={rules.bilik} onChange={(n) => set({ ...rules, bilik: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `jarak tiang ${layout.spacing.bay.toFixed(2)} m dari ${layout.spacing.limit.toFixed(2)} m bentang balok`
            : `posts ${layout.spacing.bay.toFixed(2)} m apart, of a ${layout.spacing.limit.toFixed(2)} m beam span`}
        </p>
      </Field>

      <Toggle
        checked={rules.serambi}
        onChange={(v) => set({ ...rules, serambi: v })}
        label={locale === 'id' ? 'Serambi' : 'The walkway'}
        hint={
          locale === 'id'
            ? `Serambi tertutup sepanjang ${DIMS.serambiReach.value.toFixed(1)} m ke bangunan di belakang, di atas tiangnya sendiri — dan tiang-tiang itu tidak ikut dihitung ke dalam sembilan puluh sembilan.`
            : `A ${DIMS.serambiReach.value.toFixed(1)} m covered walkway to the building behind, on posts of its own — and those posts are not counted into the ninety-nine.`
        }
      />
    </RailSection>
  )
}
