'use client'

/**
 * The betang's rules.
 *
 * The household stepper is the most consequential control in this project and
 * has to say so, because what it does is unlike every other rule here: it does
 * not resize the building, it *lengthens* it, and there is no proportion
 * pulling it back. The readout under it prints the length and the ratio side
 * by side so a reader moving it can watch the ratio refuse to settle — which
 * is the claim `checkNoCharacteristicLength` makes, made visible.
 *
 * The range is capped at twenty and the hint says the cap is the model's, not
 * the building's. A slider that stops somewhere is otherwise read as a claim
 * that the next value is impossible, and accounts describe betang of fifty
 * households and more.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_KELUARGA, MIN_KELUARGA, TUMBUH } from '@/lib/tradition/dayak/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/dayak/address'
import type { Rules } from '@/lib/tradition/dayak/types'
import { Choice, Choices, Field, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function DayakControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const length = DIMS.shareLength.value * rules.keluarga
  const width = DIMS.bilikDepth.value + DIMS.samiDepth.value

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        label={locale === 'id' ? 'Keluarga' : 'Households'}
        value={String(rules.keluarga)}
        hint={
          locale === 'id'
            ? 'Tiap keluarga menambah satu bilik dan satu bagian galeri di ujung rumah. Kendali ini tidak memperbesar bangunan — ia memanjangkannya, dan tidak ada perbandingan yang menariknya kembali. Batas dua puluh di sini batas model, bukan batas bangunan: ada catatan tentang betang berisi lima puluh keluarga dan lebih.'
            : 'Each household adds one bilik and one stretch of gallery at the end of the house. This control does not resize the building — it lengthens it, and no proportion pulls it back. The cap of twenty here is the model’s limit and not the building’s: there are accounts of betang of fifty households and more.'
        }
      >
        <input
          id="keluarga"
          type="range"
          min={MIN_KELUARGA}
          max={MAX_KELUARGA}
          step={1}
          value={rules.keluarga}
          onChange={(e) => set({ ...rules, keluarga: Number(e.target.value) })}
          aria-label={locale === 'id' ? 'Jumlah keluarga' : 'Number of households'}
          aria-valuetext={`${rules.keluarga}`}
          className="w-full"
        />
        {/*
          The length and the ratio together, because the ratio is the point:
          it moves from about 5 : 1 to about 8 : 1 across this range and never
          settles, which is what having no characteristic size looks like.
        */}
        <p className="num mt-2 text-meta text-muted">
          {`${length.toFixed(1)} m · ${(length / width).toFixed(1)} : 1 · ${rules.keluarga - 1} ${locale === 'id' ? 'sekat' : 'partitions'}`}
        </p>
        <p className="mt-1 text-body text-muted">
          {locale === 'id'
            ? 'Perbandingan panjang terhadap lebar tidak pernah menetap, dan memang tidak seharusnya: panjang rumah ini sebuah sensus.'
            : 'The length-to-width ratio never settles, and should not: this building’s length is a census.'}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Tumbuh' : 'Grows'}>
        <div className="flex flex-col gap-px">
          {TUMBUH.map((info) => (
            <Choice
              key={info.tumbuh}
              name="tumbuh"
              value={info.tumbuh}
              checked={rules.tumbuh === info.tumbuh}
              onSelect={() => set({ ...rules, tumbuh: info.tumbuh })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.tumbuh === info.tumbuh ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{info.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.tumbuh === info.tumbuh ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Jalan naik ada di ujung yang tidak ditumbuhi, jadi pintu masuk rumah tetap di tempatnya sepanjang riwayat bangunan ini.'
            : 'The way up is at the end that was not grown, so the entrance stays where it has always been through the building’s whole history.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.sami}
        onChange={(v) => set({ ...rules, sami: v })}
        label={locale === 'id' ? 'Galeri beratap penuh' : 'Gallery roofed for its length'}
        hint={
          locale === 'id'
            ? 'Sami beratap sampai ke ujung, atau berhenti sebelum sampai. Bukan pilihan gaya: rumah yang panjangnya melampaui kemampuannya membiarkan ujung galerinya terbuka, dan itu terbaca dari luar.'
            : 'The sami roofed all the way to the end, or stopping short of it. Not a matter of style: a house whose length has outrun its means leaves the far end of its gallery open, and that reads from outside.'
        }
      />
    </RailSection>
  )
}
