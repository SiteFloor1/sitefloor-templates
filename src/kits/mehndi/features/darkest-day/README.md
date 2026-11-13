# Darkest on the day

| | |
|---|---|
| Feature id | `darkest-day` |
| Plan | plus and above (needs `mehndi-dates`) |
| Config | `darkest`: `daysBefore` (1–4: how many days before the wedding the artist suggests the mehndi), `when?` (e.g. "in the evening"), `text` (the artist's line on why, e.g. "The stain deepens for about two days after the paste comes off.") |

## How it works
Under the date check. When the bride picks her wedding date, the line names the day for her mehndi: "Have your
mehndi on Thursday 10 June 2027, in the evening." The artist's own reason sits beneath it. The day is worked back from
the wedding in UTC, so a clock change never moves it.

## When something is missing or fails
Without JavaScript the artist's line shows on its own. A wedding date already gone says so.

Registered in `src/kits/mehndi/kit.js`. Add to a site by listing the id in `features` in its `site.json`.
