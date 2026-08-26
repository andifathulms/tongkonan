# CLAUDE.md — Tongkonan

Working instructions for Claude Code. Read PRD.md for what is being built and DESIGN.md for how it must look. This file is how to work on it.

## Current state

**M5 shipped. Phases A and B of the second-tradition work are done: the generator is split into a tradition-neutral core, and there are now two houses binding it.**

- `lib/tradition/toraja/` generates a tongkonan: 155 parts and 33 joints at the default rules. `lib/tradition/minang/` generates a rumah gadang: 265 parts and 62 joints. `lib/core/` holds what is true of any house and knows a word from neither. `lib/solar/` is validated against almanac values. `lib/draw/` emits plan, elevation and long section as SVG.
- `pnpm check` type-checks and runs 119 tests. Both invariant suites run over five rule combinations each — eleven structural checks for the tongkonan, sixteen for the rumah gadang — and every one passes. `checkAgainstSurvey` reports **skipped** in both and must stay that way.
- **The app still shows only the tongkonan.** The Minang generator is complete and tested but not routed, because putting it on screen needs the tradition registry, the control schema and the renderer adapter, and those are Phase C by design. The bundle is unchanged.
- Provenance, kept separate and never averaged: tongkonan 0 measured / 7 canon / 46 interpolated; rumah gadang 0 measured / 8 canon / 54 interpolated. Both land at 87% interpolated by dimension and 100% by part. The second house did not improve the number and was never going to.
- The split is itself tested. `test/architecture.test.ts` fails the build if `lib/core/` imports a tradition or names one in code, if one tradition imports another, or if anything under `lib/` reaches for three.js, the DOM, `Math.random` or `Date.now`. Those properties are invisible at the point of use, which is exactly why they rot.
- The bar got worse before it got better, twice, and both times that was the fix. A pedagogy pass on the Toraja builders found a dozen dimensional numbers sitting as bare literals — the ridge upsweep and the rafter section among them — which the bar had never counted. The Minang builders shipped their first draft with six of their own, all in the form `DIMS.gonjongRise.value * 0.55`. Declaring them raised the interpolated share in both packs. The higher number is the honest one.
- **Counted by part rather than by dimension both houses are 100% interpolated**, and `/bangun` can mark the tongkonan to show it. Every canon rule in either pack states structure — faces north, ridge sags, horns are a tally; ruang count is odd, Koto Piliang steps the floor, bilik are a tally — and none of them sets a length, so every part depends on at least one invented metre. The shape's logic is sourced; its sizes are not. Do not resolve this by retagging a plausible number as canon.
- `/bangun`, `/rakit`, `/baca`, `/sumber` exist in Indonesian and English. The frame-raising sequence, the parameter-change rebuild, the day-of-sun, rain, the four view transitions, and the section cut through the three zones are all in.
- **Interface tokens live in `app/globals.css` and nowhere else.** Six type steps, a 4px spacing scale, and a palette that states its contrast ratio beside every pair the interface uses. `tailwind.config.ts` maps utility names onto them and declares no values of its own. A bracketed size or colour in a component (`text-[13px]`, `bg-[rgba(...)]`) is a bug — it escapes the scale the same way a hardcoded dimension escapes provenance.

Known gaps, all deliberate and none of them hidden:

- **Carving is texture-level.** The pa'barre allo is constructed from its rule rather than traced, but it is drawn onto a canvas, not extruded. Relief casting real shadow is the target.
- **Contact darkening is a radial-gradient plane.** Real ambient occlusion in the joints and under the raised floor is the largest remaining quality gain. Do not ship the placeholder as the answer.
- **The tongkonan's body walls are vertical.** The real ones lean outward toward the plate. No source gives an angle, so it is left flat rather than guessed — see the note in `toraja/frame.ts`. The rumah gadang *does* lean, at a declared and openly interpolated 8°, which is the same guess made visibly instead of avoided. The two houses disagreeing about this is a question for Phase C, not a bug.
- **No survey is wired in.** Everything above follows from that.

Keep this section accurate. A stale "Current state" is worse than none — a previous project in this portfolio still claimed "not yet scaffolded" long after it had six routes and thirty-five components, and that misled every session that read it. Update this line in the same commit as the work it describes.

## Stack

