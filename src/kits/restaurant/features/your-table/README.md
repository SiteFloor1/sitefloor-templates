# Your table

| | |
|---|---|
| Feature id | `your-table` |
| Plan | signature |
| Config | `tea` (`sitting`, `tiers`: menu section ids bottom tier first, `services`, `swaps`, `library`); `stand` (`photos`: one per tier, `maxGuests`, optional `champagne`: `{ bottles, photo?, note? }`, optional `note`); `sections.yourTable` |
| Files | `your-table.njk`, `.css`, `.js`; logic in `src/kits/restaurant/lib/tearoom.js` and `group.js` |

## How it works
Afternoon tea set guest by guest. For each guest: how they take it (afternoon tea, with champagne…), their diet and
any allergies. The stand is the kitchen's own photo of each tier with its pieces; every piece that isn't right for
that guest is marked with why ("has milk", "not vegetarian") and, when the shop sets `tea.swaps`, "made differently
for this guest" (otherwise "ask us"). Each guest's name is set on a place card. The champagne table adds a bottle from the drinks list, opened and
poured at the table. An occasion adds the words for the plate (up to 28 letters), sent with the request. Everything goes with the table request as the group, so the shop gets one message: who is
coming, how each takes tea, each guest's needs and the words for the plate. Only the menu's own marks and allergen
chart are used; it never promises a swap the shop hasn't said it makes.

## Needs from the shop
The tea menu with diet marks and allergens (already on the menu), one photo per tier, the bottles for the champagne table and a photo, and
whether the kitchen makes swaps. Running cost £0.

## When something is missing or fails
Without JavaScript the stand and every piece's allergens show; the guests and the occasion need the script.
