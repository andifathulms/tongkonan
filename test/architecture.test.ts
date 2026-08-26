import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The split, as a test.
 *
 * `lib/core` generates nothing in particular: it holds what is true of any
 * house — parts, joints, build order, mesh integrity, provenance — and it is
 * generic over what a tradition calls things. That property is invisible at
 * the point of use and is exactly the kind of thing that rots, because the
 * fastest way to finish an awkward change in the core is to reach for the one
 * tradition that already exists and read a real value out of it.
 *
 * So it is checked. The core may not import a tradition, and it may not name
 * one. If a second house ever needs the core to know a Toraja word, that is
 * the signal the abstraction is wrong, not the signal to add the import.
 */

/**
 * Comments stripped, string literals kept.
 *
 * The prose in these files has to be able to say "the core may not know a
 * Toraja word" without that sentence being the violation it describes. What
 * must not appear is a tradition in the *code* — an import, or a
 * `stage === 'ijuk'` branch that survived a union being widened — so the
 * literals stay in and only the commentary comes out.
 */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)) : e.name.endsWith('.ts') ? [join(dir, e.name)] : [],
  )
}

describe('the core is tradition-neutral', () => {
  const core = filesUnder('lib/core')

  it('has files in it', () => {
    expect(core.length).toBeGreaterThan(5)
  })

  it('imports no tradition', () => {
    const offenders = core.filter((f) => /from '[^']*tradition\//.test(code(f)))
    expect(offenders).toEqual([])
  })

  /**
   * Names are checked as well as imports, because the failure this guards
   * against is not only a stray import — it is a `stage === 'ijuk'` branch
   * that happens to type-check because someone widened a union.
   */
  it('names no tradition-specific part, stage or material', () => {
    const forbidden = [
      'tongkonan', 'toraja', 'ijuk', 'ariri', 'tulak', 'somba', 'tanduk',
      'banua', 'pa’ssura', 'gadang', 'gonjong', 'minang',
    ]
    const offenders: string[] = []
    for (const file of core) {
      const text = code(file).toLowerCase()
      for (const word of forbidden) if (text.includes(word)) offenders.push(`${file}: ${word}`)
    }
    expect(offenders).toEqual([])
  })
})

describe('the generator stays pure', () => {
  const all = [...filesUnder('lib/core'), ...filesUnder('lib/tradition')]

  it('imports no three.js and touches no DOM', () => {
    const offenders = all.filter((f) => {
      const text = code(f)
      return /from 'three'/.test(text) || /\bwindow\.|\bdocument\./.test(text)
    })
    expect(offenders).toEqual([])
  })

  it('uses no wall-clock time and no unseeded randomness', () => {
    const offenders = all.filter((f) => /Math\.random\(|Date\.now\(/.test(code(f)))
    expect(offenders).toEqual([])
  })
})
