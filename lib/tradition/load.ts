/**
 * One facade at a time.
 *
 * The registry imports every facade so the server can hold the whole
 * collection at export time; a working route needs exactly one. These
 * loaders pair each facade with its site the way the registry does, behind
 * dynamic imports, so the browser downloads the house it was asked for and
 * none of the other thirty-four. test/load.test.ts holds the two lists
 * together: a tradition present in one and missing from the other fails
 * the build, so the pairing cannot drift.
 */

import { AIRMADIDI, AMBON, ANGGI, BANDA_ACEH, BANJARMASIN, BAUBAU, BAWOMATALUO, BENA, BUKITTINGGI, BUKIT_DUABELAS, GIANYAR, JAILOLO, JAKARTA, JAYAPURA, KABANJAHE, KANEKES, MATARAM, PALANGKA_RAYA, PALEMBANG, PARE_PARE, RANTEPAO, SEBA, SIAK, SIBERUT, SOE, SUMBAWA_BESAR, SUMENEP, TOMOHON, UBUD, WAE_REBO, WAINGAPU, WAKATOBI, WAMENA, YANIRUMA, YOGYAKARTA } from '@/lib/solar/position'
import type { Tradition } from './registry'
import type { TraditionKey } from './keys'

const LOADERS: Record<TraditionKey, () => Promise<Tradition>> = {
  toraja: () => import('./toraja/facade').then((m) => m.tradition(RANTEPAO)),
  minang: () => import('./minang/facade').then((m) => m.tradition(BUKITTINGGI)),
  jawa: () => import('./jawa/facade').then((m) => m.tradition(YOGYAKARTA)),
  manggarai: () => import('./manggarai/facade').then((m) => m.tradition(WAE_REBO)),
  bali: () => import('./bali/facade').then((m) => m.tradition(UBUD)),
  nias: () => import('./nias/facade').then((m) => m.tradition(BAWOMATALUO)),
  dayak: () => import('./dayak/facade').then((m) => m.tradition(PALANGKA_RAYA)),
  sumba: () => import('./sumba/facade').then((m) => m.tradition(WAINGAPU)),
  palembang: () => import('./palembang/facade').then((m) => m.tradition(PALEMBANG)),
  bugis: () => import('./bugis/facade').then((m) => m.tradition(PARE_PARE)),
  arfak: () => import('./arfak/facade').then((m) => m.tradition(ANGGI)),
  sasak: () => import('./sasak/facade').then((m) => m.tradition(MATARAM)),
  dani: () => import('./dani/facade').then((m) => m.tradition(WAMENA)),
  banjar: () => import('./banjar/facade').then((m) => m.tradition(BANJARMASIN)),
  maluku: () => import('./maluku/facade').then((m) => m.tradition(AMBON)),
  tobati: () => import('./tobati/facade').then((m) => m.tradition(JAYAPURA)),
  minahasa: () => import('./minahasa/facade').then((m) => m.tradition(TOMOHON)),
  karo: () => import('./karo/facade').then((m) => m.tradition(KABANJAHE)),
  sunda: () => import('./sunda/facade').then((m) => m.tradition(KANEKES)),
  aceh: () => import('./aceh/facade').then((m) => m.tradition(BANDA_ACEH)),
  bajau: () => import('./bajau/facade').then((m) => m.tradition(WAKATOBI)),
  waruga: () => import('./waruga/facade').then((m) => m.tradition(AIRMADIDI)),
  bade: () => import('./bade/facade').then((m) => m.tradition(GIANYAR)),
  korowai: () => import('./korowai/facade').then((m) => m.tradition(YANIRUMA)),
  madura: () => import('./madura/facade').then((m) => m.tradition(SUMENEP)),
  buton: () => import('./buton/facade').then((m) => m.tradition(BAUBAU)),
  ngada: () => import('./ngada/facade').then((m) => m.tradition(BENA)),
  atoni: () => import('./atoni/facade').then((m) => m.tradition(SOE)),
  rimba: () => import('./rimba/facade').then((m) => m.tradition(BUKIT_DUABELAS)),
  mentawai: () => import('./mentawai/facade').then((m) => m.tradition(SIBERUT)),
  sabu: () => import('./sabu/facade').then((m) => m.tradition(SEBA)),
  betawi: () => import('./betawi/facade').then((m) => m.tradition(JAKARTA)),
  sahu: () => import('./sahu/facade').then((m) => m.tradition(JAILOLO)),
  riau: () => import('./riau/facade').then((m) => m.tradition(SIAK)),
  sumbawa: () => import('./sumbawa/facade').then((m) => m.tradition(SUMBAWA_BESAR)),
}

export function loadTradition(key: TraditionKey): Promise<Tradition> {
  return LOADERS[key]()
}
