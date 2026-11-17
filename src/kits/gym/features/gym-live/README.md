# The live count

| | |
|---|---|
| Feature id | `gym-live` |
| Plan | signature |
| Config | `busy.live`: `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl`, optional `staleAfterMinutes` (1 to 15, default 15) |
| Files | `gym-live.js`, `sheet-provider.js`; parsing in `src/kits/gym/lib/gym.js` (`countFromCsv`); demo data in `src/demo/gym-count-provider.js` |

## The club's sheet
The door system (or the desk) writes one row each time it counts:

    updated_at,count
    2026-11-16 18:42,31

## When something is missing or fails
The newest row wins. Fails closed: a newest row older than `staleAfterMinutes`, in the future, or not a whole number
up to the club's capacity, anything written in another column, or an unreadable sheet means no live count, and the hero
says "usually" again. An older unreadable row is simply skipped.
