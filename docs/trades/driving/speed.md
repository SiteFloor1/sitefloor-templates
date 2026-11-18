# Driving instructors: speed

## Measurements
| Date | Site | JS (gz) | CSS (gz) | Fonts | Largest page HTML (gz) | Images, home | Third-party requests |
|---|---|---|---|---|---|---|---|
| 2026-11-17 | demos/driving (Signature, 18 pages) | 36.2 KB (13.3) | 46.9 KB (10.3) | 43 KB (Lexend 300, 400, 500) | index 8.7 KB | 232.2 KB (first screen 143.1 KB) | none |
| 2026-11-17 | client fixture (Signature, Google Sheets for slots and progress) | about the same | about the same | 43 KB | index ~9 KB | 232.2 KB | Google Sheets CSV (slots on home; progress on its page, when a code is entered) |

`npm run budget` passes for both. The first screen's photo is 143 KB (1200 × 800 WebP; trees behind the car keep it heavier than a plain street would); Lexend has a size-matched
fallback (`src/looks/verge/fonts.css`) so text wraps the same before the font loads.

## Layout shift (home, cold load, fonts loading)
| Date | Viewport | CLS |
|---|---|---|
| 2026-11-18 | 1024 | 0.007 |
| 2026-11-18 | 1280 × 800 | 0.008 |
| 2026-11-18 | 1350 | 0.001 |
| 2026-11-18 | 1366 | 0.000 |
| 2026-11-18 | 1440 | 0.008 |
| 2026-11-18 | phone (390) | 0.003 |

The earlier 0.17–0.18 at 1280–1366 came from script-only controls (gearbox switch, postcode form, planner) appearing
after start-up and the second price list being removed. They are now in the page from the first paint; without
JavaScript a `<noscript>` style shows both price lists and hides the controls. The slots list and the cost figure keep
their space while loading.
