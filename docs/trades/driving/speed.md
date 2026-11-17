# Driving instructors: speed

## Measurements
| Date | Site | JS (gz) | CSS (gz) | Fonts | Largest page HTML (gz) | Images, home | Third-party requests |
|---|---|---|---|---|---|---|---|
| 2026-11-17 | demos/driving (Signature, 18 pages) | 36.2 KB (13.3) | 46.9 KB (10.3) | 43 KB (Lexend 300, 400, 500) | index 8.8 KB | 141.7 KB (first screen 52.6 KB) | none |
| 2026-11-17 | client fixture (Signature, Google Sheets for slots and progress) | about the same | about the same | 43 KB | index ~9 KB | 141.7 KB | Google Sheets CSV (slots on home; progress on its page, when a code is entered) |

`npm run budget` passes for both. The first screen's photo is 52 KB (1600 × 1067 WebP); Lexend has a size-matched
fallback (`src/looks/verge/fonts.css`) so text wraps the same before the font loads.
