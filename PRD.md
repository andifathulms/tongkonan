# PRD — Rumah Adat Nusantara

This document describes what is being built. It began as the PRD for one house
— "v1 is Toraja only" — and that scope did its job: the schema was designed on
one tradition, tested by a second that refused to fit, and has now carried
every entry in the registry. The sections below describe the product as it
stands; the original milestones are kept at the end as history, because the
order things were learned in is part of the argument.

One rule about this file: **it does not enumerate the collection.** The
registry (`lib/tradition/registry.ts`) is the list, the landing page is its
rendering, and CLAUDE.md's "Current state" carries the current census and
figures. A hand-written list here would be a list that silently stops
matching the site — this project already learned that lesson with a sitemap.

## The argument

A traditional building is not a shape to be modelled. It is a rule system:
proportions, counts and orientations that encode rank, kinship and cosmology.
This app takes those rules as input and generates the building from them, so
that changing a socially meaningful number visibly changes the structure.

That is the whole thesis, and every product decision follows from it:

- There is no "roof curvature" slider. Parameters are things a household would
  say about itself — a rank, a room count, a tally of ceremonies held, the
  number of families under one ridge.
- The geometry is computed from those parameters, not authored.
- Every dimension declares where it came from, because a smooth 3D render
  implies a precision the sources do not have.
- No tradition is made to wear another's shape. Each entry carries its own
  rule pack, its own source table and its own provenance bar, and none of
  those are ever merged or averaged.

Same family as the payroll and holiday calculators: a rule pack with
citations. The difference is that the output is a solid instead of a number.

## Scope

**A collection of Indonesian vernacular architecture, each entry done
properly, on one tradition-neutral core.** The core (`lib/core/`) holds what
is mechanically true of any built thing and knows a word from none of the
traditions; everything cultural lives in the pack that owns it. The registry
is the single list the app walks — the landing, the map, the plates, the
sitemap, the share cards and the tests all read it, so a new entry appears
everywhere without any of them changing.

Not every entry is a dwelling, and that is now part of the point: the
collection includes granaries, meeting halls, a palace, a boat that is a
home, a stone tomb, a cremation tower built for one afternoon, a compound
that is nine buildings, and a paired set of ancestor shrines. The neutral
contract never asked whether a building stands still, whether anybody lives
in it, or whether it will exist tomorrow — and the entries that stretch those
questions are the evidence the contract is real.

Growth discipline, which is a product requirement and not a style:

- The core grows **only by extraction** — nothing moves into it until at
  least two packs have written it independently. An abstraction designed from
  one example comes out shaped like that example and, worse, looks validated.
- **There is no shared `Rules` interface and there must not be one.** A rank
  that scales everything, a lineage switch legible in the floor, a tally of
  legs, a household count that changes how many parts exist — the axes have
  nothing in common but being said out loud.
- A new entry joins when it can be done at the depth of the existing ones:
  generator, rule pack with tagged provenance, source table, its own
  invariant suite over at least five rule combinations, a counterexample, and
  a front door. A shallow pan-archipelago sampler is a non-goal, however long
  the list gets.

What each entry's parameters mean, and what they do to the building, is
stated where it is used: in that pack's `rules.ts` with its provenance tag,
in its rule controls with a gloss, and on its `/sumber`. This file does not
gloss them, because a one-line summary of someone's kinship system written in
a scope document is exactly the flattening the project exists to resist.

Deliberately out of scope:

- Interiors, furniture, people beyond the scale figure.
- Terrain, vegetation, weather beyond the rain demonstration.
- Any backend. Static export, GitHub Pages, no runtime network.

## Users

Three, in priority order:

1. **A curious Indonesian reader** who learned "rumah adat" as a school-book
   list and has never seen why any of the roofs are the shapes they are.
   Needs the mechanism, in Indonesian, on a phone.
2. **A student or teacher** of architecture or anthropology who wants the
   parametric logic and the sources, and will check them.
3. **A portfolio reader** judging whether the author can build something
   rigorous and beautiful at the same time.

