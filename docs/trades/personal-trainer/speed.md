# Personal trainers: speed

## Measurements
| Date | Site | JS (gz) | CSS (gz) | Fonts | Largest page HTML (gz) | Images, home | Third-party requests |
|---|---|---|---|---|---|---|---|
| 2026-11-15 | demos/trainer (Signature, 3 pages: diary, first month, sessions) | 26.9 KB (10.6) | 37.5 KB (8.6) | 54.7 KB (Ibarra Real Nova 400, 400 italic, 600) | index 7.4 KB | 109 KB | none |
| 2026-11-15 | client fixture (Signature, Google Sheet diary) | 23.2 KB (9.5) | 33 KB (7.7) | 54.7 KB | index ~7 KB | 109 KB | Google Sheets CSV (diary) |
| 2026-11-16 | demos/trainer, full Signature build (20 pages: 13 page features, 4 programmes, 3 articles) | 42.6 KB (15.8) | 74.5 KB (15.1) | 54.7 KB | index 8 KB | 109 KB home | none |
| 2026-11-16 | client fixture (Signature, Google Sheet diary, all features) | 39 KB (14.7) | 70 KB (14) | 54.7 KB | index ~8 KB | 109 KB home | Google Sheets CSV (diary) |

## Lighthouse (mobile), 16 Nov 2026
Two runs each from a fresh local server, Lighthouse 12.8. SEO reads 66–69 only because demos are `noindex`.

| Page | Performance | Accessibility | Best practices | LCP | CLS |
|---|---|---|---|---|---|
| Home (the diary) | 99, 100 | 100 | 100 | 1.4–1.7 s | 0.013–0.015 |
| Prices (blocks, twelve weeks, vouchers) | 100, 100 | 100 | 100 | 1.5 s | 0.039 |
| A programme (Strength) | 99, 100 | 100 | 100 | 1.4–1.8 s | 0.017 |
| Coaches | 100, 100 | 100 | 100 | 1.4–1.5 s | 0 |

axe (WCAG 2.2 A/AA): no serious or critical issues on any of the 20 pages, open and closed. Home on a phone: 5,280 px,
about 6.3 screens at 390 × 844 (the diary, the first month, page links, four questions, the footer); sessions and
qualifications live with the coaches, and the hours and address with Finding us and the footer.
