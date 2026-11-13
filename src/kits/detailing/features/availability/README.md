# The next start (DET2)

| | |
|---|---|
| Feature id | `availability` |
| Plan | starter |
| Config | `availability`: `source` (`"sheet"`, or `"simulated"` on a demo), `csvUrl` (the sheet's published CSV link), `staleAfterHours`, `workdays` (e.g. `["mon","tue","wed","thu","fri"]`), `message` (with `{package}` and `{date}`); `sections.availability` |
| Files | `availability.njk`, `.css`, `.js`, `sheet-provider.js`; logic in `src/kits/detailing/lib/dates.js` (`diaryFromCsv`, `nextStart`) |

## How it works
Each package row shows how many working days the car stays and the first day a run that long is free in the
studio's diary, from tomorrow on. Days the studio doesn't work are skipped; a day missing from the sheet breaks the
run. "Ask for it" opens WhatsApp with the studio's message, the package and the date. The studio confirms by reply:
the site books nothing.

## The sheet
One row per working day: `date` (YYYY-MM-DD), `status` (`free` or `booked`), `updated_at`. Publish it to the web as
CSV. A sheet nobody has touched for `staleAfterHours` is treated as unknown, and so is one that can't be read: every
row then keeps "Ask for a date". The page never offers a date it can't stand behind.
