# Car studios (tint, wrap, PPF, detailing): speed

## 26 Oct 2026 — Car studio kit and the Studio look

New kit `car`, look `car-studio`, demo `demos/car-studio` (Apex Studio, Birmingham) and client fixture `test-car-client`
(Starter with the Showroom and next free bay as add-ons, live sheet). (Superseded the same evening: see the next entry.)
Budget, car demo (Signature): JS 18 KB gz, CSS 13.9 KB gz, fonts 77.8 KB (Michroma 400, IBM Plex Sans 400/600, IBM Plex
Mono 500), home page HTML 20.5 KB gz, images 698.4 KB (under the 800 KB budget). Car client fixture (Starter + Showroom + next free bay): JS 13.7 KB gz, CSS 9.8 KB gz.
Lighthouse mobile, demo home, three runs: 89 (cold), 95, 94; accessibility 100; layout shift 0. First paint 2.4 s on the
simulated slow phone, mostly the render-blocking CSS.
Fallback fonts are size-matched from the font files against Liberation Sans / Liberation Mono (Michroma 140.9%, Plex Sans
101.2% / 96.9% bold, Plex Mono 100%). Two layout-shift causes found and fixed: the Showroom panel (now in the page from the
start, inactive until the script runs) and the demo ribbon's "Try your colours" button (its space is now kept before the
script shows it; this also protects the barber demos). The layout-shift browser test passes on both car sites
(360/390/412 px, open and closed, fonts delayed); worst measured 0.0002.

## 26 Oct 2026 (evening) — Car kit rebuilt on real photos

After the owner's review the drawn cars were replaced with real, licensed car photos cut out onto the studio floor
(`src/kits/car/assets`), recoloured in the browser with a small WebGL shader (`src/kits/car/features/paint-gl.js`).
Fonts changed to Hanken Grotesk (300/400/500/600), size-matched against Liberation Sans (100.8% / 101% / 101.5% /
94.4% bold). Budget, car demo (Signature): JS 18.1 KB gz, CSS 13.4 KB gz, fonts 54.3 KB, home page HTML 18.9 KB gz,
images 769.5 KB (under the 800 KB budget; the recolour maps, 100–170 KB each, load only after the visitor's first
touch, scroll or key press, and the driver's-seat and planner photos are lazy-loaded). Car client fixture: JS 14.3 KB
gz, CSS 8.8 KB gz, home images 258.5 KB.
Lighthouse mobile, demo home, three runs: 88, 91, 89; accessibility 100 after fixing two contrast issues; layout
shift 0.001. Before the recolouring waited for the first interaction it scored 83–87 (WebGL work counted as blocking
time), so it now starts on interaction and the studio light passes once per change instead of looping.
Shared fix found here: the home gallery strip built every stored photo into the HTML (the template checked `page`,
which Eleventy always sets); it now builds six on the home page and twelve on the work page, and the script adds the rest.
Layout-shift test (360/390/412 px, fonts delayed): worst 0.0011, after stacking the hero buttons on phones.

## 26 Oct 2026 (night) — Car kit: 3D Showroom, swatch library, PPF page

The Showroom now shows a real 3D car (three.js, the CC BY 4.0 "Car Concept" model, `src/kits/car/assets/CREDITS.md`)
instead of recolouring photos. **Budget exception, agreed by the owner for showpiece features:** the 3D studio is
loaded only when the visitor asks for it (the "Turn it in 3D" button, or picking a colour, a shade or a wheel), so it
never slows the first view. New budget line `onTapGz: 200` (`scripts/size-budget.js`) for code loaded that way; the
3D studio is 155 KB gz (three.js, the glTF loader, orbit controls, the meshopt decoder). The model file is 1.7 MB
(1.3 MB gzipped), compressed with meshopt and WebP textures from 11.8 MB, and its size is printed on the button.
The page itself shows a 61 KB still picture rendered from the same model. Why three.js and not plain code: real
car paint (clear coat), reflections and a 360° view need a tested 3D engine; writing one would be far bigger and
riskier. It is a dev dependency bundled into our own files (no CDN).
Budget, car demo (Signature): JS 15.2 KB gz (down from 18.1: the photo recolouring is gone), CSS 14.7 KB gz, fonts
54.3 KB, home images 680 KB (down from 769.5), on tap 155 KB gz. The budget no longer counts `data-src` pictures,
which load only when picked (other driver views). Car client fixture (Starter + Showroom add-on): JS 11.3 KB gz,
home images 175 KB.
Lighthouse mobile, demo home, two runs: 88 (cold), 93; accessibility 100; layout shift 0.001; TBT 50–170 ms.
Layout-shift test with fonts delayed: 0.000 / 0.000 / 0.001 at 360 / 390 / 412 px; PPF and tint pages 0.000; no
sideways scroll.

## 27 Oct 2026 — Car kit: chip test, your car live

Two Signature features (a third, night drive, was built and then dropped by the owner; numbers below were taken
with it in; without it: JS 17.9 KB gz (17.8 before the D-01 progress fix), CSS 15.9 KB gz). Chip test: one 32 KB picture (lazy), drawing on a canvas. Your car, live: its own page, no pictures until the studio's photo, sheet checked every two minutes.
Budget, car demo (Signature): JS 20.6 KB gz (from 15.2: all three plus the tint visualiser changes), CSS 16.1 KB gz,
fonts 54.3 KB, home images 795 KB of 800 (chip picture recompressed from 48 to 32 KB to fit), your-car page 10 KB gz
HTML, no images; on tap 155 KB gz.
Lighthouse mobile, demo home, one cold run: performance 87, accessibility 100, layout shift 0.001, TBT 97 ms.

## 27 Oct 2026 (late) — Audit C-01: the 3D car downloads

The auditor measured the 3D opening on the demo's default car (the 4.0 MB saloon): 5.2 s on typical 4G, about 25 s
on slow 4G, with no progress shown. Changes: the saloon re-prepared to 2.6 MB (tyres, brake discs and dashboard knobs
plain and simplified, rims simpler; the paint, glass and interior unchanged), the hatch swapped for a 1.3 MB CC BY
model, the button and the car swap now show a percentage, and the budget has a new cap: no 3D car file over
`modelKb: 2600`. Biggest file now 2.5 MB (saloon), so about 2.3 s on typical 4G and about 13 s on slow 4G. Still to
do before a client: one try on a real mid-range Android phone (GPU time can't be measured here).
Re-audit D-01: the progress needs the file's size from the server. Without it the button now counts megabytes
("1.1 of 2.5 MB"); `scripts/serve.js` sends Content-Length like Cloudflare; a browser test on a throttled connection
checks the percentage shows. Auditor's measure after the fixes: 4.2 s on typical 4G, 17.4 s on slow 4G.
