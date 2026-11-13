# The pâtisserie window

| | |
|---|---|
| Feature id | `the-window` |
| Plan | signature |
| Config | `window`: `sections` (menu section ids; every piece needs a `photo`), `boxes` (`id`, `name`, `count`, `price`, `link`: the shop's Stripe Payment Link at that price), `message`, `photo?` (the box, shown on the gifts page), `note?`; `sections.window` |
| Files | `the-window.njk`, `.css`, `.js`; logic in `src/kits/restaurant/lib/window.js` |

## How it works
The day's pieces photographed large, each with its price and allergens; a piece the shop marks sold out on its sheet
shows "Gone for today" and can't go in the box. Choose a box (six, twelve…) and fill it piece by piece; once it's
full, "Pay" opens the shop's own Stripe Payment Link for that box (the site never takes or sees a payment) and "Send
the box" opens WhatsApp with each piece, the day to collect and the name. A smaller box keeps only what fits.

## Needs from the shop
A photo of each piece, its price and allergens (on the menu), one Stripe Payment Link per box size. Running cost £0.

## When something is missing or fails
Without JavaScript the window and every piece's allergens show, with a WhatsApp link to order a box.
