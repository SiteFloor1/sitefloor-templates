# Speed log

Rule: every template, look and heavy feature is measured before use. `npm run budget` enforces
the limits below on every build; this log records the numbers and any change to a budget.
Each trade records its own numbers in `docs/trades/<trade>/speed.md`; shared code (budgets, start-up, CI) records here.

Lab measurements on a real mid-range Android and PageSpeed Insights are added once a site is live on its domain.

## Budgets (scripts/size-budget.js)
| Item | Limit |
|---|---|
| JavaScript per site (gzip) | 25 KB |
| CSS per site (gzip) | 25 KB |
| HTML per page (gzip) | 30 KB |
| Images per page (lazy-loaded included) | 800 KB |
| Fonts per site (woff2) | 300 KB |

## 27 Oct 2026 — start-up split into short tasks (all sites)

`core.js` now starts features in page order and hands the main thread back every ~40 ms, so a page with many features
never blocks in one long task. Restaurant demo home at 4× CPU slowdown: longest task 180 ms → 66 ms. Lighthouse mobile,
three runs from a fresh server: 92 (first, cold), 98, 98; TBT 300 / 110 / 120 ms; LCP 2.0–2.1 s. Audit G-02 had a cold 81
from one 572 ms start-up task.

## CI speed (3 Nov 2026)

Before: one job ran everything in a row: lint, types, unit tests, every build (twice: once for the budget, again in
the browser tests' setup) and 1,677 browser tests on one worker. 34 min 44 s (electrician PR) and 34 min 54 s (florist PR)
wall-clock; the browser tests alone 28 min, of which the accessibility and every-page checks were 12 min each.

Now (`.github/workflows/check.yml`, `scripts/ci-plan.js`):
- `static` (lint, house rules, types, unit tests) and `build` run side by side. `build` makes every site once, checks
  the budget and hands `dist/` to the browser-test machines as one artifact.
- Browser tests are split per test (not per file) into shards of about 220, up to 8 machines, one worker each.
- On a pull request, a change inside one kit (its folder, looks, demos, fixtures, clients or its own spec) runs that
  kit's spec, the every-page and accessibility checks for that kit's sites, and a smoke test of every site (home page
  in a browser, every page answers 200). Shared code (src/core, src/features, src/demo, scripts, test helpers, CI and
  package files) and every push to main run everything. Paths that can't change a page (docs, audits, case studies,
  tools, unit tests) run no browser tests.
- The 60-minute job timeout stays as a safety net only.

| Run | Before | After |
|---|---|---|
| Full suite (PR #49, shared code, 1,859 tests in 8 shards) | 34 min 50 s | 8 min 13 s (slowest shard 7 min) |
| Typical kit PR (probe: one bridal CSS change, 118 tests in 1 shard) | 34 min 50 s | 3 min 28 s |

Billed minutes for a full run rise a little (8 machines × 3–7 min, about 45 min against 35); a kit PR uses about 5.
Until kits register themselves (per-kit `kit.js`), a new kit still edits shared files and so runs everything.

## CI minutes (9 Nov 2026)

**Why it cost so much.** GitHub bills every machine by the minute, rounded up. A full run (static checks, builds and
the ~1,860 browser tests on 4 machines) costs about **49 billed minutes**; a one-kit run (one machine) about **5.5**.
Since 4 Nov, 39 of 49 pull-request runs that had browser tests used all 4 machines, and 14 of 16 pushes to main ran the
full suite: about 2,600 billed minutes in five days. Three causes:
1. **Every new kit looked like shared code.** Each kit PR adds its two fonts to `package.json`/`package-lock.json`
   and a demo data file in `src/demo/`, and both counted as shared. Replaying the planner on #63, #65, #66, #67, #68
   and #71: before, all six ran everything; now #65 (construction + detailing, which share `progress-provider.js`),
   #66 (tailor), #68 (wedding film) and #71 (florist) are one-kit runs. #63 (`src/core/lib/config-content.js`) and #67
   (`scripts/build.js`, `features/registry.js`) still run everything because they really change shared code.
2. **Every push re-ran the browser tests**: audit reports, docs and each "merge main into the branch" (rule 12).
   Busy branches had 5–7 runs (detailing 7, florist-social 6, wealth 5).
3. **Every merge to main re-ran the full suite**, although the same code had just passed on the pull request.

**What changed** (`scripts/ci-plan.js`, `.github/workflows/check.yml`, new `.github/workflows/nightly.yml`):
- Kit-scoped now: a `package.json`/lockfile change that *only* adds or bumps `@fontsource/*` fonts (→ the kits whose
  looks load them; any other package change, a nested package, or no old copy to compare with still runs everything);
  a `src/demo/` file wired in only by kits' own files (→ those kits; `demo.js`, `demo.css` or anything used by shared
  code still runs everything); a `src/core/assets/<folder>` only kits list in `sharedAssets` (→ those kits, e.g. cars →
  car and detailing). `src/core/lib`, `src/features`, `scripts`, test helpers, the workflow and config still run everything.
