'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatHash, parseHash } from '@/lib/reader'

/**
 * Reader state, held in the fragment.
 *
 * Three things this has to get right, none of them obvious:
 *
 * The page is prerendered, so the fragment is read after mount rather than
 * during render — a client that read it during render would disagree with the
 * HTML it is hydrating. `settled` is how a caller tells the difference between
 * the vantage the address asked for and one the reader has since chosen, which
 * matters wherever arriving somewhere should not look like being moved there.
 *
 * Writes are debounced. A dragged slider changes state sixty times a second
 * and browsers rate-limit history writes; without this, Safari drops them and
 * complains. A quarter of a second after the last change is well inside the
 * time it takes to decide you are finished dragging.
 *
 * Writes preserve the query string, and the rules writer preserves the
 * fragment. The two halves of the address are owned by different hooks and
 * neither may clobber the other — which is the kind of thing that works until
 * someone shares a link.
 */
const WRITE_DELAY_MS = 250

export function useReaderState<T extends Record<string, unknown>>(
  fallback: T,
  decode: (params: ReadonlyMap<string, string>) => T,
  encode: (state: T) => readonly (readonly [string, string | null])[],
): [T, (next: Partial<T>) => void, boolean] {
  const [state, setState] = useState<T>(fallback)
  const [settled, setSettled] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read on mount, and again if the fragment changes underneath us — which is
  // what Back, Forward and hand-editing the address all look like from here.
  useEffect(() => {
    const read = () => setState(decode(parseHash(window.location.hash)))
    read()
    setSettled(true)
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
    // decode closes over nothing that changes; re-subscribing on every render
    // would tear the listener down between every keystroke of a drag.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!settled) return
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const hash = formatHash(encode(state))
      const next = `${window.location.pathname}${window.location.search}${hash ? `#${hash}` : ''}`
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (next === current) return
      // Replace, not push: a vantage is being adjusted, not visited, and forty
      // pushed entries would make Back useless for leaving the page.
      window.history.replaceState(null, '', next)
    }, WRITE_DELAY_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, settled])

  const update = useCallback((next: Partial<T>) => {
    setState((prev) => ({ ...prev, ...next }))
  }, [])

  return [state, update, settled]
}