- Next.js 14, App Router, `output: 'export'` — static, deploys to GitHub Pages, no server anywhere.
- TypeScript, `strict: true`.
- Tailwind. Design tokens from DESIGN.md only, written down once in `app/globals.css` and mapped to utility names in `tailwind.config.ts`.
- pnpm.
- Vitest for the generator and the solar engine.
- **three.js is the one runtime dependency exception.** Justification: in the other apps the algorithm being hand-written *is* the subject, so no library. Here the subject is the rule→geometry generation, and rasterisation is not. Using three.js to draw a mesh we generated ourselves is like using a font rather than drawing glyphs. Do not let this reasoning expand — geometry generation, solar position, and the invariants stay hand-written with no library.
- Zero runtime network. Vendor three.js. System font stacks. Every texture generated on a canvas at runtime.

## Architecture

```
lib/core/         true of any house — generic over what a tradition calls things
  kinds.ts          Kinds (stage/material/source/dim/joint/rules) and RulePack
  types.ts          Part, Joint, House, Dim, Source, Provenance
  provenance.ts     dim factory, worst-class, the two splits
  geometry.ts       catmull-rom, section sweep, mesh + tube builders, mirroring
  assembly.ts       build order, bounds, the normalised timeline
  invariants.ts     symmetry, joints, build order, meshes, part provenance, survey
  whatif.ts         the one place a rule is temporarily something else
lib/tradition/toraja/   the tongkonan, binding the core
  types.ts          Stage, MaterialKey, SourceKey, JointKind, Rank, Rules, Layout
  rules.ts          rank/bays/horns, dimensions with provenance tags, source table, PACK
  ridge.ts          the sagging ridge and the prow taper
  frame.ts          layout resolution, posts, floor frame, deck, walls, tulak somba, horns, joints
  roof.ts           ridge assembly, rafters, purlins, ijuk courses
  assembly.ts       buildHouse
  invariants.ts     ridge profile, ijuk coverage, eave oversail, eave/plate, post count
  sensitivity.ts    how far the house moves if a dimension is a fifth out
  counterexample.ts a house built to make a check refuse it
  derivation.ts     the arrow from three rules to the dimensions, written out
  address.ts        the three rules, to and from a query string
lib/tradition/minang/   the rumah gadang, binding the same core
  types.ts          Stage, MaterialKey, SourceKey, JointKind, Laras, Rules, Layout
  rules.ts          laras/ruang/bilik, dimensions with provenance tags, source table, PACK
  ridge.ts          the symmetric ridge and the gonjong path
  frame.ts          layout resolution, posts, rasuak, deck, anjuang, leaning walls, bilik
  roof.ts           the quarter-turned sweep, rafters, purlins, singok, gonjong, ijuk
  assembly.ts       buildHouse
  invariants.ts     ruang odd, ridge profile, anjuang floor, gonjong count, bilik tally, walls lean
  address.ts        the three rules, to and from a query string
lib/solar/
  position.ts       NOAA solar position; shared with the zero-shadow-day tool
  presets.ts        equinox, June solstice, and the computed zero-shadow day
lib/draw/
  orthographic.ts   plan, elevation and long section as SVG line drawings
  sheet.ts          all three on one 1:50 sheet with the source table
components/         renderer, controls, provenance strip
app/[locale]/       bangun, rakit, baca, sumber
```

**The first hard split: `lib/` generates, the renderer draws.** `lib/` must never import three.js, touch `window`, or read the DOM. The renderer must never generate geometry. If a shape is being computed inside a component, it is in the wrong file.

**The second hard split: `lib/core/` may not know what it is building.** It is generic over a `Kinds` bag — a tradition declares its own stages, materials, sources, dimension keys and joinery, and the core is parameterised on them. So `Part.stage` is not one of nine Toraja words at the type level; it is whatever the tradition binding says it is, and a Minang part cannot claim a Toraja stage and type-check.

The direction is one-way and enforced: a tradition imports the core, the core imports nothing from a tradition and mentions none by name in code. When a change to the core would be easier if it could read a real value out of the Toraja pack, that is the abstraction being wrong, not a reason to add the import.

Both splits are what make the geometry testable. Neither is a style preference.