- Pull requests: browser tests run when the PR is opened or marked ready. A later push reruns them only if what changed
  since the PR's last commit with a green `check` reaches the PR's kits, or is shared code (then the PR's own tests run
  again against it). A PR that changes shared code reruns everything for any change that reaches a page. Static checks
  and every build still run on every push, so rule 12's "green check after main's latest commit" still means something.
- Main: a push runs the plan for everything since `production` (normally exactly the merged PR's files, which were just
  tested on the merge result; if a run was cancelled or failed, its changes are included in the next one), then promotes.
- **Nightly full run** at 02:17 UTC on Mon, Wed and Fri (owner's decision, 9 Nov; back to daily once the repo is public
  and minutes are free): every browser test on main, skipped if main hasn't changed since the last green
  nightly. It doesn't deploy; a failure shows on main and GitHub emails. "Run workflow" on it in Actions runs it on demand.
- Shard setup (measured, 12 shards in 4 runs): container start 18–48 s, checkout 4–7 s, Node 1–6 s, `npm ci` 3–7 s
  (already cached), downloading the build 2–5 s: under a minute of a 3–15 minute shard. Caching `node_modules` or
  dropping a step would save seconds and rarely a billed minute, so it is left as is; the savings are in running
  fewer machines and fewer runs. One worker per machine stays (the layout-shift and timing tests need a quiet CPU).

**Billed minutes, before → after** (measured per-run costs; after = estimate from the same numbers)

| Case | Before | After |
|---|---|---|
| (a) Kit-only PR (one new kit, ~5 runs) | 5 full runs ≈ 245 | ready: 1 shard ≈ 5.5; one fix ≈ 5.5; report + merge of main ≈ 3 each → ≈ 17 |
| (b) Shared-code PR (~5 runs) | 5 × 49 ≈ 245 | full when ready and after each code fix ≈ 49; reports/docs ≈ 3 → ≈ 100–150 |
| (c) Merge to main | full ≈ 49 | kit PR ≈ 6.5 (1 shard + promote); case study/docs ≈ 4; shared code ≈ 49 |

**Monthly forecast at today's pace** (~6 kit PRs and ~15 merges a week; 4.3 weeks a month):

| Part | Before | After |
|---|---|---|
| Kit PRs (6 a week) | ≈ 6,300 | ≈ 440 |
| Other PRs (case studies, docs; ~9 a week, no browser tests) | ≈ 230 | ≈ 230 |
| Merges to main (15 a week) | ≈ 3,200 | ≈ 330 |
| Nightly full run (Mon, Wed, Fri) | — | ≈ 650 |
| **Total** | **≈ 9,700** | **≈ 1,650** |

Without the nightly run it is about 1,000 a month; daily it would be about 2,100–2,500, so it runs three times a week.
The suite keeps growing (2,711 browser tests on 9 Nov), so a full run will cost more than 49 as kits are added. A shared-code PR
still costs about 49 per full run, so a week with several shared changes adds roughly 100–150 each.

<!-- trades -->
