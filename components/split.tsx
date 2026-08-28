import { COPY, pick } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n'
import type { Split } from '@/lib/core/provenance'

/*
 * One house's provenance split, as a bar and a legend.
 *
 * The colours are the ones the full provenance strip uses — measured is ink,
 * canon is turmeric, interpolated is red earth — so the mini bar on a card
 * and the bar in the rail cannot drift apart. Never draw a merged bar over
 * more than one house; provenanceSplit takes one tradition at a time and so
 * does this.
 */

const CLASSES = [
  ['measured', 'var(--bolu)'],
  ['canon', 'var(--riri)'],
  ['interpolated', 'var(--rara)'],
] as const

const pctOf = (split: Split, n: number) => (split.total === 0 ? 0 : (n / split.total) * 100)

export function SplitBar({ split, className }: { split: Split; className?: string }) {
  return (
    <span
      className={['flex w-full overflow-hidden rounded', className ?? 'h-1'].join(' ')}
      aria-hidden
    >
      {CLASSES.map(([key, colour]) => (
        <span key={key} style={{ width: `${pctOf(split, split[key])}%`, background: colour }} />
      ))}
    </span>
  )
}

/**
 * Names the three colours, with each class's count when a split is given.
 * No colour may carry a meaning only the code knows.
 */
export function SplitLegend({ locale, split }: { locale: Locale; split?: Split }) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-1">
      {CLASSES.map(([key, colour]) => (
        <div key={key} className="flex items-center gap-2">
          <dt className="h-2 w-2 rounded-none" style={{ background: colour }} aria-hidden />
          <dd className="micro">
            {pick(COPY.provenance[key], locale)}
            {split ? <span className="ml-1 font-mono">{split[key]}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
