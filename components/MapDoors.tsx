'use client'

import { useRef } from 'react'

/*
 * The map's touch behaviour: first tap names, second tap enters.
 *
 * The plaques ride :hover and :focus, which never fire on a bare tap — so a
 * touch reader was navigating to an unnamed door on targets far below the
 * pointer floor. Where hover does not exist, the first tap on a glyph now
 * only opens its plaque (a tap elsewhere closes it), and the tap on an
 * already-named glyph goes through. Screen readers are unaffected either
 * way: the name travels in the link's aria-label and is announced before
 * activation.
 *
 * Like the index filter, this is an attribute contract with the
 * server-rendered svg — `#peta-<key>` glyphs, `#peta-tip-<key>` plaques —
 * not a second copy of the map. Without JavaScript the links simply
 * navigate, which is the behaviour touch had before, minus nothing.
 */
export function MapDoors({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const open = useRef<string | null>(null)

  const onClickCapture = (e: React.MouseEvent) => {
    if (!window.matchMedia('(hover: none)').matches) return
    const root = ref.current
    if (!root) return
    const hide = () => {
      if (open.current)
        root.querySelector(`#peta-tip-${open.current}`)?.removeAttribute('style')
      open.current = null
    }
    const door = (e.target as Element).closest('a[id^="peta-"]')
    if (!door) {
      hide()
      return
    }
    const key = door.id.slice('peta-'.length)
    if (open.current === key) return // the named door opens on the second tap
    e.preventDefault()
    hide()
    open.current = key
    root.querySelector(`#peta-tip-${key}`)?.setAttribute('style', 'opacity: 1')
  }

  return (
    <div ref={ref} onClickCapture={onClickCapture}>
      {children}
    </div>
  )
}
