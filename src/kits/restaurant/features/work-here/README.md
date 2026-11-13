# Can I work here?

| | |
|---|---|
| Feature id | `work-here` |
| Plan | plus (add-on on any plan) |
| Config | `workHere`: `answers` (`topic`: wifi, sockets, laptops, dogs, kids, buggies, step-free, toilet, accessible-toilet, baby-change, outside; `answer`: yes / no / some; `note`, required for "some"), `photos?` (up to 3), `rules?`; uses `busy` when set; `sections.workHere` |
| Files | `work-here.njk`, `.css`, `.js`; laptop hours from `src/kits/restaurant/lib/busy.js` |

## How it works
A hotel-style card of the café's own answers with line icons, each yes, no or "some" with its note. With the café's
busyness numbers (`busy`), "Laptop-friendly today": the stretches of two hours or more at or below `busy.laptopMax`
(default steady), and a strip of the day with this hour marked. House rules and up to three photos beside it.

## When something is missing or fails
Without JavaScript or without `busy`, the answers and rules show alone.
