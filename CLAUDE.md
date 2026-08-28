# CLAUDE.md — Rumah Adat Nusantara

Working instructions for Claude Code. Read PRD.md for what is being built and DESIGN.md for how it must look. This file is how to work on it.

## Current state

**M5 shipped. Seven houses on a tradition-neutral core, all seven on screen.**

- `lib/tradition/toraja/` generates a tongkonan (155 parts, 33 joints), `lib/tradition/minang/` a rumah gadang (263 parts, 62 joints), `lib/tradition/jawa/` a joglo (293 parts, 58 joints), `lib/tradition/manggarai/` a mbaru niang (161 parts, 31 joints), `lib/tradition/bali/` a bale (117 parts, 50 joints), `lib/tradition/nias/` an omo (216 parts, 73 joints), `lib/tradition/dayak/` a rumah betang (189 parts at eight households, and a different number at every other count). `lib/core/` holds what is true of any house and knows a word from none of them. `lib/tradition/registry.ts` is the list the app walks. `lib/solar/` is validated against almanac values and serves seven sites — and Bawömataluo is the first north of the equator, which is worth noticing in a project that had quietly assumed one hemisphere.
- `pnpm check` type-checks and runs 358 tests. Every invariant suite runs over at least five rule combinations — eleven structural checks for the tongkonan, sixteen for the rumah gadang, and their own for the joglo, the mbaru niang, the bale, the omo and the betang — and every one passes. `checkAgainstSurvey` reports **skipped** in all seven and must stay that way.
- **The project is called Rumah Adat Nusantara.** It was called Tongkonan while there was one house, and Pasak — the peg that pins a mortise and tenon — while the point was two houses meeting one core. With four houses and more intended, the collection is the subject and the name says what a visitor finds. It is a proper name, identical in both locales. The repository and `NEXT_PUBLIC_BASE_PATH` still say `tongkonan`, because renaming a GitHub Pages project is the author's action and a half-done rename is worse than none — **that is the one outstanding step of the rename.**
- **The collection has a front door and so does each house.** `/[locale]/` is the landing: the claim, the story of how one house became several, the sites plotted on a graticule (no invented coastline — the plotted coordinates are the same ones the solar arithmetic runs on), and an index card per house with its own provenance bar. `/[locale]/[tradisi]/` is that house's front door: whose house, the caution, the orientation constraint, its split, and the four routes as described doors. The landing and the index read everything from the registry and their copy carries no counts, so a fifth house appears on them without either page changing.
- **The landing draws the houses it claims.** `lib/core/silhouette.ts` projects a built house's parts onto a vertical plane (the one its ridge runs along, from `SceneModel.ridgeAxis`), rasterises them into an occupancy grid, traces the filled/empty boundary into closed loops and simplifies them — pure arithmetic, tradition-neutral, tested over every registry entry in `test/silhouette.test.ts`. `components/Elevation.tsx` renders the loops: the landing's hero is every house standing on one ground line in one svg at one scale with a scale bar whose width is a fraction of the same viewBox (the same-scale claim cannot silently break, and a fifth house widens the shelf without the page changing); the index cards carry minis in a shared frame for the same reason; each front door carries its own elevation sheet plus the generator's readouts. Nothing is illustrated — a silhouette that disagrees with the model is impossible because it is computed from the model's parts. The landing widened to `max-w-5xl` for the shelf; prose stays at its measure. The same loops make every other picture of the site: the favicon (`app/icon.svg`, held against the generator by `test/icon.test.ts`) and the share cards (`public/og/` — the shelf for the collection, one card per house on its routes, drawn by `test/og.gen.ts`'s hand-written rasteriser and PNG encoder, no fonts and no new dependency, and held against the generator by pixel comparison in `test/og.test.ts`, which also fails when a fifth house has no card; regenerate with `WRITE_OG=1` / `WRITE_ICON=1`). The exported 404 is a real bilingual page (`app/(splash)/tidak-ditemukan/`) copied over `404.html` by the build script, because a static export answers a wrong address with one file from the host.
- **All seven houses have all four routes, in both locales**: `/[locale]/[tradisi]/{bangun,rakit,baca,sumber}`, fifty-six pages. The four old tradition-less paths still answer and say where the page went, carrying the query with them, because a citable address that stops resolving is not much of a citation.
- **There is no tradition tab row.** The rail carries a breadcrumb — which house this is, linking to its front door, and "Semua rumah" up to the landing. Switching houses goes up through the index and back down: the switch is a cut between rule packs, and the query half of the address does not survive it. The tab strip stopped scaling at four and a list page scales indefinitely.
- The split is tested three ways. `test/architecture.test.ts` fails the build if `lib/core/` imports a tradition or names one in code, if one tradition imports another, if anything under `lib/` reaches for three.js, the DOM, `Math.random` or `Date.now`, or if two tracked paths differ only in case. `test/registry.test.ts` asserts the neutral contract without naming a rank or a laras.
- Provenance, kept separate and never averaged: tongkonan 0 measured / 7 canon / 46 interpolated (87%); rumah gadang 0 / 8 / 48 (86%); joglo 0 / 8 / 44 (85%); mbaru niang 0 / 9 / 44 (83%); bale 0 / 9 / 32 (78%). All five are 100% interpolated by part. **Five houses and still no survey.** The bar has not moved and no further tradition will move it; only a measured drawing will.
- **The bale has the best canon share of the five and it is not an improvement.** 22% against 13–17%, and the reason is arithmetic rather than scholarship: its pack is the smallest, because a pavilion has fewer parts to declare, so each canon rule is a larger share of a shorter list. Nothing about this house is better sourced than the others. Do not read the number as progress, and do not let a future pack chase it by declaring fewer dimensions.
- The bar got worse before it got better, twice, and both times that was the fix. A pedagogy pass on the Toraja builders found a dozen dimensional numbers sitting as bare literals — the ridge upsweep and the rafter section among them — which the bar had never counted. The Minang builders shipped their first draft with six of their own, all in the form `DIMS.gonjongRise.value * 0.55`. Declaring them raised the interpolated share in both packs. The higher number is the honest one.
- **Counted by part rather than by dimension both houses are 100% interpolated**, and `/bangun` can mark either model to show it. Every canon rule in either pack states structure — faces north, ridge sags, horns are a tally; ruang count is odd, Koto Piliang steps the floor, bilik are a tally — and none of them sets a length, so every part depends on at least one invented metre. The shape's logic is sourced; its sizes are not. Do not resolve this by retagging a plausible number as canon.
- The frame-raising sequence, the parameter-change rebuild, the day-of-sun, rain, the four view transitions, and the section cut through the occupancy zones all work for both houses. The section is cut on the axis the ridge does not run along, so the tongkonan is cut across its ridge and the rumah gadang along it — which is what shows the anjuang stepping up at both ends.
- **Interface tokens live in `app/globals.css` and nowhere else.** Six type steps, a 4px spacing scale, and a palette that states its contrast ratio beside every pair the interface uses. `tailwind.config.ts` maps utility names onto them and declares no values of its own. A bracketed size or colour in a component (`text-[13px]`, `bg-[rgba(...)]`) is a bug — it escapes the scale the same way a hardcoded dimension escapes provenance.

**The seventh house is the Dayak betang, and it is the first with no characteristic size.** Every other building here has a shape its rules *size*; this one has a shape its rules *count*. Each household adds one bilik and one stretch of gallery to the end, so the length is a census — forty metres or two hundred, with no proportion governing the difference. `checkNoCharacteristicLength` states that, and it is the only invariant in this project that **passes by showing a proportion failing to hold**: from three households to twenty the length-to-width ratio runs 5 : 1 to 8 : 1 and never settles, while the width, the floor height and the ridge height do not move at all.

- **A survey would pin the share and not the house**, which is new for the provenance layer. Everywhere else, measuring the building settles it. Here every figure could become `measured` and the length would still be unknown, because the length is not a property of the building type. That is the correct answer rather than a gap, and `sensitivity.ts` says so.
- **No symmetry claim is made along the length, and the pack says why.** A house grown from one end is genuinely not symmetric, and picking an axis that happens to pass would state something untrue. `checkSectionIsConstant` replaces it with the regularity this building actually has: every share equal, and always one fewer partition than households.
- **A gable out of `steppedHip`, by giving both levels the same half-length.** Third distinct form from one primitive — stepped hip, pyramid, gable — and the primitive needed to know nothing. That is now settled.
- **Two of this pack's checks are also underivable-by-dimension**, like the omo's bracing, so the pattern is real rather than an accident: a check reading the same list the geometry was built from cannot be falsified by a number. Both are tested against their own arithmetic instead, and the counterexample route shows `checkShingleCoverage` against `shingleLap` — a shingle roof leaks at its joints, so take the lap away and the same ironwood over the same rafters stops covering itself.
- **The hejot is joined to nothing, and that is the fact.** A joint was written for it and `checkJointStages` refused it: a member placed last, resting on something built four stages earlier, is not engaged with it. So there is no third joint kind here — the way up leans, and at night it is pulled in.
- **The rafters were resting on whatever happened to be beneath them.** Six of them fell over doorways, where a bilik's front wall is not there, and the build-order check found it at once. They land on a plate now, and the plate on the gallery side is carried on posts continuing up from the floor — the open gallery stated in structure rather than in copy.

**The sixth house is the Nias omo, and it is the first whose governing rule comes from the ground rather than from people.** South Nias is on an active margin, so the understorey carries driwa on the diagonal as well as ehomo on the vertical: every bay of the substructure is a triangle, because a rectangle of four posts racks and a triangle does not. That makes it the first building here that is not orthogonal post-and-beam, and the first real test of this project's premise.

**The premise survived and had to be narrowed, which is the finding.** "A social fact becomes a dimension" was never the whole story: it is that *the rules a tradition states about its own building become dimensions*, and some of those rules are about people while others are about the earth. `everyBayTriangulated` is canon and is a claim about seismicity, so this pack's canon list does two jobs at once and the dimension notes say which is which. The five earlier houses could not have shown that, because none of them has a rule of the second kind.

- **`checkBracing` cannot be broken by pushing any dimension, and that is not a defect.** The braces are emitted from `layout.cells` and the check walks `layout.cells`, so widening a bay lengthens its diagonal for ever. That is the one-description discipline working. But it means the strongest structural claim in the pack is one no *number* can falsify, so it is falsified in `test/nias.test.ts` instead — by building a house and taking one plane of bracing away, by removing a single brace, and by shrinking one until it no longer reaches its corners. The counterexample route shows `checkRoofDominates` instead and says why. **A check nothing has ever seen fail is indistinguishable from one that cannot.**
- **A bay astride the mirror plane takes a cross, not a lean.** An even number of post columns puts one bay across z = 0, and a single leaning diagonal there cannot be symmetric — its own mirror leans the other way. That is a fact about the building, not a bug: the central bay gets both diagonals. It is why the brace count is not the cell count.
- **The behu are the first thing a rule adds *outside* the building.** Only a si'ulu raises them and each stone records a feast, so they state something about a household that no part of the house states. `checkFrameSymmetry` is scoped to exclude them, and `checkBracingVisible` had to learn the difference between a stone in the yard and something screening the understorey.
- **The loft was interpolated and floated; now it is derived and lands.** Sized as a share of the body it sat inside the rafters touching nothing, exactly as the joglo's roof levels did before they were taken from the pillar rings. Read off the hip at its own height, it lands on the frame that carries it and one invented number disappears.
- **`Layout.window` is now `Layout.bukaan`**, because `layout.window.height` reads exactly like DOM access to the architecture guard. The guard's value is that it is blunt; a field called `window` in a module that must never touch the DOM is a trap left for the next person.

**The fifth house is the Balinese bale, and it is here for its units rather than its form.** It is the plainest object in the project — a low platform, some posts, a hipped roof — and the reason to build it is that under Asta Kosala Kosali every principal length is a whole number of a measure of *its owner's body*: depa, hasta, musti. The other four traditions each let a household pick among fixed numbers and the metre stays neutral; here the unit is the social fact, and two households of identical standing build different buildings because they are different sizes. `lib/tradition/bali/module.ts` is the house. Three consequences worth keeping:

- **The provenance question splits in two, for the first time.** How many units (canon, where a source states the relation) and how long a unit is (anthropometry, and the author's). Those must never be merged into one metre figure with one class — the same rule that keeps two houses' interpolated shares apart, one level down. The `anthropometry` source key exists so that "not from a book about Bali" is visible in the table rather than hidden inside `none`, and a test asserts the two stay distinguishable.
- **`checkPengurip` passes by finding an inexactness.** A principal measure that lands exactly on its module is `mati` — dead — so every one carries a small increment and the house is required *not* to be exactly its own rule. Turning the rule off inverts the claim and the check then demands exactness, which is how you watch it refuse. Its counterexample is the only one in the project that ends with a building which stands up perfectly well: grow the increment until it is a whole unit and the house is dead again, one unit larger, wrong for a reason no amount of looking would reveal.
- **`checkModule` is the only check here that can see a hardcoded metre.** The provenance bar counts declarations; a number written into a builder is invisible to it. This one sees the arithmetic — and its companion test greps the builders for a unit count written inline, because `stockLength(s, 4, 'musti')` is a real dimension that `/sumber` would never list. Four were sitting in the first draft.

**`steppedHip` moved to `lib/core/hip.ts`, as `jawa/hip.ts` said it would when a second house hipped.** The bale hands it two levels — one eave, one ridge — and asks for a single band, and it needed nothing. That degenerate case is better evidence than a second elaborate one: a primitive that only works at the complexity it was written for is not a primitive. `partPoints` also moved into `lib/core/invariants.ts`, beside `partBounds`, because a second copy of an Euler matrix is a second thing to get wrong.

**A render is part of the gate, and it caught what the suite could not.** All sixteen Minang checks passed on a roof that was a long shed with six rods standing on its ridge, because none of them asked the question that mattered — whether the roof *surface* is what rises into the point. A gonjong is the end of the roof's own edge, lifted past the ridge; the hollow between a pair is the low ridge end between two high tips. That is now how it is built and there are two checks for it (`checkGonjongCount` requires the boarding to reach every tip; `checkEaveRises` requires the edge to hold its line over the middle, climb past the ridge, and take enough length doing it to be a curve). It took three looks. The second caught a sweep confined to the 0.9 m overhang — ten metres of rise over nine hundred millimetres, which rendered as four flat sails welded to the ends. Moving the lift deep inside the body fixed the slope and broke the other end of it: by the time the roof reached the end wall its edge had met its own ridge, so there was no gable left, and the carved panel closing it was still being cut to the level eave — projecting a metre past the roof each side and hanging four and a half metres below its edge. The lift now happens almost entirely over a deep overhang, `stationAt` is the single description of the roof's section, and everything reads it. The fourth look found the rafters over the overhang doing the same thing the gable panel had — cut to the level eave, half a metre outboard of the roof and a metre and a half below its edge, a set of loose sticks poking out of both ends.

The pattern in all four: **two places computing the same shape, and only one of them updated.** `checkRoofFollowsSection` is the general form of the answer — no member positioned at a station may reach outboard of that station's edge or hang below it by more than the depth of its own timber. A check written for one member would have caught one member. The same look found the rumah gadang wearing pa'barre allo across its whole front, because the material sets were split by key and the *construction* behind the key was left shared. CLAUDE.md already said the renderer's gate is the invariant suite **plus a human looking at it**. It meant it.

**A fifth instance, and the plainest yet: the mbaru niang's door was built behind its own roof.** The frame was set at the cone's radius so it would satisfy `checkInsideCone`, the thatch stands 0.20 m outside the cone at every height, and `buildThatch` emitted closed rings — so all three timbers were buried and there was no opening anywhere in the building. `checkOneDoor` passed throughout, because it counted two jambs and a lintel and computed a bearing; it never asked whether anything was open. `coneSurface` now takes a `gap` — a surface of revolution has no way to be interrupted and a door is exactly an interruption — the frame leans with the wall so it is not buried at one end whichever end you set it by, and `doorOpening()` is the one place that decides where the door is, so the frame stands on the numbers the thatch is cut by. The check now fails if any thatch vertex crosses the doorway or if a jamb sits inside the cone. The opening is wider than `doorWidth` because it has to clear the frame, and the check says so rather than printing the nominal figure.

Known gaps, all deliberate and none of them hidden:

- **Carving is texture-level, in both houses.** The pa'barre allo is constructed from its rule rather than traced, but it is drawn onto a canvas, not extruded. Relief casting real shadow is the target.
- **Contact darkening is a radial-gradient plane.** Real ambient occlusion in the joints and under the raised floor is the largest remaining quality gain. Do not ship the placeholder as the answer.
- **The tongkonan's body walls are vertical.** The real ones lean outward toward the plate. No source gives an angle, so it is left flat rather than guessed — see the note in `toraja/frame.ts`. The rumah gadang *does* lean, at a declared and openly interpolated 8°, which is the same guess made visibly instead of avoided. The two houses disagreeing about this is a question for Phase C, not a bug.
- **The rumah gadang carries four gonjong under both laras.** Houses with anjuang are commonly said to carry more, and the extra ones belong to a roof over the projecting bay — a bay this model does not build. The first attempt stood the extra pair on the middle of the main ridge, which is a shape nobody builds. Four until the bay exists; the laras stays legible in the floor, which is where the sources put it.
- **Minangkabau carving is two motifs, constructed from their description.** Pucuak rabuang and kaluak paku, both named in every published account, both plainly geometric, neither restricted. The proportions are the author's — the same standing as an interpolated dimension. Nothing beyond the two is attempted, because inventing plausible members of a large carving vocabulary would be worse than showing two real ones plainly.
- **The rumah gadang has no derivation and no drawing export.** The tongkonan's `/bangun` shows the arithmetic from three rules to the metres, and exports plan, elevation and section as SVG. Neither is written for the second house: the derivation would have to be worked out rather than generalised, and `lib/draw/` reads a tongkonan's Layout directly — prows, ijuk courses, the knee across the slope — so a second projection is a drawing problem, not a threading one. Both sections are absent for that house rather than wrong, and both components say so at the point they return null.
- **The bale is one building and a Balinese house is a compound.** A walled yard with several bale around a natah, a shrine in the kaja-kangin corner, and a gate you have to turn to get past — so the most distinctive thing about Balinese domestic building is exactly what this models none of. Same standing as the missing rangkiang and the missing anjuang bay: an absence named on screen, not a claim.
- **The bale carries no carving at all**, and on a Balinese building that is a larger omission than it was on a mbaru niang, which genuinely has none. The precedent stands anyway: inventing plausible members of a vocabulary belonging to particular carvers is worse than showing none. It is stated in the caution rather than hidden.
- **The body ratios are the author's anthropometry.** A quarter of an arm span to a hasta and so on. They are tagged `interpolated` against their own source key, `anthropometry`, so the table can say "not from a book about Bali" rather than filing them with numbers nobody thought about.
- **No survey is wired in, for any house.** Everything above follows from that.

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
  types.ts          Part, Joint, House, Dim, Source, Provenance, the Any* aliases
  provenance.ts     dim factory, worst-class, the two splits
  geometry.ts       catmull-rom, section sweep, mesh + tube builders, mirroring
  hip.ts            the stepped hip: a stack of rectangles, and the surface over it
  parts.ts          the box and mesh builders
  courses.ts        lapped courses on a slope
  address.ts        the rules codec: fields as data, query in and out
  assembly.ts       build order, bounds, the normalised timeline
  invariants.ts     symmetry, joints, build order, meshes, part provenance, survey, part points
  sensitivity.ts    perturb a dimension, rebuild, measure named probes
  counterexample.ts push a dimension until a check refuses the house
  scene.ts          SceneModel: what the renderer needs that the parts do not say
  whatif.ts         the one place a rule is temporarily something else
lib/tradition/
  registry.ts       the five houses as one list, each sealing its own rule type
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
  scene.ts          the reading the renderer needs
  facade.ts         the one file that meets the registry's vocabulary
lib/tradition/jawa/     the joglo, binding the same core
  types.ts          Stage, MaterialKey, SourceKey, JointKind, Wujud, Rules, Layout, RoofLevel
  rules.ts          wujud/tumpang/pendhapa, dimensions with provenance tags, source table, PACK
  hip.ts            the stepped hipped surface — a second roof primitive, not a generalisation
  frame.ts          rings of pillars, sunduk, floor, gebyok, senthong, the tumpang sari
  roof.ts           rafters, hip rafters, molo, tiles, and the pendhapa
  invariants.ts     not raised, hipped, roof on rings, tumpang sari, senthong empty, pendhapa
  sensitivity.ts, counterexample.ts, address.ts, scene.ts, facade.ts
lib/tradition/minang/   the rumah gadang, binding the same core
  types.ts          Stage, MaterialKey, SourceKey, JointKind, Laras, Rules, Layout
  rules.ts          laras/ruang/bilik, dimensions with provenance tags, source table, PACK
  ridge.ts          the symmetric ridge and the gonjong path
  frame.ts          layout resolution, posts, rasuak, deck, anjuang, leaning walls, bilik
  roof.ts           the quarter-turned sweep, rafters, purlins, singok, gonjong, ijuk
  assembly.ts       buildHouse
  invariants.ts     ruang odd, ridge profile, anjuang floor, gonjong count, bilik tally, walls lean
  sensitivity.ts, counterexample.ts, address.ts, scene.ts, facade.ts
lib/solar/
  position.ts       NOAA solar position; shared with the zero-shadow-day tool
  presets.ts        equinox, June solstice, and the computed zero-shadow day
lib/draw/
  orthographic.ts   plan, elevation and long section as SVG line drawings
  sheet.ts          all three on one 1:50 sheet with the source table
components/         renderer, shared controls, provenance strip
  rules/            one rule-control set per tradition, sharing primitives
app/[locale]/[tradisi]/   bangun, rakit, baca, sumber
app/[locale]/             the four old paths, saying where they went
```

**The first hard split: `lib/` generates, the renderer draws.** `lib/` must never import three.js, touch `window`, or read the DOM. The renderer must never generate geometry. If a shape is being computed inside a component, it is in the wrong file.

**The third hard split: the app may not know which house it has.** `lib/tradition/registry.ts` seals each rule type inside its entry. A route, a rail or the renderer takes a `Built` — parts, a scene model, a timeline, verdicts, provenance — and nothing in it names a rank or a laras. The renderer draws `House<Kinds>`, which was already neutral; the registry is what was still stopping the app from using it.

The exception is the rule controls, and it is deliberate. A data-driven field schema would render both houses from one component and would cost the rank multiplier printed on the rank that applies it, the warning when a bay count is unusual, and the gloss saying that refusing a step *is* the statement. Those are the parts of the interface carrying the argument. So each tradition keeps its own controls under `components/rules/` and they share primitives: **the abstraction goes under the widgets, not over them.**

**The second hard split: `lib/core/` may not know what it is building.** It is generic over a `Kinds` bag — a tradition declares its own stages, materials, sources, dimension keys and joinery, and the core is parameterised on them. So `Part.stage` is not one of nine Toraja words at the type level; it is whatever the tradition binding says it is, and a Minang part cannot claim a Toraja stage and type-check.

The direction is one-way and enforced: a tradition imports the core, the core imports nothing from a tradition and mentions none by name in code. When a change to the core would be easier if it could read a real value out of the Toraja pack, that is the abstraction being wrong, not a reason to add the import.

Both splits are what make the geometry testable. Neither is a style preference.

**Concrete aliases at the boundary.** Each tradition re-exports the core types bound to itself (`export type Part = CorePart<TorajaKinds>`), so the generator and the renderer say `Part`, not `Part<TorajaKinds>`, and a `switch` over a material is still exhaustively checked. Generic-over-`Kinds` costs nothing at the point of use, and it is meant to stay that way.

**One `Dim` knows its source key, not its own key.** `Dim<S extends string>` is parameterised on the source table alone. Parameterising it on the full `Kinds` would be circular — `Kinds['dim']` is `keyof typeof DIMS`, so a `Dim` would be defined in terms of the table it is an entry in.

## The address

The URL has two halves and they mean different things.

- **The path is the tradition.** `/[locale]/[tradisi]/[route]`. A tradition selects a rule pack rather than being one of its rules, and putting it in the query would make one string mean two kinds of thing at once. The tradition switch keeps the route and drops the query, because `?pangkat=layuk` means nothing to a rumah gadang and carrying it across would hand the reader an address silently describing a different house from the one they left.
- **The query string is the house**, in that tradition's own parameter names: `?pangkat=…&ruang=…&tanduk=…` for one, `?laras=…&ruang=…&bilik=…` for the other. Every rule always written, defaults included — it is a complete description anyone can cite, and a description that omits its defaults is a diff instead. The mechanism is `lib/core/address.ts`; each tradition declares only which fields exist and what they are called.
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
- **Phase C — done.** Five extractions the two houses earned, a registry, a scene model, the renderer generic over both, the route, the copy, and the rename.
- **Phase D — done.** A third house: the joglo. Built to settle the questions two houses could not, and it settled them mostly by refusing to fit.

### What the third house settled

- **`sweepSurface` is not the roof primitive, it is the swept-roof primitive.** `minang/roof.ts` asked whether a third house turning the sweep meant the axis belonged in `SweepOptions`. The joglo declined the ballot: a hipped roof has a ridge shorter than its building and four planes falling to a closed eave, and no amount of sweeping makes one. `jawa/hip.ts` is a second primitive standing beside the first, not a generalisation of it. It moves to the core when a second house hips.
- **`ridgeCurve` stays two functions.** `minang/ridge.ts` was waiting for a third vote. It got an abstention: this ridge is a straight segment and has no curve to share.
- **`Layout` is still three `Layout`s**, and the third is the least like the others — rings of pillars, a corbelled stack, a stack of roof rectangles.
- **Not every house is raised.** `SceneModel.underfloorHeight` assumed a habitable void; a joglo has a plinth you cannot get under. The field reports the clearance honestly and the difference between the traditions is an order of magnitude, which is the difference between a storey and a step.
- **Not every house divides vertically.** `SceneModel.zones` is a stack of horizontal bands because that is what two houses needed. This one divides from the centre outward — under the brunjung against under the penanggap — and the bands are the closest honest reading of that, not the thing itself. A fourth house should not be made to pretend otherwise. See the note at the head of `jawa/scene.ts`.
- **~~Not every site has a zero-shadow day.~~ This bullet was wrong and is kept as a correction.** It claimed Yogyakarta at 7.8° south never sees the sun overhead. The tropic runs to 23.44°, so every site in this project is inside it, and `zeroShadowDays` returns 28 February and 13 October 2025 for Yogyakarta. The app has always printed the correct date; the December-solstice fallback has never been taken by any site here. What was true and is worth keeping: the original code fell back to a March date *and kept the label*, which would have printed a day on which nothing happens and called it a zero-shadow day. The fallback is right to exist and right to say plainly that there is no zenith — it is just untested, and the reason given for it was false.
- **A rule can be a flag.** Both earlier packs had only choices and counts; the pendhapa is present or absent, so `rulesCodec` grew a `flag` field rather than the house pretending a boolean was a number.
- **A test written against two examples asserted uniqueness where the truth was variety.** `registry.test.ts` required every tradition to run its ridge on a different axis — true of two, false of three. What matters is that they disagree at all, which is why the field exists.
- **`courseBands` turned out to be about lapping, not about thatch.** Extracted when two thatched roofs agreed; it holds for fired clay on a hip, which is the first evidence it was extracted for the right reason.
- **And what came through untouched:** the whole generic half of the invariant suite, for the third time, which is now reasonable evidence that it is generic.

Three houses, three different ways for a social fact to become a dimension, and no two of them the same shape: the tongkonan has a rank that scales everything, the rumah gadang has a switch that is legible in the floor, and the joglo has a graded series and a tier count that state standing without counting anything. There is still no shared `Rules` interface and there should not be one.

### What the fifth house settled

- **`steppedHip` is a primitive, and the proof was the trivial case.** It moves to the core, as `jawa/hip.ts` said it would. What settled it was not a second elaborate hipped roof but a roof with one band, which the code handled without a line changed.
- **`sweepSurface`'s axis question is still open, and now permanently.** Two houses sweep, and the third and fifth do not sweep at all. There is no third vote coming from this direction; if the axis ever belongs in `SweepOptions` it will be because a *sweeping* house wants it.
- **A rule can be a measurement of a person.** `rulesCodec` needed nothing — an integer field is an integer field — which is the right outcome: the mechanism's job is fields, and what a field means is the tradition's business. But it is the first control in the project that wants a slider rather than radios, because an arm span is not enumerable and four preset body sizes would have said something false.
- **A dimension can have two provenances, and they must not be merged.** See above. This is the first pack where one class per number was not enough.
- **A check can pass by finding a disagreement.** `checkPengurip` is the only invariant here whose success condition is that something does *not* line up. It also gives the project its first counterexample that produces a perfectly constructible building — every earlier one ends with something that cannot be built, and this one ends with something that merely must not be.
- **`underfloorHeight` has now carried four meanings** — a storey, a thatched metre and a quarter, a plinth, and something you sit on the edge of. It still reports a clearance and lets the number say which, which remains the right answer and is now well tested.
- **`zones` fits for a second time and for a different reason.** The mbaru niang's five floors are a stack because the building is stacked; the bale's three bands are the tri angga, a division the tradition states about the building. One field, one physical arrangement and one named cultural claim, both honest.
- **Five houses, five different ways for a social fact to become a dimension, and the fifth is the odd one out**: a rank that scales, a switch legible in the floor, a graded series with a tier count, a household tally — and then a house where the social fact is not *which number* but *whose body the numbers are counted in*. There is still no shared `Rules` interface and there should not be one.
- **And a correction the fifth house's site turned up:** the solar preset comment claimed Yogyakarta at 7.8° south never sees the sun overhead. It does — the tropic runs to 23.44° and every site here is inside it. See the note under the third house.

### What Phase C settled

- **What was extracted, and only because two houses agreed:** lapped courses, the box and mesh builders, the rules codec, the sensitivity probe, the counterexample search. Each had been written twice and each pair was the same arithmetic over different constants.
- **What was not, and stays not:** `Layout`. There is still no shared one and now for a second reason — the second carries anjuang, gonjong tips, lanjar and bilik, and runs its ridge on the other axis. What a probe should measure and which check is worth breaking are judgements about a particular building; the mechanisms moved and the judgements did not.
- **The renderer needed a narrower question than `Layout` answers.** Not "what are this house's dimensions" but "where does the water land, how does it divide vertically, how far does the roof reach, which way is it long". That question two houses could answer, and `SceneModel` is the answer.
- **A schema for controls was declined**, with reasons, above.
- **Extracting found two disagreements and one bug.** The two address codecs disagreed about whether `?tanduk=` means six horns or none — it means a truncated address, so it falls back. The counterexample search found that an anjuang step shallower than the boards forming it produced a bearer of negative height. And `components/controls/` collided with `Controls.tsx` on a case-insensitive filesystem, which is now a test that reads from git rather than the disk, because the machine most likely to introduce that collision is the one that cannot hold it.

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
- **Splitting a shared thing by name and thinking it is split.** The material sets were split per tradition and the carving *construction* behind `ukiran` stayed shared, so the rumah gadang wore the Toraja sun disc across its front for a whole phase. `SHARED_MATERIALS` and `OWN_MATERIALS` in `components/materials.ts` now say which is which, and carving is listed as each tradition's own even though both houses have one.
- **Making the render prettier with bloom, vignette, DOF, or a HDRI.** See DESIGN.md. The register is a physical model under real light, and effects on top of interpolated numbers are a lie told fluently.
- **Abstracting further before the second house exists.** Phase A extracted only what is mechanically neutral — parts, joints, build order, mesh integrity, provenance, the geometry primitives — and it did so without inventing a single shared concept. Everything past that line waits. `Layout` is two thirds Toraja roof and stays tradition-side; there is no shared `Rules` interface, because a rank and a Minang lineage-system switch have nothing in common but being said out loud; the control schema, the tradition registry and the renderer adapter are all Phase C. An abstraction designed from one example comes out tongkonan-shaped and, worse, looks validated.
- **Hardcoding a dimension in the renderer** because it is faster than threading it through the layout. It breaks the split and it silently escapes the provenance layer.
- **Reaching for a mesh library** for CSG, lofting, or subdivision. Generation is the subject.

## Ambient occlusion

Real AO in the joints and under the raised floor is the single largest quality gain available and worth doing properly once the register is settled. A radial-gradient contact plane under the body is an acceptable placeholder; do not ship it as the final answer. Do not pull in a post-processing stack before M2 is judged.