The app must satisfy (1) without dumbing down for (2). The provenance layer
is what lets both hold: casual readers see a shape, careful readers see how
much of it is claimed.

## Orientation is a constraint, not a parameter

Every tradition declares its own orientation rule — one faces north
absolutely, another faces its halaman relationally, a boat has a heading —
and none of them gets a control. The UI offers camera rotation only; there is
no control that turns a building, and the constraint is stated on screen so
its absence from the controls reads as a fact about the building rather than
a missing feature.

## The pages

Under `app/[locale]/`, Indonesian default, English second. The path is the
tradition, the query string is the house (every rule always written, defaults
included — a complete description anyone can cite), the fragment is the
reader's vantage. Nothing crosses between the three.

| Page | Job |
|---|---|
| `/[locale]/` | The collection's front door. The claim; the same-scale elevation shelf — every entry drawn from its own computed parts at one scale, packed into rows by the same arithmetic whatever the count; the story; the sites plotted on a real, vendored coastline (Natural Earth land, clipped and simplified at build time, never fetched — and a test asserts every site stands on land); and an index of catalogue plates, one per entry, each with its own provenance bar. Everything read from the registry. |
| `/[locale]/[tradisi]/` | One entry's front door: whose building, the caution, the orientation constraint, the framed drawing sheet (elevation, title-block stamps, the generator's readouts), and the four routes as described doors. |
| `/[locale]/[tradisi]/bangun` | The generator. Rule controls, the model, computed sun, the provenance strip. |
| `/[locale]/[tradisi]/rakit` | Exploded assembly. Build order, joint types, joinery without nails. |
| `/[locale]/[tradisi]/baca` | The finished building annotated in reverse — what a stranger walking up could read off it. |
| `/[locale]/[tradisi]/sumber` | The source table. Every dimension, its class, its citation, and which of them matter most (sensitivity, computed by rebuilding). |

The four old tradition-less paths still answer and say where the page went —
a citable address that stops resolving is not much of a citation. The
exported 404 is a real bilingual page.

## Provenance — the honesty requirement

Every dimension carries one of three classes:

- **measured** — taken from a published measured drawing of a named, surveyed building.
- **canon** — stated in a documented canon or ethnographic description, not measured.
- **interpolated** — the author's own value, closing a gap the sources leave open.

Requirements:

1. The split is shown on every screen that displays a dimension, as a bar plus
   a plain-language line.
2. `/sumber` lists every dimension individually with its citation.
3. The interpolated share is high in every entry. **This is displayed, not
   hidden.** The bars moving as surveys are wired in is the project's actual
   progress metric — and adding entries does not move them; only a measured
   drawing will.
4. **Provenance is never merged across traditions.** One source table and one
   bar per entry, shown separately. An averaged figure would be the single
   most dishonest number this project could print.
5. The invariant that checks a generator against a real measured drawing
   reports as **skipped** — in every entry. It is never made to pass by
   weakening it.

Starting points for surveys are the published literature per tradition; each
entry's `/sumber` lists its own bibliography (for the tongkonan: Kis-Jovak et
al., *Banua Toraja*, 1988; Schefold, Domenig & Nas, *Indonesian Houses* Vol.
1, 2003; Waterson, *The Living House*, 1990; the Departemen P&K *Arsitektur
Tradisional* provincial series).

## Correctness

There is no measured drawing yet, so correctness rests on structural truth.
`pnpm check` gates every build:

- The core suite, run identically against every entry: bilateral symmetry
  (scoped and labelled per tradition), every tenon contained in its mortise,
  stage ordering, mesh integrity, part provenance.
- Each tradition's own invariants, stating facts about that building, over at
  least five rule combinations.
- The architecture itself: the core may not import or name a tradition, no
  tradition may import another, nothing under `lib/` may reach for three.js,
  the DOM, randomness or the clock. (Where one tradition's claim is measured
  against another's building — a hull proportion against a real boat — that
  comparison lives in a test, because a test may import two packs and a pack
  may not.)
