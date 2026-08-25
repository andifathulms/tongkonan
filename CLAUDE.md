# CLAUDE.md — Tongkonan

Working instructions for Claude Code. Read PRD.md for what is being built and DESIGN.md for how it must look. This file is how to work on it.

## Current state

**M0 — not yet scaffolded.** Nothing exists but these three documents.

Keep this section accurate. A stale "Current state" is worse than none — a previous project in this portfolio still claimed "not yet scaffolded" long after it had six routes and thirty-five components, and that misled every session that read it. Update this line in the same commit as the work it describes.

## Stack

- Next.js 14, App Router, `output: 'export'` — static, deploys to GitHub Pages, no server anywhere.
- TypeScript, `strict: true`.
- Tailwind. Design tokens from DESIGN.md only.
- pnpm.
- Vitest for the generator and the solar engine.
- **three.js is the one runtime dependency exception.** Justification: in the other apps the algorithm being hand-written *is* the subject, so no library. Here the subject is the rule→geometry generation, and rasterisation is not. Using three.js to draw a mesh we generated ourselves is like using a font rather than drawing glyphs. Do not let this reasoning expand — geometry generation, solar position, and the invariants stay hand-written with no library.
- Zero runtime network. Vendor three.js. System font stacks. Every texture generated on a canvas at runtime.

## Architecture

```
lib/banua/        the generator — pure, no DOM, runs in Node
  types.ts          Part, Joint, House, Provenance, Stage
  rules.ts          rank/bays/horns, dimensions with provenance tags, source table
  geometry.ts       ridge curve, section sweep, mesh + tube builders, mirroring
  frame.ts          layout resolution, posts, floor frame, deck, walls, tulak somba, horns, joints
  roof.ts           ridge assembly, rafters, purlins, ijuk courses
  assembly.ts       build order and the normalised timeline
  invariants.ts     the checks that gate the build
lib/solar/
  position.ts       NOAA solar position; shared with the zero-shadow-day tool
components/         renderer, controls, provenance strip
app/[locale]/       bangun, rakit, baca, sumber
```

**The hard split: `lib/` generates, the renderer draws.** `lib/` must never import three.js, touch `window`, or read the DOM. The renderer must never generate geometry. If a shape is being computed inside a component, it is in the wrong file.

This split is what makes the geometry testable. It is not a style preference.

## Coordinates and units

- Metres throughout. No arbitrary units, no scaling factors in the renderer.
- X runs front (north, negative) to rear (south, positive).
- Y is up. Ground is y = 0.
- Z is transverse. The building is bilaterally symmetric about z = 0.

The north–south axis is baked in because orientation is a rule, not a parameter. Do not add a building rotation.

## The generator contract

`buildHouse(rules)` → `{ house, layout }`. Pure, deterministic, no unseeded randomness, no `Date.now()`. The same call runs in the browser and in the test suite and must produce identical output.

Parts are either:
- **boxes** — centre, size, optional XYZ-order Euler rotation. Boxes stay boxes so joint containment has something exact to test against.
- **meshes** — explicit positions/normals/uvs/indices, in world coordinates.

Every part carries `stage` and `order`. Together they are the build sequence, which the assembly animation walks and the invariants check. `order` is not a z-index.

## Provenance

Every dimension in `rules.ts` is wrapped with its class (`measured` / `canon` / `interpolated`) and a source key. This is not optional metadata — the UI reads it, `/sumber` lists it, and a test prints the interpolated share.

When adding a dimension, tag it honestly. If you invented the number, it is `interpolated` with source `none`. Do not tag a plausible guess as `canon` because a source discusses the feature qualitatively.

Replacing an interpolated value with a measured one should be a two-line edit: change the value, change the class, point at the survey. Nothing downstream may need to know.

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

## Conventions

- Indonesian is the default locale; English is second. Toraja terms are used as the names of the parts in both.
- UI copy: sentence case, plain verbs, active voice. A control says what happens when it is used.
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

## Things that will be tempting and are wrong

- **Adding a roof-shape slider.** The roof is downstream of the rules. If the shape needs adjusting, adjust the rule pack and say why in the provenance note.
- **Making the render prettier with bloom, vignette, DOF, or a HDRI.** See DESIGN.md. The register is a physical model under real light, and effects on top of interpolated numbers are a lie told fluently.
- **Abstracting the schema for other traditions now.** The abstraction will come out tongkonan-shaped. Wait for the second house.
- **Hardcoding a dimension in the renderer** because it is faster than threading it through the layout. It breaks the split and it silently escapes the provenance layer.
- **Reaching for a mesh library** for CSG, lofting, or subdivision. Generation is the subject.

## Ambient occlusion

Real AO in the joints and under the raised floor is the single largest quality gain available and worth doing properly once the register is settled. A radial-gradient contact plane under the body is an acceptable placeholder; do not ship it as the final answer. Do not pull in a post-processing stack before M2 is judged.
