# Architecture

## In one sentence
A site is a **`site.json`** (content + which features + which look). The build validates it,
bundles only the CSS/JS that site needs, renders the kit's page templates with the site's data,
and verifies the output. No site's code is ever copied from another.

```
sites/clients/kings-cuts/site.json ──▶ validate (src/core/lib/config.js)
                                       │
         src/features/registry.js ─────┤ which features exist, their plan and required config
         src/kits/*/kit.js       ─────┤ each kit's features, checks, page data and live data (found by the registry)
                                       ▼
         scripts/lib/bundle.js   ──▶ dist/…/assets/site-[hash].css + site-[hash].js   (esbuild)
         scripts/lib/render.js   ──▶ dist/…/*.html                                    (Eleventy + Nunjucks)
         scripts/build.js        ──▶ robots.txt, sitemap.xml, _headers, img/
         scripts/lib/verify.js   ──▶ fail on demo leakage, missing files, "undefined"/NaN
```

## Layers and dependency direction
```
src/looks/*  ─┐ visual only (tokens, fonts, hero markup)
src/kits/*   ─┼─▶ src/features/*  ─▶ src/core/*
src/demo/*   ─┘                     (core depends on nothing above it)
```
- `src/core/lib/` — pure functions, no DOM, unit-tested: hours, WhatsApp, config validation, SEO, text.
- `src/core/js/core.js` — the browser runtime: boots features found on the page (`[data-feature]`),
  live open/closed status, mobile menu, reveals, a tiny shared store (`ctx.share` / `ctx.watch`).
- `src/core/layouts|partials/` — base HTML document, header, footer, mobile bar.
- `src/features/<id>/` — generic features. `src/kits/<kit>/features/<id>/` — trade features.
  Each has a template, styles, optional browser module exporting `init(root, ctx)`, and a README.
- `src/looks/<look>/` — sets the design tokens and owns the visual character. Features only use tokens,
  so the same feature looks completely different under another look (enforced by a unit test).
- `src/demo/` — only bundled for `mode: "demo"`.

## Key decisions
| Decision | Why |
|---|---|
| Static HTML, no framework | Small local-business sites; fastest possible pages; nothing to hydrate; cheap to host |
| Eleventy for HTML, esbuild for assets | Both mature, zero runtime cost, one build per site |
| Pages rendered from config | A new client never copies another site, so content cannot leak between clients |
| Feature registry | One list drives validation, bundling, plan rules, the demo plan switcher and docs |
| Browser modules get a `ctx`, not globals | Features stay independent; data sharing is explicit |
| Chair board via a provider | Same UI for demo (simulated) and client (Google Sheet); demo code never ships to clients |
| Fail closed for live data | Stale or broken chair data hides the board instead of showing wrong times |
| No ratings in structured data | Google treats self-published reviews as self-serving |
| Self-hosted fonts (woff2, latin only) | No third-party requests, faster first paint, no data-protection question |
| Strict CSP via Cloudflare `_headers` | Only same-origin scripts; Google Sheets allowed only when a site uses one |

## How a page is assembled
`src/kits/barber/pages/index.njk` includes the look's hero, then each feature's template if that feature is enabled
(`{% if "gallery" | enabled %}`). Filters available to templates are defined in one place: `scripts/lib/render.js`.

**A look owns the markup.** Templates are included from a copy of `src/` made for each build
(`scripts/lib/look-layout.js`), with the look's own files laid over the shared ones, so logic stays shared and only
what the visitor sees changes. Optional files in `src/looks/<look>/`: `header.njk`, `footer.njk`, `mobile-bar.njk`,
`section-head.njk`, `features/<id>.njk` (a feature's main template) and `features/<id>/<file>.njk` (any other
template of that feature, e.g. a home part). Anything the look doesn't supply falls back to the shared template; an
override for a feature or file that doesn't exist, or any other `.njk` at the top of the look's folder (a typo like `heder.njk`), fails the build. Every page must keep the "Website by Sitefloor"
link (`scripts/lib/verify.js`); the check reads the HTML, so a look must not hide the credit with CSS either. A look's own markup must keep the data attributes and ids the feature's script uses, and the hooks the shared
scripts and tests rely on: the menu button `.burger` opening `#mnav`, a link to the business's booking channel in the
header and in the phone bar (`.mbar`), `[data-live-status]` where the open status shows. The browser tests find the
booking links by where they go, not by their words, so each look can word its own actions.

