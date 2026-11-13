# Live music now

| | |
|---|---|
| Feature id | `music` |
| Plan | plus and above |
| Config | `music`: `sets` (`days`, `from`, `to`, `who`, `what`), optional `note`, optional `photo`; `sections.music` |
| Files | `music.njk`, `.css`, `.js`; logic `musicNow` in `src/kits/restaurant/lib/tearoom.js` |

## How it works
Lists the café's regular sets (the harp at tea, the piano by candlelight) and says who is playing now, or who is next
and when ("Next: the piano, tonight from 7pm"), every minute. Only the café's own times are used.

## When something is missing or fails
Without JavaScript the list of sets shows; only the "now" line needs the clock.
