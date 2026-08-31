'use client'

import { useEffect, useRef, useState } from 'react'

/*
 * Type-to-filter over the house index.
 *
 * The index is server-rendered — every card, every silhouette — and this
 * component only decides what stays visible: each card carries its search
 * text in `data-cari` and each island group is marked `data-kelompok`, so
 * the filtering is an attribute contract with the markup rather than a
 * second copy of the collection. The input appears only after hydration —
 * a client component still server-renders, so without the gate a reader
 * with JavaScript off would be handed a search box that does nothing. With
 * it, they get the full index and no dead control.
 *
 * The count is computed, never written: copy may not carry a number a
 * thirty-sixth house would falsify, but a live tally of what the reader's
 * own filter matched is data, not a claim.
 */
export function IndexFilter({
  label,
  empty,
  children,
}: {
  label: string
  /** shown when nothing matches; {q} is replaced with the query */
  empty: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [q, setQ] = useState('')
  const [shown, setShown] = useState<{ n: number; total: number } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => setReady(true), [])

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const needle = q.trim().toLowerCase()
    const cards = root.querySelectorAll<HTMLElement>('[data-cari]')
    let n = 0
    for (const card of cards) {
      const hit = needle === '' || (card.dataset.cari ?? '').includes(needle)
      card.hidden = !hit
      if (hit) n++
    }
    for (const group of root.querySelectorAll<HTMLElement>('[data-kelompok]')) {
      group.hidden = !Array.from(group.querySelectorAll<HTMLElement>('[data-cari]')).some(
        (card) => !card.hidden,
      )
    }
    setShown({ n, total: cards.length })
  }, [q])

  return (
    <div>
      {ready ? (
        <>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <label htmlFor="saring" className="micro">
              {label}
            </label>
            {/* The tally, mono like every figure, announced so a screen
                reader hears the filter answer. */}
            <output
              htmlFor="saring"
              aria-live="polite"
              className="num ml-auto text-meta text-muted"
            >
              {shown ? `${shown.n} / ${shown.total}` : ''}
            </output>
          </div>
          <input
            id="saring"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-2 w-full rounded border border-hairline bg-sheet px-3 py-2 text-body text-bolu placeholder:text-muted"
          />
        </>
      ) : null}
      <div ref={ref} className="mt-4">
        {children}
        {shown && shown.n === 0 ? (
          <p className="text-body text-muted">{empty.replace('{q}', q.trim())}</p>
        ) : null}
      </div>
    </div>
  )
}
