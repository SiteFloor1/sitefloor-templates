# Only here (`popup-only-here`, Plus, page `only-here`)

The pieces sold only at the pop-up, each with its photograph, line and total price (every mandatory fee included), and
"Ask about it" as a pre-filled WhatsApp message (`{piece}` is replaced by the piece's name). "Sold out" comes only from
the brand's own stock sheet: a Google Sheet published as CSV with the columns `id`, `sold_out` (yes/no) and
`updated_at` ("2027-01-09 14:05"). A sheet older than `staleAfterDays` (default 3) or one that can't be read marks
nothing either way, and the page says "Ask us what's left today". It never says "selling fast" or "almost gone".

```json
"onlyHere": { "title": "Only here", "message": "Hello Chalden, is {piece} still available at the pop-up?",
  "items": [{ "id": "magnum", "name": "Cuvée No. 3, magnum", "line": "…", "price": 96, "photo": { … } }],
  "stock": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv" } }
```
