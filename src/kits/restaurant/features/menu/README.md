# The menu (home)

| | |
|---|---|
| Feature id | `menu` |
| Plan | starter and above (in the Carte look's hero) |
| Config | `menu`: `sittings` (`id`, `name`, `days`, `from`, `to`, `lastOrders?`, `mood`: `day` / `evening`), `statement` (the restaurant's own allergen statement), `chartChecked` (YYYY-MM-DD), `sections` (`id`, `name`, `note?`, `sittings`, `drinks?`, `dishes`); each dish `id`, `name`, `desc?`, `price` (pounds), `diets?` (`halal`, `vegetarian`, `vegan`), `allergens` (the 14, `[]` if none), `spice?` 0–3, `share?`, `takeaway?`, `kids?`, `pairs?`, `pass?`; `sections.menu` |
| Files | `menu.njk`, `dish.njk` (one dish, shared by the menu page), `menu.css`, `menu.js`; logic in `src/kits/restaurant/lib/sittings.js` and `filter.js`; allergens in `src/core/lib/allergens.js` |

## How it works
The card shows the sitting being served now (or the next one today) with a live kitchen line: "Dinner · kitchen open
until 9:45pm", "last orders in 20 min", "Kitchen closed · dinner from 5pm". Tabs show the other sittings; picking one
also previews its day or evening colours in the Carte look. Without JavaScript every sitting shows, one after another.

Every dish carries its diet marks, spice and **the allergens from the restaurant's own allergen chart** ("Contains:
gluten, milk" or "None of the 14 allergens"). Diet chips filter the card (a vegan dish counts as vegetarian; nothing else
is inferred) and "Allergies? Hide dishes containing…" hides dishes with any chosen allergen. The footer carries the
restaurant's statement and the date the chart was checked, and asks people to tell staff about allergies.

Today's sold-out dishes (from `specials`) are struck through with "Sold out today".

The 14 allergens and the rules for food that isn't prepacked come from the FSA's allergen guidance for food businesses
(gov.uk, checked 27 Oct 2026). The site never says a dish is safe for an allergy, and validation refuses a dish
marked vegan that lists milk, eggs, fish, crustaceans or molluscs.
