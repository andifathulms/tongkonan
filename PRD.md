# PRD — Tongkonan

## The argument

A tongkonan is not a shape to be modelled. It is a rule system: proportions, counts and orientations that encode rank, kinship and cosmology. This app takes those rules as input and generates the building from them, so that changing a socially meaningful number visibly changes the house.

That is the whole thesis, and every product decision follows from it:

- There is no "roof curvature" slider. Parameters are things a household would say about itself — rank, number of rooms, number of funerals held.
- The geometry is computed from those parameters, not authored.
- Every dimension declares where it came from, because a smooth 3D render implies a precision the sources do not have.

Same family as the payroll and holiday calculators: a rule pack with citations. The difference is that the output is a solid instead of a number.

## Scope

**v1 is Toraja only.** One tradition, done properly, in the same way the Lontara app is Bugis-only rather than a shallow pan-archipelago sampler.

The rule schema must be designed so a second tradition can drop in later, but v1 ships one. Do not build a generic "rumah adat" abstraction from a single example — the real axes only become visible after the second and third houses refuse to fit.

Deliberately out of scope for v1:

- Other traditions (see Phase 2 below).
- Interiors, furniture, people beyond the scale figure.
- Terrain, vegetation, weather beyond the rain demonstration.
- Any backend. Static export, GitHub Pages, no runtime network.

## Users

Three, in priority order:

1. **A curious Indonesian reader** who learned "rumah adat Sulawesi Selatan" in school and has never seen why the roof is that shape. Needs the mechanism, in Indonesian, on a phone.
2. **A student or teacher** of architecture or anthropology who wants the parametric logic and the sources, and will check them.
3. **A portfolio reader** judging whether the author can build something rigorous and beautiful at the same time.

The app must satisfy (1) without dumbing down for (2). The provenance layer is what lets both hold: casual readers see a shape, careful readers see how much of it is claimed.

## Parameters

The complete input set for v1. Nothing else gets a control.

| Parameter | Values | What it means |
|---|---|---|
| Rank | tongkonan layuk / pekamberan / batu a'riri | Position in the lineage hierarchy. Governs scale and permitted elaboration. |
| Bays (ruang) | 2–5 | Longitudinal division of the body. Three is the common case: tangdo', sali, sumbung. |
| Horn count | 0–24+ | Buffalo horns on the tulak somba — a tally of funerals the house has held. A count of events, not an ornament budget. |

**Orientation is a constraint, not a parameter.** The house lies north–south with the front (ulunna banua) facing north, and the alang face it in a row across the courtyard. The UI offers camera rotation only; there is no control that turns the building. This must be stated on screen, not just enforced in code.

## Routes

Under `app/[locale]/`, Indonesian default, English second.

| Route | Name | Job |
|---|---|---|
| `/bangun` | Bangun | The generator. Rule controls, the model, computed sun, the provenance strip. Landing route. |
| `/rakit` | Rakit | Exploded assembly. Build order, joint types, the pegged mortise-and-tenon detail. The house is built without nails and the joinery is genuinely 3D-only content. |
| `/baca` | Baca | The finished house annotated in reverse — what a stranger walking up to it could read off the façade. Horn count, rank markers, orientation, carving programme. |
| `/sumber` | Sumber | The source table. Every dimension, its provenance class, and the citation. The honesty layer given its own room. |

## The three vertical zones

The cosmological division is the app's second-strongest visual argument after the roof, and `/baca` must make it explicit: sulluk banua (under-floor, lower world), kale banua (living floor, middle world), rattiang banua (attic, upper world). A section cut showing the three occupancy zones as spatial fact rather than a flat diagram.

## Provenance — the honesty requirement

Every dimension carries one of three classes:

- **measured** — taken from a published measured drawing of a named, surveyed house.
- **canon** — stated in a documented canon or ethnographic description, not measured.
- **interpolated** — the author's own value, closing a gap the sources leave open.

Requirements:

1. The split is shown on every screen that displays a dimension, as a bar plus a plain-language line.
2. `/sumber` lists every dimension individually with its citation.
3. At launch the interpolated share will be high. **This is displayed, not hidden.** The bar moving as surveys are wired in is the project's actual progress metric.
4. The invariant that checks the generator against a real measured drawing reports as **skipped** until a survey exists. It is never made to pass by weakening it.

