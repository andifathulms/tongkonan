'use client'

/**
 * The lepa's rules.
 *
 * The awning toggle is the one control in this project that switches a
 * building between being a dwelling and being an object, so its gloss says
 * that rather than describing a part. The size choice is a choice among three
 * boats rather than a slider, because a boat is built to a size.
 */

import { COPY, pick } from '@/lib/i18n'
import { UKURAN, lengthOf } from '@/lib/tradition/bajau/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/bajau/address'
import { resolveLayout } from '@/lib/tradition/bajau/frame'
import type { Rules } from '@/lib/tradition/bajau/types'
import { Choice, Choices, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function BajauControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const layout = resolveLayout(rules)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Ukuran' : 'Size'}>
        <div className="flex flex-col gap-px">
          {UKURAN.map((u) => (
            <Choice
              key={u.ukuran}
              name="ukuran"
              value={u.ukuran}
              checked={rules.ukuran === u.ukuran}
              onSelect={() => set({ ...rules, ukuran: u.ukuran })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.ukuran === u.ukuran ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{u.name}</span>
                <span className="num shrink-0 text-meta">{lengthOf(u.ukuran).toFixed(1)} m</span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.ukuran === u.ukuran ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? u.glossId : u.glossEn}
              </span>
            </Choice>
          ))}
        </div>
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? 'Sebuah perahu dibuat menurut ukurannya, bukan diskalakan menurut sebuah angka — jadi ini pilihan di antara tiga perahu dan bukan sebuah penggeser.'
            : 'A boat is built to a size rather than scaled to a number — so this is a choice among three boats and not a slider.'}
        </p>
      </Choices>

      <Toggle
        checked={rules.kajang}
        onChange={(v) => set({ ...rules, kajang: v })}
        label={locale === 'id' ? 'Kajang' : 'The awning'}
        hint={
          locale === 'id'
            ? `Matikan dan tidak satu papan pun pada perahunya berubah — lambung yang sama, geladak yang sama — dan bendanya berhenti menjadi tempat tinggal. Ini satu-satunya kendali dalam projek ini yang memindahkan sebuah bangunan dari rumah menjadi benda. Tingginya ${layout.kajang.rise.toFixed(2)} m: cukup untuk duduk, tidak untuk berdiri, dan itu aturan keseimbangan.`
            : `Turn it off and not one plank of the boat changes — the same hull, the same deck — and the thing stops being a dwelling. It is the only control in this project that moves a building from house to object. It stands ${layout.kajang.rise.toFixed(2)} m: enough to sit under, not to stand under, and that is a rule about balance.`
        }
      />

      <Toggle
        checked={rules.cadik}
        onChange={(v) => set({ ...rules, cadik: v })}
        label={locale === 'id' ? 'Cadik' : 'Outriggers'}
        hint={
          locale === 'id'
            ? 'Menambah lebar tanpa menambah berat di tempat yang tinggi — yang persis kebalikan dari apa yang dilakukan kajang, dan itulah sebabnya keduanya kendali yang berbeda.'
            : 'They add width without adding weight up high — the exact opposite of what the awning does, which is why the two are separate controls.'
        }
      />
    </RailSection>
  )
}
