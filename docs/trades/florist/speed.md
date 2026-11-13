# Florists: speed

## 2 Nov 2026 — Mantel look, Ambry demo

Whole demo (Signature, every feature): JS 14.5 KB gz, CSS 12.4 KB gz, fonts 43.7 KB (Hedvig Letters Serif 400 and Sans
400, latin woff2). HTML gz: home 8.1 KB, every-week 7.4 KB, weddings 6.0 KB, visit 7.9 KB. Home images: 212 KB on the
first screen (the week's photo, desktop 1716 px and a 900 px phone crop; the phone downloads only its own); everything
below is lazy. Room photos recompressed to 1400 px (111–136 KB). One bright grade on every photo. Fallback fonts
size-matched from the font files against Liberation Serif / Sans: Hedvig Serif 109.4% (ascent 93.2%, descent 29.2%),
Hedvig Sans 99.7% (ascent 102.3%, descent 32.1%). The client fixture (Plus, live Sheet): JS 7.9 KB gz, CSS 8.6 KB gz.

Lighthouse mobile, Ambry home, served with gzip, three runs from a fresh server (the first cold): 95, 100, 94;
accessibility 99 → 100 after two fixes (the rooms' tab panels moved off `<figure>`; the brand link's name now matches
its visible text). FCP 1.2–1.4 s; LCP 1.5–2.9 s (the week's photo); TBT 10–100 ms; layout shift 0. Phone layout-shift
test and axe pass on every florist page (open and closed).

## 2 Nov 2026 — showpieces and pages added after the first review (refreshed after audit A)

Ambry (Signature, 29 features, 38 pages, Mantel's own layouts for the 12 shared features): JS 18.4 KB gz, CSS
16.0 KB gz, fonts 43.7 KB. New pages' HTML 6–7 KB gz; every new photograph is lazy except each page's lead. The
calendar carries 12 photos (about 400 KB, all lazy). Client fixture (Stem and Wick, Plus, live Sheet): JS 9.0 KB gz,
CSS 11.4 KB gz. Lighthouse mobile, demo home, served with gzip, three runs from a fresh server: 95 (cold), 100, 100;
accessibility 100; LCP 1.5–2.8 s; TBT 20–120 ms; CLS 0. The auditor's runs on another machine: 97, 93, 94. axe: no
serious or critical issues on any page. Budget passes.

## 4 Nov 2026 — Tissue look, Laleh demo (`trade/florist-social`)

Laleh (Signature, 14 features, 19 pages): JS 14.0 KB gz, CSS 11.6 KB gz, fonts 63.3 KB (Tenor Sans 400, Spectral 300
and 300 italic, latin woff2; one italic weight to keep the fonts small). HTML gz: home 8.1 KB, drop 5.7 KB, visit
6.2 KB, every other page 5–7 KB. Home images: 75.6 KB above the fold on a phone (the pinned still, 1100 px), 418 KB in
all with everything below the first row lazy. Every photo 800×1000 (pinned 1100×1375) WebP at q72 with one soft warm
grade. Fallback fonts size-matched from the font files against Liberation Sans / Serif with fontTools: Tenor 109.1%
(ascent 84.3%, descent 22.9%), Spectral 106.8% (ascent 99.1%, descent 43.3%).

Lighthouse mobile, Laleh home, served locally, three runs: 100, 100, 100; accessibility 100 (after a hidden h2 for the
feed and contrast fixes on the unchosen range and budgets); FCP 1.1 s; LCP 1.5–1.7 s; TBT 10–40 ms; CLS 0 (the
same-day line keeps two lines on a phone so the script's rewrite moves nothing; the range switch is drawn from the
first paint). axe and the phone layout-shift test pass on every page, open and closed. Budget passes.