Starting points for surveys: Kis-Jovak, Nooy-Palm, Schefold & Schulz-Dornburg, *Banua Toraja* (1988); Schefold, Domenig & Nas (eds), *Indonesian Houses* Vol. 1 (2003); Waterson, *The Living House* (1990); the Departemen P&K *Arsitektur Tradisional* provincial series.

## Correctness

There is no measured drawing at the start, so correctness rests on structural truth — the same move as asserting convergence order instead of eyeballing a plot. These gate the build:

- Bilateral symmetry about the ridge plane.
- Every tenon contained in its mortise, both parts present. No nails means the joints must fit.
- Stage ordering: nothing placed before the thing that carries it; nothing below ground.
- Mesh integrity: indices in range, no degenerate triangles, unit normals.
- Ridge sags in the interior, both prows rise, front prow highest.
- Ijuk courses lap with no bare strip; the ridge is covered.
- **The eave oversails the outer post line.** Rain shed off a steep pitch has to land clear of the post feet — this is why the overhang is that deep, so it is an invariant, not a coincidence.
- Post count follows the declared bay count.
- Eave clears the wall plate.
- Solar engine against almanac values: equinox noon altitude at ~3°S, solar noon within minutes of 12:00 WITA, declination near zero at equinox, sun below horizon at night.

## Lighting is computed

Not art direction. A NOAA solar position implementation drives the scene light for Rantepao (2.97°S, 119.90°E, WITA).

This matters architecturally: at ~3°S the sun passes within a few degrees of the zenith, the noon shadow nearly vanishes, and the deep overhang is doing real work. Offer three date presets — equinox, June solstice, and the local culmination date when the sun is overhead — because the difference between them is the point. Shares its engine with the zero-shadow-day tool.

## Animations

Only mechanism earns an animation. The permitted set:

1. **Frame-raising** (the orchestrated moment) — posts, floor frame, deck, walls, tulak somba, roof frame, ijuk from the eave upward, horns. The build order, not a reveal effect.
2. **A day of sun** — shadow sweeping the courtyard, the overhang working at noon.
3. **Rain** — water shedding off the pitch, the drip line landing clear of the posts. The argument for the overhang, demonstrated.
4. **Parameter transition** — a rule value changing, the house rebuilding in place.
5. **View transitions** between fixed cameras, including one that drops under the floor into the kolong.

Explicitly forbidden: morphing one tradition into another. It looks spectacular and asserts a continuity that does not exist.

## Non-goals

- Photorealism. See DESIGN.md — a photographic render on top of interpolated numbers is a lie told fluently.
- A game, a configurator, or a house-design tool.
- Claiming to represent "the" Toraja house. Regional and lineage variation is real.

## Milestones

- **M0** — Scaffold. Static export builds and deploys empty.
- **M1** — Generator: rules → part list, pure and Node-runnable. Invariants green in CI.
- **M2** — Renderer at register: procedural materials, computed sun, drag-only camera. This is the go/no-go on the look.
- **M3** — `/bangun` complete with provenance strip.
- **M4** — Frame-raising sequence and `/rakit`.
- **M5** — `/baca`, `/sumber`, rain, orthographic SVG export of plan/section/elevation.

Ship after M5. Then, and only then:

- **Phase 2 (separate PRD)** — a second tradition. Rumah gadang is the right one: the Koto Piliang / Bodi Caniago split (raised end platforms vs a flat floor) is the same kind of socially-loaded geometric switch as rank here, so it tests whether the schema generalises.

## Ethics and attribution

- Toraja terms are the names of the parts and are used as such: a'riri, tulak somba, kale banua, rattiang banua, sulluk banua, pa'ssura, ijuk. Vocabulary, not flavour.
- No single canonical form. When a survey is wired in, the app names the house and the village.
- Carving motifs are rendered as geometric constructions where they are construction rules, not as traced images.
- Some motifs and rites are restricted in use. Anything beyond the plainly geometric pa'ssura needs checking before it is rendered.
