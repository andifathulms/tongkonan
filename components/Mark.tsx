const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

/**
 * The collection's mark: a saddle roof over posts you can count.
 *
 * The curve is the one proportion nearly every house on the index shares, so
 * it stands for the family rather than crowning one of the thirty-five — which
 * is the same reason the tongkonan's silhouette stopped being the tab icon.
 * The gold is spent only on the posts, because the count is the argument.
 *
 * It is served rather than inlined so that the drawing exists once. A mark
 * pasted into a component and also sitting in public/ is two descriptions of
 * one shape, and this project has been bitten by that four times in the
 * geometry alone.
 *
 * Decorative in every place it is used: the name is always beside it, and a
 * second reading of the name is noise rather than help.
 */
export function Mark({ size = 18 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE}/brand/mark.svg`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className="shrink-0"
    />
  )
}
