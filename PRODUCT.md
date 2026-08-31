# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: students and teachers** (confirmed by the author, 2026-08). The
derivations, invariants, provenance tables and build sequences are teaching
material about rumah adat, and future work should treat the classroom reading
of a screen as its first reading.

Also served, in order of standing:

- **Curious Indonesian general readers, usually on a phone.** The reason the
  default locale is Indonesian and the phone layout keeps the drawing above
  the controls. This was the working primary user for most of the project's
  history and remains the audience the copy is voiced for.
- **Researchers and the architecture community** — people who might check a
  figure, cite an address, or supply a measured drawing. Every page being
  citable (complete query strings, stable addresses, stated sources) exists
  for them.

## Product Purpose

An atlas of Indonesian vernacular architecture in which every building is
generated from its own social rules rather than drawn: thirty-five traditions
at present — houses, granaries, halls, a palace, a boat, a tomb, a cremation
tower — each computed from a rule pack (a rank, a bay count, a tally of
ceremonies), each stating per dimension whether the number is measured, canon,
or the author's own.

Success, as confirmed by the author (all four count):

1. **A survey moves the bar** — a real measured drawing gets wired in and the
   provenance bar visibly improves. This is the project's own progress metric.
2. **Readers actually use it** — Indonesian readers, classrooms, communities
   spend time in it and share it.
3. **Craft demonstration** — the generated geometry, honesty layer, and test
   discipline are themselves the point, as portfolio and practice.
4. **Coverage of the archipelago** — a collection that fairly represents
   Nusantara, not a sampler.

## Positioning

The claim a neighbouring project could not truthfully copy: **the shape is
computed and the uncertainty is printed.** Change a social rule and the house
is recomputed from it; every dimension carries its source class; the
interpolated share is shown on every screen and never averaged across
traditions. The usual alternatives — an ArchViz render or a museum-style
gallery of drawings — assert a precision their sources don't have. This
project's differentiator is refusing that assertion while still shipping a
full 3D model under real, site-computed sunlight.

## Operating Context

- Read in the browser, no install, works offline once loaded (zero runtime
  network is a hard constraint, not an optimisation).
- Bilingual, Indonesian first; local terms are vocabulary in both locales and
  are never translated away.
- Addresses are citations: the path is the tradition, the query string is the
  complete house description, the fragment is the reader's vantage. Old paths
  keep answering.
- Classroom and phone are the two default reading scenes.

## Capabilities and Constraints

- Static export to GitHub Pages (`rumah-adat-nusantara`); no server anywhere.
- `lib/` is pure and deterministic: no DOM, no three.js, no randomness, no
  clock. The renderer draws and never generates.
- The core is tradition-neutral; traditions never import each other; the app
  does not know which house it holds (registry contract).
- Every picture of the site — landing shelf, index minis, favicon, share
  cards — is computed from the model's parts and tested against the
  generator. Nothing is illustrated by hand except the brand mark.
- `checkAgainstSurvey` reports skipped in all thirty-five traditions and must
  stay skipped until a real survey exists. Never soften it.
- **Surveys are actively pursued** (confirmed 2026-08): the author intends to
  contact institutions/archives or do fieldwork. The replace-a-dimension path
  must stay a two-line edit (value, class, source), and nothing downstream may
  need to know a survey landed.
- Some motifs and rites are restricted in use; anything beyond the plainly
  geometric needs checking before it is rendered. Cultural caution copy is a
  feature, not boilerplate.

## Brand Commitments

- **Name:** Rumah Adat Nusantara — a proper name, identical in both locales.
- **Mark:** the saddle-roof-over-counted-posts mark (`public/brand/mark.svg`)
  is the one hand-drawn thing in the project; everything else is generated.
- Existing binding identity constraints are documented in DESIGN.md (closed
  pa'ssura pigment palette, drafting-sheet register, motion budget) and are
  design authority, not up for silent revision here.
- Voice: plain, active, unhedged; states what a thing is and where its
  numbers came from. No marketing register anywhere.

## Evidence on Hand

- Thirty-five rule packs with per-dimension source tables and citations
  (ethnographic and reference works, listed per tradition on `/sumber`).
- Solar arithmetic validated against almanac values; thirty-five real sites;
  coastline from Natural Earth (public domain, vendored).
- 1,698 passing tests, including structural invariants per tradition.
- **Absent, and never to be fabricated:** measured drawings. No tradition has
  a survey; every model is 100% interpolated by part. Future work must not
  invent one, cite one that does not exist, or imply precision the sources
  lack.

## Product Principles

1. **Honesty outranks beauty.** A smooth render implies precision; the
   provenance layer is what keeps it honest. Nothing may hide, soften, or
   average the uncertainty.
2. **The rules are the subject.** A building is interesting here because a
   social fact becomes geometry. Features that don't trace a rule to a shape
   are decoration.
3. **No tradition wears another's shape.** Rule packs stay separate, figures
   are never merged, and refusal-to-fit is treated as information.
4. **Everything shown is checkable.** Computed pictures over illustrations,
   line drawings over shaded ones, citations on every screen, addresses that
   can be quoted.
5. **A new tradition must cost no page edits.** The registry is the list;
   copy carries no counts; every surface must absorb entry thirty-six
   unchanged.

## Accessibility & Inclusion

- WCAG-minded by practice: documented contrast ratios beside every token
  pair, 24px pointer floor, visible two-ring focus, skip link on working
  routes, complete `prefers-reduced-motion` alternatives (sequences are
  content and are de-animated, never removed).
- Bilingual parity is a requirement: no feature may exist in one locale only.
- Restricted cultural material is an inclusion constraint, not just a legal
  one; the per-tradition caution copy must survive redesigns.