## Plans
`starter < plus < signature`. Each feature declares `minPlan`. Validation rejects a feature above the site's plan.
Between them, a kit's demos must show every feature of the kit except its `clientOnly` ones, which only its client fixtures show (`npm run rules`); each demo shows its own set so shops can compare. The plan switcher hides parts marked `data-tier`.

## A kit registers itself
Each kit has one entry file, `src/kits/<kit>/kit.js`. The shared build finds every `src/kits/*/kit.js` at build time,
sorted by folder name (`KITS` in `src/features/registry.js`), so adding or changing a kit never edits a shared file,
and `npm run rules` fails if `scripts/lib/bundle.js`, `scripts/lib/render.js`, `src/core/lib/config.js`,
`src/core/lib/config-extras.js`, `src/core/lib/seo.js` or `src/features/registry.js` names a kit.

| Export | Used by | What it is |
|---|---|---|
| `features` | registry → validation, bundling, pages, plan switcher | the kit's own features, in load order; a string (a shared feature's id) places that shared feature among them |
| `uses` / `refuses` | registry | shared features only some trades offer (`kits: []` in registry.js), and ones this trade never offers |
| `clientOnly` | registry → `npm run rules` | features (its own or shared ones it offers) that need the client's own material, e.g. a real before/after pair of one place: no demo of the kit may turn them on, its demos needn't show them, and a client test fixture of the kit must (the only client-only mechanism; a name the trade doesn't offer fails the build) |
| `check` | `config.js` | the kit's site.json checks (`src/kits/<kit>/config.js`); runs for every site, returns early for other kits |
| `pageData` | `render.js` → `clientData` | what the kit's browser scripts read from the page |
| `buildData` | `render.js` → `build` | values the kit's templates read before the first paint |
| `providers` | `bundle.js` | live data: the demo's simulated module and the client's sheet module, chosen per site |
| `sharedAssets` | `build.js` | folders in `src/core/assets/` the trade draws from (e.g. `cars`, the licensed 3D cars), copied to the site's `img/<name>/`; never reach into another kit's files |
| `csp` | `seo.js` → `_headers` | what the kit adds to the security policy: `sheets` (reads a published Google Sheet; allowed once), other `connect`, `img`, `script` and `frame` sources |
| `settings` | `config.js` | top-level site.json keys the trade's sites may carry that no feature lists in `requires` or `optional` (any other key is refused) |
| `savingsItem` | `config-extras.js` | what the loyalty card's savings example compares against when the trade sells something other than services (a café's dish) |

Feature ids are one flat list, so a kit's own ids must be unique across the shared features and every kit, on main and on
every other open branch (`scripts/lib/feature-ids.js`, part of `npm run rules`; CI fetches every branch). New kit features
start with the kit's name (`<kit>-services`); older ids keep theirs.

Shared features stay in `registry.js`. A shared feature open to every trade has `kits: ["*"]`; one only some trades
offer has `kits: []` and each of those trades lists it in `uses`. `bundle.js` keeps the providers that existed when
kits started registering themselves in their old order (so every bundle stayed byte-identical); new ones follow,
sorted by key.

## Adding a new trade (kit)
1. `src/kits/<kit>/kit.js` (above) and `config.js`; `pages/` (index + any page features), `lib/`, `features/`,
   `client-template.json`, optional `eleventy.js`. Pages every site gets (privacy) live in `src/core/pages/`; a kit page with the same name replaces it.
