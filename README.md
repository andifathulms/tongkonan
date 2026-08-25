# Tongkonan

A tongkonan generated from its rules — rank, number of bays, number of horns —
rather than modelled as a shape. Change a socially meaningful number and the
building changes with it.

Read [PRD.md](PRD.md) for what is being built, [DESIGN.md](DESIGN.md) for how it
must look, and [CLAUDE.md](CLAUDE.md) for how to work on it.

## Running it

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # type-check, then the invariants across four rule combinations
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
`interpolated`. Today nothing is measured, 8 are canon, and 28 are the author's
own. That split is shown on every screen and listed dimension by dimension at
`/sumber`.

This is not a defect being hidden. A smooth 3D render implies a precision the
sources do not have, and the bar is what keeps the two honest. When a survey is
wired in the bar moves, and that movement is the project's progress metric.
