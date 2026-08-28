'use client'

/**
 * The lumbung's rules.
 *
 * The rail here has a job the other eleven do not: it has to keep saying that
 * this building is not for people. So the readout under the post control prints
 * the guard overhang — the number the whole thing turns on — and the note under
 * the platform switch says why the floor beneath stops short of every post,
 * which is the sort of thing that looks like a modelling detail and is actually
 * the defence.
 */

import { COPY, pick } from '@/lib/i18n'
import { DIMS, MILIK } from '@/lib/tradition/sasak/rules'
import { rulesFromQuery, rulesToQuery } from '@/lib/tradition/sasak/address'
import type { Rules } from '@/lib/tradition/sasak/types'
import { Choice, Choices, Field, Toggle } from '../Controls'
import { RailSection } from '../Sheet'
import type { RuleControlProps } from './index'

const POSTS: readonly (4 | 6)[] = [4, 6]

export function SasakControls({ query, onChange, locale }: RuleControlProps) {
  const rules = rulesFromQuery(query)
  const set = (next: Rules) => onChange(rulesToQuery(next))
  const scale = MILIK.find((m) => m.milik === rules.milik)?.scale ?? 1
  const overhang = (DIMS.guardRadius.value - DIMS.postSection.value / 2) * scale

  return (
    <RailSection title={pick(COPY.controls.heading, locale)}>
      <Choices legend={locale === 'id' ? 'Milik' : 'Whose'}>
        <div className="flex flex-col gap-px">
          {MILIK.map((m) => (
            <Choice
              key={m.milik}
              name="milik"
              value={m.milik}
              checked={rules.milik === m.milik}
              onSelect={() => set({ ...rules, milik: m.milik })}
              face={[
                'block rounded px-2 py-1.5 text-left transition-colors duration-state',
                rules.milik === m.milik ? 'bg-bolu text-kapur' : 'hover:bg-wash',
              ].join(' ')}
            >
              <span className="text-body leading-tight">{m.name}</span>
              <span
                className={[
                  'mt-0.5 block text-meta',
                  rules.milik === m.milik ? 'text-muted-on-ink' : 'text-muted',
                ].join(' ')}
              >
                {locale === 'id' ? m.glossId : m.glossEn}
              </span>
            </Choice>
          ))}
        </div>
      </Choices>

      <Field
        group
        label={locale === 'id' ? 'Tiang' : 'Posts'}
        value={String(rules.tiang)}
        hint={
          locale === 'id'
            ? 'Empat tiang atau enam. Lumbung berkaki lima bukan lumbung yang lebih kecil; ia bangunan yang tidak dibuat tradisi ini — jadi yang di antaranya ditolak, bukan dibulatkan.'
            : 'Four posts or six. A lumbung on five is not a smaller one; it is a building this tradition does not make — so anything between is refused rather than rounded.'
        }
      >
        <div className="flex gap-px">
          {POSTS.map((n) => (
            <Choice
              key={n}
              name="tiang"
              value={String(n)}
              checked={n === rules.tiang}
              onSelect={() => set({ ...rules, tiang: n })}
              face={[
                'num block flex-1 rounded py-1.5 text-center text-body transition-colors duration-state',
                n === rules.tiang ? 'bg-bolu text-kapur' : 'border border-hairline hover:bg-wash',
              ].join(' ')}
            >
              {n}
            </Choice>
          ))}
        </div>
        {/*
          The overhang beside the post count, because the post is half of it:
          the disc is a fixed size and a stouter post eats the margin from the
          inside. Two numbers, one defence.
        */}
        <p className="num mt-2 text-meta text-muted">
          {locale === 'id'
            ? `cakram ⌀${(DIMS.guardRadius.value * 2 * scale * 1000).toFixed(0)} mm · tiang ${(DIMS.postSection.value * scale * 1000).toFixed(0)} mm · juraian ${(overhang * 1000).toFixed(0)} mm`
            : `disc ⌀${(DIMS.guardRadius.value * 2 * scale * 1000).toFixed(0)} mm · post ${(DIMS.postSection.value * scale * 1000).toFixed(0)} mm · overhang ${(overhang * 1000).toFixed(0)} mm`}
        </p>
        <p className="mt-1 text-body text-muted">
          {locale === 'id'
            ? 'Juraian itulah yang menghentikan tikus, dan ia selisih dua angka: cakramnya sebuah ukuran papan, tiangnya sebesar apa adanya.'
            : 'That overhang is what stops a rat, and it is the difference between two numbers: the disc is the size of a plank, and the post is whatever it is.'}
        </p>
      </Field>

      <Toggle
        checked={rules.kolong}
        onChange={(v) => set({ ...rules, kolong: v })}
        label={locale === 'id' ? 'Lantai kolong' : 'Floor the space beneath'}
        hint={
          locale === 'id'
            ? 'Kolongnya teduh dan kering, dan dilantai ia menjadi tempat duduk dan bekerja — di bangunan ini bagian yang dipakai manusia adalah bagian yang tidak dibangun untuknya. Lantai itu berhenti sebelum tiap tiang, dan itu bukan kerapian: lantai yang menyentuh tiang adalah anak tangga, dan anak tangga di sebelah cakram penghalang meniadakan gunanya.'
            : 'The space beneath is shaded and dry, and floored it becomes a place to sit and work — in this building the part people use is the part that was not built for them. That floor stops short of every post, and this is not tidiness: a floor touching a post is a step, and a step beside a rat guard undoes it.'
        }
      />
    </RailSection>
  )
}
