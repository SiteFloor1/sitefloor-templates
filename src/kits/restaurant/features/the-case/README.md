# The glass case

| | |
|---|---|
| Feature id | `the-case` |
| Plan | signature (add-on on any plan) |
| Config | `counter`: `sections` (menu section ids in the case; every dish there needs a `photo`), `freshForMinutes?` (10–240, default 60), `hold?` (WhatsApp line for "put one aside"), `note?`; needs `specials` (the sheet); `sections.theCase` |
| Files | `the-case.njk`, `.css`, `.js`; states from `src/kits/restaurant/lib/counter.js` via the specials script |

## How it works
The café's bakes on round plates in a brass-framed glass case, each with an engraved card (name, price). From the
specials sheet: a bake glows warm with "Fresh out 8:10am" for `freshForMinutes` after a `fresh` row, then reads "Baked
8:10am"; a `soldout` row pales it with "Sold out" (a later `fresh` row puts it back). Tap a bake for its description,
allergens and state, and "Put one aside for me" (I'll be there in 10–60 minutes) on WhatsApp, a request the café
confirms. Photos load as the case nears the screen.

## When something is missing or fails
Without JavaScript: names, prices and allergens (no photos). If the sheet can't be read, no bake is called fresh or
sold out.
