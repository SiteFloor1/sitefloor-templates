# Your usual (order ahead)

| | |
|---|---|
| Feature id | `your-usual` |
| Plan | signature (add-on on any plan) |
| Config | `usual`: `message` (WhatsApp opening line), `prepMinutes` (2–30), `sizes` (`id`, `name`, `ml`), `drinks` (`id`, `name`, `prices` per size id, `milk?`, `allergens`, `pour?`, `desc?`, `diets?`), `milks` (`id`, `name`, `price`, `allergens`, `shade?` white / cream / oat / nut, `note?`, `diets?`), `defaultMilk`, `extraShot`, `maxShots` (0–4), `syrups?` (`id`, `name`, `price`, `allergens`), `decaf?` (extra in pounds, 0 if free), `ownCup?` (discount), `note?`; `sections.usual` |
| Files | `your-usual.njk`, `.css`, `.js`; logic in `src/kits/restaurant/lib/usual.js` (price, ready times, message) |

## How it works
A glass that fills as you build your coffee: the drink (each drawn its own way: `pour` is espresso, long-black, filter,
cortado, flat-white, latte, cappuccino, mocha, chai, hot-chocolate or matcha), the size (the glass grows), the milk
(its colour and its allergens), extra shots (more espresso, a little less milk), a syrup, decaf (a tag on the glass),
extra hot (steam for a few seconds) and the cup (a saucer and spoon to drink here). The price is worked out in pence
from the café's own list; the allergens are the drink's, the milk's and the syrup's from the café's chart, with the
milk's own note (e.g. "made from oats; not labelled gluten-free").

"Save as my usual" keeps the choice on the phone (localStorage, never sent anywhere; wrapped in try/catch). Next time
the section says "Welcome back" with "Order my usual", and the Counter look's hero ticket shows it. "Add to my order"
builds a tray (up to 8 drinks) with bakes from the counter (sold-out ones can't be ticked), a ready time and a name,
then sends it on WhatsApp with the total and the allergens, asking the café to confirm.

Ready times: now plus `prepMinutes`, rounded up to five minutes, until five minutes before closing. Before opening: from
opening plus prep. Closed for the day: it says when ordering opens again. Nothing is invented.

## When something is missing or fails
Without JavaScript: the full price list (sizes, milks with their allergens, shots, syrups, decaf, own cup) and a plain
WhatsApp link. A saved usual for a drink the café has dropped falls back to its first drink; a size or milk it no
longer offers falls back too.
