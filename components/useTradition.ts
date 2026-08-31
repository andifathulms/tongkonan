'use client'

import { useEffect, useState } from 'react'
import { loadTradition } from '@/lib/tradition/load'
import type { Tradition } from '@/lib/tradition/registry'
import type { TraditionKey } from '@/lib/tradition/keys'

/**
 * One tradition, loaded when asked for.
 *
 * The working routes used to import the registry, which imports every
 * facade — so a reader opening one house downloaded thirty-five. This hook
 * is the client half of lib/tradition/load.ts: null until the one facade
 * arrives, and the route shows the house's own words and drawing meanwhile.
 */
export function useTradition(key: TraditionKey): Tradition | null {
  const [t, setT] = useState<Tradition | null>(null)
  useEffect(() => {
    let live = true
    void loadTradition(key).then((loaded) => {
      if (live) setT(loaded)
    })
    return () => {
      live = false
    }
  }, [key])
  return t
}
