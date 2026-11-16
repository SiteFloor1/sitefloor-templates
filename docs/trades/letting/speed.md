# Independent letting agents: speed

## 15 Nov 2026 — Halvern (letting kit, Porter look)

Whole demo (Signature, 7 pages): JS 12.4 KB gz, CSS 10.1 KB gz, fonts 95.3 KB (Petrona 300/400 with italics, latin
woff2). Home HTML 4.8 KB gz; home images 268 KB, both crops counted (the porch, 2560×1520 WebP on desktop, 1170×1463 on
phones; a visitor loads one). The 3D building loads only on "See the building": 134.4 KB gz (three.js and the scene,
one chunk), drawn in code, no model files. The client fixture (Plus, no 3D): JS 6.5 KB gz, CSS 7.6 KB gz.

Fallback font size-matched from the font files against Liberation Serif (average advance of a mixed sample; hhea
ascent and descent): Petrona 300 103.2% (ascent 83.1%, descent 26.2%), 400 105% (81.7%, 25.7%), 300 italic 97.3%
(88.2%, 27.8%), 400 italic 97.9% (87.6%, 27.6%). The headline is set on fixed lines (`|` in hero.title) so the font
swap never re-wraps it.

Lighthouse 12 mobile, local server: home performance 98, accessibility 100, best practices 100 (FCP 1.5 s, LCP 2.3 s
on the porch, TBT 0 ms, CLS 0); Residences 100/100/100 (CLS 0); Fees 99/100/100; Owners 100/100/100. Layout shift
while loading (PerformanceObserver, real fonts, 412 px): 0.00004 on the home page. The residences schedule keeps its
place unseen until the sheet has filled it, so nothing moves on screen (it was 0.144 before). Home page at 390 × 844:
3.3 phone screens including the footer and the demo bar.

## 16 Nov 2026 — Signature build-out (20 pages)

Whole demo: JS 41.1 KB (15.3 gz), CSS 53.9 KB (12 gz), fonts 95.3 KB, 3D on tap 134.4 KB gz (unchanged). Home images
317 KB, both porch crops counted (the wider re-crop: brick, stone porch and the retouched cartouche; one loads).
Area photos 1400 px (62–157 KB) with 700 px copies (22–56 KB) on the areas index.

Lighthouse 12 mobile, local server (performance / accessibility / best practices): home 97/100/100 (LCP 2.4 s,
CLS 0); areas 99/100 (it was 94 with a 1400 px card photo: the index now uses the 700 px copy); an area 97/100/100;
valuation 99, moving in 100, onboarding 99, owner stories 99, journal 100, an article 100, what we manage 99,
residences (with filters) 100, owners 100; accessibility 100 and CLS ≤ 0.01 on every page.

## 16 Nov 2026 — audit fixes (L-01, L-02)

Layout shift with fonts held back 600 ms and the site script 1.5 s (PerformanceObserver, all shifts):
residences 0.016 at 360 px, 0 at 390 and 1024 px (it was 0.18–0.25: the filters and building picker now take their
place on first paint, unseen until the script starts, and the schedule stays unseen until the sheet has filled it);
valuation 0.016 at 390 px, 0 at 1024 and 1440 px (it was 0.14–0.18: the sentence sits on set lines, and the
fallback widths were re-matched to the rendered Petrona: 400 105.7%, 300 103.7%, 400 italic 98%, 300 italic 98.3%).
Remaining font-swap shifts are paragraph re-wraps on the articles and onboarding, ≤ 0.046. `letting.spec.js` now
fails above 0.05 on residences (360 px), valuation (1024 px) and the stale areas index (390 px).
