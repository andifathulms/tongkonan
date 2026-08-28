import { describe, expect, it } from 'vitest'
import { TRADITIONS } from '@/lib/tradition/registry'
import {
  FALLBACK_MATERIAL,
  OWN_MATERIALS,
  SHARED_MATERIALS,
  materialKeysFor,
} from '@/components/materials.keys'

/**
 * The material sets, checked without a renderer.
 *
 * These tests exist because a route shipped broken. The betang's set was built
 * with `ulin` and `sirap` — it has no generic `kayu`, because on that building
 * the timber is ironwood and is named for it — while the fallback key was
 * written as `tradition === 'jawa' ? 'jati' : 'kayu'`. `assemble` throws when
 * its fallback is not in the set, so `/dayak/bangun` threw on load and showed
 * a client-side exception.
 *
 * Nothing could have caught it. The lists lived beside the three.js
 * generators, so any check would have needed a DOM; the renderer is not unit
 * tested by policy; and the failure is invisible to type-checking because the
 * set is a `Record<string, Material>`. The keys are now pure data in their own
 * module, and these are the questions that were unaskable.
 *
 * Note what is *not* tested here: that a material looks right. That remains a
 * human looking at it. What is tested is that every key a part asks for is one
 * the tradition is entitled to, and that the fallback is a key that exists —
 * both of which are facts rather than judgements.
 */
describe('every tradition can build its own materials', () => {
  for (const tradition of TRADITIONS) {
    /**
     * The direct cause of the broken route.
     *
     * `assemble` refuses a set whose fallback is missing, and it is right to:
     * a fallback that is not there cannot catch anything. But it refuses at
     * construction time in the browser, which is the worst possible moment.
     */
    it(`${tradition.key}: its fallback material is one it actually has`, () => {
      const fallback = FALLBACK_MATERIAL[tradition.key]
      expect(fallback).toBeTruthy()
      expect(materialKeysFor(tradition.key)).toContain(fallback)
    })

    /**
     * The general form of the fault, which is worth more than the specific one.
     *
     * A part asking for a key no generator produces would fall back silently in
     * production and throw in development — so the model would be drawn in the
     * wrong material by a build nobody was watching. Checked against the parts
     * themselves rather than against the `MaterialKey` union, because the union
     * says what a tradition *may* use and this says what it *does*.
     */
    it(`${tradition.key}: every material its parts ask for is declared`, () => {
      const declared = new Set(materialKeysFor(tradition.key))
      const asked = new Set<string>()
      for (const query of [tradition.defaultQuery, tradition.showcaseQuery]) {
        for (const part of tradition.build(query).house.parts) asked.add(part.material)
      }
      expect(asked.size).toBeGreaterThan(0)
      expect([...asked].filter((k) => !declared.has(k))).toEqual([])
    })

    /**
     * And the other direction: a key declared but never used is a generator
     * running for nothing, and more usefully a sign that a rename happened on
     * one side only — which is how the rumah gadang ended up wearing a Toraja
     * sun disc. Scoped to the tradition's own list, because the shared list is
     * deliberately a superset.
     */
    it(`${tradition.key}: every material it claims as its own is used`, () => {
      const asked = new Set<string>()
      for (const query of [tradition.defaultQuery, tradition.showcaseQuery]) {
        for (const part of tradition.build(query).house.parts) asked.add(part.material)
      }
      expect(OWN_MATERIALS[tradition.key].filter((k) => !asked.has(k))).toEqual([])
    })
  }

  it('shares no key that a tradition also claims as its own', () => {
    for (const tradition of TRADITIONS) {
      const overlap = OWN_MATERIALS[tradition.key].filter((k) => SHARED_MATERIALS.includes(k))
      // A key in both lists would be a substance claimed as particular and
      // generated generically — the split-by-name fault, stated as data.
      expect(overlap).toEqual([])
    }
  })

  it('gives every tradition in the registry a fallback', () => {
    for (const tradition of TRADITIONS) {
      expect(Object.keys(FALLBACK_MATERIAL)).toContain(tradition.key)
      expect(Object.keys(OWN_MATERIALS)).toContain(tradition.key)
    }
  })
})
