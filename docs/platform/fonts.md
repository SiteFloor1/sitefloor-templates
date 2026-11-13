# Claimed fonts

Every font here belongs to one look or one approved design. Never use a listed font, or another cut of the
same family (Castoro and Castoro Titling count as one), in a new design. Before mocking up: `git fetch --all`,
read this file on `main` and on every `trade/*` branch, then add your chosen display and body fonts to
`docs/trades/<trade>/fonts.md` (status `approved`, your branch) in your first mockup commit, run `npm run docs` and push
at once. If you drop a direction, remove its row. This file is generated from those files and `case-studies/*/fonts.md`;
`npm run rules` fails if two trades or case studies claim the same family. Banned outright: Inter,
DM Sans, Poppins, Montserrat (`npm run rules`).

Rejected mockup directions don't hold a claim. Last checked: 2 Nov 2026.

## Historical exceptions

Case-study pages published before font claims were checked, each sharing one font with another trade's look or
design. Accepted as they are; every other claim is checked strictly (`npm run rules`). A case study may always use its
own demo's fonts (its trade's), so Ottoline and Aldous Marr need no entry. Never add a row for new work.

| Case study | Font | Also used by |
|---|---|---|
| marese | Red Hat Text | pilates, the Dune look |
| grenat | Italiana | jeweller, the Nacre look (and the Aldous Marr case study, its own demo's font) |
| velvet-spoon | Albert Sans | jeweller, the Nacre look (and the Aldous Marr case study, its own demo's font) |
| velvet-spoon | Gilda Display | bridal, the Dove look |

<!-- trades -->
