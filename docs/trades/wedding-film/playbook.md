# Wedding films: playbook

What to build for this trade (kit `weddingfilm`). The ground rules and the steps for a new kit: [`docs/TRADE-PLAYBOOK.md`](../../TRADE-PLAYBOOK.md).

## Luxury wedding videographer and photographer (new `weddingfilm` kit, look `premiere`, demo Larchmere) — built 4 Nov 2026
- Customer: a couple 12–18 months out, comparing three or four studios on their phones. The site's job: play the
  work first, answer "are you free on our date?" in one tap, make packages plain, and show the studio plans by light.
- Demo brand **Larchmere** (fictional; searched), east London. Design contract, references and comparisons:
  `sitefloor-internal/docs/design/wedding-film.md`. Handover: `sitefloor-internal/docs/trades/wedding-film/handover.md`.
- **Starter:** `studio-film` (the film edge to edge, muted, pause), `wf-packages` (WVID-1), `date-check` (WVID-2, the
  diary sheet, fails closed), `delivery-times` (WVID-5, moved down from Plus as the easy extra).
- **Plus:** `films-page` (WVID-3, films by venue), `wf-builder` (WVID-4, Stripe deposit link),
  `photographs-page`, `wf-packages-page`, and `sunset-line` (new, easy: the sunset on the date check).
- **Signature:** `showreel` (WVID-6, the film in chapters, full screen), `light-planner` (WVID-7, real sunset, golden
  and blue hour, .ics), `couple-page` (WVID-8, by code, fails closed).
- Pages: Home, Films, Photographs, Packages, Meet us (Plan your visit, free); Signature adds the couple's page
  (unlisted) and custom pages (The studio). Venues, real weddings, journal: next round.
- Alternative showpieces kept for clients who want them: the running order (the wedding day's timeline built around
  the light, .ics for the couple and a link for the planner); proofing inside the couple's page (music shortlist and
  album favourites by Google Form); a films-by-venue page per venue; a destination planner (sun times abroad plus the
  studio's travel terms); the anniversary reminder; (3D, only if wanted) where the sun falls at the venue.
