# Construction and building firms: speed

## 4 Nov 2026 — Pellow & Garth (construction kit, Handover look)

Whole demo (Signature, 26 pages): JS 9.2 KB gz, CSS 12.1 KB gz, fonts 92.2 KB (Castoro 400 and italic, Kumbh Sans
400/500/600, latin woff2). Home HTML 6.2 KB gz; home images 728 KB, 296 KB on the first screen (the hero 1440×810 WebP,
186 KB, and its 4:5 phone crop, 109 KB, both counted); everything below is lazy. The 3D house loads only on tap:
128.4 KB gz in one chunk (three.js, tree-shaken, and the procedural model; no model file), printed as "about 130 KB" on
the buttons (a unit test keeps that within 15%). Budget: passes. Fallback fonts size-matched from the font files
against Liberation Serif / Sans: Castoro 110% (ascent 68.6%, descent 22.3%, line gap 30%), italic 106.7%; Kumbh Sans
400 102.6%, 500 103.1%, 600 97.2%.

Lighthouse mobile, fresh server, two runs each (the first cold): home 94, 100; projects 99, 95; how we build 99, 99;
FCP 0.9–1.7 s; LCP 1.5–3.0 s (the hero photograph, first cold run); TBT 0 ms; layout shift 0. Accessibility 96 before
one fix (the footer credit link now underlined, so it isn't told apart by colour alone).

## 4 Nov 2026 (later) — planning guide, light study, the new pages

Whole demo (Signature, 31 pages): JS 14.3 KB gz, CSS 13.4 KB gz, fonts unchanged (92.2 KB). On tap 130.9 KB gz (the 3D
chunk now draws the limit lines and moves the sun; still "about 130 KB"). Home HTML 6.5 KB gz, first-screen images
unchanged at 296 KB. New pages: costs 5.0, planning 6.0, living 4.9, reviews 4.8 KB gz HTML, no first-screen image over
the budget (specification 315.6 KB, the largest). Phone (390 px): no sideways scroll on any page; home about 5 screens.
Budget: passes.

## 5 Nov 2026 — loft in 3D, neighbours pages, survey checklist

Whole demo (Signature, 35 pages): JS 18.1 KB gz, CSS 14.4 KB gz, fonts unchanged. On tap 131.9 KB gz (the 3D chunk
now draws hips, gables and a dormer; still "about 130 KB", within the unit test's 15%). Home unchanged (6.5 KB gz, 296 KB
first screen). New pages: loft 5.7 KB gz HTML and one 46 KB photo; survey 6.3 KB; each neighbours page 4.7 KB, no images.
Phone (390 px): no sideways scroll on the loft page with the 3D loaded. Budget: passes.
