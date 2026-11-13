# Seat finder

| | |
|---|---|
| Feature id | `seat-finder` |
| Plan | signature (add-on on any plan) |
| Config | `seats`: `width`, `height` (plan units), `places` (`id`, `label`, `x`, `y`, `w`, `h`, `shape`: round / rect / sofa / bench / stool, `seats`, `has`: socket, window, sofa, quiet, group, dog, buggy, step-free, outside), `marks?` (`kind`: window, bar, kitchen, door, terrace, wall, pass, counter; `x`, `y`, `w`, `h`, `label?`), `note?`; `sections.seats` |
| Files | `seat-finder.njk`, `.css`, `.js`; matching in `src/kits/restaurant/lib/seats.js` |

## How it works
The café drawn at build time from its own floor plan, sockets marked. Pick what you need (only needs some seat has are
offered); the seats with all of it light up, the rest fade. Tap a seat: it's shared as "seat", so Your usual (for a
drink to have here) and the table request carry it as a preference, never a reservation. Validation refuses seats that
overlap or reach outside the plan.

## When something is missing or fails
Without JavaScript: the plan and a list of every seat with what it has.
