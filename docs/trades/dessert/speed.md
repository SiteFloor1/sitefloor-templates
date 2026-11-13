# Dessert shops and chocolatiers: speed

## 28 Oct 2026 — Parlour (fig) and the bakery kit's showpieces

Velvet Spoon demo (Signature): JS 20.9 KB gz, CSS 20.1 KB gz, fonts 92 KB (Instrument Serif and Sans, latin, size-matched
fallbacks). The 3D (vitrine, ice-cream cone, cake builder) is on tap: 148 KB gz across `chunks/`, three.js shared. It
starts on the visitor's first move, touch, scroll or key after the page has loaded; until then each showpiece shows a
still picture rendered by the same code (`tools/atelier-poster.js`, 18–68 KB each), so nothing changes when it swaps.
Demo photos re-encoded smaller (menu and cakes 640 px wide, atmosphere 1400 px, band 1800 px): home images 1,439 → 732 KB of 800.
Layout: filters, the vitrine's controls and the photo filters keep their place before the script is ready; the hero
line and the season line have fixed heights. Lighthouse mobile, served gzipped, home three runs: 92, 91, 94;
accessibility 100; FCP 1.0 s; LCP 2.8–3.3 s; TBT 100–140 ms; CLS 0.021. Ice cream 99, desserts 100, cakes 94.
Our work page: 96 with CLS 0.071 (the shared gallery fills in after its script; under 0.1, left as is).
Before the first-touch start, the 3D turning with software WebGL kept Lighthouse's main thread busy (score 54).

## 28 Oct 2026 — Cacao (Velvet Spoon, chocolatier and gelateria) replaces Parlour

Velvet Spoon demo (Signature): JS 19.9 KB gz, CSS 16.4 KB gz, fonts 113.7 KB (Gloock and Archivo variable, latin,
size-matched fallbacks). No 3D any more; the hero is a film. Its first frame is the picture (32 KB wide, 14 KB tall);
the loop (1.18 MB wide at 1920, 409 KB tall at 720×900, H.264, no sound) starts only after the page has loaded, never
with reduced motion, data saver or a hidden tab, and isn't counted in the image budget. Photos 600×800 WebP (box tiles
360×360), one 1440×720 band: home images 792 KB of 800 (a Signature demo shows every section; a client's home is lighter).
Layout: the hero's links stack on phones whatever the font, so nothing moves when Archivo arrives (CLS 0.067 → 0).
Lighthouse mobile, served by `npm run serve`, home three runs: 98, 89, 88; accessibility 100; FCP 1.7–2.0 s; LCP
2.2–3.5 s (the poster); TBT 20–190 ms; CLS 0. Menu 99, cakes 100, gift page 98, our work 90 (CLS 0.052, the shared
gallery filling in, as before).

## 28 Oct 2026 (later) — Velvet Spoon: studio photos, new image rule, seven more features

The owner chose a new image rule: what a page fetches straight away (no `loading="lazy"`) stays at 400 KB or less,
and everything on a page at 2 MB or less (`scripts/size-budget.js`). Photos are now sized per slot from
high-resolution sources: counter 900×1200, gelato 720×960, page links 1600×1200, band 2400×1200, story 2400×1600,
box pieces 480×480 cut-outs. Home: first screen 44.6 KB (the film's first frame), whole page 1,834 KB. JS 22.7 KB gz
(of 25; the new features added 2.8 KB), CSS 18.3 KB gz. The favour lid and the advent windows are drawn or reuse the
box tiles, so they add no image weight. Lighthouse mobile home, three runs: 81 (cold), 99, 99; accessibility 100;
LCP 1.4–3.5 s; TBT 100–360 ms; CLS 0. `npm run check`: 197 unit tests, 492 end-to-end passed.
