# pieces (Starter)
The brand's pieces on the home page as a carousel of large, worn photographs: name, colour, price and the stock words.

- `pieces[]`: `{ id, name, colour, kind, price, line, sizes, photos[], fit?, fabric?, care?, buy? }`.
- `stock`: `{ source: "sheet", csvUrl, staleAfterHours, lowAt }` (a client) or `{ source: "fixed", fixed }` (demo only).
  The sheet's columns: `piece, size, left, updated_at`. Old or broken sheets: the words go quiet, never stale.
- Words: "Saturday 10:00 · S to XL" (in an unopened drop), "12 left · M and L only" (at or under `lowAt`), "In stock · S to XL", "Sold out".
- Sold out: "Tell me when it's back" opens `drop.restockForm` (the brand's Google Form); a demo shows a note instead.
- Links: the piece's own page (Signature), else the shop page (Plus), else the brand's shop.