2. A new look in `src/looks/<look>/` (its `look.json` lists the kit) — must be visually unrelated to existing looks.
3. A demo in `sites/demos/<kit>/` and a client fixture in `tests/fixtures/sites/`.
4. Unit tests for the kit's `lib/`, e2e tests for its showpiece features in `tests/e2e/<kit>.spec.js`. `npm run check`.
5. Optional: `src/kits/<kit>/kit.css` (visuals every feature of that trade shares, e.g. drawn vehicles; bundled after core)
   and `src/kits/<kit>/demo.json` (how the demo's plan switcher describes each plan for that trade).
6. Docs in `docs/trades/<trade>/` (customer questions, playbook, demo map); steps in `docs/TRADE-PLAYBOOK.md`.

## CI
`.github/workflows/check.yml`: `static` (lint, rules, types, unit) and `build` (every site once, budget) run side by
side; `build` hands `dist/` to 1–4 browser-test shards. `scripts/ci-plan.js` narrows the browser tests to the kits a
change reaches (that kit's spec, every-page and accessibility checks for its sites, and `smoke.spec.js` for every site).
Kit-scoped as well: a `src/demo` file wired in only by kits' own files, a `src/core/assets` folder only kits list in
`sharedAssets`, and a `package.json`/lockfile change that only adds or bumps `@fontsource` fonts (the kits whose looks
load them). Shared code (`src/core/lib`, `src/features`, `scripts`, test helpers, CI, any other package change) runs
everything. A pull request runs them when opened or marked ready; a later push only if what changed since its last green
commit reaches its kits or shared code. A push to main runs the plan for everything since `production`, then promotes;
`nightly.yml` runs every browser test daily when main has changed and promotes when green, only if main's own run for that commit was green or never started (a failed one waits for a re-run). Locally, `npm run check` still runs it all;
`E2E_KITS=bridal npx playwright test` narrows the cross-site specs the same way.

## Demos: published daily, dates always ahead
Demos are published to GitHub Pages by `.github/workflows/demos.yml`, from `production`, every day and after each green
run on main: `scripts/pages.js` builds each demo into its own folder (relative links), an index and a robots.txt that
blocks crawling, and fails if any page lacks `noindex` (demos are fictional businesses). Their address comes from one
setting, `demo-hosting.json` (`npm run demo-links` moves every link when it changes; `npm run rules` fails on a link
left on an old address). Before a demo is checked and built, `src/demo/dates.js` moves its forward-looking sample dates
(events, trunk shows, closures, seasonal windows…) ahead of the build day; client sites are never touched. Demo
providers in `src/demo/` work their dates out in the browser on the day. `node scripts/build.js --today YYYY-MM-DD`
builds as if on another day. The browser tests build every site as on one fixed day with demo dates as written
(`--today` from `tests/e2e/test-day.json`, `--as-written`), so pinned-clock tests stay deterministic; the moved dates are
checked by `tests/unit/demo-dates.test.js` (classified, ahead of today, valid site.json, for today and five years on).

## Docs: one file per trade, generated indexes
Shared docs that every trade used to edit are generated by `scripts/docs-index.js` (`npm run docs`) from one file per
trade (`docs/trades/<trade>/`: `trade.json`, `speed.md`, `fonts.md`, `demo-map.md`, `questions.md`, `playbook.md`), per
case study (`case-studies/<slug>/README.md` and `fonts.md`) and the shared parts in `docs/platform/`. Generated:
`docs/SPEED-LOG.md`, `docs/CLAIMED-FONTS.md`, `docs/DEMO-MAP.md`, `docs/trades/README.md`, `case-studies/README.md`
and the trade link lists in `docs/CUSTOMER-QUESTIONS.md` and `docs/TRADE-PLAYBOOK.md`. `npm run rules` fails if any is
stale or if two trades or case studies claim the same font family (other cuts count as the same family), including a
claim in `fonts.md` on any other open branch (`origin/*`: agents `git fetch --all --prune` first, CI fetches every branch;
skipped on main, so an open branch never fails main). A case
study may use its own demo's fonts (the `Trade` column of its `fonts.md`); the few older pages that share a font with
another trade are named as historical exceptions in `docs/platform/fonts.md`, and nothing new may be added there. Two parallel
pull requests then only meet in generated files: after merging `main`, run `npm run docs` and commit; never resolve a
conflict in a generated file by hand.

