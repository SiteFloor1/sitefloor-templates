# Gyms and health clubs: speed

## 17 Nov 2026 — build 2: the full Halde demo (branch `trade/gym-2`)

Whole site (Signature demo, 20 pages): JS 33.8 KB (12.7 KB gz), CSS 55.9 KB (11.6 KB gz), fonts 71 KB (unchanged).
HTML 4.6–7.1 KB gz a page. Home images 224 KB, 119 KB on the first screen (the portrait now a 1600 px WebP, 86 KB, to
fill the wider frame to the page's edge; the phone crop unchanged). New pages: the club 332 KB (66 KB first; five rooms,
four of them lazy), coaches 89 KB, trial 97 KB, training 60 KB, first visit 35 KB, events 18 KB, journal pieces 60–74
KB; classes, app and journal index none. Browser run narrowed to the gym (gym spec, a11y, all-sites, demo, smoke): 216
passed, including the phone layout-shift and axe checks on every page. `npm run budget`: every gym page in budget.

## 16 Nov 2026 — gym kit: After dark look, Halde demo (branch `trade/gym`)

Whole site (Signature demo): JS 31.6 KB (12.1 KB gz), CSS 43.2 KB (9.3 KB gz), fonts 71 KB (Epilogue 200, 300, 400, 500,
700; latin woff2, self-hosted). HTML 4.5–7.2 KB gz a page (home 7.2 KB). Home images 198 KB, 93 KB on the first screen
(the black-and-white portrait, a 1100 px WebP, with a separate 900 px phone crop); the steam band (62 KB) and the cedar
room (46 KB) are lazy. Heat and cold page 105 KB, the other pages none. The client fixture (Signature, sheets):
JS 10.7 KB gz, CSS 8.4 KB gz. Fallback fonts size-matched from the font files against Liberation Sans: Epilogue 200
105.3% (ascent 75%, descent 22.3%), 300 106.8% (74%, 22%), 400 108.2% (73%, 21.7%), 500 109.9% (71.9%, 21.4%), 700
106.7% (74%, 22%).

Measured in Chrome from the local server (Lighthouse isn't installed in this environment; CI's browser tests cover the
phone layout-shift and axe checks): layout shift 0 on every page on a 390 px phone (0.0001 on Hyrox, whose plan is drawn
by the build so the script redraws the same), at most 0.009 on desktop; LCP under 0.15 s locally on every page. axe
(WCAG 2.2 AA) clean on every page; the narrowed browser run (gym spec, a11y, all-sites, demo, smoke): 155 passed.
`npm run budget`: every gym page in budget.
