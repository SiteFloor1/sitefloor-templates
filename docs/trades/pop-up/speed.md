# Pop-up shops and brand experiences: speed

## 27 Nov 2026 — Capsule (Chalden) and the pop-up kit

Chalden demo (Signature, every section shown): JS 12.8 KB gz, CSS 9.8 KB gz, fonts 38.4 KB (Bona Nova 400 and Inclusive
Sans 400, latin, size-matched fallbacks). No 3D, no film. Home: first screen 45.7 KB (the bottle), whole page 260 KB;
the experience 106.7 KB, past pop-ups 95 KB, only here 41.2 KB, private hire 38 KB; the tour's map is inline SVG
(9.3 KB gz page, no images, no map service). The invitation card is drawn on the visitor's phone only after they pick a
time. Layout: the run's text is painted at build time with the same shape the script fills, so nothing moves when
the live line arrives. Lighthouse mobile, served by `npm run serve`, home three runs: 100, 100, 100; accessibility
100; FCP 1.0–1.1 s; LCP 1.2–1.7 s; TBT 10–30 ms; CLS 0.002.
