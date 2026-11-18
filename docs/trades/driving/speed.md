# Driving instructors: speed

## Measurements
| Date | Site | JS (gz) | CSS (gz) | Fonts | Largest page HTML (gz) | Images, home | Third-party requests |
|---|---|---|---|---|---|---|---|
| 2026-11-17 | demos/driving (Signature, 18 pages) | 36.2 KB (13.3) | 46.9 KB (10.3) | 43 KB (Lexend 300, 400, 500) | index 8.7 KB | 232.2 KB (first screen 143.1 KB) | none |
| 2026-11-17 | client fixture (Signature, Google Sheets for slots and progress) | about the same | about the same | 43 KB | index ~9 KB | 232.2 KB | Google Sheets CSV (slots on home; progress on its page, when a code is entered) |

`npm run budget` passes for both. The first screen's photo is 143 KB (1200 × 800 WebP; trees behind the car keep it heavier than a plain street would); Lexend has a size-matched
fallback (`src/looks/verge/fonts.css`) so text wraps the same before the font loads.

## Layout shift (home, cold load, CPU 4× slower, fonts held back 600 ms)
| Date | Viewport | CLS |
|---|---|---|
| 2026-11-18 | 961 × 800 | 0.014 |
| 2026-11-18 | 1024 × 768 | 0.000 |
| 2026-11-18 | 1101 × 800 | 0.000 |
| 2026-11-18 | 1200 × 800 | 0.000 |
| 2026-11-18 | 1280 × 900 | 0.004 |
| 2026-11-18 | 1280 × 800 | 0.000 |
| 2026-11-18 | 1366 × 768 | 0.000 |
| 2026-11-18 | 1440 × 900 | 0.000 |
| 2026-11-18 | 1536 × 864 | 0.000 |
| 2026-11-18 | 1920 × 1080 | 0.000 |
| 2026-11-18 | phone (390) | 0.001 |

On desktop the cost card sets the height of the whole card grid. Its parts never change their number of lines with the
width or the font: the week choices sit in one row, the stepper and "Theory passed" always stack, the answers are sized
to stay on one line, the cost breakdown keeps room for four lines below 1100 px, and a block's saving sits under its price rather than beside it. Checked with the fallback font
at 96–108% of its matched width (to stand in for other machines' Arial): every card keeps the same height from 1140 px
up. Script-only controls are in the page from the first paint; without JavaScript a `<noscript>` style shows both price
lists and hides the controls.
