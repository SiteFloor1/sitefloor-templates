# Cafés: customer questions

What this trade's customers ask before they get in touch (kit `restaurant`). How to read it and the questions every trade gets: [`docs/CUSTOMER-QUESTIONS.md`](../../CUSTOMER-QUESTIONS.md).

## Café (restaurant kit, look `counter`)
| Question | Answered by |
|---|---|
| Are you open now, and till when? | opening hours with "open now" and closing time |
| What's on the counter today? Is it sold out? | `specials` as "On the counter" (fresh-out time and sold-out from the Sheet) |
| Do you have oat, soy or almond milk, or decaf? How much extra? | `menu` milk and extras lines; "Your usual" price matrix (Signature) |
| Can I order ahead and skip the queue? | `order` for collection (Plus); "Your usual" order ahead (Signature) |
| Can I work here: wifi, sockets, laptop hours? | "Can I work here?" (Plus) |
| Is it dog friendly? | "Can I work here?" answers; `visitInfo` |
| Do you do brunch at the weekend? Do I need to book? | `menu` brunch sitting; `table-request` where the café takes bookings |
| Do you have vegan or gluten-free bakes? What about allergens? | `menu` diets and the 14 allergens; "Please tell us about any allergy when you order" |
| Can I bring kids or a buggy? Is there step-free access and a toilet? | "Can I work here?" answers; `visitInfo` |
| Do you have a loyalty card? | `loyalty` (shared, adapted for the restaurant kit) |
| Do you sell beans to take home? | `menu` retail section; beans subscription later, once `pay-link` has merged |
| Do you deliver? | `delivery` links to the café's own delivery apps |
