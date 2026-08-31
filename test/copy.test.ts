import { expect, test } from 'vitest'
import { COPY } from '@/lib/i18n'

/*
 * The one neutrality leak the architecture tests cannot see is copy: they
 * strip comments and prose precisely so the documentation may name a
 * tradition, which means a shared string that names one is invisible to
 * them. The canvas label did exactly that — it said "tongkonan" over every
 * house for as long as there was more than one. So the placeholder is held
 * here: the label must take its house from the route, in both locales.
 */
test('the model label names no house of its own', () => {
  for (const locale of ['id', 'en'] as const) {
    expect(COPY.modelLabel[locale]).toContain('{house}')
    expect(COPY.modelLabel[locale].toLowerCase()).not.toContain('tongkonan')
  }
})
