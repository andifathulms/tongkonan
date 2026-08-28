'use client'

import type { Locale } from '@/lib/i18n'
import type { TraditionKey } from '@/lib/tradition/registry'
import { TorajaControls } from './toraja'
import { MinangControls } from './minang'
import { JawaControls } from './jawa'
import { ManggaraiControls } from './manggarai'
import { BaliControls } from './bali'
import { NiasControls } from './nias'
import { DayakControls } from './dayak'
import { SumbaControls } from './sumba'
import { PalembangControls } from './palembang'

/**
 * The rule controls, chosen by tradition.
 *
 * The directory is `rules/` and not `controls/` because `Controls.tsx` sits
 * beside it and macOS would resolve `./controls` to that file — a collision
 * that only shows up on a case-sensitive machine, which is to say in CI and
 * not on the machine that wrote it.
 *
 * Every set speaks in query strings. The client holding them never sees a
 * `Rules` object, so it never learns what a rank or a laras is — the query
 * string is already the canonical description of a house, and using it as the
 * control surface means there is one representation rather than two that can
 * disagree.
 *
 * A `switch` and not a lookup table, so adding a house is a type error
 * here rather than a blank rail at runtime.
 */
export interface RuleControlProps {
  /** the canonical query for the house on screen, without a leading `?` */
  query: string
  onChange: (query: string) => void
  locale: Locale
}

export function RuleControlsFor({
  tradition,
  ...props
}: RuleControlProps & { tradition: TraditionKey }) {
  switch (tradition) {
    case 'toraja':
      return <TorajaControls {...props} />
    case 'minang':
      return <MinangControls {...props} />
    case 'jawa':
      return <JawaControls {...props} />
    case 'manggarai':
      return <ManggaraiControls {...props} />
    case 'bali':
      return <BaliControls {...props} />
    case 'nias':
      return <NiasControls {...props} />
    case 'dayak':
      return <DayakControls {...props} />
    case 'sumba':
      return <SumbaControls {...props} />
    case 'palembang':
      return <PalembangControls {...props} />
  }
}
