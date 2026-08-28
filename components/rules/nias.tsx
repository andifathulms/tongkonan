'use client'

/**
 * The omo's rules.
 *
 * The bay stepper is the plainest control in the project and it does the most:
 * adding a bay adds a rank of posts, and with them a new rectangle in each of
 * two planes, and with those two more diagonals. So the readout under it
 * counts bays rather than metres — on this house the interesting consequence
 * of making the building longer is structural, not dimensional, and a figure
 * in metres would have hidden that.
 *
 * The behu switch is the only control in this project that builds nothing on
 * the building. Its gloss has to say that, because a reader who turns it on
 * and watches four stones appear in the yard will otherwise read them as
 * decoration rather than as a record of feasts a household was entitled to
 * hold.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MAX_RUANG, MIN_RUANG, OMO } from '@/lib/tradition/nias/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/nias/address'
import type { Rules } from '@/lib/tradition/nias/types'
import { Choice, Choices, Field, Stepper, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

export function NiasControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const rows = Math.max(2, Math.round(DIMS.bodyRows.value))
  const cols = rules.ruang + 1
  // Both planes, which is the whole point: a frame braced one way is still a
  // mechanism the other way.
  const cells = rows * (cols - 1) + cols * (rows - 1)

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Omo' : 'Omo'}>
        <div className="flex flex-col gap-px">
          {OMO.map((info) => (
            <Choice
              key={info.omo}
              name="omo"
              value={info.omo}
              checked={rules.omo === info.omo}
              onSelect={() => set({ ...rules, omo: info.omo })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.omo === info.omo ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-body leading-tight">{info.name}</span>
                <span className="num shrink-0 text-meta">
                  {info.loft ? (locale === 'id' ? 'berloteng' : 'with loft') : '—'}
                </span>
              </span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.omo === info.omo ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? info.glossId : info.glossEn}
              </span>
              <span
                className={[
                  'mt-1 flex items-baseline gap-1.5 text-micro',
                  rules.omo === info.omo ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 shrink-0 rounded border"
                  style={{ background: 'var(--riri)', borderColor: 'var(--riri-ink)' }}
                />
                {DIMS.loftInRoof.source}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Ruang' : 'Bays'}
        value={String(rules.ruang)}
        hint={
          locale === 'id'
            ? 'Denahnya bertambah dengan kelipatan bulat satu ruang dan tidak dengan cara lain. Tiap ruang tambahan membawa sebaris tiang baru — dan bersamanya satu persegi baru di tiap bidang, yang keduanya harus disilang driwa.'
            : 'The plan grows by whole bays and by nothing else. Each added bay brings a new rank of posts — and with them a new rectangle in each plane, both of which have to be crossed by driwa.'
        }
      >
        <Stepper min={MIN_RUANG} max={MAX_RUANG} value={rules.ruang} onChange={(n) => set({ ...rules, ruang: n })} />
        <p className="mt-2 text-body text-muted">
          {locale === 'id'
            ? `${rows} × ${cols} tiang · ${cells} petak rangka bawah, semuanya harus bersegitiga`
            : `${rows} × ${cols} posts · ${cells} bays in the substructure, every one of which must be triangulated`}
        </p>
      </Field>

      <Toggle
        checked={rules.behu}
        onChange={(v) => set({ ...rules, behu: v })}
        label={locale === 'id' ? 'Behu' : 'Behu'}
        hint={
          locale === 'id'
            ? 'Batu tegak di halaman, di luar bangunan. Hanya si’ulu yang mendirikannya, dan tiap batu adalah catatan pesta yang pernah diadakan — jadi batu-batu itu bukan hiasan melainkan riwayat. Ini satu-satunya kendali dalam projek ini yang tidak membangun apa pun pada rumahnya.'
            : 'Standing stones on the plaza, outside the building. Only a si’ulu raises them, and each stone records a feast that was held — so they are a history rather than an ornament. It is the only control in this project that builds nothing on the house itself.'
        }
      />
    </RailSection>
  )
}