- The solar engine against almanac values, per site.
- The pictures against the generator: silhouettes, favicon and share cards
  are computed from the models' parts and held by tests, so no image of the
  site can drift from the thing it depicts.
- A counterexample per entry: one check run against a building built to break
  it, its refusal printed, so a page of green rows is not the only evidence.

The renderer's gate is the invariant suite **plus a human looking at it** —
the suite has repeatedly passed shapes a single glance refused.

## Lighting is computed

Not art direction. A NOAA solar position implementation drives the scene
light for each tradition's own site — one site per entry, spanning the
country corner to corner across three time zones, on both sides of the
equator. Near the equator the presets include the zero-shadow day, because a
deep overhang at a near-zenith noon is the point; where the sun never passes
overhead the preset says so plainly instead of faking a date.

## Animations

Only mechanism earns an animation. The permitted set:

1. **Frame-raising** (the orchestrated moment) — the build order, not a
   reveal effect.
2. **A day of sun** — shadow sweeping the ground, the overhang working.
3. **Rain** — water shedding off the pitch, the drip line landing clear.
4. **Parameter transition** — a rule value changing, the building rebuilding.
5. **View transitions** between fixed cameras.
6. On the landing: the ground line draws and the silhouettes rise once, on
   arrival — the landing's echo of the frame-raising.

Explicitly forbidden: morphing one tradition into another. It looks
spectacular and asserts a continuity that does not exist. Switching entries
is a cut, routed up through the index.

## Non-goals

- Photorealism. See DESIGN.md — a photographic render on top of interpolated
  numbers is a lie told fluently.
- A game, a configurator, or a house-design tool.
- Claiming to represent "the" building of any tradition. Regional and lineage
  variation is real, and every front door says so.
- A generic rumah-adat abstraction. The core holds what is mechanically true
  of any built thing; everything cultural stays in the pack that owns it.
- A hand-maintained list of the collection anywhere prose lives. The registry
  is the list.

## Milestones

Shipped, in order — kept as history because the sequence is part of the
argument:

- **M0–M5** — the tongkonan, complete: generator, renderer at register, the
  four routes, frame-raising, rain, orthographic SVG export.
- **Phase A–C** — the tradition-neutral core split out; the rumah gadang
  built concretely and allowed to duplicate; five extractions the two houses
  earned, the registry, the scene model, the routes, the rename to Pasak.
- **Phase D onward** — house after house, each built to settle questions the
  previous ones could not, each refusing something: a second roof primitive,
  a plinth instead of posts, a site north of the equator, a part list whose
  length is a rule, buildings that move, buildings with no owner, a building
  alive at one end, a building that exists for one afternoon.
- **The collection** — the rename to Rumah Adat Nusantara; the landing, the
  front doors, the catalogue plates; the computed silhouettes (shelf, cards,
  favicon, share cards, all held against the generator by tests); the
  vendored coastline; the vendored face (IBM Plex); the night register.

Still open, in value order:

1. **A survey.** The highest-value work in the project since M5, and the only
   thing that moves any bar. One measured drawing of one named building,
   wired into its pack as `measured` dimensions.
2. **Relief carving** — construction-rule motifs extruded so they cast real
   shadow, replacing the canvas-drawn placeholder.
3. **Real ambient occlusion** in the joints and under the raised floors,
   replacing the radial-gradient contact plane.
4. **Derivation and drawing export beyond the tongkonan** — worked out per
   entry, not generalised.

## Ethics and attribution

- Each tradition's terms are the names of its parts and are used as such, in
  both locales. Vocabulary, not flavour.
- No single canonical form of any building. When a survey is wired in, the
  app names the building and the village.
- Carving motifs are rendered as geometric constructions where they are
  construction rules, not as traced images. Nothing is invented to fill out a
  vocabulary: two real motifs shown plainly beat a plausible dozen.
- Some motifs, rites and structures are restricted in use. Anything beyond
  the plainly geometric needs checking before it is rendered.
