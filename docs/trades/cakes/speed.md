# Celebration cake designers: speed

## 9 Nov 2026 — cakes kit: Atelier look, Pastillage demo (branch `trade/cakes`)

Whole site: JS 9.8 KB gz, CSS 10.6 KB gz, fonts 50.9 KB (Darker Grotesque 500/600/800/900, since replaced; see 12 Nov). HTML
4.5–8.4 KB gz a page (home 7.4 KB). Home images 600 KB, 107 KB on the first screen (the hero cake: a 1200 px WebP, and
a separate 720 px phone crop); the slice stack, the commissions and the page-link cards are lazy. Commission pages
47–144 KB (one photograph each); range pages 54–316 KB, all lazy below the first screen. Fallback fonts size-matched
from the font files against Liberation Sans Regular (500/600) and Bold (800/900): 84.2% (ascent 125.8%, descent
35.1%) and 84% (126.2%, 35.2%). The client fixture (Plus, 6 pages): JS 7.9 KB gz, CSS 8.6 KB gz.

Lighthouse mobile, Pastillage home, from a fresh local server: performance 99, 99, 99, 99; accessibility 100 (97
before the footer links were given a 32 px tap height); FCP 1.4 s; LCP 1.8–2.1 s (the hero cake); TBT 30–70 ms;
layout shift 0.001–0.002. The phone layout checks, the every-page checks and axe pass on every page of the demo and
the fixture (`E2E_KITS=cakes`).

## 12 Nov 2026 — Atelier's type changed (Darker Grotesque went to hair)

Syne 700/800 for display and Golos Text 400/500/600 for reading: fonts 62.6 KB (was 50.9 KB; five latin woff2
files), CSS 10.9 KB gz, JS unchanged at 9.8 KB gz. Fallbacks size-matched from the font files against Liberation Sans
Bold (Syne 700: 115.5%, ascent 80.1%, descent 23.8%; Syne 800, very wide: 168.2%, 55%, 16.3%; Golos 600: 101.8%,
96.2%, 21.6%) and Regular (Golos 400/500: 107.3%, 91.3%, 20.5%). Lighthouse mobile, Pastillage home, three runs:
performance 100, 99, 98; accessibility 100; FCP 1.2–1.4 s; LCP 1.4–2.3 s; TBT 30–80 ms; layout shift 0.001. Phone home
length 6.5 screens at 390 × 844 (guard: under 6.6).

## 12 Nov 2026 — Chonburi for the huge type, new commission photos

Chonburi (one weight, the guest count, the tiers and h1/h2 only) and Golos Text 400/500/600 for everything else: fonts
53.8 KB (was 62.6 KB; four latin woff2 files), CSS 10.9 KB gz, JS 9.8 KB gz. Chonburi's fallback is size-matched
against Liberation Serif Bold (131.1%, ascent 72.5%, descent 19.1%). Three commission photos replaced (900 × 1350 WebP,
same grade). Lighthouse mobile, Pastillage home, two runs: performance 99, 98; accessibility 100; FCP 1.2–1.3 s;
LCP 2.2 s; TBT 10–50 ms; layout shift 0. Phone home length 6.43 screens at 390 × 844 (guard: under 6.6).
