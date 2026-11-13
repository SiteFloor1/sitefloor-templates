# Feature: gift-shortlist (jeweller, Signature)

"Three within your budget." The client's own price bands (`gifts.bands`) become choices; each shows three of the
client's priced pieces in that band, from the occasion's own pieces and those marked `gift` (the occasion's first, dearest first). A piece
"on request" or with no price is never shortlisted.

- **Where:** the anniversary reminder (the calendar file then carries the three, with links, every year) and each
  occasion's page (`occasions.pages`).
- **Config:** none of its own; it reads `gifts.bands` and `pieces.items`. The check refuses it when no priced piece falls
  in any band.
- **No JavaScript:** radio buttons and CSS `:has()`; a browser without `:has()` shows every band's three.
- **Logic:** `shortlist()` in `src/kits/jeweller/lib/pieces.js` (unit-tested).
