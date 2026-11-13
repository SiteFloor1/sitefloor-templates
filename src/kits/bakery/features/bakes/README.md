# Feature: bakes (bakery kit, Starter) — tonight's counter

The items marked `"counter": true`, in arched photo frames, each marked live from the shop's Google Sheet: on the
counter, a few left, sold out (with an optional note). The same sheet gives the seats line (`late-night`), sold-out
marks on the menu and in the dessert box, and the days already full for cakes (`cake-builder`, `celebration-cakes`).
On the Parlour look the hero lists the first four counter items with their marks too.

```json
"bakes": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "staleAfterMinutes": 45 }
```

The sheet (File → Share → Publish to web → CSV), one row per change, newest wins:

| kind | item | status | note | updated_at |
|---|---|---|---|---|
| dessert | pistachio-kunafa | low | Fresh at 7 | 2026-10-29 21:10 |
| dessert | basque-cheesecake | sold out | Back tomorrow at 2 | 2026-10-29 20:42 |
| seats | | filling | Upstairs is free | 2026-10-29 21:05 |
| cakes | 2026-11-07 | full | | 2026-10-28 09:00 |

Fails closed (`lib/bakes.js`): dessert and seats rows only count on the day they were written; "low" and seats go
quiet after `staleAfterMinutes`; "sold out" stands for the rest of that day; a `cakes` row holds until its date passes;
unreadable or future times are ignored; if the sheet can't be read the page says to ask. Google refreshes a published
CSV every few minutes, so changes show within minutes, not instantly. Demos use `"source": "simulated"`
(`src/demo/bakes-provider.js`), refused on client sites. Heading: `sections.bakes`.
