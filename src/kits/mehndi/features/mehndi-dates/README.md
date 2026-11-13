# Date check

| | |
|---|---|
| Feature id | `mehndi-dates` |
| Plan | starter and above |
| Config | `dateCheck`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV), `staleAfterDays?` (default 21), `message` (WhatsApp opening), `lead?` (one line in the artist's words, e.g. "Summer Saturdays go a year ahead."); heading in `sections.dates` |

## How it works
The bride picks her wedding date (day, month, year, always in UK order) and the page answers from the artist's diary:
free so far, a few hours left, or taken (with "guest mehndi, or the evening before, may still be free"). It never says
booked: "Ask about this date" sends the date on WhatsApp and the artist confirms. The date is shared on the page, so
the darkest-day line, the guest quote and the planner pick it up.

The artist keeps one sheet with a row for each date that isn't simply free:

```
date,status,updated_at
2027-06-12,taken,2026-11-02 09:12
2027-06-19,few,
```

`status` is open, few or taken; any date not listed is free. Logic in `lib/mehndi.js` (`datesFromCsv`, `dayAnswer`);
the client's sheet in `sheet-provider.js`; the demo's diary in `src/demo/dates-provider.js`.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a word it doesn't know, a bad date, or a
newest `updated_at` older than `staleAfterDays` says "We can't see the diary just now. Ask, and we'll reply with the
day." A site using the sheet allows `docs.google.com` in its security policy.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
