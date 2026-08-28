'use client'

/**
 * The uma's rules.
 *
 * The tower switch is the sharpest control in this project and the copy has to
 * carry that. Every other either/or here adds a part or changes a proportion;
 * this one changes what kind of object the building is, so the gloss on the
 * off state says what is *absent* rather than what is smaller.
 *
 * The tower slider is disabled when there is no tower, and disabled rather
 * than hidden: a reader should be able to see that the rule exists and does
 * not apply, which is a different statement from the rule not being there.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_MENARA, MENARA_SCALE, MIN_MENARA, UMA } from '@/lib/tradition/sumba/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sumba/address'
import type { Rules } from '@/lib/tradition/sumba/types'
import { Choice, Choices, Field, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function SumbaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const towered = rules.uma === 'mbatangu'
  const factor = rules.menara / MENARA_SCALE

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Uma' : 'Uma'}>
        <div className="flex flex-col gap-px">
          {UMA.map((info) => (
            <Choice
              key={info.uma}
              name="uma"
              value={info.uma}
              checked={rules.uma === info.uma}
              onSelect={() => set({ ...rules, uma: info.uma })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.uma === info.uma ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{info.name}</span>
                <span className="num shrink-0 text-meta">
                  {info.tower ? (locale === 'id' ? 'bermenara' : 'with tower') : '—'}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.uma === info.uma ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.uma === info.uma ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.towerHoldsTheMarapu.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Bukan besar-kecil. Rumah yang tidak menyimpan marapu tidak punya alasan membangun puncak, jadi yang berubah di sini adalah jenis bangunannya.'
            : 'Not a matter of size. A house that keeps no marapu has no reason to build a peak, so what changes here is the kind of building it is.'}
        </p>
      </Choices>

      <Field
        label={locale === 'id' ? 'Tinggi menara' : 'Height of the tower'}
        value={towered ? `${factor.toFixed(1)} ×` : '—'}
        hint={
          locale === 'id'
            ? 'Menara yang lebih tinggi menyatakan lebih banyak tentang marapu yang disimpannya, dan karena itu tentang rumah tangga yang memegangnya. Ini satu-satunya aturan dalam projek ini yang berupa perbandingan, bukan pilihan atau cacah — dan angka dasar yang dikalikannya adalah yang paling lemah dasarnya di seluruh pak ini.'
            : 'A taller tower says more about the marapu it holds and therefore about the household holding them. It is the only rule in this project that is a ratio rather than a choice or a count — and the base figure it multiplies is the least supported number in this pack.'
        }
      >
        <input
          id="menara"
          type="range"
          min={MIN_MENARA}
          max={MAX_MENARA}
          step={1}
          value={rules.menara}
          disabled={!towered}
          onChange={(e) => set({ ...rules, menara: Number(e.target.value) })}
          aria-label={locale === 'id' ? 'Tinggi menara, kelipatan' : 'Height of the tower, as a multiple'}
          aria-valuetext={`${factor.toFixed(1)}`}
          className="w-full"
        />
        <p className="mt-2 text-body text-muted">
          {towered
            ? locale === 'id'
              ? 'Diukur terhadap rumah di bawahnya, jadi menara yang lebih tinggi adalah pernyataan tentang perbandingan — persis seperti yang dikatakan sumbernya.'
              : 'Measured against the house beneath it, so a taller tower is a statement about proportion — which is exactly what the sources say it is.'
            : locale === 'id'
              ? 'Tidak berlaku: rumah ini tidak punya menara. Kendalinya dinonaktifkan dan bukan disembunyikan, karena aturan yang ada tetapi tidak berlaku bukan hal yang sama dengan aturan yang tidak ada.'
              : 'Does not apply: this house has no tower. The control is disabled rather than hidden, because a rule that exists and does not apply is not the same thing as a rule that is not there.'}
        </p>
      </Field>

      <Toggle
        checked={rules.bangga}
        onChange={(v) => set({ ...rules, bangga: v })}
        label={locale === 'id' ? 'Bangga melingkar penuh' : 'Bangga a full circuit'}
        hint={
          locale === 'id'
            ? 'Serambi di luar inti, mengelilingi keempat sisi atau dua sisi panjangnya saja. Melingkar penuh berarti rumah yang menerima dari segala sisi; dua sisi berarti rumah yang menerima dari sisi tempat tetangganya berada.'
            : 'The veranda outside the core, going round all four sides or along the two long ones. A full circuit is a house that receives on every side; two sides is a house that receives on the sides its neighbours are.'
        }
      />
    </RailSection>
  )
}
