# Allergens

| | |
|---|---|
| Feature id | `allergens` |
| Plan | starter and above |
| Config | `flavours.items[].allergens` (ids of the 14, from the studio's own chart; `[]` for none), optional `flavours.items[].diets`; `allergens.kitchen` (what the kitchen handles), `allergens.severe` (the studio's own answer on severe allergies), `allergens.ingredients` (how it gives the full ingredient list, e.g. with the cake for the venue); `sections.allergens` |
| Files | `allergens.njk`, `allergens.css`; the 14 allergens and the guidance link come from `src/core/lib/allergens.js` |

## Why it is on every plan
Orders placed remotely (website, WhatsApp, phone) must have allergen information available before the order and
again on delivery (FSA allergen guidance for food businesses, distance selling; checked 5 Nov 2026). A cake made to the
customer's order is not "prepacked for direct sale", so Natasha's Law labelling doesn't apply; this section is the
"before you order" part. The words are the studio's; the site never says "allergen-free" or "safe for".