**Concrete aliases at the boundary.** Each tradition re-exports the core types bound to itself (`export type Part = CorePart<TorajaKinds>`), so the generator and the renderer say `Part`, not `Part<TorajaKinds>`, and a `switch` over a material is still exhaustively checked. Generic-over-`Kinds` costs nothing at the point of use, and it is meant to stay that way.

**One `Dim` knows its source key, not its own key.** `Dim<S extends string>` is parameterised on the source table alone. Parameterising it on the full `Kinds` would be circular — `Kinds['dim']` is `keyof typeof DIMS`, so a `Dim` would be defined in terms of the table it is an entry in.

## The address

The URL has two halves and they mean different things.

- **The query string is the house.** `?pangkat=…&ruang=…&tanduk=…`, all three always written, defaults included — it is a complete description anyone can cite, and a description that omits its defaults is a diff instead. `lib/banua/address.ts`.
- **The fragment is the reader.** Camera, date, time, toggles, explode, stage, section. Written only where it differs from the default, so an untouched page has no fragment at all. Never reaches a server, never reloads. `lib/reader.ts`.

Rules go in the query string, vantage goes in the fragment, and nothing crosses. The two writers each preserve the other half, read live at write time; a test holds that. Vantage writes are debounced 250ms because a dragged slider would otherwise hit the browser's history rate limit.

Playing state is deliberately not in the address. A link that starts animating at someone is a link nobody wants twice.

## Coordinates and units

- Metres throughout. No arbitrary units, no scaling factors in the renderer.
- X runs front (north, negative) to rear (south, positive).
- Y is up. Ground is y = 0.
- Z is transverse. The building is bilaterally symmetric about z = 0.

The north–south axis is baked in because orientation is a rule, not a parameter. Do not add a building rotation.

X-runs-front-to-rear is the shared convention; *what decides which end is the front* is the tradition's own rule, and the Toraja answer — ulunna banua faces north — is Toraja, not general. A second tradition declares its own orientation constraint. It still gets no control.

## The generator contract

`buildHouse(rules)` → `{ house, layout }`. Pure, deterministic, no unseeded randomness, no `Date.now()`. The same call runs in the browser and in the test suite and must produce identical output.

Parts are either:
- **boxes** — centre, size, optional XYZ-order Euler rotation. Boxes stay boxes so joint containment has something exact to test against.
- **meshes** — explicit positions/normals/uvs/indices, in world coordinates.

Every part carries `stage` and `order`. Together they are the build sequence, which the assembly animation walks and the invariants check. `order` is not a z-index.

## Provenance

Every dimension in `rules.ts` is wrapped with its class (`measured` / `canon` / `interpolated`) and a source key. This is not optional metadata — the UI reads it, `/sumber` lists it, and a test prints the interpolated share.

When adding a dimension, tag it honestly. If you invented the number, it is `interpolated` with source `none`. Do not tag a plausible guess as `canon` because a source discusses the feature qualitatively.

**A number is a dimension if changing it changes the size, position or shape of something the reader can see.** Those go in `DIMS` — never inline in a builder, however small or however obviously right. Mesh tessellation counts and UV scales are not dimensions and stay as literals. A test greps the builders for decimals multiplied by the rank scale, because the failure mode is reaching for a number inline when declaring it is slower.

Replacing an interpolated value with a measured one should be a two-line edit: change the value, change the class, point at the survey. Nothing downstream may need to know.

**Provenance is never merged across traditions.** Two houses have two source tables and two interpolated shares, shown separately. An averaged figure over both would be the single most dishonest number this project could print — a house nobody has surveyed hiding behind a house somebody has. `provenanceSplit` takes one tradition's dimensions at a time and that is deliberate.

## Invariants

`pnpm check` type-checks and runs the invariant suite across **at least four rule combinations**, not just the default. The full list is in PRD.md. Rules:

- A failing invariant fails the build. No skipping to unblock a feature.
- `checkAgainstSurvey` reports **skipped** until a real measured drawing exists. Never soften it to green. It is the only check that cannot be satisfied by better code, and that is the point.
- When adding geometry, add the invariant that would catch it being wrong. A render that looks right but violates symmetry or leaves the frame bare under a course is still wrong.

Use exact AABBs for rotated boxes (`|R| · halfExtents`), not a diagonal pad — a coarse bound produces false failures on long leaning members.

