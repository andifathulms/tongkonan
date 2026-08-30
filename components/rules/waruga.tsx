'use client'

/**
 * The waruga's rules.
 *
 * The stepper counts the dead, which is the only control in this project whose
 * number is not chosen by anybody: a family finds out what it is over
 * generations. Its readout says what the count costs in stone, because that is
 * the limit it runs into.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_JUMLAH, MIN_JUMLAH, TUTUP } from '@/lib/tradition/waruga/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/waruga/address'
import { resolveLayout } from '@/lib/tradition/waruga/frame'
import type { Rules } from '@/lib/tradition/waruga/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function WarugaControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Field
        group
        label={locale === 'id' ? 'Di dalamnya' : 'Inside it'}
        value={String(rules.jumlah)}
        hint={
          locale === 'id'
            ? 'Berapa orang dari satu keluarga ada di dalam peti ini. Ini satu-satunya angka dalam projek ini yang tidak dipilih siapa pun: keluarga mengetahuinya selama beberapa keturunan, sementara batunya harus dipilih pada hari pertama. Tiap orang berikutnya menambah sejengkal ke dalam ruangnya, dan tidak ada yang terlihat dari luar.'
            : 'How many of one family are inside this box. It is the only number in this project that nobody chooses: a family finds it out over generations, while the stone had to be chosen on the first day. Each further person adds a hand’s breadth to the chamber, and nothing shows from outside.'
        }
      >
        <Stepper min={MIN_JUMLAH} max={MAX_JUMLAH} value={rules.jumlah} onChange={(n) => set({ ...rules, jumlah: n })} />
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `ruang ${layout.chamber.height.toFixed(2)} m · dipahat dari blok ${layout.block.height.toFixed(2)} m dari ${DIMS.blockLimit.value.toFixed(2)} m`
            : `a ${layout.chamber.height.toFixed(2)} m chamber · cut ${layout.block.height.toFixed(2)} m from a ${DIMS.blockLimit.value.toFixed(2)} m block`}
        </p>
      </Field>

      <Choices legend={locale === 'id' ? 'Tutup' : 'The lid'}>
        <div className="flex flex-col gap-px">
          {TUTUP.map((o) => (
            <Choice
              key={o.tutup}
              name="tutup"
              value={o.tutup}
              checked={rules.tutup === o.tutup}
              onSelect={() => set({ ...rules, tutup: o.tutup })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.tutup === o.tutup ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{o.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.tutup === o.tutup ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? o.glossId : o.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Kedua bentuknya adalah bentuk atap rumah, di atas ruang yang tidak dimasuki siapa pun.'
            : 'Both forms are the shape of a house roof, over a room nobody enters.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.alas}
        onChange={(v) => set({ ...rules, alas: v })}
        label={locale === 'id' ? 'Alas batu' : 'Base slab'}
        hint={
          locale === 'id'
            ? 'Lempeng di bawah peti, supaya batunya tidak duduk langsung di tanah. Satu-satunya bagian bangunan ini yang tidak ada urusannya dengan tubuh di dalamnya.'
            : 'A slab under the box, so the stone does not sit straight on the earth. The only part of this building with nothing to do with the body inside it.'
        }
      />
    </RailSection>
  )
}
