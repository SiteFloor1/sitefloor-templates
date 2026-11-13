# Wedding films: speed

## 4 Nov 2026 — weddingfilm kit: Première look, Larchmere demo (branch `trade/wedding-film`)

Whole site: JS 14.4 KB gz, CSS 9.8 KB gz, fonts 70 KB (Sorts Mill Goudy 400 and 400 italic, Urbanist 400/600; latin
woff2). HTML 4–7 KB gz a page (home 6.8 KB). Home images 436 KB, 296 KB counted as first (the budget counts both stills
of the hero's `<picture>`; a browser fetches one: 188 KB wide or 115 KB tall); the planner photograph is lazy.

The hero film is not an image and isn't in those numbers: it starts only after the page has loaded, never with
reduced motion or Save-Data. Wide cut 3.1 MB (12.6 s, 1920×804, H.264 CRF 28), tall cut 1.6 MB (720×900). Films page
212 KB (stills; each clip, 0.2–1.0 MB, loads only on Play); photographs 709 KB, 216 KB first (the first wedding's
three, the landscape at high priority).

Fallback fonts size-matched from the font files against Liberation Serif / Sans: Sorts Mill Goudy 107% (ascent 89.7%,
descent 44.7%), italic 103.9% (92.4%, 46%); Urbanist 400 96.6% (98.3%, 25.9%), 600 94.3% (100.8%, 26.5%). The client
fixture (Plus): JS 8.7 KB gz, CSS 7.7 KB gz.

Lighthouse 12 mobile, two runs each from a fresh server: home 97, 99 (LCP 2.0–2.6 s, the hero still); films 97, 98
(layout shift 0 after the venue chips kept their place); photographs 99, 100 (LCP 1.4–1.7 s after the landscape got
priority; 86–89 before); packages 100, 100. Accessibility 100 on all four (after the quiet text colour went to
#675C4E). Layout shift ≤ 0.003. Full `npm run check`: 427 unit tests, 1,927 browser tests passed, every site in budget.

## 4 Nov 2026 — round two: 21 pages (the day planner, film progress, film pages, venues, music, team, more)

Whole site: JS 16.4 KB gz, CSS 11.3 KB gz, fonts unchanged (70 KB). HTML 4–7 KB gz a page. Home unchanged (436 KB,
296 KB counted first). New pages, first-screen images: film pages 19–140 KB (each film's still), the day 0 KB (its
photographs are lazy), venues 150 KB after the venue photographs were re-encoded at 1300 px, q64 (201 KB before).

Lighthouse 12 mobile from a fresh server: home 99 (LCP 2.0 s); the day 99 (1.7 s); venues 98, 99 after the first
venue photograph got priority (93–94 before, LCP 3.1 s); a film page 97 (2.4 s); music 100 (layout shift 0.033).
Accessibility 100 on all five. Full `npm run check`: 430 unit tests, 1,980 browser tests passed; after merging main
(florist and electrician kits): 466 unit tests, and this kit's browser tests with every cross-site check for its
sites, 441 passed.
