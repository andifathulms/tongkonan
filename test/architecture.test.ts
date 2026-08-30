import { describe, expect, it } from 'vitest'
import { execSync } from 'node:child_process'
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
      'joglo', 'soko', 'tumpang', 'pendhapa', 'senthong', 'brunjung',
      'niang', 'lutur', 'gendang', 'manggarai', 'mbaru',
      'bale', 'bataran', 'saka', 'sendi', 'pengurip', 'sikut', 'depa', 'undagi',
      'ehomo', 'driwa', 'behu', 'rumbia', 'omo hada', 'omo sebua', 'si’ulu',
      'betang', 'bilik', 'sami', 'hejot', 'ulin', 'sirap', 'gelagar',
      'uma deta', 'uma mbatangu', 'kambaniru', 'marapu', 'bangga', 'menara',
      'kekijing', 'gegajah', 'tenggalung', 'jogan', 'unglen', 'tembesu', 'limas',
      'timpa laja', 'saoraja', 'alliri', 'pattolo', 'rakkeang', 'ale bola', 'nipah',
      'kaki seribu', 'arfak', 'igkojei',
      'lumbung', 'sasak', 'penghalang tikus',
      'honai', 'ebei', 'wamai', 'dani', 'baliem',
      'baileo', 'negeri', 'soa', 'saniri', 'pamali', 'maluku', 'rumbia',
      'kariwari', 'tobati', 'enggros', 'youtefa', 'titian',
      'woloan', 'minahasa', 'tomohon', 'tontemboan',
      'siwaluh', 'jabu', 'karo', 'bena kayu', 'tersek', 'ayo-ayo',
      'baduy', 'kanekes', 'imah', 'sosoro', 'pikukuh', 'palupuh', 'hateup', 'tihang',
      'rumoh', 'aceh', 'seuramo', 'tungai', 'tameh', 'reunyeun', 'bubong', 'gaseue', 'binteh',
      'lepa', 'bajau', 'kajang', 'cadik', 'lunas', 'gading', 'kelson',
      'waruga', 'minahasa', 'airmadidi', 'sawangan',
      'bubungan', 'palimasan', 'baliku', 'palidangan', 'surambi', 'pelatar',
      'anjung', 'banjar', 'tongkat',
      'bade', 'usungan', 'pemikul', 'pempatan', 'setra', 'payung',
      'khaim', 'korowai', 'wanbon', 'yaniruma', 'cagak',
      'tanean', 'lanjang', 'langgar', 'tonghuh', 'madura', 'trompesan', 'pacenan', 'sumenep',
    ]
    /*
     * Whole words, not substrings.
     *
     * The list was matched with `includes` until a boat joined the collection
     * and "lepa" turned out to be inside `RulePack` — so the guard reported
     * every file in the core at once. The bluntness of this check is its
     * value, and a false positive on a type name is the one thing that would
     * get it deleted, so the match got a boundary and kept everything else.
     */
    const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const offenders: string[] = []
    for (const file of core) {
      const text = code(file).toLowerCase()
      for (const word of forbidden) {
        if (new RegExp(`\\b${escape(word)}\\b`).test(text)) offenders.push(`${file}: ${word}`)
      }
    }
    expect(offenders).toEqual([])
  })
})

/**
 * Traditions are siblings, not a base class and a subclass.
 *
 * The second house is here to say where the first one's shape was a
 * coincidence, and it can only do that if it cannot reach into it. The moment
 * `minang/` imports `toraja/` for a helper, the answer to "what generalises"
 * stops being evidence and starts being whichever file happened to be written
 * first. Duplication between them is the measurement instrument; when Phase C
 * extracts something, it goes to the core, not sideways.
 */
describe('the traditions are siblings', () => {
  const traditions = readdirSync('lib/tradition', { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)

  it('there is more than one, or this test is not yet earning its keep', () => {
    expect(traditions.length).toBeGreaterThan(1)
  })

  it('none imports another', () => {
    const offenders: string[] = []
    for (const self of traditions) {
      for (const file of filesUnder(join('lib/tradition', self))) {
        for (const other of traditions) {
          if (other === self) continue
          if (new RegExp(`from '[^']*tradition/${other}/`).test(code(file))) {
            offenders.push(`${file} → ${other}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

/**
 * Two paths differing only in case are one file on macOS and two in CI, so
 * `./controls` resolved to `Controls.tsx` on the machine that wrote it and to
 * a directory everywhere else — a green local build and a red remote one.
 *
 * Read out of git rather than off the disk, and that is the whole point: a
 * case-insensitive filesystem cannot hold the collision to be found, so a
 * test that walked the directory would pass on the machine most likely to
 * introduce one. Git records both paths whatever the checkout does with them.
 */
describe('no two tracked paths differ only in case', () => {
  it('holds across the repository', () => {
    const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
    const seen = new Map<string, string>()
    const collisions: string[] = []
    for (const file of files) {
      // Every directory prefix counts: the collision that happened was
      // between a directory and a file, not between two files.
      const parts = file.split('/')
      for (let i = 1; i <= parts.length; i++) {
        const path = parts.slice(0, i).join('/')
        const previous = seen.get(path.toLowerCase())
        if (previous && previous !== path) collisions.push(`${previous} vs ${path}`)
        seen.set(path.toLowerCase(), path)
      }
    }
    expect([...new Set(collisions)]).toEqual([])
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
