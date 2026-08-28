'use client'

/**
 * The honai's rules.
 *
 * The layer stepper is the only control in this project that changes nothing
 * about the room. Move it and the floor, the wall, the door and the loft are
 * exactly where they were; what changes is how much grass is on the outside.
 * So the readout under it gives the two things that actually move — the
 * thickness of the blanket and the outside diameter — and the note says what
 * the trade is, which is a night against a job of work.
 */

import { COPY, pick } from '@/lib/i18n'
import { BANGUNAN, DIMS, MAX_LAPIS, MIN_LAPIS, bangunanInfo } from '@/lib/tradition/dani/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/dani/address'
import { resolveLayout } from '@/lib/tradition/dani/frame'
import type { Rules } from '@/lib/tradition/dani/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function DaniControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const info = bangunanInfo(rules.bangunan)
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Bangunan' : 'Building'}>
        <div className="flex flex-col gap-px">
          {BANGUNAN.map((b) => (
            <Choice
              key={b.bangunan}
              name="bangunan"
              value={b.bangunan}
              checked={rules.bangunan === b.bangunan}
              onSelect={() => set({ ...rules, bangunan: b.bangunan })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.bangunan === b.bangunan ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{b.name}</span>
                <span className="num shrink-0 text-meta">{(b.scale * 100).toFixed(0)}%</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.bangunan === b.bangunan ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? b.glossId : b.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Ketiganya berdiri di satu pekarangan, di dalam satu pagar, dan tak satu pun versi yang lebih rendah dari yang lain.'
            : 'All three stand in one compound inside one fence, and none is a lesser version of another.'}
        </p>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Lapis atap' : 'Layers of thatch'}
        value={String(rules.lapis)}
        hint={
          locale === 'id'
            ? 'Setebal apa selimutnya. Ini satu-satunya aturan dalam projek ini yang seluruhnya soal panas: ia tidak mengubah siapa yang tinggal di sini, apa yang boleh diakui rumah tangganya, atau bagaimana bangunannya dipakai — hanya berapa lama panas api bertahan sampai pagi, dan berapa banyak rumput yang harus dipotong dan dipikul untuk itu.'
            : 'How thick the blanket is. It is the only rule in this project that is entirely about heat: it changes nothing about who lives here, what the household may claim, or how the building is used — only how long the fire’s warmth lasts until morning, and how much grass has to be cut and carried for it.'
        }
      >
        <Stepper min={MIN_LAPIS} max={MAX_LAPIS} value={rules.lapis} onChange={(n) => set({ ...rules, lapis: n })} />
        {/*
          The two figures that move, and the one that does not: the room is the
          same room at every setting, which is the whole point of the control.
        */}
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `selimut ${(layout.thatchDepth * 100).toFixed(0)} cm · ruang tetap ${layout.volume.toFixed(1)} m³`
            : `a ${(layout.thatchDepth * 100).toFixed(0)} cm blanket · the room stays ${layout.volume.toFixed(1)} m³`}
        </p>
      </Field>

      <Toggle
        checked={rules.loteng}
        onChange={(v) => set({ ...rules, loteng: v })}
        label={locale === 'id' ? 'Loteng tidur' : 'Sleeping loft'}
        hint={
          info.loft
            ? locale === 'id'
              ? 'Bidang tidur di atas api. Panas naik, jadi orang tidur di tempat panasnya berada — argumen termal bangunan ini yang dijadikan sebuah lantai.'
              : 'The sleeping plane above the fire. Heat rises, so people sleep where the heat is — the building’s thermal argument turned into a floor.'
            : locale === 'id'
              ? 'Tidak berlaku: wamai tidak berloteng, dan babi tidak memanjat galah.'
              : 'Does not apply: a wamai has no loft, and pigs do not climb a pole.'
        }
      />
    </RailSection>
  )
}
