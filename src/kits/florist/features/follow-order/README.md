# follow-order (florist kit, Signature, unlisted page `your-order`)

Follow your order: the florist sends `your-order#AMB4K7` with the order confirmation. The page reads that reference
(never a name) from their published Google Sheet: the stage (being made, on the van, delivered; their own stage ids),
when it was updated, a note, and a photo of the actual bouquet before it left (a Google Drive or Photos link). Checked
every two minutes while the page is open. Unknown reference, a row not updated for `staleAfterHours`, or an unreadable
Sheet all say "message us". Kept out of the sitemap and search; free on the page count.

**The whole Sheet is public.** A published Sheet can be read by anyone who has its address, and the address is in the
page. The page only shows the row for the reference typed, but the full Sheet is downloadable. Keep names,
addresses, phone numbers and card messages out of it: a reference, the stage, the time, a short note and a photo
of the flowers only. Use a separate Sheet for this, never the florist's order book.

Sheet columns: `ref, stage, updated_at, note, photo`. Demo: `"source": "simulated"` with an `example` reference
(the simulation lives in `src/demo/florist-provider.js` and is never in a client build).

```json
"orderTracker": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "staleAfterHours": 24,
  "kicker": "Your order", "title": "Where your flowers are", "intro": "…",
  "stages": [{ "id": "making", "name": "Being made", "about": "…" }, { "id": "van", "name": "On the van", "about": "…" }, { "id": "delivered", "name": "Delivered", "about": "…" }] }
```
