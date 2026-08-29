'use client'

/**
 * The woloan house's rules.
 *
 * The switch at the bottom is the one control in this project that turns off
 * the thing its building is *for*, so its gloss has to say what is gained by
 * turning it off — a better frame — and what is lost, which is the house's
 * ability to leave.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_RUANG, MIN_RUANG, TANGGA } from '@/lib/tradition/minahasa/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/minahasa/address'
import { resolveLayout, pieceAlong } from '@/lib/tradition/minahasa/frame'
import type { Rules } from '@/lib/tradition/minahasa/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function MinahasaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const longest = Math.max(...pieceAlong(layout).map((p) => p.length), layout.halfZ * 2)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Bays'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Panjang badan rumah, dalam ruang. Ini rumah yang dijual, jadi ukurannya adalah harga — dan garis ruang juga garis bongkarnya: satu ruang adalah satu panel dinding, satu petak lantai, dan satu ikat yang dinomori.'
            : 'The length of the body, in bays. This is a house that is sold, so its size is its price — and the bay line is also the line it comes apart on: one bay is one wall panel, one piece of floor, and one numbered bundle.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `panjang ${layout.length.toFixed(1)} m · batang terpanjang ${longest.toFixed(2)} m dari ${layout.haulLength.toFixed(2)} m`
            : `${layout.length.toFixed(1)} m long · longest piece ${longest.toFixed(2)} m of ${layout.haulLength.toFixed(2)} m`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Tangga' : 'Stairs'}>
        <div className="flex flex-col gap-px">
          {TANGGA.map((o) => (
            <Choice
              key={o.tangga}
              name="tangga"
              value={o.tangga}
              checked={rules.tangga === o.tangga}
              onSelect={() => set({ ...rules, tangga: o.tangga })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.tangga === o.tangga ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{o.name}</span>
                <span className="num shrink-0 text-meta">{o.count}</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.tangga === o.tangga ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Toggle
        checked={rules.pindah}
        onChange={(v) => set({ ...rules, pindah: v })}
        label={locale === 'id' ? 'Dibuat untuk pindah' : 'Built to be moved'}
        hint={
          locale === 'id'
            ? `Menyala: tiap batang terpotong pada garis ruang dan tidak ada yang lebih panjang daripada ${DIMS.haulLength.value.toFixed(1)} m, jadi rumahnya dapat dinomori, dilepas pasaknya, dan diangkut. Mati: rangkanya dipotong menurut bangunannya — batang lebih panjang, sambungan lebih sedikit, rumah yang lebih baik menurut setiap ukuran kecuali satu-satunya yang penting di sini.`
            : `On: every member is cut at a bay line and none is longer than ${DIMS.haulLength.value.toFixed(1)} m, so the house can be numbered, unpegged and carried. Off: the frame is cut to the building — longer members, fewer joints, a better house by every measure except the only one that matters here.`
        }
      />
    </RailSection>
  )
}
