# How busy is it now?

| | |
|---|---|
| Feature id | `busy-now` |
| Plan | signature (add-on on any plan) |
| Config | `busy`: `basis` (where the numbers come from, shown), `from` ("HH:MM", the first hour), `week` (`mon`…`sun`: a level an hour, 0 quiet, 1 steady, 2 busy, 3 queue at the door, `null` when closed), `laptopMax?`; the sheet's optional `busy` row (`busy,steady,,About a 4-minute queue,<time>`); needs `specials`; `sections.busy` |
| Files | `busy-now.njk`, `.css`, `.js`; logic in `src/kits/restaurant/lib/busy.js` |

## How it works
"Right now, from the counter": staff's own word from the sheet while it's fresher than `tonight.staleAfterMinutes`.
Otherwise "Usually, on a Wednesday at this time", from the café's own numbers (e.g. till receipts per hour), said as
usual and "not a live count". Closed: when it opens. Then "Usually quieter from 11am" and the usual week as a grid,
with today and this hour marked.

## When something is missing or fails
Without JavaScript the week grid shows alone. An hour with no number says so; nothing is guessed.
