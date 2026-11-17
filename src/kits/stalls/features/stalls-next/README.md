# The next stop (hero countdown)

| | |
|---|---|
| Feature id | `stalls-next` |
| Plan | signature |
| Config | uses `stops` (with `stalls-where`, which it needs) |

## How it works
In the hero: the next stop that isn't cancelled ("Saturday in Hackney"), its market, postcode and hours, and a
countdown ("Opens in 1d 10h 52m") that ticks once a minute; while it trades, "Here now in Hackney, until 18:00".
Choosing another stop in the week's tickets shows that one. Directions and Add to calendar as in `stalls-where`.

## When something is missing or fails
It reads the week `stalls-where` shares, so it fails the same way: an old or unreadable sheet shows the usual week,
and this block says "Usually". No usual stop at all: the stall's fallback line. First painted from the usual week on
the build day, so the hero has its final shape before any script runs.

Registered in `src/kits/stalls/kit.js`.
