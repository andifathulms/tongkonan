# Rumah Adat Nusantara

Traditional Indonesian houses, each generated from its own rules rather than
modelled as a shape. Change a socially meaningful number and the building
changes with it. Four so far:

- **Tongkonan** — Toraja, South Sulawesi. Rank, bays, and a tally of funerals
  held on the horns of the tulak somba.
- **Rumah gadang** — Minangkabau, West Sumatra. Laras, ruang, and a tally of
  married daughters in the bilik along the rear lanjar. Koto Piliang steps the
  floor up at both ends and Bodi Caniago refuses to, which is a claim about who
  sits where, testable with a spirit level.
- **Joglo** — Central Java and Yogyakarta. A graded series of roof forms and a
  tier count that state standing without counting anything.
- **Mbaru niang** — Manggarai, Flores. A cone with one door, and the door is an
  interruption in the roof itself.

Every dimension in every house declares where it came from, and almost none of
them came from a survey. That is shown on every screen rather than hidden, and
the houses' figures are never averaged together.

All four go up without a nail in them.

Read [PRD.md](PRD.md) for what is being built, [DESIGN.md](DESIGN.md) for how it
must look, and [CLAUDE.md](CLAUDE.md) for how to work on it.

## Running it

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # type-check, then both invariant suites across five rule combinations each
pnpm build    # static export into out/
```

There is no server and no runtime network. Vendored three.js, system font
stacks, every texture drawn on a canvas at load. It works with the wifi off.

## The two halves

`lib/` generates and knows nothing about drawing: no three.js, no DOM, no
randomness, no clock. `components/` draws and generates nothing. That split is
what makes the geometry testable, and it is not a style preference.

`pnpm check` runs the invariant suite over four rule combinations. A failing
invariant fails the build. One check — the model against a real measured
drawing — reports **skipped**, and stays skipped until a survey is wired in. It
is the only check here that cannot be satisfied by writing better code.

## Provenance

Every dimension declares where it came from: `measured`, `canon`, or
`interpolated`. Today nothing is measured in any house; a handful of rules are
canon and the great majority of lengths are the author's own. Each house keeps
its own split, shown on every screen and listed dimension by dimension at its
`/sumber`.

This is not a defect being hidden. A smooth 3D render implies a precision the
sources do not have, and the bar is what keeps the two honest. When a survey is
wired in the bar moves, and that movement is the project's progress metric.
