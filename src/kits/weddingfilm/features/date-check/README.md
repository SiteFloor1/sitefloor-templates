# Is our date free? (WVID-2)

| | |
|---|---|
| Feature id | `date-check` |
| Plan | starter and above |
| Config | `dateCheck`: `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl` (the diary published as CSV), optional `staleAfterHours` (default 48), `message` (the WhatsApp opening). Heading in `sections.dateCheck` |
| Files | `date-check.njk`, `.js`, `.css`, `sheet-provider.js`; parsing in `src/kits/weddingfilm/lib/dates.js`; demo data in `src/demo/wedding-dates-provider.js` |

## The studio's sheet
One row per date the studio has taken. A date not in the sheet is free.

    date,status,updated_at
    2027-06-19,booked,2026-11-03 18:20
    2027-07-03,held,2026-11-03 18:20

`status` is `booked` or `held`; any other word counts as booked, so a typo never frees a date. Change `updated_at`
whenever you touch the sheet: after `staleAfterHours` without a change the page stops trusting it.

## How it works
The couple choose a date (and, if they have one, the venue). The page says whether it is free, held or booked and
builds a WhatsApp message with the date in UK order and the venue. Nothing is held until the studio replies, and the
page says so. With `sunset-line` (Plus) the couple also choose where, roughly, and see that day's sunset there.

## When something is missing or fails
- The sheet can't be read, has no `updated_at`, is out of date, or is stamped more than ten minutes in the future (a typo): "we can't check just now. Send it to us", never free.
- A date in the past says so. The message always goes; the studio decides.
