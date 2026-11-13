# Spaces left (PIL-3)

| | |
|---|---|
| Feature id | `spaces-left` |
| Plan | plus and above |
| Config | `places`: `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl` (the sheet published as CSV), optional `staleAfterMinutes` (default 30) |
| Files | `spaces-left.njk` (the key), `.js`, `.css`, `sheet-provider.js`; parsing in `src/kits/pilates/lib/places.js`; demo data in `src/demo/places-provider.js` |

## The studio's sheet
One row per class, updated from the booking app as it fills:

    date,time,left,updated_at
    2026-10-30,07:00,0,2026-10-29 21:10
    2026-10-30,09:15,2,2026-10-30 07:40

## How it works
Each class in the hero and the week shows the room's reformers: filled booked, open free, with "2 left" or "Full".

## When something is missing or fails
Fails closed: a count older than `staleAfterMinutes` is ignored, a "0" included (an old "full" says nothing), as are
classes that have started, unreadable rows and an unreadable sheet. A count above the room's reformers means that class
shows nothing. The sheet must hold only these four columns: anything written in another column (a name, a phone
number) refuses the whole sheet, because the published sheet can be opened by anyone with its link. In every case the
class shows its length instead, never a guess.
