'use client'

/**
 * The kariwari's rules — and there are two of them, where every other house
 * here has three.
 *
 * The rail says so rather than hiding it. What the sources record about this
 * building is the number of levels and the walkway; a third control would be a
 * variation nobody has built, which is a worse thing to invent than a metre.
 */

import { COPY, pick } from '@/lib/i18n'
import { MAX_TINGKAT, MIN_TINGKAT, gradesFor } from '@/lib/tradition/tobati/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/tobati/address'
import { resolveLayout } from '@/lib/tradition/tobati/frame'
import type { Rules } from '@/lib/tradition/tobati/types'
import { Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function TobatiControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const grades = gradesFor(rules.tingkat)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Tingkat' : 'Levels'}
        value={String(rules.tingkat)}
        hint={
          locale === 'id'
            ? 'Berapa golongan usia yang ditampung rumah ini. Bukan ukuran dan bukan pangkat: tiap tingkat adalah satu tahap hidup, dan angka ini menentukan seberapa halus tahap-tahap itu dibedakan. Menambah yang ketiga tidak membuat bangunannya lebih megah — ia memberi anak laki-laki lantainya sendiri, alih-alih sudut di lantai pemuda.'
            : 'How many age grades the house holds. Not a size and not a rank: each level is a stage of life, and this figure is how finely those stages are divided. Adding the third does not make the building grander — it gives the boys a floor of their own instead of a corner of the young men’s.'
        }
      >
        <Stepper
          min={MIN_TINGKAT}
          max={MAX_TINGKAT}
          value={rules.tingkat}
          onChange={(n) => set({ ...rules, tingkat: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {grades
            .map((g, i) => `${locale === 'id' ? g.nameId : g.nameEn} ${(layout.levels[i]?.area ?? 0).toFixed(1)} m²`)
            .join(' · ')}
        </p>
      </Field>

      <Toggle
        checked={rules.titian}
        onChange={(v) => set({ ...rules, titian: v })}
        label={locale === 'id' ? 'Titian dari darat' : 'Walkway from the shore'}
        hint={
          locale === 'id'
            ? 'Kampungnya ada di atas air dan rumah-rumahnya dihubungkan titian. Matikan dan rumah ini hanya dicapai dengan perahu — dan karena denahnya bersegi delapan, ia lalu tidak punya muka sama sekali: tidak ada sisi yang lebih lebar daripada sisi lain untuk dijadikan depan.'
            : 'The village is over the water and its houses are joined by walkways. Turn it off and this house is reached only by canoe — and because the plan is eight-sided it then has no front at all: no side is wider than another to be made the front of.'
        }
      />

      <p className="mt-3 text-body text-muted">
        {locale === 'id'
          ? 'Dua aturan, sementara rumah lain di sini punya tiga. Yang tercatat tentang kariwari adalah jumlah tingkat dan titiannya; menambah aturan ketiga berarti mengarang keragaman yang tidak pernah dibangun siapa pun.'
          : 'Two rules, where the other houses here have three. What is recorded about the kariwari is the number of levels and the walkway; a third rule would be inventing a variation nobody has ever built.'}
      </p>
    </RailSection>
  )
}
