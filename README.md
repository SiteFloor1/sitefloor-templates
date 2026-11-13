# Sitefloor templates

The kit Sitefloor uses to build fast, distinct websites for UK local businesses,
plus the demo sites shown to prospective clients.

Every demo business is fictional and labelled as a demo.

## Quick start
```bash
npm ci
npm run build -- --site demos/barber        # → dist/demos/barber
npm run serve -- dist/demos/barber 4173     # http://localhost:4173
npm run check                               # everything: lint, types, tests, builds, budget, e2e
```
Requires Node 22 (see `.nvmrc`). End-to-end tests need Playwright's Chromium (`npx playwright install chromium`).

## What's here
| Path | What it is |
|---|---|
| `src/core/` | Shared by every site: layout, header/footer, live opening hours, WhatsApp links, SEO, browser boot |
| `src/features/` | Features any trade can use (price list, visit, gallery, reviews, team…) + `registry.js` |
| `src/kits/<trade>/` | Trade-specific pages, features, logic and copy (e.g. barber chair board) |
| `src/looks/<look>/` | Visual identity: colours, fonts, hero. Each look is deliberately unlike the others |
| `src/demo/` | Demo-only extras (plan switcher, WhatsApp preview, simulated data). Never in client builds |
| `sites/demos/` | Showcase sites (config + photos) |
| `sites/clients/` | Real client sites (config + photos) |
| `scripts/` | Build, serve, size budget, new-client scaffold |
| `tests/` | Unit tests (`node:test`), end-to-end tests (Playwright), fixtures |
| `docs/` | Architecture, config reference, deployment, speed log, trade docs |

## Templates
| Kit | Demo | Look | Pages | Showpiece features |
|---|---|---|---|---|
| barber | Fade District, Leeds | Barber Noir | Home, The barbers, Style guide | Live chair board, build-your-cut, face-shape picker |
| smile | Marlie, Shoreditch | Booth | Home, Whitening, Treatments (and one per treatment), Visit by visit, Consultation, Aftercare, Clinicians, Smiles, Weddings, Journal, The studio, Patient information | Booth-strip hero, "tell me what you'd change", wedding countdown, arriving re-timed |

See `docs/SPEED-LOG.md` for measured page weights.
