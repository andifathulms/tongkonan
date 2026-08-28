'use client'

/**
 * The bale's rules, and one of them is a person.
 *
 * The depa is the first control in this project that is a measurement rather
 * than a choice, so it is the first that wants a slider. Every other rule set
 * here is radios and steppers because ranks, laras, tiers and household counts
 * are enumerable; an arm span is not, and pretending it was — four preset
 * body sizes, say — would have said something false about how the tradition
 * works. What the slider has to carry instead is that moving it does not scale
 * a model: it changes whose house this is.
 *
 * The pengurip is a checkbox and it is the least ordinary one in the project.
 * The other two flags in this codebase — the joglo's pendhapa — mark a thing
 * being there or not. This one marks whether the building is permitted to be
 * exactly its own rule, and unticking it does not make a smaller or a plainer
 * house. It makes a dead one, and the check below says so in those words.
 * That is why the hint states the consequence rather than the mechanism, and
 * why the readout under it prints the increment in millimetres: twenty-odd
 * millimetres across a five-metre building is exactly the sort of difference a
 * reader would otherwise assume was rounding.
 */

import { COPY, pick } from '@/lib/i18n'
import { BALE, DIMS, MAX_DEPA, MIN_DEPA } from '@/lib/tradition/bali/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/bali/address'
import type { Rules } from '@/lib/tradition/bali/types'
import { Choice, Choices, Field, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function BaliControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))

  const depa = rules.depa / 1000
  const hasta = depa * DIMS.hastaRatio.value
  const musti = depa * DIMS.mustiRatio.value
  const useran = depa * DIMS.useranRatio.value

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Bale' : 'Bale'}>
        <div className="flex flex-col gap-px">
          {BALE.map((info) => (
            <Choice
              key={info.bale}
              name="bale"
              value={info.bale}
              checked={rules.bale === info.bale}
              onSelect={() => set({ ...rules, bale: info.bale })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.bale === info.bale ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{info.name}</span>
                <span className="num shrink-0 text-meta">
                  {info.saka} · {info.rows}×{info.cols}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.bale === info.bale ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.bale === info.bale ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.nameIsCount.source}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Namanya adalah jumlah sakanya. Satu-satunya aturan di sini yang katanya dan angkanya adalah satu hal yang sama.'
            : 'The name is the number of saka. The only rule here whose word and number are one and the same fact.'}
        </p>
      </Choices>

      <Field
        label={locale === 'id' ? 'Depa pemilik' : 'The owner’s depa'}
        value={`${rules.depa} mm`}
        hint={
          locale === 'id'
            ? 'Rentang tangan pemiliknya, dari ujung jari ke ujung jari. Setiap panjang pokok bangunan ini adalah kelipatan bulat angka ini atau ukuran turunannya — jadi menggeser kendali ini bukan memperbesar model, melainkan mengganti siapa pemilik rumahnya.'
            : 'The owner’s arm span, fingertip to fingertip. Every principal length in this building is a whole number of it or of a measure derived from it — so moving this control is not resizing a model, it is changing whose house this is.'
        }
      >
        <input
          id="depa"
          type="range"
          min={MIN_DEPA}
          max={MAX_DEPA}
          step={10}
          value={rules.depa}
          onChange={(e) => set({ ...rules, depa: Number(e.target.value) })}
          aria-label={locale === 'id' ? 'Depa pemilik, milimeter' : 'The owner’s depa, in millimetres'}
          aria-valuetext={`${rules.depa} mm`}
          className="w-full"
        />
        {/*
          The derived measures, because the point of the rule is that they are
          all one person. Printed rather than only described: a reader who
          moves the slider should be able to watch the hasta and the musti move
          with it, which is the whole claim the house makes.
        */}
        <p className="num mt-2 text-meta text-muted">
          {`1 depa ${(depa * 1000).toFixed(0)} · 1 hasta ${(hasta * 1000).toFixed(0)} · 1 musti ${(musti * 1000).toFixed(0)} · 1 useran ${(useran * 1000).toFixed(1)} mm`}
        </p>
        <p className="mt-1 text-body text-muted">
          {locale === 'id'
            ? 'Perbandingan antar ukuran ini antropometri penulis, bukan angka dari kepustakaan Bali. Yang bersumber adalah bahwa satuannya berasal dari tubuh pemiliknya.'
            : 'The ratios between these measures are the author’s anthropometry, not figures from the Balinese literature. What is sourced is that the units come from the owner’s body.'}
        </p>
      </Field>

      <Toggle
        checked={rules.pengurip}
        onChange={(v) => set({ ...rules, pengurip: v })}
        label={locale === 'id' ? 'Pengurip' : 'Pengurip'}
        hint={
          locale === 'id'
            ? 'Tambahan kecil — satu useran — pada setiap ukuran pokok, supaya tidak ada panjang yang jatuh tepat pada modulnya. Ukuran yang tepat disebut mati. Matikan, dan setiap ukuran menjadi kelipatan bulat yang rapi: rumah yang tidak akan didirikan undagi mana pun, dan pemeriksaannya menolaknya dengan kata itu.'
            : 'A small addition — one useran — to every principal length, so that none lands exactly on its module. An exact measure is called mati, dead. Turn it off and every measure becomes a tidy whole multiple: a house no undagi would raise, and the check refuses it in those words.'
        }
      />
      <p className="num text-meta text-muted">
        {rules.pengurip
          ? `+${(useran * 1000).toFixed(1)} mm${locale === 'id' ? ' pada tiap ukuran pokok' : ' on every principal length'}`
          : locale === 'id'
            ? 'tidak ada tambahan — rumah ini mati'
            : 'no addition — this house is dead'}
      </p>
    </RailSection>
  )
}
