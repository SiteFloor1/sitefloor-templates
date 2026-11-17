# Street-food and dessert stalls: speed

## 17 Nov 2026 — Spun (Fendle) and the stalls kit

Fendle demo (Signature, every section shown): JS 11.2 KB gz, CSS 8.7 KB gz, fonts 78.8 KB (Gabarito 600/700/800 and
Labrada 400, latin, size-matched fallbacks). No 3D, no film. Home: first screen 80.9 KB (the hero photo), whole page
258 KB; menu 66.8 KB, parties 75.9 KB; other pages carry no images. The board picture is drawn on the visitor's phone
when they tap Save, so it adds nothing to the page. Layout: the next-stop block keeps the countdown's shape before the
script runs (fixed heights for the place and the count on phones), so nothing moves when "Opens at" turns into the
countdown. Lighthouse mobile, served by `npm run serve`, home three runs: 99, 100, 99; accessibility 100; FCP 1.0–1.5 s;
LCP 1.2–2.0 s; TBT 0–60 ms; CLS 0.002.
