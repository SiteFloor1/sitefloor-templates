# Restaurants: speed

## 27 Oct 2026 — Restaurant kit and the Carte look

New kit `restaurant`, look `carte`, demo `demos/restaurant` (Saffron & Ash, Manchester) and client fixture
`test-restaurant-client` (Starter with the live board and The Table as add-ons, live sheet, own accent and type).
Budget, restaurant demo (Signature): JS 18.9 KB gz, CSS 13.9 KB gz, fonts 78.7 KB (Bodoni Moda 400 and 400 italic,
Schibsted Grotesk 400 and 600), home page HTML 19.8 KB gz, home images 625 KB of 800 (only the first plate of The
Pass loads with the page; the others load when picked, and the rail uses 4 KB thumbnails). Client fixture: JS 11.5 KB
gz, CSS 8.4 KB gz, no images.
Fallback fonts size-matched in Chromium against Liberation Serif / Sans: Bodoni 113.8% (italic 106.1%), Schibsted
103.9% (600: 99.5%).
Day or evening colours and the menu to show are set before the first paint by a 0.9 KB inline script, allowed in the
CSP by its hash (`src/core/lib/daypart.js`); the menu's controls show from the first paint when it has run, so nothing
moves when the menu's script starts. Layout-shift test (360/390/412 px, open and closed, fonts delayed): all under 0.1.
Lighthouse mobile, demo home, two runs: 93, 92; accessibility 100; LCP 2.6 s; TBT 0 ms; layout shift 0.012.
Client fixture: 99, accessibility 100, LCP 1.7 s.

## 27 Oct 2026 — Maison look, hero film, Menu Book, PDF menu (restaurant demo)

The restaurant demo now uses the Maison look. Budget, demo (Signature): JS 21.5 KB gz, CSS 16.4 KB gz, fonts 74.5 KB
(Cormorant Garamond 400 and 400 italic, Jost 300/400/500), home page HTML 22.5 KB gz (the Menu Book's pages travel in a
`<template>` and are laid out only when it's opened), home images 777 KB of 800: the budget counts both the phone and
desktop crop of the first film photo (a phone downloads one); the other film photos load after the page has, one at a
time. The first film photo is a dark one recompressed to 54 KB (desktop) / 77 KB (phone).
Fallback fonts size-matched in Chromium against Liberation Serif / Sans: Cormorant 96.6% (italic 86.9%), Jost 300 93.9%,
400 96.8%, 500 100.7%. On phones the hero's headline lines don't wrap and its two buttons sit on one row in either font,
so nothing moves when the fonts arrive (the 412 px test caught an 0.16 shift before that).
PDF menu: generated at build time (pdfkit, not shipped to the browser), 132 KB, 5 A4 pages, look's print fonts.
`npm run serve` now gzips text like Cloudflare, so local Lighthouse matches the live site (earlier entries were measured
uncompressed and are, if anything, pessimistic).
Lighthouse mobile, demo home, two runs: 95, 95; accessibility 100; FCP 1.8 s; LCP 2.6 s (the first film photo); TBT
140 ms; layout shift 0.

## 27 Oct 2026 — Maison hero: the Menu Book with the fire loop; new demo photos

The hero is now the closed Menu Book over a blurred fire loop (`hero-film` video mode). The loop is 6 s, 960×540 H.264,
178 KB, heavily out of focus (so low resolution doesn't show); its 9 KB still paints first and the video only loads after
the page's load event, so it never competes with the first paint. Not counted in the image budget (it isn't an image);
recorded here instead.
New demo photo set at twice the old size (plates 1080 px, gallery 720×900) with one shared grade; home images 787 KB of
800 (the first plate 98 KB; the other plates load when picked, and polaroids load when tapped).
JS 21.9 KB gz, CSS 17.1 KB gz, HTML 23 KB gz. The inline head script grew by the season rule (still allowed by its hash).
Lighthouse mobile, demo home, two runs: 93, 97; accessibility 100; FCP 1.8 s; LCP 2.0–2.1 s; TBT 130–250 ms; layout shift 0.
