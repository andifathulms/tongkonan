'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import type { Locale } from '@/lib/i18n'
import type { TraditionKey } from '@/lib/tradition/registry'

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

/*
 * One control set at a time, mirrored on lib/tradition/load.ts: the controls
 * carry each tradition's rule tables and address codec, and thirty-five of
 * them shipped on every route so that one could render. next/dynamic keeps
 * them server-rendered — the static HTML still holds the controls — while
 * the browser downloads only the set the path names. Each tradition keeps
 * its own component; the abstraction stays under the widgets, not over them.
 */
const CONTROLS: Record<TraditionKey, ComponentType<RuleControlProps>> = {
  toraja: dynamic(() => import('./toraja').then((m) => m.TorajaControls), { ssr: true }),
  minang: dynamic(() => import('./minang').then((m) => m.MinangControls), { ssr: true }),
  jawa: dynamic(() => import('./jawa').then((m) => m.JawaControls), { ssr: true }),
  manggarai: dynamic(() => import('./manggarai').then((m) => m.ManggaraiControls), { ssr: true }),
  bali: dynamic(() => import('./bali').then((m) => m.BaliControls), { ssr: true }),
  nias: dynamic(() => import('./nias').then((m) => m.NiasControls), { ssr: true }),
  dayak: dynamic(() => import('./dayak').then((m) => m.DayakControls), { ssr: true }),
  sumba: dynamic(() => import('./sumba').then((m) => m.SumbaControls), { ssr: true }),
  palembang: dynamic(() => import('./palembang').then((m) => m.PalembangControls), { ssr: true }),
  bugis: dynamic(() => import('./bugis').then((m) => m.BugisControls), { ssr: true }),
  arfak: dynamic(() => import('./arfak').then((m) => m.ArfakControls), { ssr: true }),
  sasak: dynamic(() => import('./sasak').then((m) => m.SasakControls), { ssr: true }),
  dani: dynamic(() => import('./dani').then((m) => m.DaniControls), { ssr: true }),
  banjar: dynamic(() => import('./banjar').then((m) => m.BanjarControls), { ssr: true }),
  maluku: dynamic(() => import('./maluku').then((m) => m.MalukuControls), { ssr: true }),
  tobati: dynamic(() => import('./tobati').then((m) => m.TobatiControls), { ssr: true }),
  minahasa: dynamic(() => import('./minahasa').then((m) => m.MinahasaControls), { ssr: true }),
  karo: dynamic(() => import('./karo').then((m) => m.KaroControls), { ssr: true }),
  sunda: dynamic(() => import('./sunda').then((m) => m.SundaControls), { ssr: true }),
  aceh: dynamic(() => import('./aceh').then((m) => m.AcehControls), { ssr: true }),
  bajau: dynamic(() => import('./bajau').then((m) => m.BajauControls), { ssr: true }),
  waruga: dynamic(() => import('./waruga').then((m) => m.WarugaControls), { ssr: true }),
  bade: dynamic(() => import('./bade').then((m) => m.BadeControls), { ssr: true }),
  korowai: dynamic(() => import('./korowai').then((m) => m.KorowaiControls), { ssr: true }),
  madura: dynamic(() => import('./madura').then((m) => m.MaduraControls), { ssr: true }),
  buton: dynamic(() => import('./buton').then((m) => m.ButonControls), { ssr: true }),
  ngada: dynamic(() => import('./ngada').then((m) => m.NgadaControls), { ssr: true }),
  atoni: dynamic(() => import('./atoni').then((m) => m.AtoniControls), { ssr: true }),
  rimba: dynamic(() => import('./rimba').then((m) => m.RimbaControls), { ssr: true }),
  mentawai: dynamic(() => import('./mentawai').then((m) => m.MentawaiControls), { ssr: true }),
  sabu: dynamic(() => import('./sabu').then((m) => m.SabuControls), { ssr: true }),
  betawi: dynamic(() => import('./betawi').then((m) => m.BetawiControls), { ssr: true }),
  sahu: dynamic(() => import('./sahu').then((m) => m.SahuControls), { ssr: true }),
  riau: dynamic(() => import('./riau').then((m) => m.RiauControls), { ssr: true }),
  sumbawa: dynamic(() => import('./sumbawa').then((m) => m.SumbawaControls), { ssr: true }),
}

export function RuleControlsFor({
  tradition,
  ...props
}: RuleControlProps & { tradition: TraditionKey }) {
  const Controls = CONTROLS[tradition]
  return <Controls {...props} />
}
