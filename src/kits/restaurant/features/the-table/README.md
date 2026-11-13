# The Table (group diet planner)

| | |
|---|---|
| Feature id | `the-table` |
| Plan | signature (add-on on any plan) |
| Config | `table`: `maxGuests`, `note?`, `start?` (guests it opens with: `{ diets?, avoid? }`); uses `menu`; needs `table-request`; `sections.theTable` |
| Files | `the-table.njk`, `the-table.css`, `the-table.js`; logic in `src/kits/restaurant/lib/group.js` |

## How it works
Guests sit around a drawn table. Tap a seat to set that guest's diets (halal, vegetarian, vegan) and the allergens
they avoid. Every dish of the chosen sitting shows a dot per guest (filled if they can eat it), "5 of 6. Not for guest 2
(not vegan)", and the dishes the whole table can eat come first, with how many are for sharing. Hovering a dish lights
up the plates of the guests who can have it.

The group is shared with the table request (guest count and a one-line summary in the message) and The Pass ("At your
table: 3 of 6 can eat this"). Only the restaurant's own marks and allergen chart are used, and the page still asks
people to tell the restaurant about every allergy when they book.
