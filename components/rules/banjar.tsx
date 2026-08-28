'use client'

/**
 * The Banjar house's rules.
 *
 * The type control is unlike every other choice list in this project. A rank
 * multiplies, a laras switches a floor, a wujud grades a series — those change
 * a number or turn a part on. This one changes *which geometric primitive is
 * used* over one segment of four, and the house takes its name from the
 * result. So the readout beside each type is the form and the ridge height it
 * produces, because that is literally what is being chosen.
 */

import { COPY, pick } from '@/lib/i18n'
import { JENIS, MAX_RUANG, MIN_RUANG, jenisInfo, jenisRise } from '@/lib/tradition/banjar/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/banjar/address'
import { resolveLayout } from '@/lib/tradition/banjar/frame'
import type { Rules } from '@/lib/tradition/banjar/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function BanjarControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)
  const core = layout.segments.find((s) => s.key === 'palidangan')
  const others = layout.segments.filter((s) => s.key !== 'palidangan')
  const margin = (core?.ridgeY ?? 0) - Math.max(...others.map((s) => s.ridgeY))

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Jenis' : 'Type'}>
        <div className="flex flex-col gap-px">
          {JENIS.map((j) => (
            <Choice
              key={j.jenis}
              name="jenis"
              value={j.jenis}
              checked={rules.jenis === j.jenis}
              onSelect={() => set({ ...rules, jenis: j.jenis })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.jenis === j.jenis ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{j.name}</span>
                <span className="num shrink-0 text-meta">+{jenisRise(j.jenis).toFixed(1)} m</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.jenis === j.jenis ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? j.glossId : j.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        {/*
          Worth saying under the list rather than in a gloss on one option: what
          is being chosen is a shape, not a size or a count, and only over one
          of the four segments.
        */}
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `Yang dipilih di sini adalah bentuk atap di atas inti — satu ruas dari empat — dan rumahnya dinamai menurut hasilnya. Sekarang: ${jenisInfo(rules.jenis).core}, menjulang ${margin.toFixed(2)} m di atas tetangganya.`
            : `What is chosen here is the form of the roof over the core — one segment of four — and the house is named for the result. Currently: a ${jenisInfo(rules.jenis).core}, rising ${margin.toFixed(2)} m above its neighbours.`}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Ruang inti' : 'Bays in the core'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Sedalam apa palidangan, dan hanya itu. Ini aturan ukuran murni — tidak mengubah jenis rumah, tidak mengubah urutan atapnya, tidak mengubah apa pun yang punya nama. Bandingkan dengan ruang pada rumah gadang, yang harus ganjil karena bilangannya sendiri bermakna.'
            : 'How deep the palidangan is, and nothing else. This is a pure size rule — it does not change the type of house, the sequence of roofs, or anything that has a name. Compare ruang on the rumah gadang, where the count itself carries meaning and must be odd.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `panjang seluruhnya ${layout.depth.toFixed(1)} m · ${layout.segments.length} ruas beratap`
            : `${layout.depth.toFixed(1)} m end to end · ${layout.segments.length} roofed segments`}
        </p>
      </Field>

      <Toggle
        checked={rules.anjung}
        onChange={(v) => set({ ...rules, anjung: v })}
        label={locale === 'id' ? 'Anjung' : 'Anjung'}
        hint={
          locale === 'id'
            ? 'Dua sayap yang keluar dari sisi inti, beratap sendiri dan berlantai lebih rendah. Menyalakannya menambah dua atap lagi ke rumah yang sudah punya empat — dan keduanya melintang terhadap yang empat itu, bukan menyambung rantainya.'
            : 'Two wings off the sides of the core, each with its own roof and a lower floor. Turning them on adds two more roofs to a house that already has four — and both run across the chain rather than continuing it.'
        }
      />
    </RailSection>
  )
}
