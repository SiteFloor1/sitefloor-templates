# Places left (GYM-7)

| | |
|---|---|
| Feature id | `gym-spaces` |
| Plan | signature |
| Config | `spaces`: `source` (`"sheet"`, or `"simulated"` on demos only), `csvUrl`, optional `staleAfterMinutes` (1 to 15, default 15) |
| Files | `gym-spaces.js`, `sheet-provider.js`; parsing in `src/kits/gym/lib/gym.js` (`placesFromCsv`); demo data in `src/demo/gym-places-provider.js` |

## Default: Book in the app
Most clubs book in Mindbody, Glofox or TeamUp, so every class and slot always links there. Places are shown only for a
club that keeps a sheet, and only while it is fresh.

## The club's sheet
One row per class or slot (`class` is the class id or the heat-and-cold slot id):

    date,time,class,left,updated_at
    2026-11-16,18:30,hyrox-engine,4,2026-11-16 18:05

## When something is missing or fails
Rows older than `staleAfterMinutes` (15 at most), sessions that have started, counts above the class's `size`,
anything written in another column, and an unreadable sheet all show nothing: the session keeps "Book in the app".
