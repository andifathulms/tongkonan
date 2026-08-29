'use client'

/**
 * The rumoh Aceh's rules.
 *
 * Both steppers count in odd numbers, because both counts are odd in the
 * tradition — the ladder's especially, which is the only parity rule in this
 * project. The note under it says what the count is derived from, since a
 * reader who thinks the number was typed in cannot see why it is a rule at
 * all.
 */

import { COPY, pick } from '@/lib/i18n'
import { MAX_RUANG, MAX_STEPS, MIN_RUANG, MIN_STEPS } from '@/lib/tradition/aceh/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/aceh/address'
import { houseWidth, resolveLayout } from '@/lib/tradition/aceh/frame'
import type { Rules } from '@/lib/tradition/aceh/types'
import { Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function AcehControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Bays'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Panjang rumah dalam ruang, dan rumah ini dinamai menurutnya: rumoh lhee ruang, rumoh limong ruang. Selalu ganjil, karena ruang tengahnya harus benar-benar di tengah — jumlah genap akan menaruh sambungan tepat di tempat yang seharusnya pusat.'
            : 'The length of the house in bays, and the house is named by it: rumoh lhee ruang, rumoh limong ruang. Always odd, because the middle bay has to be the middle — an even count would put a joint exactly where the centre should be.'
        }
      >
        <Stepper
          min={MIN_RUANG}
          max={MAX_RUANG}
          step={2}
          value={rules.ruang}
          onChange={(n) => set({ ...rules, ruang: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `${layout.length.toFixed(1)} m timur–barat · ${houseWidth(layout).toFixed(1)} m melintang`
            : `${layout.length.toFixed(1)} m east–west · ${houseWidth(layout).toFixed(1)} m across`}
        </p>
      </Field>

      <Field
        group
        label={locale === 'id' ? 'Anak tangga' : 'Treads'}
        value={String(rules.anakTangga)}
        hint={
          locale === 'id'
            ? 'Jumlah anak tangga, dan jumlahnya harus ganjil — satu-satunya aturan keganjilan dalam projek ini. Yang dipilih di sini adalah jumlah yang dituju; jumlah yang sebenarnya keluar dari tinggi lantai dibagi tinggi injakan, dan justru karena itulah aturannya dapat dilanggar oleh pergeseran satu sentimeter.'
            : 'How many treads the ladder has, and the number must be odd — the only parity rule in this project. What is chosen here is the number aimed at; the number that results falls out of the floor height divided by the rise of a tread, which is exactly why the rule can be broken by a centimetre.'
        }
      >
        <Stepper
          min={MIN_STEPS}
          max={MAX_STEPS}
          step={2}
          value={rules.anakTangga}
          onChange={(n) => set({ ...rules, anakTangga: n })}
        />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `terbangun ${layout.ladder.steps} anak tangga · naik ${layout.ladder.rise.toFixed(2)} m sekali langkah`
            : `${layout.ladder.steps} treads built · ${layout.ladder.rise.toFixed(2)} m at a step`}
        </p>
      </Field>

      <Toggle
        checked={rules.seuramoeLikot}
        onChange={(v) => set({ ...rules, seuramoeLikot: v })}
        label={locale === 'id' ? 'Seuramoë likôt' : 'The back veranda'}
        hint={
          locale === 'id'
            ? 'Serambi belakang, tempat perempuan bekerja dan memasak. Mematikannya membuat rumah ini dua bagian, bukan tiga — dan urutan seberapa dekat orang luar boleh masuk kehilangan ujungnya.'
            : 'The back veranda, where the women work and cook. Turning it off leaves the house with two parts rather than three — and the sequence of how far in a person may come loses its far end.'
        }
      />
    </RailSection>
  )
}
