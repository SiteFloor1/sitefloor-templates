# tourism-trip (Signature)

Your trip, by code: a private page (`your-trip.html`, kept out of the sitemap and search; free, like Plan your visit).
The operator sends a link ending `#CODE` (or the traveller types the code): the page shows the journey's name, the
start date, the days to go, how many are travelling, a link to the journey day by day and, with the checklist on,
Ready to travel.

The operator's sheet, published as CSV, holds only: `code, journey, start, travellers, updated` (journey is a journey
id; dates YYYY-MM-DD). Nothing personal, by design: a code is not a password. It fails closed: an unknown code, a
journey the site doesn't have, a bad date, or a row not updated for `staleAfterDays` (default 14) asks them to call.

```json
"trip": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "staleAfterDays": 14 }
```

On the demo, `source: "simulated"` with an `example` code (`src/demo/trip-provider.js`): the journey of this month,
starting six weeks from today, two travelling, updated yesterday.
