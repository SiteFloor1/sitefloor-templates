# Hair salons: speed

## 13 Nov 2026 — Lighthouse on the demo's home page

Lighthouse 12, mobile (simulated slow 4G and CPU), on a local build of `main`'s hair demo, home page. Builder's run:
performance 97, accessibility 100, best practices 100, LCP 2.5 s, CLS 0.017. Auditor's three runs: performance 97,
98, 99; accessibility 100 each time; LCP 2.5, 2.3, 2.0 s; CLS 0.017, 0.002, 0.017. SEO scores low only because the
demo is noindex. The Selwyn Orr case study quotes the worst run (97, 100, 2.5 s, 0.02).

## 13 Nov 2026 — the first screen is one landscape photograph; stylists through their work; blow-dry pass

Home first screen images 246 KB (desktop: the plate 2000×1335, 79 KB, and the hair layer 2000×593 with
transparency, 94 KB; phones get 1200-wide copies, 33 and 38 KB). Whole demo: JS 14.1 KB gz, CSS 13.6 KB gz, fonts
unchanged. Home HTML 8.4 KB gz; the stylists' four work photographs (960×1200) are lazy. Services page 6.9 KB gz with
the pass. Phone home at 390 × 844: 4,205 px, about 5 screens. Every position on the photograph (marks, line, tag) is
worked out in CSS from the photograph's size, so nothing moves when the script starts; chairs free today has a fixed
box on the photograph. Client fixture: JS 11 KB gz, CSS 10.8 KB gz.

Measured locally: budget passes for both; the hair browser tests, accessibility, all-sites and smoke for the hair
sites: 159 passed, 1 skipped. Lighthouse not run here; CI's full suite runs on the pull request.

## 12 Nov 2026 — chairs free today, gift vouchers page, shorter phone home

Whole demo: JS 14.1 KB gz, CSS 12.6 KB gz, fonts 53.6 KB (unchanged faces). Home HTML 8.3 KB gz, first screen images
322 KB (unchanged); the stylists' portraits are gone from home, so the home's lazy images are 979 KB. Gift vouchers page
5.5 KB gz, no images. Phone home at 390 × 844: 5,212 px, 6.2 screens (was about 9.7), guarded by an e2e test. Chairs
free today keeps a fixed-height box (216 px) so its slots arrive without layout shift. Client fixture (now with chairs
from a sheet): JS 11 KB gz, CSS 9.8 KB gz, home first screen 12.7 KB.

Measured locally: budget passes for both sites; the hair browser tests, accessibility, all-sites and smoke for the hair
sites: 157 passed, 1 skipped. Lighthouse not run here; CI's full suite runs on the pull request.

## 9 Nov 2026 — hair kit: Length look, Selwyn Orr demo (Signature)

Whole site: JS 13.7 KB gz, CSS 12.5 KB gz, fonts 53.6 KB (Darker Grotesque 300/600, Public Sans 400/500; latin
woff2). HTML gz: home 9.1 KB, services 6.5 KB, colour 6.6 KB, stylists 6.1 KB, look book 6.3 KB, Plan your visit
7.1 KB; every other page 4.6–6.0 KB. Home images: 322 KB on the first screen: the cut photograph is two layers, the
plate (the photograph with the hair below the shoulder taken out, 71 KB at 1500×2000, 31 KB at 900×1200 for phones)
and the hair layer cut from it (1500×920 and 900×552 with transparency); everything below is lazy (the five texture
photographs 560×1120, the stylists' work 960×1200, the colour photograph). Look book 1,465 KB across ten looks and the
before and after pair, all lazy (0 KB on the first screen). One ivory split-tone grade (14%) on every photo.
Fallback fonts size-matched from the font files against Liberation Sans: Darker Grotesque 300 79.5% (ascent 133.3%,
descent 37.2%), 600 84.9% (124.8%, 34.9%); Public Sans 400 105.6% (90%, 21.3%), 500 106.3% (89.4%, 21.2%).
The client fixture (Signature, sheet-backed next free days, a before and after pair with consent): JS 10.4 KB gz,
CSS 9.4 KB gz, home first screen 13 KB (its small test photographs).

Measured locally: the budget passes for both sites; the shared browser suites for the hair sites (accessibility on
every page, layout shift on phones at 360, 390 and 412 px, links, no console errors) pass: 114 tests; the kit's own
12 browser tests pass. The fall is a transform and opacity animation on the hair layer only (no layout work), and it
is off with reduced motion. Lighthouse was not run here (no Lighthouse in this environment); CI's full suite runs on
the pull request.