## Testing

- Generator and solar engine: Vitest, pure unit tests, no browser.
- Solar engine is validated against known almanac values, not against itself.
- The renderer is not unit-tested. Its correctness gate is the invariant suite plus a human looking at it.
- `test/architecture.test.ts` tests the hard splits directly — the core naming no tradition, and no tradition importing another — because they are properties of the file layout that nothing else would notice breaking. Its naming check strips comments and keeps string literals: the prose has to be able to say "the core may not know a Toraja word" without being the violation it describes, and the thing worth catching is a `stage === 'ijuk'` branch, not a sentence.

## Conventions

- Indonesian is the default locale; English is second. Toraja terms are used as the names of the parts in both.
- UI copy: sentence case, plain verbs, active voice. A control says what happens when it is used.
- Prose is 16px. One-line glosses attached to a control and mono figures are 13px, because they are labels on a thing rather than sentences. Nothing else sits between them.
- Text pairs clear 4.5:1 and interactive targets clear 24px. When a pigment has to carry meaning and cannot clear the floor as a fill, give it an ink variant for its stroke rather than changing the pigment.
- Comments explain *why*, especially where a choice encodes something about the building. `// the eave oversails the posts so the drip line clears the post feet` is worth writing; `// set the eave` is not.
- No `any`. No non-null assertions to silence the checker.
- Commit messages state what changed in the model, not what changed in the code.

## Hard rules

1. **No idle rotation, ever.** Rotation is drag-only. A spinning model reads as a screensaver and tells the reader the object is decorative. Scripted view *transitions* are allowed; a turntable is not.
2. **No building rotation control.** Orientation is a constraint.
3. `lib/` stays pure. No three.js, no DOM, no randomness.
4. No downloaded textures, no photographic assets, no runtime network.
5. Provenance visible on every screen that shows a dimension.
6. `checkAgainstSurvey` stays skipped until a survey exists.
7. No morph between traditions.
8. `prefers-reduced-motion` gets a complete alternative, never a removed feature. The frame-raising sequence is content: de-animate it, do not delete it.

## The second tradition

Phase 2 is real and these decisions are made. Phase A has landed; B and C have not.

- **Phase A — done.** Split `lib/core/` from `lib/tradition/toraja/`, extracting only what is mechanically neutral. No new concepts invented, no user-visible change, tests and provenance figures identical before and after.
- **Phase B — done.** The rumah gadang, built concretely in `lib/tradition/minang/` and allowed to duplicate. Generator, rule pack, source table, invariants and tests; not routed.
- **Phase C — extract the second layer, from two examples, and put the second house on screen.** The tradition registry, the control schema, the renderer adapter, the route, the copy. See what the second house taught, below: that list is the input.

### What the second house taught

Written down while it is fresh, because this is the entire reason for building it.

**The core came through almost unchanged**, which is the main result. Joints, build order, joint stages, mesh integrity, part provenance and the survey check all ran against the rumah gadang as written. Only `checkSymmetry` needed touching, and both changes it needed were real:

- The plane needed a *label*. Both houses mirror about z = 0, but this one's ridge runs *along* that plane rather than across it — so "the ridge plane" was Toraja wording that happened to be true, not a general fact. The X-runs-front-to-rear convention held; the relationship between the ridge and the mirror did not.
- The claim needed a *scope*. The rumah gadang is symmetric in its frame and deliberately asymmetric in its bilik, because the bilik are a tally that fills from one end. A check over everything would have had to be false or be softened; scoped to the frame, and paired with `checkBilikTally` stating the sequence positively, it says two true things. The verdict prints how many parts were left out, so a narrowed claim can never read as a whole-building one.

**What broke that would have broken a premature abstraction:**

- **There is no rank scale.** Every Toraja dimension passes through one multiplier set by rank, because there the social parameter governs *size*. Here the social parameter governs *shape* — whether the floor steps — and size comes from the plan counts. A shared `scale` field would have been the first casualty.
- **`Layout` is still not shareable**, and now for a second reason: this one carries anjuang, gonjong tips, lanjar and bilik, and its ridge runs on the other axis.
- **A declared dimension in one house is derived in the other.** `roofKneeDrop` is a guess for the tongkonan because nothing pins its break to a height; here the rafters bear on the wall plate, so the knee is arithmetic. The first draft declared it anyway and put the whole roof 100 mm above the plate it sits on — the joint invariant caught it. Fewer invented numbers, and a roof that touches its own frame.
- **Orientation is a constraint in both and not the same kind of constraint.** Toraja is absolute — the front faces north. Minang is relational — the front faces the halaman with the rangkiang across it. Neither gets a control; a shared `orientation: degrees` would have been wrong for one of them.

