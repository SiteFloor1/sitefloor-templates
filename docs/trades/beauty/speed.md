# Facialists and skin clinics: speed

## 16 Nov 2026 — skin kit: Palm look, Clémence demo

Whole site: JS 9.7 KB gz, CSS 10.6 KB gz, fonts 48.6 KB (Antic Didone 400, Baskervville 400 and 600; latin woff2).
HTML gz: home 7.7 KB, Plan your visit 7.1 KB, other pages 4.8–6.0 KB. Images: home 310 KB, 156 KB of it on the
first screen (the framed photograph: 2000×1081 WebP on desktop, 900×1200 on phones; the page-link photographs are
lazy); the room 238 KB; facials 56 KB. One grade on every photograph (greens down to 40%, a touch warm). Fallback
fonts size-matched from the font files against Liberation Serif: Antic Didone 116.8% (ascent 80.5%, descent 21.4%),
Baskervville 400 108.6% (91.9%, 27.2%), 600 110.5% (90.3%, 26.7%). The client fixture (Plus): JS 6.2 KB gz, CSS 8.0
KB gz.

Lighthouse mobile, Clémence home, three runs from a fresh `npm run serve` (gzip): performance 100, 100, 100;
accessibility 100 (after the card's heading became an h2); FCP 1.0–1.4 s; LCP 1.4–1.7 s (the photograph); TBT 0–60 ms;
layout shift 0.021 (on the question; the same with the real fonts blocked, so not the font swap; under the 0.1
threshold, to look at in the audit). Phone (390×844): the home page is 6.1 screens without the footer (hero 520,
finder 1107, menu 745, first visit 587, page links 490, questions 606, visit 1047 px); the phone bar with Book stays
on screen. axe: no serious or critical violations on the demo or the client fixture (tests/e2e/a11y.spec.js).
