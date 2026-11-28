# Places, room by room

| | |
|---|---|
| Feature id | `nursery-places` |
| Plan | starter and above |
| Config | `rooms`: `items` (`{ id, name, ages, photo, text?, ratio? }`), `picker` (age buttons, each `{ label, room }`), `message` (WhatsApp opening), `note?`; `places`: `source` ("sheet", or "simulated" on demos), `csvUrl`, `staleAfterDays?` (default 14), `months?` (default 6) |
| Files | `nursery-places.njk`, `nursery-places.css`, `nursery-places.js`, `sheet-provider.js`; the demo's numbers in `src/demo/nursery-places-provider.js` |

## How it works
The parent taps the child's age (the nursery decides which room each button means) and sees the room and the next
month with a place. Under it every room is a line: its photo, name and ages, six months of places and "Ask about a
place", a WhatsApp message naming the room and the month. The nursery keeps one sheet:

```
room,month,places,updated_at
garden,2026-12,full,2026-11-24 09:00
garden,2027-02,1,2026-11-24 09:00
```

`places` is a whole number, or "full" (0 counts as full). The phone bar shows the chosen room's next place.

## When something is missing or fails
Fails closed: a sheet that can't be read in 6 seconds, a missing column, a room or month it doesn't know, or a word it
can't read shows no numbers at all: each room keeps "Ask about a place". Each row is judged by its own `updated_at`: a
row that is unreadable, in the future or older than `staleAfterDays` shows nothing for that month. A site using the
sheet allows `docs.google.com` in its security policy.
