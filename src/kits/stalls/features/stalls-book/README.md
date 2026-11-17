# Book us for your party

| | |
|---|---|
| Feature id | `stalls-book` |
| Plan | plus and above |
| Config | `party`: `source` ("sheet", or "simulated" on demos), `csvUrl`, `staleAfterDays?` (default 21), `message` (the opening line), `kinds` (["Birthday", "School fair", …]), `lead?`; `bookPage` { `title`, `intro?` }; `sections.party` |

## How it works
The Book us page: the day (answered from the stall's party sheet), what it's for, guests and postcode, sent as one
WhatsApp message the visitor sends themselves. A short version (the day and the answer) sits low on the home page.
The sheet: `date,status,updated_at` with status `taken`, `few` or `open`; a day not listed is free so far.

## When something is missing or fails
Never says "booked": a taken day says it's already promised and still lets them ask. A sheet that can't be read or
hasn't changed in `staleAfterDays` answers "We can't see the diary just now. Ask, and we'll reply with the day."
Without JavaScript the button sends the opening line.

Registered in `src/kits/stalls/kit.js`; the demo's diary in `src/demo/stalls-party-provider.js`.
