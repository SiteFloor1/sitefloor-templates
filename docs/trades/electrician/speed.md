# Electricians: speed

## 2 Nov 2026 — electrician kit: Blue hour look, Corbel Light & Power demo

Whole site: JS 15.7 KB gz, CSS 13.8 KB gz, fonts 107 KB (Petrona 200, 300, 200 italic; Atkinson Hyperlegible Next 300,
400, 500; latin woff2). HTML gz: home 9.6 KB, other pages 6.0–8.0 KB. Only the first hero scene loads with the page; the
Cinema and Away photographs are fetched after load. Loaded on tap only (Signature): three.js 138.5 KB gz, the house scene
4.8 KB gz, the drive scene 21.9 KB gz, the car model 1,723 KB (meshopt, the car kit's file). `npm run budget` passes.
Fallback fonts size-matched from the font files: Petrona 101.7% (light) / 103.7%, Atkinson Hyperlegible Next 96.8% /
99.6%. The client fixture (Plus): JS 9.6 KB gz, CSS 9.8 KB gz.

Lighthouse mobile, Corbel home, three runs from a fresh server (the first cold): 78, 94, 89; accessibility 100;
FCP 1.1–1.8 s; LCP 2.8–3.8 s (the garden-room photograph); TBT 320 ms cold, then 0–10 ms; layout shift 0–0.004.
Axe: no serious or critical issues on any page (the shared pages' breadcrumb links now underlined).

## 2 Nov 2026 — Corbel, second round (new type, the house in 3D full width)

Whole site: JS 15.9 KB gz, CSS 14.4 KB gz, fonts 92.7 KB (Encode Sans Expanded 200 and 400, Encode Sans 300, 400 and
500; latin woff2), down from 107 KB. The house in 3D's stills: 25 KB (1600×900) and 15 KB (900×1125), lazy. On tap
(Signature): 180.9 KB gz in all (three.js, the bloom pass, the villa scene, the drive scene), under the 200 KB cap.
Fallback fonts size-matched against Liberation Sans: Encode Sans Expanded 200 107.9% (ascent 95.5%, descent 20.4%),
400 112.1%; Encode Sans 300 96.3%, 400 98.5%, 500 101.1%.

Lighthouse mobile, Corbel home, three runs from a fresh server (the first cold): 96, 99, 100; accessibility 100;
FCP 1.2 s; LCP 1.5–2.7 s; TBT 0–60 ms; layout shift 0. The 3D house in a software renderer (CI) is slow, so its
browser test runs with reduced motion; on a phone's GPU it draws at full rate and stops when off screen.

## 3 Nov 2026 — Corbel, audit round (Blue hour's own inner pages)

Blue hour now lays out every shared feature its demo uses (visit, Plan your visit, team, work, gallery, reviews, page
links, questions, seasonal, About, vouchers). Demo: JS 16.0 KB gz, CSS 16.5 KB gz (was 14.4), fonts 92.7 KB, on tap
180.9 KB gz; client fixture JS 9.7 KB gz, CSS 11.9 KB gz. `npm run budget` passes.
