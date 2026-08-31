<div align="center">

<img src="public/brand/mark.svg" width="96" alt="">

# Rumah Adat Nusantara

**Rumah yang dihitung dari aturannya, bukan digambar.**<br>
*A house generated from its rules, not drawn.*

[**Open the collection →**](https://andifathulms.github.io/rumah-adat-nusantara/)

</div>

---

Thirty-five traditional buildings of the Indonesian archipelago, each one
**generated from its own rules** rather than modelled as a shape. Change a
socially meaningful number — a rank, a household count, the length of the
owner's forearm — and the building recomputes: every post, every rafter, every
lapped course of thatch, and the drawings and share cards made from them.

Nothing here is illustrated. The silhouettes on the landing page, the plan and
section you can export, the share card behind every link — all of them are
projections of the same parts the invariant suite runs over. A picture that
disagreed with the model would not be a bug; it would be impossible to produce.
The one drawn thing on the site is the mark above, which stands for the
collection rather than for any building in it.

```sh
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # type-check, then 1,659 tests
pnpm build    # static export into out/
```

## What is in it

Twenty-six houses, two granaries, three halls, a palace, a boat, a stone tomb,
a cremation tower, a cluster and a pair of ancestors — from Banda Aceh at 5.6° N
to Seba at 10.5° S, and from 95.3° E to Jayapura at 140.7° E.

| | Building | People | Where |
|---|---|---|---|
| T.01 | Tongkonan | Toraja | Tana Toraja, South Sulawesi |
| T.02 | Rumah gadang | Minangkabau | West Sumatra |
| T.03 | Joglo | Javanese | Central Java and Yogyakarta |
| T.04 | Mbaru niang | Manggarai | Wae Rebo, Flores |
| T.05 | Bale | Balinese | Ubud, Gianyar, Bali |
| T.06 | Omo | Nias | South Nias, North Sumatra |
| T.07 | Rumah betang | Dayak | Central Kalimantan |
| T.08 | Uma | Sumbanese | East Sumba |
| T.09 | Rumah limas | Palembang | Palembang, South Sumatra |
| T.10 | Saoraja | Bugis | South Sulawesi |
| T.11 | Rumah kaki seribu | Arfak | The Arfak Mountains, West Papua |
| T.12 | Lumbung | Sasak | Lombok |
| T.13 | Honai | Dani | The Baliem Valley, Highland Papua |
| T.14 | Rumah bubungan tinggi | Banjar | Banjarmasin, South Kalimantan |
| T.15 | Baileo | The negeri of Central Maluku | Central Maluku |
| T.16 | Rumah kariwari | The Tobati-Enggros | Youtefa Bay, Jayapura |
| T.17 | Rumah woloan | The Minahasa | Woloan, Tomohon, North Sulawesi |
| T.18 | Siwaluh jabu | The Karo | The Karo highlands, North Sumatra |
| T.19 | The Baduy imah | The Kanekes people | Kanekes, Lebak, Banten |
| T.20 | Rumoh Aceh | The Acehnese | Aceh |
| T.21 | Lepa | The Sama-Bajau | The waters of Wakatobi |
| T.22 | Waruga | The Minahasa | Airmadidi and Sawangan, North Minahasa |
| T.23 | Bade | The Balinese | Gianyar and around, Bali |
| T.24 | Khaim | The Korowai | The Becking and Dairam headwaters |
| T.25 | Tanean lanjang | The Madurese | Sumenep and eastern Madura |
| T.26 | Malige | The Butonese | Baubau, on Buton island |
| T.27 | Ngadhu and bhaga | The Ngada | Bena and Wogo, Flores |
| T.28 | Ume kbubu | The Atoni | Soe and Kapan, South Central Timor |
| T.29 | Sudung | The Orang Rimba | Bukit Duabelas, Jambi |
| T.30 | Uma | The Mentawai | Siberut, in the Mentawai Islands |
| T.31 | Ammu hawu | The people of Sabu | Seba, Rai Hawu |
| T.32 | Rumah kebaya | The Betawi | Condet and Setu Babakan, Jakarta |
| T.33 | Sasadu | The Sahu | Jailolo, West Halmahera |
| T.34 | Balai selaso jatuh kembar | The Riau Malay | Siak Sri Indrapura, Riau |
| T.35 | Dalam Loka | The Sumbawa | Sumbawa Besar |

Each building has four routes, in Indonesian and English:

- **`/bangun`** — the rules, and the arithmetic from a rule to a metre.
- **`/rakit`** — the frame going up, joint by joint, in the order it is built.
- **`/baca`** — the day of sun, the rain, the section cut, the site plan.
- **`/sumber`** — every dimension, and where it came from.

## Provenance, which is the point

Every dimension declares its class — `measured`, `canon`, or `interpolated` —
and the source it came from. Today **nothing in any of the thirty-five is
measured**. A handful of rules are canon; the great majority of lengths are the
author's own, and counted by part all thirty-five are 100% interpolated.

That bar is on every screen rather than hidden in a footnote, and the houses'
figures are **never averaged together** — an averaged number would let a house
nobody has surveyed hide behind one somebody has.

This is not a defect being concealed. A smooth 3D render implies a precision the
sources do not have, and the bar is what keeps the two honest. One invariant —
the model against a real measured drawing — reports **skipped**, and stays
skipped until a survey is wired in. It is the only check here that cannot be
satisfied by writing better code, and moving it is the project's progress
metric.

## How it is built

`lib/` generates and knows nothing about drawing: no three.js, no DOM, no
randomness, no clock. `components/` draws and generates nothing. `lib/core/` is
generic over what a tradition calls things and may not name one; a tradition may
not import another tradition. Those splits are tested directly, because they are
properties of the file layout that nothing else would notice breaking.

`pnpm check` runs every invariant suite over at least five rule combinations. A
failing invariant fails the build — a house that violates symmetry or leaves a
tenon outside its mortise does not get published because it happened to render.

The URL has three halves that mean different things: the **path** is the
tradition, the **query** is the house in that tradition's own parameter names
(every rule always written, so it is a citable description rather than a diff),
and the **fragment** is the reader — camera, date, time, section — which never
reaches a server.

Next.js 14 static export, TypeScript strict, Tailwind, Vitest. **Zero runtime
network**: vendored three.js, self-hosted fonts, coastline data generated and
committed, every texture drawn on a canvas at load. It works with the wifi off.

## Further reading

- [PRD.md](PRD.md) — what is being built and why.
- [DESIGN.md](DESIGN.md) — how it must look, and the tokens it is allowed.
- [CLAUDE.md](CLAUDE.md) — how to work on it, and what each building settled.

## Licence and attribution

The coastline is [Natural Earth](https://www.naturalearthdata.com/)
`ne_10m_land`, public domain, clipped and simplified by
[`scripts/coastline.mjs`](scripts/coastline.mjs). IBM Plex Sans and Plex Mono
are vendored under the SIL Open Font License.

The buildings belong to the people who build them. This is a model of what
published sources describe, not a record, and every page says so where it can
be read.
