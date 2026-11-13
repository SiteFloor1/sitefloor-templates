# CLAUDE.md — rules for working in this repository

This repo builds websites for Sitefloor's clients (UK local businesses) from a
shared kit. Read `docs/ARCHITECTURE.md` before changing anything structural.

This repo is public: never commit client private details, invoices, credentials, personal names or internal notes. Internal material lives in SiteFloor1/sitefloor-internal.

**Internal material (SiteFloor1/sitefloor-internal, private):** clone it beside this repo. Agents read handovers
(`docs/HANDOVER*.md`, `docs/trades/<trade>/handover.md`), `docs/VISION-REFERENCES.md`, `docs/TEMPLATE-ROADMAP.md`,
design rounds (`docs/design/`, trade `design/`, `directions.md`, `screens*/`) and the audit brief, prompt and
definition of done (`audits/`) from there. Auditors write reports into `sitefloor-internal/audits/reports/`; builders
commit them there, never on the PR branch. New handovers and design rounds go there too.

## Plan
Sitefloor Ltd builds websites for UK local businesses (barbers, lash/nail, car studios, bakers, florists,
cafés, trades) whose owners run everything from Instagram/WhatsApp. Promise: a flagship-store site that answers
every customer question before they visit, loads instantly on a phone and mostly keeps itself up to date.
Not a template shop: each trade gets its own kit, each design looks unrecognisably different. Quality and honesty first.
- **Plans:** Starter £99 + £25/mo (home + Plan your visit), Plus £199 + £30/mo (up to 5 pages), Signature £349 + £35/mo
  (up to 20 pages, the trade's showpiece, something bespoke), Bespoke from £1,399, quoted after a call
  (made from scratch; monthly fee quoted). 12-month minimum. Any feature sells as an add-on; extra pages singly.
- **Running cost per client: £0** beyond hosting and domain. Free, proven tools only: Google Sheet/Form for live data,
  WhatsApp pre-filled messages, Behold (Instagram), the client's own Stripe Payment Links, links to their booking app.
- **Roadmap:** 1 barber kit (done) → 2 Street case study + homepage showroom (done) → car studio kit and its case study (done 27 Oct) → 3 next trades, one at a time, per
  `docs/TRADE-PLAYBOOK.md` and that trade's `docs/trades/<trade>/` files: customer questions first, kit + showpiece, a new design,
  fictional demo (Plus and Signature), case study, audit → 4 pre-launch (homepage locked, Cloudflare Pages previews,
  first clients via `npm run new-client`) → 5 keep growing the shared feature library.
- **Brand:** no faces or personal names on Sitefloor's own site, socials or footers; UK only. Sitefloor's site: paper
  #FBFAF7, ink #0E0F11, tomato #E8613C, Manrope, sharp edges. Once Companies House lists Sitefloor Ltd, show its name,
  number and registered office. Real future clients never appear in demos.

## How we work
1. Think like the owner: say what would make it sell or fail; recommend, then act on the obvious next step.
2. Start from the customer's questions (parking, prices, "do you do…", availability).
3. Every design unrecognisably different (rule 4). Aim for "wow": improve anything ordinary before showing it.
3a. **Design process (every new look or demo):** (1) no build until the owner approves ONE static screen (home top +
    one section, desktop and phone); (2) real photography and film (free licensed stock until the client's own),
    credited, matched and given one colour grade, never drawings for rooms, food or products; (3) a brand world:
    emblem or monogram, a signature colour taken from one natural object, one packaging/tableware motif; (4) 3–5 named
    real references (sites AND real shops or rooms) and what came from each; (5) a mini design system first (grid,
    type scale with extreme contrast, spacing, image ratios, motion: slow, purposeful, never tied to the scroll);
    (6) one hero idea with restraint; other features sit quietly as tools; (7) show the product, large; very few,
    confident words; (8) compare against every demo, including ones still in progress on other branches.
    (9) one first-screen wow (see golden rule 4); neutral grounds welcome; fonts only if unclaimed in `docs/CLAIMED-FONTS.md`.
4. Never claim what the code doesn't do; no AI-slop wording; never invent prices, laws, accreditations or reviews.
   Demo brand names: one short, real-sounding word or name a real owner might choose (e.g. "Laleh", "Kestle");
   never the "Surname & Surname" pattern (an AI tell), and check no UK business uses it.
5. Measure: budget, phone layout-shift test, accessibility, Lighthouse; numbers in `docs/trades/<trade>/speed.md`.
6. Finish properly: tests, README, a published demo link, then a short plain-English update for the owner
   (what changed, why, one thing to check) and a short ready-to-send message for the auditor.
7. Keep usage low: read only the files involved, let CI run the full check (not locally) and summarise, no screenshots unless
   asked (the owner reviews published links), and offer a handover when a chat gets long.
8. Unclear and costly to get wrong: ask one clear question. Otherwise choose, do it, and say what you chose.
9. One markdown file at most for reports (never a Word copy too). Commit as "Sitefloor" <hello@sitefloor.com>.
10. Be boldly creative: in every plan and review, pitch new feature ideas (not only fixes), including ambitious ones,
    because kits are for many clients and one will love what another doesn't. Every trade plan suggests alternative
    showpieces (alongside or instead). When splitting features across plans,
    give a lower tier an easy feature; keep next-level showpieces Signature only.
11. After a case study, don't rebuild or show the Sitefloor homepage or earlier case studies unless the change is major.
11a. **Never publish how we built something.** Case studies, Sitefloor's site and anything public show what a
    feature does for the client, never our process: no build logs, versions (v1, v2…), dropped ideas, internal
    reviews or the owner's comments. History in handovers and `sitefloor-internal/docs/HANDOVER.md` is for agents to understand the
    code, never page material, even if a handover lists it under "what to show".
12. **Merging (approve once, then the builder merges):** mark the PR ready before asking for audit, so CI runs.
    After an APPROVED verdict with no findings: commit the audit report to `sitefloor-internal/audits/reports/` first
    (not on the PR branch), then merge `main` into the branch,
    and wait for a CI `check` that **started after `main`'s latest commit** and is green on the PR's head commit.
    Never merge while a run is still going. Never `git push` to main: only the merge API starts main's run. Then check `git diff origin/main...HEAD`: outside the PR's own kit or
    case-study files it may only ADD the PR's own lines (no removed or changed lines in shared files). If all of
    that holds, merge (`PUT .../pulls/N/merge`, `merge_method=merge`) without asking the owner and without a
    re-audit, even if `main` moved after the approval. A conflict resolved by keeping both sides: list the files in
    one line and send that diff to the auditor for a quick look, not a full re-audit. A resolution that changes
    shared logic, any finding, or anything "for you to decide" means fix and re-audit, or ask, before merging.
    Lockfile conflicts: regenerate with `npm install`, never edit by hand. A CI run that fails with no steps is a
    billing block, not a test failure: tell the owner.
13. **Ready for review:** when the owner has approved the work, mark the draft PR ready yourself
    (`POST /repos/{owner}/{repo}/pulls/N/ccr/ready_for_review`; GraphQL isn't available) so it can be tracked. If that
    fails, tell the owner to click Ready. Then send the auditor message.

## Golden rules
1. **A client site is a `site.json`, not a copy of another site.** Never copy a demo
   folder to start a client. Use `npm run new-client -- --kit <kit> --slug <slug> --plan <plan>`.
2. **Shared code is shared.** A fix in `src/core` or `src/features` affects every site.
   Before finishing, run `npm run rules`, the unit tests and a build of your own sites locally, then push and let
   CI run the full suite (it's split across machines: ~15 min instead of ~36 locally). CI's green `check` counts as
   the full check. Run `npm run check` locally only when debugging a CI failure.
3. **Demo content never reaches a client.** Demo-only code lives in `src/demo/` and is
   only bundled when `mode` is `"demo"`. The build fails if demo markers appear in a client build.
   Never use fictional numbers (07700 900xxx), sample reviews or simulated data on a client site.
4. **Every look is unrecognisably different. Everything a visitor sees belongs to the look.**
   Shared = logic, data, validation, tests, accessibility and legal basics. Not shared = anything
   visible: header and navigation, footer, phone action bar, how sections are introduced (no
   "small label + big two-line heading" by default), page layouts and rhythm, how each feature is
   laid out, buttons, edges, motion, amount of copy, palette, type. The only visible thing every
   site keeps is the "Website by Sitefloor" credit.
   - Never model a new look's pages or feature markup on another kit or look. Reuse logic, not layout.
   - A recolour of an existing structure is a failed design, however good it looks.
   - Before showing the owner a new design: screenshot it beside EVERY existing demo (desktop and
     phone) and write a short difference table (header, hero, section intros, page rhythm, feature
     layouts, footer, phone bar, palette, type, copy length). Any row that matches another demo
     must be redesigned. Then an AI-slop pass on all copy.
   - Never reuse another look's hero composition (e.g. Noir's stacked three-line headline).
   - Colour: the page ground may be neutral (white, ivory, stone, black, deep navy) and usually should be;
     the best luxury sites sit on a neutral and let the photography carry the colour. The one natural object
     gives the **accent and the photo grade**, not a tinted page. Never pick an odd mid-tone ground (mustard,
     sage, peach, duck egg, kraft) just because no other demo uses it: two looks may share a neutral ground.
     Looks differ through layout, type, photography and the hero idea, not page tint.
   - Fonts: before mocking up, run `git fetch --all --prune` and read `docs/CLAIMED-FONTS.md`. Never use a font (or
     a cut of the same family, e.g. Castoro and Castoro Titling) already listed there. Add your chosen
     fonts to `docs/trades/<trade>/fonts.md` in your first mockup commit, run `npm run docs` and push straight
     away, so parallel agents see them (`npm run rules` fails if another trade has the family, on main or on any fetched open branch).
     Avoid the default pairing "elegant serif headline + plain sans body" unless the idea needs it.
   - Wow: every new design has one moment on the first screen that the owner would show a client (a
     useful interaction or a striking real image), not only a tasteful layout. Avoiding AI habits is not
     enough; chase the idea.
   Features use design tokens only (`--bg`, `--accent`, `--font-display`, …), never raw colours.
5. **Measure speed.** `npm run budget` must pass. Record any new template or heavy feature
   in `docs/trades/<trade>/speed.md` with the numbers (shared code: `docs/platform/speed.md`).
6. **No fabricated facts on client sites.** Reviews are real (copied from Google with name
   and date), stats come from the client, photos are the client's own or properly licensed.
   Never add ratings/reviews to structured data.
7. **Sitefloor itself is never named after a person.** No personal names on Sitefloor's own
   pages or footers ("Website by Sitefloor" only).
8. **Keep it plain.** HTML, CSS and small ES modules. No frameworks, no new runtime
   dependencies without a written reason in the PR.

## Where things go
| You are adding… | Put it in |
|---|---|
| Logic with no DOM (time, prices, parsing) | `src/core/lib/` (shared) or `src/kits/<kit>/lib/` (trade-specific), with unit tests |
| A feature any trade can use | `src/features/<id>/` (`<id>.njk`, `<id>.css`, optional `<id>.js`, `README.md`) + register in `src/features/registry.js` |
| A feature for one trade | `src/kits/<kit>/features/<id>/` + an entry in `features` in `src/kits/<kit>/kit.js`. A NEW kit feature's id starts with the kit's name (`hair-services`, not `services`; existing ids stay as they are). Ids must be unique across the shared features and every kit, on main and every open branch: `npm run rules` fails naming the other kit (run `git fetch --all --prune` first) |
| A trade's settings checks, page data, live data | `src/kits/<kit>/config.js` and the kit's `kit.js` (never a shared file: `npm run rules` checks) |
| Page layout for a trade | `src/kits/<kit>/pages/*.njk` |
| A page every site gets (privacy) | `src/core/pages/*.njk` |
| Colours, fonts, hero, visual character | `src/looks/<look>/` (`look.json`, `look.css`, `fonts.css` with size-matched fallbacks, `hero.njk`, `favicon.svg`) |
| Questions a trade's customers ask | `docs/trades/<trade>/questions.md` (before building the template; `npm run docs` lists it) |
| A trade's plan, demos, speed numbers and fonts | `docs/trades/<trade>/` (`playbook.md`, `demo-map.md`, `speed.md`, `fonts.md`; a new trade adds `trade.json`) |
| A case study's source | `case-studies/<slug>/` (`index.html`, a `README.md` entry, `fonts.md`) |
| Anything in `docs/SPEED-LOG.md`, `CLAIMED-FONTS.md`, `DEMO-MAP.md`, `docs/trades/README.md`, `case-studies/README.md` | never by hand: they are generated. Edit the sources above, then `npm run docs` (`npm run rules` fails if stale) |
| A client's content | `sites/clients/<slug>/site.json` + `img/` |
| Demo-only behaviour | `src/demo/` |

## Commands
- `npm run build -- --site demos/barber` — build one site to `dist/`
- `npm run build -- --site clients/<slug> --env production` — production build (indexable if the site allows)
- `npm run check` — lint, house rules, typecheck, unit tests, build all, size budget, end-to-end tests
- `npm run rules` — house rules only (tokens in features, banned fonts, look uniqueness, filler copy, docs indexes current)
- `npm run docs` — regenerate the shared docs indexes from the per-trade and per-case-study files
- `npm run release -- --site clients/<slug>` — what Cloudflare runs: unit tests, rules, build, budget for one site
- `npm run seasons -- --year 2027` — suggested UK dates for seasonal modes
- `npm run serve -- dist/demos/barber 4173` — preview a build like Cloudflare serves it

## Typical client request
"New site for Kings Cuts, Leicester. Barber kit, Plus plan, team page and gallery."
1. `npm run new-client -- --kit barber --slug kings-cuts --plan plus`
2. Fill `sites/clients/kings-cuts/site.json` from the intake form; add features `gallery`, `reviews`, `team`, `page-links` with their config (see each feature's README).
3. Add the client's photos to `img/` as compressed WebP.
4. `npm run build -- --site clients/kings-cuts` until it passes, then `npm run check`.
5. Follow `docs/DEPLOYMENT.md`.
