# Today at nursery

| | |
|---|---|
| Feature id | `nursery-today` |
| Plan | starter and above (a small add-on) |
| Config | `today`: `source` ("sheet", or "simulated" on demos), `csvUrl` (published Google Sheet CSV) |
| Files | `nursery-today.njk`, `nursery-today.css`, `nursery-today.js`, `sheet-provider.js`; the demo's line in `src/demo/nursery-today-provider.js` |

## How it works
The nursery keeps one sheet with a row per day it wants to say something:

```
date,message
2026-12-02,Closed today: no heating. Every family has been called.
2026-12-05,Open morning in the garden, 10am to 12 noon
```

Only the row for today (UK time) shows, as one line at the top of the home page. Up to 160 characters.

## When something is missing or fails
Fails closed: no row for today, a missing column, a sheet that can't be read in 6 seconds or a line over 160
characters shows nothing. An old notice can't linger, because it is only ever shown on its own date.
