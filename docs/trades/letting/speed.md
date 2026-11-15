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
