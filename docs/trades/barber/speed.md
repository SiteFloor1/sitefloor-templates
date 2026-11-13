# Barbers: speed

## Measurements
| Date | Site | JS (gz) | CSS (gz) | Fonts | Largest page HTML (gz) | Images, home | Third-party requests |
|---|---|---|---|---|---|---|---|
| 2026-10-22 | demos/barber (Signature, 3 pages) | 20.2 KB (8.3) | 33.2 KB (7.6) | 158.9 KB | style-guide 8.5 KB | 315 KB | none |
| 2026-10-22 | client fixture (Signature, Google Sheet) | 17.9 KB (7.5) | 25.2 KB (6.1) | 158.9 KB | index 4 KB | 45 KB | Google Sheets CSV (chair board) |
| 2026-10-22 | client fixture (Starter) | 4.8 KB (2.3) | 17.2 KB (4.6) | 158.9 KB | index 2.5 KB | 0 KB | none |
| 2026-10-23 | demos/barber after audit fixes (drawn map → address panel, per-row chair board) | 20.5 KB (8.4) | 32.9 KB (7.5) | 158.9 KB | style-guide 8.5 KB | 315 KB | none |
| 2026-10-23 | demos/barber, pre-client batch (booking setting, privacy page, stricter checks) | 20.9 KB (8.6) | 33.4 KB (7.7) | 158.9 KB | style-guide 8.6 KB | 315 KB | none |
| 2026-10-23 | client fixture (Signature, Booksy, Google Form board) | 20.5 KB (8.5) | 25.4 KB (6.1) | 158.9 KB | index ~4 KB | 45 KB | Google Sheets CSV (chair board) |
| 2026-10-23 | client fixture (Starter) | 5 KB (2.4) | 17.3 KB (4.6) | 158.9 KB | index 2.5 KB | 0 KB | none |
| 2026-10-23 | demos/barber, 6 pages (+ Our work, Prices, Plan your visit; gallery, questions, seasonal) | 26.7 KB (10.7) | 42 KB (9.4) | 158.9 KB | style-guide 9.2 KB | 315 KB home, 153 KB work page | none in the demo; Behold feed on client sites that use Instagram |
| 2026-10-23 | demos/barber + arrival guide (Plan your visit: live board, journeys, parking, leave-by) | 29.5 KB (11.7) | 46.8 KB (10.2) | 158.9 KB | style-guide 9.2 KB; visit 6.7 KB | 315 KB home | none |
| 2026-10-26 | demos/barber after audit A (brand picker, About page, bank holidays, 3 type options shipped for the picker) | 33.2 KB (13.1) | 51.3 KB (10.9) | 249.7 KB files; a visitor downloads only the type in use | style-guide 9.9 KB; visit 7.3 KB | 315 KB home | none |
| 2026-10-26 | client fixture (Signature, sage accent, Elegant serif, logo, Behold) | 31 KB (12.4) | 40.2 KB (9) | 159.3 KB (Manrope + Cormorant only) | index ~4.3 KB | 45 KB | Behold feed |
| 2026-10-26 | client fixture (Starter + Plan your visit, Modern sans) | 10.2 KB (4.5) | 25 KB (6.4) | 68.5 KB (Manrope only) | visit 3.9 KB | 0 KB | none |

## Layout shift (CLS), measured in Chromium, 23 Oct 2026
The home page moved 0.175 on a phone while fonts loaded: the headline wrapped onto two lines in the stand-in
font and three in Playfair Display, and the vertically centred hero jumped. Fix: size-matched fallback faces
(`size-adjust`, `ascent-override` in `src/looks/barber-noir/fonts.css`) and explicit headline line breaks.

| Page | Phone (390px) | Desktop (1366px) |
|---|---|---|
| Home | 0.000 (was 0.175) | 0.038 |
| Our work | 0.019 | 0.015 |
| Plan your visit | 0.002 | 0.014 |
| Prices | 0.002 | 0.014 |
| Barbers | 0.004 | 0.011 |
| Style guide | 0.003 | 0.014 |

Every new look must ship size-matched fallback faces for its display and body fonts.

## Layout shift with type options, measured in Chromium, 26 Oct 2026 (fonts delayed 1.2 s)
Each type option ships fallback faces matched per weight (regular, bold, italic) against Times/Liberation Serif.

| Site | Phone, worst page | Desktop, worst page |
|---|---|---|
| Demo (Classic serif) | 0.054 (visit) | 0.013 (work) |
| Starter fixture (Modern sans) | 0.001 | 0.005 |
| Client fixture (Elegant serif) | 0.172 (home) | 0.002 |

Correction after audit (26 Oct, re-audit A2-01): Lighthouse measured the demo home at 0.205 on a phone. The real causes
were the hero, not only the headline: (1) the Book buttons got wider in Manrope and wrapped onto a second row; (2) the status
chip changed from "Opening hours" to "Open now · closes 6pm" and pushed the kicker row onto two lines.

Fix: on phones the status chip has its own line and the hero buttons stack, so neither the font nor the live status can
change the number of lines; Noir headlines are limited to 9 characters a line (`heroLineMax`, checked by the build).
Every build now runs a browser test on every site's home page at 360, 390 and 412 px, shop open and closed, with fonts
delayed, and fails above 0.1. All pass; the worst measured is under 0.01.

## 26 Oct 2026 — Barber Street look and five new features

New look `barber-street`, demo `demos/barber-street` (Swift Cuts, express walk-in shop) and client fixture
`test-barber-street`. New features: walk-in queue, loyalty, memberships, before/after, vouchers.
Budget, Street demo (Signature, incl. Will I make it?): JS 13.2 KB gz, CSS 10.5 KB gz (10.4 before the 26 Oct case-study fixes), fonts 76.7 KB (Figtree 400/600/800, Bricolage
Grotesque 700/800; Noir's demo is 249.7 KB). Street client fixture (Plus + queue and Will I make it? add-ons): JS 12.5 KB gz, CSS 9.5 KB gz (re-measured after audit B-06).
Fallback fonts are size-matched from the font files against Liberation Sans (Figtree 99.4% / 96.9% bold, Bricolage
102.3% / 103.6%). Live text that changes after load (hero status, hero queue line) sits on fixed-height single lines
that cannot wrap; the queue's number and figures have reserved height. The layout-shift browser test (360/390/412 px,
open and closed, fonts delayed) passes on both Street sites.
