# Is our date free?

| | |
|---|---|
| Feature id | `cake-date-check` |
| Plan | starter and above (the Starter extra) |
| Config | `dates`: `source` (`sheet`, or `simulated` on demos only), `csvUrl` (the sheet published as CSV), `staleAfterDays`, `minDays` (the studio's shortest notice), `words` (`free`, `one`, `booked`, `soon`, `unknown`, each may use `{date}`); `sections.dateCheck` |
| Files | `cake-date-check.njk`, `.js`, `.css`, `sheet-provider.js`; logic in `src/kits/cakes/lib/cakes.js` (`datesFromCsv`, `dateStatus`) |

## The studio's sheet
Three columns: `date` (YYYY-MM-DD), `left` (cakes it can still take that day: 0 = taken) and `updated_at`. Dates not
listed are free. The studio adds a row when it takes a booking.

**Always keep at least one dated row**, and change its `updated_at` when you check the diary, even with nothing
booked: a sheet with no rows, or whose newest `updated_at` is over `staleAfterDays` old or later than today, makes
every date say "ask us". A typo like 2027 for 2026 is treated the same way, so it can't keep saying "free".

## When something is missing or fails
A sheet that can't be read, has a bad row, or hasn't been updated for `staleAfterDays` makes every date "unknown":
the studio's `words.unknown` and a message link. A date sooner than `minDays` gets `words.soon`. Without the script
the section is a message link. The site never says a date is free unless the diary says so.
