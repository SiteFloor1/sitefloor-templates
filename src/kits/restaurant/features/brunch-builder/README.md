# Brunch builder

| | |
|---|---|
| Feature id | `brunch-builder` |
| Plan | signature (add-on on any plan) |
| Config | `brunch`: `plates` (menu dish ids, each with a `photo`), `sides` (menu dish ids), `maxPlates` (1–12), `note?`; needs `table-request`; `sections.brunch` |
| Files | `brunch-builder.njk`, `.css`, `.js`; totals in `src/kits/restaurant/lib/brunch.js` |

## How it works
A plate for each person (Plate 1, Plate 2…): choose a brunch dish from round photos and tick its sides. Prices and
allergens come from the menu (one source of truth); the running total is in pence. "Add to my table request" shares
the plates as "brunch", and the table request adds a pre-order block (each plate, the total and the allergens) to the
WhatsApp message. Use `tableRequest.sittings` to take bookings for brunch only.

## When something is missing or fails
Without JavaScript: the plates and sides with their prices and allergens.
