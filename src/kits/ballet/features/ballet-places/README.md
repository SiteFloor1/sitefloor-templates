# Places left

| | |
|---|---|
| Feature id | `ballet-places` |
| Plan | plus and above |
| Config | `places`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV), `staleAfterDays?` (default 7), `message` (WhatsApp opening) |
| Files | `ballet-places.njk`, `ballet-places.css`, `ballet-places.js`, `sheet-provider.js`; the demo's numbers in `src/demo/ballet-places-provider.js` |

## How it works
The school keeps one sheet, a row per session it wants to show:

```
class,day,time,places,updated_at
little,tue,16:00,2,2026-11-14 09:00
little,sat,10:00,full,
```

`places` is a number or "full" (0 counts as full). Under the finder's answer and on the timetable each session shows
"2 places left" or "Full: join the list", which opens a waiting-list message on WhatsApp naming the day and time. A
session not in the sheet shows nothing.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a word it doesn't know, a bad day or time, or a
newest `updated_at` older than `staleAfterDays` shows no numbers at all. A site using the sheet allows
`docs.google.com` in its security policy.
