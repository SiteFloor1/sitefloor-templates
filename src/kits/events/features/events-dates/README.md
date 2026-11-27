# events-dates (Starter)

Is your date free? (EVT-3). Pick a date: free, on hold for another client, or taken. The hero also shows the next free
Saturday (or the first of the agency's usual days, `days`), at least `leadDays` ahead (default 14).

The agency's sheet, published as CSV, lists the dates that are not free: `date, status, updated` (status `held`,
`booked` or `free`, any case; dates as 2027-06-12 or the UK 12/06/2027). Every date it doesn't list is free. It fails
closed: when no row's `updated` is within `staleAfterDays` (default 7), when any filled-in row has a date or status it
can't read (e.g. "Confirmed"), or the sheet can't be read at all, the check asks them to message rather than guess.

```json
"dates": { "source": "sheet", "csvUrl": "https://docs.google.com/spreadsheets/d/e/…/pub?output=csv", "days": ["sat"], "leadDays": 14, "staleAfterDays": 7 }
```

On the demo, `source: "simulated"` (`src/demo/event-dates-provider.js`): a believable diary worked out from the day,
Saturdays mostly taken in summer, updated yesterday.
