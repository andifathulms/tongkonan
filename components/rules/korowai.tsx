'use client'

/**
 * The khaim's rules.
 *
 * The height control is three named choices rather than a slider, and the
 * reason is on screen: each option's readout says what the tree has left at
 * that height. A slider would let a reader run the house up to a number the
 * wanbon under it cannot carry without ever seeing why it stopped being a
 * building.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_PERAPIAN, MIN_PERAPIAN, TINGGI } from '@/lib/tradition/korowai/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/korowai/address'
import { resolveLayout } from '@/lib/tradition/korowai/frame'
import type { Rules } from '@/lib/tradition/korowai/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function KorowaiControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Tinggi lantai' : 'Height of the floor'}>
        <div className="flex flex-col gap-px">
          {TINGGI.map((o) => (
            <Choice
              key={o.tinggi}
              name="tinggi"
              value={o.tinggi}
              checked={rules.tinggi === o.tinggi}
              onSelect={() => set({ ...rules, tinggi: o.tinggi })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.tinggi === o.tinggi ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">
                {o.name} · {DIMS[o.key].value.toFixed(1)} m
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.tinggi === o.tinggi ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="num mt-2 text-meta text-muted">
          {rules.pohon
            ? locale === 'id'
              ? `batang ${(layout.trunk.atFloor * 1000).toFixed(0)} mm di ketinggian itu · batas ${(layout.trunk.bearing * 1000).toFixed(0)} mm`
              : `${(layout.trunk.atFloor * 1000).toFixed(0)} mm of trunk at that height · limit ${(layout.trunk.bearing * 1000).toFixed(0)} mm`
            : locale === 'id'
              ? `${layout.posts.length} tiang tebang, tidak ada batang yang menipis ke atas`
              : `${layout.posts.length} cut poles, and nothing that thins as it rises`}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Perapian' : 'Hearths'}
        value={String(rules.perapian)}
        hint={
          locale === 'id'
            ? 'Satu perapian satu rumah tangga, dan lantai memanjang satu petak untuk tiap satunya. Jumlahnya genap karena lantainya dibagi dua sisi yang sama besar, dan tiap sisi punya tangganya sendiri.'
            : 'One hearth is one household, and the floor lengthens by a bay for each. The count is even because the floor is divided into two equal sides, and each side has its own ladder.'
        }
      >
        <Stepper
          min={MIN_PERAPIAN}
          max={MAX_PERAPIAN}
          step={2}
          value={rules.perapian}
          onChange={(n) => set({ ...rules, perapian: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `lantai ${(layout.floor.halfZ * 2).toFixed(1)} m · ${layout.hearths.length} lubang api`
            : `a ${(layout.floor.halfZ * 2).toFixed(1)} m floor · ${layout.hearths.length} fire openings`}
        </p>
      </Field>

      <Toggle
        checked={rules.pohon}
        onChange={(v) => set({ ...rules, pohon: v })}
        label={locale === 'id' ? 'Berdiri di atas pohon hidup' : 'Standing on a living tree'}
        hint={
          locale === 'id'
            ? 'Wanbon yang dipotong pucuknya setinggi lantai, akarnya tetap di tanah. Matikan dan rumah berdiri di atas tiang tebang: lebih banyak tiang, semuanya mulai lapuk sejak hari dipancang, dan tidak ada bagian bangunan yang masih tumbuh.'
            : 'A wanbon topped off at floor height, its roots still in the ground. Turn it off and the house stands on cut poles: more of them, every one rotting from the day it is set, and no part of the building still growing.'
        }
      />
    </RailSection>
  )
}