**What is now demonstrably shared and is Phase C's extraction list:** the `ijukBands` course algorithm (identical logic, different constants), the `box`/`meshPart` builders, the `sAtX`/`sAtZ` ridge parameterisation, the plate–rafter–purlin pattern, and the shape of `address.ts`. `sweepSurface` is shared already, reached by a quarter turn (`swapXZ`) rather than an axis flag — two houses is not yet a pattern, so if a third also turns it, the axis belongs in `SweepOptions`.

**One thing the build order taught about the building itself:** over the body the roof is carried from below — the lower rafter lands on the plate, the upper meets it at the knee. Over the two gable overhangs there is no plate, so the upper rafter hangs off the ridge and the lower hangs off that. The invariant refused the overhang until that was written down, which is a check earning its keep: a cantilever built from the bottom up is a cantilever with nothing holding it.

Why gadang and not Batak Toba: Toba is nearly isomorphic to the tongkonan — single sagging ridge, boat roof, raised on posts — so it would go fast and teach nothing, and it would produce an abstraction that is tongkonan-shaped while appearing validated. Gadang refuses to fit, which is the point. The Koto Piliang / Bodi Caniago split (raised end platforms vs a flat floor) is a socially-loaded geometric switch of the same kind as rank, and the multi-gonjong roof genuinely breaks `roofStations`, which sweeps one section along one ridge.

Decisions taken, so they are not re-litigated:

- **Tradition is a path segment, not a query parameter:** `/[locale]/[tradition]/bangun?…`. The query string stays "the house" and each tradition declares its own param names. A tradition selects a rule pack rather than being a rule, and putting it in the query would make that string mean two kinds of thing at once.
- **The project gets renamed to Pasak** — the peg that pins a mortise and tenon. Standard Indonesian, belongs to no one tradition, and it names the join rather than the house. The rename executes in Phase B, when there are two houses; calling a one-tongkonan app Pasak before then is a promise the app does not keep.
- **Hard rule 7 gets stronger, not weaker.** A tradition switcher is a cut: unmount, remount, no crossfade, no shared camera easing. The morph is forbidden because it asserts a continuity that does not exist, and a switcher is where that temptation will actually arrive.
- **The survey is still the higher-value work.** A second tradition does not move the interpolated bar; it adds a second bar that starts worse. If a measured drawing of a named tongkonan becomes obtainable, it pre-empts Phase B.

## Things that will be tempting and are wrong

- **Adding a roof-shape slider.** The roof is downstream of the rules. If the shape needs adjusting, adjust the rule pack and say why in the provenance note.
- **Making the render prettier with bloom, vignette, DOF, or a HDRI.** See DESIGN.md. The register is a physical model under real light, and effects on top of interpolated numbers are a lie told fluently.
- **Abstracting further before the second house exists.** Phase A extracted only what is mechanically neutral — parts, joints, build order, mesh integrity, provenance, the geometry primitives — and it did so without inventing a single shared concept. Everything past that line waits. `Layout` is two thirds Toraja roof and stays tradition-side; there is no shared `Rules` interface, because a rank and a Minang lineage-system switch have nothing in common but being said out loud; the control schema, the tradition registry and the renderer adapter are all Phase C. An abstraction designed from one example comes out tongkonan-shaped and, worse, looks validated.
- **Hardcoding a dimension in the renderer** because it is faster than threading it through the layout. It breaks the split and it silently escapes the provenance layer.
- **Reaching for a mesh library** for CSG, lofting, or subdivision. Generation is the subject.

## Ambient occlusion

Real AO in the joints and under the raised floor is the single largest quality gain available and worth doing properly once the register is settled. A radial-gradient contact plane under the body is an acceptable placeholder; do not ship it as the final answer. Do not pull in a post-processing stack before M2 is judged.
